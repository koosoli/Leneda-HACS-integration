"""DataUpdateCoordinator for the Leneda integration.

This module contains the coordinator that handles data fetching from the Leneda API.


The coordinator implements intelligent error handling:
- Network timeouts preserve previous values instead of showing zero
- Missing data is handled gracefully without marking sensors as unavailable
- Gas sensors are properly identified and prefixed
"""
from __future__ import annotations

import asyncio
import async_timeout
from datetime import timedelta
import logging
import json
import os
import aiohttp

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import (
    DataUpdateCoordinator,
    UpdateFailed,
)
from homeassistant.util import dt as dt_util

from .api import LenedaApiClient
from .const import (
    DOMAIN,
    OBIS_CODES,
    CONF_REFERENCE_POWER_ENTITY,
    CONF_REFERENCE_POWER_STATIC,
    CONF_METERING_POINT_1_TYPES,
    EXTRA_METER_SLOTS,
    CONF_METER_HAS_GAS,
)

_LOGGER = logging.getLogger(__name__)




class LenedaDataUpdateCoordinator(DataUpdateCoordinator):
    """A coordinator to fetch data from the Leneda API."""

    def __init__(self, hass: HomeAssistant, api_client: LenedaApiClient, metering_point_id: str, entry: dict, version: str = "unknown") -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(hours=1),
        )
        self.api_client = api_client
        self.metering_point_id = metering_point_id
        self.entry = entry
        self.version = version

        # ── Build per-purpose routing table from meter type config ──
        # Each meter can be tagged as consumption, production, gas (or any combo)
        meters = [
            (metering_point_id, entry.data.get(CONF_METERING_POINT_1_TYPES, ["consumption"])),
        ]
        for id_key, types_key in EXTRA_METER_SLOTS:
            mid = (entry.data.get(id_key) or "").strip()
            if mid:
                meters.append((mid, entry.data.get(types_key, [])))

        # Default all to primary meter, then override per type
        self.consumption_meter = metering_point_id
        self.production_meter = metering_point_id
        self.gas_meter = metering_point_id

        # Collect ALL meters of each type (for multi-production-meter summing)
        self.production_meters: list[str] = []

        for mid, types in meters:
            if "consumption" in types:
                self.consumption_meter = mid
            if "production" in types:
                self.production_meter = mid
                self.production_meters.append(mid)
            if "gas" in types:
                self.gas_meter = mid

        # Ensure at least the primary meter is in the production list
        if not self.production_meters:
            self.production_meters = [self.production_meter]
        # Keep production_meter pointing to the FIRST production meter so that
        # _meter_for_obis() returns [0] and extra tasks cover [1:].
        self.production_meter = self.production_meters[0]

        # Derive whether gas is available (new type system OR legacy meter_has_gas)
        self.has_gas = (
            any("gas" in types for _, types in meters)
            or entry.data.get(CONF_METER_HAS_GAS, False)
        )

        # Store all configured meters for frontend display
        self.meters = meters

    def _meter_for_obis(self, obis_code: str) -> str:
        """Return the correct metering point ID for a given OBIS code.

        Production codes (1-1:2.*, 1-1:4.*, 1-65:2.*) → production meter
        Gas codes (7-*) → gas meter
        Everything else → consumption meter
        """
        if obis_code.startswith("7-"):
            return self.gas_meter
        if (obis_code.startswith("1-1:2.") or
            obis_code.startswith("1-1:4.") or
            obis_code.startswith("1-65:2.")):
            return self.production_meter
        return self.consumption_meter

    def _calculate_power_overage(self, items: list[dict], ref_power_kw: float, production_items: list[dict] | None = None) -> float:
        """Calculate total kWh consumed over a reference power.

        When *production_items* is provided, solar production is subtracted
        from consumption at each 15-min interval so only the **net grid draw**
        is evaluated against the reference limit.
        """
        total_overage_kwh = 0.0
        if not items:
            return total_overage_kwh

        # Build a lookup of production kW by timestamp for O(1) access
        prod_by_ts: dict[str, float] = {}
        if production_items:
            for p in production_items:
                try:
                    prod_by_ts[p["startedAt"]] = float(p["value"])
                except (ValueError, TypeError, KeyError):
                    continue

        for item in items:
            try:
                consumption_kw = float(item["value"])
                # Subtract concurrent solar production if available
                solar_kw = prod_by_ts.get(item.get("startedAt", ""), 0.0)
                net_kw = max(0.0, consumption_kw - solar_kw)
                if net_kw > ref_power_kw:
                    # Energy for a 15-minute interval = Power (kW) * 0.25 (h)
                    overage_energy = (net_kw - ref_power_kw) * 0.25
                    total_overage_kwh += overage_energy
            except (ValueError, TypeError):
                continue  # Skip if value is not a valid number
        return round(total_overage_kwh, 4)

    async def _async_update_data(self) -> dict[str, float | None]:
        """Fetch data from the Leneda API concurrently."""
        _LOGGER.debug("--- Starting Leneda Data Update ---")
        now = dt_util.utcnow()

        try:
            async with async_timeout.timeout(30):
                # Define date ranges
                today_start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
                yesterday_start_dt = today_start_dt - timedelta(days=1)
                yesterday_end_dt = yesterday_start_dt.replace(hour=23, minute=59, second=59)

                week_start_dt = today_start_dt - timedelta(days=now.weekday())
                last_week_start_dt = week_start_dt - timedelta(weeks=1)
                last_week_end_dt = week_start_dt - timedelta(microseconds=1)

                month_start_dt = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                # If today is the 1st, ensure current month requests don't have start > end
                effective_month_end = yesterday_end_dt if yesterday_end_dt > month_start_dt else now
                
                end_of_last_month = month_start_dt - timedelta(microseconds=1)
                start_of_last_month = end_of_last_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

                CONSUMPTION_CODE = "1-1:1.29.0"
                PRODUCTION_CODE = "1-1:2.29.0"
                EXPORT_CODE = "1-65:2.29.9"
                GAS_ENERGY_CODE = "7-20:99.33.17"
                GAS_VOLUME_CODE = "7-1:99.23.15"
                GAS_STD_VOLUME_CODE = "7-1:99.23.17"

                SHARING_CODES = {
                    "s_c_l1": "1-65:1.29.1", "s_c_l2": "1-65:1.29.3", "s_c_l3": "1-65:1.29.2", "s_c_l4": "1-65:1.29.4", "s_c_rem": "1-65:1.29.9",
                    "s_p_l1": "1-65:2.29.1", "s_p_l2": "1-65:2.29.3", "s_p_l3": "1-65:2.29.2", "s_p_l4": "1-65:2.29.4", "s_p_rem": "1-65:2.29.9",
                }

                # Tasks for OBIS code data (historical data from yesterday)
                _LOGGER.debug("Setting up tasks for OBIS code data...")
                non_gas_obis_codes = {k: v for k, v in OBIS_CODES.items() if not k.startswith("7-")}
                obis_tasks = [
                    self.api_client.async_get_metering_data(
                        self._meter_for_obis(obis_code), obis_code, yesterday_start_dt, yesterday_end_dt
                    ) for obis_code in non_gas_obis_codes
                ]

                # Tasks for fetching detailed 15-min data for power-over-reference calculations
                # We fetch both consumption AND production so exceedance considers solar offset.
                power_over_ref_tasks = []
                if self.entry.data.get(CONF_REFERENCE_POWER_ENTITY) or self.entry.data.get(CONF_REFERENCE_POWER_STATIC) is not None:
                    _LOGGER.debug("Setting up tasks for monthly power over reference data...")
                    power_over_ref_tasks = [
                        # Current month consumption (so far)
                        self.api_client.async_get_metering_data(
                            self._meter_for_obis(CONSUMPTION_CODE), CONSUMPTION_CODE, month_start_dt, yesterday_end_dt
                        ),
                        # Previous month consumption
                        self.api_client.async_get_metering_data(
                            self._meter_for_obis(CONSUMPTION_CODE), CONSUMPTION_CODE, start_of_last_month, end_of_last_month
                        ),
                        # Current month production (so far) — for solar offset
                        self.api_client.async_get_metering_data(
                            self._meter_for_obis(PRODUCTION_CODE), PRODUCTION_CODE, month_start_dt, yesterday_end_dt
                        ),
                        # Previous month production — for solar offset
                        self.api_client.async_get_metering_data(
                            self._meter_for_obis(PRODUCTION_CODE), PRODUCTION_CODE, start_of_last_month, end_of_last_month
                        ),
                    ]

                # Tasks for aggregated historical data only
                _LOGGER.debug("Setting up tasks for aggregated historical data...")
                aggregated_tasks = [
                    # Yesterday
                    self.api_client.async_get_aggregated_metering_data(
                        self._meter_for_obis(CONSUMPTION_CODE), CONSUMPTION_CODE, yesterday_start_dt, yesterday_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self._meter_for_obis(PRODUCTION_CODE), PRODUCTION_CODE, yesterday_start_dt, yesterday_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self._meter_for_obis(EXPORT_CODE), EXPORT_CODE, yesterday_start_dt, yesterday_end_dt
                    ),
                    # Weekly (current week so far)
                    self.api_client.async_get_aggregated_metering_data(
                        self._meter_for_obis(CONSUMPTION_CODE), CONSUMPTION_CODE, week_start_dt, yesterday_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self._meter_for_obis(PRODUCTION_CODE), PRODUCTION_CODE, week_start_dt, yesterday_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self._meter_for_obis(EXPORT_CODE), EXPORT_CODE, week_start_dt, yesterday_end_dt
                    ),
                    # Last Week
                    self.api_client.async_get_aggregated_metering_data(
                        self._meter_for_obis(CONSUMPTION_CODE), CONSUMPTION_CODE, last_week_start_dt, last_week_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self._meter_for_obis(PRODUCTION_CODE), PRODUCTION_CODE, last_week_start_dt, last_week_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self._meter_for_obis(EXPORT_CODE), EXPORT_CODE, last_week_start_dt, last_week_end_dt
                    ),
                    # Monthly (current month so far)
                    self.api_client.async_get_aggregated_metering_data(
                        self._meter_for_obis(CONSUMPTION_CODE), CONSUMPTION_CODE, month_start_dt, effective_month_end
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self._meter_for_obis(PRODUCTION_CODE), PRODUCTION_CODE, month_start_dt, effective_month_end
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self._meter_for_obis(EXPORT_CODE), EXPORT_CODE, month_start_dt, effective_month_end
                    ),
                    # Previous Month
                    self.api_client.async_get_aggregated_metering_data(
                        self._meter_for_obis(CONSUMPTION_CODE), CONSUMPTION_CODE, start_of_last_month, end_of_last_month
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self._meter_for_obis(PRODUCTION_CODE), PRODUCTION_CODE, start_of_last_month, end_of_last_month
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self._meter_for_obis(EXPORT_CODE), EXPORT_CODE, start_of_last_month, end_of_last_month
                    ),
                ]

                # Extra tasks for additional production meters (multi-solar summing)
                extra_prod_tasks = []
                extra_prod_map = []  # maps each extra task result to its data key
                if len(self.production_meters) > 1:
                    _LOGGER.debug("Setting up extra tasks for %d additional production meters", len(self.production_meters) - 1)
                    period_ranges = [
                        (yesterday_start_dt, yesterday_end_dt, "p_04_yesterday_production", "p_09_yesterday_exported"),
                        (week_start_dt, yesterday_end_dt, "p_05_weekly_production", "p_17_weekly_exported"),
                        (last_week_start_dt, last_week_end_dt, "p_06_last_week_production", "p_10_last_week_exported"),
                        (month_start_dt, effective_month_end, "p_07_monthly_production", "p_15_monthly_exported"),
                        (start_of_last_month, end_of_last_month, "p_08_previous_month_production", "p_11_last_month_exported"),
                    ]
                    for meter_id in self.production_meters[1:]:
                        for start, end, prod_key, export_key in period_ranges:
                            extra_prod_tasks.append(self.api_client.async_get_aggregated_metering_data(
                                meter_id, PRODUCTION_CODE, start, end
                            ))
                            extra_prod_map.append(prod_key)
                            extra_prod_tasks.append(self.api_client.async_get_aggregated_metering_data(
                                meter_id, EXPORT_CODE, start, end
                            ))
                            extra_prod_map.append(export_key)

                # Tasks for fetching detailed 15-min gas data for manual aggregation
                _LOGGER.debug("Setting up tasks for detailed gas data...")
                gas_tasks = {}
                gas_definitions = {
                    "g_01_yesterday_consumption": (GAS_ENERGY_CODE, yesterday_start_dt, yesterday_end_dt),
                    "g_02_weekly_consumption": (GAS_ENERGY_CODE, week_start_dt, yesterday_end_dt),
                    "g_03_last_week_consumption": (GAS_ENERGY_CODE, last_week_start_dt, last_week_end_dt),
                    "g_04_monthly_consumption": (GAS_ENERGY_CODE, month_start_dt, yesterday_end_dt),
                    "g_05_last_month_consumption": (GAS_ENERGY_CODE, start_of_last_month, end_of_last_month),
                    "g_10_yesterday_volume": (GAS_VOLUME_CODE, yesterday_start_dt, yesterday_end_dt),
                    "g_11_weekly_volume": (GAS_VOLUME_CODE, week_start_dt, yesterday_end_dt),
                    "g_12_last_week_volume": (GAS_VOLUME_CODE, last_week_start_dt, last_week_end_dt),
                    "g_13_monthly_volume": (GAS_VOLUME_CODE, month_start_dt, yesterday_end_dt),
                    "g_14_last_month_volume": (GAS_VOLUME_CODE, start_of_last_month, end_of_last_month),
                    "g_20_yesterday_std_volume": (GAS_STD_VOLUME_CODE, yesterday_start_dt, yesterday_end_dt),
                    "g_21_weekly_std_volume": (GAS_STD_VOLUME_CODE, week_start_dt, yesterday_end_dt),
                    "g_22_last_week_std_volume": (GAS_STD_VOLUME_CODE, last_week_start_dt, last_week_end_dt),
                    "g_23_monthly_std_volume": (GAS_STD_VOLUME_CODE, month_start_dt, yesterday_end_dt),
                    "g_24_last_month_std_volume": (GAS_STD_VOLUME_CODE, start_of_last_month, end_of_last_month),
                }

                for key, (code, start, end) in gas_definitions.items():
                    gas_tasks[key] = self.api_client.async_get_metering_data(
                        self._meter_for_obis(code), code, start, end
                    )

                # Add tasks for sharing codes for last month
                for key, code in SHARING_CODES.items():
                    aggregated_tasks.append(self.api_client.async_get_aggregated_metering_data(
                        self._meter_for_obis(code), code, start_of_last_month, end_of_last_month
                    ))

                aggregated_keys = [
                    "c_04_yesterday_consumption", "p_04_yesterday_production", "p_09_yesterday_exported",
                    "c_05_weekly_consumption", "p_05_weekly_production", "p_17_weekly_exported",
                    "c_06_last_week_consumption", "p_06_last_week_production", "p_10_last_week_exported",
                    "c_07_monthly_consumption", "p_07_monthly_production", "p_15_monthly_exported",
                    "c_08_previous_month_consumption", "p_08_previous_month_production", "p_11_last_month_exported",
                ]
                gas_energy_keys = [
                    "g_01_yesterday_consumption", "g_02_weekly_consumption", "g_03_last_week_consumption",
                    "g_04_monthly_consumption", "g_05_last_month_consumption"
                ]
                gas_volume_keys = [
                    "g_10_yesterday_volume", "g_11_weekly_volume", "g_12_last_week_volume",
                    "g_13_monthly_volume", "g_14_last_month_volume"
                ]
                gas_std_volume_keys = [
                    "g_20_yesterday_std_volume", "g_21_weekly_std_volume", "g_22_last_week_std_volume",
                    "g_23_monthly_std_volume", "g_24_last_month_std_volume"
                ]
                gas_keys = gas_energy_keys + gas_volume_keys + gas_std_volume_keys

                aggregated_keys.extend([f"{key}_last_month" for key in SHARING_CODES.keys()])

                _LOGGER.debug("Gathering all API tasks...")

                # Combine all tasks into a single dictionary to handle results robustly
                all_tasks = {**gas_tasks}
                # To preserve order for slicing, we'll keep aggregated_tasks separate for now
                # In a future refactor, we could move all to a dictionary-based system

                task_list = obis_tasks + aggregated_tasks + power_over_ref_tasks + list(all_tasks.values()) + extra_prod_tasks
                results = await asyncio.gather(*task_list, return_exceptions=True)
                _LOGGER.debug("All API tasks gathered.")

                obis_results = results[:len(obis_tasks)]
                aggregated_results = results[len(obis_tasks):len(obis_tasks) + len(aggregated_tasks)]
                power_over_ref_results = results[len(obis_tasks) + len(aggregated_tasks):len(obis_tasks) + len(aggregated_tasks) + len(power_over_ref_tasks)]

                # Map results back to their keys for gas tasks
                gas_start = len(obis_tasks) + len(aggregated_tasks) + len(power_over_ref_tasks)
                gas_end = gas_start + len(all_tasks)
                gas_results_dict = dict(zip(all_tasks.keys(), results[gas_start:gas_end]))

                data = self.data.copy() if self.data else {}

                # Initialize all sensor keys with 0.0 if not present (first run)
                sensor_keys = [
                    "c_04_yesterday_consumption", "p_04_yesterday_production",
                    "c_05_weekly_consumption", "p_05_weekly_production",
                    "c_06_last_week_consumption", "p_06_last_week_production",
                    "c_07_monthly_consumption", "p_07_monthly_production",
                    "c_08_previous_month_consumption", "p_08_previous_month_production",
                ]
                
                # Set default values only on first run
                for key in sensor_keys:
                    data.setdefault(key, 0.0)
                
                # Initialize OBIS code sensors
                for obis_code in non_gas_obis_codes.keys():
                    data.setdefault(obis_code, None)

                _LOGGER.debug("Processing OBIS code results...")
                # Process OBIS code results (yesterday's data)
                for obis_code, result in zip(non_gas_obis_codes.keys(), obis_results):
                    if isinstance(result, dict) and result.get("items"):
                        _LOGGER.debug(f"Processing peak data for {obis_code}, result: {result}")
                        # Find the item with the maximum value for the day (peak)
                        peak_item = max(result["items"], key=lambda x: x["value"])
                        value = peak_item["value"]
                        data[obis_code] = value
                        data[f"{obis_code}_peak_timestamp"] = peak_item["startedAt"]
                        _LOGGER.debug(f"Peak item for {obis_code}: {peak_item}")
                    elif isinstance(result, (aiohttp.ClientError, asyncio.TimeoutError)):
                        # Network errors: preserve previous values
                        _LOGGER.error("Error fetching time-series data for %s: %s", obis_code, result)
                        # Keep existing value if available
                        if obis_code not in data:
                            data[obis_code] = None
                    elif isinstance(result, Exception):
                        _LOGGER.error("Error fetching time-series data for %s: %s", obis_code, result)
                        # Keep existing value if available
                        if obis_code not in data:
                            data[obis_code] = None
                    else:
                        # Handle empty responses (null meteringPointCode or empty items) more quietly
                        if isinstance(result, dict):
                            # Check if this is a null response (API returned None values)
                            if result.get("meteringPointCode") is None or result.get("obisCode") is None:
                                _LOGGER.debug("API returned null response for obis_code %s (likely not supported by meter)", obis_code)
                            else:
                                _LOGGER.debug("No items found for time-series data obis_code %s (no recent data available)", obis_code)
                        else:
                            _LOGGER.warning("Unexpected response type for time-series data obis_code %s: %s", obis_code, result)
                        # Keep existing value if available for empty responses
                        if obis_code not in data:
                            data[obis_code] = None

                _LOGGER.debug("Processing aggregated results...")
                # Process aggregated results
                for key, result in zip(aggregated_keys, aggregated_results):
                    if isinstance(result, dict):
                        _LOGGER.debug(f"Processing aggregated data for {key}, result: {result}")
                        series = result.get("aggregatedTimeSeries")
                        if series:
                            if key.startswith("c_02_") or key.startswith("p_02_"):  # Hourly - get latest hour
                                item = series[-1]
                                val = item.get("value")
                            else:
                                # For day/week/month/year, we sum all aggregated items (sub-sums)
                                val = sum(item.get("value", 0) for item in series if item.get("value") is not None)

                            if val is not None:
                                data[key] = val
                                _LOGGER.debug(f"Processed aggregated data for {key}: {data[key]}")
                            else:
                                if key not in data or data[key] is None:
                                    data[key] = 0.0
                                _LOGGER.debug(f"Aggregated data for {key} has no value, keeping previous value: {data.get(key)}")
                        else:
                            # Keep previous value if available, otherwise set to 0.0 for energy sensors
                            if key not in data or data[key] is None:
                                data[key] = 0.0
                            _LOGGER.debug(f"No aggregated time series for {key}, keeping previous value: {data.get(key)}")
                    elif isinstance(result, (aiohttp.ClientError, asyncio.TimeoutError)):
                        # Network errors: preserve previous values
                        _LOGGER.error("Error fetching aggregated data for %s: %s", key, result)
                        if key not in data: 
                            data[key] = None
                    elif isinstance(result, Exception):
                        _LOGGER.error("Error fetching aggregated data for %s: %s", key, result)
                        # Keep previous value if available
                        if key not in data: 
                            data[key] = 0.0

                _LOGGER.debug("Processing detailed gas results for manual aggregation...")
                # Process detailed gas results from the dictionary
                for key, result in gas_results_dict.items():
                    if isinstance(result, dict) and result.get("items"):
                        items = result["items"]
                        total_value = sum(item.get("value", 0) for item in items if item.get("value") is not None)
                        data[key] = round(total_value, 4)
                        _LOGGER.debug(f"Successfully processed gas data for {key}: {data[key]}")

                        # Also calculate peak values for yesterday's gas sensors
                        if "yesterday" in key:
                            peak_item = max(items, key=lambda x: x.get("value", 0))
                            if key == "g_01_yesterday_consumption":
                                data["7-20:99.33.17"] = peak_item.get("value")
                                data["7-20:99.33.17_peak_timestamp"] = peak_item.get("startedAt")
                            elif key == "g_10_yesterday_volume":
                                data["7-1:99.23.15"] = peak_item.get("value")
                                data["7-1:99.23.15_peak_timestamp"] = peak_item.get("startedAt")
                            elif key == "g_20_yesterday_std_volume":
                                data["7-1:99.23.17"] = peak_item.get("value")
                                data["7-1:99.23.17_peak_timestamp"] = peak_item.get("startedAt")

                    elif isinstance(result, (aiohttp.ClientError, asyncio.TimeoutError)):
                        _LOGGER.error(f"Error fetching gas data for {key}: {result}")
                        data.setdefault(key, 0.0) # Preserve old value on error
                    else:
                        _LOGGER.warning(f"No items found or error for gas data {key}: {result}")
                        data.setdefault(key, 0.0) # Set to 0 if no data


                # Sum production/export data from additional production meters
                if extra_prod_tasks:
                    extra_start = len(obis_tasks) + len(aggregated_tasks) + len(power_over_ref_tasks) + len(all_tasks)
                    extra_results = results[extra_start:]
                    for key, result in zip(extra_prod_map, extra_results):
                        if isinstance(result, dict):
                            series = result.get("aggregatedTimeSeries")
                            if series and series[0].get("value") is not None:
                                current = data.get(key, 0.0) or 0.0
                                data[key] = round(current + series[0]["value"], 4)
                                _LOGGER.debug("Added extra production meter data for %s: %s", key, data[key])
                        elif isinstance(result, Exception):
                            _LOGGER.error("Error fetching extra production data for %s: %s", key, result)

                # ─── Process Shared Energy (All Ranges) ───
                # We need to fetch and sum layers 1-4 for both Sent (Production Shared) and Received (Consumption Shared)
                # for every supported time range: Yesterday, Week, Last Week, Month, Last Month.
                
                # Helper to perform ad-hoc fetches for sharing layers (since we didn't add them to the main task list earlier to keep it clean)
                # This adds some serial overhead but keeps the logic isolated and safe.
                # Given update_interval is 1h, this is acceptable.
                
                async def _fetch_sum_sharing(meter_id, code_prefix, start, end):
                    """Fetch layers 1-4 and return the sum."""
                    layers = ["1", "2", "3", "4"]
                    tasks = [
                        self.api_client.async_get_aggregated_metering_data(
                            meter_id, f"{code_prefix}.{l}", start, end
                        ) for l in layers
                    ]
                    res = await asyncio.gather(*tasks, return_exceptions=True)
                    total = 0.0
                    for r in res:
                        if isinstance(r, dict) and r.get("aggregatedTimeSeries"):
                            total += sum(item.get("value", 0) for item in r["aggregatedTimeSeries"] if item.get("value") is not None)
                    return total

                # Consumption meter for Shared With Me
                c_meter = self._meter_for_obis("1-1:1.29.0")
                
                # Production meter(s) for Shared (Sent)
                # Note: If multiple production meters exist, we should sum them all.
                p_meters = self.production_meters

                sharing_periods = [
                    ("yesterday", yesterday_start_dt, yesterday_end_dt),
                    ("weekly", week_start_dt, yesterday_end_dt),
                    ("last_week", last_week_start_dt, last_week_end_dt),
                    ("monthly", month_start_dt, effective_month_end),
                    ("last_month", start_of_last_month, end_of_last_month),
                ]

                for p_name, p_start, p_end in sharing_periods:
                    # 1. Received (Shared With Me) - prefix 1-65:1.29
                    try:
                        received_val = await _fetch_sum_sharing(c_meter, "1-65:1.29", p_start, p_end)
                        data[f"s_received_{p_name}"] = round(received_val, 4)
                    except Exception as e:
                        _LOGGER.error(f"Error calculating Shared With Me for {p_name}: {e}")
                        data[f"s_received_{p_name}"] = 0.0

                    # 2. Sent (Shared) - prefix 1-65:2.29
                    # Sum across all production meters
                    try:
                        sent_total = 0.0
                        for pm in p_meters:
                            sent_total += await _fetch_sum_sharing(pm, "1-65:2.29", p_start, p_end)
                        data[f"s_sent_{p_name}"] = round(sent_total, 4)
                    except Exception as e:
                        _LOGGER.error(f"Error calculating Shared (Sent) for {p_name}: {e}")
                        data[f"s_sent_{p_name}"] = 0.0

                # Calculate self-consumption values
                try:
                    # Yesterday
                    prod_yesterday = data.get("p_04_yesterday_production")
                    export_yesterday = data.get("p_09_yesterday_exported")
                    if prod_yesterday is not None and export_yesterday is not None:
                        data["p_12_yesterday_self_consumed"] = round(prod_yesterday - export_yesterday, 4)

                    # Last Week
                    prod_last_week = data.get("p_06_last_week_production")
                    export_last_week = data.get("p_10_last_week_exported")
                    if prod_last_week is not None and export_last_week is not None:
                        data["p_13_last_week_self_consumed"] = round(prod_last_week - export_last_week, 4)

                    # This Week
                    prod_weekly = data.get("p_05_weekly_production")
                    export_weekly = data.get("p_17_weekly_exported")
                    if prod_weekly is not None and export_weekly is not None:
                        data["p_18_weekly_self_consumed"] = round(prod_weekly - export_weekly, 4)

                    # Current Month
                    prod_monthly = data.get("p_07_monthly_production")
                    export_monthly = data.get("p_15_monthly_exported")
                    if prod_monthly is not None and export_monthly is not None:
                        data["p_16_monthly_self_consumed"] = round(prod_monthly - export_monthly, 4)

                    # Last Month
                    prod_last_month = data.get("p_08_previous_month_production")
                    export_last_month = data.get("p_11_last_month_exported")
                    if prod_last_month is not None and export_last_month is not None:
                        data["p_14_last_month_self_consumed"] = round(prod_last_month - export_last_month, 4)
                except (TypeError, ValueError) as e:
                    _LOGGER.error("Could not calculate self-consumption values: %s", e)

                # Calculate power usage over reference
                ref_power_entity = self.entry.data.get(CONF_REFERENCE_POWER_ENTITY)
                ref_power_static = self.entry.data.get(CONF_REFERENCE_POWER_STATIC)

                if ref_power_entity or ref_power_static is not None:
                    try:
                        ref_power_kw = None
                        if ref_power_entity:
                            ref_power_state = self.hass.states.get(ref_power_entity)
                            if ref_power_state and ref_power_state.state not in ("unknown", "unavailable"):
                                ref_power_kw = float(ref_power_state.state)
                            else:
                                _LOGGER.warning(f"Reference power entity {ref_power_entity} not found or unavailable.")
                        elif ref_power_static is not None:
                            ref_power_kw = float(ref_power_static)

                        if ref_power_kw is not None:
                            # Yesterday's calculation — also fetch yesterday's production for solar offset
                            consumption_result = next((res for obis, res in zip(OBIS_CODES.keys(), obis_results) if obis == CONSUMPTION_CODE), None)
                            production_result = next((res for obis, res in zip(OBIS_CODES.keys(), obis_results) if obis == PRODUCTION_CODE), None)
                            prod_items_yesterday = production_result.get("items") if isinstance(production_result, dict) else None
                            if isinstance(consumption_result, dict) and consumption_result.get("items"):
                                overage = self._calculate_power_overage(consumption_result["items"], ref_power_kw, prod_items_yesterday)
                                data["yesterdays_power_usage_over_reference"] = overage
                                _LOGGER.debug(f"Calculated {overage:.4f} kWh over reference for yesterday (solar-adjusted).")

                            # Process results for monthly power over reference
                            # power_over_ref_results: [cur_month_cons, last_month_cons, cur_month_prod, last_month_prod]
                            if power_over_ref_results:
                                # Current month's calculation (solar-adjusted)
                                current_month_cons = power_over_ref_results[0]
                                current_month_prod = power_over_ref_results[2] if len(power_over_ref_results) > 2 else None
                                prod_items_cur = current_month_prod.get("items") if isinstance(current_month_prod, dict) else None
                                if isinstance(current_month_cons, dict) and current_month_cons.get("items"):
                                    overage = self._calculate_power_overage(current_month_cons["items"], ref_power_kw, prod_items_cur)
                                    data["current_month_power_usage_over_reference"] = overage
                                    _LOGGER.debug(f"Calculated {overage:.4f} kWh over reference for current month (solar-adjusted).")
                                elif isinstance(current_month_cons, Exception):
                                    _LOGGER.error("Error fetching current month power over reference data: %s", current_month_cons)

                                # Last month's calculation (solar-adjusted)
                                last_month_cons = power_over_ref_results[1]
                                last_month_prod = power_over_ref_results[3] if len(power_over_ref_results) > 3 else None
                                prod_items_last = last_month_prod.get("items") if isinstance(last_month_prod, dict) else None
                                if isinstance(last_month_cons, dict) and last_month_cons.get("items"):
                                    overage = self._calculate_power_overage(last_month_cons["items"], ref_power_kw, prod_items_last)
                                    data["last_month_power_usage_over_reference"] = overage
                                    _LOGGER.debug(f"Calculated {overage:.4f} kWh over reference for last month (solar-adjusted).")
                                elif isinstance(last_month_cons, Exception):
                                    _LOGGER.error("Error fetching last month power over reference data: %s", last_month_cons)
                    except (ValueError, TypeError) as e:
                        _LOGGER.error(f"Could not calculate power usage over reference: {e}")


                _LOGGER.debug("--- Leneda Data Update Finished ---")
                _LOGGER.debug("Final coordinated data: %s", data)
                return data
        except (asyncio.TimeoutError, Exception) as err:
            _LOGGER.error("Fatal error during Leneda data fetch: %s", err, exc_info=True)
            raise UpdateFailed(f"Error communicating with API: {err}") from err

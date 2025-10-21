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
)

_LOGGER = logging.getLogger(__name__)


def get_integration_version(hass: HomeAssistant) -> str:
    """Return the version of the Leneda integration."""
    try:
        manifest_path = os.path.join(os.path.dirname(__file__), "manifest.json")
        with open(manifest_path) as manifest_file:
            manifest = json.load(manifest_file)
        return manifest.get("version", "unknown")
    except (FileNotFoundError, json.JSONDecodeError):
        return "unknown"


class LenedaDataUpdateCoordinator(DataUpdateCoordinator):
    """A coordinator to fetch data from the Leneda API."""

    def __init__(self, hass: HomeAssistant, api_client: LenedaApiClient, metering_point_id: str, entry: dict) -> None:
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
        self.version = get_integration_version(hass)

    def _calculate_power_overage(self, items: list[dict], ref_power_kw: float) -> float:
        """Calculate total kWh consumed over a reference power."""
        total_overage_kwh = 0.0
        if not items:
            return total_overage_kwh

        for item in items:
            try:
                power_kw = float(item["value"])
                if power_kw > ref_power_kw:
                    # Energy for a 15-minute interval = Power (kW) * 0.25 (h)
                    overage_energy = (power_kw - ref_power_kw) * 0.25
                    total_overage_kwh += overage_energy
            except (ValueError, TypeError):
                continue # Skip if value is not a valid number
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
                        self.metering_point_id, obis_code, yesterday_start_dt, yesterday_end_dt
                    ) for obis_code in non_gas_obis_codes
                ]

                # Tasks for fetching detailed 15-min data for power-over-reference calculations
                power_over_ref_tasks = []
                if self.entry.data.get(CONF_REFERENCE_POWER_ENTITY) or self.entry.data.get(CONF_REFERENCE_POWER_STATIC) is not None:
                    _LOGGER.debug("Setting up tasks for monthly power over reference data...")
                    power_over_ref_tasks = [
                        # Current month (so far)
                        self.api_client.async_get_metering_data(
                            self.metering_point_id, CONSUMPTION_CODE, month_start_dt, yesterday_end_dt
                        ),
                        # Previous month
                        self.api_client.async_get_metering_data(
                            self.metering_point_id, CONSUMPTION_CODE, start_of_last_month, end_of_last_month
                        ),
                    ]

                # Tasks for aggregated historical data only
                _LOGGER.debug("Setting up tasks for aggregated historical data...")
                aggregated_tasks = [
                    # Yesterday
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, yesterday_start_dt, yesterday_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, yesterday_start_dt, yesterday_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, EXPORT_CODE, yesterday_start_dt, yesterday_end_dt
                    ),
                    # Weekly (current week so far)
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, week_start_dt, yesterday_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, week_start_dt, yesterday_end_dt
                    ),
                    # Last Week
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, last_week_start_dt, last_week_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, last_week_start_dt, last_week_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, EXPORT_CODE, last_week_start_dt, last_week_end_dt
                    ),
                    # Monthly (current month so far)
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, month_start_dt, yesterday_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, month_start_dt, yesterday_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, EXPORT_CODE, month_start_dt, yesterday_end_dt
                    ),
                    # Previous Month
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, start_of_last_month, end_of_last_month
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, start_of_last_month, end_of_last_month
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, EXPORT_CODE, start_of_last_month, end_of_last_month
                    ),
                ]
                
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
                        self.metering_point_id, code, start, end
                    )

                # Add tasks for sharing codes for last month
                for key, code in SHARING_CODES.items():
                    aggregated_tasks.append(self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, code, start_of_last_month, end_of_last_month
                    ))

                aggregated_keys = [
                    "c_04_yesterday_consumption", "p_04_yesterday_production", "p_09_yesterday_exported",
                    "c_05_weekly_consumption", "p_05_weekly_production",
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

                task_list = obis_tasks + aggregated_tasks + power_over_ref_tasks + list(all_tasks.values())
                results = await asyncio.gather(*task_list, return_exceptions=True)
                _LOGGER.debug("All API tasks gathered.")

                obis_results = results[:len(obis_tasks)]
                aggregated_results = results[len(obis_tasks):len(obis_tasks) + len(aggregated_tasks)]
                power_over_ref_results = results[len(obis_tasks) + len(aggregated_tasks):len(obis_tasks) + len(aggregated_tasks) + len(power_over_ref_tasks)]

                # Map results back to their keys for gas tasks
                gas_results_dict = dict(zip(all_tasks.keys(), results[len(obis_tasks) + len(aggregated_tasks) + len(power_over_ref_tasks):]))

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
                            item = series[0]
                            if key.startswith("c_02_") or key.startswith("p_02_"):  # Hourly - get latest hour
                                item = series[-1]

                            if item and item.get("value") is not None:
                                data[key] = item["value"]
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
                            # Yesterday's calculation
                            consumption_result = next((res for obis, res in zip(OBIS_CODES.keys(), obis_results) if obis == CONSUMPTION_CODE), None)
                            if isinstance(consumption_result, dict) and consumption_result.get("items"):
                                overage = self._calculate_power_overage(consumption_result["items"], ref_power_kw)
                                data["yesterdays_power_usage_over_reference"] = overage
                                _LOGGER.debug(f"Calculated {overage:.4f} kWh over reference for yesterday.")

                            # Process results for monthly power over reference
                            if power_over_ref_results:
                                # Current month's calculation
                                current_month_result = power_over_ref_results[0]
                                if isinstance(current_month_result, dict) and current_month_result.get("items"):
                                    overage = self._calculate_power_overage(current_month_result["items"], ref_power_kw)
                                    data["current_month_power_usage_over_reference"] = overage
                                    _LOGGER.debug(f"Calculated {overage:.4f} kWh over reference for current month.")
                                elif isinstance(current_month_result, Exception):
                                    _LOGGER.error("Error fetching current month power over reference data: %s", current_month_result)

                                # Last month's calculation
                                last_month_result = power_over_ref_results[1]
                                if isinstance(last_month_result, dict) and last_month_result.get("items"):
                                    overage = self._calculate_power_overage(last_month_result["items"], ref_power_kw)
                                    data["last_month_power_usage_over_reference"] = overage
                                    _LOGGER.debug(f"Calculated {overage:.4f} kWh over reference for last month.")
                                elif isinstance(last_month_result, Exception):
                                    _LOGGER.error("Error fetching last month power over reference data: %s", last_month_result)
                    except (ValueError, TypeError) as e:
                        _LOGGER.error(f"Could not calculate power usage over reference: {e}")


                _LOGGER.debug("--- Leneda Data Update Finished ---")
                _LOGGER.debug("Final coordinated data: %s", data)
                return data
        except (asyncio.TimeoutError, Exception) as err:
            _LOGGER.error("Fatal error during Leneda data fetch: %s", err, exc_info=True)
            raise UpdateFailed(f"Error communicating with API: {err}") from err

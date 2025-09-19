"""DataUpdateCoordinator for the Leneda integration."""
from __future__ import annotations
from typing import Any

import asyncio
import async_timeout
from datetime import timedelta
import logging

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import (
    DataUpdateCoordinator,
    UpdateFailed,
)
from homeassistant.util import dt as dt_util

from .api import LenedaApiClient
from .const import (
    DOMAIN,
    METER_TYPE_ELECTRICITY,
    METER_TYPE_GAS,
    ELECTRICITY_OBIS_CODES,
    GAS_OBIS_CODES,
)

_LOGGER = logging.getLogger(__name__)


class LenedaDataUpdateCoordinator(DataUpdateCoordinator):
    """A coordinator to fetch data from the Leneda API."""

    def __init__(
        self,
        hass: HomeAssistant,
        api_client: LenedaApiClient,
        metering_point_id: str,
        meter_types: list[str],
    ) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            name=f"{DOMAIN}_{metering_point_id}",
            update_interval=timedelta(minutes=15),
        )
        self.api_client = api_client
        self.metering_point_id = metering_point_id
        self.meter_types = meter_types

        # Build the list of all OBIS codes to fetch based on supported meter types
        self.obis_codes_to_fetch: dict[str, Any] = {}
        if METER_TYPE_ELECTRICITY in self.meter_types:
            self.obis_codes_to_fetch.update(ELECTRICITY_OBIS_CODES)
        if METER_TYPE_GAS in self.meter_types:
            self.obis_codes_to_fetch.update(GAS_OBIS_CODES)

        _LOGGER.info(
            "Leneda coordinator initialized for meter %s with types %s, fetching %d OBIS codes",
            self.metering_point_id,
            self.meter_types,
            len(self.obis_codes_to_fetch),
        )


    async def _async_update_data(self) -> dict[str, float | None]:
        """Fetch data from the Leneda API concurrently."""
        _LOGGER.debug("--- Starting Leneda Data Update for %s ---", self.metering_point_id)
        now = dt_util.utcnow()

        try:
            async with async_timeout.timeout(30):
                # Define date ranges used across multiple API calls
                today_start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
                live_data_start_dt = now - timedelta(minutes=60) # Fetch last 60 mins for live data

                # --- Tasks for live power data (all relevant OBIS codes) ---
                # This fetches the latest instantaneous values for all supported meter types.
                _LOGGER.debug("Setting up tasks for live data for meter %s", self.metering_point_id)
                live_data_tasks = [
                    self.api_client.async_get_metering_data(
                        self.metering_point_id, obis_code, live_data_start_dt, now
                    ) for obis_code in self.obis_codes_to_fetch
                ]

                all_tasks = live_data_tasks
                quarter_hour_tasks = []
                aggregated_tasks = []

                # --- Electricity-specific tasks ---
                # These tasks for aggregated energy (kWh) are only relevant for electricity meters.
                if METER_TYPE_ELECTRICITY in self.meter_types:
                    _LOGGER.debug("Meter %s supports electricity, adding electricity-specific tasks", self.metering_point_id)

                    # Define date ranges for electricity-specific aggregated tasks
                    month_start_dt = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    week_start_dt = today_start_dt - timedelta(days=now.weekday())
                    yesterday_start_dt = today_start_dt - timedelta(days=1)
                    yesterday_end_dt = today_start_dt - timedelta(microseconds=1)
                    last_week_start_dt = week_start_dt - timedelta(weeks=1)
                    last_week_end_dt = week_start_dt - timedelta(microseconds=1)
                    first_day_of_current_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    end_of_last_month = first_day_of_current_month - timedelta(microseconds=1)
                    start_of_last_month = end_of_last_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

                    CONSUMPTION_CODE = "1-1:1.29.0"
                    PRODUCTION_CODE = "1-1:2.29.0"

                    # Tasks for 15-minute raw data (for energy calculation)
                    _LOGGER.debug("Setting up tasks for 15-minute raw data...")
                    quarter_hour_start_dt = now - timedelta(minutes=15)
                    quarter_hour_tasks = [
                        self.api_client.async_get_metering_data(
                            self.metering_point_id, CONSUMPTION_CODE, quarter_hour_start_dt, now
                        ),
                        self.api_client.async_get_metering_data(
                            self.metering_point_id, PRODUCTION_CODE, quarter_hour_start_dt, now
                        ),
                    ]

                    # Tasks for aggregated data (daily, weekly, monthly, etc.)
                    _LOGGER.debug("Setting up tasks for aggregated data...")
                    aggregated_tasks = [
                        # Hourly (Current hour)
                        self.api_client.async_get_aggregated_metering_data(self.metering_point_id, CONSUMPTION_CODE, today_start_dt, now, "Hour"),
                        self.api_client.async_get_aggregated_metering_data(self.metering_point_id, PRODUCTION_CODE, today_start_dt, now, "Hour"),
                        # Daily
                        self.api_client.async_get_aggregated_metering_data(self.metering_point_id, CONSUMPTION_CODE, today_start_dt, now),
                        self.api_client.async_get_aggregated_metering_data(self.metering_point_id, PRODUCTION_CODE, today_start_dt, now),
                        # Weekly
                        self.api_client.async_get_aggregated_metering_data(self.metering_point_id, CONSUMPTION_CODE, week_start_dt, now),
                        self.api_client.async_get_aggregated_metering_data(self.metering_point_id, PRODUCTION_CODE, week_start_dt, now),
                        # Monthly
                        self.api_client.async_get_aggregated_metering_data(self.metering_point_id, CONSUMPTION_CODE, month_start_dt, now),
                        self.api_client.async_get_aggregated_metering_data(self.metering_point_id, PRODUCTION_CODE, month_start_dt, now),
                        # Yesterday
                        self.api_client.async_get_aggregated_metering_data(self.metering_point_id, CONSUMPTION_CODE, yesterday_start_dt, yesterday_end_dt),
                        self.api_client.async_get_aggregated_metering_data(self.metering_point_id, PRODUCTION_CODE, yesterday_start_dt, yesterday_end_dt),
                        # Last Week
                        self.api_client.async_get_aggregated_metering_data(self.metering_point_id, CONSUMPTION_CODE, last_week_start_dt, last_week_end_dt),
                        self.api_client.async_get_aggregated_metering_data(self.metering_point_id, PRODUCTION_CODE, last_week_start_dt, last_week_end_dt),
                        # Previous Month
                        self.api_client.async_get_aggregated_metering_data(self.metering_point_id, CONSUMPTION_CODE, start_of_last_month, end_of_last_month),
                        self.api_client.async_get_aggregated_metering_data(self.metering_point_id, PRODUCTION_CODE, start_of_last_month, end_of_last_month),
                    ]
                    all_tasks.extend(quarter_hour_tasks)
                    all_tasks.extend(aggregated_tasks)

                _LOGGER.debug("Gathering all %d API tasks for meter %s", len(all_tasks), self.metering_point_id)
                results = await asyncio.gather(*all_tasks, return_exceptions=True)
                _LOGGER.debug("All API tasks gathered.")

                # Split the results back into their respective categories
                live_power_results = results[:len(live_data_tasks)]
                quarter_hour_results = results[len(live_data_tasks):len(live_data_tasks) + len(quarter_hour_tasks)]
                aggregated_results = results[len(live_data_tasks) + len(quarter_hour_tasks):]

                data = self.data.copy() if self.data else {}

                # Process the results for live data
                _LOGGER.debug("Processing live data results...")
                for obis_code, result in zip(self.obis_codes_to_fetch.keys(), live_power_results):
                    if isinstance(result, dict) and result.get("items"):
                        latest_item = max(result["items"], key=lambda x: dt_util.parse_datetime(x["startedAt"]))
                        data[obis_code] = latest_item["value"]
                        data[f"{obis_code}_data_timestamp"] = latest_item["startedAt"]
                    elif isinstance(result, Exception):
                        _LOGGER.error("Error fetching live data for %s: %s", obis_code, result)
                    else:
                        _LOGGER.warning("No items found for live data obis_code %s. Response: %s", obis_code, result)

                # --- Process Electricity-specific results ---
                if METER_TYPE_ELECTRICITY in self.meter_types:
                    quarter_hour_keys = ["c_01_quarter_hourly_consumption", "p_01_quarter_hourly_production"]
                    aggregated_keys = [
                        "c_02_hourly_consumption", "p_02_hourly_production",
                        "c_03_daily_consumption", "p_03_daily_production",
                        "c_05_weekly_consumption", "p_05_weekly_production",
                        "c_07_monthly_consumption", "p_07_monthly_production",
                        "c_04_yesterday_consumption", "p_04_yesterday_production",
                        "c_06_last_week_consumption", "p_06_last_week_production",
                        "c_08_previous_month_consumption", "p_08_previous_month_production",
                    ]

                    # Process 15-minute results (convert kW to kWh)
                    _LOGGER.debug("Processing 15-minute results...")
                    quarter_hour_codes = [CONSUMPTION_CODE, PRODUCTION_CODE]
                    for key, code, result in zip(quarter_hour_keys, quarter_hour_codes, quarter_hour_results):
                        if isinstance(result, dict) and result.get("items"):
                            total_kwh = sum(item["value"] * 0.25 for item in result["items"])
                            data[key] = total_kwh
                        elif isinstance(result, Exception):
                            _LOGGER.error("Error fetching 15-minute data for %s: %s", key, result)
                        else:
                            _LOGGER.warning("No items found for 15-minute data %s. Response: %s", key, result)

                    # Process aggregated results
                    _LOGGER.debug("Processing aggregated results...")
                    for key, result in zip(aggregated_keys, aggregated_results):
                        if isinstance(result, dict):
                            series = result.get("aggregatedTimeSeries")
                            if series:
                                value = series[-1].get("value") if key.startswith(("c_02_", "p_02_")) else series[0].get("value")
                                if value is not None:
                                    data[key] = value
                                else:
                                    _LOGGER.warning(f"Aggregated data for {key} is null, retaining previous value.")
                            else:
                                _LOGGER.warning(f"No aggregated time series for {key}, retaining previous value.")
                        elif isinstance(result, Exception):
                            _LOGGER.error("Error fetching aggregated data for %s: %s", key, result)
                        else:
                            _LOGGER.warning("Unexpected result type for aggregated data %s. Response: %s", key, result)

                _LOGGER.debug("--- Leneda Data Update Finished for %s ---", self.metering_point_id)
                return data
        except (asyncio.TimeoutError, Exception) as err:
            _LOGGER.error("Fatal error during Leneda data fetch for %s: %s", self.metering_point_id, err, exc_info=True)
            raise UpdateFailed(f"Error communicating with API: {err}") from err

"""DataUpdateCoordinator for the Leneda integration."""
from __future__ import annotations

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
from .const import DOMAIN, OBIS_CODES

_LOGGER = logging.getLogger(__name__)


class LenedaDataUpdateCoordinator(DataUpdateCoordinator):
    """A coordinator to fetch data from the Leneda API."""

    def __init__(self, hass: HomeAssistant, api_client: LenedaApiClient, metering_point_id: str) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(minutes=15),
        )
        self.api_client = api_client
        self.metering_point_id = metering_point_id

    async def _async_update_data(self) -> dict[str, float | None]:
        """Fetch data from the Leneda API concurrently."""
        _LOGGER.debug("--- Starting Leneda Data Update ---")
        now = dt_util.utcnow()

        try:
            async with async_timeout.timeout(30):
                # Define date ranges
                today_start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
                live_data_start_dt = now - timedelta(minutes=60) # Fetch last 60 mins for live data
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

                # Tasks for live power data (OBIS codes)
                _LOGGER.debug("Setting up tasks for live power data...")
                live_power_tasks = [
                    self.api_client.async_get_metering_data(
                        self.metering_point_id, obis_code, live_data_start_dt, now
                    ) for obis_code in OBIS_CODES
                ]

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

                # Tasks for aggregated data
                _LOGGER.debug("Setting up tasks for aggregated data...")
                aggregated_tasks = [
                    # Hourly (Current hour)
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, today_start_dt, now, aggregation_level="Hour"
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, today_start_dt, now, aggregation_level="Hour"
                    ),
                    # Daily
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, today_start_dt, now
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, today_start_dt, now
                    ),
                    # Weekly
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, week_start_dt, now
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, week_start_dt, now
                    ),
                    # Monthly
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, month_start_dt, now
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, month_start_dt, now
                    ),
                    # Yesterday
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, yesterday_start_dt, yesterday_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, yesterday_start_dt, yesterday_end_dt
                    ),
                    # Last Week
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, last_week_start_dt, last_week_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, last_week_start_dt, last_week_end_dt
                    ),
                    # Previous Month
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, start_of_last_month, end_of_last_month
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, start_of_last_month, end_of_last_month
                    ),
                ]
                quarter_hour_keys = [
                    "c_01_quarter_hourly_consumption", "p_01_quarter_hourly_production"
                ]
                
                aggregated_keys = [
                    "c_02_hourly_consumption", "p_02_hourly_production",
                    "c_03_daily_consumption", "p_03_daily_production",
                    "c_05_weekly_consumption", "p_05_weekly_production",
                    "c_07_monthly_consumption", "p_07_monthly_production",
                    "c_04_yesterday_consumption", "p_04_yesterday_production",
                    "c_06_last_week_consumption", "p_06_last_week_production",
                    "c_08_previous_month_consumption", "p_08_previous_month_production",
                ]

                _LOGGER.debug("Gathering all API tasks...")
                all_tasks = live_power_tasks + quarter_hour_tasks + aggregated_tasks
                results = await asyncio.gather(*all_tasks, return_exceptions=True)
                _LOGGER.debug("All API tasks gathered.")

                live_power_results = results[:len(live_power_tasks)]
                quarter_hour_results = results[len(live_power_tasks):len(live_power_tasks) + len(quarter_hour_tasks)]
                aggregated_results = results[len(live_power_tasks) + len(quarter_hour_tasks):]

                data = self.data.copy() if self.data else {}

                # Ensure keys exist before processing, setting a default
                data.setdefault("c_01_quarter_hourly_consumption", 0.0)
                data.setdefault("p_01_quarter_hourly_production", 0.0)

                _LOGGER.debug("Processing live power results...")
                # Process live power results
                for obis_code, result in zip(OBIS_CODES.keys(), live_power_results):
                    if isinstance(result, dict) and result.get("items"):
                        _LOGGER.debug(f"Processing live data for {obis_code}, result: {result}")
                        latest_item = max(result["items"], key=lambda x: dt_util.parse_datetime(x["startedAt"]))
                        value = latest_item["value"]
                        data[obis_code] = value
                        data[f"{obis_code}_data_timestamp"] = latest_item["startedAt"]
                        _LOGGER.debug(f"Latest item for {obis_code}: {latest_item}")
                    elif isinstance(result, Exception):
                        _LOGGER.error("Error fetching live data for %s: %s", obis_code, result)
                    else:
                        _LOGGER.warning("No items found for live data obis_code %s. Response: %s", obis_code, result)

                _LOGGER.debug("Processing 15-minute results...")
                # Process 15-minute results for energy calculation (kW * 0.25h = kWh)
                quarter_hour_codes = [CONSUMPTION_CODE, PRODUCTION_CODE]
                for key, code, result in zip(quarter_hour_keys, quarter_hour_codes, quarter_hour_results):
                    if isinstance(result, dict) and result.get("items"):
                        _LOGGER.debug(f"Processing 15-min data for {key}, result: {result}")
                        # Sum all 15-minute intervals and convert to kWh
                        total_kwh = sum(item["value"] * 0.25 for item in result["items"])
                        data[key] = total_kwh
                        _LOGGER.debug(f"15-minute energy for {key}: {total_kwh} kWh")
                    elif isinstance(result, Exception):
                        _LOGGER.error("Error fetching 15-minute data for %s: %s", key, result)
                        data[key] = 0.0
                    else:
                        _LOGGER.warning("No items found for 15-minute data %s. Response: %s", key, result)
                        data[key] = 0.0


                _LOGGER.debug("Processing aggregated results...")
                # Process aggregated results
                for key, result in zip(aggregated_keys, aggregated_results):
                    if isinstance(result, dict):
                        _LOGGER.debug(f"Processing aggregated data for {key}, result: {result}")
                        series = result.get("aggregatedTimeSeries")
                        if series:
                            if key.startswith("c_02_") or key.startswith("p_02_"): # Hourly
                                data[key] = series[-1].get("value") if series else 0.0
                                _LOGGER.debug(f"Processed hourly data for {key}: {data[key]}")
                            else: # Other aggregated
                                data[key] = series[0].get("value") if series else 0.0
                                _LOGGER.debug(f"Processed aggregated data for {key}: {data[key]}")
                        else:
                            data[key] = 0.0
                            _LOGGER.debug(f"No aggregated time series for {key}, setting value to 0.0")
                    elif isinstance(result, Exception):
                        _LOGGER.error("Error fetching aggregated data for %s: %s", key, result)
                        if key not in data: data[key] = None
                    else:
                        _LOGGER.warning("Unexpected result type for aggregated data %s. Response: %s", key, result)
                        if key not in data: data[key] = None

                _LOGGER.debug("--- Leneda Data Update Finished ---")
                _LOGGER.debug("Final coordinated data: %s", data)
                return data
        except (asyncio.TimeoutError, Exception) as err:
            _LOGGER.error("Fatal error during Leneda data fetch: %s", err, exc_info=True)
            raise UpdateFailed(f"Error communicating with API: {err}") from err

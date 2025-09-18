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
        _LOGGER.debug("Fetching data from Leneda API")
        now = dt_util.utcnow()
        end_date = now
        today_start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_date = today_start_dt  # Fetch data from the beginning of the day

        try:
            async with async_timeout.timeout(30):
                # Define date ranges for aggregated data
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

                # Tasks for live power data
                live_power_tasks = [
                    self.api_client.async_get_metering_data(
                        self.metering_point_id, obis_code, start_date, end_date
                    ) for obis_code in OBIS_CODES
                ]

                # Tasks for aggregated data
                # Tasks for aggregated data
                aggregated_tasks = [
                    # Monthly
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, month_start_dt, now
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, month_start_dt, now
                    ),
                    # Weekly
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, week_start_dt, now
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, week_start_dt, now
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
                aggregated_keys = [
                    "c_07_monthly_consumption", "p_07_monthly_production",
                    "c_05_weekly_consumption", "p_05_weekly_production",
                    "c_04_yesterday_consumption", "p_04_yesterday_production",
                    "c_06_last_week_consumption", "p_06_last_week_production",
                    "c_08_previous_month_consumption", "p_08_previous_month_production",
                ]

                all_tasks = live_power_tasks + aggregated_tasks
                results = await asyncio.gather(*all_tasks, return_exceptions=True)

                live_power_results = results[:len(live_power_tasks)]
                aggregated_results = results[len(live_power_tasks):]

                data = self.data.copy() if self.data else {}

                # Process live power results
                for obis_code, result in zip(OBIS_CODES.keys(), live_power_results):
                    if isinstance(result, dict) and result.get("items"):
                        latest_item = max(result["items"], key=lambda x: x["startedAt"])
                        value = latest_item["value"]
                        data[obis_code] = value
                        data[f"{obis_code}_data_timestamp"] = latest_item["startedAt"]

                        # Calculations for main consumption and production sensors
                        if obis_code == CONSUMPTION_CODE or obis_code == PRODUCTION_CODE:
                            # 15-Minute Energy
                            energy_kwh = value * 0.25  # 15 minutes = 0.25 hours

                            # Daily total from all items
                            daily_total_kwh = sum(item["value"] * 0.25 for item in result["items"])

                            # Hourly total for the last completed hour
                            last_hour_start = now.replace(minute=0, second=0, microsecond=0) - timedelta(hours=1)
                            last_hour_end = now.replace(minute=0, second=0, microsecond=0)

                            hourly_items = [
                                item for item in result["items"]
                                if last_hour_start <= dt_util.parse_datetime(item["startedAt"]) < last_hour_end
                            ]
                            hourly_total_kwh = sum(item["value"] * 0.25 for item in hourly_items)

                            if obis_code == CONSUMPTION_CODE:
                                data["c_01_quarter_hourly_consumption"] = energy_kwh
                                data["c_03_daily_consumption"] = daily_total_kwh
                                data["c_02_hourly_consumption"] = hourly_total_kwh
                            else: # PRODUCTION_CODE
                                data["p_01_quarter_hourly_production"] = energy_kwh
                                data["p_03_daily_production"] = daily_total_kwh
                                data["p_02_hourly_production"] = hourly_total_kwh
                    elif isinstance(result, Exception):
                        _LOGGER.warning("Error fetching live data for %s: %s. Keeping last known value.", obis_code, result)

                # Process aggregated results
                for key, result in zip(aggregated_keys, aggregated_results):
                    if isinstance(result, dict):
                        # Successful API call
                        series = result.get("aggregatedTimeSeries")
                        if series and "value" in series[0]:
                            data[key] = series[0]["value"]
                        else:
                            # Successful call, but no data returned. This means 0 energy.
                            data[key] = 0.0
                    elif isinstance(result, Exception):
                        # Failed API call
                        _LOGGER.warning(
                            "Error fetching aggregated data for %s: %s", key, result
                        )
                        if key not in data:
                            data[key] = None  # Set to None on first run if error
                    else:
                        # Unexpected result type, treat as error
                        if key not in data:
                            data[key] = None


                # Ensure quarter-hourly keys exist, even if there was no live data
                if "c_01_quarter_hourly_consumption" not in data:
                    data["c_01_quarter_hourly_consumption"] = None
                if "p_01_quarter_hourly_production" not in data:
                    data["p_01_quarter_hourly_production"] = None

                return data
        except (asyncio.TimeoutError, Exception) as err:
            _LOGGER.error("Error fetching Leneda data: %s", err)
            raise UpdateFailed(f"Error communicating with API: {err}") from err

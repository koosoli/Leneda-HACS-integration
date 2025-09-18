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
        # Use a 1-hour window for live data
        start_date = now - timedelta(hours=1)
        end_date = now

        try:
            async with async_timeout.timeout(30):
                # Define date ranges for aggregated data
                today_start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
                month_start_dt = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

                CONSUMPTION_CODE = "1-1:1.29.0"
                PRODUCTION_CODE = "1-1:2.29.0"

                # Tasks for live power data
                live_power_tasks = [
                    self.api_client.async_get_metering_data(
                        self.metering_point_id, obis_code, start_date, end_date
                    ) for obis_code in OBIS_CODES
                ]

                # Tasks for aggregated data
                aggregated_tasks = [
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, today_start_dt, now
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, month_start_dt, now
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, today_start_dt, now
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, month_start_dt, now
                    ),
                ]
                aggregated_keys = ["daily_consumption", "monthly_consumption", "daily_production", "monthly_production"]

                all_tasks = live_power_tasks + aggregated_tasks
                results = await asyncio.gather(*all_tasks, return_exceptions=True)

                live_power_results = results[:len(live_power_tasks)]
                aggregated_results = results[len(live_power_tasks):]

                data = self.data.copy() if self.data else {}

                # Process live power results
                for obis_code, result in zip(OBIS_CODES.keys(), live_power_results):
                    if isinstance(result, dict) and result.get("items"):
                        latest_item = max(result["items"], key=lambda x: x["startedAt"])
                        data[obis_code] = latest_item["value"]
                        data[f"{obis_code}_data_timestamp"] = latest_item["startedAt"]
                    else:
                        if isinstance(result, Exception):
                            _LOGGER.warning("Error fetching live data for %s: %s.", obis_code, result)
                        if obis_code not in data: data[obis_code] = None
                        if f"{obis_code}_data_timestamp" not in data: data[f"{obis_code}_data_timestamp"] = None

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

                return data
        except (asyncio.TimeoutError, Exception) as err:
            _LOGGER.error("Error fetching Leneda data: %s", err)
            raise UpdateFailed(f"Error communicating with API: {err}") from err

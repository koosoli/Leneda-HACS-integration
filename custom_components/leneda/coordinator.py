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
        # Use a 1-hour window to ensure we get the latest data.
        start_date = now - timedelta(hours=1)
        end_date = now

        try:
            async with async_timeout.timeout(30):
                tasks = [
                    self.api_client.async_get_metering_data(
                        self.metering_point_id, obis_code, start_date, end_date
                    )
                    for obis_code in OBIS_CODES
                ]
                results = await asyncio.gather(*tasks, return_exceptions=True)

                data = {}
                for obis_code, result in zip(OBIS_CODES.keys(), results):
                    if isinstance(result, Exception):
                        _LOGGER.warning(
                            "Error fetching data for OBIS code %s: %s",
                            obis_code,
                            result,
                        )
                        data[obis_code] = None
                    elif result and result.get("items"):
                        items = result["items"]
                        if items:
                            latest_item = max(items, key=lambda x: x["startedAt"])
                            data[obis_code] = latest_item["value"]
                            data[f"{obis_code}_data_timestamp"] = latest_item["startedAt"]
                        else:
                            data[obis_code] = None
                    else:
                        data[obis_code] = None
                return data
        except asyncio.TimeoutError as err:
            _LOGGER.error("Timeout fetching Leneda data: %s", err)
            raise UpdateFailed(f"Timeout communicating with API: {err}") from err
        except Exception as err:
            _LOGGER.error("Error fetching Leneda data: %s", err)
            raise UpdateFailed(f"Error communicating with API: {err}") from err

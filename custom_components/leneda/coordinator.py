"""DataUpdateCoordinator for the Leneda integration."""
from __future__ import annotations

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

    async def _async_update_data(self) -> dict[str, float]:
        """Fetch data from the Leneda API."""
        _LOGGER.debug("Fetching data from Leneda API")
        now = dt_util.utcnow()
        # Use a 25-hour window to ensure we get data even if it's not recent
        start_date = now - timedelta(hours=25)
        end_date = now

        try:
            # Using async_timeout is a good practice for API calls
            async with async_timeout.timeout(30):
                data = {}
                for obis_code in OBIS_CODES:
                    api_data = await self.api_client.async_get_metering_data(
                        self.metering_point_id, obis_code, start_date, end_date
                    )
                    if api_data and api_data.get("items"):
                        data[obis_code] = api_data["items"][-1]["value"]
                    else:
                        data[obis_code] = None
                return data
        except Exception as err:
            _LOGGER.error("Error fetching Leneda data: %s", err)
            raise UpdateFailed(f"Error communicating with API: {err}") from err

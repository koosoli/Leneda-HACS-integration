"""API client for the Leneda API."""
from datetime import datetime, timedelta
import aiohttp
from homeassistant.util import dt as dt_util

from .const import API_BASE_URL, OBIS_CODES


class LenedaApiClient:
    """A simple API client for the Leneda API."""

    def __init__(self, session: aiohttp.ClientSession, api_key: str, energy_id: str):
        """Initialize the API client."""
        self._session = session
        self._api_key = api_key
        self._energy_id = energy_id

    async def async_get_metering_data(
        self,
        metering_point_id: str,
        obis_code: str,
        start_date: datetime,
        end_date: datetime,
    ) -> dict:
        """Fetch metering data from the Leneda API."""
        headers = {"X-API-KEY": self._api_key, "X-ENERGY-ID": self._energy_id}
        params = {
            "startDateTime": start_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "endDateTime": end_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "obisCode": obis_code,
        }
        url = f"{API_BASE_URL}/api/metering-points/{metering_point_id}/time-series"

        async with self._session.get(url, headers=headers, params=params) as response:
            response.raise_for_status()
            return await response.json()

    async def async_get_aggregated_metering_data(
        self,
        metering_point_id: str,
        obis_code: str,
        start_date: datetime,
        end_date: datetime,
    ) -> dict:
        """Fetch aggregated metering data from the Leneda API."""
        headers = {"X-API-KEY": self._api_key, "X-ENERGY-ID": self._energy_id}
        params = {
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "obisCode": obis_code,
            "aggregationLevel": "Infinite",
            "transformationMode": "Accumulation",
        }
        url = f"{API_BASE_URL}/api/metering-points/{metering_point_id}/time-series/aggregated"

        async with self._session.get(url, headers=headers, params=params) as response:
            response.raise_for_status()
            return await response.json()

    async def test_credentials(self, metering_point_id: str) -> bool:
        """Test credentials against the Leneda API."""
        now = dt_util.utcnow()
        start_date = now - timedelta(hours=1)
        end_date = now
        obis_code = list(OBIS_CODES.keys())[0]

        try:
            await self.async_get_metering_data(
                metering_point_id, obis_code, start_date, end_date
            )
        except Exception:
            return False
        return True

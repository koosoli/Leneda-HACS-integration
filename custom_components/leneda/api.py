"""API client for the Leneda API."""
import aiohttp

from .const import API_BASE_URL


class LenedaApiClient:
    """A simple API client for the Leneda API."""

    def __init__(self, session: aiohttp.ClientSession, api_key: str, energy_id: str):
        """Initialize the API client."""
        self._session = session
        self._api_key = api_key
        self._energy_id = energy_id

    async def async_get_metering_data(
        self, metering_point_id: str, obis_code: str, start_date: str, end_date: str
    ) -> dict:
        """Fetch metering data from the Leneda API."""
        headers = {"X-API-KEY": self._api_key, "X-ENERGY-ID": self._energy_id}
        params = {
            "startDateTime": f"{start_date}Z",
            "endDateTime": f"{end_date}Z",
            "obisCode": obis_code,
        }
        url = f"{API_BASE_URL}/api/metering-points/{metering_point_id}/time-series"

        async with self._session.get(url, headers=headers, params=params) as response:
            response.raise_for_status()
            return await response.json()

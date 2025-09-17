"""API client for the Leneda API."""
import asyncio
from datetime import datetime, timedelta
import aiohttp
from homeassistant.exceptions import HomeAssistantError

class LenedaApiError(HomeAssistantError):
    """Base exception for Leneda API errors."""

class InvalidAuth(LenedaApiError):
    """Exception to indicate invalid authentication."""

class NoDataError(LenedaApiError):
    """Exception to indicate no data found."""

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
        start_date = now - timedelta(hours=25)
        end_date = now

        try:
            tasks = [
                self.async_get_metering_data(
                    metering_point_id, obis_code, start_date, end_date
                )
                for obis_code in OBIS_CODES
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            has_any_data = False
            for result in results:
                if isinstance(result, dict) and result.get("items"):
                    has_any_data = True
                    break

            if not has_any_data:
                raise NoDataError

        except aiohttp.ClientResponseError as err:
            if err.status in (401, 403):
                raise InvalidAuth from err
            raise LenedaApiError from err
        except (aiohttp.ClientError, asyncio.TimeoutError) as err:
            raise LenedaApiError from err

        return True

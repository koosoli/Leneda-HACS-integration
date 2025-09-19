"""API client for the Leneda API."""
import asyncio
from datetime import datetime, timedelta
import logging
import aiohttp
from homeassistant.exceptions import HomeAssistantError

_LOGGER = logging.getLogger(__name__)

class LenedaApiError(HomeAssistantError):
    """Base exception for Leneda API errors."""

class InvalidAuth(LenedaApiError):
    """Exception to indicate invalid authentication."""

class NoDataError(LenedaApiError):
    """Exception to indicate no data found."""

from homeassistant.util import dt as dt_util

from .const import API_BASE_URL


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
        _LOGGER.debug("Requesting Leneda metering data from %s with params %s", url, params)

        async with self._session.get(url, headers=headers, params=params) as response:
            response.raise_for_status()
            json_response = await response.json()
            _LOGGER.debug("Leneda metering data response: %s", json_response)
            return json_response

    async def async_get_aggregated_metering_data(
        self,
        metering_point_id: str,
        obis_code: str,
        start_date: datetime,
        end_date: datetime,
        aggregation_level: str = "Infinite",
    ) -> dict:
        """Fetch aggregated metering data from the Leneda API."""
        headers = {"X-API-KEY": self._api_key, "X-ENERGY-ID": self._energy_id}
        params = {
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "obisCode": obis_code,
            "aggregationLevel": aggregation_level,
            "transformationMode": "Accumulation",
        }
        url = f"{API_BASE_URL}/api/metering-points/{metering_point_id}/time-series/aggregated"
        _LOGGER.debug("Requesting Leneda aggregated data from %s with params %s", url, params)

        async with self._session.get(url, headers=headers, params=params) as response:
            response.raise_for_status()
            json_response = await response.json()
            _LOGGER.debug("Leneda aggregated data response: %s", json_response)
            return json_response

    async def async_determine_meter_types(self, metering_point_id: str) -> list[str]:
        """Determine all supported meter types by checking which OBIS codes return data."""
        now = dt_util.utcnow()
        start_date = now - timedelta(days=7)
        supported_types = []

        electricity_code = "1-1:1.29.0"
        gas_code = "7-1:99.23.15"

        try:
            # Probe for electricity
            _LOGGER.debug("Probing for electricity data for meter %s", metering_point_id)
            electricity_data = await self.async_get_metering_data(
                metering_point_id, electricity_code, start_date, now
            )
            if electricity_data and electricity_data.get("items"):
                _LOGGER.info("Detected ELECTRICITY capability for meter %s", metering_point_id)
                supported_types.append("electricity")

            # Probe for gas
            _LOGGER.debug("Probing for gas data for meter %s", metering_point_id)
            gas_data = await self.async_get_metering_data(
                metering_point_id, gas_code, start_date, now
            )
            if gas_data and gas_data.get("items"):
                _LOGGER.info("Detected GAS capability for meter %s", metering_point_id)
                supported_types.append("gas")

        except aiohttp.ClientResponseError as err:
            if err.status in (401, 403):
                raise InvalidAuth from err
            # For other errors, we might have partial results, so we don't re-raise yet
            _LOGGER.error("API error while probing meter type: %s", err)
        except (aiohttp.ClientError, asyncio.TimeoutError) as err:
            _LOGGER.error("Connection error while probing meter type: %s", err)

        if not supported_types:
            _LOGGER.warning(
                "Could not determine any supported meter type for %s.",
                metering_point_id,
            )
            raise NoDataError("Could not determine meter type.")

        return supported_types

    async def async_create_metering_data_access_request(
        self,
        from_energy_id: str,
        from_name: str,
        metering_point_codes: list[str],
        obis_codes: list[str],
    ) -> None:
        """Create a metering data access request."""
        headers = {
            "X-API-KEY": self._api_key,
            "X-ENERGY-ID": self._energy_id,
            "Content-Type": "application/json",
        }
        data = {
            "from": from_energy_id,
            "fromName": from_name,
            "meteringPointCodes": metering_point_codes,
            "obisCodes": obis_codes,
        }
        url = f"{API_BASE_URL}/api/metering-data-access-request"

        async with self._session.post(url, headers=headers, json=data) as response:
            response.raise_for_status()

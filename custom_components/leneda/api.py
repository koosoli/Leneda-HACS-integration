"""API client for the Leneda energy data platform.

This module provides a client interface to interact with the Leneda REST API
for retrieving energy consumption and production data from Luxembourg's smart meters.

The API supports:
- Aggregated data over various time periods (hourly, daily, weekly, monthly)
- Multiple OBIS codes for different types of measurements
- Production sharing data for energy communities
- Gas consumption data (volume and energy)

Authentication is handled via API key and Energy ID headers.
Network errors and timeouts are properly handled to maintain data integrity.
"""
import asyncio
from datetime import datetime, timedelta
import logging
import aiohttp
from homeassistant.exceptions import HomeAssistantError

_LOGGER = logging.getLogger(__name__)

class LenedaApiError(HomeAssistantError):
    """Base exception for Leneda API errors."""
    pass

class InvalidAuth(LenedaApiError):
    """Exception to indicate invalid authentication."""
    pass

class NoDataError(LenedaApiError):
    """Exception to indicate no data found.""" 
    pass

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
        """Fetch raw metering data from the Leneda API.
        
        Retrieves time-series data for a specific metering point and OBIS code
        within the specified time range. Data is typically provided in 15-minute intervals.
        
        Args:
            metering_point_id: The metering point identifier (LU + 34 characters)
            obis_code: The OBIS code specifying the measurement type
            start_date: Start of the time range (UTC)
            end_date: End of the time range (UTC)
            
        Returns:
            Dict containing metering data with 'items' list of measurements,
            each having 'value', 'startedAt', 'type', 'version', 'calculated'
            
        Raises:
            aiohttp.ClientResponseError: For HTTP errors (401, 403, etc.)
            aiohttp.ClientError: For network connectivity issues
        """
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
        """Fetch aggregated metering data from the Leneda API.
        
        Retrieves pre-aggregated consumption/production data over specified periods.
        For kW measurements, values are automatically summed and converted to kWh.
        
        Args:
            metering_point_id: The metering point identifier
            obis_code: The OBIS code for the measurement type
            start_date: Start of the date range
            end_date: End of the date range  
            aggregation_level: "Hour", "Day", "Week", "Month", or "Infinite"
            
        Returns:
            Dict with 'aggregatedTimeSeries' containing aggregated values
            and 'unit' showing the measurement unit (typically kWh)
        """
        headers = {"X-API-KEY": self._api_key, "X-ENERGY-ID": self._energy_id}
        params = {
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "obisCode": obis_code,
            "aggregationLevel": aggregation_level,
        }
        # Transformation mode is not applicable for gas meters
        if obis_code != "7-20:99.33.17":
            params["transformationMode"] = "Accumulation"

        url = f"{API_BASE_URL}/api/metering-points/{metering_point_id}/time-series/aggregated"
        _LOGGER.debug("Requesting Leneda aggregated data from %s with params %s", url, params)

        async with self._session.get(url, headers=headers, params=params) as response:
            response.raise_for_status()
            json_response = await response.json()
            _LOGGER.debug("Leneda aggregated data response: %s", json_response)
            return json_response

    async def test_credentials(self, metering_point_id: str) -> bool:
        """Test credentials against the Leneda API."""
        now = dt_util.utcnow()
        start_date = now - timedelta(hours=25)
        end_date = now

        try:
            time_series_tasks = [
                self.async_get_metering_data(
                    metering_point_id, obis_code, start_date, end_date
                )
                for obis_code in OBIS_CODES
            ]
            aggregated_task = self.async_get_aggregated_metering_data(
                metering_point_id, "1-1:1.29.0", start_date, end_date
            )

            tasks = time_series_tasks + [aggregated_task]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Check for any authentication errors first. If any call fails with 401/403,
            # it's an immediate failure, regardless of other calls.
            for r in results:
                if isinstance(r, aiohttp.ClientResponseError) and r.status in (401, 403):
                    raise InvalidAuth from r

            # If we passed the auth check, ensure at least one call was successful.
            has_successful_call = any(isinstance(r, dict) for r in results)

            if not has_successful_call:
                # If no calls were successful, but we know there were no auth errors,
                # it's a general data or API issue.
                raise NoDataError("No successful API calls, but no authentication errors detected.")

        except (aiohttp.ClientError, asyncio.TimeoutError) as err:
            raise LenedaApiError from err

        return True

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

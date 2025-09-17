"""API client for Leneda."""
from __future__ import annotations

import httpx


class LenedaApiClient:
    """API client for Leneda."""

    def __init__(
        self, api_key: str, energy_id: str, metering_point_id: str
    ) -> None:
        """Initialize the API client."""
        self.api_key = api_key
        self.energy_id = energy_id
        self.metering_point_id = metering_point_id
        self.base_url = "https://api.leneda.eu/v1"  # This is a guess

    async def async_get_aggregated_metering_data(
        self, start_date: str, end_date: str
    ) -> dict | None:
        """Get aggregated metering data."""
        url = f"{self.base_url}/metering-points/{self.metering_point_id}/aggregated-data"
        headers = {
            "X-API-KEY": self.api_key,
            "X-ENERGY-ID": self.energy_id,
            "Content-Type": "application/json",
        }
        params = {
            "start_date": start_date,
            "end_date": end_date,
            "transformationMode": "Accumulation",
        }
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, params=params)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                # Handle HTTP errors (e.g., 401, 404, 500)
                # In a real integration, you would log this error
                print(f"HTTP error occurred: {e}")
                return None
            except httpx.RequestError as e:
                # Handle network errors (e.g., connection refused)
                print(f"Request error occurred: {e}")
                return None

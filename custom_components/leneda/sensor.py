"""Sensor platform for Leneda."""
from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .api import LenedaApiClient


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the Leneda sensor."""
    api_client = LenedaApiClient(
        api_key=entry.data["api_key"],
        energy_id=entry.data["energy_id"],
        metering_point_id=entry.data["metering_point_id"],
    )
    async_add_entities([LenedaSensor(api_client)], update_before_add=True)


class LenedaSensor(SensorEntity):
    """Representation of a Leneda sensor."""

    def __init__(self, api_client: LenedaApiClient) -> None:
        """Initialize the sensor."""
        self._api_client = api_client
        self._attr_name = "Leneda Aggregated Consumption"
        self._attr_unique_id = f"{DOMAIN}_{self._api_client.metering_point_id}"
        self._attr_native_unit_of_measurement = "kWh"  # Assuming kWh, adjust if needed

    async def async_update(self) -> None:
        """Fetch new state data for the sensor."""
        # In a real scenario, you would define the date range
        from datetime import datetime, timedelta
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)

        data = await self._api_client.get_aggregated_metering_data(
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d"),
        )
        if data:
            self._attr_native_value = data.get("value")

"""Sensor platform for Leneda."""
from __future__ import annotations

# from datetime import timedelta
import logging

# from homeassistant.components.sensor import (
#     SensorDeviceClass,
#     SensorEntity,
#     SensorStateClass,
# )
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
# from homeassistant.util import dt as dt_util

# from .const import CONF_METERING_POINT_ID, DOMAIN, OBIS_CODES
# from .api import LenedaApiClient

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Leneda sensors from a config entry."""
    _LOGGER.debug("Setting up Leneda sensor platform.")
    api_client: LenedaApiClient = hass.data[DOMAIN][entry.entry_id]
    metering_point_id = entry.data[CONF_METERING_POINT_ID]

    sensors = [
        LenedaSensor(api_client, metering_point_id, obis_code, details)
        for obis_code, details in OBIS_CODES.items()
    ]
    _LOGGER.debug(f"Found {len(sensors)} sensors to create.")
    async_add_entities(sensors, True)
    _LOGGER.debug("Finished setting up Leneda sensor platform.")


class LenedaSensor(SensorEntity):
    """Representation of a Leneda sensor."""

    def __init__(
        self,
        api_client: LenedaApiClient,
        metering_point_id: str,
        obis_code: str,
        details: dict,
    ):
        """Initialize the sensor."""
        _LOGGER.debug(f"Initializing LenedaSensor for obis_code: {obis_code}")
        self._api_client = api_client
        self._metering_point_id = metering_point_id
        self._obis_code = obis_code
        self._attr_name = f"Leneda {details['name']}"
        self._attr_unique_id = f"{metering_point_id}_{obis_code}"
        self._attr_native_unit_of_measurement = details["unit"]
        if details["unit"] == "kW":
            self._attr_device_class = SensorDeviceClass.POWER
            self._attr_state_class = SensorStateClass.MEASUREMENT
        elif details["unit"] == "kWh":
            self._attr_device_class = SensorDeviceClass.ENERGY
            self._attr_state_class = SensorStateClass.TOTAL_INCREASING
        self._attr_icon = "mdi:flash"

    async def async_update(self) -> None:
        """Fetch new state data for the sensor."""
        now = dt_util.utcnow()
        start_date = (now - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%S")
        end_date = now.strftime("%Y-%m-%dT%H:%M:%S")

        try:
            data = await self._api_client.async_get_metering_data(
                self._metering_point_id, self._obis_code, start_date, end_date
            )
            if data and data.get("items"):
                self._attr_native_value = data["items"][-1]["value"]
            else:
                self._attr_native_value = None
        except Exception as e:
            _LOGGER.error("Error fetching data for sensor %s: %s", self.name, e)
            self._attr_native_value = None

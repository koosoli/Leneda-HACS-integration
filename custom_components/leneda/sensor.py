"""Sensor platform for Leneda."""
import logging
from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Leneda sensors from a config entry."""
    _LOGGER.debug("Setting up Leneda sensor platform (simplified).")
    async_add_entities([LenedaDummySensor()], True)
    _LOGGER.debug("Finished setting up Leneda sensor platform (simplified).")

class LenedaDummySensor(SensorEntity):
    """A dummy Leneda sensor."""
    _attr_name = "Leneda Dummy Sensor"
    _attr_unique_id = "leneda_dummy_sensor"
    _attr_state = "ok"

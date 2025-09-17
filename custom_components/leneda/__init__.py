"""The Leneda integration."""
from __future__ import annotations

import json
import logging
from pathlib import Path

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import LenedaApiClient
from .const import (
    CONF_API_KEY,
    CONF_ENERGY_ID,
    DOMAIN,
)

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.SENSOR]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Leneda from a config entry."""
    _LOGGER.debug("Setting up Leneda integration.")
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = LenedaApiClient(
        session=async_get_clientsession(hass),
        api_key=entry.data[CONF_API_KEY],
        energy_id=entry.data[CONF_ENERGY_ID],
    )

    manifest_path = Path(__file__).parent / "manifest.json"
    with manifest_path.open() as manifest_file:
        manifest_data = json.load(manifest_file)
    hass.data[DOMAIN]["version"] = manifest_data.get("version")

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    if unload_ok := await hass.config_entries.async_forward_entry_unload(
        entry, PLATFORMS
    ):
        hass.data[DOMAIN].pop(entry.entry_id)

    return unload_ok

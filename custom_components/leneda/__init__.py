"""The Leneda integration."""
from __future__ import annotations

import json
from pathlib import Path

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import LenedaApiClient
from .const import CONF_API_KEY, CONF_ENERGY_ID, CONF_METERING_POINT_ID, DOMAIN
from .coordinator import LenedaDataUpdateCoordinator

PLATFORMS: list[Platform] = [Platform.SENSOR]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Leneda from a config entry."""
    session = async_get_clientsession(hass)
    api_client = LenedaApiClient(
        session,
        entry.data[CONF_API_KEY],
        entry.data[CONF_ENERGY_ID]
    )
    metering_point_id = entry.data[CONF_METERING_POINT_ID]

    coordinator = LenedaDataUpdateCoordinator(hass, api_client, metering_point_id)

    manifest_path = Path(__file__).parent / "manifest.json"
    with manifest_path.open() as manifest_file:
        manifest_data = json.load(manifest_file)
    coordinator.version = manifest_data.get("version")

    await coordinator.async_config_entry_first_refresh()

    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        hass.data[DOMAIN].pop(entry.entry_id)

    return unload_ok

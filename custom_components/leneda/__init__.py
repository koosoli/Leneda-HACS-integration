"""The Leneda integration."""
from __future__ import annotations

import json
from pathlib import Path

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
import voluptuous as vol
import homeassistant.helpers.config_validation as cv

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

    coordinator = LenedaDataUpdateCoordinator(hass, api_client, metering_point_id, entry)

    manifest_path = Path(__file__).parent / "manifest.json"
    with manifest_path.open() as manifest_file:
        manifest_data = json.load(manifest_file)
    coordinator.version = manifest_data.get("version")

    await coordinator.async_config_entry_first_refresh()

    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Register the data access request service
    async def handle_data_access_request(call):
        """Handle the data access request service call."""
        from_energy_id = call.data.get("from_energy_id")
        from_name = call.data.get("from_name")
        metering_point_codes = call.data.get("metering_point_codes")
        obis_codes = call.data.get("obis_codes")

        await api_client.async_create_metering_data_access_request(
            from_energy_id, from_name, metering_point_codes, obis_codes
        )

    SERVICE_SCHEMA = vol.Schema(
        {
            vol.Required("from_energy_id"): cv.string,
            vol.Required("from_name"): cv.string,
            vol.Required("metering_point_codes"): vol.All(cv.ensure_list, [cv.string]),
            vol.Required("obis_codes"): vol.All(cv.ensure_list, [cv.string]),
        }
    )

    hass.services.async_register(
        DOMAIN, "request_data_access", handle_data_access_request, schema=SERVICE_SCHEMA
    )

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        hass.data[DOMAIN].pop(entry.entry_id)
        hass.services.async_remove(DOMAIN, "request_data_access")

    return unload_ok

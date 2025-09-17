"""The Leneda integration."""
from __future__ import annotations

import logging
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import LenedaApiClient
from .const import (
    CONF_API_KEY,
    CONF_ENERGY_ID,
    DOMAIN,
)

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Leneda from a config entry."""
    _LOGGER.debug("Setting up Leneda integration.")
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = LenedaApiClient(
        session=async_get_clientsession(hass),
        api_key=entry.data[CONF_API_KEY],
        energy_id=entry.data[CONF_ENERGY_ID],
    )

    # _LOGGER.debug("Forwarding setup to sensor platform.")
    # hass.async_create_task(
    #     hass.config_entries.async_forward_entry_setup(entry, "sensor")
    # )

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_forward_entry_unload(entry, "sensor")
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id)

    return unload_ok

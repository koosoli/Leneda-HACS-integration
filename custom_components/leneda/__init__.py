"""The Leneda integration.

Provides energy metering data from Luxembourg's Leneda platform as HA sensors,
plus an embedded dashboard panel served via iframe.
"""
from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.loader import async_get_integration
import voluptuous as vol
import homeassistant.helpers.config_validation as cv

from .api import LenedaApiClient
from .const import CONF_API_KEY, CONF_ENERGY_ID, CONF_METERING_POINT_ID, DOMAIN
from .coordinator import LenedaDataUpdateCoordinator
from .storage import LenedaStorage
from .http_api import async_register_api_views
from .panel import LenedaPanelView, LenedaStaticView

_LOGGER = logging.getLogger(__name__)

# The URL path used for the sidebar entry in HA's frontend
SIDEBAR_PATH = "leneda"
# The URL where our panel view serves the dashboard HTML
PANEL_SERVE_URL = "/leneda-panel/index.html"

PLATFORMS: list[Platform] = [Platform.SENSOR]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Leneda from a config entry."""
    hass.data.setdefault(DOMAIN, {})

    session = async_get_clientsession(hass)
    api_client = LenedaApiClient(
        session,
        entry.data[CONF_API_KEY],
        entry.data[CONF_ENERGY_ID],
    )
    metering_point_id = entry.data[CONF_METERING_POINT_ID]

    integration = await async_get_integration(hass, DOMAIN)
    version = str(integration.version) if integration.version else "unknown"

    # ── Initialize shared storage (once) ──
    if "storage" not in hass.data[DOMAIN]:
        storage = LenedaStorage(hass)
        await storage.async_load()
        hass.data[DOMAIN]["storage"] = storage

    # ── Coordinator ──
    coordinator = LenedaDataUpdateCoordinator(
        hass, api_client, metering_point_id, entry, version=version,
    )
    await coordinator.async_config_entry_first_refresh()
    hass.data[DOMAIN][entry.entry_id] = coordinator

    # ── Sensor platform ──
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # ── Service: request_data_access ──
    async def handle_data_access_request(call):
        """Handle the data access request service call."""
        await api_client.async_create_metering_data_access_request(
            call.data["from_energy_id"],
            call.data["from_name"],
            call.data["metering_point_codes"],
            call.data["obis_codes"],
        )

    hass.services.async_register(
        DOMAIN,
        "request_data_access",
        handle_data_access_request,
        schema=vol.Schema({
            vol.Required("from_energy_id"): cv.string,
            vol.Required("from_name"): cv.string,
            vol.Required("metering_point_codes"): vol.All(cv.ensure_list, [cv.string]),
            vol.Required("obis_codes"): vol.All(cv.ensure_list, [cv.string]),
        }),
    )

    # ── Register HTTP views + sidebar panel (once across all entries) ──
    if not hass.data[DOMAIN].get("views_registered"):
        # Panel view (serves index.html)
        hass.http.register_view(LenedaPanelView(hass))
        # Static asset view (serves JS/CSS bundles)
        hass.http.register_view(LenedaStaticView(hass))
        # REST API endpoints for the dashboard
        async_register_api_views(hass)

        # Sidebar panel — iframe pointing to our panel view
        from homeassistant.components import frontend

        frontend.async_register_built_in_panel(
            hass,
            component_name="iframe",
            sidebar_title="Leneda",
            sidebar_icon="mdi:flash",
            frontend_url_path=SIDEBAR_PATH,
            config={"url": PANEL_SERVE_URL},
            require_admin=False,
        )
        hass.data[DOMAIN]["views_registered"] = True
        _LOGGER.info("Leneda: panel and HTTP views registered")

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        hass.data[DOMAIN].pop(entry.entry_id, None)
        hass.services.async_remove(DOMAIN, "request_data_access")

        # If this was the last entry, remove the sidebar panel
        remaining = [
            eid for eid in hass.data.get(DOMAIN, {})
            if eid not in ("storage", "views_registered")
        ]
        if not remaining:
            try:
                from homeassistant.components import frontend
                frontend.async_remove_panel(hass, SIDEBAR_PATH)
                hass.data[DOMAIN].pop("views_registered", None)
            except Exception:
                pass

    return unload_ok

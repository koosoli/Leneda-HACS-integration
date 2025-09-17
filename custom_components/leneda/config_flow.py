"""Config flow for Leneda."""
import logging
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import LenedaApiClient
from .const import (
    CONF_API_KEY,
    CONF_ENERGY_ID,
    CONF_METERING_POINT_ID,
    DOMAIN,
)

_LOGGER = logging.getLogger(__name__)


class LenedaConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Leneda."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Handle the initial step."""
        _LOGGER.debug("Leneda config flow started.")
        errors = {}
        if user_input is not None:
            try:
                await self._test_credentials(
                    user_input[CONF_API_KEY],
                    user_input[CONF_ENERGY_ID],
                    user_input[CONF_METERING_POINT_ID],
                )
                return self.async_create_entry(title="Leneda", data=user_input)
            except Exception:
                errors["base"] = "cannot_connect"

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_METERING_POINT_ID): str,
                    vol.Required(CONF_API_KEY): str,
                    vol.Required(CONF_ENERGY_ID): str,
                }
            ),
            errors=errors,
        )

    async def _test_credentials(self, api_key, energy_id, metering_point_id):
        """Test credentials against Leneda API."""
        session = async_get_clientsession(self.hass)
        client = LenedaApiClient(session, api_key, energy_id)
        if not await client.test_credentials(metering_point_id):
            raise Exception("Cannot connect")

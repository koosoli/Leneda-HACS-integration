"""Config flow for Leneda."""
import logging
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import InvalidAuth, LenedaApiClient, LenedaApiError, NoDataError
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
            session = async_get_clientsession(self.hass)
            api_client = LenedaApiClient(
                session, user_input[CONF_API_KEY], user_input[CONF_ENERGY_ID]
            )
            try:
                await api_client.test_credentials(user_input[CONF_METERING_POINT_ID])
                return self.async_create_entry(title="Leneda", data=user_input)
            except InvalidAuth:
                errors["base"] = "invalid_auth"
            except NoDataError:
                errors["base"] = "no_data"
            except LenedaApiError:
                errors["base"] = "cannot_connect"
            except Exception:
                _LOGGER.exception("Unexpected exception during Leneda setup")
                errors["base"] = "unknown"

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

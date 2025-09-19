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
    CONF_METER_TYPE,
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
                metering_point_id = user_input[CONF_METERING_POINT_ID]

                # Prevent duplicate entries
                await self.async_set_unique_id(metering_point_id)
                self._abort_if_unique_id_configured()

                # Determine the meter types automatically
                meter_types = await api_client.async_determine_meter_types(metering_point_id)

                data = {**user_input, CONF_METER_TYPE: meter_types}

                # Create a descriptive title
                type_str = "/".join(t.capitalize() for t in meter_types)
                title = f"Leneda {type_str} - {metering_point_id}"

                return self.async_create_entry(title=title, data=data)

            except InvalidAuth:
                errors["base"] = "invalid_auth"
            except NoDataError:
                errors["base"] = "no_data_or_type"
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

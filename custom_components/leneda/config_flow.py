"""Config flow for Leneda."""
from __future__ import annotations

import voluptuous as vol
from homeassistant.config_entries import ConfigFlow
from homeassistant.const import CONF_API_KEY
from homeassistant.core import callback
from homeassistant.helpers.schema_attribute_validator import cv_string

from .const import DOMAIN, CONF_ENERGY_ID, CONF_METERING_POINT_ID


class LenedaConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Leneda."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        """Get the options flow for this handler."""
        return LenedaOptionsFlowHandler(config_entry)

    async def async_step_user(self, user_input=None):
        """Handle the initial step."""
        errors = {}

        if user_input is not None:
            # Here you would normally validate the user input, e.g., by making a test API call.
            # Since I don't have access to the API, I will just check for empty fields.
            if not user_input.get(CONF_API_KEY):
                errors[CONF_API_KEY] = "api_key_required"
            if not user_input.get(CONF_ENERGY_ID):
                errors[CONF_ENERGY_ID] = "energy_id_required"
            if not user_input.get(CONF_METERING_POINT_ID):
                errors[CONF_METERING_POINT_ID] = "metering_point_id_required"

            if not errors:
                await self.async_set_unique_id(user_input[CONF_METERING_POINT_ID])
                self._abort_if_unique_id_configured()
                return self.async_create_entry(title="Leneda", data=user_input)

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_API_KEY): cv_string,
                    vol.Required(CONF_ENERGY_ID): cv_string,
                    vol.Required(CONF_METERING_POINT_ID): cv_string,
                }
            ),
            errors=errors,
        )


class LenedaOptionsFlowHandler(ConfigFlow):
    """Handle an options flow for Leneda."""

    def __init__(self, config_entry):
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(self, user_input=None):
        """Manage the options."""
        # Options flow can be implemented here if needed in the future.
        # For now, we don't have any options to configure.
        return self.async_create_entry(title="", data={})

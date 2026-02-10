"""Config flow for Leneda."""
import logging
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers import selector as sel

from .api import InvalidAuth, LenedaApiClient, LenedaApiError, NoDataError
from .const import (
    CONF_API_KEY,
    CONF_ENERGY_ID,
    CONF_METERING_POINT_ID,
    CONF_METERING_POINT_1_TYPES,
    CONF_REFERENCE_POWER_ENTITY,
    CONF_REFERENCE_POWER_STATIC,
    EXTRA_METER_SLOTS,
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

        meter_type_selector = sel.SelectSelector(
            sel.SelectSelectorConfig(
                options=[
                    {"value": "consumption", "label": "Power Consumption"},
                    {"value": "production", "label": "Power Production"},
                    {"value": "gas", "label": "Gas Consumption"},
                ],
                multiple=True,
            ),
        )

        if user_input is not None:
            # Validation: Ensure either entity or static value is provided, but not both.
            ref_entity = user_input.get(CONF_REFERENCE_POWER_ENTITY)
            ref_static = user_input.get(CONF_REFERENCE_POWER_STATIC)
            if ref_entity and ref_static:
                errors["base"] = "ambiguous_reference"
            else:
                session = async_get_clientsession(self.hass)
                api_client = LenedaApiClient(
                    session, user_input[CONF_API_KEY], user_input[CONF_ENERGY_ID]
                )
                try:
                    # Test the primary metering point
                    await api_client.test_credentials(user_input[CONF_METERING_POINT_ID])

                    # Test extra metering points (2–10) if provided
                    for idx, (id_key, _types_key) in enumerate(EXTRA_METER_SLOTS, start=2):
                        mid = user_input.get(id_key, "").strip()
                        if mid:
                            try:
                                await api_client.test_credentials(mid)
                            except (InvalidAuth, NoDataError, LenedaApiError):
                                errors["base"] = f"invalid_meter_{idx}"

                    if not errors:
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

        # Build schema: meter 1 (required) + meters 2–10 (optional)
        schema_fields = {
            vol.Required(CONF_METERING_POINT_ID): str,
            vol.Required(CONF_METERING_POINT_1_TYPES, default=["consumption"]): meter_type_selector,
        }
        for id_key, types_key in EXTRA_METER_SLOTS:
            schema_fields[vol.Optional(id_key, default="")] = str
            schema_fields[vol.Optional(types_key, default=[])] = meter_type_selector

        schema_fields[vol.Required(CONF_API_KEY)] = str
        schema_fields[vol.Required(CONF_ENERGY_ID)] = str
        schema_fields[vol.Optional(CONF_REFERENCE_POWER_ENTITY)] = sel.EntitySelector(
            sel.EntitySelectorConfig(domain="input_number"),
        )
        schema_fields[vol.Optional(CONF_REFERENCE_POWER_STATIC)] = sel.NumberSelector(
            sel.NumberSelectorConfig(
                min=0,
                max=100,
                step=0.1,
                mode="box",
                unit_of_measurement="kW",
            ),
        )

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(schema_fields),
            errors=errors,
        )

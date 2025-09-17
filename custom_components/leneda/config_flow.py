"""Config flow for Leneda."""
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import (
    API_BASE_URL,
    CONF_API_KEY,
    CONF_ENERGY_ID,
    CONF_METERING_POINT_ID,
    DOMAIN,
    OBIS_CODES,
)


class LenedaConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Leneda."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Handle the initial step."""
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
        from datetime import timedelta
        from homeassistant.util import dt as dt_util

        session = async_get_clientsession(self.hass)
        headers = {"X-API-KEY": api_key, "X-ENERGY-ID": energy_id}
        obis_code = list(OBIS_CODES.keys())[0]
        now = dt_util.utcnow()
        start_date = (now - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%S")
        end_date = now.strftime("%Y-%m-%dT%H:%M:%S")

        params = {
            "startDateTime": f"{start_date}Z",
            "endDateTime": f"{end_date}Z",
            "obisCode": obis_code,
        }
        url = f"{API_BASE_URL}/api/metering-points/{metering_point_id}/time-series"

        async with session.get(url, headers=headers, params=params) as response:
            response.raise_for_status()

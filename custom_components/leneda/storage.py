"""Storage for the Leneda integration."""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import (
    DOMAIN,
    CONF_REFERENCE_POWER_ENTITY,
    CONF_REFERENCE_POWER_STATIC,
)
from .models import BillingConfig

_LOGGER = logging.getLogger(__name__)

STORAGE_VERSION = 1
STORAGE_KEY = f"{DOMAIN}.storage"

class LenedaStorage:
    """Storage for Leneda configuration."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize storage."""
        self.hass = hass
        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self.billing_config = BillingConfig()
        self.has_persisted_billing_config = False

    async def async_load(self) -> None:
        """Load data from storage."""
        data = await self._store.async_load()
        if data:
            if "billing" in data:
                self.billing_config = BillingConfig.from_dict(data["billing"])
                self.has_persisted_billing_config = True
            _LOGGER.debug("Loaded Leneda storage data")

    async def async_save(self) -> None:
        """Save data to storage."""
        data = {
            "billing": self.billing_config.to_dict(),
        }
        self.has_persisted_billing_config = True
        await self._store.async_save(data)
        _LOGGER.debug("Saved Leneda storage data")


def get_effective_reference_power(hass: HomeAssistant, entry: Any) -> float | None:
    """Return the reference power used for exceedance calculations.

    Prefer the user-editable billing config once it has been persisted via the
    dashboard settings. Fall back to the legacy config-entry fields so existing
    installs continue to work until users update the setting.
    """
    storage = hass.data.get(DOMAIN, {}).get("storage")
    if storage and getattr(storage, "has_persisted_billing_config", False):
        try:
            return float(storage.billing_config.reference_power_kw)
        except (AttributeError, TypeError, ValueError):
            _LOGGER.warning("Stored billing reference power is invalid; falling back to integration entry.")

    if entry is None:
        return None

    ref_entity = entry.data.get(CONF_REFERENCE_POWER_ENTITY)
    if ref_entity:
        ref_state = hass.states.get(ref_entity)
        if ref_state and ref_state.state not in ("unknown", "unavailable"):
            try:
                return float(ref_state.state)
            except (TypeError, ValueError):
                _LOGGER.warning("Reference power entity %s has a non-numeric state.", ref_entity)
        else:
            _LOGGER.warning("Reference power entity %s not found or unavailable.", ref_entity)

    ref_static = entry.data.get(CONF_REFERENCE_POWER_STATIC)
    if ref_static is not None:
        try:
            return float(ref_static)
        except (TypeError, ValueError):
            _LOGGER.warning("Static reference power value is invalid: %s", ref_static)

    return None

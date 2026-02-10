"""Storage for the Leneda integration."""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN
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

    async def async_load(self) -> None:
        """Load data from storage."""
        data = await self._store.async_load()
        if data:
            if "billing" in data:
                self.billing_config = BillingConfig.from_dict(data["billing"])
            _LOGGER.debug("Loaded Leneda storage data")

    async def async_save(self) -> None:
        """Save data to storage."""
        data = {
            "billing": self.billing_config.to_dict(),
        }
        await self._store.async_save(data)
        _LOGGER.debug("Saved Leneda storage data")

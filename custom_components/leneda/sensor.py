"""Sensor platform for Leneda."""
from __future__ import annotations

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import CONF_METERING_POINT_ID, DOMAIN, OBIS_CODES
from .coordinator import LenedaDataUpdateCoordinator


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Leneda sensors from a config entry."""
    coordinator: LenedaDataUpdateCoordinator = hass.data[DOMAIN][entry.entry_id]
    metering_point_id = entry.data[CONF_METERING_POINT_ID]

    sensors = [
        LenedaSensor(coordinator, metering_point_id, obis_code, details)
        for obis_code, details in OBIS_CODES.items()
    ]
    async_add_entities(sensors)


class LenedaSensor(CoordinatorEntity[LenedaDataUpdateCoordinator], SensorEntity):
    """Representation of a Leneda sensor."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: LenedaDataUpdateCoordinator,
        metering_point_id: str,
        obis_code: str,
        details: dict,
    ):
        """Initialize the sensor."""
        super().__init__(coordinator)
        self._obis_code = obis_code
        self._attr_name = details["name"]
        self._attr_unique_id = f"{metering_point_id}_{obis_code}"
        self._attr_native_unit_of_measurement = details["unit"]

        if details["unit"] == "kW":
            self._attr_device_class = SensorDeviceClass.POWER
            self._attr_state_class = SensorStateClass.MEASUREMENT
        elif details["unit"] == "kWh":
            self._attr_device_class = SensorDeviceClass.ENERGY
            self._attr_state_class = SensorStateClass.TOTAL_INCREASING
        elif details["unit"] == "kVAR":
            self._attr_device_class = SensorDeviceClass.REACTIVE_POWER
            self._attr_state_class = SensorStateClass.MEASUREMENT
        elif details["unit"] in ("m³", "Nm³"):
            self._attr_device_class = SensorDeviceClass.GAS
            self._attr_state_class = SensorStateClass.TOTAL_INCREASING

        self._attr_icon = "mdi:flash"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, metering_point_id)},
            name=f"Leneda (...{metering_point_id[-4:]})",
            manufacturer="Leneda",
            model="Metering Point",
            sw_version=coordinator.version,
        )

    @property
    def native_value(self) -> float | None:
        """Return the state of the sensor."""
        if self.coordinator.data:
            return self.coordinator.data.get(self._obis_code)
        return None

    @property
    def available(self) -> bool:
        """Return True if entity is available."""
        return (
            super().available
            and self.coordinator.data is not None
            and self.coordinator.data.get(self._obis_code) is not None
        )

    @property
    def extra_state_attributes(self) -> dict[str, str] | None:
        """Return the state attributes."""
        if self.coordinator.data:
            data_timestamp = self.coordinator.data.get(f"{self._obis_code}_data_timestamp")
            if data_timestamp:
                return {"data_timestamp": data_timestamp}
        return None

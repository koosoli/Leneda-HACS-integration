"""Sensor platform for Leneda."""
from __future__ import annotations
import logging

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

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Leneda sensors from a config entry."""
    coordinator: LenedaDataUpdateCoordinator = hass.data[DOMAIN][entry.entry_id]
    metering_point_id = entry.data[CONF_METERING_POINT_ID]

    _LOGGER.debug("Setting up Leneda sensors for metering point %s", metering_point_id)

    all_sensors_ordered = [
        # Consumption
        ("c_01_quarter_hourly_consumption", "15-Minute Consumption", "energy"),
        ("c_02_hourly_consumption", "Hourly Consumption", "energy"),
        ("c_03_daily_consumption", "Current Day Consumption", "energy"),
        ("c_04_yesterday_consumption", "Yesterday's Consumption", "energy"),
        ("c_05_weekly_consumption", "Current Week Consumption", "energy"),
        ("c_06_last_week_consumption", "Last Week's Consumption", "energy"),
        ("c_07_monthly_consumption", "Current Month Consumption", "energy"),
        ("c_08_previous_month_consumption", "Previous Month's Consumption", "energy"),
        ("1-1:1.29.0", "Measured Active Consumption", "obis"),
        ("1-1:3.29.0", "Measured Reactive Consumption", "obis"),
        ("7-20:99.33.17", "Measured Consumed Energy", "obis"),
        ("7-1:99.23.15", "Measured Consumed Volume", "obis"),
        ("7-1:99.23.17", "Measured Consumed Standard Volume", "obis"),
        ("1-65:1.29.1", "Consumption Covered by Production (Layer 1)", "obis"),
        ("1-65:1.29.3", "Consumption Covered by Production (Layer 2)", "obis"),
        ("1-65:1.29.2", "Consumption Covered by Production (Layer 3)", "obis"),
        ("1-65:1.29.4", "Consumption Covered by Production (Layer 4)", "obis"),
        ("1-65:1.29.9", "Remaining Consumption After Sharing", "obis"),
        # Production
        ("p_01_quarter_hourly_production", "15-Minute Production", "energy"),
        ("p_02_hourly_production", "Hourly Production", "energy"),
        ("p_03_daily_production", "Current Day Production", "energy"),
        ("p_04_yesterday_production", "Yesterday's Production", "energy"),
        ("p_05_weekly_production", "Current Week Production", "energy"),
        ("p_06_last_week_production", "Last Week's Production", "energy"),
        ("p_07_monthly_production", "Current Month Production", "energy"),
        ("p_08_previous_month_production", "Previous Month's Production", "energy"),
        ("1-1:2.29.0", "Measured Active Production", "obis"),
        ("1-1:4.29.0", "Measured Reactive Production", "obis"),
        ("1-65:2.29.1", "Production Shared (Layer 1)", "obis"),
        ("1-65:2.29.3", "Production Shared (Layer 2)", "obis"),
        ("1-65:2.29.2", "Production Shared (Layer 3)", "obis"),
        ("1-65:2.29.4", "Production Shared (Layer 4)", "obis"),
        ("1-65:2.29.9", "Remaining Production After Sharing", "obis"),
    ]

    sensors = []
    _LOGGER.debug("Creating sensors in the following order:")
    for key, name, sensor_type in all_sensors_ordered:
        _LOGGER.debug(f"  - Key: {key}, Name: {name}, Type: {sensor_type}")
        if sensor_type == "energy":
            sensors.append(
                LenedaEnergySensor(coordinator, metering_point_id, key, name)
            )
        elif sensor_type == "obis":
            if key in OBIS_CODES:
                details = OBIS_CODES[key]
                details_with_override = details.copy()
                details_with_override["name"] = name
                sensors.append(
                    LenedaSensor(coordinator, metering_point_id, key, details_with_override)
                )

    _LOGGER.debug("Adding %d entities.", len(sensors))
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


class LenedaEnergySensor(CoordinatorEntity[LenedaDataUpdateCoordinator], SensorEntity):
    """Representation of a Leneda energy sensor for aggregated data."""

    _attr_has_entity_name = True
    _attr_device_class = SensorDeviceClass.ENERGY
    _attr_state_class = SensorStateClass.TOTAL_INCREASING
    _attr_native_unit_of_measurement = "kWh"
    _attr_icon = "mdi:chart-bar"

    def __init__(
        self,
        coordinator: LenedaDataUpdateCoordinator,
        metering_point_id: str,
        sensor_key: str,
        name: str,
    ):
        """Initialize the sensor."""
        super().__init__(coordinator)
        self._key = sensor_key
        self._attr_name = name
        self._attr_unique_id = f"{metering_point_id}_{sensor_key}"

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
            return self.coordinator.data.get(self._key)
        return None

    @property
    def available(self) -> bool:
        """Return True if entity is available."""
        return (
            super().available
            and self.coordinator.data is not None
            and self.coordinator.data.get(self._key) is not None
        )

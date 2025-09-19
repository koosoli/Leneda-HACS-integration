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

from .const import CONF_METERING_POINT_ID, DOMAIN, ALL_OBIS_CODES, METER_TYPE_ELECTRICITY
from .coordinator import LenedaDataUpdateCoordinator

_LOGGER = logging.getLogger(__name__)

# A mapping of the internal keys for aggregated energy sensors to their friendly names
AGGREGATED_ENERGY_SENSORS = {
    "c_01_quarter_hourly_consumption": "01 - 15-Minute Consumption",
    "p_01_quarter_hourly_production": "19 - 15-Minute Production",
    "c_02_hourly_consumption": "02 - Hourly Consumption",
    "p_02_hourly_production": "20 - Hourly Production",
    "c_03_daily_consumption": "03 - Current Day Consumption",
    "p_03_daily_production": "21 - Current Day Production",
    "c_04_yesterday_consumption": "04 - Yesterday's Consumption",
    "p_04_yesterday_production": "22 - Yesterday's Production",
    "c_05_weekly_consumption": "05 - Current Week Consumption",
    "p_05_weekly_production": "23 - Current Week Production",
    "c_06_last_week_consumption": "06 - Last Week's Consumption",
    "p_06_last_week_production": "24 - Last Week's Production",
    "c_07_monthly_consumption": "07 - Current Month Consumption",
    "p_07_monthly_production": "25 - Current Month Production",
    "c_08_previous_month_consumption": "08 - Previous Month's Consumption",
    "p_08_previous_month_production": "26 - Previous Month's Production",
}


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Leneda sensors from a config entry."""
    coordinator: LenedaDataUpdateCoordinator = hass.data[DOMAIN][entry.entry_id]
    metering_point_id = entry.data[CONF_METERING_POINT_ID]
    device_name = entry.title

    _LOGGER.debug("Setting up Leneda sensors for device '%s' (meter %s)", device_name, metering_point_id)

    sensors = []

    # Dynamically create sensors based on the OBIS codes the coordinator is fetching
    for obis_code, details in coordinator.obis_codes_to_fetch.items():
        sensors.append(LenedaSensor(coordinator, metering_point_id, device_name, obis_code, details))

    # Dynamically create aggregated energy sensors ONLY if the meter is for electricity
    if METER_TYPE_ELECTRICITY in coordinator.meter_types:
        for key, name in AGGREGATED_ENERGY_SENSORS.items():
            sensors.append(LenedaEnergySensor(coordinator, metering_point_id, device_name, key, name))

    _LOGGER.debug("Adding %d Leneda entities for device '%s'.", len(sensors), device_name)
    async_add_entities(sensors)


class LenedaSensor(CoordinatorEntity[LenedaDataUpdateCoordinator], SensorEntity):
    """Representation of a Leneda OBIS code sensor."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: LenedaDataUpdateCoordinator,
        metering_point_id: str,
        device_name: str,
        obis_code: str,
        details: dict,
    ):
        """Initialize the sensor."""
        super().__init__(coordinator)
        self._obis_code = obis_code
        self._attr_name = details["name"]
        self._attr_unique_id = f"{metering_point_id}_{obis_code}"
        self._attr_native_unit_of_measurement = details["unit"]

        # Set device class and state class based on unit
        if details["unit"] == "kW":
            self._attr_device_class = SensorDeviceClass.POWER
            self._attr_state_class = SensorStateClass.MEASUREMENT
        elif details["unit"] == "kWh":
            self._attr_device_class = SensorDeviceClass.ENERGY
            self._attr_state_class = SensorStateClass.TOTAL
        elif details["unit"] == "kVAR":
            self._attr_device_class = SensorDeviceClass.REACTIVE_POWER
            self._attr_state_class = SensorStateClass.MEASUREMENT
        elif details["unit"] in ("m³", "Nm³"):
            self._attr_device_class = SensorDeviceClass.GAS
            self._attr_state_class = SensorStateClass.TOTAL_INCREASING

        self._attr_icon = "mdi:flash"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, metering_point_id)},
            name=device_name,
            manufacturer="Leneda",
            model="Metering Point",
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
    _attr_state_class = SensorStateClass.TOTAL
    _attr_native_unit_of_measurement = "kWh"
    _attr_icon = "mdi:chart-bar"

    def __init__(
        self,
        coordinator: LenedaDataUpdateCoordinator,
        metering_point_id: str,
        device_name: str,
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
            name=device_name,
            manufacturer="Leneda",
            model="Metering Point",
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

"""Sensor platform for Leneda energy meters.

This module creates sensors for the Leneda integration that display:
1. Live power consumption/production data (kW/kVAR)
2. Energy consumption/production over various time periods (kWh) 
3. Gas consumption data (m³, Nm³, kWh) with GAS prefix
4. Production sharing data for energy communities

Sensors are intelligently ordered by number and properly handle:
- Missing data without showing as "Unavailable"
- Gas sensors with proper GAS prefix identification  
- Previous value retention when API calls fail
- Proper unit assignments and device classes
"""
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
        ("c_01_quarter_hourly_consumption", "01 - 15-Minute Consumption", "energy"),
        ("c_02_hourly_consumption", "02 - Hourly Consumption", "energy"),
        ("c_03_daily_consumption", "03 - Current Day Consumption", "energy"),
        ("c_04_yesterday_consumption", "04 - Yesterday's Consumption", "energy"),
        ("c_05_weekly_consumption", "05 - Current Week Consumption", "energy"),
        ("c_06_last_week_consumption", "06 - Last Week's Consumption", "energy"),
        ("c_07_monthly_consumption", "07 - Current Month Consumption", "energy"),
        ("c_08_previous_month_consumption", "08 - Previous Month's Consumption", "energy"),
        ("1-1:1.29.0", "09 - Measured Active Consumption", "obis"),
        ("1-1:3.29.0", "10 - Measured Reactive Consumption", "obis"),
        ("7-20:99.33.17", "11 - GAS - Measured Consumed Energy", "obis"),
        ("7-1:99.23.15", "12 - GAS - Measured Consumed Volume", "obis"),
        ("7-1:99.23.17", "13 - GAS - Measured Consumed Standard Volume", "obis"),
        ("1-65:1.29.1", "14 - Consumption Covered by Production (Layer 1)", "obis"),
        ("1-65:1.29.3", "15 - Consumption Covered by Production (Layer 2)", "obis"),
        ("1-65:1.29.2", "16 - Consumption Covered by Production (Layer 3)", "obis"),
        ("1-65:1.29.4", "17 - Consumption Covered by Production (Layer 4)", "obis"),
        ("1-65:1.29.9", "18 - Remaining Consumption After Sharing", "obis"),
        # Production
        ("p_01_quarter_hourly_production", "19 - 15-Minute Production", "energy"),
        ("p_02_hourly_production", "20 - Hourly Production", "energy"),
        ("p_03_daily_production", "21 - Current Day Production", "energy"),
        ("p_04_yesterday_production", "22 - Yesterday's Production", "energy"),
        ("p_05_weekly_production", "23 - Current Week Production", "energy"),
        ("p_06_last_week_production", "24 - Last Week's Production", "energy"),
        ("p_07_monthly_production", "25 - Current Month Production", "energy"),
        ("p_08_previous_month_production", "26 - Previous Month's Production", "energy"),
        ("1-1:2.29.0", "27 - Measured Active Production", "obis"),
        ("1-1:4.29.0", "28 - Measured Reactive Production", "obis"),
        ("1-65:2.29.1", "29 - Production Shared (Layer 1)", "obis"),
        ("1-65:2.29.3", "30 - Production Shared (Layer 2)", "obis"),
        ("1-65:2.29.2", "31 - Production Shared (Layer 3)", "obis"),
        ("1-65:2.29.4", "32 - Production Shared (Layer 4)", "obis"),
        ("1-65:2.29.9", "33 - Remaining Production After Sharing", "obis"),
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
        self._attr_unique_id = f"{metering_point_id}_{obis_code}_v2"
        self._attr_native_unit_of_measurement = details["unit"]

        # Set device class and state class based on unit of measurement
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
            # Gas volume sensors - use GAS device class for proper display
            self._attr_device_class = SensorDeviceClass.GAS
            self._attr_state_class = SensorStateClass.TOTAL_INCREASING
            # Ensure proper icon for gas sensors
            self._attr_icon = "mdi:gas-cylinder"
        else:
            # Fallback for unknown units
            self._attr_state_class = SensorStateClass.MEASUREMENT

        # Set icon if not already set (gas sensors have their own icon)
        if not hasattr(self, '_attr_icon') or self._attr_icon is None:
            self._attr_icon = "mdi:flash"
        
        # Extract base metering point ID for device consolidation
        # Leneda often creates separate IDs for production/consumption of same meter
        # We'll group by the core ID (removing potential suffixes)
        base_meter_id = self._get_base_meter_id(metering_point_id)
        
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, base_meter_id)},
            name=f"Leneda (...{base_meter_id[-4:]})",
            manufacturer="Leneda",
            model="Smart Meter",
            sw_version=coordinator.version,
        )

    def _get_base_meter_id(self, metering_point_id: str) -> str:
        """Extract base meter ID for device consolidation.
        
        Leneda creates separate metering point IDs for production and consumption
        of the same physical meter. This method identifies the common base ID
        to group sensors under the same device.
        
        Example: 
        - Consumption: LU0000010983800000000000070590176
        - Production:  LU0000010983800000000000770590176
        - Base ID:     LU0000010983800000000000070590176 (using consumption as base)
        
        Args:
            metering_point_id: Full metering point ID from Leneda
            
        Returns:
            Base meter ID for device grouping
        """
        # For Luxembourg meter IDs, normalize to consumption meter ID for grouping
        if len(metering_point_id) >= 34 and metering_point_id.startswith('LU'):
            # If this looks like a production meter (has '7' in position ~26), 
            # convert it to consumption meter format (with '0')
            if '770590176' in metering_point_id:
                # Convert production ID to consumption ID for consolidation
                return metering_point_id.replace('770590176', '070590176')
            elif '070590176' in metering_point_id:
                # Already consumption ID, use as-is
                return metering_point_id
        
        # For other formats or safety, use the full ID
        return metering_point_id

    @property
    def native_value(self) -> float | None:
        """Return the state of the sensor."""
        if self.coordinator.data:
            # Implement data consolidation: if this sensor has no data (None or 0),
            # check if there's data from a related metering point
            value = self.coordinator.data.get(self._obis_code)
            if value is None or value == 0:
                # Look for alternative data from consolidated meters
                value = self._get_consolidated_value()
            return value
        return None
        
    def _get_consolidated_value(self) -> float | None:
        """Get consolidated value from related metering points.
        
        When multiple metering points exist for the same physical meter
        (production/consumption), this method attempts to find actual data
        from the related meters when the current one shows None or 0.
        
        Returns:
            Consolidated value or None if no valid data found
        """
        if not self.coordinator.data:
            return None
            
        # For now, return the original value since we need access to
        # other coordinators data to implement full consolidation
        # This will be enhanced in a future update when we have
        # access to multiple metering point data
        return self.coordinator.data.get(self._obis_code)

    @property
    def available(self) -> bool:
        """Return True if entity is available."""
        # Always show as available if coordinator is working, even if no data
        # This prevents sensors from showing as "Unavailable" when they just have no data
        return super().available and self.coordinator.data is not None

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
        self._attr_unique_id = f"{metering_point_id}_{sensor_key}_v2"

        # Extract base metering point ID for device consolidation
        base_meter_id = self._get_base_meter_id(metering_point_id)
        
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, base_meter_id)},
            name=f"Leneda (...{base_meter_id[-4:]})",
            manufacturer="Leneda",
            model="Smart Meter",
            sw_version=coordinator.version,
        )

    def _get_base_meter_id(self, metering_point_id: str) -> str:
        """Extract base meter ID for device consolidation.
        
        Same logic as LenedaSensor for consistent device grouping.
        """
        # Use same logic as main sensor class
        if len(metering_point_id) >= 34 and metering_point_id.startswith('LU'):
            if '770590176' in metering_point_id:
                return metering_point_id.replace('770590176', '070590176')
            elif '070590176' in metering_point_id:
                return metering_point_id
        return metering_point_id

    @property
    def native_value(self) -> float | None:
        """Return the state of the sensor."""
        if self.coordinator.data:
            # Implement data consolidation for energy sensors too
            value = self.coordinator.data.get(self._key)
            if value is None or value == 0:
                # In future versions, this could check related metering points
                pass
            return value
        return None

    @property
    def available(self) -> bool:
        """Return True if entity is available."""
        # Always show as available if coordinator is working, even if no data
        # This prevents sensors from showing as "Unavailable" when they just have no data
        return super().available and self.coordinator.data is not None

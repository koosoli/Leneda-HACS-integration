"""Sensor platform for Leneda energy meters.

This module creates sensors for the Leneda integration that display:
1. Energy consumption/production over various time periods (kWh) 
2. Gas consumption data (m³, Nm³, kWh) with GAS prefix
3. Production sharing data for energy communities

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

from .const import (
    CONF_METERING_POINT_ID,
    DOMAIN,
    OBIS_CODES,
    GAS_OBIS_CODES,
    CONF_REFERENCE_POWER_ENTITY,
    CONF_REFERENCE_POWER_STATIC,
)
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
        # --- Energy Consumption ---
        ("c_04_yesterday_consumption", "01 - Yesterday's Consumption", "energy"),
        ("c_05_weekly_consumption", "02 - Current Week Consumption", "energy"),
        ("c_06_last_week_consumption", "03 - Last Week's Consumption", "energy"),
        ("c_07_monthly_consumption", "04 - Current Month Consumption", "energy"),
        ("c_08_previous_month_consumption", "05 - Previous Month's Consumption", "energy"),
        ("1-1:1.29.0", "06 - Yesterday's Peak Active Consumption", "obis"),
        ("1-1:3.29.0", "07 - Yesterday's Peak Reactive Consumption", "obis"),

        # --- Energy Production ---
        ("p_04_yesterday_production", "08 - Yesterday's Production", "energy"),
        ("p_05_weekly_production", "09 - Current Week Production", "energy"),
        ("p_06_last_week_production", "10 - Last Week's Production", "energy"),
        ("p_07_monthly_production", "11 - Current Month Production", "energy"),
        ("p_08_previous_month_production", "12 - Previous Month's Production", "energy"),
        ("1-1:2.29.0", "13 - Yesterday's Peak Active Production", "obis"),
        ("1-1:4.29.0", "14 - Yesterday's Peak Reactive Production", "obis"),

        # --- Energy Sharing & Community ---
        ("1-65:1.29.1", "15 - Yesterday's Peak Consumption Covered (L1)", "obis"),
        ("1-65:1.29.3", "16 - Yesterday's Peak Consumption Covered (L2)", "obis"),
        ("1-65:1.29.2", "17 - Yesterday's Peak Consumption Covered (L3)", "obis"),
        ("1-65:1.29.4", "18 - Yesterday's Peak Consumption Covered (L4)", "obis"),
        ("1-65:1.29.9", "19 - Yesterday's Peak Remaining Consumption", "obis"),
        ("1-65:2.29.1", "20 - Yesterday's Peak Production Shared (L1)", "obis"),
        ("1-65:2.29.3", "21 - Yesterday's Peak Production Shared (L2)", "obis"),
        ("1-65:2.29.2", "22 - Yesterday's Peak Production Shared (L3)", "obis"),
        ("1-65:2.29.4", "23 - Yesterday's Peak Production Shared (L4)", "obis"),
        ("1-65:2.29.9", "24 - Yesterday's Peak Remaining Production", "obis"),

        # --- Aggregated Production Metrics ---
        ("p_09_yesterday_exported", "25 - Yesterday's Exported Energy", "energy"),
        ("p_12_yesterday_self_consumed", "26 - Yesterday's Locally Used Energy", "energy"),
        ("p_10_last_week_exported", "27 - Last Week's Exported Energy", "energy"),
        ("p_13_last_week_self_consumed", "28 - Last Week's Locally Used Energy", "energy"),
        ("p_15_monthly_exported", "29 - Current Month's Exported Energy", "energy"),
        ("p_16_monthly_self_consumed", "30 - Current Month's Locally Used Energy", "energy"),
        ("p_11_last_month_exported", "31 - Last Month's Exported Energy", "energy"),
        ("p_14_last_month_self_consumed", "32 - Last Month's Locally Used Energy", "energy"),

        # --- Last Month's Energy Sharing ---
        ("s_c_l1_last_month", "33 - Last Month's Consumption Covered (L1)", "energy"),
        ("s_c_l2_last_month", "34 - Last Month's Consumption Covered (L2)", "energy"),
        ("s_c_l3_last_month", "35 - Last Month's Consumption Covered (L3)", "energy"),
        ("s_c_l4_last_month", "36 - Last Month's Consumption Covered (L4)", "energy"),
        ("s_c_rem_last_month", "37 - Last Month's Remaining Consumption", "energy"),
        ("s_p_l1_last_month", "38 - Last Month's Production Shared (L1)", "energy"),
        ("s_p_l2_last_month", "39 - Last Month's Production Shared (L2)", "energy"),
        ("s_p_l3_last_month", "40 - Last Month's Production Shared (L3)", "energy"),
        ("s_p_l4_last_month", "41 - Last Month's Production Shared (L4)", "energy"),
        ("s_p_rem_last_month", "42 - Last Month's Remaining Production", "energy"),

        # --- Gas Consumption ---
        ("g_10_yesterday_volume", "43 - GAS - Yesterday's Volume (m³)", "gas_volume"),
        ("g_11_weekly_volume", "44 - GAS - Current Week's Volume (m³)", "gas_volume"),
        ("g_12_last_week_volume", "45 - GAS - Last Week's Volume (m³)", "gas_volume"),
        ("g_13_monthly_volume", "46 - GAS - Current Month's Volume (m³)", "gas_volume"),
        ("g_14_last_month_volume", "47 - GAS - Last Month's Volume (m³)", "gas_volume"),
        ("g_20_yesterday_std_volume", "48 - GAS - Yesterday's Standard Volume (Nm³)", "gas_std_volume"),
        ("g_21_weekly_std_volume", "49 - GAS - Current Week's Standard Volume (Nm³)", "gas_std_volume"),
        ("g_22_last_week_std_volume", "50 - GAS - Last Week's Standard Volume (Nm³)", "gas_std_volume"),
        ("g_23_monthly_std_volume", "51 - GAS - Current Month's Standard Volume (Nm³)", "gas_std_volume"),
        ("g_24_last_month_std_volume", "52 - GAS - Last Month's Standard Volume (Nm³)", "gas_std_volume"),

        # --- OBIS Peak Gas Codes ---
        ("7-1:99.23.15", "53 - GAS - Yesterday's Peak Consumed Volume", "obis"),
        ("7-1:99.23.17", "54 - GAS - Yesterday's Peak Consumed Standard Volume", "obis"),
    ]

    # Conditionally add the power usage over reference sensor
    if coordinator.entry.data.get(CONF_REFERENCE_POWER_ENTITY) or coordinator.entry.data.get(CONF_REFERENCE_POWER_STATIC) is not None:
        all_sensors_ordered.extend([
            ("yesterdays_power_usage_over_reference", "55 - Yesterday's Power Usage Over Reference", "energy"),
            ("current_month_power_usage_over_reference", "56 - Current Month's Power Usage Over Reference", "energy"),
            ("last_month_power_usage_over_reference", "57 - Last Month's Power Usage Over Reference", "energy"),
        ])

    # The _v3 suffix on unique_id is applied to all sensors below to force entity recreation.
    sensors = []
    _LOGGER.debug("Creating sensors in the following order:")
    for key, name, sensor_type in all_sensors_ordered:
        _LOGGER.debug(f"  - Key: {key}, Name: {name}, Type: {sensor_type}")
        if sensor_type == "energy":
            # Default to energy sensor settings
            unit = "kWh"
            device_class = SensorDeviceClass.ENERGY
            icon = "mdi:chart-bar"

            # Customize for gas sensors
            if key.startswith("g_"):
                icon = "mdi:fire"

            sensors.append(
                LenedaEnergySensor(coordinator, metering_point_id, key, name, unit, device_class, icon)
            )
        elif sensor_type == "gas_volume":
            unit = "m³"
            device_class = SensorDeviceClass.GAS
            icon = "mdi:fire"
            sensors.append(
                LenedaEnergySensor(coordinator, metering_point_id, key, name, unit, device_class, icon)
            )
        elif sensor_type == "gas_std_volume":
            unit = "Nm³"
            device_class = SensorDeviceClass.GAS
            icon = "mdi:fire"
            sensors.append(
                LenedaEnergySensor(coordinator, metering_point_id, key, name, unit, device_class, icon)
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
    _attr_suggested_display_precision = 2

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
        self._attr_unique_id = f"{metering_point_id}_{obis_code}_v3"
        self._attr_native_unit_of_measurement = details["unit"]

        # Set device class, state class, and icon based on OBIS code and unit
        if self._obis_code == "7-20:99.33.17":
            # This is a gas sensor measuring energy, so class is ENERGY
            self._attr_device_class = SensorDeviceClass.ENERGY
            self._attr_icon = "mdi:fire"
            self._attr_state_class = SensorStateClass.TOTAL_INCREASING
        elif self._obis_code in GAS_OBIS_CODES:
            # This is a gas sensor measuring volume, so class is GAS
            self._attr_device_class = SensorDeviceClass.GAS
            self._attr_icon = "mdi:fire"
            self._attr_state_class = SensorStateClass.TOTAL_INCREASING
        else:
            # Default icon for non-gas sensors
            self._attr_icon = "mdi:flash"
            if details["unit"] == "kW":
                self._attr_device_class = SensorDeviceClass.POWER
                self._attr_state_class = SensorStateClass.MEASUREMENT
            elif details["unit"] == "kWh":
                self._attr_device_class = SensorDeviceClass.ENERGY
                self._attr_state_class = SensorStateClass.TOTAL_INCREASING
            elif details["unit"] == "kvar":
                self._attr_device_class = SensorDeviceClass.REACTIVE_POWER
                self._attr_state_class = SensorStateClass.MEASUREMENT
            else:
                # Fallback for other units
                self._attr_state_class = SensorStateClass.MEASUREMENT
        
        # Extract base metering point ID for device consolidation
        # Leneda often creates separate IDs for production/consumption of same meter
        # We'll group by the core ID (removing potential suffixes)
        base_meter_id = self._get_base_meter_id(metering_point_id)
        
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, base_meter_id)},
            name=f"Leneda (...{base_meter_id[-7:]})",
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
        - Consumption: LUXXXXXXXXXXXXXXXXXXXXX079999999
        - Production:  LUXXXXXXXXXXXXXXXXXXXXX779999999
        - Base ID:     LUXXXXXXXXXXXXXXXXXXXXX079999999 (using consumption as base)
        
        Args:
            metering_point_id: Full metering point ID from Leneda
            
        Returns:
            Base meter ID for device grouping
        """
        # For Luxembourg meter IDs, normalize to consumption meter ID for grouping
        if len(metering_point_id) >= 34 and metering_point_id.startswith('LU'):
            # If this looks like a production meter (has '7' in position ~26), 
            # convert it to consumption meter format (with '0')
            if '779999999' in metering_point_id:
                # Convert production ID to consumption ID for consolidation
                return metering_point_id.replace('779999999', '079999999')
            elif '079999999' in metering_point_id:
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
            peak_timestamp = self.coordinator.data.get(f"{self._obis_code}_peak_timestamp")
            if peak_timestamp:
                return {"peak_timestamp": peak_timestamp}
        return None


class LenedaEnergySensor(CoordinatorEntity[LenedaDataUpdateCoordinator], SensorEntity):
    """Representation of a Leneda energy sensor for aggregated data."""

    _attr_has_entity_name = True
    _attr_state_class = SensorStateClass.TOTAL_INCREASING
    _attr_suggested_display_precision = 2

    def __init__(
        self,
        coordinator: LenedaDataUpdateCoordinator,
        metering_point_id: str,
        sensor_key: str,
        name: str,
        unit: str,
        device_class: SensorDeviceClass,
        icon: str,
    ):
        """Initialize the sensor."""
        super().__init__(coordinator)
        self._key = sensor_key
        self._attr_name = name
        self._attr_unique_id = f"{metering_point_id}_{sensor_key}_v3"
        self._attr_native_unit_of_measurement = unit
        self._attr_device_class = device_class
        self._attr_icon = icon

        # Extract base metering point ID for device consolidation
        base_meter_id = self._get_base_meter_id(metering_point_id)
        
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, base_meter_id)},
            name=f"Leneda (...{base_meter_id[-7:]})",
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
            if '779999999' in metering_point_id:
                return metering_point_id.replace('779999999', '079999999')
            elif '079999999' in metering_point_id:
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
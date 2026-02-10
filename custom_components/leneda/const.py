"""Constants for the Leneda integration."""

DOMAIN = "leneda"

API_BASE_URL = "https://api.leneda.eu"

CONF_API_KEY = "api_key"
CONF_ENERGY_ID = "energy_id"
CONF_METERING_POINT_ID = "metering_point_id"
CONF_METERING_POINT_1_TYPES = "metering_point_1_types"
CONF_METERING_POINT_2 = "metering_point_2"
CONF_METERING_POINT_2_TYPES = "metering_point_2_types"
CONF_METERING_POINT_3 = "metering_point_3"
CONF_METERING_POINT_3_TYPES = "metering_point_3_types"
CONF_METERING_POINT_4 = "metering_point_4"
CONF_METERING_POINT_4_TYPES = "metering_point_4_types"
CONF_METERING_POINT_5 = "metering_point_5"
CONF_METERING_POINT_5_TYPES = "metering_point_5_types"
CONF_METERING_POINT_6 = "metering_point_6"
CONF_METERING_POINT_6_TYPES = "metering_point_6_types"
CONF_METERING_POINT_7 = "metering_point_7"
CONF_METERING_POINT_7_TYPES = "metering_point_7_types"
CONF_METERING_POINT_8 = "metering_point_8"
CONF_METERING_POINT_8_TYPES = "metering_point_8_types"
CONF_METERING_POINT_9 = "metering_point_9"
CONF_METERING_POINT_9_TYPES = "metering_point_9_types"
CONF_METERING_POINT_10 = "metering_point_10"
CONF_METERING_POINT_10_TYPES = "metering_point_10_types"

# All extra meter constants (2–10) for loop-based access
EXTRA_METER_SLOTS = [
    (CONF_METERING_POINT_2, CONF_METERING_POINT_2_TYPES),
    (CONF_METERING_POINT_3, CONF_METERING_POINT_3_TYPES),
    (CONF_METERING_POINT_4, CONF_METERING_POINT_4_TYPES),
    (CONF_METERING_POINT_5, CONF_METERING_POINT_5_TYPES),
    (CONF_METERING_POINT_6, CONF_METERING_POINT_6_TYPES),
    (CONF_METERING_POINT_7, CONF_METERING_POINT_7_TYPES),
    (CONF_METERING_POINT_8, CONF_METERING_POINT_8_TYPES),
    (CONF_METERING_POINT_9, CONF_METERING_POINT_9_TYPES),
    (CONF_METERING_POINT_10, CONF_METERING_POINT_10_TYPES),
]
CONF_REFERENCE_POWER_ENTITY = "reference_power_entity"
CONF_REFERENCE_POWER_STATIC = "reference_power_static"
CONF_METER_HAS_GAS = "meter_has_gas"  # legacy, kept for backward compat

# Meter type constants
METER_TYPE_CONSUMPTION = "consumption"
METER_TYPE_PRODUCTION = "production"
METER_TYPE_GAS = "gas"

OBIS_CODES = {
    "1-1:1.29.0": {"name": "Measured Active Consumption", "unit": "kW", "service_type": "electricity"},
    "1-1:2.29.0": {"name": "Measured Active Production", "unit": "kW", "service_type": "electricity"},
    "1-1:3.29.0": {"name": "Measured Reactive Consumption", "unit": "kvar", "service_type": "electricity"},
    "1-1:4.29.0": {"name": "Measured Reactive Production", "unit": "kvar", "service_type": "electricity"},
    "1-65:1.29.1": {"name": "Consumption Covered by Production (Layer 1)", "unit": "kW", "service_type": "electricity"},
    "1-65:1.29.3": {"name": "Consumption Covered by Production (Layer 2)", "unit": "kW", "service_type": "electricity"},
    "1-65:1.29.2": {"name": "Consumption Covered by Production (Layer 3)", "unit": "kW", "service_type": "electricity"},
    "1-65:1.29.4": {"name": "Consumption Covered by Production (Layer 4)", "unit": "kW", "service_type": "electricity"},
    "1-65:1.29.9": {"name": "Remaining Consumption After Sharing", "unit": "kW", "service_type": "electricity"},
    "1-65:2.29.1": {"name": "Production Shared (Layer 1)", "unit": "kW", "service_type": "electricity"},
    "1-65:2.29.3": {"name": "Production Shared (Layer 2)", "unit": "kW", "service_type": "electricity"},
    "1-65:2.29.2": {"name": "Production Shared (Layer 3)", "unit": "kW", "service_type": "electricity"},
    "1-65:2.29.4": {"name": "Production Shared (Layer 4)", "unit": "kW", "service_type": "electricity"},
    "1-65:2.29.9": {"name": "Remaining Production After Sharing", "unit": "kW", "service_type": "electricity"},
    "7-1:99.23.15": {"name": "GAS - Measured Consumed Volume", "unit": "m³", "service_type": "gas"},
    "7-1:99.23.17": {"name": "GAS - Measured Consumed Standard Volume", "unit": "m³", "service_type": "gas"},
    "7-20:99.33.17": {"name": "GAS - Measured Consumed Energy", "unit": "kWh", "service_type": "gas"},
}

# Gas sensor OBIS codes for easy identification
GAS_OBIS_CODES = {
    "7-1:99.23.15",   # Measured consumed volume (m³)
    "7-1:99.23.17",   # Measured consumed standard volume (m³)
    "7-20:99.33.17",  # Measured consumed energy (kWh)
}

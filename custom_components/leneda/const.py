"""Constants for the Leneda integration."""

DOMAIN = "leneda"

API_BASE_URL = "https://api.leneda.eu"

CONF_API_KEY = "api_key"
CONF_ENERGY_ID = "energy_id"
CONF_METERING_POINT_ID = "metering_point_id"
CONF_REFERENCE_POWER_ENTITY = "reference_power_entity"
CONF_REFERENCE_POWER_STATIC = "reference_power_static"

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
    "7-1:99.23.17": {"name": "GAS - Measured Consumed Standard Volume", "unit": "Nm³", "service_type": "gas"},
    "7-20:99.33.17": {"name": "GAS - Measured Consumed Energy", "unit": "kWh", "service_type": "gas"},
}

# Gas sensor OBIS codes for easy identification
GAS_OBIS_CODES = {
    "7-1:99.23.15",   # Measured consumed volume (m³)
    "7-1:99.23.17",   # Measured consumed standard volume (m³)
    "7-20:99.33.17",  # Measured consumed energy (kWh)
}

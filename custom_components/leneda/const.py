"""Constants for the Leneda integration."""

DOMAIN = "leneda"

API_BASE_URL = "https://api.leneda.eu"

# Configuration keys
CONF_API_KEY = "api_key"
CONF_ENERGY_ID = "energy_id"
CONF_METERING_POINT_ID = "metering_point_id"
CONF_METER_TYPE = "meter_types" # Note: Storing a list of types

# Meter types
METER_TYPE_ELECTRICITY = "electricity"
METER_TYPE_GAS = "gas"

ELECTRICITY_OBIS_CODES = {
    "1-1:1.29.0": {"name": "01 - Measured Active Consumption", "unit": "kW"},
    "1-1:2.29.0": {"name": "02 - Measured Active Production", "unit": "kW"},
    "1-1:3.29.0": {"name": "03 - Measured Reactive Consumption", "unit": "kVAR"},
    "1-1:4.29.0": {"name": "04 - Measured Reactive Production", "unit": "kVAR"},
    "1-65:1.29.1": {"name": "05 - Consumption Covered by Production (Layer 1)", "unit": "kW"},
    "1-65:1.29.3": {"name": "06 - Consumption Covered by Production (Layer 2)", "unit": "kW"},
    "1-65:1.29.2": {"name": "07 - Consumption Covered by Production (Layer 3)", "unit": "kW"},
    "1-65:1.29.4": {"name": "08 - Consumption Covered by Production (Layer 4)", "unit": "kW"},
    "1-65:1.29.9": {"name": "09 - Remaining Consumption After Sharing", "unit": "kW"},
    "1-65:2.29.1": {"name": "10 - Production Shared (Layer 1)", "unit": "kW"},
    "1-65:2.29.3": {"name": "11 - Production Shared (Layer 2)", "unit": "kW"},
    "1-65:2.29.2": {"name": "12 - Production Shared (Layer 3)", "unit": "kW"},
    "1-65:2.29.4": {"name": "13 - Production Shared (Layer 4)", "unit": "kW"},
    "1-65:2.29.9": {"name": "14 - Remaining Production After Sharing", "unit": "kW"},
}

GAS_OBIS_CODES = {
    "7-1:99.23.15": {"name": "20 - GAS - Measured Consumed Volume", "unit": "m³"},
    "7-1:99.23.17": {"name": "21 - GAS - Measured Consumed Standard Volume", "unit": "Nm³"},
    "7-20:99.33.17": {"name": "22 - GAS - Measured Consumed Energy", "unit": "kWh"},
}

ALL_OBIS_CODES = {**ELECTRICITY_OBIS_CODES, **GAS_OBIS_CODES}

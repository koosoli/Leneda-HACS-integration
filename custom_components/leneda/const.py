"""Constants for the Leneda integration."""

DOMAIN = "leneda"

API_BASE_URL = "https://api.leneda.eu"

CONF_API_KEY = "api_key"
CONF_ENERGY_ID = "energy_id"
CONF_METERING_POINT_ID = "metering_point_id"

OBIS_CODES = {
    "1-1:1.29.0": {"name": "Measured Active Consumption", "unit": "kW"},
    "1-1:2.29.0": {"name": "Measured Active Production", "unit": "kW"},
    "1-1:3.29.0": {"name": "Measured Reactive Consumption", "unit": "kVAR"},
    "1-1:4.29.0": {"name": "Measured Reactive Production", "unit": "kVAR"},
    "1-65:1.29.1": {"name": "Consumption Covered by Production (Layer 1)", "unit": "kW"},
    "1-65:1.29.3": {"name": "Consumption Covered by Production (Layer 2)", "unit": "kW"},
    "1-65:1.29.2": {"name": "Consumption Covered by Production (Layer 3)", "unit": "kW"},
    "1-65:1.29.4": {"name": "Consumption Covered by Production (Layer 4)", "unit": "kW"},
    "1-65:1.29.9": {"name": "Remaining Consumption After Sharing", "unit": "kW"},
    "1-65:2.29.1": {"name": "Production Shared (Layer 1)", "unit": "kW"},
    "1-65:2.29.3": {"name": "Production Shared (Layer 2)", "unit": "kW"},
    "1-65:2.29.2": {"name": "Production Shared (Layer 3)", "unit": "kW"},
    "1-65:2.29.4": {"name": "Production Shared (Layer 4)", "unit": "kW"},
    "1-65:2.29.9": {"name": "Remaining Production After Sharing", "unit": "kW"},
    "7-1:99.23.15": {"name": "Measured Consumed Volume", "unit": "m³"},
    "7-1:99.23.17": {"name": "Measured Consumed Standard Volume", "unit": "Nm³"},
    "7-20:99.33.17": {"name": "Measured Consumed Energy", "unit": "kWh"},
}

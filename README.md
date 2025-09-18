# Leneda Home Assistant Integration

[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)

This is a custom integration for Home Assistant to integrate with the Leneda API. It allows you to monitor your energy consumption and production data from Leneda within Home Assistant.

## Available Sensors

This integration provides comprehensive energy monitoring through two main categories:

### Consumption

- 01 - 15-Minute Consumption
- 02 - Hourly Consumption
- 03 - Current Day Consumption
- 04 - Yesterday's Consumption
- 05 - Current Week Consumption
- 06 - Last Week's Consumption
- 07 - Current Month Consumption
- 08 - Previous Month's Consumption
- 09 - Measured Active Consumption
- 10 - Measured Reactive Consumption
- 11 - Measured Consumed Energy
- 12 - Measured Consumed Volume
- 13 - Measured Consumed Standard Volume
- 14 - Consumption Covered by Production (Layer 1)
- 15 - Consumption Covered by Production (Layer 2)
- 16 - Consumption Covered by Production (Layer 3)
- 17 - Consumption Covered by Production (Layer 4)
- 18 - Remaining Consumption After Sharing

---

### Production

- 19 - 15-Minute Production
- 20 - Hourly Production
- 21 - Current Day Production
- 22 - Yesterday's Production
- 23 - Current Week Production
- 24 - Last Week's Production
- 25 - Current Month Production
- 26 - Previous Month's Production
- 27 - Measured Active Production
- 28 - Measured Reactive Production
- 29 - Production Shared (Layer 1)
- 30 - Production Shared (Layer 2)
- 31 - Production Shared (Layer 3)
- 32 - Production Shared (Layer 4)
- 33 - Remaining Production After Sharing

## Installation

### HACS (Home Assistant Community Store)

1.  Go to HACS -> Integrations.
2.  Click on the 3 dots in the top right corner and select "Custom repositories".
3.  Add the URL to your repository and select the "Integration" category.
4.  Click "Add".
5.  The Leneda integration should now be available in the HACS store.
6.  Click "Install" and follow the instructions.
7.  Restart Home Assistant.

## Configuration

1.  Go to Settings -> Devices & Services.
2.  Click "Add Integration" and search for "Leneda".
3.  Enter your API Key, Energy ID, and Metering Point ID.
4.  Click "Submit".

The integration will automatically create sensors for all available OBIS codes and aggregated time-series data.

### How to get an API Key

You can generate an API key by following the instructions on the [Leneda website](https://leneda.eu/de/docs/how-to-generate-and-manage-api-keys.html).
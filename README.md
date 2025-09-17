# Leneda Home Assistant Integration

[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)

This is a custom integration for Home Assistant to integrate with the Leneda API. It allows you to monitor your energy consumption and production data from Leneda within Home Assistant.

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

The integration will automatically create sensors for all available OBIS codes.

### How to get an API Key

You can generate an API key by following the instructions on the [Leneda website](https://leneda.eu/de/docs/how-to-generate-and-manage-api-keys.html).
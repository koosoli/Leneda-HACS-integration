# Leneda Home Assistant Integration

![HACS Default](https://img.shields.io/badge/HACS-Default-orange.svg)  


A comprehensive Home Assistant integration for **Leneda smart energy meters in Luxembourg**.  
Monitor your **electricity and gas consumption and production** with daily updates based on data from the previous day.

---

## 🚀 Features

### ⚡ Smart Energy Monitoring
- **Historical Analytics**: Provides daily, weekly, and monthly energy statistics based on complete data from the previous day.
- **Gas Metering**: Support for gas volume (m³, Nm³) and energy (kWh) measurements.
- **Energy Communities**: Track production sharing across all community layers (if you are part of one).
- **Built-in Calculations**: Automatically calculates key metrics like exported and self-consumed solar energy for yesterday, the last week, and the last month. *No complex templates needed!*

### 🔄 Robust and Reliable
- **Device Consolidation**: Intelligently groups multiple metering points (e.g., consumption and production) into a single logical device in Home Assistant.
- **Resilient**: Handles network issues and temporary API outages gracefully, preserving the last known sensor state.

### 📊 Comprehensive Sensors
- **Complete Coverage**: Provides a full suite of sensors for all available historical data points, including consumption, production, gas, grid import/export, and energy sharing.

---

## 📦 Installation

### HACS (Recommended)
1. Open **HACS** in Home Assistant.
2. Go to **Integrations**.
3. Click the **⋮ menu → Custom repositories**.
4. Add repository URL:  
   `https://github.com/koosoli/Leneda-HACS-integration`
5. Category: **Integration**
6. Click **Add**, find the "Leneda" integration in the list, and click **Install**.
7. Restart Home Assistant.

### Manual Installation
1. Download the latest release from GitHub.
2. Extract the **leneda** folder into your `config/custom_components/` directory.
3. Restart Home Assistant.

---

## ⚙️ Configuration

### Step 1: Get Leneda API Credentials
1. Log in to the **Leneda Portal**.
2. Navigate to the **API Keys** section and generate a new key.
3. Note your **API Key**, **Energy ID**, and **Metering Point ID(s)**.

📚 *Detailed API key tutorial available in the portal.*

### Step 2: Add Integration to Home Assistant
1. Go to **Settings → Devices & Services**.
2. Click **+ Add Integration** and search for **"Leneda"**.
3. Enter your credentials when prompted.  
   The integration will automatically create devices and sensors.

---

## 🏠 Usage Examples

### Configuring the Energy Dashboard
The Leneda API provides **daily totals from the previous day**.  
To use this data effectively in Home Assistant's **Energy Dashboard**, you need to use the `utility_meter` helper.

Create Utility Meter Helpers by adding the following to your `configuration.yaml`  
*(replace `...XXXX...` with your meter ID)*:

````yaml
# configuration.yaml
utility_meter:
  daily_grid_import:
    source: sensor.leneda_...XXXX..._remaining_consumption_after_sharing
    cycle: daily
  daily_grid_export:
    source: sensor.leneda_...XXXX..._remaining_production_after_sharing
    cycle: daily
  daily_solar_production:
    source: sensor.leneda_...XXXX..._measured_active_production
    cycle: daily
````

Restart Home Assistant after adding the helpers.

Configure the Energy Dashboard:  
**Settings → Dashboards → Energy**

- **Electricity Grid**:
  - Grid consumption: `sensor.daily_grid_import`
  - Return to grid: `sensor.daily_grid_export`
- **Solar Panels**:
  - Solar production: `sensor.daily_solar_production`

---

### Energy Billing & Auto-Consumption Calculations

> **Note:** The integration now provides built-in sensors for exported and self-consumed energy.  
> The template examples below are for advanced/custom calculations.

**Key Built-in Sensors:**
- `sensor.leneda_..._yesterdays_self_consumed_energy`
- `sensor.leneda_..._yesterdays_exported_energy`
- `sensor.leneda_..._last_weeks_self_consumed_energy`
- and more!

#### Advanced Calculations (Template Examples)

If you have a separate meter for your solar inverter's own consumption, you can create more detailed template sensors.  
*(replace `...HOUSE...` and `...INVERTER...` with the appropriate meter IDs)*

````yaml
# configuration.yaml
template:
  - sensor:
      # Total consumption you pay for (House + Inverter)
      - name: "Total Energy Consumption Yesterday"
        unique_id: total_energy_consumption_yesterday
        unit_of_measurement: "kWh"
        state: >
          {% set house = states('sensor.leneda_...HOUSE..._yesterdays_consumption') | float(0) %}
          {% set inverter = states('sensor.leneda_...INVERTER..._yesterdays_consumption') | float(0) %}
          {{ (house + inverter) | round(2) }}

      # Final Grid Import after solar offset
      - name: "Grid Import Yesterday"
        unique_id: grid_import_yesterday
        unit_of_measurement: "kWh"
        state: >
          {% set house = states('sensor.leneda_...HOUSE..._yesterdays_consumption') | float(0) %}
          {% set inverter = states('sensor.leneda_...INVERTER..._yesterdays_consumption') | float(0) %}
          {% set production = states('sensor.leneda_...INVERTER..._yesterdays_production') | float(0) %}
          {{ max(0, (house + inverter) - production) | round(2) }}

      # Final Grid Export after self-consumption
      - name: "Grid Export Yesterday"
        unique_id: grid_export_yesterday
        unit_of_measurement: "kWh"
        state: >
          {% set house = states('sensor.leneda_...HOUSE..._yesterdays_consumption') | float(0) %}
          {% set production = states('sensor.leneda_...INVERTER..._yesterdays_production') | float(0) %}
          {{ max(0, production - house) | round(2) }}

      # Estimated Energy Cost for Yesterday
      - name: "Energy Cost Yesterday"
        unique_id: energy_cost_yesterday
        unit_of_measurement: "€"
        device_class: monetary
        state: >
          {% set import_kwh = states('sensor.grid_import_yesterday') | float(0) %}
          {% set export_kwh = states('sensor.grid_export_yesterday') | float(0) %}
          {% set import_rate = 0.30 %}  # €/kWh - adjust to your rate
          {% set export_rate = 0.05 %}  # €/kWh - adjust to your feed-in tariff
          {{ ((import_kwh * import_rate) - (export_kwh * export_rate)) | round(2) }}
````

---

## 🔧 Troubleshooting

| Issue | Solution |
|------|----------|
| Sensors show "Unavailable" | Verify your API Key, Energy ID, and Metering Point ID(s). Check network connectivity. |
| Some OBIS sensors show "Unknown" | This is normal. Your meter may not support all OBIS codes (e.g., gas sensors for an electric meter). |
| Duplicate devices appear | This may happen if meter configurations are changed. Removing and re-adding the integration usually resolves this. |

### Debug Logging
Enable debug logging by adding to your `configuration.yaml`:

````yaml
logger:
  default: info
  logs:
    custom_components.leneda: debug
````

---

## 📋 Sensor Reference

The integration creates sensors based on historical data available from the Leneda API.  
Availability of certain OBIS code sensors depends on your specific meter.

### Core Historical Sensors (kWh)
| Sensor Name | Description |
|-------------|------------|
| ..._yesterdays_consumption | Total energy consumed on the previous day. |
| ..._yesterdays_production | Total energy produced on the previous day. |
| ..._current_weeks_consumption | Total energy consumed from the start of the current week until yesterday. |
| ..._current_weeks_production | Total energy produced from the start of the current week until yesterday. |
| ..._last_weeks_consumption | Total energy consumed during the entire previous week. |
| ..._last_weeks_production | Total energy produced during the entire previous week. |
| ..._current_months_consumption | Total energy consumed from the start of the current month until yesterday. |
| ..._current_months_production | Total energy produced from the start of the current month until yesterday. |
| ..._last_months_consumption | Total energy consumed during the entire previous month. |
| ..._last_months_production | Total energy produced during the entire previous month. |

### Calculated Export & Self-Consumption (kWh)
These sensors are automatically created:

| Sensor Name | Description |
|-------------|------------|
| ..._yesterdays_exported_energy | Total energy exported to the grid on the previous day. |
| ..._yesterdays_self_consumed_energy | Total self-consumed energy from your production on the previous day. |
| ..._last_weeks_exported_energy | Total energy exported to the grid during the previous week. |
| ..._last_weeks_self_consumed_energy | Total self-consumed energy during the previous week. |
| ..._last_months_exported_energy | Total energy exported to the grid during the previous month. |
| ..._last_months_self_consumed_energy | Total self-consumed energy during the previous month. |

### Direct OBIS Code Sensors
These provide the raw data used for calculations. Availability depends on your meter.

| Sensor Name | OBIS Code | Description |
|-------------|----------|------------|
| ..._measured_active_consumption | 1-1:1.29.0 | Raw power consumption data. |
| ..._measured_active_production | 1-1:2.29.0 | Raw power generation data. |
| ..._remaining_consumption_after_sharing | 1-65:1.29.9 | Grid Import: Total energy imported from the grid. |
| ..._remaining_production_after_sharing | 1-65:2.29.9 | Grid Export: Total energy exported to the grid. |
| Other OBIS codes | various | Reactive power, gas, and energy community sharing data. |

---

## 🤝 Contributing
Contributions are welcome!

1. **Fork** the repository.
2. Create a feature branch:  
   `git checkout -b feature/AmazingFeature`
3. Make and commit your changes:  
   `git commit -m 'Add some AmazingFeature'`
4. Push to the branch:  
   `git push origin feature/AmazingFeature`
5. Open a **Pull Request**.

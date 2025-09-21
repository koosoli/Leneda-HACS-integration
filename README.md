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
- **Peak Power Tracking**: Automatically creates sensors for yesterday's peak power consumption and production.
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
    source: sensor.leneda_...XXXX..._yesterdays_consumption
    cycle: daily
  daily_grid_export:
    source: sensor.leneda_...XXXX..._yesterdays_exported_energy
    cycle: daily
  daily_solar_production:
    source: sensor.leneda_...XXXX..._yesterdays_production
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

### Tracking Power Usage Over a Reference Limit
For users on contracts with a demand charge (e.g., you pay extra if you exceed 12 kW of power), this integration can calculate the total energy consumed above that limit.

**Step 1: Create an `input_number` Helper**  
This helper will store your reference power value.
1. Go to **Settings → Devices & Services → Helpers**.
2. Click **+ Create Helper** and choose **Number**.
3. Name it (e.g., "Reference Power Limit").
4. Set the **Unit of measurement** to **kW**.
5. Set the **Mode** to **Box** so you can type a value.
6. Click **Submit**. Note the entity ID (e.g., `input_number.reference_power_limit`).

**Step 2: Configure the Integration**  
When you add or reconfigure the Leneda integration, you will see an optional field for "Reference Power Entity". Select the `input_number` helper you just created.

**Step 3: Use the New Sensors**  
The integration will create three sensors to track this overage automatically:
- `sensor.leneda_..._yesterdays_power_usage_over_reference`
- `sensor.leneda_..._current_month_power_usage_over_reference`
- `sensor.leneda_..._last_month_power_usage_over_reference`

These sensors make it much easier to track and estimate costs related to demand charges on your bill without requiring any extra `utility_meter` or `template` helpers.

---

### Advanced Example: Replicating Your Utility Bill
The following is a real-world example of how you can combine this integration's sensors with Home Assistant helpers to create a detailed, accurate calculation of your monthly electricity bill. This example is based on a real 2025 Creos invoice and includes all taxes and fees.

> **Note**: This example is designed for a **multi-meter setup** (e.g., one meter for the house and another for a heat pump or inverter), which is a common scenario. If you only have one meter, you can simplify the templates by removing the second sensor from the calculations.

#### Step 1: Create Template Sensors to Calculate Grid Import
Before calculating costs, it's best to create dedicated template sensors that accurately calculate your **billable grid import**. This is often more complex than just one sensor, as you may need to combine consumption from multiple meters and subtract any self-consumed solar energy.

Add the following to your `configuration.yaml` under the `template:` section.
*Replace `...METER_1...` and `...METER_2...` with the actual IDs from your Leneda sensor entities.*

```yaml
# configuration.yaml
template:
  - sensor:
      # --- SENSOR FOR CURRENT MONTH'S BILLABLE IMPORT (IMMEDIATE ESTIMATE) ---
      # Provides an immediate, running total for the current month.
      - name: "Billable Grid Import Current Month"
        unique_id: billable_grid_import_current_month
        unit_of_measurement: "kWh"
        device_class: energy
        state_class: total
        icon: mdi:transmission-tower-import
        state: >
          {# Get the running total consumption for the current month from both meters. #}
          {% set meter1_consumption = states('sensor.leneda_...METER_1..._04_current_month_consumption') | float(0) %}
          {% set meter2_consumption = states('sensor.leneda_...METER_2..._04_current_month_consumption') | float(0) %}

          {# Get the running total for self-consumed energy this month from your production meter. #}
          {% set self_consumed_pv = states('sensor.leneda_...METER_2..._37_current_month_s_locally_used_energy') | float(0) %}

          {# Calculate total consumption and subtract self-consumed to get the net import. #}
          {% set total_consumption_needed = meter1_consumption + meter2_consumption %}
          {% set net_import = max(0, total_consumption_needed - self_consumed_pv) %}

          {{ net_import | round(2) }}

      # --- SENSOR FOR LAST MONTH'S BILLABLE IMPORT (100% ACCURATE) ---
      # This sensor gets the final, accurate billable grid import for the last full month.
      - name: "Billable Grid Import Last Month"
        unique_id: billable_grid_import_last_month_calculated
        unit_of_measurement: "kWh"
        device_class: energy
        state_class: total
        icon: mdi:transmission-tower-import
        availability: >
          {{ 
            states('sensor.leneda_...METER_1..._05_previous_month_s_consumption') not in ['unknown', 'unavailable'] and
            states('sensor.leneda_...METER_2..._05_previous_month_s_consumption') not in ['unknown', 'unavailable'] and
            states('sensor.leneda_...METER_2..._39_last_month_s_locally_used_energy') not in ['unknown', 'unavailable']
          }}
        state: >
          {# Get consumption data from house and inverter meters for the last month. #}
          {% set meter1_consumption = states('sensor.leneda_...METER_1..._05_previous_month_s_consumption') | float(0) %}
          {% set meter2_consumption = states('sensor.leneda_...METER_2..._05_previous_month_s_consumption') | float(0) %}
          
          {# Get the amount of solar energy that was self-consumed last month. #}
          {% set self_consumed_pv = states('sensor.leneda_...METER_2..._39_last_month_s_locally_used_energy') | float(0) %}
          
          {# Calculate the total energy needed by all meters. #}
          {% set total_consumption_needed = meter1_consumption + meter2_consumption %}
          
          {# Billable import is what you still needed from the grid after consuming your own solar. #}
          {% set net_import = max(0, total_consumption_needed - self_consumed_pv) %}
          
          {{ net_import | round(2) }}
```

#### Step 2: Create Template Sensors for Final Bill Calculation
Finally, create template sensors that use the native Leneda sensors to calculate your final bill. This example calculates costs for both the previous month (100% accurate) and the current month (running estimate).

Continue by adding the following under the `template:` section in `configuration.yaml`:
```yaml
# configuration.yaml
template:
  - sensor:
      # (Add the sensors from Step 1 here if you haven't already)

      # --- SENSOR FOR LAST MONTH'S FINAL BILL (100% ACCURATE) ---
      - name: "Electric Cost Last Month"
        unique_id: electric_cost_last_month
        unit_of_measurement: "€"
        device_class: monetary
        icon: mdi:invoice-text-check
        state: >
          {# --- DEFINE ALL RATES FROM YOUR INVOICE --- #}
          {% set rate_energy_fixed = 1.50 %}         {# Redevance fixe (Énergie) #}
          {% set rate_energy_variable = 0.1500 %}    {# Composante énergie (€/kWh) #}
          {% set rate_network_metering = 5.90 %}     {# Comptage (Réseau) #}
          {% set rate_network_power_ref = 19.27 %}   {# Redevance Fixe (Réseau, for your reference power) #}
          {% set rate_network_variable = 0.0759 %}   {# Redevance volumétrique (€/kWh) #}
          {% set rate_exceedance = 0.1139 %}         {# Dépassement (€/kWh) #}
          {% set rate_compensation_fund = -0.0376 %} {# Fonds de compensation (€/kWh) - this is a credit #}
          {% set rate_electricity_tax = 0.0010 %}    {# Taxe électricité (€/kWh) #}
          {% set rate_vat = 0.08 %}                  {# TVA (8%) #}

          {# --- GET LAST MONTH'S FINAL USAGE DATA --- #}
          {% set total_grid_import_kwh = states('sensor.billable_grid_import_last_month') | float(0) %}
          {% set total_exceedance_kwh = states('sensor.leneda_...METER_1..._last_month_power_usage_over_reference') | float(0) %}

          {# --- CALCULATE COSTS, EXACTLY LIKE THE INVOICE --- #}
          {% set fixed_costs = rate_energy_fixed + rate_network_metering + rate_network_power_ref %}
          {% set variable_costs = total_grid_import_kwh * (rate_energy_variable + rate_network_variable + rate_compensation_fund + rate_electricity_tax) %}
          {% set exceedance_costs = total_exceedance_kwh * rate_exceedance %}
          {% set total_ht = fixed_costs + variable_costs + exceedance_costs %}
          {% set vat_amount = total_ht * rate_vat %}
          {% set final_cost = total_ht + vat_amount %}

          {{ final_cost | round(2) }}

      # --- SENSOR FOR CURRENT MONTH'S RUNNING BILL (ESTIMATE) ---
      - name: "Electric Cost Current Month"
        unique_id: electric_cost_current_month
        unit_of_measurement: "€"
        device_class: monetary
        icon: mdi:invoice-text-clock
        state: >
          {# --- DEFINE ALL RATES FROM YOUR INVOICE (same as above) --- #}
          {% set rate_energy_fixed = 1.50 %}
          {% set rate_energy_variable = 0.1500 %}
          {% set rate_network_metering = 5.90 %}
          {% set rate_network_power_ref = 19.27 %}
          {% set rate_network_variable = 0.0759 %}
          {% set rate_exceedance = 0.1139 %}
          {% set rate_compensation_fund = -0.0376 %}
          {% set rate_electricity_tax = 0.0010 %}
          {% set rate_vat = 0.08 %}

          {# --- GET CURRENT MONTH'S RUNNING USAGE DATA --- #}
          {% set total_grid_import_kwh = states('sensor.billable_grid_import_current_month') | float(0) %}
          {% set total_exceedance_kwh = states('sensor.leneda_...METER_1..._current_month_power_usage_over_reference') | float(0) %}

          {# --- CALCULATE RUNNING COSTS --- #}
          {% set fixed_costs = rate_energy_fixed + rate_network_metering + rate_network_power_ref %}
          {% set variable_costs = total_grid_import_kwh * (rate_energy_variable + rate_network_variable + rate_compensation_fund + rate_electricity_tax) %}
          {% set exceedance_costs = total_exceedance_kwh * rate_exceedance %}
          {% set total_ht = fixed_costs + variable_costs + exceedance_costs %}
          {% set vat_amount = total_ht * rate_vat %}
          {% set final_cost = total_ht + vat_amount %}

          {{ final_cost | round(2) }}
````

#### Step 3: Visualize Your Bill
Once you have created the template sensors from the previous steps, you can create a clear and concise card for your dashboard using the standard **Entities Card**.

```yaml
type: entities
title: Energy Bill Overview
entities:
  - type: section
    label: Current Month (Estimate)
  - entity: sensor.electric_cost_current_month
    name: Estimated Bill
  - entity: sensor.billable_grid_import_current_month
    name: Grid Import
  - entity: sensor.leneda_...METER_1..._current_month_power_usage_over_reference
    name: Power Exceedance
  - type: section
    label: Last Month (Final)
  - entity: sensor.electric_cost_last_month
    name: Final Bill
  - entity: sensor.billable_grid_import_last_month
    name: Grid Import
  - entity: sensor.leneda_...METER_1..._last_month_power_usage_over_reference
    name: Power Exceedance
```

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

The integration provides a wide range of sensors. The `...` in the entity ID will be replaced by your meter's unique identifier.

### Summary Sensors (kWh)
These are the main sensors for tracking aggregated usage over time.

| Entity ID Suffix | UI Name | Description |
|------------------|---------|-------------|
| `..._yesterdays_consumption` | Yesterday's Consumption | Total energy consumed yesterday. |
| `..._current_week_consumption` | Current Week Consumption | Total energy consumed from the start of the current week until yesterday. |
| `..._last_week_consumption` | Last Week's Consumption | Total energy consumed during the entire previous week. |
| `..._monthly_consumption` | Current Month Consumption | Total energy consumed from the start of the current month until yesterday. |
| `..._previous_month_consumption` | Previous Month's Consumption | Total energy consumed during the entire previous month. |
| `..._yesterdays_production` | Yesterday's Production | Total energy produced yesterday. |
| `..._current_week_production` | Current Week Production | Total energy produced from the start of the current week until yesterday. |
| `..._last_week_production` | Last Week's Production | Total energy produced during the entire previous week. |
| `..._monthly_production` | Current Month Production | Total energy produced from the start of the current month until yesterday. |
| `..._previous_month_production` | Previous Month's Production | Total energy produced during the entire previous month. |
| `..._yesterdays_exported_energy` | Yesterday's Exported Energy | Total energy exported to the grid yesterday. |
| `..._last_week_exported_energy` | Last Week's Exported Energy | Total energy exported during the previous week. |
| `..._monthly_exported` | Current Month's Exported Energy | Total energy exported from the start of the current month until yesterday. |
| `..._last_month_exported_energy` | Last Month's Exported Energy | Total energy exported during the entire previous month. |
| `..._yesterdays_self_consumed_energy` | Yesterday's Self-Consumed Energy | Total self-consumed energy yesterday. |
| `..._last_week_self_consumed_energy` | Last Week's Self-Consumed Energy | Total self-consumed energy during the previous week. |
| `..._monthly_self_consumed` | Current Month's Self-Consumed Energy | Total self-consumed energy from the start of the current month until yesterday. |
| `..._last_month_self_consumed_energy`| Last Month's Self-Consumed Energy | Total self-consumed energy during the entire previous month. |

### Gas Sensors
| Entity ID Suffix | UI Name | Description |
|------------------|---------|-------------|
| `..._gas_yesterdays_consumption` | GAS - Yesterday's Consumption | Total gas consumed yesterday (in kWh). |
| `..._gas_last_week_consumption` | GAS - Last Week's Consumption | Total gas consumed during the previous week (in kWh). |
| `..._gas_monthly_consumption` | GAS - Current Month's Consumption | Total gas consumed from the start of the current month until yesterday (in kWh). |
| `..._gas_last_month_consumption` | GAS - Last Month's Consumption | Total gas consumed during the entire previous month (in kWh). |

### Peak Power Sensors
These sensors show the highest 15-minute average power reading from the previous day. The timestamp of the peak is available as a state attribute.

| Entity ID Suffix | UI Name | Unit |
|------------------|---------|------|
| `..._peak_active_consumption` | Yesterday's Peak Active Consumption | kW |
| `..._peak_reactive_consumption` | Yesterday's Peak Reactive Consumption | kVAR |
| `..._peak_active_production` | Yesterday's Peak Active Production | kW |
| `..._peak_reactive_production` | Yesterday's Peak Reactive Production | kVAR |
| `..._gas_peak_consumed_energy` | GAS - Yesterday's Peak Consumed Energy | kWh |
| `..._gas_peak_consumed_volume` | GAS - Yesterday's Peak Consumed Volume | m³ |
| `..._gas_peak_consumed_standard_volume` | GAS - Yesterday's Peak Consumed Standard Volume | Nm³ |

### Energy Community & Sharing Sensors
These sensors provide detailed data about your participation in an energy community.

**Peak values from yesterday:**
- Yesterday's Peak Consumption Covered (L1-L4)
- Yesterday's Peak Remaining Consumption
- Yesterday's Peak Production Shared (L1-L4)
- Yesterday's Peak Remaining Production

**Aggregated totals from last month (in kWh):**
- Last Month's Consumption Covered (L1-L4)
- Last Month's Remaining Consumption
- Last Month's Production Shared (L1-L4)
- Last Month's Remaining Production

### Power Usage Over Reference
These sensors are only created if you configure the "Reference Power" option.

| Entity ID Suffix | UI Name | Description |
|------------------|---------|-------------|
| `..._yesterdays_power_usage_over_reference` | Yesterday's Power Usage Over Reference | Total energy (kWh) consumed above the reference power during the previous day. |
| `..._current_month_power_usage_over_reference` | Current Month's Power Usage Over Reference | Total energy (kWh) consumed above the reference power from the start of the current month until yesterday. |
| `..._last_month_power_usage_over_reference` | Last Month's Power Usage Over Reference | Total energy (kWh) consumed above the reference power during the entire previous calendar month. |

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

---
## ✍️ Author
This integration is authored and maintained by **[@koosoli](https://github.com/koosoli)** (Olivier Koos).
---

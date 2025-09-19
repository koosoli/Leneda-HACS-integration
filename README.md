# Leneda Home Assistant Integration

[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/koosoli/Leneda-HACS-integration)](https://github.com/koosoli/Leneda-HACS-integration/releases)
[![GitHub](https://img.shields.io/github/license/koosoli/Leneda-HACS-integration)](https://github.com/koosoli/Leneda-HACS-integration/blob/main/LICENSE)

A comprehensive Home Assistant integration for [Leneda](https://leneda.eu) smart energy meters in Luxembourg. Monitor your electricity and gas consumption, production, and energy community sharing data in real-time.

## 🚀 Features

### ⚡ **Smart Energy Monitoring**
- **Real-time Data**: Live power consumption and production (15-minute updates)
- **Historical Analytics**: Hourly, daily, weekly, and monthly energy statistics
- **Gas Metering**: Support for gas volume (m³, Nm³) and energy (kWh) measurements
- **Energy Communities**: Track production sharing across multiple layers (AIR, ACR/ACF/AC1, CEL, APS/CER/CEN)

### 🔄 **Device Consolidation** 
- **Unified Meters**: Automatically merges production and consumption data from the same physical meter
- **Smart Grouping**: Groups sensors by base meter ID to avoid duplicate devices
- **Zero-Value Protection**: Preserves previous values when API calls fail instead of showing zero

### 🛡️ **Robust Error Handling**
- **Network Resilience**: Handles DNS timeouts and connectivity issues gracefully
- **Data Integrity**: Maintains sensor availability even when temporary data is missing
- **Intelligent Fallbacks**: Keeps previous values during network outages

### 📊 **Comprehensive Sensors** (35 total)

#### **Energy Consumption & Production**
- 15-minute, hourly, daily, weekly, monthly aggregations
- Real-time active/reactive power measurements 
- Yesterday's and previous month's consumption/production

#### **Gas Sensors** (with GAS prefix)
- **GAS - Measured Consumed Volume** (m³)
- **GAS - Measured Consumed Standard Volume** (Nm³)  
- **GAS - Measured Consumed Energy** (kWh)

#### **Energy Community Sharing**
- Production sharing across 4 community layers
- Consumption covered by shared production
- Remaining consumption/production after sharing

## 📦 Installation

### Method 1: HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to **Integrations** 
3. Click the **⋮** menu → **Custom repositories**
4. Add repository URL: `https://github.com/koosoli/Leneda-HACS-integration`
5. Category: **Integration**
6. Click **Add** → **Install**
7. **Restart** Home Assistant

### Method 2: Manual Installation

1. Download the latest release from [GitHub](https://github.com/koosoli/Leneda-HACS-integration/releases)
2. Extract to `config/custom_components/leneda/`
3. Restart Home Assistant

## ⚙️ Configuration

### Step 1: Get Leneda API Credentials

1. Visit [Leneda Portal](https://portal.leneda.eu)
2. Log in to your account
3. Navigate to **API Keys** section
4. Generate a new API key
5. Note your **Energy ID** and **Metering Point ID**

📚 [Detailed API key tutorial](https://leneda.eu/en/docs/how-to-generate-and-manage-api-keys.html)

### Step 2: Add Integration

1. Go to **Settings** → **Devices & Services**
2. Click **+ Add Integration**
3. Search for **"Leneda"**
4. Enter your credentials:
   - **API Key**: Your generated API key
   - **Energy ID**: Your Leneda Energy ID (format: LUXE-xx-yy-zzzz)
   - **Metering Point ID**: Your meter ID (format: LU + 34 characters)

### Step 3: Verify Setup

The integration will automatically create:
- ✅ One device per physical meter (consolidated)
- ✅ 35 sensors with proper numbering and GAS prefixes
- ✅ Proper device classes for energy, power, and gas sensors

## 🏠 Usage Examples

### Energy Dashboard Integration

Add Leneda sensors to your Home Assistant Energy Dashboard:

```yaml
# configuration.yaml
energy:
  sources:
    - stat: sensor.leneda_03_current_day_consumption
      name: "Daily Consumption"
    - stat: sensor.leneda_21_current_day_production
      name: "Solar Production"
```

### Automations

Create smart automations based on energy data:

```yaml
# Notify when high consumption detected
automation:
  - alias: "High Energy Consumption Alert"
    trigger:
      - platform: numeric_state
        entity_id: sensor.leneda_02_hourly_consumption
        above: 5.0
    action:
      - service: notify.mobile_app
        data:
          message: "High energy consumption: {{ states('sensor.leneda_02_hourly_consumption') }} kWh"
```

### Lovelace Dashboard

```yaml
# Dashboard card example
type: entities
title: "Energy Overview"
entities:
  - sensor.leneda_03_current_day_consumption
  - sensor.leneda_21_current_day_production
  - sensor.leneda_09_measured_active_consumption
  - sensor.leneda_27_measured_active_production
  - sensor.leneda_11_gas_measured_consumed_energy
```

##   Energy Billing & Auto-Consumption Calculations

### Understanding Your Energy Flow

With solar panels and smart meters, understanding your energy billing involves tracking multiple energy flows. Here's how to calculate key metrics using Leneda sensors:

#### **Meter Setup Types**

**Single Meter (Net Metering)**
- House consumption meter shows net import/export
- Solar production tracked separately
- Auto-consumption calculated from difference

**Multiple Meters (Separate Metering)**  
- House consumption: `LU...070056600` (example)
- Solar inverter consumption: `LU...070590176` 
- Solar production: `LU...770590176`
- More precise tracking of energy flows

### 📊 **Key Calculations**

#### **Solar Auto-Consumption**
```
Auto-Consumed Solar = Solar Production - Grid Export
```

**Using Leneda Sensors:**
```yaml
# If you have grid export data (sensor 33)
template:
  - sensor:
      name: "Solar Auto-Consumption Today"
      unit_of_measurement: "kWh"
      state: >
        {% set production = states('sensor.leneda_21_current_day_production') | float %}
        {% set export = states('sensor.leneda_33_remaining_production_after_sharing') | float %}
        {{ (production - export) | round(2) }}
```

#### **Self-Sufficiency Percentage**
```
Self-Sufficiency = (Auto-Consumed Solar / Total House Consumption) × 100%
```

**Template Sensor:**
```yaml
template:
  - sensor:
      name: "Self Sufficiency Today"
      unit_of_measurement: "%"
      state: >
        {% set consumption = states('sensor.leneda_03_current_day_consumption') | float %}
        {% set production = states('sensor.leneda_21_current_day_production') | float %}
        {% set auto_consumed = min(consumption, production) %}
        {% if consumption > 0 %}
          {{ ((auto_consumed / consumption) * 100) | round(1) }}
        {% else %}
          0
        {% endif %}
```

#### **Grid Import/Export Balance**
```
Net Grid Balance = Grid Import - Grid Export
Positive = You pay for net import
Negative = You get paid for net export
```

**Template Sensors:**
```yaml
template:
  - sensor:
      # Grid Import (what you pay for)
      name: "Grid Import Today"
      unit_of_measurement: "kWh"
      state: >
        {% set consumption = states('sensor.leneda_03_current_day_consumption') | float %}
        {% set production = states('sensor.leneda_21_current_day_production') | float %}
        {{ max(0, consumption - production) | round(2) }}

  - sensor:
      # Grid Export (what you get paid for)  
      name: "Grid Export Today"
      unit_of_measurement: "kWh"
      state: >
        {% set consumption = states('sensor.leneda_03_current_day_consumption') | float %}
        {% set production = states('sensor.leneda_21_current_day_production') | float %}
        {{ max(0, production - consumption) | round(2) }}
```

#### **Energy Cost Calculation**
```yaml
template:
  - sensor:
      name: "Daily Energy Cost"
      unit_of_measurement: "€"
      state: >
        {% set import_kwh = states('sensor.grid_import_today') | float %}
        {% set export_kwh = states('sensor.grid_export_today') | float %}
        {% set import_rate = 0.30 %}  # €/kWh - adjust to your rate
        {% set export_rate = 0.05 %}  # €/kWh - adjust to your feed-in tariff
        {{ ((import_kwh * import_rate) - (export_kwh * export_rate)) | round(2) }}
```

### 🏠 **Multiple Meter Scenarios**

#### **Main Solar + Balkonkraftwerk Setup**

If you have both main solar panels and a Balkonkraftwerk (plug-in solar):

```yaml
template:
  - sensor:
      name: "Total Solar Auto-Consumption"
      unit_of_measurement: "kWh"
      state: >
        {% set house_net = states('sensor.leneda_6600_03_current_day_consumption') | float %}
        {% set main_solar = states('sensor.leneda_0176_21_current_day_production') | float %}
        {% set main_export = states('sensor.leneda_0176_33_remaining_production_after_sharing') | float(0) %}
        {% set main_auto = main_solar - main_export %}
        # Balkonkraftwerk auto-consumption is already included in reduced house consumption
        # This shows minimum known auto-consumption from main solar
        {{ main_auto | round(2) }}
```

#### **Inverter Efficiency Tracking**

```yaml
template:
  - sensor:
      name: "Solar System Efficiency"
      unit_of_measurement: "%"
      state: >
        {% set production = states('sensor.leneda_0176_21_current_day_production') | float %}
        {% set inverter_consumption = states('sensor.leneda_0176_03_current_day_consumption') | float %}
        {% if production > 0 %}
          {{ (((production - inverter_consumption) / production) * 100) | round(1) }}
        {% else %}
          100
        {% endif %}
```

### 📈 **Energy Dashboard Integration**

Add calculated sensors to Home Assistant's Energy Dashboard:

```yaml
# configuration.yaml
energy:
  sources:
    # Grid Import (what you pay for)
    - stat: sensor.grid_import_today
      name: "Grid Import"
    # Solar Production  
    - stat: sensor.leneda_21_current_day_production
      name: "Solar Production"
  grid_consumption:
    # Net house consumption
    - stat: sensor.leneda_03_current_day_consumption
      name: "House Consumption"
  solar:
    # Solar panels
    - stat: sensor.leneda_21_current_day_production
      name: "Solar Panels"
```

### 💡 **Advanced Analytics**

#### **Monthly Energy Summary**
```yaml
template:
  - sensor:
      name: "Monthly Energy Summary"
      state: "OK"
      attributes:
        house_consumption: "{{ states('sensor.leneda_07_current_month_consumption') }}"
        solar_production: "{{ states('sensor.leneda_25_current_month_production') }}"
        self_sufficiency: >
          {% set consumption = states('sensor.leneda_07_current_month_consumption') | float %}
          {% set production = states('sensor.leneda_25_current_month_production') | float %}
          {% if consumption > 0 %}
            {{ ((min(consumption, production) / consumption) * 100) | round(1) }}%
          {% else %}
            0%
          {% endif %}
        estimated_savings: >
          {% set production = states('sensor.leneda_25_current_month_production') | float %}
          {% set rate = 0.30 %}
          {{ (production * rate) | round(2) }}€
```

#### **Peak Consumption Analysis**
```yaml
# Monitor peak power usage
automation:
  - alias: "High Power Consumption Alert"
    trigger:
      platform: numeric_state
      entity_id: sensor.leneda_09_measured_active_consumption
      above: 5.0  # kW threshold
    action:
      service: notify.mobile_app
      data:
        title: "High Power Usage"
        message: "Current consumption: {{ states('sensor.leneda_09_measured_active_consumption') }} kW"
```

### 📋 **Billing Period Sensors**

Create sensors that align with your energy provider's billing cycle:

```yaml
template:
  - sensor:
      name: "Billing Period Consumption"
      unit_of_measurement: "kWh"  
      state: >
        {# Adjust dates to match your billing cycle #}
        {% set start_date = '2024-09-01' %}
        {% set end_date = '2024-09-30' %}
        {# This would require additional date-based calculations #}
        {{ states('sensor.leneda_07_current_month_consumption') }}
```

**Note**: These calculations provide insights into your energy usage and potential savings. Actual billing may include additional fees, taxes, and rate structures not reflected in these basic calculations.

##  🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Sensors show "Unavailable"** | Check API credentials and network connectivity |
| **15-minute sensors show 0.00 kWh** | Fixed in v0.1.8 - update the integration |
| **Gas sensors missing GAS prefix** | Update to v0.1.8 or later |
| **Duplicate devices for same meter** | Device consolidation automatic in v0.1.8+ |

### Debug Logging

Enable debug logging for troubleshooting:

```yaml
# configuration.yaml
logger:
  default: info
  logs:
    custom_components.leneda: debug
```

### Network Issues

The integration handles DNS timeouts and network issues automatically:
- Previous values are preserved during outages
- Sensors remain available even with temporary data loss
- Automatic retry logic with exponential backoff

## 📋 Sensor Reference

### Energy Sensors (kWh)
| # | Sensor Name | Description | Update Frequency |
|---|-------------|-------------|------------------|
| 01 | 15-Minute Consumption | Recent consumption | 15 minutes |
| 02 | Hourly Consumption | Current hour | Hourly |
| 03 | Current Day Consumption | Today's total | 15 minutes |
| 04 | Yesterday's Consumption | Previous day | Daily |
| 19-26 | Production equivalents | Solar/wind production | Same as consumption |

### Power Sensors (kW/kVAR)
| # | Sensor Name | OBIS Code | Description |
|---|-------------|-----------|-------------|
| 09 | Measured Active Consumption | 1-1:1.29.0 | Live power draw |
| 10 | Measured Reactive Consumption | 1-1:3.29.0 | Reactive power |
| 27 | Measured Active Production | 1-1:2.29.0 | Live generation |
| 28 | Measured Reactive Production | 1-1:4.29.0 | Reactive generation |

### Gas Sensors
| # | Sensor Name | OBIS Code | Unit | Description |
|---|-------------|-----------|------|-------------|
| 11 | GAS - Measured Consumed Energy | 7-20:99.33.17 | kWh | Gas energy consumption |
| 12 | GAS - Measured Consumed Volume | 7-1:99.23.15 | m³ | Gas volume consumption |
| 13 | GAS - Measured Consumed Standard Volume | 7-1:99.23.17 | Nm³ | Normalized gas volume |

## 🆕 Changelog

### v0.1.8 (Current)
- ✅ Fixed 15-minute and hourly sensors showing 0.00 kWh
- ✅ Improved error handling for DNS timeouts 
- ✅ Added device consolidation for production/consumption meters
- ✅ Added GAS prefix to all gas sensors
- ✅ Enhanced zero-value handling to preserve previous data
- ✅ Comprehensive code documentation
- ✅ Better sensor availability logic

### v0.1.7 
- Gas sensor regression issues (fixed in 0.1.8)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper documentation
4. Submit a pull request

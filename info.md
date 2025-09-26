# Leneda Smart Energy Integration

Comprehensive Home Assistant integration for Leneda smart meters in Luxembourg. Monitor electricity, gas, and energy community data with 35 intelligent sensors.

## 🚀 Key Features

### ⚡ **Smart Energy Monitoring**
- **Power Measurements**: Consumption/production from the previous day (kW, kVAR)
- **Historical Energy**: 15-min, hourly, daily, weekly, monthly (kWh)
- **Gas Metering**: Volume (m³) and energy (kWh) with GAS prefix
- **Energy Communities**: Production sharing across 4 community layers

### 🔄 **Device Consolidation** 
- **Unified Meters**: Automatically merges production/consumption from same physical meter
- **Zero-Value Protection**: Preserves data during API failures instead of showing zero
- **Network Resilience**: Handles DNS timeouts and connectivity issues gracefully

### 📊 **35 Comprehensive Sensors**

#### **Energy Analytics** (18 sensors)
- 15-Minute/Hourly/Daily/Weekly/Monthly consumption & production
- Yesterday's and previous month's statistics
- Active and reactive power measurements from the previous day

#### **Gas Monitoring** (3 sensors with GAS prefix)
- GAS - Measured Consumed Energy (kWh)
- GAS - Measured Consumed Volume (m³) 
- GAS - Measured Consumed Standard Volume (m³)

#### **Energy Community Sharing** (14 sensors)
- Production sharing across 4 layers (AIR, ACR/ACF/AC1, CEL, APS/CER/CEN)
- Consumption covered by shared production
- Remaining consumption/production after community sharing

## 🔧 Recent Improvements (v0.1.8)

✅ **Fixed** 15-minute and hourly sensors showing 0.00 kWh  
✅ **Enhanced** error handling for network timeouts  
✅ **Added** device consolidation for duplicate meters  
✅ **Improved** gas sensor identification with GAS prefix  
✅ **Better** data preservation during API outages

## ⚙️ Setup Requirements

- **Leneda Account**: Active account with API access
- **API Credentials**: API Key, Energy ID, and Metering Point ID
- **Network Access**: Internet connection to api.leneda.eu

Get your API credentials from the [Leneda Portal](https://portal.leneda.eu) - detailed instructions in the [documentation](https://leneda.eu/en/docs/how-to-generate-and-manage-api-keys.html).

## 🏠 Perfect For

- **Solar Panel Owners**: Track production, consumption, and energy sharing
- **Energy Communities**: Monitor multi-layer production sharing  
- **Gas Customers**: Complete gas consumption monitoring with proper units
- **Energy Analytics**: Historical trends and monitoring
- **Home Automation**: Smart automations based on energy data

Data is provided in 15-minute intervals from the previous day, updated hourly.
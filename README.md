# ⚡ Leneda HACS Integration (v2.0)

![HACS Default](https://img.shields.io/badge/HACS-Default-orange.svg?style=for-the-badge&logo=homeassistant)
![Version](https://img.shields.io/github/v/release/koosoli/Leneda-HACS-integration?style=for-the-badge&color=blue)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support%20my%20work-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/koosoli)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-koosoli-EA4AAA?style=for-the-badge&logo=github-sponsors)](https://github.com/sponsors/koosoli)

> **The ultimate energy monitoring experience for Leneda smart meters in Luxembourg.**  
> Completely rewritten from the ground up to offer an "Avant-Garde" visualization, robust device consolidation, and seamless integration.

---

## 🌟 What's New in v2.0?

This isn't just an update; it's a **whole new software**:
- **🎨 Avant-Garde Dashboard**: A stunning, custom-built energy dashboard with glassmorphism, animated flows, and comprehensive stats.
- **🧩 Device Consolidation**: Automatically groups consumption, production, and gas meters into a single, logical "Leneda" device.
- **⚡ Real-Time Flow**: (Simulated) real-time animations based on your daily data to visualize energy movement.
- **🔋 Energy Community Support**: Native support for tracking shared energy within communities.
- **🛠️ Self-Repairing**: Automatically handles API outages and preserves sensor states.

---

## 🚀 Features

### 📊 Smart Energy Monitoring
- **Complete History**: Access yesterday's, last week's, and last month's data with pinpoint accuracy.
- **Gas Integration**: Full support for gas volume (m³) and energy (kWh).
- **Zero-Config Calculations**: Automatically calculates self-consumption, grid export, and community sharing without complex templates.

### 💎 The "Elite" Visual Experience
The integration includes a standalone dashboard panel that provides:
- **Interactive Graphs**: Zoomable, panning charts for granular analysis.
- **Visual Flow**: Beautifully animated energy flow diagrams.
- **Metric Insights**: Instant visibility into peak power, self-sufficiency, and costs.

---

## 📦 Installation

### Option 1: HACS (Recommended)
1. Open **HACS** in Home Assistant.
2. Go to **Integrations**.
3. Click the **⋮ menu** (top right) ➜ **Custom repositories**.
4. Add this URL: `https://github.com/koosoli/Leneda-HACS-integration`
5. Category: **Integration**.
6. Find **Leneda** in the list and click **Download**.
7. Restart Home Assistant.

### Option 2: Manual
1. Download the latest release from the [Releases Page](https://github.com/koosoli/Leneda-HACS-integration/releases).
2. Extract the `custom_components/leneda` folder into your HA `config/custom_components/` directory.
3. Restart Home Assistant.

---

## ⚙️ Configuration

1. Go to **Settings ➜ Devices & Services**.
2. Click **+ Add Integration**.
3. Search for **Leneda**.
4. Enter your **API Key** and **Metering Point IDs** (found in the Leneda Portal).
5. (Optional) Set a **Reference Power** entity to track excess usage charges.

---

## ☕ Support the Project

If this integration makes your energy management easier (or just looks cool on your wall), consider buying me a coffee!

<a href="https://buymeacoffee.com/koosoli">
  <img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=koosoli&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" />
</a>

Or sponsor me on GitHub: [**github.com/sponsors/koosoli**](https://github.com/sponsors/koosoli)

---

## Credits
Authored by **[@koosoli](https://github.com/koosoli)**.  

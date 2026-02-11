# Changelog

All notable changes to the **Leneda HACS Integration** will be documented in this file.

## [v2.0.1] - 2026-02-11

### 🚀 New Features
- **Per-Panel Energy Chart:** Visualize individual solar production sources with a new stacked bar chart. Now featuring distinct, high-contrast Lime/Teal/Emerald colors (#BEF527) for clear differentiation.
- **Multi-Meter Sensor Support:** Sensors are now correctly grouped under their respective physical meter devices (Consumption, Production, Gas) in Home Assistant.
- **Solar-Adjusted Exceedance:** Exceedance calculations now correctly subtract concurrent solar production from consumption at 15-minute intervals. `Overage = max(0, (Consumption - Solar) - Reference)`.

### 🐛 Bug Fixes
- **Feed-In Tariff Persistence:** Fixed a critical issue where configured feed-in tariffs were not saving correctly due to a field name collision.
- **Year Range Logic:** "This Year" and "Last Year" buttons now work correctly in both HA and local dev (fixed missing logic cases).
- **Average Feed-In Rate:** Hardened calculation logic to prevent NaN values when sensors are unavailable.
- **Local Development:** Added support for multi-meter visualization and proper year ranges in the local dev environment.

## [v2.0.0] - 2026-02-10

### 🚀 Major Rewrites
- **Complete Overhaul**: The integration has been rewritten from the ground up for better performance, stability, and maintainability.
- **New Frontend Architecture**: Introduced a dedicated `frontend-src` directory using modern web technologies (Vite, TypeScript, standard web components) replaces the old dashboard logic.
- **Standalone Mode**: Added a `standalone` server for easier development and testing of the dashboard outside of Home Assistant.

### ✨ New Features
- **Avant-Garde Dashboard**: A completely new, high-performance visualization dashboard featuring:
  - Glassmorphism UI design.
  - Real-time animated energy flow.
  - Interactive, zoomable charts.
  - Comprehensive statistical breakdown (Self-sufficiency, Peak Power, etc.).
- **Device Consolidation**: Logic to automatically group multiple physical meters into single logical devices in Home Assistant.
- **Energy Community Support**: First-class support for tracking shared energy production and community consumption.
- **Robust Error Handling**: Improved resilience against API outages; the integration now gracefully handles connection drops without losing sensor state.

### 🛠️ Infrastructure
- **CI/CD Pipelines**: Added GitHub Actions for:
  - Automated Releases (`release.yaml`).
  - GitHub Pages deployment (`deploy_pages.yaml`).
- **Documentation**: 
  - Redrafted `README.md` with clearer instructions and visual badges.
  - Added `SETUP_GUIDE.md` for developers.

### 🗑️ Removed
- Legacy "Basic" dashboard implementation.
- Redundant helper scripts from the `Old-workingbutbasic` version.

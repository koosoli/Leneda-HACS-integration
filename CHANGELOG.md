# Changelog

All notable changes to the **Leneda HACS Integration** will be documented in this file.

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

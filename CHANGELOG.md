# Changelog

All notable changes to the **Leneda HACS Integration** will be documented in this file.

## [Unreleased]

## [v2.0.5] - 2026-03-09

### Bug Fixes
- **Import Hotfix:** Restored the missing `get_effective_reference_power` helper so Home Assistant can import the Leneda integration successfully again.
- **Reference Power Consistency:** Exceedance calculations now use the same effective reference-power source as the dashboard config and API.
- **Timeseries API Stability:** Fixed the dashboard timeseries endpoint so it resolves meter routes correctly instead of failing with `routes is not defined`.
- **Weekly Range Guard:** Fixed Monday and month-boundary date ranges that could send `start > end` requests to Leneda and break dashboard loading with API 400/500 errors.

### Improvements
- **Repo Consolidation:** Removed the duplicate local codebase so the Git repository is the single source of truth for ongoing work.

## [v2.0.4] - 2026-03-08

### New Features
- **Light/Dark Theme Toggle:** Added a persistent theme switch for the entire dashboard, including charts and the energy-flow scene.
- **Scheduled Tariff Windows:** Added configurable time-of-use supplier pricing windows by day group and time range.
- **Scheduled Reference Windows:** Added alternate reference-power windows for contracts with different reference values at different times.
- **Monthly Contract Discount:** Added a prorated `Connect Discount` field that is shown explicitly on the invoice and applied before VAT.

### Bug Fixes
- **Reference Power Exceedance Sync:** Manual and scheduled reference-power settings now drive exceedance calculations consistently in the backend and invoice views.
- **Settings Scroll Position:** Adding or removing tariff/reference windows no longer jumps the Settings page back to the top.
- **Local Dev Launcher:** The frontend dev batch file now targets `http://localhost:5175/`, avoids accidental port changes, and restores the browser-open workflow for local testing.
- **Multi-Entry Meter Loss:** Fixed a Home Assistant bug where separate Leneda entries could make the dashboard/API show only one configured meter set instead of combining electricity and gas.

### Improvements
- **Energy Flow Visuals:** Reworked the dashboard energy-flow graphic for clearer grid, solar, home, and community routing with more readable visual emphasis.
- **Manual Local Testing Docs:** Added README instructions for running the dashboard locally without batch files.

## [v2.0.3] - 2026-02-12

### Build & Deployment
- **Build Automation:** Added `build-dashboard.bat` to automate the process of building the frontend and syncing it to the Home Assistant integration directory.
- **Version Sync:** Unified versioning across `manifest.json`, `package.json`, and the Dashboard UI.

## [v2.0.2] - 2026-02-12

### Mobile Responsiveness Overhaul
- **Responsive Navigation:** Replaced the desktop-only navigation bar with a mobile-friendly hamburger menu for screens smaller than 768px.
- **Scrollable Time Selector:** The range selector now supports horizontal touch scrolling, preventing the entire page from panning.
- **Adaptive Modules:** Optimized the dashboard layout for small screens, stacking stat cards, energy flow, and key metrics vertically for better legibility.
- **Touch-Optimized UI:** Increased spacing and touch targets across the dashboard for a premium mobile experience.

## [v2.0.1] - 2026-02-11

### New Features
- **Per-Panel Energy Chart:** Visualize individual solar production sources with a new stacked bar chart. Now featuring distinct, high-contrast Lime/Teal/Emerald colors (#BEF527) for clear differentiation.
- **Multi-Meter Sensor Support:** Sensors are now correctly grouped under their respective physical meter devices (Consumption, Production, Gas) in Home Assistant.
- **Solar-Adjusted Exceedance:** Exceedance calculations now correctly subtract concurrent solar production from consumption at 15-minute intervals. `Overage = max(0, (Consumption - Solar) - Reference)`.

### Bug Fixes
- **Feed-In Tariff Persistence:** Fixed a critical issue where configured feed-in tariffs were not saving correctly due to a field name collision.
- **Year Range Logic:** "This Year" and "Last Year" buttons now work correctly in both HA and local dev (fixed missing logic cases).
- **Average Feed-In Rate:** Hardened calculation logic to prevent NaN values when sensors are unavailable.
- **Local Development:** Added support for multi-meter visualization and proper year ranges in the local dev environment.

## [v2.0.0] - 2026-02-10

### Major Rewrites
- **Complete Overhaul**: The integration has been rewritten from the ground up for better performance, stability, and maintainability.
- **New Frontend Architecture**: Introduced a dedicated `frontend-src` directory using modern web technologies (Vite, TypeScript, standard web components) replaces the old dashboard logic.
- **Standalone Mode**: Added a `standalone` server for easier development and testing of the dashboard outside of Home Assistant.

### New Features
- **Avant-Garde Dashboard**: A completely new, high-performance visualization dashboard featuring:
- Glassmorphism UI design.
- Real-time animated energy flow.
- Interactive, zoomable charts.
- Comprehensive statistical breakdown (Self-sufficiency, Peak Power, etc.).
- **Device Consolidation**: Logic to automatically group multiple physical meters into single logical devices in Home Assistant.
- **Energy Community Support**: First-class support for tracking shared energy production and community consumption.
- **Robust Error Handling**: Improved resilience against API outages; the integration now gracefully handles connection drops without losing sensor state.

### Infrastructure
- **CI/CD Pipelines**: Added GitHub Actions for:
- Automated Releases (`release.yaml`).
- GitHub Pages deployment (`deploy_pages.yaml`).
- **Documentation**:
- Redrafted `README.md` with clearer instructions and visual badges.
- Added `SETUP_GUIDE.md` for developers.

### Removed
- Legacy "Basic" dashboard implementation.
- Redundant helper scripts from the `Old-workingbutbasic` version.

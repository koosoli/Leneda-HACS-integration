# Leneda Dashboard — Standalone Mode

Run the Leneda energy dashboard as a standalone web application, without Home Assistant.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- Built frontend (the `start` script will build automatically if needed)

## Quick Start

### Windows
Double-click `start.bat` or run:
```cmd
start.bat
```

### Linux / macOS
```bash
chmod +x start.sh
./start.sh
```

### Manual
```bash
node server.js
```

The dashboard will be available at **http://localhost:5175**.

## First Run

1. Open the dashboard in your browser
2. You'll be redirected to **Settings**
3. Enter your Leneda API credentials:
   - **API Key** — from your Leneda portal account
   - **Energy ID** — your energy community ID (e.g. `LU-123-456-789`)
   - **Metering Point ID** — your smart meter ID (e.g. `LUXXXXXXX...`)
4. Click **Test Connection** to verify
5. Click **Save Credentials**
6. Navigate to the Dashboard tab to see your energy data

## Configuration

Credentials and billing settings are stored in `config.json` (created automatically).

## Custom Port

```bash
PORT=8080 node server.js
```

## Home Assistant vs Standalone

| Feature | Home Assistant (HACS) | Standalone |
|---------|----------------------|------------|
| Credentials | Configured in HA Integrations | Configured in Settings tab |
| Sensors | Full HA sensor entities (57+) | Dashboard view only |
| Data updates | Automatic via coordinator | On-demand when dashboard is open |
| Billing config | Stored in HA | Stored in local config.json |
| Panel access | HA sidebar | Direct URL |

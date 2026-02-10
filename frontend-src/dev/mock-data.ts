/**
 * Mock API data for local development.
 *
 * Provides realistic Luxembourg energy data so the dashboard can be
 * developed and tested without a running Home Assistant instance.
 */

import type {
  RangeData,
  TimeseriesResponse,
  SensorsResponse,
  BillingConfig,
} from "../src/api/leneda";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// ── Dev config file (persists across HMR reloads) ───────────────

const DEV_CONFIG_FILE = resolve(__dirname, "dev-config.json");

function loadDevConfig(): { credentials: typeof DEFAULT_CREDENTIALS; billing: BillingConfig } {
  try {
    if (existsSync(DEV_CONFIG_FILE)) {
      return JSON.parse(readFileSync(DEV_CONFIG_FILE, "utf8"));
    }
  } catch { /* ignore */ }
  return { credentials: { ...DEFAULT_CREDENTIALS }, billing: { ...DEFAULT_BILLING } };
}

function saveDevConfig(cfg: { credentials: typeof DEFAULT_CREDENTIALS; billing: BillingConfig }): void {
  writeFileSync(DEV_CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf8");
}

// ── Helpers ─────────────────────────────────────────────────────

function jitter(base: number, pct = 0.15): number {
  return +(base * (1 + (Math.random() * 2 - 1) * pct)).toFixed(4);
}

function yesterday(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ── Range data per period ───────────────────────────────────────

const RANGE_DATA: Record<string, RangeData> = {
  yesterday: {
    range: "yesterday",
    consumption: 12.34,
    production: 8.76,
    exported: 5.21,
    self_consumed: 3.55,
    shared: 1.8,
    shared_with_me: 2.1,
    peak_power_kw: 3.42,
    exceedance_kwh: 0,
    gas_energy: 24.5,
    gas_volume: 2.31,
    metering_point: "LU0000000000000000000000000MOCK01",
  },
  this_week: {
    range: "this_week",
    consumption: 68.9,
    production: 45.2,
    exported: 27.1,
    self_consumed: 18.1,
    shared: 9.4,
    shared_with_me: 11.2,
    peak_power_kw: 4.1,
    exceedance_kwh: 0,
    gas_energy: 142.3,
    gas_volume: 13.4,
    metering_point: "LU0000000000000000000000000MOCK01",
  },
  last_week: {
    range: "last_week",
    consumption: 82.5,
    production: 52.8,
    exported: 31.6,
    self_consumed: 21.2,
    shared: 12.3,
    shared_with_me: 14.6,
    peak_power_kw: 5.8,
    exceedance_kwh: 0.82,
    gas_energy: 168.7,
    gas_volume: 15.9,
    metering_point: "LU0000000000000000000000000MOCK01",
  },
  this_month: {
    range: "this_month",
    consumption: 245.6,
    production: 178.4,
    exported: 106.9,
    self_consumed: 71.5,
    shared: 38.2,
    shared_with_me: 44.0,
    peak_power_kw: 6.2,
    exceedance_kwh: 3.45,
    gas_energy: 512.3,
    gas_volume: 48.3,
    metering_point: "LU0000000000000000000000000MOCK01",
  },
  last_month: {
    range: "last_month",
    consumption: 310.2,
    production: 198.7,
    exported: 119.2,
    self_consumed: 79.5,
    shared: 42.8,
    shared_with_me: 50.1,
    peak_power_kw: 5.5,
    exceedance_kwh: 1.92,
    gas_energy: 620.1,
    gas_volume: 58.5,
    metering_point: "LU0000000000000000000000000MOCK01",
  },
};

// ── Timeseries: generate 15-min intervals for any date range ────

function generateTimeseries(
  obis: string,
  baseValue: number,
  startDate?: Date,
  endDate?: Date,
): TimeseriesResponse {
  const { start: defStart, end: defEnd } = yesterday();
  const start = startDate ?? defStart;
  const end = endDate ?? defEnd;
  const durationMs = end.getTime() - start.getTime();
  const numIntervals = Math.max(1, Math.ceil(durationMs / (15 * 60_000)));

  const items = Array.from({ length: numIntervals }, (_, i) => {
    const ts = new Date(start.getTime() + i * 15 * 60_000);
    // Solar curve: low at night, peak at midday
    const hour = ts.getHours() + ts.getMinutes() / 60;
    let multiplier = 1;
    if (obis.includes(":2.29.0")) {
      // Production — bell curve 6h-20h
      multiplier =
        hour >= 6 && hour <= 20
          ? Math.exp(-0.5 * ((hour - 13) / 3) ** 2)
          : 0;
    } else {
      // Consumption — higher morning/evening
      multiplier =
        0.3 +
        0.4 * Math.exp(-0.5 * ((hour - 8) / 2) ** 2) +
        0.5 * Math.exp(-0.5 * ((hour - 19) / 2) ** 2);
    }
    return {
      value: +(baseValue * multiplier * jitter(1, 0.1)).toFixed(3),
      startedAt: ts.toISOString(),
      type: "Measured",
      version: 1,
      calculated: false,
    };
  });

  return {
    obis,
    unit: "kW",
    interval: "PT15M",
    items,
  };
}

// ── Sensors ─────────────────────────────────────────────────────

const MOCK_SENSORS: SensorsResponse = {
  metering_point: "LU0000000000000000000000000MOCK01",
  sensors: [
    { key: "c_01_total_consumption", value: 4523.7, name: "Total Consumption", unit: "kWh", peak_timestamp: null },
    { key: "c_04_yesterday_consumption", value: 12.34, name: "Yesterday Consumption", unit: "kWh", peak_timestamp: null },
    { key: "c_05_weekly_consumption", value: 68.9, name: "Weekly Consumption", unit: "kWh", peak_timestamp: null },
    { key: "c_07_monthly_consumption", value: 245.6, name: "Monthly Consumption", unit: "kWh", peak_timestamp: null },
    { key: "c_10_peak_consumption", value: 3.42, name: "Peak Consumption", unit: "kW", peak_timestamp: "2026-02-08T18:30:00Z" },
    { key: "p_01_total_production", value: 3210.5, name: "Total Production", unit: "kWh", peak_timestamp: null },
    { key: "p_04_yesterday_production", value: 8.76, name: "Yesterday Production", unit: "kWh", peak_timestamp: null },
    { key: "p_05_weekly_production", value: 45.2, name: "Weekly Production", unit: "kWh", peak_timestamp: null },
    { key: "p_07_monthly_production", value: 178.4, name: "Monthly Production", unit: "kWh", peak_timestamp: null },
    { key: "p_09_yesterday_exported", value: 5.21, name: "Yesterday Exported", unit: "kWh", peak_timestamp: null },
    { key: "p_12_yesterday_self_consumed", value: 3.55, name: "Yesterday Self-Consumed", unit: "kWh", peak_timestamp: null },
    { key: "g_01_yesterday_consumption", value: 24.5, name: "Gas Yesterday", unit: "kWh", peak_timestamp: null },
    { key: "g_10_yesterday_volume", value: 2.31, name: "Gas Yesterday Volume", unit: "m³", peak_timestamp: null },
    { key: "g_04_monthly_consumption", value: 512.3, name: "Gas Monthly", unit: "kWh", peak_timestamp: null },
  ],
};

// ── Config ──────────────────────────────────────────────────────

const DEFAULT_BILLING: BillingConfig = {
  energy_fixed_fee: 1.5,
  energy_variable_rate: 0.15,
  network_metering_rate: 5.9,
  network_power_ref_rate: 19.27,
  network_variable_rate: 0.0510,
  reference_power_kw: 5.0,
  exceedance_rate: 0.1139,
  feed_in_tariff: 0.08,
  feed_in_rates: [
    { meter_id: "LU0000000000000000000000000MOCK01", mode: "fixed" as const, tariff: 0.08, sensor_entity: "" },
  ],
  gas_fixed_fee: 6.50,
  gas_variable_rate: 0.0550,
  gas_network_fee: 4.80,
  gas_network_variable_rate: 0.0120,
  gas_tax_rate: 0.0010,
  gas_vat_rate: 0.08,
  compensation_fund_rate: 0.0010,
  electricity_tax_rate: 0.001,
  vat_rate: 0.08,
  currency: "EUR",
  meter_has_gas: true,
  meter_monthly_fees: [
    { meter_id: "LU0000000000000000000000000MOCK01", label: "Smart meter (elec)", fee: 5.90 },
    { meter_id: "LU0000000000000000000000000MOCK02", label: "Gas meter", fee: 3.50 },
  ],
  meters: [
    { id: "LU0000000000000000000000000MOCK01", types: ["consumption", "production"] },
    { id: "LU0000000000000000000000000MOCK02", types: ["gas"] },
  ],
} as BillingConfig;

// ── Credentials (standalone mock) ────────────────────────────────

const DEFAULT_CREDENTIALS = {
  api_key: "mock-api-key-1234",
  energy_id: "LU-MOCK-001",
  meters: [
    { id: "LU0000000000000000000000000MOCK01", types: ["consumption", "production"] as string[] },
    { id: "LU0000000000000000000000000MOCK02", types: ["gas"] as string[] },
  ],
};

// ── Exports ─────────────────────────────────────────────────────

export const mockHandlers = {
  getMode(): { mode: string; configured: boolean } {
    const cfg = loadDevConfig();
    const creds = cfg.credentials;
    return { mode: "standalone", configured: !!(creds.api_key && creds.energy_id && creds.meters.length > 0 && creds.meters[0].id) };
  },

  getCredentials() {
    const creds = loadDevConfig().credentials;
    return {
      api_key: creds.api_key ? "\u2022\u2022\u2022\u2022" + creds.api_key.slice(-4) : "",
      energy_id: creds.energy_id,
      meters: creds.meters,
    };
  },

  saveCredentials(data: Record<string, any>): void {
    const cfg = loadDevConfig();
    if (data.api_key && !data.api_key.startsWith("\u2022")) cfg.credentials.api_key = data.api_key;
    if (data.energy_id !== undefined) cfg.credentials.energy_id = data.energy_id;
    if (data.meters !== undefined) cfg.credentials.meters = data.meters;
    saveDevConfig(cfg);
  },

  testCredentials(): { success: boolean; message: string } {
    return { success: true, message: "Connection successful! (mock mode)" };
  },
  getRangeData(range: string): RangeData {
    return RANGE_DATA[range] ?? RANGE_DATA.yesterday;
  },

  getTimeseries(obis: string, start?: string, end?: string): TimeseriesResponse {
    const base = obis.includes(":2.29.0") ? 4.5 : 2.0;
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    return generateTimeseries(obis, base, startDate, endDate);
  },

  getSensors(): SensorsResponse {
    return MOCK_SENSORS;
  },

  getConfig(): BillingConfig {
    return { ...loadDevConfig().billing };
  },

  saveConfig(partial: Record<string, unknown>): void {
    const cfg = loadDevConfig();
    cfg.billing = { ...cfg.billing, ...partial } as BillingConfig;
    saveDevConfig(cfg);
  },

  resetConfig(): void {
    const cfg = loadDevConfig();
    cfg.billing = { ...DEFAULT_BILLING };
    saveDevConfig(cfg);
  },
};

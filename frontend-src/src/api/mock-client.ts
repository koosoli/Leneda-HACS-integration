/**
 * Browser-side mock data client for GitHub Pages / Demo mode.
 * 
 * Adapted from dev/mock-data.ts, using localStorage for persistence.
 */

import type {
  RangeData,
  TimeseriesResponse,
  SensorsResponse,
  BillingConfig,
  Credentials,
  AppMode,
} from "./leneda";

// ── Persistence ─────────────────────────────────────────────────

const STORAGE_KEY_CONFIG = "leneda_demo_config";
const STORAGE_KEY_CREDS = "leneda_demo_creds";

function loadDemoConfig(): BillingConfig {
  const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch { /* ignore */ }
  }
  return { ...DEFAULT_BILLING };
}

function saveDemoConfig(cfg: BillingConfig): void {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
}

function loadDemoCreds(): Credentials {
  const stored = localStorage.getItem(STORAGE_KEY_CREDS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch { /* ignore */ }
  }
  return { ...DEFAULT_CREDENTIALS };
}

function saveDemoCreds(creds: Credentials): void {
  localStorage.setItem(STORAGE_KEY_CREDS, JSON.stringify(creds));
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

// ── Mock Data Definitions ───────────────────────────────────────

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

const DEFAULT_CREDENTIALS: Credentials = {
  api_key: "mock-api-key-1234",
  energy_id: "LU-MOCK-001",
  meters: [
    { id: "LU0000000000000000000000000MOCK01", types: ["consumption", "production"] },
    { id: "LU0000000000000000000000000MOCK02", types: ["gas"] },
  ],
};

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
    { meter_id: "LU0000000000000000000000000MOCK01", mode: "fixed", tariff: 0.08, sensor_entity: "" },
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
  gas_meter_id: "LU0000000000000000000000000MOCK02",
  meter_monthly_fees: [
    { meter_id: "LU0000000000000000000000000MOCK01", label: "Smart meter (elec)", fee: 5.90 },
    { meter_id: "LU0000000000000000000000000MOCK02", label: "Gas meter", fee: 3.50 },
  ],
  meters: [
    { id: "LU0000000000000000000000000MOCK01", types: ["consumption", "production"] },
    { id: "LU0000000000000000000000000MOCK02", types: ["gas"] },
  ],
} as BillingConfig;

// ── Generators ──────────────────────────────────────────────────

function generateTimeseries(
  obis: string,
  baseValue: number,
  startDate?: Date,
  endDate?: Date
): TimeseriesResponse {
  const { start: defStart, end: defEnd } = yesterday();
  const start = startDate ?? defStart;
  const end = endDate ?? defEnd;
  const durationMs = end.getTime() - start.getTime();
  const numIntervals = Math.max(1, Math.ceil(durationMs / (15 * 60_000)));

  const items = Array.from({ length: numIntervals }, (_, i) => {
    const ts = new Date(start.getTime() + i * 15 * 60_000);
    const hour = ts.getHours() + ts.getMinutes() / 60;
    let multiplier = 1;
    if (obis.includes(":2.29.0")) {
      multiplier = hour >= 6 && hour <= 20 ? Math.exp(-0.5 * ((hour - 13) / 3) ** 2) : 0;
    } else {
      multiplier = 0.3 + 0.4 * Math.exp(-0.5 * ((hour - 8) / 2) ** 2) + 0.5 * Math.exp(-0.5 * ((hour - 19) / 2) ** 2);
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

// ── Exported Mock Client ────────────────────────────────────────

export const mockApi = {
  async getMode(): Promise<AppMode> {
    const creds = loadDemoCreds();
    return { 
      mode: "standalone", 
      configured: !!(creds.api_key && creds.energy_id && creds.meters && creds.meters.length > 0) 
    };
  },

  async getCredentials(): Promise<Credentials> {
    return loadDemoCreds();
  },

  async saveCredentials(creds: Credentials): Promise<void> {
    saveDemoCreds(creds);
  },

  async testCredentials(creds: Credentials): Promise<{ success: boolean; message: string }> {
    return { success: true, message: "Connection successful! (DEMO MODE)" };
  },

  async getRangeData(range: string): Promise<RangeData> {
    await new Promise((r) => setTimeout(r, 400)); // Simulate latency
    return RANGE_DATA[range] ?? RANGE_DATA.yesterday;
  },

  async getCustomData(start: string, end: string): Promise<RangeData> { // Should technically retun CustomRangeData but for mock it's similar
     // Approximate mock for custom range
     return { ...RANGE_DATA.yesterday, start, end } as any; 
  },

  async getTimeseries(obis: string, start?: string, end?: string): Promise<TimeseriesResponse> {
    await new Promise((r) => setTimeout(r, 300));
    const base = obis.includes(":2.29.0") ? 4.5 : 2.0;
    return generateTimeseries(obis, base, start ? new Date(start) : undefined, end ? new Date(end) : undefined);
  },

  async getSensors(): Promise<SensorsResponse> {
    return MOCK_SENSORS;
  },

  async getConfig(): Promise<BillingConfig> {
    return loadDemoConfig();
  },

  async saveConfig(partial: Partial<BillingConfig>): Promise<void> {
    const cfg = loadDemoConfig();
    saveDemoConfig({ ...cfg, ...partial } as BillingConfig);
  },

  async resetConfig(): Promise<void> {
    saveDemoConfig({ ...DEFAULT_BILLING });
  }
};

/**
 * Browser-side standalone client for GitHub Pages / Demo mode.
 *
 * Mirrors the logic of dev/dev-server-plugin.ts but runs entirely in the
 * browser (no Node.js APIs).
 *
 * - Credentials are stored in localStorage.
 * - When real credentials are saved via Settings → fetches live data
 *   directly from https://api.leneda.eu
 * - When no credentials → returns realistic mock data for demo purposes.
 *
 * This module is ONLY bundled when VITE_DEMO_MODE is set at build time.
 * Normal builds (HA + local dev) tree-shake this entire file away.
 */

import type {
  RangeData,
  CustomRangeData,
  TimeseriesResponse,
  SensorsResponse,
  BillingConfig,
  AppMode,
  Credentials,
  MeterConfig,
} from "./leneda";

// ═══════════════════════════════════════════════════════════════
//  Credential storage (localStorage)
// ═══════════════════════════════════════════════════════════════

interface StoredCreds {
  api_key: string;
  energy_id: string;
  meters: Array<{ id: string; types: string[] }>;
}

const LS_CREDS = "leneda_demo_creds";
const LS_BILLING = "leneda_demo_billing";

function loadCreds(): StoredCreds | null {
  try {
    const s = localStorage.getItem(LS_CREDS);
    if (s) {
      const c = JSON.parse(s) as StoredCreds;
      if (c.api_key && c.energy_id && c.meters?.length) return c;
    }
  } catch { /* ignore */ }
  return null;
}

function saveCreds(creds: StoredCreds): void {
  try { localStorage.setItem(LS_CREDS, JSON.stringify(creds)); } catch { /* */ }
}

function hasRealCreds(): boolean {
  const c = loadCreds();
  return !!(
    c &&
    c.api_key &&
    !c.api_key.startsWith("\u2022") &&
    c.energy_id &&
    c.meters?.length > 0 &&
    c.meters[0].id
  );
}

// ═══════════════════════════════════════════════════════════════
//  Billing config storage (localStorage)
// ═══════════════════════════════════════════════════════════════

function defaultBilling(): BillingConfig {
  return {
    energy_fixed_fee: 1.5,
    energy_variable_rate: 0.15,
    network_metering_rate: 5.9,
    network_power_ref_rate: 19.27,
    network_variable_rate: 0.051,
    reference_power_kw: 5.0,
    exceedance_rate: 0.1139,
    feed_in_tariff: 0.08,
    feed_in_rates: [
      { meter_id: "LU0000000000000000000000000DEMO01", mode: "fixed", tariff: 0.08, sensor_entity: "" },
    ],
    gas_fixed_fee: 6.5,
    gas_variable_rate: 0.055,
    gas_network_fee: 4.8,
    gas_network_variable_rate: 0.012,
    gas_tax_rate: 0.001,
    gas_vat_rate: 0.08,
    compensation_fund_rate: 0.001,
    electricity_tax_rate: 0.001,
    vat_rate: 0.08,
    currency: "EUR",
    meter_has_gas: true,
    meter_monthly_fees: [
      { meter_id: "LU0000000000000000000000000DEMO01", label: "Smart meter (elec)", fee: 5.9 },
      { meter_id: "LU0000000000000000000000000DEMO02", label: "Gas meter", fee: 3.5 },
    ],
    meters: [
      { id: "LU0000000000000000000000000DEMO01", types: ["consumption", "production"] },
      { id: "LU0000000000000000000000000DEMO02", types: ["gas"] },
    ],
  } as BillingConfig;
}

function loadBilling(): BillingConfig {
  try {
    const s = localStorage.getItem(LS_BILLING);
    if (s) return JSON.parse(s);
  } catch { /* ignore */ }
  return defaultBilling();
}

function saveBillingToStorage(cfg: BillingConfig): void {
  try { localStorage.setItem(LS_BILLING, JSON.stringify(cfg)); } catch { /* */ }
}

// ═══════════════════════════════════════════════════════════════
//  Leneda API direct fetch (browser → api.leneda.eu)
// ═══════════════════════════════════════════════════════════════

const LENEDA_API = "https://api.leneda.eu";

async function lenedaFetch(endpoint: string, creds: { api_key: string; energy_id: string }): Promise<any> {
  const resp = await fetch(`${LENEDA_API}${endpoint}`, {
    headers: {
      "X-API-KEY": creds.api_key,
      "X-ENERGY-ID": creds.energy_id,
    },
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Leneda API ${resp.status}: ${resp.statusText} – ${body}`);
  }
  return resp.json();
}

// ═══════════════════════════════════════════════════════════════
//  Meter helpers (mirrors dev-server-plugin.ts)
// ═══════════════════════════════════════════════════════════════

function meterForObis(obis: string, meters: StoredCreds["meters"]): string {
  const consumption = meters.find((m) => m.types.includes("consumption"));
  const production = meters.find((m) => m.types.includes("production"));
  const gas = meters.find((m) => m.types.includes("gas"));
  if (obis.startsWith("7-") && gas) return gas.id;
  if ((/^1-1:2\./.test(obis) || /^1-1:4\./.test(obis) || /^1-65:2\./.test(obis)) && production) return production.id;
  return consumption?.id ?? meters[0]?.id ?? "";
}

function allProductionMeters(meters: StoredCreds["meters"]): string[] {
  const ids = meters.filter((m) => m.types.includes("production")).map((m) => m.id);
  return ids.length ? ids : [meterForObis("1-1:2.29.0", meters)];
}

// ═══════════════════════════════════════════════════════════════
//  Date range helper (mirrors dev-server-plugin.ts)
// ═══════════════════════════════════════════════════════════════

function dateRangeFor(range: string): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  switch (range) {
    case "yesterday": {
      const d = new Date(now); d.setDate(d.getDate() - 1);
      return { start: fmt(d), end: fmt(d) };
    }
    case "this_week": {
      const d = new Date(now);
      const day = d.getDay() || 7;
      d.setDate(d.getDate() - day + 1);
      return { start: fmt(d), end: fmt(now) };
    }
    case "last_week": {
      const d = new Date(now);
      const day = d.getDay() || 7;
      const endLW = new Date(d); endLW.setDate(d.getDate() - day);
      const startLW = new Date(endLW); startLW.setDate(endLW.getDate() - 6);
      return { start: fmt(startLW), end: fmt(endLW) };
    }
    case "this_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: fmt(start), end: fmt(now) };
    }
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: fmt(start), end: fmt(end) };
    }
    case "this_year": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start: fmt(start), end: fmt(now) };
    }
    case "last_year": {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31);
      return { start: fmt(start), end: fmt(end) };
    }
    default:
      return dateRangeFor("yesterday");
  }
}

// ═══════════════════════════════════════════════════════════════
//  Peak / Exceedance helpers (mirrors dev-server-plugin.ts)
// ═══════════════════════════════════════════════════════════════

function computePeakAndExceedance(
  items: Array<{ value: number }>,
  refPowerKw: number,
): { peak_power_kw: number; exceedance_kwh: number } {
  let peak = 0;
  let exceedance = 0;
  for (const item of items) {
    const kw = item.value ?? 0;
    if (kw > peak) peak = kw;
    if (kw > refPowerKw) {
      exceedance += (kw - refPowerKw) * 0.25;
    }
  }
  return {
    peak_power_kw: Math.round(peak * 100) / 100,
    exceedance_kwh: Math.round(exceedance * 10000) / 10000,
  };
}

async function fetchPeakExceedance(
  meterId: string,
  startDate: string,
  endDate: string,
  creds: { api_key: string; energy_id: string },
): Promise<{ peak_power_kw: number; exceedance_kwh: number }> {
  try {
    const cfg = loadBilling();
    const refPower = cfg.reference_power_kw ?? 5;
    const startDt = new Date(startDate + "T00:00:00.000Z").toISOString();
    const endDt = new Date(endDate + "T23:59:59.999Z").toISOString();

    const data = await lenedaFetch(
      `/api/metering-points/${meterId}/time-series?obisCode=1-1:1.29.0&startDateTime=${encodeURIComponent(startDt)}&endDateTime=${encodeURIComponent(endDt)}`,
      creds,
    );
    return computePeakAndExceedance(data?.items ?? [], refPower);
  } catch {
    return { peak_power_kw: 0, exceedance_kwh: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════
//  LIVE data handlers (real Leneda API)
// ═══════════════════════════════════════════════════════════════

async function liveRangeData(range: string): Promise<RangeData> {
  const creds = loadCreds()!;
  const headers = { api_key: creds.api_key, energy_id: creds.energy_id };
  const { start, end } = dateRangeFor(range);
  const cMeterId = meterForObis("1-1:1.29.0", creds.meters);
  const prodMeters = allProductionMeters(creds.meters);
  const gasMeter = creds.meters.find((m) => m.types.includes("gas"));

  const fetches: Promise<any>[] = [
    lenedaFetch(`/api/metering-points/${cMeterId}/time-series/aggregated?obisCode=1-1:1.29.0&startDate=${start}&endDate=${end}&aggregationLevel=Infinite&transformationMode=Accumulation`, headers),
  ];
  for (const pm of prodMeters) {
    fetches.push(
      lenedaFetch(`/api/metering-points/${pm}/time-series/aggregated?obisCode=1-1:2.29.0&startDate=${start}&endDate=${end}&aggregationLevel=Infinite&transformationMode=Accumulation`, headers).catch(() => null),
    );
    fetches.push(
      lenedaFetch(`/api/metering-points/${pm}/time-series/aggregated?obisCode=1-65:2.29.9&startDate=${start}&endDate=${end}&aggregationLevel=Infinite&transformationMode=Accumulation`, headers).catch(() => null),
    );
  }
  if (gasMeter) {
    fetches.push(
      lenedaFetch(`/api/metering-points/${gasMeter.id}/time-series/aggregated?obisCode=7-1:3.1.0&startDate=${start}&endDate=${end}&aggregationLevel=Infinite&transformationMode=Accumulation`, headers).catch(() => null),
    );
  }

  const results = await Promise.all(fetches);
  const consumption = results[0]?.aggregatedTimeSeries?.[0]?.value ?? 0;

  let production = 0;
  let exported = 0;
  for (let i = 0; i < prodMeters.length; i++) {
    production += results[1 + i * 2]?.aggregatedTimeSeries?.[0]?.value ?? 0;
    exported  += results[2 + i * 2]?.aggregatedTimeSeries?.[0]?.value ?? 0;
  }
  const selfConsumed = Math.max(0, production - exported);
  const gasIdx = 1 + prodMeters.length * 2;
  const gasEnergy = gasMeter ? (results[gasIdx]?.aggregatedTimeSeries?.[0]?.value ?? 0) : 0;

  const { peak_power_kw, exceedance_kwh } = await fetchPeakExceedance(cMeterId, start, end, headers);

  return {
    range,
    consumption,
    production,
    exported,
    self_consumed: selfConsumed,
    shared: 0,
    shared_with_me: 0,
    gas_energy: gasEnergy,
    gas_volume: 0,
    peak_power_kw,
    exceedance_kwh,
    metering_point: cMeterId,
  };
}

async function liveCustomData(start: string, end: string): Promise<CustomRangeData> {
  const creds = loadCreds()!;
  const headers = { api_key: creds.api_key, energy_id: creds.energy_id };
  const cMeterId = meterForObis("1-1:1.29.0", creds.meters);
  const prodMeters = allProductionMeters(creds.meters);

  const fetches: Promise<any>[] = [
    lenedaFetch(`/api/metering-points/${cMeterId}/time-series/aggregated?obisCode=1-1:1.29.0&startDate=${start}&endDate=${end}&aggregationLevel=Infinite&transformationMode=Accumulation`, headers),
  ];
  for (const pm of prodMeters) {
    fetches.push(
      lenedaFetch(`/api/metering-points/${pm}/time-series/aggregated?obisCode=1-1:2.29.0&startDate=${start}&endDate=${end}&aggregationLevel=Infinite&transformationMode=Accumulation`, headers).catch(() => null),
    );
  }
  const results = await Promise.all(fetches);
  let production = 0;
  for (let i = 0; i < prodMeters.length; i++) {
    production += results[1 + i]?.aggregatedTimeSeries?.[0]?.value ?? 0;
  }

  const { peak_power_kw, exceedance_kwh } = await fetchPeakExceedance(cMeterId, start, end, headers);

  return {
    consumption: results[0]?.aggregatedTimeSeries?.[0]?.value ?? 0,
    production,
    peak_power_kw,
    exceedance_kwh,
    start,
    end,
  };
}

async function liveTimeseries(obis: string, start?: string, end?: string): Promise<TimeseriesResponse> {
  const creds = loadCreds()!;
  const headers = { api_key: creds.api_key, energy_id: creds.energy_id };

  const now = new Date();
  const defStart = new Date(now); defStart.setDate(defStart.getDate() - 1); defStart.setHours(0, 0, 0, 0);
  const defEnd = new Date(defStart); defEnd.setHours(23, 59, 59, 999);

  const s = start ?? defStart.toISOString();
  const e = end ?? defEnd.toISOString();

  const isProdObis = /^1-1:2\./.test(obis) || /^1-1:4\./.test(obis) || /^1-65:2\./.test(obis);
  const metersToQuery = isProdObis ? allProductionMeters(creds.meters) : [meterForObis(obis, creds.meters)];

  const fetches = metersToQuery.map((m) =>
    lenedaFetch(
      `/api/metering-points/${m}/time-series?obisCode=${encodeURIComponent(obis)}&startDateTime=${encodeURIComponent(s)}&endDateTime=${encodeURIComponent(e)}`,
      headers,
    ).catch(() => null),
  );
  const results = await Promise.all(fetches);

  const merged = new Map<string, number>();
  let unit = "kW";
  let interval = "PT15M";
  for (const data of results) {
    if (!data) continue;
    unit = data.unit ?? unit;
    interval = data.intervalLength ?? interval;
    for (const item of data.items ?? []) {
      merged.set(item.startedAt, (merged.get(item.startedAt) ?? 0) + item.value);
    }
  }

  const items = [...merged.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ts, val]) => ({ value: val, startedAt: ts, type: "measured", version: 1, calculated: false }));

  return { obis, unit, interval, items };
}

async function liveSensors(): Promise<SensorsResponse> {
  const creds = loadCreds()!;
  return {
    metering_point: creds.meters[0]?.id ?? "",
    sensors: [{ key: "live_web", value: null, name: "Live mode \u2013 sensors available in Home Assistant", unit: "", peak_timestamp: null }],
  };
}

// ═══════════════════════════════════════════════════════════════
//  MOCK data (when no real credentials)
// ═══════════════════════════════════════════════════════════════

function jitter(base: number, pct = 0.15): number {
  return +(base * (1 + (Math.random() * 2 - 1) * pct)).toFixed(4);
}

function yesterdayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setHours(23, 59, 59, 999);
  return { start, end };
}

const RANGE_DATA: Record<string, RangeData> = {
  yesterday: { range: "yesterday", consumption: 12.34, production: 8.76, exported: 5.21, self_consumed: 3.55, shared: 1.8, shared_with_me: 2.1, peak_power_kw: 3.42, exceedance_kwh: 0, gas_energy: 24.5, gas_volume: 2.31, metering_point: "LU0000000000000000000000000DEMO01" },
  this_week: { range: "this_week", consumption: 68.9, production: 45.2, exported: 27.1, self_consumed: 18.1, shared: 9.4, shared_with_me: 11.2, peak_power_kw: 4.1, exceedance_kwh: 0, gas_energy: 142.3, gas_volume: 13.4, metering_point: "LU0000000000000000000000000DEMO01" },
  last_week: { range: "last_week", consumption: 82.5, production: 52.8, exported: 31.6, self_consumed: 21.2, shared: 12.3, shared_with_me: 14.6, peak_power_kw: 5.8, exceedance_kwh: 0.82, gas_energy: 168.7, gas_volume: 15.9, metering_point: "LU0000000000000000000000000DEMO01" },
  this_month: { range: "this_month", consumption: 245.6, production: 178.4, exported: 106.9, self_consumed: 71.5, shared: 38.2, shared_with_me: 44.0, peak_power_kw: 6.2, exceedance_kwh: 3.45, gas_energy: 512.3, gas_volume: 48.3, metering_point: "LU0000000000000000000000000DEMO01" },
  last_month: { range: "last_month", consumption: 310.2, production: 198.7, exported: 119.2, self_consumed: 79.5, shared: 42.8, shared_with_me: 50.1, peak_power_kw: 5.5, exceedance_kwh: 1.92, gas_energy: 620.1, gas_volume: 58.5, metering_point: "LU0000000000000000000000000DEMO01" },
  this_year: { range: "this_year", consumption: 1845.2, production: 1320.8, exported: 792.5, self_consumed: 528.3, shared: 283.1, shared_with_me: 330.4, peak_power_kw: 7.1, exceedance_kwh: 12.6, gas_energy: 4210.5, gas_volume: 397.2, metering_point: "LU0000000000000000000000000DEMO01" },
  last_year: { range: "last_year", consumption: 4120.8, production: 3015.6, exported: 1809.4, self_consumed: 1206.2, shared: 645.9, shared_with_me: 754.2, peak_power_kw: 8.3, exceedance_kwh: 28.4, gas_energy: 9580.2, gas_volume: 903.8, metering_point: "LU0000000000000000000000000DEMO01" },
};

const MOCK_SENSORS: SensorsResponse = {
  metering_point: "LU0000000000000000000000000DEMO01",
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
    { key: "g_10_yesterday_volume", value: 2.31, name: "Gas Yesterday Volume", unit: "m\u00b3", peak_timestamp: null },
    { key: "g_04_monthly_consumption", value: 512.3, name: "Gas Monthly", unit: "kWh", peak_timestamp: null },
  ],
};

function generateTimeseries(obis: string, baseValue: number, startDate?: Date, endDate?: Date): TimeseriesResponse {
  const { start: defStart, end: defEnd } = yesterdayRange();
  const start = startDate ?? defStart;
  const end = endDate ?? defEnd;
  const durationMs = end.getTime() - start.getTime();
  const numIntervals = Math.max(1, Math.min(2000, Math.ceil(durationMs / (15 * 60_000))));

  const items = Array.from({ length: numIntervals }, (_, i) => {
    const ts = new Date(start.getTime() + i * 15 * 60_000);
    const hour = ts.getHours() + ts.getMinutes() / 60;
    let multiplier = 1;
    if (obis.includes(":2.29.0")) {
      multiplier = hour >= 6 && hour <= 20 ? Math.exp(-0.5 * ((hour - 13) / 3) ** 2) : 0;
    } else {
      multiplier = 0.3 + 0.4 * Math.exp(-0.5 * ((hour - 8) / 2) ** 2) + 0.5 * Math.exp(-0.5 * ((hour - 19) / 2) ** 2);
    }
    return { value: +(baseValue * multiplier * jitter(1, 0.1)).toFixed(3), startedAt: ts.toISOString(), type: "Measured", version: 1, calculated: false };
  });

  return { obis, unit: "kW", interval: "PT15M", items };
}

// ═══════════════════════════════════════════════════════════════
//  Exported demo object — used by leneda.ts when IS_DEMO is true
// ═══════════════════════════════════════════════════════════════

export const demo = {
  // ── Mode ──────────────────────────────────────────────────────
  async fetchMode(): Promise<AppMode> {
    return { mode: "standalone", configured: hasRealCreds() };
  },

  // ── Credentials ───────────────────────────────────────────────
  async fetchCredentials(): Promise<Credentials> {
    const c = loadCreds();
    if (c) {
      return {
        api_key: c.api_key ? "\u2022\u2022\u2022\u2022" + c.api_key.slice(-4) : "",
        energy_id: c.energy_id,
        meters: c.meters as MeterConfig[],
      };
    }
    return { api_key: "", energy_id: "", meters: [{ id: "", types: ["consumption"] }] as MeterConfig[] };
  },

  async saveCredentials(creds: Credentials): Promise<void> {
    const prev = loadCreds() ?? { api_key: "", energy_id: "", meters: [] };
    const updated: StoredCreds = {
      api_key: (creds.api_key && !creds.api_key.startsWith("\u2022")) ? creds.api_key : prev.api_key,
      energy_id: creds.energy_id !== undefined ? creds.energy_id : prev.energy_id,
      meters: Array.isArray(creds.meters) ? creds.meters : prev.meters,
    };
    saveCreds(updated);
  },

  async testCredentials(creds: Credentials): Promise<{ success: boolean; message: string }> {
    const testKey = (creds.api_key && !creds.api_key.startsWith("\u2022")) ? creds.api_key : loadCreds()?.api_key ?? "";
    const testEnergyId = creds.energy_id || loadCreds()?.energy_id || "";
    const testMeters = Array.isArray(creds.meters) && creds.meters.length ? creds.meters : loadCreds()?.meters ?? [];
    const firstId = testMeters[0]?.id;

    if (!testKey || !testEnergyId || !firstId) {
      return { success: false, message: "Missing API key, energy ID, or metering point" };
    }
    try {
      const yd = new Date(); yd.setDate(yd.getDate() - 1);
      const dt = yd.toISOString().slice(0, 10);
      await lenedaFetch(
        `/api/metering-points/${firstId}/time-series/aggregated?obisCode=1-1:1.29.0&startDate=${dt}&endDate=${dt}&aggregationLevel=Infinite&transformationMode=Accumulation`,
        { api_key: testKey, energy_id: testEnergyId },
      );
      return { success: true, message: `Connection successful! Tested meter \u2026${firstId.slice(-8)}` };
    } catch (e: any) {
      return { success: false, message: `Connection failed: ${e.message}` };
    }
  },

  // ── Config ────────────────────────────────────────────────────
  async fetchConfig(): Promise<BillingConfig> {
    const cfg = loadBilling();
    // Overlay real meters into config if credentials are saved
    if (hasRealCreds()) {
      const c = loadCreds()!;
      (cfg as any).meters = c.meters.map((m) => ({ id: m.id, types: m.types }));
      (cfg as any).meter_has_gas = c.meters.some((m) => m.types.includes("gas"));
    }
    return cfg;
  },

  async saveConfig(partial: Partial<BillingConfig> | Record<string, any>): Promise<void> {
    const cur = loadBilling();
    saveBillingToStorage({ ...cur, ...partial } as BillingConfig);
  },

  async resetConfig(): Promise<void> {
    saveBillingToStorage(defaultBilling());
  },

  // ── Data (live if credentials, otherwise mock) ────────────────
  async fetchRangeData(range: string): Promise<RangeData> {
    if (hasRealCreds()) return liveRangeData(range);
    return RANGE_DATA[range] ?? RANGE_DATA.yesterday;
  },

  async fetchCustomData(start: string, end: string): Promise<CustomRangeData> {
    if (hasRealCreds()) return liveCustomData(start, end);
    return { consumption: 42.5, production: 28.3, peak_power_kw: 5.8, exceedance_kwh: 1.24, start, end };
  },

  async fetchTimeseries(obis: string, start?: string, end?: string): Promise<TimeseriesResponse> {
    if (hasRealCreds()) return liveTimeseries(obis, start, end);
    const base = obis.includes(":2.29.0") ? 4.5 : 2.0;
    return generateTimeseries(obis, base, start ? new Date(start) : undefined, end ? new Date(end) : undefined);
  },

  async fetchSensors(): Promise<SensorsResponse> {
    if (hasRealCreds()) return liveSensors();
    return MOCK_SENSORS;
  },
};

/**
 * Typed API client for the Leneda HA REST endpoints.
 *
 * All fetch calls are relative (no host) — works inside the HA iframe
 * because the browser sends the HA session cookie automatically.
 */

import { mockApi } from "./mock-client";

const IS_DEMO = window.location.hostname.includes("github.io") || window.location.hostname.includes("demo");

// ── Response types ──────────────────────────────────────────────

export interface RangeData {
  range: string;
  consumption: number;
  production: number;
  exported: number;
  self_consumed: number;
  gas_energy: number;
  gas_volume: number;
  peak_power_kw: number;
  metering_point: string;
  /** Energy shared to the community (from my production) */
  shared?: number;
  /** Energy received from the community */
  shared_with_me?: number;
  /** Cumulative kWh consumed above the reference power (sum of 15-min exceedances × 0.25 h) */
  exceedance_kwh?: number;
}

export interface CustomRangeData {
  consumption: number;
  production: number;
  exported?: number;
  self_consumed?: number;
  gas_energy?: number;
  gas_volume?: number;
  peak_power_kw?: number;
  exceedance_kwh?: number;
  metering_point?: string;
  start: string;
  end: string;
}

export interface TimeseriesItem {
  value: number;
  startedAt: string;
  type: string;
  version: number;
  calculated: boolean;
}

export interface TimeseriesResponse {
  obis: string;
  unit: string;
  interval: string;
  items: TimeseriesItem[];
}

export interface SensorInfo {
  key: string;
  value: number | null;
  name: string;
  unit: string;
  peak_timestamp: string | null;
}

export interface SensorsResponse {
  sensors: SensorInfo[];
  metering_point: string;
}

export type MeterType = "consumption" | "production" | "gas";

export interface MeterConfig {
  id: string;
  types: MeterType[];
}

/** Per-production-meter feed-in rate configuration. */
export interface FeedInRate {
  meter_id: string;
  mode: "fixed" | "sensor";
  tariff: number;
  sensor_entity: string;
  /** Resolved sensor value (set by backend, read-only). */
  sensor_value?: number | null;
}

/** Per-meter monthly fixed fee (metering cost). */
export interface MeterMonthlyFee {
  meter_id: string;
  label: string;
  fee: number;
}

export interface BillingConfig {
  energy_fixed_fee: number;
  energy_variable_rate: number;
  network_metering_rate: number;
  network_power_ref_rate: number;
  network_variable_rate: number;
  reference_power_kw: number;
  exceedance_rate: number;
  /** Global default feed-in tariff — used when a meter has no entry in feed_in_rates */
  feed_in_tariff: number;
  /** Per-production-meter feed-in rate config (mode + tariff/sensor per meter) */
  feed_in_rates?: FeedInRate[];
  /** Per-meter monthly fixed fees (metering costs) */
  meter_monthly_fees?: MeterMonthlyFee[];
  /** Gas billing fields */
  gas_fixed_fee: number;
  gas_variable_rate: number;
  gas_network_fee: number;
  gas_network_variable_rate: number;
  gas_tax_rate: number;
  gas_vat_rate: number;
  compensation_fund_rate: number;
  electricity_tax_rate: number;
  vat_rate: number;
  currency: string;
  meter_has_gas?: boolean;
  ha_meter_id?: string;
  meters?: MeterConfig[];
}

export type TimeRange =
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom";

export interface AppMode {
  mode: "ha" | "standalone";
  configured: boolean;
}

export interface Credentials {
  api_key: string;
  energy_id: string;
  meters: MeterConfig[];
}

// ── API functions ───────────────────────────────────────────────

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(url, init);
  if (!resp.ok) {
    throw new Error(`API ${resp.status}: ${resp.statusText}`);
  }
  return resp.json() as Promise<T>;
}

export async function fetchRangeData(range: TimeRange): Promise<RangeData> {
  if (IS_DEMO) return mockApi.getRangeData(range);
  return apiFetch<RangeData>(`/api/leneda/data?range=${range}`);
}

export async function fetchCustomData(
  start: string,
  end: string
): Promise<CustomRangeData> {
  if (IS_DEMO) return mockApi.getCustomData(start, end) as unknown as CustomRangeData;
  return apiFetch<CustomRangeData>(
    `/api/leneda/data/custom?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
  );
}

export async function fetchTimeseries(
  obis: string,
  start?: string,
  end?: string
): Promise<TimeseriesResponse> {
  if (IS_DEMO) return mockApi.getTimeseries(obis, start, end);
  let url = `/api/leneda/data/timeseries?obis=${encodeURIComponent(obis)}`;
  if (start) url += `&start=${encodeURIComponent(start)}`;
  if (end) url += `&end=${encodeURIComponent(end)}`;
  return apiFetch<TimeseriesResponse>(url);
}

export async function fetchSensors(): Promise<SensorsResponse> {
  if (IS_DEMO) return mockApi.getSensors();
  return apiFetch<SensorsResponse>("/api/leneda/sensors");
}

export async function fetchConfig(): Promise<BillingConfig> {
  if (IS_DEMO) return mockApi.getConfig();
  return apiFetch<BillingConfig>("/api/leneda/config");
}

export async function saveConfig(
  config: Partial<BillingConfig> | Record<string, number | string | boolean>
): Promise<void> {
  if (IS_DEMO) return mockApi.saveConfig(config);
  await apiFetch<{ status: string }>("/api/leneda/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
}

export async function resetConfig(): Promise<void> {
  if (IS_DEMO) return mockApi.resetConfig();
  await apiFetch<{ status: string }>("/api/leneda/config/reset", {
    method: "POST",
  });
}

// ── Mode & credential functions (standalone support) ────────────

export async function fetchMode(): Promise<AppMode> {
  if (IS_DEMO) return mockApi.getMode();
  try {
    return await apiFetch<AppMode>("/api/leneda/mode");
  } catch {
    return { mode: "standalone", configured: false };
  }
}

export async function fetchCredentials(): Promise<Credentials> {
  if (IS_DEMO) return mockApi.getCredentials();
  return apiFetch<Credentials>("/api/leneda/credentials");
}

export async function saveCredentials(creds: Credentials): Promise<void> {
  if (IS_DEMO) return mockApi.saveCredentials(creds);
  await apiFetch<{ status: string }>("/api/leneda/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds),
  });
}

export async function testCredentials(
  creds: Credentials,
): Promise<{ success: boolean; message: string }> {
  if (IS_DEMO) return mockApi.testCredentials(creds);
  return apiFetch<{ success: boolean; message: string }>(
    "/api/leneda/credentials/test",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
    },
  );
}

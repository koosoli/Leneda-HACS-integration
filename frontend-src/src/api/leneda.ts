/**
 * Typed API client for the Leneda HA REST endpoints.
 *
 * All fetch calls are relative (no host) — works inside the HA iframe
 * because the browser sends the HA session cookie automatically.
 *
 * When built with VITE_DEMO_MODE=true (GitHub Pages), all API calls
 * return browser-side mock data instead. The demo module is tree-shaken
 * away in normal builds.
 */

// ── Demo mode (GitHub Pages) ────────────────────────────────────
// Vite statically replaces import.meta.env.VITE_DEMO_MODE at build time.
// Normal builds: undefined → dead code eliminated, demo-mock.ts not bundled.
// GH Pages build: "true" → demo module is included.
let _demo: typeof import("./demo-mock")["demo"] | null = null;
async function getDemoApi() {
  if (!_demo) {
    _demo = (await import("./demo-mock")).demo;
  }
  return _demo;
}
const IS_DEMO = !!import.meta.env.VITE_DEMO_MODE;

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
  start?: string;
  end?: string;
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
  connect_discount: number;
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
  | "this_year"
  | "last_year"
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

// ── HA Auth Token Extraction ────────────────────────────────────

/**
 * Extract the Home Assistant access token from the parent frame.
 * Works because panel_iframe is same-origin with HA frontend.
 */
function getHassToken(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hassEl = (window as any).parent?.document?.querySelector("home-assistant");
    return hassEl?.hass?.auth?.data?.access_token ?? null;
  } catch {
    return null;
  }
}

// ── API functions ───────────────────────────────────────────────

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getHassToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const options: RequestInit = {
    ...init,
    credentials: "include",
    headers,
  };
  const resp = await fetch(url, options);
  if (!resp.ok) {
    throw new Error(`API ${resp.status}: ${resp.statusText}`);
  }
  return resp.json() as Promise<T>;
}

export async function fetchRangeData(range: TimeRange): Promise<RangeData> {
  if (IS_DEMO) return (await getDemoApi()).fetchRangeData(range);
  return apiFetch<RangeData>(`/leneda_api/data?range=${range}`);
}

export async function fetchCustomData(
  start: string,
  end: string
): Promise<CustomRangeData> {
  if (IS_DEMO) return (await getDemoApi()).fetchCustomData(start, end);
  return apiFetch<CustomRangeData>(
    `/leneda_api/data/custom?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
  );
}

export async function fetchTimeseries(
  obis: string,
  start?: string,
  end?: string
): Promise<TimeseriesResponse> {
  if (IS_DEMO) return (await getDemoApi()).fetchTimeseries(obis, start, end);
  let url = `/leneda_api/data/timeseries?obis=${encodeURIComponent(obis)}`;
  if (start) url += `&start=${encodeURIComponent(start)}`;
  if (end) url += `&end=${encodeURIComponent(end)}`;
  return apiFetch<TimeseriesResponse>(url);
}

/** Per-meter timeseries response for stacked chart visualisation. */
export interface PerMeterTimeseries {
  meter_id: string;
  unit: string;
  interval: string;
  items: TimeseriesItem[];
}

export interface PerMeterTimeseriesResponse {
  obis: string;
  meters: PerMeterTimeseries[];
}

export async function fetchPerMeterTimeseries(
  obis: string,
  start?: string,
  end?: string
): Promise<PerMeterTimeseriesResponse> {
  if (IS_DEMO) return (await getDemoApi()).fetchPerMeterTimeseries(obis, start, end);
  let url = `/leneda_api/data/timeseries/per-meter?obis=${encodeURIComponent(obis)}`;
  if (start) url += `&start=${encodeURIComponent(start)}`;
  if (end) url += `&end=${encodeURIComponent(end)}`;
  return apiFetch<PerMeterTimeseriesResponse>(url);
}

export async function fetchSensors(): Promise<SensorsResponse> {
  if (IS_DEMO) return (await getDemoApi()).fetchSensors();
  return apiFetch<SensorsResponse>("/leneda_api/sensors");
}

export async function fetchConfig(): Promise<BillingConfig> {
  if (IS_DEMO) return (await getDemoApi()).fetchConfig();
  return apiFetch<BillingConfig>("/leneda_api/config");
}

export async function saveConfig(
  config: Partial<BillingConfig> | Record<string, number | string | boolean>
): Promise<void> {
  if (IS_DEMO) return (await getDemoApi()).saveConfig(config);
  await apiFetch<{ status: string }>("/leneda_api/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
}

export async function resetConfig(): Promise<void> {
  if (IS_DEMO) return (await getDemoApi()).resetConfig();
  await apiFetch<{ status: string }>("/leneda_api/config/reset", {
    method: "POST",
  });
}

// ── Mode & credential functions (standalone support) ────────────

export async function fetchMode(): Promise<AppMode> {
  if (IS_DEMO) return (await getDemoApi()).fetchMode();
  try {
    return await apiFetch<AppMode>("/leneda_api/mode");
  } catch {
    return { mode: "standalone", configured: false };
  }
}

export async function fetchCredentials(): Promise<Credentials> {
  if (IS_DEMO) return (await getDemoApi()).fetchCredentials();
  return apiFetch<Credentials>("/leneda_api/credentials");
}

export async function saveCredentials(creds: Credentials): Promise<void> {
  if (IS_DEMO) return (await getDemoApi()).saveCredentials(creds);
  await apiFetch<{ status: string }>("/leneda_api/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds),
  });
}

export async function testCredentials(
  creds: Credentials,
): Promise<{ success: boolean; message: string }> {
  if (IS_DEMO) return (await getDemoApi()).testCredentials(creds);
  return apiFetch<{ success: boolean; message: string }>(
    "/leneda_api/credentials/test",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
    },
  );
}

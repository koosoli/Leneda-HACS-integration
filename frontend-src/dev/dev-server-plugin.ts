/**
 * Vite plugin that intercepts /leneda_api/* requests during development.
 *
 * Auto-detects mode based on saved credentials:
 *   - If real credentials are saved (via Settings UI) → proxies data
 *     requests to the real Leneda API at https://api.leneda.eu
 *   - Otherwise → returns realistic mock data for UI development
 *
 * Credentials are stored in-memory (pushed from the browser's localStorage
 * on page load) and also persisted to dev/dev-config.json as backup.
 */
import type { Plugin } from "vite";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// ─── In-memory credential store ─────────────────────────────────

interface StoredCreds {
  api_key: string;
  energy_id: string;
  meters: Array<{ id: string; types: string[] }>;
}

const DEV_CONFIG_FILE = resolve(__dirname, "dev-config.json");

/** Load credentials from dev-config.json (fallback on server restart) */
function loadPersistedCreds(): StoredCreds | null {
  try {
    if (existsSync(DEV_CONFIG_FILE)) {
      const cfg = JSON.parse(readFileSync(DEV_CONFIG_FILE, "utf8"));
      const c = cfg.credentials;
      if (c?.api_key && !c.api_key.startsWith("\u2022") && c.energy_id && c.meters?.length) {
        return c as StoredCreds;
      }
    }
  } catch { /* ignore */ }
  return null;
}

function persistCreds(creds: StoredCreds): void {
  try {
    let cfg: any = {};
    try {
      if (existsSync(DEV_CONFIG_FILE)) cfg = JSON.parse(readFileSync(DEV_CONFIG_FILE, "utf8"));
    } catch { /* */ }
    cfg.credentials = creds;
    writeFileSync(DEV_CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf8");
  } catch { /* ignore */ }
}

// The active credentials — starts from persisted file, updated by POST
let activeCreds: StoredCreds | null = loadPersistedCreds();

function hasRealCreds(): boolean {
  return !!(
    activeCreds &&
    activeCreds.api_key &&
    !activeCreds.api_key.startsWith("\u2022") &&
    activeCreds.energy_id &&
    activeCreds.meters?.length > 0 &&
    activeCreds.meters[0].id
  );
}

// ─── Plugin ─────────────────────────────────────────────────────

export function lenedaDevApi(): Plugin {
  return {
    name: "leneda-dev-api",
    configureServer(server) {
      const live = hasRealCreds();
      console.log(`\n  🔌 Leneda Dev API: ${live ? "LIVE (real credentials found)" : "MOCK (save credentials in Settings to use real API)"}\n`);

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/leneda_api/")) return next();

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Content-Type", "application/json");

        if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }

        try {
          await handleRequest(url, req, res);
        } catch (err: any) {
          console.error("[leneda-dev-api]", err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message ?? "Internal error" }));
        }
      });
    },
  };
}

// ─── Unified request handler ────────────────────────────────────

async function handleRequest(url: string, req: any, res: any): Promise<void> {
  const parsed = new URL(url, "http://localhost");
  const path = parsed.pathname;

  // ── Mode ──
  if (path === "/leneda_api/mode") {
    return json(res, { mode: "standalone", configured: hasRealCreds() });
  }

  // ── Credentials GET ──
  if (path === "/leneda_api/credentials" && req.method === "GET") {
    if (activeCreds) {
      return json(res, {
        api_key: activeCreds.api_key ? "\u2022\u2022\u2022\u2022" + activeCreds.api_key.slice(-4) : "",
        energy_id: activeCreds.energy_id,
        meters: activeCreds.meters,
      });
    }
    return json(res, { api_key: "", energy_id: "", meters: [{ id: "", types: ["consumption"] }] });
  }

  // ── Credentials POST ──
  if (path === "/leneda_api/credentials" && req.method === "POST") {
    const body = await readBody(req);
    const prev = activeCreds ?? { api_key: "", energy_id: "", meters: [] };
    const updated: StoredCreds = {
      api_key: (body.api_key && !String(body.api_key).startsWith("\u2022")) ? String(body.api_key) : prev.api_key,
      energy_id: body.energy_id !== undefined ? String(body.energy_id) : prev.energy_id,
      meters: Array.isArray(body.meters) ? body.meters as StoredCreds["meters"] : prev.meters,
    };
    activeCreds = updated;
    persistCreds(updated);
    const mode = hasRealCreds() ? "LIVE" : "MOCK";
    console.log(`  ✓ Credentials saved (${updated.meters.length} meter(s)) → ${mode} mode`);
    return json(res, { status: "ok" });
  }

  // ── Credentials test ──
  if (path === "/leneda_api/credentials/test" && req.method === "POST") {
    const body = await readBody(req);
    const testKey = (body.api_key && !String(body.api_key).startsWith("\u2022")) ? String(body.api_key) : activeCreds?.api_key ?? "";
    const testEnergyId = body.energy_id ? String(body.energy_id) : activeCreds?.energy_id ?? "";
    const testMeters = Array.isArray(body.meters) ? body.meters as StoredCreds["meters"] : activeCreds?.meters ?? [];
    const firstId = testMeters[0]?.id;

    if (!testKey || !testEnergyId || !firstId) {
      return json(res, { success: false, message: "Missing API key, energy ID, or metering point" });
    }
    try {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const dt = yesterday.toISOString().slice(0, 10);
      await lenedaFetch(
        `/api/metering-points/${firstId}/time-series/aggregated?obisCode=1-1:1.29.0&startDate=${dt}&endDate=${dt}&aggregationLevel=Infinite&transformationMode=Accumulation`,
        { api_key: testKey, energy_id: testEnergyId },
      );
      return json(res, { success: true, message: `Connection successful! Tested meter …${firstId.slice(-8)}` });
    } catch (e: any) {
      return json(res, { success: false, message: `Connection failed: ${e.message}` });
    }
  }

  // ── Config GET/POST ──
  if (path === "/leneda_api/config") {
    const { mockHandlers } = await import("./mock-data");
    if (req.method === "POST") {
      const body = await readBody(req);
      mockHandlers.saveConfig(body);
      return json(res, { status: "ok" });
    }
    const cfg = mockHandlers.getConfig();
    // Overlay real meters into config if available
    if (hasRealCreds()) {
      (cfg as any).meters = activeCreds!.meters.map((m) => ({ id: m.id, types: m.types }));
      (cfg as any).meter_has_gas = activeCreds!.meters.some((m) => m.types.includes("gas"));
    }
    return json(res, cfg);
  }

  if (path === "/leneda_api/config/reset" && req.method === "POST") {
    const { mockHandlers } = await import("./mock-data");
    mockHandlers.resetConfig();
    return json(res, { status: "ok" });
  }

  // ── HA entities (mock list for sensor picker) ──
  if (path === "/leneda_api/ha-entities") {
    return json(res, {
      entities: [
        "sensor.electricity_price",
        "sensor.nordpool_kwh_lu_eur",
        "sensor.epex_spot_lu_price",
        "sensor.energy_market_price",
        "sensor.dynamic_tariff_price",
      ],
    });
  }

  // ── DATA ENDPOINTS — use real API if credentials available ──

  if (hasRealCreds()) {
    return handleLiveData(path, parsed, req, res);
  }

  // ── Fallback: mock data ──
  return handleMockData(path, parsed, req, res);
}

// ─── Live data from Leneda API ──────────────────────────────────

const API = "https://api.leneda.eu";

async function lenedaFetch(endpoint: string, creds: { api_key: string; energy_id: string }): Promise<any> {
  const resp = await fetch(`${API}${endpoint}`, {
    headers: { "X-API-KEY": creds.api_key, "X-ENERGY-ID": creds.energy_id },
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Leneda API ${resp.status}: ${resp.statusText} – ${body}`);
  }
  return resp.json();
}

function meterForObis(obis: string): string {
  const meters = activeCreds?.meters ?? [];
  const consumption = meters.find((m) => m.types.includes("consumption"));
  const production = meters.find((m) => m.types.includes("production"));
  const gas = meters.find((m) => m.types.includes("gas"));
  if (obis.startsWith("7-") && gas) return gas.id;
  if ((/^1-1:2\./.test(obis) || /^1-1:4\./.test(obis) || /^1-65:2\./.test(obis)) && production) return production.id;
  return consumption?.id ?? meters[0]?.id ?? "";
}

/** Return ALL meter IDs tagged as production (for multi-solar summing). */
function allProductionMeters(): string[] {
  const meters = activeCreds?.meters ?? [];
  const ids = meters.filter((m) => m.types.includes("production")).map((m) => m.id);
  return ids.length ? ids : [meterForObis("1-1:2.29.0")];
}

async function handleLiveData(path: string, parsed: URL, _req: any, res: any): Promise<void> {
  const creds = activeCreds!;
  const headers = { api_key: creds.api_key, energy_id: creds.energy_id };

  // ── Range data (aggregated) ──
  if (path === "/leneda_api/data") {
    const range = parsed.searchParams.get("range") ?? "yesterday";
    const { start, end } = dateRangeFor(range);
    const aggLevel = (range === "this_year" || range === "last_year") ? "Month" : "Infinite";
    const cMeterId = meterForObis("1-1:1.29.0");
    const prodMeters = allProductionMeters();
    const gasMeter = creds.meters.find((m) => m.types.includes("gas"));

    // Fetch consumption (single meter)
    console.log(`[DEBUG] Fetching data: range=${range}, start=${start}, end=${end}, aggLevel=${aggLevel}, cMeter=${cMeterId}`);

    if (!cMeterId) throw new Error("No consumption meter ID found");

    // Helper: Sum a list of promises returning aggregated data
    // Handles both Infinite and Month aggregation
    const sumSeries = (data: any) => (data?.aggregatedTimeSeries || []).reduce((acc: number, item: any) => acc + (item.value || 0), 0);

    const fetchSum = async (proms: Promise<any>[]) => {
      const results = await Promise.all(proms.map(p => p.catch(() => null)));
      return results.reduce((acc, res) => acc + sumSeries(res), 0);
    };

    const sharingLayers = ["1", "2", "3", "4"];

    // 1. Consumption Meter Data
    const consPromise = lenedaFetch(`/api/metering-points/${cMeterId}/time-series/aggregated?obisCode=1-1:1.29.0&startDate=${start}&endDate=${end}&aggregationLevel=${aggLevel}&transformationMode=Accumulation`, headers)
      .catch(err => { console.error("Consumption fetch failed:", err); throw err; });

    const sharedWithMePromises = sharingLayers.map(l =>
      lenedaFetch(`/api/metering-points/${cMeterId}/time-series/aggregated?obisCode=1-65:1.29.${l}&startDate=${start}&endDate=${end}&aggregationLevel=${aggLevel}&transformationMode=Accumulation`, headers)
    );

    // 2. Production Meters Data
    const prodPromises = prodMeters.map(pm =>
      lenedaFetch(`/api/metering-points/${pm}/time-series/aggregated?obisCode=1-1:2.29.0&startDate=${start}&endDate=${end}&aggregationLevel=${aggLevel}&transformationMode=Accumulation`, headers)
    );
    const exportPromises = prodMeters.map(pm =>
      lenedaFetch(`/api/metering-points/${pm}/time-series/aggregated?obisCode=1-65:2.29.9&startDate=${start}&endDate=${end}&aggregationLevel=${aggLevel}&transformationMode=Accumulation`, headers)
    );
    const sharedPromises = prodMeters.flatMap(pm =>
      sharingLayers.map(l => lenedaFetch(`/api/metering-points/${pm}/time-series/aggregated?obisCode=1-65:2.29.${l}&startDate=${start}&endDate=${end}&aggregationLevel=${aggLevel}&transformationMode=Accumulation`, headers))
    );

    // 3. Gas Data
    const gasPromise = gasMeter
      ? lenedaFetch(`/api/metering-points/${gasMeter.id}/time-series/aggregated?obisCode=7-1:3.1.0&startDate=${start}&endDate=${end}&aggregationLevel=${aggLevel}`, headers).catch(() => null)
      : Promise.resolve(null);

    // Resolved Values
    const consumption = sumSeries(await consPromise);
    const sharedWithMe = await fetchSum(sharedWithMePromises);
    const production = await fetchSum(prodPromises);
    const exported = await fetchSum(exportPromises); // This is "Remaining after sharing"
    const shared = await fetchSum(sharedPromises);
    const gasEnergy = gasMeter ? sumSeries(await gasPromise) : 0;

    // Self-consumed = Production - Exported (matches backend logic)
    // Note: We used to subtract 'shared' too, but that resulted in 0 for users where P ~= E + S
    // By keeping shared here, we effectively count shared energy as "self-consumed" (community self-consumption)
    const selfConsumed = Math.max(0, production - exported);

    // Compute peak power & exceedance from 15-min consumption timeseries
    const { peak_power_kw, exceedance_kwh } = await fetchPeakExceedance(cMeterId, start, end, headers);

    return json(res, {
      range,
      consumption,
      production,
      exported,
      self_consumed: selfConsumed,
      shared,
      shared_with_me: sharedWithMe,
      gas_energy: gasEnergy,
      gas_volume: 0,
      peak_power_kw,
      exceedance_kwh,
      metering_point: cMeterId,
      start,
      end,
    });
  }

  // ── Custom date range ──
  if (path === "/leneda_api/data/custom") {
    const start = parsed.searchParams.get("start") ?? "";
    const end = parsed.searchParams.get("end") ?? "";
    if (!start || !end) { res.statusCode = 400; return json(res, { error: "start and end required" }); }

    const cMeterId = meterForObis("1-1:1.29.0");
    const prodMeters = allProductionMeters();

    // Consumption (single meter) + production for each production meter
    const gasMeter = creds.meters.find((m) => m.types.includes("gas"));

    // Determine aggregation level based on duration (> 35 days -> Month)
    const durationDays = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24);
    const aggLevel = durationDays > 35 ? "Month" : "Infinite";

    // Helper: Sum a list of promises returning aggregated data
    const sumSeries = (data: any) => (data?.aggregatedTimeSeries || []).reduce((acc: number, item: any) => acc + (item.value || 0), 0);

    const fetchSum = async (proms: Promise<any>[]) => {
      const results = await Promise.all(proms.map(p => p.catch(() => null)));
      return results.reduce((acc, res) => acc + sumSeries(res), 0);
    };

    const sharingLayers = ["1", "2", "3", "4"];

    // 1. Consumption
    const consPromise = lenedaFetch(`/api/metering-points/${cMeterId}/time-series/aggregated?obisCode=1-1:1.29.0&startDate=${start}&endDate=${end}&aggregationLevel=${aggLevel}&transformationMode=Accumulation`, headers)
      .catch(() => null);

    const sharedWithMePromises = sharingLayers.map(l =>
      lenedaFetch(`/api/metering-points/${cMeterId}/time-series/aggregated?obisCode=1-65:1.29.${l}&startDate=${start}&endDate=${end}&aggregationLevel=${aggLevel}&transformationMode=Accumulation`, headers)
    );

    // 2. Production + Export + Shared
    const prodPromises = prodMeters.map(pm =>
      lenedaFetch(`/api/metering-points/${pm}/time-series/aggregated?obisCode=1-1:2.29.0&startDate=${start}&endDate=${end}&aggregationLevel=${aggLevel}&transformationMode=Accumulation`, headers)
    );
    const exportPromises = prodMeters.map(pm =>
      lenedaFetch(`/api/metering-points/${pm}/time-series/aggregated?obisCode=1-65:2.29.9&startDate=${start}&endDate=${end}&aggregationLevel=${aggLevel}&transformationMode=Accumulation`, headers)
    );
    const sharedPromises = prodMeters.flatMap(pm =>
      sharingLayers.map(l => lenedaFetch(`/api/metering-points/${pm}/time-series/aggregated?obisCode=1-65:2.29.${l}&startDate=${start}&endDate=${end}&aggregationLevel=${aggLevel}&transformationMode=Accumulation`, headers))
    );

    // 3. Gas
    const gasPromise = gasMeter
      ? lenedaFetch(`/api/metering-points/${gasMeter.id}/time-series/aggregated?obisCode=7-1:3.1.0&startDate=${start}&endDate=${end}&aggregationLevel=${aggLevel}`, headers).catch(() => null)
      : Promise.resolve(null);

    // Compute peak power & exceedance
    const { peak_power_kw, exceedance_kwh } = await fetchPeakExceedance(cMeterId, start, end, headers);

    // Resolve all
    const consumption = sumSeries(await consPromise);
    const sharedWithMe = await fetchSum(sharedWithMePromises);
    const production = await fetchSum(prodPromises);
    const exported = await fetchSum(exportPromises);
    const shared = await fetchSum(sharedPromises);
    const gasEnergy = gasMeter ? sumSeries(await gasPromise) : 0;

    // Self-consumed = Production - Exported (matches backend logic)
    const selfConsumed = Math.max(0, production - exported);

    return json(res, {
      start, end,
      consumption,
      production,
      exported,
      self_consumed: selfConsumed,
      shared,
      shared_with_me: sharedWithMe,
      gas_energy: gasEnergy,
      gas_volume: 0,
      peak_power_kw,
      exceedance_kwh,
    });
  }

  // ── Timeseries ──
  if (path === "/leneda_api/data/timeseries") {
    const obis = parsed.searchParams.get("obis") ?? "1-1:1.29.0";

    const now = new Date();
    const defStart = new Date(now); defStart.setDate(defStart.getDate() - 1); defStart.setHours(0, 0, 0, 0);
    const defEnd = new Date(defStart); defEnd.setHours(23, 59, 59, 999);

    const start = parsed.searchParams.get("start") ?? defStart.toISOString();
    const end = parsed.searchParams.get("end") ?? defEnd.toISOString();

    // Production OBIS codes: query ALL production meters and merge
    const isProdObis = /^1-1:2\./.test(obis) || /^1-1:4\./.test(obis) || /^1-65:2\./.test(obis);
    const metersToQuery = isProdObis ? allProductionMeters() : [meterForObis(obis)];

    const fetches = metersToQuery.map((m) =>
      lenedaFetch(
        `/api/metering-points/${m}/time-series?obisCode=${encodeURIComponent(obis)}&startDateTime=${encodeURIComponent(start)}&endDateTime=${encodeURIComponent(end)}`,
        headers,
      ).catch(() => null)
    );
    const results = await Promise.all(fetches);

    // Merge items by timestamp (sum values for multi-meter)
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

    return json(res, { obis, unit, interval, items });
  }

  // ── Sensors (limited in dev live mode) ──
  if (path === "/leneda_api/sensors") {
    return json(res, {
      metering_point: creds.meters[0]?.id ?? "",
      sensors: [{ key: "live_dev", value: null, name: "Live dev mode – sensors limited", unit: "", peak_timestamp: null }],
    });
  }

  res.statusCode = 404;
  return json(res, { error: "Not found" });
}

// ─── Mock data fallback ─────────────────────────────────────────

async function handleMockData(path: string, parsed: URL, req: any, res: any): Promise<void> {
  const { mockHandlers } = await import("./mock-data");

  if (path === "/leneda_api/data") {
    const range = parsed.searchParams.get("range") ?? "yesterday";
    return json(res, mockHandlers.getRangeData(range));
  }

  if (path === "/leneda_api/data/custom") {
    return json(res, {
      consumption: 42.5,
      production: 28.3,
      peak_power_kw: 5.8,
      exceedance_kwh: 1.24,
      start: parsed.searchParams.get("start"),
      end: parsed.searchParams.get("end"),
    });
  }

  if (path === "/leneda_api/data/timeseries") {
    const obis = parsed.searchParams.get("obis") ?? "1-1:1.29.0";
    return json(res, mockHandlers.getTimeseries(obis, parsed.searchParams.get("start") ?? undefined, parsed.searchParams.get("end") ?? undefined));
  }

  if (path === "/leneda_api/sensors") {
    return json(res, mockHandlers.getSensors());
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not found" }));
}

// ─── Peak / Exceedance helpers ──────────────────────────────────

/**
 * Given 15-min timeseries items (kW values) and a reference power,
 * compute peak kW and total exceedance kWh.
 */
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
      exceedance += (kw - refPowerKw) * 0.25; // 15-min interval → 0.25 h
    }
  }
  return { peak_power_kw: Math.round(peak * 100) / 100, exceedance_kwh: Math.round(exceedance * 10000) / 10000 };
}

/** Fetch 15-min consumption timeseries and compute peak + exceedance. */
async function fetchPeakExceedance(
  meterId: string,
  startDate: string,
  endDate: string,
  headers: { api_key: string; energy_id: string },
): Promise<{ peak_power_kw: number; exceedance_kwh: number }> {
  try {
    const { mockHandlers } = await import("./mock-data");
    const cfg = mockHandlers.getConfig();
    const refPower: number = (cfg as any).reference_power_kw ?? 5;

    // Convert YYYY-MM-DD to ISO for timeseries endpoint
    const startDt = new Date(startDate + "T00:00:00.000Z").toISOString();
    const endDt = new Date(endDate + "T23:59:59.999Z").toISOString();

    const data = await lenedaFetch(
      `/api/metering-points/${meterId}/time-series?obisCode=1-1:1.29.0&startDateTime=${encodeURIComponent(startDt)}&endDateTime=${encodeURIComponent(endDt)}`,
      headers,
    );
    const items: Array<{ value: number }> = data?.items ?? [];
    return computePeakAndExceedance(items, refPower);
  } catch {
    return { peak_power_kw: 0, exceedance_kwh: 0 };
  }
}

// ─── Utilities ──────────────────────────────────────────────────

function json(res: any, data: unknown): void {
  res.end(JSON.stringify(data));
}

function readBody(req: any): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: string) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function dateRangeFor(range: string): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) =>
    d.toISOString().slice(0, 10); // YYYY-MM-DD

  switch (range) {
    case "yesterday": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return { start: fmt(d), end: fmt(d) };
    }
    case "this_week": {
      const d = new Date(now);
      const day = d.getDay() || 7; // Mon=1
      d.setDate(d.getDate() - day + 1);
      return { start: fmt(d), end: fmt(now) };
    }
    case "last_week": {
      const d = new Date(now);
      const day = d.getDay() || 7;
      const endLW = new Date(d);
      endLW.setDate(d.getDate() - day);
      const startLW = new Date(endLW);
      startLW.setDate(endLW.getDate() - 6);
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
      const s = new Date(now.getFullYear(), 0, 1);
      return { start: fmt(s), end: fmt(now) };
    }
    case "last_year": {
      const s = new Date(now.getFullYear() - 1, 0, 1);
      const e = new Date(now.getFullYear() - 1, 11, 31);
      return { start: fmt(s), end: fmt(e) };
    }
    default:
      return dateRangeFor("yesterday");
  }
}

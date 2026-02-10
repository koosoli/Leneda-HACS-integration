#!/usr/bin/env node
/**
 * Leneda Dashboard — Standalone Server
 *
 * Runs the Leneda energy dashboard outside of Home Assistant.
 * Serves the built frontend and proxies API calls to the real Leneda API.
 *
 * Usage:
 *   node server.js               (default port 5175)
 *   PORT=8080 node server.js     (custom port)
 *
 * On first run, open the dashboard and go to Settings to enter your
 * Leneda API credentials (API Key, Energy ID, Metering Point ID).
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = parseInt(process.env.PORT || "5175", 10);
const CONFIG_FILE = path.join(__dirname, "config.json");
const FRONTEND_DIR = path.join(
  __dirname,
  "..",
  "custom_components",
  "leneda",
  "frontend",
);
const API_BASE = "https://api.leneda.eu";

// ─── MIME types ─────────────────────────────────────────────────

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

// ─── Config persistence ─────────────────────────────────────────

const DEFAULT_BILLING = {
  energy_fixed_fee: 1.5,
  energy_variable_rate: 0.15,
  network_metering_rate: 5.9,
  network_power_ref_rate: 19.27,
  network_variable_rate: 0.0510,
  reference_power_kw: 5.0,
  exceedance_rate: 0.1139,
  feed_in_tariff: 0.08,
  feed_in_rates: [],
  compensation_fund_rate: 0.0010,
  electricity_tax_rate: 0.001,
  vat_rate: 0.08,
  currency: "EUR",
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
      // Migrate legacy single metering_point to meters array
      if (cfg.credentials && cfg.credentials.metering_point && !cfg.credentials.meters) {
        cfg.credentials.meters = [{ id: cfg.credentials.metering_point, types: ["consumption", "production"] }];
        delete cfg.credentials.metering_point;
        saveConfig(cfg);
        console.log("  ℹ Migrated legacy metering_point → meters[]");
      }
      return cfg;
    }
  } catch (e) {
    console.error("  Error loading config.json:", e.message);
  }
  return {
    credentials: { api_key: "", energy_id: "", meters: [{ id: "", types: ["consumption"] }] },
    billing: { ...DEFAULT_BILLING },
  };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
}

// ─── Multi-meter routing ────────────────────────────────────────

/**
 * Given an OBIS code, return the metering point ID to use.
 * Routes gas codes (7-*) to the gas meter, production codes
 * (1-1:2.*, 1-1:4.*, 1-65:2.*) to the production meter,
 * and everything else to the consumption meter.
 */
function meterForObis(obisCode, creds) {
  const meters = creds.meters || [];
  const consumptionMeter = meters.find((m) => m.types && m.types.includes("consumption"));
  const productionMeter = meters.find((m) => m.types && m.types.includes("production"));
  const gasMeter = meters.find((m) => m.types && m.types.includes("gas"));

  if (obisCode && obisCode.startsWith("7-") && gasMeter) {
    return gasMeter.id;
  }
  if (obisCode && (/^1-1:2\./.test(obisCode) || /^1-1:4\./.test(obisCode) || /^1-65:2\./.test(obisCode)) && productionMeter) {
    return productionMeter.id;
  }
  return consumptionMeter ? consumptionMeter.id : (meters[0] ? meters[0].id : "");
}

// ─── Leneda API proxy ───────────────────────────────────────────

async function lenedaFetch(endpoint, creds) {
  const url = `${API_BASE}${endpoint}`;
  const resp = await fetch(url, {
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

function dateRangeFor(range) {
  const now = new Date();
  const d = (v) => v.toISOString().slice(0, 10);

  switch (range) {
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { start: d(y), end: d(y) };
    }
    case "this_week": {
      const m = new Date(now);
      const day = m.getDay() || 7;
      m.setDate(m.getDate() - day + 1);
      return { start: d(m), end: d(now) };
    }
    case "last_week": {
      const m = new Date(now);
      const day = m.getDay() || 7;
      const e = new Date(m);
      e.setDate(m.getDate() - day);
      const s = new Date(e);
      s.setDate(e.getDate() - 6);
      return { start: d(s), end: d(e) };
    }
    case "this_month": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: d(s), end: d(now) };
    }
    case "last_month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: d(s), end: d(e) };
    }
    case "this_year": {
      const s = new Date(now.getFullYear(), 0, 1);
      return { start: d(s), end: d(now) };
    }
    case "last_year": {
      const s = new Date(now.getFullYear() - 1, 0, 1);
      const e = new Date(now.getFullYear() - 1, 11, 31);
      return { start: d(s), end: d(e) };
    }
    default:
      return dateRangeFor("yesterday");
  }
}

// ─── API request handlers ───────────────────────────────────────

async function handleApi(req, res, urlPath, searchParams) {
  const config = loadConfig();
  const creds = config.credentials || {};
  const meters = creds.meters || [];
  const isConfigured = !!(
    creds.api_key &&
    creds.energy_id &&
    meters.length > 0 &&
    meters[0].id
  );

  // ── Mode ──
  if (urlPath === "/leneda_api/mode") {
    return jsonResp(res, { mode: "standalone", configured: isConfigured });
  }

  // ── Credentials GET ──
  if (urlPath === "/leneda_api/credentials" && req.method === "GET") {
    return jsonResp(res, {
      api_key: creds.api_key
        ? "\u2022\u2022\u2022\u2022" + creds.api_key.slice(-4)
        : "",
      energy_id: creds.energy_id || "",
      meters: meters.map((m) => ({ id: m.id || "", types: m.types || ["consumption"] })),
    });
  }

  // ── Credentials POST ──
  if (urlPath === "/leneda_api/credentials" && req.method === "POST") {
    const body = await readBody(req);
    if (!config.credentials) config.credentials = {};
    // Only update API key if user entered a new (non-masked) value
    if (body.api_key && !body.api_key.startsWith("\u2022"))
      config.credentials.api_key = body.api_key;
    if (body.energy_id !== undefined)
      config.credentials.energy_id = body.energy_id;
    if (body.meters !== undefined)
      config.credentials.meters = body.meters;
    // Remove legacy field if present
    delete config.credentials.metering_point;
    saveConfig(config);
    console.log("  ✓ Credentials saved (" + (body.meters || []).length + " meter(s))");
    return jsonResp(res, { status: "ok" });
  }

  // ── Credentials test ──
  if (urlPath === "/leneda_api/credentials/test" && req.method === "POST") {
    const body = await readBody(req);
    const testCreds = {
      api_key:
        body.api_key && !body.api_key.startsWith("\u2022")
          ? body.api_key
          : creds.api_key,
      energy_id: body.energy_id || creds.energy_id,
      meters: body.meters || meters,
    };
    const firstMeterId = testCreds.meters[0]?.id;
    if (!firstMeterId) {
      return jsonResp(res, { success: false, message: "No metering point ID provided" });
    }
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dt = yesterday.toISOString().slice(0, 10);
      await lenedaFetch(
        `/api/metering-points/${firstMeterId}/time-series/aggregated?obisCode=1-1:1.29.0&startDate=${dt}&endDate=${dt}&aggregationLevel=Infinite&transformationMode=Accumulation`,
        testCreds,
      );
      return jsonResp(res, {
        success: true,
        message: `Connection successful! Tested meter ${firstMeterId.slice(-8)}`,
      });
    } catch (e) {
      return jsonResp(res, {
        success: false,
        message: `Connection failed: ${e.message}`,
      });
    }
  }

  // ── Billing config GET ──
  if (urlPath === "/leneda_api/config" && req.method === "GET") {
    const hasGas = meters.some((m) => m.types && m.types.includes("gas"));
    return jsonResp(res, {
      ...(config.billing || DEFAULT_BILLING),
      meters: meters.map((m) => ({ id: m.id || "", types: m.types || ["consumption"] })),
      meter_has_gas: hasGas,
    });
  }

  // ── Billing config POST ──
  if (urlPath === "/leneda_api/config" && req.method === "POST") {
    const body = await readBody(req);
    config.billing = { ...(config.billing || DEFAULT_BILLING), ...body };
    saveConfig(config);
    return jsonResp(res, { status: "ok" });
  }

  // ── Billing config reset ──
  if (urlPath === "/leneda_api/config/reset" && req.method === "POST") {
    config.billing = { ...DEFAULT_BILLING };
    saveConfig(config);
    return jsonResp(res, { status: "ok" });
  }

  // ── Data endpoints below require configured credentials ──
  if (!isConfigured) {
    res.statusCode = 401;
    return jsonResp(res, {
      error:
        "Credentials not configured. Go to Settings to enter your Leneda API credentials.",
    });
  }

  // ── Range data (aggregated) ──
  if (urlPath === "/leneda_api/data" && req.method === "GET") {
    const range = searchParams.get("range") || "yesterday";
    const { start, end } = dateRangeFor(range);
    const consumptionMeter = meterForObis("1-1:1.29.0", creds);
    const productionMeter = meterForObis("1-1:2.29.0", creds);

    const aggLevel = (range === "this_year" || range === "last_year") ? "Month" : "Infinite";
    try {
      const [cData, pData] = await Promise.all([
        lenedaFetch(
          `/api/metering-points/${consumptionMeter}/time-series/aggregated?obisCode=1-1:1.29.0&startDate=${start}&endDate=${end}&aggregationLevel=${aggLevel}&transformationMode=Accumulation`,
          creds,
        ),
        lenedaFetch(
          `/api/metering-points/${productionMeter}/time-series/aggregated?obisCode=1-1:2.29.0&startDate=${start}&endDate=${end}&aggregationLevel=${aggLevel}&transformationMode=Accumulation`,
          creds,
        ),
      ]);

      const sumItems = (data) => (data?.aggregatedTimeSeries || []).reduce((acc, item) => acc + (item.value || 0), 0);
      const consumption = sumItems(cData);
      const production = sumItems(pData);
      const exported = Math.max(0, production * 0.6);
      const selfConsumed = Math.max(0, production - exported);

      const payload = {
        range,
        consumption,
        production,
        exported,
        self_consumed: selfConsumed,
        shared: 0,
        shared_with_me: 0,
        gas_energy: 0,
        gas_volume: 0,
        peak_power_kw: 0,
        exceedance_kwh: 0,
        metering_point: consumptionMeter,
        start,
        end,
      };
      console.log(`[DEBUG] Returning data for ${range}:`, payload);
      return jsonResp(res, payload);
    } catch (e) {
      console.error("  Error fetching range data:", e.message);
      res.statusCode = 500;
      return jsonResp(res, { error: e.message });
    }
  }

  // ── Custom date range data ──
  if (urlPath === "/leneda_api/data/custom" && req.method === "GET") {
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    if (!start || !end) {
      res.statusCode = 400;
      return jsonResp(res, { error: "Missing start or end parameter" });
    }
    const consumptionMeter = meterForObis("1-1:1.29.0", creds);
    const productionMeter = meterForObis("1-1:2.29.0", creds);
    try {
      const [cData, pData] = await Promise.all([
        lenedaFetch(
          `/api/metering-points/${consumptionMeter}/time-series/aggregated?obisCode=1-1:1.29.0&startDate=${start}&endDate=${end}&aggregationLevel=Infinite&transformationMode=Accumulation`,
          creds,
        ),
        lenedaFetch(
          `/api/metering-points/${productionMeter}/time-series/aggregated?obisCode=1-1:2.29.0&startDate=${start}&endDate=${end}&aggregationLevel=Infinite&transformationMode=Accumulation`,
          creds,
        ),
      ]);
      return jsonResp(res, {
        consumption: cData?.aggregatedTimeSeries?.[0]?.value ?? 0,
        production: pData?.aggregatedTimeSeries?.[0]?.value ?? 0,
        start,
        end,
      });
    } catch (e) {
      console.error("  Error fetching custom range:", e.message);
      res.statusCode = 500;
      return jsonResp(res, { error: e.message });
    }
  }

  // ── Timeseries (raw 15-min data) ──
  if (urlPath === "/leneda_api/data/timeseries" && req.method === "GET") {
    const obis = searchParams.get("obis") || "1-1:1.29.0";
    const meterId = meterForObis(obis, creds);

    const now = new Date();
    const defStart = new Date(now);
    defStart.setDate(defStart.getDate() - 1);
    defStart.setHours(0, 0, 0, 0);
    const defEnd = new Date(defStart);
    defEnd.setHours(23, 59, 59, 999);

    const startISO =
      searchParams.get("start") || defStart.toISOString();
    const endISO = searchParams.get("end") || defEnd.toISOString();

    try {
      const data = await lenedaFetch(
        `/api/metering-points/${meterId}/time-series?obisCode=${encodeURIComponent(obis)}&startDateTime=${encodeURIComponent(startISO)}&endDateTime=${encodeURIComponent(endISO)}`,
        creds,
      );

      return jsonResp(res, {
        obis,
        unit: data.unit || "kW",
        interval: data.intervalLength || "PT15M",
        items: data.items || [],
      });
    } catch (e) {
      console.error("  Error fetching timeseries:", e.message);
      res.statusCode = 500;
      return jsonResp(res, { error: e.message });
    }
  }

  // ── Sensors (standalone shows limited info) ──
  if (urlPath === "/leneda_api/sensors") {
    return jsonResp(res, {
      sensors: [
        {
          key: "standalone_info",
          value: null,
          name: "Running in standalone mode — full sensor entities are available in Home Assistant",
          unit: "",
          peak_timestamp: null,
        },
      ],
      metering_point: meters[0]?.id || "",
    });
  }

  res.statusCode = 404;
  return jsonResp(res, { error: "Not found" });
}

// ─── Static file server ─────────────────────────────────────────

function serveStatic(req, res) {
  let filePath = (req.url || "/").split("?")[0];
  if (filePath === "/" || filePath === "") filePath = "/index.html";

  const fullPath = path.join(FRONTEND_DIR, filePath);

  // Prevent directory traversal
  if (!fullPath.startsWith(FRONTEND_DIR)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    // SPA fallback → index.html
    const indexPath = path.join(FRONTEND_DIR, "index.html");
    if (fs.existsSync(indexPath)) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(fs.readFileSync(indexPath));
      return;
    }
    res.statusCode = 404;
    res.end("Not found — have you built the frontend? Run: cd frontend-src && npm run build");
    return;
  }

  const ext = path.extname(fullPath);
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  res.end(fs.readFileSync(fullPath));
}

// ─── Utilities ──────────────────────────────────────────────────

function jsonResp(res, data) {
  if (!res.headersSent) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
  }
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
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

// ─── Start server ───────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url || "/", `http://localhost:${PORT}`);

  if (parsed.pathname.startsWith("/leneda_api/")) {
    try {
      await handleApi(req, res, parsed.pathname, parsed.searchParams);
    } catch (e) {
      console.error("  [API Error]", e);
      res.statusCode = 500;
      jsonResp(res, { error: e.message || "Internal server error" });
    }
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, () => {
  const config = loadConfig();
  const creds = config.credentials || {};
  const meters = creds.meters || [];
  const configured = !!(creds.api_key && creds.energy_id && meters.length > 0 && meters[0].id);

  console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║        Leneda Energy Dashboard  (Standalone)        ║
  ╠══════════════════════════════════════════════════════╣
  ║                                                     ║
  ║   🌐  http://localhost:${String(PORT).padEnd(5)}                       ║
  ║                                                     ║
  ║   ${configured ? `✓  ${meters.length} meter(s) configured` : "⚠  No API credentials — open Settings to configure"}${configured ? " ".repeat(37 - `✓  ${meters.length} meter(s) configured`.length) : "  "}║
  ║                                                     ║
  ╚══════════════════════════════════════════════════════╝
`);
});

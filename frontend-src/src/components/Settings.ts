/**
 * Settings — Billing-rate configuration form + credential management.
 *
 * In standalone mode: shows API credential fields (key, energy ID)
 *   plus up to 3 metering points — each with type checkboxes
 *   (Power Consumption / Power Production / Gas Consumption).
 * In HA mode: shows the meter config read-only from Home Assistant and
 *   a note that credentials are managed via HA Integrations page.
 * Billing configuration is always visible in both modes.
 */
import type { BillingConfig, Credentials, MeterConfig, FeedInRate, MeterMonthlyFee } from "../api/leneda";

interface Field {
  key: keyof BillingConfig;
  label: string;
  step: string;
  unit: string;
  type: "number" | "text";
}

interface FieldGroup {
  title: string;
  icon: string;
  fields: Field[];
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    title: "Energy Supplier",
    icon: "⚡",
    fields: [
      { key: "energy_fixed_fee", label: "Fixed Fee", step: "0.01", unit: "EUR/mo", type: "number" },
      { key: "energy_variable_rate", label: "Variable Rate", step: "0.00001", unit: "EUR/kWh", type: "number" },
    ],
  },
  {
    title: "Network Operator",
    icon: "🔌",
    fields: [
      { key: "network_metering_rate", label: "Metering Fee", step: "0.01", unit: "EUR/mo", type: "number" },
      { key: "network_power_ref_rate", label: "Power Reference Fee", step: "0.01", unit: "EUR/mo", type: "number" },
      { key: "network_variable_rate", label: "Variable Rate", step: "0.0001", unit: "EUR/kWh", type: "number" },
    ],
  },
  {
    title: "Reference Power & Exceedance",
    icon: "📏",
    fields: [
      { key: "reference_power_kw", label: "Reference Power (Referenzwert)", step: "0.1", unit: "kW", type: "number" },
      { key: "exceedance_rate", label: "Exceedance Surcharge", step: "0.0001", unit: "EUR/kWh", type: "number" },
    ],
  },
  {
    title: "Feed-in / Selling",
    icon: "💶",
    fields: [],  // rendered manually below due to mode toggle
  },
  {
    title: "Gas Billing",
    icon: "🔥",
    fields: [
      { key: "gas_fixed_fee", label: "Supplier Fixed Fee", step: "0.01", unit: "EUR/mo", type: "number" },
      { key: "gas_variable_rate", label: "Supplier Variable Rate", step: "0.0001", unit: "EUR/kWh", type: "number" },
      { key: "gas_network_fee", label: "Network Fixed Fee", step: "0.01", unit: "EUR/mo", type: "number" },
      { key: "gas_network_variable_rate", label: "Network Variable Rate", step: "0.0001", unit: "EUR/kWh", type: "number" },
      { key: "gas_tax_rate", label: "Gas Tax", step: "0.0001", unit: "EUR/kWh", type: "number" },
      { key: "gas_vat_rate", label: "Gas VAT Rate", step: "0.01", unit: "decimal (0.08 = 8%)", type: "number" },
    ],
  },
  {
    title: "Meter Fees",
    icon: "📊",
    fields: [],  // rendered manually — per-meter monthly costs
  },
  {
    title: "Taxes & Levies",
    icon: "🏛️",
    fields: [
      { key: "compensation_fund_rate", label: "Compensation Fund", step: "0.0001", unit: "EUR/kWh", type: "number" },
      { key: "electricity_tax_rate", label: "Electricity Tax", step: "0.0001", unit: "EUR/kWh", type: "number" },
      { key: "vat_rate", label: "VAT Rate", step: "0.01", unit: "decimal (0.08 = 8%)", type: "number" },
    ],
  },
    {
    title: "Discounts",
    icon: "🤑",
    fields: [
      { key: "connect_discount", label: "Connect Discount", step: "0.01", unit: "EUR/mo", type: "number" },
    ],
  },
  {
    title: "General",
    icon: "⚙️",
    fields: [
      { key: "currency", label: "Currency", step: "", unit: "", type: "text" },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  consumption: "Power Consumption",
  production: "Power Production",
  gas: "Gas Consumption",
};

const TYPE_ICONS: Record<string, string> = {
  consumption: "⚡",
  production: "☀️",
  gas: "🔥",
};

function renderMeterTypes(types: string[]): string {
  return types
    .map((t) => `<span class="meter-type-badge meter-type-${t}">${TYPE_ICONS[t] ?? ""} ${TYPE_LABELS[t] ?? t}</span>`)
    .join(" ");
}

function renderMeterRow(index: number, meter: MeterConfig, readonly: boolean): string {
  const num = index + 1;
  if (readonly) {
    return `
      <div class="meter-card">
        <div class="meter-header">
          <strong>Meter ${num}</strong>
          <code class="meter-id">${meter.id ? "..." + meter.id.slice(-8) : "—"}</code>
        </div>
        <div class="meter-types">${renderMeterTypes(meter.types)}</div>
      </div>
    `;
  }

  // Editable (standalone mode)
  return `
    <div class="meter-card">
      <div class="meter-header">
        <strong>Meter ${num}</strong>
        ${num > 1 ? `<button type="button" class="btn-icon remove-meter-btn" data-meter="${index}" title="Remove meter">&times;</button>` : ""}
      </div>
      <div class="form-row">
        <label for="meter-id-${index}">Metering Point ID</label>
        <div class="input-group">
          <input
            id="meter-id-${index}"
            name="meter_${index}_id"
            type="text"
            value="${meter.id ?? ""}"
            placeholder="e.g. LUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
          />
        </div>
      </div>
      <div class="form-row">
        <label>This meter measures</label>
        <div class="meter-type-checkboxes">
          <label class="meter-type-cb">
            <input type="checkbox" name="meter_${index}_consumption" ${meter.types.includes("consumption") ? "checked" : ""} />
            <span>⚡ Power Consumption</span>
          </label>
          <label class="meter-type-cb">
            <input type="checkbox" name="meter_${index}_production" ${meter.types.includes("production") ? "checked" : ""} />
            <span>☀️ Power Production</span>
          </label>
          <label class="meter-type-cb">
            <input type="checkbox" name="meter_${index}_gas" ${meter.types.includes("gas") ? "checked" : ""} />
            <span>🔥 Gas Consumption</span>
          </label>
        </div>
      </div>
    </div>
  `;
}

export function renderSettings(
  config: BillingConfig | null,
  mode: "ha" | "standalone" = "ha",
  credentials?: Credentials | null,
): string {
  if (!config && mode === "ha") {
    return `
      <section class="settings-view">
        <div class="card">
          <p class="muted">Loading configuration…</p>
        </div>
      </section>
    `;
  }

  // ── Meters from credentials (standalone) or config (HA) ──
  const meters: MeterConfig[] = mode === "standalone"
    ? (credentials?.meters ?? [{ id: "", types: ["consumption"] }])
    : (config?.meters ?? []);

  // ── Credentials + meters section ──
  let credentialsSection = "";
  if (mode === "standalone") {
    const meterCards = meters.map((m, i) => renderMeterRow(i, m, false)).join("");
    credentialsSection = `
      <div class="section-header">
        <h2>API Connection</h2>
        <span class="muted">Configure your Leneda API credentials and metering points</span>
      </div>
      <div class="card" style="margin-bottom: var(--sp-6);">
        <form id="credentials-form">
          <div class="form-section">
            <div class="form-section-title">🔑  Leneda API Credentials</div>
            <div class="form-row">
              <label for="cfg-api_key">API Key</label>
              <div class="input-group">
                <input
                  id="cfg-api_key"
                  name="api_key"
                  type="password"
                  value="${credentials?.api_key ?? ""}"
                  placeholder="Enter your Leneda API key"
                />
              </div>
            </div>
            <div class="form-row">
              <label for="cfg-energy_id">Energy ID</label>
              <div class="input-group">
                <input
                  id="cfg-energy_id"
                  name="energy_id"
                  type="text"
                  value="${credentials?.energy_id ?? ""}"
                  placeholder="e.g. LU-123-456-789"
                />
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">📊  Metering Points</div>
            <p class="muted" style="margin: 0 0 var(--sp-3) 0; font-size: 0.85rem;">
              For each meter, select what it measures. A single bidirectional meter can handle both consumption and production.
            </p>
            <div id="meters-container">
              ${meterCards}
            </div>
            ${meters.length < 10 ? `
            <button type="button" id="add-meter-btn" class="btn btn-outline" style="margin-top: var(--sp-3);">
              + Add Metering Point
            </button>
            ` : ""}
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Save Credentials</button>
            <button type="button" id="test-creds-btn" class="btn btn-outline">Test Connection</button>
          </div>
          <div id="creds-status"></div>
        </form>
      </div>
    `;
  } else {
    // HA mode: show meters read-only
    const haMeters = config?.meters ?? [];
    const meterDisplay = haMeters.length > 0
      ? haMeters.map((m, i) => renderMeterRow(i, m, true)).join("")
      : `<p class="muted">No meters configured</p>`;
    credentialsSection = `
      <div class="card" style="margin-bottom: var(--sp-6); padding: var(--sp-4) var(--sp-5);">
        <p class="muted" style="margin: 0 0 var(--sp-3) 0;">🔒 API credentials are managed through Home Assistant &rarr; Settings &rarr; Integrations &rarr; Leneda</p>
        <div class="form-section">
          <div class="form-section-title">📊  Configured Metering Points</div>
          <div id="meters-container">
            ${meterDisplay}
          </div>
        </div>
      </div>
    `;
  }

  const renderFields = (fields: Field[]) =>
    fields.map((f) => {
      const val = config ? ((config as any)[f.key] ?? "") : "";
      return `
        <div class="form-row">
          <label for="cfg-${f.key}">${f.label}</label>
          <div class="input-group">
            <input
              id="cfg-${f.key}"
              name="${f.key}"
              type="${f.type}"
              ${f.type === "number" ? `step="${f.step}"` : ""}
              value="${val}"
            />
            ${f.unit ? `<span class="input-unit">${f.unit}</span>` : ""}
          </div>
        </div>
      `;
    }).join("");

  // ── Feed-in mode section (per-production-meter rendering) ──
  const productionMeters = (config?.meters ?? []).filter((m) => m.types.includes("production"));
  const feedInRates: FeedInRate[] = config?.feed_in_rates ?? [];
  const isHA = mode === "ha";

  function rateFor(meterId: string): FeedInRate {
    return feedInRates.find((r) => r.meter_id === meterId) ?? {
      meter_id: meterId,
      mode: "fixed",
      tariff: config?.feed_in_tariff ?? 0.08,
      sensor_entity: "",
    };
  }

  const feedInSection = productionMeters.length === 0
    ? `<p class="muted">No production meters configured — add a meter with Power Production type above.</p>`
    : productionMeters.map((m, idx) => {
      const r = rateFor(m.id);
      const shortId = m.id ? "…" + m.id.slice(-8) : `Meter ${idx + 1}`;
      return `
          <div class="feed-in-meter-card" data-meter-idx="${idx}" data-meter-id="${m.id}">
            <div class="feed-in-meter-header">
              <span class="meter-type-badge meter-type-production">☀️ ${shortId}</span>
              <input type="hidden" name="feed_in_rate_${idx}_meter_id" value="${m.id}" />
            </div>
            <div class="form-row">
              <label>Pricing Mode</label>
              <div class="feed-in-mode-toggle">
                <label class="mode-option">
                  <input type="radio" name="feed_in_rate_${idx}_mode" value="fixed" ${r.mode === "fixed" ? "checked" : ""} />
                  <span class="mode-label">💶 Fixed Tariff</span>
                </label>
                <label class="mode-option">
                  <input type="radio" name="feed_in_rate_${idx}_mode" value="sensor" ${r.mode === "sensor" ? "checked" : ""} />
                  <span class="mode-label">📡 HA Sensor</span>
                </label>
              </div>
            </div>
            <div class="feed-in-fixed-fields" data-rate-idx="${idx}" style="${r.mode === "fixed" ? "" : "display:none"}">
              <div class="form-row">
                <label for="cfg-feed_in_rate_${idx}_tariff">Feed-in Tariff</label>
                <div class="input-group">
                  <input id="cfg-feed_in_rate_${idx}_tariff" name="feed_in_rate_${idx}_tariff" type="number" step="0.0001" value="${r.tariff}" />
                  <span class="input-unit">EUR/kWh</span>
                </div>
              </div>
            </div>
            <div class="feed-in-sensor-fields" data-rate-idx="${idx}" style="${r.mode === "sensor" ? "" : "display:none"}">
              <div class="form-row">
                <label for="cfg-feed_in_rate_${idx}_sensor">Market Price Sensor</label>
                <div class="input-group sensor-picker-group">
                  <input
                    id="cfg-feed_in_rate_${idx}_sensor"
                    name="feed_in_rate_${idx}_sensor_entity"
                    type="text"
                    value="${r.sensor_entity}"
                    placeholder="${isHA ? "sensor.electricity_price" : "sensor.electricity_price (HA mode only)"}"
                    list="ha-entity-list"
                  />
                  <span class="input-unit">entity_id</span>
                </div>
                ${isHA && idx === 0 ? '<datalist id="ha-entity-list"></datalist>' : ""}
              </div>
              <div class="form-row">
                <label for="cfg-feed_in_rate_${idx}_fallback">Fallback Tariff</label>
                <div class="input-group">
                  <input id="cfg-feed_in_rate_${idx}_fallback" name="feed_in_rate_${idx}_fallback_tariff" type="number" step="0.0001" value="${r.tariff}" />
                  <span class="input-unit">EUR/kWh</span>
                </div>
                <p class="muted" style="font-size: var(--text-xs); margin-top: var(--sp-1);">
                  Used when the sensor is unavailable.
                </p>
              </div>
            </div>
          </div>
        `;
    }).join("");

  const hasGasMeter = (config?.meters ?? []).some((m) => m.types.includes("gas")) || config?.meter_has_gas;

  // ── Per-meter monthly fees section ──
  const allMeters = config?.meters ?? [];
  const meterFees: MeterMonthlyFee[] = config?.meter_monthly_fees ?? [];

  function feeFor(meterId: string): MeterMonthlyFee {
    return meterFees.find((f) => f.meter_id === meterId) ?? {
      meter_id: meterId,
      label: "",
      fee: 0,
    };
  }

  const meterFeesSection = allMeters.length === 0
    ? `<p class="muted">No meters configured.</p>`
    : allMeters.map((m, idx) => {
      const f = feeFor(m.id);
      const shortId = m.id ? "…" + m.id.slice(-8) : `Meter ${idx + 1}`;
      const typeIcons = m.types.map((t: string) => TYPE_ICONS[t] ?? "").join(" ");
      return `
          <div class="meter-fee-card" style="margin-bottom: var(--sp-3); padding: var(--sp-3); border: 1px solid var(--clr-border); border-radius: var(--radius);">
            <div style="display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-2);">
              <span>${typeIcons}</span>
              <code style="font-size: var(--text-sm);">${shortId}</code>
              <input type="hidden" name="meter_fee_${idx}_meter_id" value="${m.id}" />
            </div>
            <div class="form-row" style="margin-bottom: var(--sp-2);">
              <label for="cfg-meter_fee_${idx}_label">Label</label>
              <div class="input-group">
                <input id="cfg-meter_fee_${idx}_label" name="meter_fee_${idx}_label" type="text" value="${f.label || `Meter ${idx + 1} metering fee`}" placeholder="e.g. Smart meter rental" />
              </div>
            </div>
            <div class="form-row">
              <label for="cfg-meter_fee_${idx}_fee">Monthly Fee</label>
              <div class="input-group">
                <input id="cfg-meter_fee_${idx}_fee" name="meter_fee_${idx}_fee" type="number" step="0.01" value="${f.fee}" />
                <span class="input-unit">EUR/mo</span>
              </div>
            </div>
          </div>
        `;
    }).join("");

  const groups = FIELD_GROUPS.map((g) => {
    // Hide gas billing section when no gas meter is configured
    if (g.title === "Gas Billing" && !hasGasMeter) return "";
    // Hide meter fees if only one meter
    if (g.title === "Meter Fees" && allMeters.length < 2) return "";

    let content: string;
    if (g.title === "Feed-in / Selling") {
      content = feedInSection;
    } else if (g.title === "Meter Fees") {
      content = `<p class="muted" style="margin: 0 0 var(--sp-3) 0; font-size: 0.85rem;">
        Each metering point has a fixed monthly rental/metering fee. Set the cost per meter below.
      </p>` + meterFeesSection;
    } else {
      content = renderFields(g.fields);
    }

    return `
    <div class="form-section">
      <div class="form-section-title">${g.icon}  ${g.title}</div>
      ${content}
    </div>
  `;
  }).join("");

  return `
    <section class="settings-view">
      ${credentialsSection}

      <div class="section-header">
        <h2>Billing Configuration</h2>
        <span class="muted">Luxembourg energy billing rates &mdash; adjust values to match your contract</span>
      </div>

      <div class="card">
        <form id="settings-form">
          ${config ? groups : '<p class="muted">Loading configuration…</p>'}
          ${config ? `
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Save Configuration</button>
            <button type="button" id="reset-config-btn" class="btn btn-outline">Reset to Defaults</button>
          </div>
          ` : ""}
        </form>
      </div>
    </section>
  `;
}

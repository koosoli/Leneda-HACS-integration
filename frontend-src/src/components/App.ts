/**
 * LenedaApp — Root application component.
 *
 * Manages tab navigation and delegates rendering to child components.
 */
import {
  fetchRangeData,
  fetchSensors,
  fetchConfig,
  fetchMode,
  fetchCredentials,
  type RangeData,
  type TimeRange,
  type SensorsResponse,
  type BillingConfig,
  type Credentials,
  type MeterConfig,
} from "../api/leneda";
import { renderDashboard } from "./Dashboard";
import { renderSensors } from "./Sensors";
import { renderInvoice } from "./Invoice";
import { renderSettings } from "./Settings";
import { renderNavBar } from "./NavBar";

// ── localStorage credential helpers (persist across reloads, never in git) ──

const CREDS_STORAGE_KEY = "leneda_credentials";

function loadLocalCredentials(): Credentials | null {
  try {
    const raw = localStorage.getItem(CREDS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Credentials;
  } catch { /* corrupt data — ignore */ }
  return null;
}

function saveLocalCredentials(creds: Credentials): void {
  try {
    localStorage.setItem(CREDS_STORAGE_KEY, JSON.stringify(creds));
  } catch { /* storage full or private mode — ignore */ }
}

export type Tab = "dashboard" | "sensors" | "invoice" | "settings";

export interface AppState {
  tab: Tab;
  range: TimeRange;
  customStart: string;
  customEnd: string;
  chartUnit: "kw" | "kwh";
  rangeData: RangeData | null;
  sensors: SensorsResponse | null;
  config: BillingConfig | null;
  loading: boolean;
  error: string | null;
  mode: "ha" | "standalone";
  credentials: Credentials | null;
}

export class LenedaApp {
  private root: HTMLElement;
  private state: AppState = {
    tab: "dashboard",
    range: "yesterday",
    customStart: "",
    customEnd: "",
    chartUnit: "kw",
    rangeData: null,
    sensors: null,
    config: null,
    loading: true,
    error: null,
    mode: "ha",
    credentials: null,
  };

  /** Pre-zoom state — restored when user clicks "Reset Zoom" */
  private preZoomRange: TimeRange | null = null;
  private preZoomCustomStart = "";
  private preZoomCustomEnd = "";

  constructor(root: HTMLElement) {
    this.root = root;
  }

  async mount(): Promise<void> {
    this.render();

    // Detect deployment mode first
    const modeInfo = await fetchMode();
    this.state.mode = modeInfo.mode;

    if (modeInfo.mode === "standalone") {
      // Load credentials from browser localStorage (instant, reliable)
      const localCreds = loadLocalCredentials();
      if (localCreds) {
        this.state.credentials = localCreds;
      }

      if (!modeInfo.configured && !localCreds) {
        // Not configured — send user to Settings to enter credentials
        this.state.tab = "settings";
        this.state.loading = false;
        this.state.error = "Please configure your Leneda API credentials in Settings.";
        this.render();
        return;
      }

      // If we have local creds but server says not configured, push them to server
      if (!modeInfo.configured && localCreds) {
        try {
          const { saveCredentials: save } = await import("../api/leneda");
          await save(localCreds);
        } catch { /* best effort */ }
      }

      // If no local creds, try fetching from server as fallback
      if (!localCreds) {
        try {
          this.state.credentials = await fetchCredentials();
        } catch { /* ignore */ }
      }
    }

    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.state.loading = true;
    this.state.error = null;
    this.render();

    try {
      const [rangeData, sensors, config] = await Promise.all([
        fetchRangeData(this.state.range),
        fetchSensors(),
        fetchConfig(),
      ]);
      this.state.rangeData = rangeData;
      this.state.sensors = sensors;
      this.state.config = config;
    } catch (e) {
      this.state.error =
        e instanceof Error ? e.message : "Failed to load data";
    } finally {
      this.state.loading = false;
      this.render();
    }
  }


  private async changeRange(range: TimeRange): Promise<void> {
    this.preZoomRange = null;
    this.state.range = range;

    if (range === "custom") {
      // Set default dates (last 7 days) if not already set
      if (!this.state.customStart || !this.state.customEnd) {
        const end = new Date();
        end.setDate(end.getDate() - 1);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        this.state.customStart = start.toISOString().slice(0, 10);
        this.state.customEnd = end.toISOString().slice(0, 10);
      }
      // Just show the picker — don't fetch until Apply is clicked
      this.render();
      return;
    }

    this.state.loading = true;
    this.render();
    try {
      const { fetchRangeData } = await import("../api/leneda");
      this.state.rangeData = await fetchRangeData(range);
    } catch (e) {
      this.state.error = e instanceof Error ? e.message : "Failed to load data";
    } finally {
      this.state.loading = false;
      this.render();
    }
  }

  private async applyCustomRange(): Promise<void> {
    this.preZoomRange = null;
    const { customStart, customEnd } = this.state;
    if (!customStart || !customEnd) return;

    this.state.loading = true;
    this.render();

    try {
      const { fetchCustomData } = await import("../api/leneda");
      const data = await fetchCustomData(customStart, customEnd);
      this.state.rangeData = {
        range: "custom",
        consumption: data.consumption,
        production: data.production,
        exported: data.exported ?? 0,
        self_consumed: data.self_consumed ?? 0,
        gas_energy: data.gas_energy ?? 0,
        gas_volume: data.gas_volume ?? 0,
        peak_power_kw: data.peak_power_kw ?? 0,
        exceedance_kwh: data.exceedance_kwh ?? 0,
        metering_point: data.metering_point ?? "",
      };
    } catch (e) {
      this.state.error =
        e instanceof Error ? e.message : "Failed to load custom data";
    } finally {
      this.state.loading = false;
      this.render();
    }
  }

  private changeTab(tab: Tab): void {
    this.state.tab = tab;
    this.render();

    // Lazy-load data for specific tabs
    if (tab === "sensors" && !this.state.sensors) {
      fetchSensors().then((s) => {
        this.state.sensors = s;
        this.render();
      });
    }
    if (tab === "settings" && !this.state.config) {
      fetchConfig().then((c) => {
        this.state.config = c;
        this.render();
      });
    }
  }

  private render(): void {
    const { tab, loading, error } = this.state;

    // ── Skeleton while loading ──
    if (loading && !this.state.rangeData) {
      this.root.innerHTML = `
        <div class="app-shell">
          ${renderNavBar(tab, (_t) => { })}
          <main class="main-content">
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading Leneda data…</p>
            </div>
          </main>
        </div>
      `;
      return;
    }

    // ── Error state ──
    if (error && !this.state.rangeData) {
      this.root.innerHTML = `
        <div class="app-shell">
          ${renderNavBar(tab, (_t) => { })}
          <main class="main-content">
            <div class="error-state">
              <h2>Connection Error</h2>
              <p>${error}</p>
              <button class="btn btn-primary" id="retry-btn">Retry</button>
            </div>
          </main>
        </div>
      `;
      this.root.querySelector("#retry-btn")?.addEventListener("click", () => this.loadData());
      return;
    }

    // ── Normal render ──
    let tabContent = "";
    switch (tab) {
      case "dashboard":
        tabContent = renderDashboard(this.state);
        break;
      case "sensors":
        tabContent = renderSensors(this.state.sensors);
        break;
      case "invoice":
        tabContent = renderInvoice(this.state);
        break;
      case "settings":
        tabContent = renderSettings(this.state.config, this.state.mode, this.state.credentials);
        break;
    }

    this.root.innerHTML = `
      <div class="app-shell">
        ${renderNavBar(tab, (t) => this.changeTab(t))}
        <main class="main-content">
          ${loading ? '<div class="loading-bar"></div>' : ""}
          ${tabContent}
        </main>
      </div>
    `;

    // ── Attach event listeners ──
    this.attachNavListeners();
    this.attachDashboardListeners();
    this.attachSettingsListeners();
  }

  private attachNavListeners(): void {
    this.root.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = (btn as HTMLElement).dataset.tab as Tab;
        this.changeTab(tab);
      });
    });
  }

  private attachDashboardListeners(skipChart = false): void {
    // Range selector buttons
    this.root.querySelectorAll("[data-range]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const range = (btn as HTMLElement).dataset.range as TimeRange;
        this.changeRange(range);
      });
    });

    // Custom range: date inputs + apply button
    const startInput = this.root.querySelector("#custom-start") as HTMLInputElement | null;
    const endInput = this.root.querySelector("#custom-end") as HTMLInputElement | null;
    if (startInput) startInput.addEventListener("change", () => { this.state.customStart = startInput.value; });
    if (endInput) endInput.addEventListener("change", () => { this.state.customEnd = endInput.value; });

    const applyBtn = this.root.querySelector("#apply-custom-range");
    applyBtn?.addEventListener("click", () => this.applyCustomRange());

    // Chart unit toggle (kW / kWh)
    this.root.querySelectorAll("[data-chart-unit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const unit = (btn as HTMLElement).dataset.chartUnit as "kw" | "kwh";
        if (unit !== this.state.chartUnit) {
          this.state.chartUnit = unit;
          this.render();
        }
      });
    });

    // Initialize chart if canvas is present (skip during partial zoom updates)
    if (!skipChart) {
      const canvas = this.root.querySelector("#energy-chart") as HTMLCanvasElement | null;
      if (canvas && this.state.rangeData) {
        this.initChart(canvas);
      }
    }

    // Reset zoom button — restores the range that was active before zooming
    const resetZoomBtn = this.root.querySelector(".reset-zoom-btn");
    resetZoomBtn?.addEventListener("click", async () => {
      const { resetChartZoom } = await import("./Charts");
      resetChartZoom();
      (resetZoomBtn as HTMLElement).style.display = "none";

      if (this.preZoomRange !== null) {
        const origRange = this.preZoomRange;
        this.state.customStart = this.preZoomCustomStart;
        this.state.customEnd = this.preZoomCustomEnd;
        this.preZoomRange = null;
        this.preZoomCustomStart = "";
        this.preZoomCustomEnd = "";

        if (origRange === "custom") {
          this.state.range = "custom";
          this.applyCustomRange();
        } else {
          this.changeRange(origRange);
        }
      } else {
        this.changeRange(this.state.range === "custom" ? "yesterday" : this.state.range);
      }
    });
  }

  private attachSettingsListeners(): void {
    // ── Credentials form (standalone mode only) ──
    const credsForm = this.root.querySelector("#credentials-form") as HTMLFormElement | null;
    if (credsForm) {

      // ── Add / Remove meter buttons ──
      const addMeterBtn = this.root.querySelector("#add-meter-btn");
      addMeterBtn?.addEventListener("click", () => {
        // Collect current form state so typed values aren't lost on re-render
        const fd = new FormData(credsForm);
        const meters = collectMetersFromForm(fd);
        if (meters.length < 10) {
          meters.push({ id: "", types: ["consumption"] });
          const updated: Credentials = {
            api_key: (fd.get("api_key") as string) || this.state.credentials?.api_key || "",
            energy_id: (fd.get("energy_id") as string) || this.state.credentials?.energy_id || "",
            meters,
          };
          this.state.credentials = updated;
          saveLocalCredentials(updated);
          this.render();
        }
      });

      this.root.querySelectorAll(".remove-meter-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt((btn as HTMLElement).dataset.meter ?? "0", 10);
          // Collect current form state so typed values aren't lost on re-render
          const fd = new FormData(credsForm);
          const meters = collectMetersFromForm(fd);
          meters.splice(idx, 1);
          const updated: Credentials = {
            api_key: (fd.get("api_key") as string) || this.state.credentials?.api_key || "",
            energy_id: (fd.get("energy_id") as string) || this.state.credentials?.energy_id || "",
            meters,
          };
          this.state.credentials = updated;
          saveLocalCredentials(updated);
          this.render();
        });
      });

      /** Collect meters array from form fields */
      const collectMetersFromForm = (fd: FormData): MeterConfig[] => {
        const meters: MeterConfig[] = [];
        for (let i = 0; i < 10; i++) {
          const id = fd.get(`meter_${i}_id`) as string | null;
          if (id === null) break; // no more meters in form
          const types: MeterConfig["types"] = [];
          if ((credsForm.querySelector(`[name="meter_${i}_consumption"]`) as HTMLInputElement)?.checked) types.push("consumption");
          if ((credsForm.querySelector(`[name="meter_${i}_production"]`) as HTMLInputElement)?.checked) types.push("production");
          if ((credsForm.querySelector(`[name="meter_${i}_gas"]`) as HTMLInputElement)?.checked) types.push("gas");
          meters.push({ id: id.trim(), types });
        }
        return meters;
      };

      credsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(credsForm);
        const creds: Credentials = {
          api_key: fd.get("api_key") as string,
          energy_id: fd.get("energy_id") as string,
          meters: collectMetersFromForm(fd),
        };
        const statusEl = this.root.querySelector("#creds-status");
        try {
          // Save to localStorage (browser-side persistence)
          saveLocalCredentials(creds);
          // Also push to server (for API proxying in standalone mode)
          const { saveCredentials: save } = await import("../api/leneda");
          await save(creds);
          if (statusEl) statusEl.innerHTML = '<p style="color: var(--clr-production); padding: var(--sp-3) 0;">✓ Credentials saved. Reloading data…</p>';
          // Update state from localStorage (source of truth — unmasked)
          this.state.credentials = creds;
          this.state.error = null;
          await this.loadData();
        } catch (err) {
          if (statusEl) statusEl.innerHTML = `<p style="color: var(--clr-danger); padding: var(--sp-3) 0;">✗ Save failed: ${err instanceof Error ? err.message : err}</p>`;
        }
      });

      const testBtn = this.root.querySelector("#test-creds-btn");
      testBtn?.addEventListener("click", async () => {
        const fd = new FormData(credsForm);
        const creds: Credentials = {
          api_key: fd.get("api_key") as string,
          energy_id: fd.get("energy_id") as string,
          meters: collectMetersFromForm(fd),
        };
        const statusEl = this.root.querySelector("#creds-status");
        if (statusEl) statusEl.innerHTML = '<p style="color: var(--clr-muted); padding: var(--sp-3) 0;">Testing connection…</p>';
        try {
          const { testCredentials: test } = await import("../api/leneda");
          const result = await test(creds);
          if (statusEl) {
            statusEl.innerHTML = result.success
              ? `<p style="color: var(--clr-production); padding: var(--sp-3) 0;">✓ ${result.message}</p>`
              : `<p style="color: var(--clr-danger); padding: var(--sp-3) 0;">✗ ${result.message}</p>`;
          }
        } catch (err) {
          if (statusEl) statusEl.innerHTML = `<p style="color: var(--clr-danger); padding: var(--sp-3) 0;">✗ Test failed: ${err instanceof Error ? err.message : err}</p>`;
        }
      });
    }

    // ── Billing config form ──
    const form = this.root.querySelector("#settings-form") as HTMLFormElement | null;
    if (!form) return;

    // ── Per-meter feed-in mode toggles (show/hide fixed vs sensor fields) ──
    form.querySelectorAll<HTMLInputElement>('input[type="radio"][name^="feed_in_rate_"][name$="_mode"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        // Extract the index from name like "feed_in_rate_0_mode"
        const match = radio.name.match(/feed_in_rate_(\d+)_mode/);
        if (!match) return;
        const idx = match[1];
        const fixedEl = form.querySelector(`.feed-in-fixed-fields[data-rate-idx="${idx}"]`) as HTMLElement | null;
        const sensorEl = form.querySelector(`.feed-in-sensor-fields[data-rate-idx="${idx}"]`) as HTMLElement | null;
        if (fixedEl) fixedEl.style.display = radio.value === "fixed" ? "" : "none";
        if (sensorEl) sensorEl.style.display = radio.value === "sensor" ? "" : "none";
      });
    });

    // ── HA entity datalist population (shared for all meter sensor pickers) ──
    if (this.state.mode === "ha") {
      const datalist = this.root.querySelector("#ha-entity-list") as HTMLDataListElement | null;
      if (datalist) {
        // Include auth token for HA mode
        const headers: Record<string, string> = {};
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const el = (window as any).parent?.document?.querySelector("home-assistant");
          const t = el?.hass?.auth?.data?.access_token;
          if (t) headers["Authorization"] = `Bearer ${t}`;
        } catch { /* standalone mode — no parent hass */ }
        fetch("/leneda_api/ha-entities", { headers, credentials: "include" })
          .then((r) => r.ok ? r.json() as Promise<{ entities: string[] }> : Promise.resolve({ entities: [] }))
          .then(({ entities }) => {
            datalist.innerHTML = entities
              .map((e: string) => `<option value="${e}"></option>`)
              .join("");
          })
          .catch(() => { /* ignore — datalist just stays empty */ });
      }
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data: Record<string, number | string | boolean | unknown[]> = {};

      // Collect all checkboxes first (unchecked ones aren't in FormData)
      form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((cb) => {
        data[cb.name] = cb.checked;
      });

      // Collect per-meter feed-in rates
      const feedInRates: Array<{ meter_id: string; mode: string; tariff: number; sensor_entity: string }> = [];
      const ratePattern = /^feed_in_rate_(\d+)_(.+)$/;
      const rateMap: Record<string, Record<string, string>> = {};

      // Collect per-meter monthly fees
      const meterFees: Array<{ meter_id: string; label: string; fee: number }> = [];
      const feePattern = /^meter_fee_(\d+)_(.+)$/;
      const feeMap: Record<string, Record<string, string>> = {};

      for (const [key, val] of fd.entries()) {
        const m = key.match(ratePattern);
        if (m) {
          const idx = m[1];
          const field = m[2];
          if (!rateMap[idx]) rateMap[idx] = {};
          rateMap[idx][field] = val as string;
          continue; // don't add to flat data
        }
        const mf = key.match(feePattern);
        if (mf) {
          const idx = mf[1];
          const field = mf[2];
          if (!feeMap[idx]) feeMap[idx] = {};
          feeMap[idx][field] = val as string;
          continue;
        }
        // Skip checkbox entries (already handled above)
        if (data[key] !== undefined && typeof data[key] === "boolean") continue;
        const num = parseFloat(val as string);
        data[key] = isNaN(num) ? (val as string) : num;
      }

      // Build feed_in_rates array from collected per-meter fields
      for (const idx of Object.keys(rateMap).sort()) {
        const rm = rateMap[idx];
        feedInRates.push({
          meter_id: rm.meter_id ?? "",
          mode: rm.mode ?? "fixed",
          tariff: parseFloat(rm.tariff ?? "0.08") || 0.08,
          sensor_entity: rm.sensor_entity ?? "",
        });
      }
      if (feedInRates.length > 0) data.feed_in_rates = feedInRates;

      // Build meter_monthly_fees array from collected per-meter fields
      for (const idx of Object.keys(feeMap).sort()) {
        const fm = feeMap[idx];
        meterFees.push({
          meter_id: fm.meter_id ?? "",
          label: fm.label ?? "",
          fee: parseFloat(fm.fee ?? "0") || 0,
        });
      }
      if (meterFees.length > 0) data.meter_monthly_fees = meterFees;

      try {
        const { saveConfig: save } = await import("../api/leneda");
        await save(data);
        this.state.config = await fetchConfig();
        this.render();
      } catch (err) {
        alert("Failed to save: " + (err instanceof Error ? err.message : err));
      }
    });

    const resetBtn = this.root.querySelector("#reset-config-btn");
    resetBtn?.addEventListener("click", async () => {
      if (!confirm("Reset all billing rates to defaults?")) return;
      try {
        const { resetConfig: reset } = await import("../api/leneda");
        await reset();
        this.state.config = await fetchConfig();
        this.render();
      } catch (err) {
        alert("Failed to reset: " + (err instanceof Error ? err.message : err));
      }
    });
  }

  private async initChart(canvas: HTMLCanvasElement): Promise<void> {
    try {
      const { renderEnergyChart } = await import("./Charts");
      const { fetchTimeseries } = await import("../api/leneda");

      // Compute date range for the currently selected period
      const { start, end } = this.getDateRangeISO();

      // Fetch consumption + production timeseries for that range
      const [consumption, production] = await Promise.all([
        fetchTimeseries("1-1:1.29.0", start, end),
        fetchTimeseries("1-1:2.29.0", start, end),
      ]);

      const referencePowerKw = this.state.config?.reference_power_kw ?? 0;

      renderEnergyChart(canvas, consumption, production, {
        unit: this.state.chartUnit,
        referencePowerKw,
        onZoomChange: (zoomStart: string, zoomEnd: string) => {
          this.handleChartZoomChange(zoomStart, zoomEnd);
        },
      });
    } catch (e) {
      console.error("Chart init failed:", e);
    }
  }

  /**
   * Called when the user zooms/pans the chart.
   * Switches to "custom" range, fetches data for the visible period,
   * and updates the entire dashboard (except the chart canvas) so
   * key metrics, flow diagram, stat cards, and invoice all reflect the zoom.
   */
  private async handleChartZoomChange(start: string, end: string): Promise<void> {
    try {
      // Save the original range on first zoom so Reset Zoom can restore it
      if (this.preZoomRange === null) {
        this.preZoomRange = this.state.range;
        this.preZoomCustomStart = this.state.customStart;
        this.preZoomCustomEnd = this.state.customEnd;
      }

      const { fetchCustomData } = await import("../api/leneda");
      const startDate = start.slice(0, 10);
      const endDate = end.slice(0, 10);
      const data = await fetchCustomData(startDate, endDate);

      // Switch to custom range with the zoomed period
      this.state.range = "custom";
      this.state.customStart = startDate;
      this.state.customEnd = endDate;
      this.state.rangeData = {
        range: "custom",
        consumption: data.consumption,
        production: data.production,
        exported: data.exported ?? 0,
        self_consumed: data.self_consumed ?? 0,
        gas_energy: data.gas_energy ?? 0,
        gas_volume: data.gas_volume ?? 0,
        peak_power_kw: data.peak_power_kw ?? 0,
        exceedance_kwh: data.exceedance_kwh ?? 0,
        metering_point: data.metering_point ?? "",
      };

      // Partial DOM update — everything except the chart canvas
      this.renderDashboardPartial();
    } catch (e) {
      console.error("Zoom data fetch failed:", e);
    }
  }

  /**
   * Partial dashboard re-render: updates range selector, date picker,
   * stat cards, flow diagram, key metrics, and chart title — but
   * leaves the chart canvas untouched so zoom/pan state is preserved.
   * Also re-attaches event listeners for the replaced DOM elements.
   */
  private renderDashboardPartial(): void {
    const dashboard = this.root.querySelector(".dashboard");
    if (!dashboard || !this.state.rangeData) return;

    // Render the full dashboard to a temp element, then cherry-pick sections
    const temp = document.createElement("div");
    temp.innerHTML = renderDashboard(this.state);
    const src = temp.querySelector(".dashboard");
    if (!src) return;

    // 1. Range selector — highlight "Custom" as active
    const oldRange = dashboard.querySelector(".range-selector");
    const newRange = src.querySelector(".range-selector");
    if (oldRange && newRange) oldRange.replaceWith(newRange);

    // 2. Custom date picker — show the zoomed dates
    const oldPicker = dashboard.querySelector(".custom-range-picker");
    const newPicker = src.querySelector(".custom-range-picker");
    if (oldPicker && newPicker) {
      oldPicker.replaceWith(newPicker);
    } else if (!oldPicker && newPicker) {
      dashboard.querySelector(".range-selector")?.insertAdjacentElement("afterend", newPicker);
    } else if (oldPicker && !newPicker) {
      oldPicker.remove();
    }

    // 3. Stat cards
    const oldStats = dashboard.querySelector(".stats-grid");
    const newStats = src.querySelector(".stats-grid");
    if (oldStats && newStats) oldStats.replaceWith(newStats);

    // 4. Flow diagram + key metrics
    const oldFlow = dashboard.querySelector(".flow-card");
    const newFlow = src.querySelector(".flow-card");
    if (oldFlow && newFlow) oldFlow.replaceWith(newFlow);

    const oldMetrics = dashboard.querySelector(".metrics-card");
    const newMetrics = src.querySelector(".metrics-card");
    if (oldMetrics && newMetrics) oldMetrics.replaceWith(newMetrics);

    // 5. Chart title (shows the zoomed date range)
    const oldTitle = dashboard.querySelector(".chart-header .card-title");
    const newTitle = src.querySelector(".chart-header .card-title");
    if (oldTitle && newTitle) oldTitle.replaceWith(newTitle);

    // Show reset-zoom button
    const resetBtn = dashboard.querySelector(".reset-zoom-btn") as HTMLElement | null;
    if (resetBtn) resetBtn.style.display = "";

    // Re-attach event listeners for replaced elements
    dashboard.querySelectorAll("[data-range]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.changeRange((btn as HTMLElement).dataset.range as TimeRange);
      });
    });

    const startInput = dashboard.querySelector("#custom-start") as HTMLInputElement | null;
    const endInput = dashboard.querySelector("#custom-end") as HTMLInputElement | null;
    if (startInput) startInput.addEventListener("change", () => { this.state.customStart = startInput.value; });
    if (endInput) endInput.addEventListener("change", () => { this.state.customEnd = endInput.value; });

    dashboard.querySelector("#apply-custom-range")?.addEventListener("click", () => {
      this.preZoomRange = null; // User is now manually using custom range
      this.applyCustomRange();
    });
  }

  /**
   * Compute ISO start/end date strings for the currently selected range.
   */
  private getDateRangeISO(): { start: string; end: string } {
    const now = new Date();
    const fmt = (d: Date) => d.toISOString();

    switch (this.state.range) {
      case "custom": {
        const s = new Date(this.state.customStart + "T00:00:00");
        const e = new Date(this.state.customEnd + "T23:59:59.999");
        return { start: fmt(s), end: fmt(e) };
      }
      case "yesterday": {
        const d = new Date(now);
        d.setDate(d.getDate() - 1);
        d.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        return { start: fmt(d), end: fmt(end) };
      }
      case "this_week": {
        const d = new Date(now);
        const day = d.getDay() || 7; // Mon=1
        d.setDate(d.getDate() - day + 1);
        d.setHours(0, 0, 0, 0);
        return { start: fmt(d), end: fmt(now) };
      }
      case "last_week": {
        const d = new Date(now);
        const day = d.getDay() || 7;
        const endLW = new Date(d);
        endLW.setDate(d.getDate() - day);
        endLW.setHours(23, 59, 59, 999);
        const startLW = new Date(endLW);
        startLW.setDate(endLW.getDate() - 6);
        startLW.setHours(0, 0, 0, 0);
        return { start: fmt(startLW), end: fmt(endLW) };
      }
      case "this_month": {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: fmt(start), end: fmt(now) };
      }
      case "last_month": {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return { start: fmt(start), end: fmt(end) };
      }
      case "this_year": {
        const start = new Date(now.getFullYear(), 0, 1);
        return { start: fmt(start), end: fmt(now) };
      }
      case "last_year": {
        const start = new Date(now.getFullYear() - 1, 0, 1);
        const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        return { start: fmt(start), end: fmt(end) };
      }
      default: {
        // Fallback to yesterday
        const d = new Date(now);
        d.setDate(d.getDate() - 1);
        d.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        return { start: fmt(d), end: fmt(end) };
      }
    }
  }
}

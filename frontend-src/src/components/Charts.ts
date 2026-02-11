/**
 * Charts — Chart.js bar chart for energy timeseries visualization.
 *
 * Supports two display modes:
 *  - kW:  Raw 15-min power readings with a reference power limit line.
 *         Bars exceeding the reference are highlighted in red.
 *  - kWh: Aggregated energy view. ≤120 points → raw bars, >120 → daily totals.
 *
 * Interactive zoom (mouse-wheel / pinch) and pan (drag) on the x-axis.
 * When the visible range changes, an optional onZoomChange callback fires
 * so the app can re-fetch aggregated data for the visible period.
 */
import { Chart, registerables, type ChartConfiguration } from "chart.js";
import "chartjs-adapter-date-fns";
import zoomPlugin from "chartjs-plugin-zoom";
import type { TimeseriesResponse, TimeseriesItem, PerMeterTimeseries } from "../api/leneda";

// Extend Chart.js plugin options to include our custom referenceLine plugin
declare module "chart.js" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType extends keyof import("chart.js").ChartTypeRegistry> {
    referenceLine?: {
      value?: number;
      color?: string;
      label?: string;
    };
  }
}

// Register all Chart.js components + zoom plugin
Chart.register(...registerables, zoomPlugin);

// Store chart instance for cleanup
let chartInstance: Chart | null = null;

export interface ChartOptions {
  /** Display unit: "kw" = raw power, "kwh" = energy (auto-aggregated) */
  unit: "kw" | "kwh";
  /** Reference power limit in kW. Drawn as a horizontal line in kW mode. */
  referencePowerKw: number;
  /** Called when the user zooms / pans — receives the visible ISO date range. */
  onZoomChange?: (start: string, end: string) => void;
  /** Per-meter production data for stacked green-shade chart. */
  perMeterProduction?: PerMeterTimeseries[];
}

/** Distinct green/teal/lime shades for per-panel production datasets.
 * Chosen for maximum visual separation in a dark-mode theme. */
const PRODUCTION_GREENS = [
  { bg: "rgba(190, 245, 39, 0.80)", border: "#bef527" }, // High-contrast Lime (#BEF527)
  { bg: "rgba(35, 134, 54, 0.85)", border: "#2ea043" }, // GitHub Emerald
  { bg: "rgba(0, 150, 136, 0.80)", border: "#009688" }, // Teal
  { bg: "rgba(111, 219, 139, 0.80)", border: "#6fdb8b" }, // Light Mint
  { bg: "rgba(0, 77, 64, 0.90)", border: "#004d40" }, // Deep Teal
  { bg: "rgba(27, 94, 32, 0.90)", border: "#1b5e20" }, // Dark Forest
  { bg: "rgba(139, 195, 74, 0.80)", border: "#8bc34a" }, // Mossy Green
  { bg: "rgba(0, 255, 127, 0.70)", border: "#00ff7f" }, // Spring Green
];

/** A single data point with a real timestamp for time-scale. */
interface TimePoint {
  x: number;           // ms timestamp
  y: number;
}

/**
 * Aggregate 15-min power readings (kW) into daily energy totals (kWh).
 * Returns points positioned at midnight of each day.
 */
function aggregateToDaily(
  consumptionItems: TimeseriesItem[],
  productionItems: TimeseriesItem[],
): { consumption: TimePoint[]; production: TimePoint[] } {
  const cMap = new Map<string, number>();
  const pMap = new Map<string, number>();

  for (const item of consumptionItems) {
    const day = item.startedAt.slice(0, 10);
    cMap.set(day, (cMap.get(day) ?? 0) + item.value * 0.25);
  }
  for (const item of productionItems) {
    const day = item.startedAt.slice(0, 10);
    pMap.set(day, (pMap.get(day) ?? 0) + item.value * 0.25);
  }

  const allDays = [...new Set([...cMap.keys(), ...pMap.keys()])].sort();
  const consumption: TimePoint[] = [];
  const production: TimePoint[] = [];
  for (const day of allDays) {
    const t = new Date(day + "T12:00:00").getTime();   // midday for nicer display
    consumption.push({ x: t, y: cMap.get(day) ?? 0 });
    production.push({ x: t, y: pMap.get(day) ?? 0 });
  }
  return { consumption, production };
}

/** Build raw 15-min TimePoints (kW) for display. */
function buildRawTimePoints(
  consumptionItems: TimeseriesItem[],
  productionItems: TimeseriesItem[],
): { consumption: TimePoint[]; production: TimePoint[] } {
  const consumption: TimePoint[] = consumptionItems.map((item) => ({
    x: new Date(item.startedAt).getTime(),
    y: item.value,
  }));
  const production: TimePoint[] = productionItems.map((item) => ({
    x: new Date(item.startedAt).getTime(),
    y: item.value,
  }));
  return { consumption, production };
}

/**
 * Inline Chart.js plugin that draws a horizontal reference-power line.
 */
const referenceLinePlugin = {
  id: "referenceLine",
  afterDraw(chart: Chart, _args: unknown, opts: { value?: number; color?: string; label?: string }) {
    const refValue = opts.value;
    if (!refValue || refValue <= 0) return;

    const yScale = chart.scales.y;
    if (!yScale) return;

    const yPixel = yScale.getPixelForValue(refValue);
    const { ctx, chartArea } = chart;

    ctx.save();
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = opts.color ?? "#d29922";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartArea.left, yPixel);
    ctx.lineTo(chartArea.right, yPixel);
    ctx.stroke();
    ctx.setLineDash([]);

    const labelText = opts.label ?? `Reference ${refValue} kW`;
    ctx.fillStyle = opts.color ?? "#d29922";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(labelText, chartArea.right - 4, yPixel - 4);
    ctx.restore();
  },
};

/** Helper: extract the current visible x-axis range from the chart. */
function getVisibleRange(chart: Chart): { start: string; end: string } | null {
  const xScale = chart.scales.x;
  if (!xScale) return null;
  const minMs = xScale.min;
  const maxMs = xScale.max;
  if (typeof minMs !== "number" || typeof maxMs !== "number") return null;
  return {
    start: new Date(minMs).toISOString(),
    end: new Date(maxMs).toISOString(),
  };
}

/** Debounce helper to avoid spamming data fetches during smooth zoom. */
let zoomDebounce: ReturnType<typeof setTimeout> | null = null;

function emitZoomChange(chart: Chart, cb?: (start: string, end: string) => void): void {
  if (!cb) return;
  if (zoomDebounce) clearTimeout(zoomDebounce);
  zoomDebounce = setTimeout(() => {
    const range = getVisibleRange(chart);
    if (range) cb(range.start, range.end);
  }, 400);
}

export function renderEnergyChart(
  canvas: HTMLCanvasElement,
  consumption: TimeseriesResponse,
  production: TimeseriesResponse,
  options: ChartOptions = { unit: "kw", referencePowerKw: 0 },
): void {
  // Destroy previous chart if it exists
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const { unit, referencePowerKw, onZoomChange } = options;
  const totalPoints = Math.max(consumption.items.length, production.items.length);

  let cPoints: TimePoint[];
  let pPoints: TimePoint[];
  let yLabel: string;

  if (unit === "kwh") {
    const useDaily = totalPoints > 120;
    if (useDaily) {
      const agg = aggregateToDaily(consumption.items, production.items);
      cPoints = agg.consumption;
      pPoints = agg.production;
    } else {
      const raw = buildRawTimePoints(consumption.items, production.items);
      cPoints = raw.consumption.map((p) => ({ x: p.x, y: p.y * 0.25 }));
      pPoints = raw.production.map((p) => ({ x: p.x, y: p.y * 0.25 }));
    }
    yLabel = "kWh";
  } else {
    const raw = buildRawTimePoints(consumption.items, production.items);
    cPoints = raw.consumption;
    pPoints = raw.production;
    yLabel = "kW";
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const showRefLine = unit === "kw" && referencePowerKw > 0;

  // Per-bar coloring for exceedance highlighting
  const consumptionColors = cPoints.map((p) =>
    showRefLine && p.y > referencePowerKw
      ? "rgba(248, 81, 73, 1)"
      : "rgba(248, 81, 73, 0.55)"
  );
  const consumptionBorderColors = cPoints.map((p) =>
    showRefLine && p.y > referencePowerKw ? "#ff3b30" : "#f85149"
  );

  // Determine time unit for display based on data span
  const timestamps = [...cPoints, ...pPoints].map((p) => p.x);
  const spanMs = timestamps.length > 1 ? Math.max(...timestamps) - Math.min(...timestamps) : 0;
  const spanDays = spanMs / 86_400_000;
  const timeUnit = spanDays > 14 ? "day" : spanDays > 2 ? "day" : "hour";
  const barPercentage = spanDays > 7 ? 0.85 : 0.65;

  const config: ChartConfiguration<"bar"> = {
    type: "bar",
    data: {
      datasets: [
        {
          label: `Consumption (${yLabel})`,
          data: cPoints as any,
          backgroundColor: consumptionColors,
          borderColor: consumptionBorderColors,
          borderWidth: 1,
          borderRadius: unit === "kwh" ? 4 : 2,
          barPercentage,
          stack: "main",
        },
        // Production datasets — one per meter if per-meter data available
        ...(options.perMeterProduction && options.perMeterProduction.length > 1
          ? options.perMeterProduction.map((meter, idx) => {
            const green = PRODUCTION_GREENS[idx % PRODUCTION_GREENS.length];
            const shortId = meter.meter_id ? "…" + meter.meter_id.slice(-8) : `Panel ${idx + 1}`;
            const meterPoints: TimePoint[] = unit === "kwh"
              ? (() => {
                const useDaily = meter.items.length > 120;
                if (useDaily) {
                  const pMap = new Map<string, number>();
                  for (const item of meter.items) {
                    const day = item.startedAt.slice(0, 10);
                    pMap.set(day, (pMap.get(day) ?? 0) + item.value * 0.25);
                  }
                  return [...pMap.entries()].sort().map(([day, val]) => ({ x: new Date(day + "T12:00:00").getTime(), y: val }));
                }
                return meter.items.map(i => ({ x: new Date(i.startedAt).getTime(), y: i.value * 0.25 }));
              })()
              : meter.items.map(i => ({ x: new Date(i.startedAt).getTime(), y: i.value }));
            return {
              label: `${shortId} (${yLabel})`,
              data: meterPoints as any,
              backgroundColor: green.bg,
              borderColor: green.border,
              borderWidth: 1,
              borderRadius: unit === "kwh" ? 4 : 2,
              barPercentage,
              stack: "production",
            };
          })
          : [{
            label: `Production (${yLabel})`,
            data: pPoints as any,
            backgroundColor: "rgba(63, 185, 80, 0.55)",
            borderColor: "#3fb950",
            borderWidth: 1,
            borderRadius: unit === "kwh" ? 4 : 2,
            barPercentage,
            stack: "production",
          }]
        ),
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#8b949e",
            usePointStyle: true,
            pointStyle: "rectRounded",
            padding: 16,
            font: { size: 12 },
            generateLabels(chart) {
              const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
              if (showRefLine) {
                original.push({
                  text: `Reference Limit (${referencePowerKw} kW)`,
                  fillStyle: "transparent",
                  strokeStyle: "#d29922",
                  lineWidth: 2,
                  lineDash: [6, 3],
                  pointStyle: "line",
                  hidden: false,
                  index: original.length,
                });
                original.push({
                  text: "Over Reference",
                  fillStyle: "rgba(248, 81, 73, 1)",
                  strokeStyle: "#ff3b30",
                  lineWidth: 1,
                  pointStyle: "rectRounded",
                  hidden: false,
                  index: original.length,
                });
              }
              return original;
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(13, 17, 23, 0.95)",
          titleColor: "#e6edf3",
          bodyColor: "#b1bac4",
          borderColor: "#30363d",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            title(items) {
              if (!items.length) return "";
              const raw = items[0].raw as TimePoint;
              const d = new Date(raw.x);
              return spanDays > 2
                ? d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
            },
            label(tooltipCtx) {
              const val = (tooltipCtx.parsed.y ?? 0).toFixed(2);
              const line = `${tooltipCtx.dataset.label}: ${val} ${yLabel}`;
              if (
                showRefLine &&
                tooltipCtx.datasetIndex === 0 &&
                (tooltipCtx.parsed.y ?? 0) > referencePowerKw
              ) {
                const over = ((tooltipCtx.parsed.y ?? 0) - referencePowerKw).toFixed(2);
                return `${line}  ⚠️ +${over} kW over limit`;
              }
              return line;
            },
          },
        },
        referenceLine: showRefLine
          ? { value: referencePowerKw, color: "#d29922", label: `Reference ${referencePowerKw} kW` }
          : { value: 0 },
        zoom: {
          pan: {
            enabled: true,
            mode: "x",
            onPanComplete({ chart }: { chart: Chart }) {
              emitZoomChange(chart, onZoomChange);
            },
          },
          zoom: {
            wheel: { enabled: true, speed: 0.08 },
            pinch: { enabled: true },
            drag: {
              enabled: false,      // use wheel zoom + drag-to-pan
            },
            mode: "x",
            onZoomComplete({ chart }: { chart: Chart }) {
              emitZoomChange(chart, onZoomChange);
              // Show the reset button
              const btn = canvas.closest(".chart-card")?.querySelector(".reset-zoom-btn") as HTMLElement | null;
              if (btn) btn.style.display = "";
            },
          },
          limits: {
            x: {
              min: timestamps.length ? Math.min(...timestamps) - 3_600_000 : undefined,
              max: timestamps.length ? Math.max(...timestamps) + 3_600_000 : undefined,
            },
          },
        },
      },
      scales: {
        x: {
          type: "time",
          time: {
            unit: timeUnit,
            displayFormats: {
              hour: "HH:mm",
              day: "MMM d",
            },
            tooltipFormat: "PPp",
          },
          ticks: {
            color: "#8b949e",
            maxTicksLimit: 14,
            font: { size: 10 },
            maxRotation: 45,
          },
          grid: { color: "rgba(48, 54, 61, 0.3)" },
          // offset: true keeps bars centred on their time tick
          offset: true,
          stacked: true,
        },
        y: {
          beginAtZero: true,
          stacked: true,
          ticks: {
            color: "#8b949e",
            font: { size: 10 },
            callback(value) { return `${value} ${yLabel}`; },
          },
          grid: { color: "rgba(48, 54, 61, 0.3)" },
        },
      },
    },
    plugins: [referenceLinePlugin as any],
  };

  chartInstance = new Chart(ctx, config);
}

/** Reset the chart zoom back to the original range. */
export function resetChartZoom(): void {
  if (chartInstance) {
    chartInstance.resetZoom();
  }
}

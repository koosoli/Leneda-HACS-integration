/**
 * Dashboard — Main energy overview with stat cards, range selector, chart + flow.
 *
 * The energy flow diagram mirrors the Leneda portal layout:
 *   - Total Consumption / Total Production (top labels)
 *   - House in the center with solar panel icon
 *   - Grid tower on the left: bought from market ↑, sold to market ↓
 *   - Energy community on the right: shared ↓, shared with me ↑
 */
import type { AppState } from "./App";
import { fmtNum, fmtDate } from "../utils/format";

const RANGES: { id: string; label: string }[] = [
  { id: "yesterday", label: "Yesterday" },
  { id: "this_week", label: "This Week" },
  { id: "last_week", label: "Last Week" },
  { id: "this_month", label: "This Month" },
  { id: "last_month", label: "Last Month" },
  { id: "this_year", label: "This Year" },
  { id: "last_year", label: "Last Year" },
  { id: "custom", label: "Custom" },
];

export function renderDashboard(state: AppState): string {
  const d = state.rangeData;

  const consumption = d?.consumption ?? 0;
  const production = d?.production ?? 0;
  const exported = d?.exported ?? 0;
  const selfConsumed = d?.self_consumed ?? 0;
  const gasEnergy = d?.gas_energy ?? 0;
  const gasVolume = d?.gas_volume ?? 0;
  const peakPower = d?.peak_power_kw ?? 0;

  // Luxembourg energy flow model (derived from available data)
  const boughtFromMarket = Math.max(0, consumption - selfConsumed - (d?.shared_with_me ?? 0));
  const soldToMarket = Math.max(0, exported - (d?.shared ?? 0));
  const shared = d?.shared ?? 0;
  const sharedWithMe = d?.shared_with_me ?? 0;

  // Self-sufficiency
  const selfSufficiency =
    consumption > 0 ? Math.min(100, (selfConsumed / consumption) * 100) : 0;

  // Chart title — dynamic based on selected range
  const rangeLabel =
    state.range === "custom" && state.customStart && state.customEnd
      ? `${fmtDate(state.customStart + "T00:00:00")} — ${fmtDate(state.customEnd + "T00:00:00")}`
      : RANGES.find((r) => r.id === state.range)?.label ?? "Yesterday";

  return `
    <div class="dashboard" style="position: relative;">
      <div style="position:fixed;bottom:4px;right:4px;font-size:10px;opacity:0.5;pointer-events:none;z-index:9999;">v:2.0.2</div>

      <!-- Range Selector -->
      <div class="range-selector">
        ${RANGES.map(
    (r) => `
          <button
            class="range-btn ${r.id === state.range ? "active" : ""}"
            data-range="${r.id}"
          >${r.label}</button>
        `
  ).join("")}
      </div>

      ${(() => {
      if (!d?.start || !d?.end) return "";
      try {
        const s = new Date(d.start);
        const e = new Date(d.end);
        if (isNaN(s.getTime()) || isNaN(e.getTime())) return "";

        return `
            <div class="range-info-bar">
              📅 ${s.toLocaleDateString()} — ${e.toLocaleDateString()}
            </div>
          `;
      } catch {
        return "";
      }
    })()}

      ${state.range === "custom" ? `
      <!-- Custom Date Range Picker -->
      <div class="custom-range-picker">
        <label>
          <span>From</span>
          <input type="date" id="custom-start" value="${state.customStart ?? ""}" />
        </label>
        <label>
          <span>To</span>
          <input type="date" id="custom-end" value="${state.customEnd ?? ""}" />
        </label>
        <button class="btn btn-primary" id="apply-custom-range">Apply</button>
      </div>
      ` : ""}

      <!-- Stat Cards -->
      <div class="stats-grid">
        <div class="stat-card consumption">
          <div class="stat-icon">⚡</div>
          <div class="stat-body">
            <div class="stat-label">Consumption</div>
            <div class="stat-value">${fmtNum(consumption)} <span class="stat-unit">kWh</span></div>
          </div>
        </div>

        <div class="stat-card production">
          <div class="stat-icon">☀️</div>
          <div class="stat-body">
            <div class="stat-label">Production</div>
            <div class="stat-value">${fmtNum(production)} <span class="stat-unit">kWh</span></div>
          </div>
        </div>

        <div class="stat-card export">
          <div class="stat-icon">📤</div>
          <div class="stat-body">
            <div class="stat-label">Exported</div>
            <div class="stat-value">${fmtNum(exported)} <span class="stat-unit">kWh</span></div>
          </div>
        </div>

        <div class="stat-card self-consumed">
          <div class="stat-icon">🏠</div>
          <div class="stat-body">
            <div class="stat-label">Self-Consumed</div>
            <div class="stat-value">${fmtNum(selfConsumed)} <span class="stat-unit">kWh</span></div>
          </div>
        </div>
      </div>

      <!-- Energy Flow + Key Metrics side by side -->
      <div class="flow-metrics-row">
        <div class="card flow-card">
          <h3 class="card-title"><span class="title-icon">🔄</span> Energy Flow</h3>

          <div class="leneda-elite-flow">
            <!-- Glass Header: Floating Modules -->
            <div class="elite-header">
              <div class="glass-module consumption-module">
                <div class="module-info">
                  <span class="module-label">Daily Consumption <span class="info-icon">ⓘ</span></span>
                  <div class="module-value-row">
                    <span class="module-value highlight-red">${fmtNum(consumption)}</span>
                    <span class="module-unit">kWh</span>
                  </div>
                </div>
                <div class="module-visual"><div class="wave-bg red"></div></div>
              </div>

              <div class="glass-module production-module">
                <div class="module-info">
                  <span class="module-label">Solar Production <span class="info-icon">ⓘ</span></span>
                  <div class="module-value-row">
                    <span class="module-value highlight-green">${fmtNum(production)}</span>
                    <span class="module-unit">kWh</span>
                  </div>
                </div>
                <div class="module-visual"><div class="wave-bg green"></div></div>
              </div>
            </div>

            <!-- Central Immersive Scene -->
            <div class="elite-scene">
              <svg class="elite-main-svg" viewBox="0 0 800 400" fill="none" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <!-- Premium Filters -->
                  <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-blue" x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  <!-- Gradients for Veins -->
                  <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="var(--clr-consumption)" stop-opacity="0" />
                    <stop offset="50%" stop-color="var(--clr-consumption)" stop-opacity="1" />
                    <stop offset="100%" stop-color="var(--clr-consumption)" stop-opacity="0" />
                  </linearGradient>
                  
                  <radialGradient id="house-base-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="var(--clr-surface-alt)" stop-opacity="0.8" />
                    <stop offset="100%" stop-color="var(--clr-surface-alt)" stop-opacity="0" />
                  </radialGradient>
                </defs>

                <!-- Ambient Floor Glow -->
                <ellipse cx="400" cy="300" rx="350" ry="60" fill="url(#house-base-glow)" opacity="0.4" />

                <!-- Ground Horizon -->
                <line x1="50" y1="280" x2="750" y2="280" stroke="var(--clr-border)" stroke-width="1" stroke-opacity="0.5" />

                <!-- Grid Infrastructure (Left) -->
                <g class="tier-1-infrastructure" transform="translate(100, 160)">
                  <!-- Glowing powerline -->
                  <path d="M20 0 V120 M-10 25 H50 M-5 45 H45" stroke="var(--clr-consumption)" stroke-width="2.5" stroke-linecap="round" filter="url(#glow-red)" />
                  <path d="M5 10 L5 25 M35 10 L35 25" stroke="var(--clr-consumption)" stroke-width="1.5" />
                  <circle cx="20" cy="120" r="40" fill="var(--clr-consumption)" fill-opacity="0.05" />
                </g>

                <!-- The Grand House (Center) -->
                <g class="elite-house" transform="translate(320, 60)">
                  <!-- 3D Structure Feel -->
                  <path d="M0 80 L80 0 L160 80 V220 H0 Z" fill="var(--clr-surface)" stroke="var(--clr-border)" stroke-width="3" />
                  <path d="M80 0 V220" stroke="var(--clr-border)" stroke-width="1" stroke-opacity="0.2" />
                  
                  <!-- Elite Windows with 'Living Glow' -->
                  <rect x="25" y="100" width="30" height="40" rx="2" fill="rgba(88,166,255,0.05)" stroke="var(--clr-border)" stroke-width="1" />
                  <rect x="105" y="100" width="30" height="40" rx="2" fill="rgba(88,166,255,0.05)" stroke="var(--clr-border)" stroke-width="1" />
                  <rect x="60" y="160" width="40" height="60" rx="2" fill="var(--clr-surface-alt)" stroke="var(--clr-border)" stroke-width="2" />

                  <!-- Interior Status Centers -->
                  <g class="house-status" transform="translate(80, 120)">
                    <circle cx="-40" cy="0" r="18" fill="var(--clr-surface-alt)" stroke="var(--clr-border)" stroke-width="1.5" />
                    <!-- Smart Home Icon -->
                    <path d="M-45 4 V-4 L-40 -8 L-35 -4 V4 H-45 Z" fill="none" stroke="var(--clr-production)" stroke-width="1.5" />
                    
                    <circle cx="40" cy="0" r="18" fill="var(--clr-surface-alt)" stroke="var(--clr-border)" stroke-width="1.5" />
                    <!-- Shared Network Icon -->
                    <path d="M35 0 H45 M40 -5 V5 M37 -3 L43 3 M37 3 L43 -3" stroke="var(--clr-export)" stroke-width="1.5" />
                    
                    <text x="0" y="8" text-anchor="middle" font-size="28" opacity="0.8">💡</text>
                  </g>

                  <!-- Elite Solar Panels -->
                  <g transform="translate(115, 10) rotate(42)">
                    <rect x="0" y="0" width="55" height="15" rx="2" fill="rgba(63, 185, 80, 0.1)" stroke="var(--clr-production)" stroke-width="1.5" filter="url(#glow-green)" />
                    <rect x="0" y="22" width="55" height="15" rx="2" fill="rgba(63, 185, 80, 0.1)" stroke="var(--clr-production)" stroke-width="1.5" filter="url(#glow-green)" />
                    <line x1="10" y1="0" x2="10" y2="15" stroke="var(--clr-production)" stroke-width="0.5" stroke-opacity="0.3" />
                    <line x1="27" y1="0" x2="27" y2="15" stroke="var(--clr-production)" stroke-width="0.5" stroke-opacity="0.3" />
                  </g>
                </g>

                <!-- Energy Veins (Fluid Paths) -->
                <!-- Solar Production Line -->
                <path id="vein-solar" d="M 480 100 Q 420 180 400 180" stroke="var(--clr-production)" stroke-width="1" stroke-dasharray="100" />
                ${production > 0 ? `
                  <circle r="3.5" fill="var(--clr-production)" filter="url(#glow-green)">
                    <animateMotion dur="1.5s" repeatCount="indefinite" path="M 480 100 Q 420 180 400 180" />
                  </circle>
                ` : ''}

                <!-- Underground Veins -->
                <path id="vein-bought" d="M 140 280 H 400 V 280" stroke="var(--clr-consumption)" stroke-width="2" stroke-opacity="0.3" fill="none" />
                ${boughtFromMarket > 0 ? `
                  <circle r="5" fill="var(--clr-consumption)" filter="url(#glow-red)">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M 140 280 H 400 V 280" />
                  </circle>
                  <path d="M 395 295 L 400 285 L 405 295" stroke="var(--clr-consumption)" stroke-width="2.5" fill="none" />
                ` : ''}

                <path id="vein-sold" d="M 400 280 V 340 H 120" stroke="var(--clr-export)" stroke-width="2" stroke-opacity="0.3" fill="none" />
                ${soldToMarket > 0 ? `
                  <circle r="5" fill="var(--clr-export)" filter="url(#glow-blue)">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M 400 285 V 340 H 130" />
                  </circle>
                  <path d="M 140 345 L 130 340 L 140 335" stroke="var(--clr-export)" stroke-width="2.5" fill="none" />
                ` : ''}

              </svg>

              <!-- Absolute Glass Badges for Detailed Metrics -->
              <div class="elite-badges-grid">
                <div class="glass-badge highlight-red bought-badge">
                  <span class="badge-label">Market In</span>
                  <span class="badge-value">${fmtNum(boughtFromMarket)} <small>kWh</small></span>
                </div>
                <div class="glass-badge highlight-blue sold-badge">
                  <span class="badge-label">Market Out</span>
                  <span class="badge-value">${fmtNum(soldToMarket)} <small>kWh</small></span>
                </div>
                <div class="glass-badge highlight-blue shared-badge">
                  <span class="badge-label">Sent</span>
                  <span class="badge-value">${fmtNum(shared)} <small>kWh</small></span>
                </div>
                <div class="glass-badge highlight-blue received-badge">
                  <span class="badge-label">Received</span>
                  <span class="badge-value">${fmtNum(sharedWithMe)} <small>kWh</small></span>
                </div>
              </div>
            </div>
          </div>
      </div>

      <!-- Key Metrics (right of flow) -->
      <div class="card metrics-card">
        <h3 class="card-title"><span class="title-icon">📈</span> Key Metrics</h3>
        <div class="metrics-list">
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Self-Sufficiency</span>
              <span class="metric-value">${fmtNum(selfSufficiency, 1)}%</span>
            </div>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${selfSufficiency}%"></div>
            </div>
          </div>
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Self-Consumed</span>
              <span class="metric-value">${fmtNum(selfConsumed)} kWh</span>
            </div>
          </div>
          ${peakPower > 0 ? `
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Peak Power</span>
              <span class="metric-value">${fmtNum(peakPower, 2)} kW</span>
            </div>
          </div>
          ` : ""}
          <div class="metric ${(d?.exceedance_kwh ?? 0) > 0 ? "metric-warning" : "metric-ok"}">
            <div class="metric-header">
              <span class="metric-label">${(d?.exceedance_kwh ?? 0) > 0 ? "⚠️" : "✅"} Exceedance</span>
              <span class="metric-value">${fmtNum(d?.exceedance_kwh ?? 0, 2)} kWh</span>
            </div>
          </div>
          ${gasEnergy > 0 || gasVolume > 0 ? `
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Gas Energy</span>
              <span class="metric-value">${fmtNum(gasEnergy)} kWh</span>
            </div>
          </div>
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Gas Volume</span>
              <span class="metric-value">${fmtNum(gasVolume)} m³</span>
            </div>
          </div>
          ` : ""}
        </div>
      </div>
      </div>

      <!-- Chart -->
      <div class="card chart-card">
        <div class="chart-header">
          <h3 class="card-title"><span class="title-icon">📉</span> Energy Profile — ${rangeLabel}</h3>
          <div class="chart-unit-toggle">
            <button
              class="unit-btn ${state.chartUnit === "kw" ? "active" : ""}"
              data-chart-unit="kw"
              title="Show power (kW) — see when you exceed the reference limit"
            >kW</button>
            <button
              class="unit-btn ${state.chartUnit === "kwh" ? "active" : ""}"
              data-chart-unit="kwh"
              title="Show energy consumed (kWh)"
            >kWh</button>
            <button
              class="reset-zoom-btn"
              style="display: none;"
              title="Reset zoom to full period"
            >↩ Reset Zoom</button>
          </div>
        </div>
        <div class="chart-container">
          <canvas id="energy-chart"></canvas>
        </div>
        <p class="muted chart-hint" style="text-align:center; margin-top: var(--sp-2); font-size: var(--text-xs);">
          Scroll to zoom · Drag to pan · Key metrics update with visible range
        </p>
      </div>

      </div>

      </div>
    </section>
  `;
}

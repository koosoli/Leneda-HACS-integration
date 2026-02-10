/**
 * Sensors — Table view of all sensor values.
 */
import type { SensorsResponse } from "../api/leneda";
import { fmtNum, fmtDateTime } from "../utils/format";
import { getSensorDisplayName } from "../utils/obis";

export function renderSensors(data: SensorsResponse | null): string {
  if (!data || !data.sensors.length) {
    return `
      <section class="sensors-view">
        <div class="card">
          <p class="muted">No sensor data available. Waiting for coordinator update…</p>
        </div>
      </section>
    `;
  }

  // Group sensors by category
  const electricity: typeof data.sensors = [];
  const production: typeof data.sensors = [];
  const sharing: typeof data.sensors = [];
  const gas: typeof data.sensors = [];
  const other: typeof data.sensors = [];

  for (const s of data.sensors) {
    const k = s.key;
    if (k.startsWith("c_") || k === "1-1:1.29.0" || k === "1-1:3.29.0") {
      electricity.push(s);
    } else if (k.startsWith("p_") || k === "1-1:2.29.0" || k === "1-1:4.29.0") {
      production.push(s);
    } else if (k.startsWith("s_") || k.startsWith("1-65:")) {
      sharing.push(s);
    } else if (k.startsWith("g_") || k.startsWith("7-")) {
      gas.push(s);
    } else {
      other.push(s);
    }
  }

  const renderGroup = (title: string, icon: string, sensors: typeof data.sensors, colorClass: string) => {
    if (!sensors.length) return "";
    return `
      <div class="card sensor-group">
        <h3 class="card-title"><span class="title-icon">${icon}</span> ${title} <span class="badge">${sensors.length}</span></h3>
        <div style="overflow-x: auto;">
          <table class="sensor-table">
            <thead>
              <tr>
                <th>Sensor</th>
                <th style="text-align: right;">Value</th>
                <th>Unit</th>
                <th>Peak Time</th>
              </tr>
            </thead>
            <tbody>
              ${sensors
                .map(
                  (s) => `
                <tr>
                  <td class="sensor-name">${getSensorDisplayName(s.key)}</td>
                  <td class="sensor-value" style="text-align: right; color: var(--clr-${colorClass});">${fmtNum(s.value)}</td>
                  <td class="sensor-unit">${s.unit}</td>
                  <td class="sensor-peak">${s.peak_timestamp ? fmtDateTime(s.peak_timestamp) : '<span style="color: var(--clr-border)">—</span>'}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  return `
    <section class="sensors-view">
      <div class="section-header">
        <h2>All Sensors</h2>
        <div style="display: flex; align-items: center; gap: var(--sp-3); margin-top: var(--sp-2);">
          <span class="badge">${data.sensors.length} sensors</span>
          <span class="muted">${data.metering_point}</span>
        </div>
      </div>
      ${renderGroup("Electricity Consumption", "⚡", electricity, "consumption")}
      ${renderGroup("Energy Production", "☀️", production, "production")}
      ${renderGroup("Energy Sharing", "🔗", sharing, "self")}
      ${renderGroup("Gas", "🔥", gas, "gas")}
      ${renderGroup("Other", "📊", other, "text")}
    </section>
  `;
}

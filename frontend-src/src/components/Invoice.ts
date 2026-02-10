/**
 * Invoice — Energy cost calculator using Luxembourg billing model.
 *
 * Includes:
 * - Standard consumption costs (fixed + variable)
 * - Network costs (metering, reference power, variable)
 * - Reference power exceedance surcharge (Referenzwert)
 * - Feed-in revenue (money earned from selling exported energy)
 * - Compensation fund, electricity tax, VAT
 */
import type { AppState } from "./App";
import type { FeedInRate, MeterMonthlyFee } from "../api/leneda";
import { fmtNum } from "../utils/format";

/**
 * Compute the number of days in the viewed period and a proration factor
 * so fixed monthly costs (energy_fixed_fee, network_metering_rate,
 * network_power_ref_rate) are scaled to the period length.
 */
function periodProration(
  range: string,
  customStart?: string,
  customEnd?: string,
): { days: number; monthDays: number; factor: number } {
  const now = new Date();
  const dim = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

  let periodDays: number;
  let refDate: Date;

  switch (range) {
    case "yesterday": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      periodDays = 1;
      refDate = d;
      break;
    }
    case "this_week": {
      const d = new Date(now);
      const day = d.getDay() || 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - day + 1);
      periodDays = Math.max(1, Math.round((now.getTime() - monday.getTime()) / 86_400_000) + 1);
      refDate = monday;
      break;
    }
    case "last_week": {
      periodDays = 7;
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      refDate = d;
      break;
    }
    case "this_month": {
      periodDays = now.getDate();
      refDate = now;
      break;
    }
    case "last_month": {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      periodDays = dim(lm.getFullYear(), lm.getMonth());
      refDate = lm;
      break;
    }
    case "custom": {
      if (customStart && customEnd) {
        const s = new Date(customStart);
        const e = new Date(customEnd);
        periodDays = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1);
        refDate = s;
      } else {
        periodDays = 1;
        refDate = now;
      }
      break;
    }
    default:
      periodDays = 1;
      refDate = now;
  }

  const monthDays = dim(refDate.getFullYear(), refDate.getMonth());
  return { days: periodDays, monthDays, factor: periodDays / monthDays };
}

export function renderInvoice(state: AppState): string {
  const config = state.config;
  const d = state.rangeData;

  if (!config || !d) {
    return `
      <section class="invoice-view">
        <div class="card">
          <p class="muted">Loading billing configuration…</p>
        </div>
      </section>
    `;
  }

  // ── Values from data ──
  const consumption = d.consumption || 0;
  const production = d.production || 0;
  const exported = d.exported || 0;
  const peakPower = d.peak_power_kw || 0;
  const refPower = config.reference_power_kw || 5;
  // Cumulative kWh consumed above reference power (sum of 15-min overage × 0.25 h)
  const exceedanceKwh = d.exceedance_kwh || 0;
  const gasEnergy = d.gas_energy || 0;
  const gasVolume = d.gas_volume || 0;
  const hasGas = gasEnergy > 0 || gasVolume > 0;

  // ── Period proration ──
  // Fixed monthly fees are scaled to the viewed period length.
  const { days: periodDays, monthDays, factor: proFactor } = periodProration(
    state.range, state.customStart, state.customEnd,
  );
  const proratedFixedFee = config.energy_fixed_fee * proFactor;
  const proratedMetering = config.network_metering_rate * proFactor;
  const proratedPowerRef = config.network_power_ref_rate * proFactor;
  const proLabel = periodDays < monthDays
    ? `${periodDays}/${monthDays} days`
    : "full month";

  // ── Cost calculation (Luxembourg model) ──

  // 1. Energy supplier costs
  const energyCost = consumption * config.energy_variable_rate;

  // 2. Network costs
  const networkVariableCost = consumption * config.network_variable_rate;

  // 3. Reference power exceedance (Referenzwert / Dépassement)
  //    exceedance_kwh is the total energy consumed above the reference power
  //    across all 15-min intervals, computed by the backend coordinator.
  const exceedanceCost = exceedanceKwh * config.exceedance_rate;

  // 3b. Per-meter monthly fees (extra metering points)
  const meterFees: MeterMonthlyFee[] = config.meter_monthly_fees ?? [];
  const meterFeesTotal = meterFees.reduce((s, f) => s + (f.fee || 0), 0) * proFactor;

  // 4. Taxes & levies
  const compensationCredit = consumption * config.compensation_fund_rate;
  const electricityTax = consumption * config.electricity_tax_rate;

  // 5. Subtotal (costs) — fixed fees are prorated
  const subtotalCosts =
    proratedFixedFee +
    energyCost +
    proratedMetering +
    proratedPowerRef +
    networkVariableCost +
    exceedanceCost +
    meterFeesTotal +
    compensationCredit +
    electricityTax;

  const vat = subtotalCosts * config.vat_rate;
  const totalCosts = subtotalCosts + vat;

  // 6. Feed-in revenue (per-production-meter rates)
  //    Resolve the effective rate for each production meter.
  //    Without per-meter export data we split equally across production meters.
  const productionMeters = (config.meters ?? []).filter((m) => m.types.includes("production"));
  const feedInRates: FeedInRate[] = config.feed_in_rates ?? [];

  interface ResolvedRate { meterId: string; shortId: string; rate: number; label: string; mode: string }
  const resolvedRates: ResolvedRate[] = productionMeters.map((m) => {
    const r = feedInRates.find((fr) => fr.meter_id === m.id);
    if (r) {
      const effectiveRate = r.mode === "sensor" && r.sensor_value != null ? r.sensor_value : r.tariff;
      const lbl = r.mode === "sensor" && r.sensor_value != null
        ? `Sensor (${fmtNum(effectiveRate, 4)} ${config.currency ?? "EUR"}/kWh)`
        : "Fixed tariff";
      return { meterId: m.id, shortId: m.id ? "…" + m.id.slice(-8) : "Meter", rate: effectiveRate, label: lbl, mode: r.mode };
    }
    // Fallback to global tariff
    return { meterId: m.id, shortId: m.id ? "…" + m.id.slice(-8) : "Meter", rate: config.feed_in_tariff, label: "Fixed tariff", mode: "fixed" };
  });

  // Effective average feed-in rate
  const avgFeedInRate = resolvedRates.length > 0
    ? resolvedRates.reduce((sum, r) => sum + r.rate, 0) / resolvedRates.length
    : config.feed_in_tariff;
  const feedInRevenue = exported * avgFeedInRate;
  const hasMultipleRates = resolvedRates.length > 1;

  // ── Solar Revenue Tracking ──
  // Total value generated by production: self-consumed savings + feed-in revenue
  const selfConsumed = d.self_consumed || 0;
  const selfConsumedSavings = selfConsumed * (config.energy_variable_rate + config.network_variable_rate + config.electricity_tax_rate + config.compensation_fund_rate);
  const selfConsumedSavingsVat = selfConsumedSavings * config.vat_rate;
  const totalSelfConsumedSavings = selfConsumedSavings + selfConsumedSavingsVat;
  const totalSolarValue = totalSelfConsumedSavings + feedInRevenue;

  // 7. Net amount
  const netTotal = totalCosts - feedInRevenue;

  // ── Gas cost calculation ──
  const gasFixedFee = (config.gas_fixed_fee ?? 6.50) * proFactor;
  const gasVariableCost = gasEnergy * (config.gas_variable_rate ?? 0.0550);
  const gasNetworkFee = (config.gas_network_fee ?? 4.80) * proFactor;
  const gasNetworkVariableCost = gasEnergy * (config.gas_network_variable_rate ?? 0.0120);
  const gasTax = gasEnergy * (config.gas_tax_rate ?? 0.0010);
  const gasSubtotal = gasFixedFee + gasVariableCost + gasNetworkFee + gasNetworkVariableCost + gasTax;
  const gasVat = gasSubtotal * (config.gas_vat_rate ?? 0.08);
  const gasTotalCosts = gasSubtotal + gasVat;

  const currency = config.currency || "EUR";
  const fmt = (v: number) => `${fmtNum(v, 2)} ${currency}`;
  const rangeLabel = state.range.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // ── Exceedance warning ──
  const exceedanceWarning = exceedanceKwh > 0
    ? `<div class="card exceedance-warning">
        <strong>⚠️ Reference Power Exceeded</strong>
        <p>Peak: <strong>${fmtNum(peakPower, 1)} kW</strong> &mdash; Reference: ${fmtNum(refPower, 1)} kW</p>
        <p>Total exceedance energy: <strong>${fmtNum(exceedanceKwh, 2)} kWh</strong></p>
        <p class="muted">Surcharge: ${fmt(exceedanceCost)}</p>
      </div>`
    : "";

  return `
    <section class="invoice-view">
      <div class="section-header">
        <h2>Cost Estimate &mdash; ${rangeLabel}</h2>
        <div style="display: flex; gap: var(--sp-4); flex-wrap: wrap; margin-top: var(--sp-2);">
          <span class="badge" style="background: var(--clr-consumption-muted); color: var(--clr-consumption);">⚡ ${fmtNum(consumption)} kWh consumed</span>
          <span class="badge" style="background: var(--clr-production-muted); color: var(--clr-production);">☀️ ${fmtNum(production)} kWh produced</span>
          ${exported > 0 ? `<span class="badge" style="background: var(--clr-export-muted); color: var(--clr-export);">📤 ${fmtNum(exported)} kWh exported</span>` : ""}
          ${hasGas ? `<span class="badge" style="background: rgba(255,160,50,0.12); color: #f5a623;">🔥 ${fmtNum(gasEnergy)} kWh gas (${fmtNum(gasVolume)} m³)</span>` : ""}
        </div>
      </div>

      ${exceedanceWarning}

      <div class="card invoice-card">
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Component</th>
              <th style="text-align: right;">Rate / Detail</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr class="section-label"><td colspan="3">Energy Supplier</td></tr>
            <tr>
              <td>Fixed Fee <span class="muted">(${proLabel})</span></td>
              <td style="text-align: right;">${fmtNum(config.energy_fixed_fee, 2)} ${currency}/mo</td>
              <td style="text-align: right;">${fmt(proratedFixedFee)}</td>
            </tr>
            <tr>
              <td>Variable (${fmtNum(consumption)} kWh)</td>
              <td style="text-align: right;">${fmtNum(config.energy_variable_rate, 4)} ${currency}/kWh</td>
              <td style="text-align: right;">${fmt(energyCost)}</td>
            </tr>

            <tr class="section-label"><td colspan="3">Network Operator</td></tr>
            <tr>
              <td>Metering <span class="muted">(${proLabel})</span></td>
              <td style="text-align: right;">${fmtNum(config.network_metering_rate, 2)} ${currency}/mo</td>
              <td style="text-align: right;">${fmt(proratedMetering)}</td>
            </tr>
            <tr>
              <td>Power Reference (${fmtNum(refPower, 1)} kW) <span class="muted">(${proLabel})</span></td>
              <td style="text-align: right;">${fmtNum(config.network_power_ref_rate, 2)} ${currency}/mo</td>
              <td style="text-align: right;">${fmt(proratedPowerRef)}</td>
            </tr>
            <tr>
              <td>Variable (${fmtNum(consumption)} kWh)</td>
              <td style="text-align: right;">${fmtNum(config.network_variable_rate, 4)} ${currency}/kWh</td>
              <td style="text-align: right;">${fmt(networkVariableCost)}</td>
            </tr>
            <tr class="${exceedanceKwh > 0 ? "exceedance-row" : ""}">
              <td>Exceedance (${fmtNum(exceedanceKwh, 2)} kWh over ref)</td>
              <td style="text-align: right;">${fmtNum(config.exceedance_rate, 4)} ${currency}/kWh</td>
              <td style="text-align: right;">${fmt(exceedanceCost)}</td>
            </tr>

            ${meterFees.filter((f) => f.fee > 0).length > 0 ? `
            <tr class="section-label"><td colspan="3">Extra Meter Fees</td></tr>
            ${meterFees.filter((f) => f.fee > 0).map((f) => `
            <tr>
              <td>${f.label || ("…" + f.meter_id.slice(-8))} <span class="muted">(${proLabel})</span></td>
              <td style="text-align: right;">${fmtNum(f.fee, 2)} ${currency}/mo</td>
              <td style="text-align: right;">${fmt(f.fee * proFactor)}</td>
            </tr>
            `).join("")}
            ` : ""}

            <tr class="section-label"><td colspan="3">Taxes & Levies</td></tr>
            <tr>
              <td>Compensation Fund</td>
              <td style="text-align: right;">${fmtNum(config.compensation_fund_rate, 4)} ${currency}/kWh</td>
              <td style="text-align: right;">${fmt(compensationCredit)}</td>
            </tr>
            <tr>
              <td>Electricity Tax</td>
              <td style="text-align: right;">${fmtNum(config.electricity_tax_rate, 4)} ${currency}/kWh</td>
              <td style="text-align: right;">${fmt(electricityTax)}</td>
            </tr>

            <tr class="subtotal-row">
              <td colspan="2">Subtotal (excl. VAT)</td>
              <td style="text-align: right;"><strong>${fmt(subtotalCosts)}</strong></td>
            </tr>
            <tr>
              <td>VAT</td>
              <td style="text-align: right;">${fmtNum(config.vat_rate * 100, 0)}%</td>
              <td style="text-align: right;">${fmt(vat)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2"><strong>Total Costs</strong></td>
              <td style="text-align: right;"><strong>${fmt(totalCosts)}</strong></td>
            </tr>

            ${exported > 0 ? `
            <tr class="section-label revenue-section"><td colspan="3">Feed-in Revenue</td></tr>
            ${resolvedRates.map((r) => `
            <tr class="revenue-row">
              <td>Exported (${hasMultipleRates ? r.shortId : fmtNum(exported) + " kWh"})</td>
              <td style="text-align: right;">${r.label}<br/>${fmtNum(r.rate, 4)} ${currency}/kWh</td>
              <td class="revenue-amount" style="text-align: right;">-${fmt(hasMultipleRates ? (exported / resolvedRates.length) * r.rate : exported * r.rate)}</td>
            </tr>
            `).join("")}
            ${hasMultipleRates ? `
            <tr class="revenue-row">
              <td><em>Total feed-in (${fmtNum(exported)} kWh, avg rate)</em></td>
              <td style="text-align: right;">${fmtNum(avgFeedInRate, 4)} ${currency}/kWh</td>
              <td class="revenue-amount" style="text-align: right;">-${fmt(feedInRevenue)}</td>
            </tr>
            ` : ""}
            <tr class="net-total-row">
              <td colspan="2"><strong>Net Balance</strong></td>
              <td style="text-align: right;"><strong>${fmt(netTotal)}</strong></td>
            </tr>
            ` : ""}
          </tbody>
        </table>
      </div>

      <div class="card invoice-footer">
        <p class="muted" style="line-height: var(--lh-relaxed);">
          This is an estimate based on your configured billing rates.
          Fixed monthly fees are prorated to the viewed period (${periodDays} of ${monthDays} days = ${fmtNum(proFactor * 100, 1)}%).
          Peak power (${fmtNum(peakPower, 1)} kW) is compared against your reference power (${fmtNum(refPower, 1)} kW) &mdash; 
          every kWh consumed above the Referenzwert incurs a surcharge of ${fmtNum(config.exceedance_rate, 4)} ${currency}/kWh.
          Adjust rates in Settings.
        </p>
      </div>

      ${hasGas ? `
      <!-- Gas Cost Estimate -->
      <div class="card invoice-card gas-invoice-card">
        <h3 class="card-title"><span class="title-icon">🔥</span> Gas Cost Estimate &mdash; ${rangeLabel}</h3>
        <div style="display: flex; gap: var(--sp-4); flex-wrap: wrap; margin-bottom: var(--sp-4);">
          <span class="badge" style="background: rgba(255,160,50,0.12); color: #f5a623;">🔥 ${fmtNum(gasEnergy)} kWh</span>
          <span class="badge" style="background: rgba(255,160,50,0.12); color: #f5a623;">📐 ${fmtNum(gasVolume)} m³</span>
        </div>
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Component</th>
              <th style="text-align: right;">Rate / Detail</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr class="section-label"><td colspan="3">Gas Supplier</td></tr>
            <tr>
              <td>Fixed Fee <span class="muted">(${proLabel})</span></td>
              <td style="text-align: right;">${fmtNum(config.gas_fixed_fee ?? 6.50, 2)} ${currency}/mo</td>
              <td style="text-align: right;">${fmt(gasFixedFee)}</td>
            </tr>
            <tr>
              <td>Energy (${fmtNum(gasEnergy)} kWh)</td>
              <td style="text-align: right;">${fmtNum(config.gas_variable_rate ?? 0.0550, 4)} ${currency}/kWh</td>
              <td style="text-align: right;">${fmt(gasVariableCost)}</td>
            </tr>

            <tr class="section-label"><td colspan="3">Gas Network</td></tr>
            <tr>
              <td>Network Fee <span class="muted">(${proLabel})</span></td>
              <td style="text-align: right;">${fmtNum(config.gas_network_fee ?? 4.80, 2)} ${currency}/mo</td>
              <td style="text-align: right;">${fmt(gasNetworkFee)}</td>
            </tr>
            <tr>
              <td>Network Variable (${fmtNum(gasEnergy)} kWh)</td>
              <td style="text-align: right;">${fmtNum(config.gas_network_variable_rate ?? 0.0120, 4)} ${currency}/kWh</td>
              <td style="text-align: right;">${fmt(gasNetworkVariableCost)}</td>
            </tr>

            <tr class="section-label"><td colspan="3">Gas Tax</td></tr>
            <tr>
              <td>Gas Tax (${fmtNum(gasEnergy)} kWh)</td>
              <td style="text-align: right;">${fmtNum(config.gas_tax_rate ?? 0.0010, 4)} ${currency}/kWh</td>
              <td style="text-align: right;">${fmt(gasTax)}</td>
            </tr>

            <tr class="subtotal-row">
              <td colspan="2">Subtotal (excl. VAT)</td>
              <td style="text-align: right;"><strong>${fmt(gasSubtotal)}</strong></td>
            </tr>
            <tr>
              <td>VAT</td>
              <td style="text-align: right;">${fmtNum((config.gas_vat_rate ?? 0.08) * 100, 0)}%</td>
              <td style="text-align: right;">${fmt(gasVat)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2"><strong>Total Gas Costs</strong></td>
              <td style="text-align: right;"><strong>${fmt(gasTotalCosts)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card invoice-footer">
        <p class="muted" style="line-height: var(--lh-relaxed);">
          <strong>Combined Energy Total: ${fmt(netTotal + gasTotalCosts)}</strong>
          (Electricity: ${fmt(netTotal)} + Gas: ${fmt(gasTotalCosts)})
        </p>
      </div>
      ` : ""}

      ${production > 0 ? `
      <!-- Solar Revenue Tracking -->
      <div class="card solar-revenue-card">
        <h3 class="card-title"><span class="title-icon">☀️</span> Solar Panel Revenue &mdash; ${rangeLabel}</h3>
        <div class="solar-revenue-summary">
          <div class="solar-stat solar-stat-primary">
            <div class="solar-stat-value">${fmt(totalSolarValue)}</div>
            <div class="solar-stat-label">Total Solar Value</div>
          </div>
          <div class="solar-stat">
            <div class="solar-stat-value">${fmt(totalSelfConsumedSavings)}</div>
            <div class="solar-stat-label">Savings (self-consumed)</div>
          </div>
          <div class="solar-stat">
            <div class="solar-stat-value">${fmt(feedInRevenue)}</div>
            <div class="solar-stat-label">Feed-in revenue</div>
          </div>
        </div>

        <table class="invoice-table solar-table">
          <thead>
            <tr>
              <th>Component</th>
              <th style="text-align: right;">Detail</th>
              <th style="text-align: right;">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr class="section-label"><td colspan="3">Self-Consumption Savings</td></tr>
            <tr>
              <td>Energy not bought (${fmtNum(selfConsumed)} kWh)</td>
              <td style="text-align: right;">${fmtNum(config.energy_variable_rate, 4)} ${currency}/kWh</td>
              <td style="text-align: right;">${fmt(selfConsumed * config.energy_variable_rate)}</td>
            </tr>
            <tr>
              <td>Network fees avoided</td>
              <td style="text-align: right;">${fmtNum(config.network_variable_rate, 4)} ${currency}/kWh</td>
              <td style="text-align: right;">${fmt(selfConsumed * config.network_variable_rate)}</td>
            </tr>
            <tr>
              <td>Taxes & levies avoided</td>
              <td style="text-align: right;">${fmtNum(config.electricity_tax_rate + config.compensation_fund_rate, 4)} ${currency}/kWh</td>
              <td style="text-align: right;">${fmt(selfConsumed * (config.electricity_tax_rate + config.compensation_fund_rate))}</td>
            </tr>
            <tr>
              <td>VAT saved</td>
              <td style="text-align: right;">${fmtNum(config.vat_rate * 100, 0)}%</td>
              <td style="text-align: right;">${fmt(selfConsumedSavingsVat)}</td>
            </tr>
            <tr class="subtotal-row">
              <td colspan="2"><strong>Self-Consumption Savings</strong></td>
              <td style="text-align: right;"><strong>${fmt(totalSelfConsumedSavings)}</strong></td>
            </tr>

            ${exported > 0 ? `
            <tr class="section-label"><td colspan="3">Feed-in Revenue</td></tr>
            ${resolvedRates.map((r) => `
            <tr>
              <td>Sold to grid ${hasMultipleRates ? `(${r.shortId})` : `(${fmtNum(exported)} kWh)`}</td>
              <td style="text-align: right;">${r.label}<br/>${fmtNum(r.rate, 4)} ${currency}/kWh</td>
              <td style="text-align: right;">${fmt(hasMultipleRates ? (exported / resolvedRates.length) * r.rate : exported * r.rate)}</td>
            </tr>
            `).join("")}
            ${hasMultipleRates ? `
            <tr class="subtotal-row">
              <td colspan="2"><strong>Total Feed-in Revenue</strong></td>
              <td style="text-align: right;"><strong>${fmt(feedInRevenue)}</strong></td>
            </tr>
            ` : ""}
            ` : ""}

            <tr class="total-row solar-total-row">
              <td colspan="2"><strong>💰 Total Solar Panel Value</strong></td>
              <td style="text-align: right;"><strong>${fmt(totalSolarValue)}</strong></td>
            </tr>
          </tbody>
        </table>

        <p class="muted" style="margin-top: var(--sp-3); font-size: var(--text-xs); line-height: var(--lh-relaxed);">
          Self-consumption savings = energy you produced and used yourself instead of buying from the grid.
          Feed-in revenue = money earned by selling surplus production.
          ${resolvedRates.some((r) => r.mode === "sensor") ? "Market price sourced from Home Assistant sensor." : "Using fixed feed-in tariff — configure a market price sensor in Settings for real-time rates."}
          ${hasMultipleRates ? "Revenue split equally across production meters (per-meter export data not yet available)." : ""}
        </p>
      </div>
      ` : ""}
    </section>
  `;
}

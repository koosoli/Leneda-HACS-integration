/**
 * OBIS code metadata — maps codes to human-readable names/units/icons.
 */

export interface ObisInfo {
  name: string;
  unit: string;
  icon: string;
  category: "consumption" | "production" | "sharing" | "gas";
}

export const OBIS_MAP: Record<string, ObisInfo> = {
  "1-1:1.29.0": { name: "Active Consumption", unit: "kW", icon: "⚡", category: "consumption" },
  "1-1:2.29.0": { name: "Active Production", unit: "kW", icon: "☀️", category: "production" },
  "1-1:3.29.0": { name: "Reactive Consumption", unit: "kvar", icon: "⚡", category: "consumption" },
  "1-1:4.29.0": { name: "Reactive Production", unit: "kvar", icon: "☀️", category: "production" },
  "1-65:1.29.1": { name: "Consumption Covered (L1 AIR)", unit: "kW", icon: "🔗", category: "sharing" },
  "1-65:1.29.3": { name: "Consumption Covered (L2 ACR)", unit: "kW", icon: "🔗", category: "sharing" },
  "1-65:1.29.2": { name: "Consumption Covered (L3 CEL)", unit: "kW", icon: "🔗", category: "sharing" },
  "1-65:1.29.4": { name: "Consumption Covered (L4 APS)", unit: "kW", icon: "🔗", category: "sharing" },
  "1-65:1.29.9": { name: "Remaining Consumption", unit: "kW", icon: "🔗", category: "sharing" },
  "1-65:2.29.1": { name: "Production Shared (L1 AIR)", unit: "kW", icon: "🔗", category: "sharing" },
  "1-65:2.29.3": { name: "Production Shared (L2 ACR)", unit: "kW", icon: "🔗", category: "sharing" },
  "1-65:2.29.2": { name: "Production Shared (L3 CEL)", unit: "kW", icon: "🔗", category: "sharing" },
  "1-65:2.29.4": { name: "Production Shared (L4 APS)", unit: "kW", icon: "🔗", category: "sharing" },
  "1-65:2.29.9": { name: "Remaining Production", unit: "kW", icon: "🔗", category: "sharing" },
  "7-1:99.23.15": { name: "Gas Volume", unit: "m³", icon: "🔥", category: "gas" },
  "7-1:99.23.17": { name: "Gas Standard Volume", unit: "Nm³", icon: "🔥", category: "gas" },
  "7-20:99.33.17": { name: "Gas Energy", unit: "kWh", icon: "🔥", category: "gas" },
};

/**
 * Get a friendly sensor name from its coordinator key.
 */
export function getSensorDisplayName(key: string): string {
  // Check OBIS map first
  if (OBIS_MAP[key]) return OBIS_MAP[key].name;

  // Known aggregated keys
  const names: Record<string, string> = {
    c_04_yesterday_consumption: "Yesterday's Consumption",
    c_05_weekly_consumption: "This Week's Consumption",
    c_06_last_week_consumption: "Last Week's Consumption",
    c_07_monthly_consumption: "This Month's Consumption",
    c_08_previous_month_consumption: "Last Month's Consumption",
    p_04_yesterday_production: "Yesterday's Production",
    p_05_weekly_production: "This Week's Production",
    p_06_last_week_production: "Last Week's Production",
    p_07_monthly_production: "This Month's Production",
    p_08_previous_month_production: "Last Month's Production",
    p_09_yesterday_exported: "Yesterday's Export",
    p_10_last_week_exported: "Last Week's Export",
    p_11_last_month_exported: "Last Month's Export",
    p_12_yesterday_self_consumed: "Yesterday's Self-Consumed",
    p_13_last_week_self_consumed: "Last Week's Self-Consumed",
    p_14_last_month_self_consumed: "Last Month's Self-Consumed",
    p_15_monthly_exported: "This Month's Export",
    p_16_monthly_self_consumed: "This Month's Self-Consumed",
    g_01_yesterday_consumption: "Gas Yesterday (kWh)",
    g_02_weekly_consumption: "Gas This Week (kWh)",
    g_03_last_week_consumption: "Gas Last Week (kWh)",
    g_04_monthly_consumption: "Gas This Month (kWh)",
    g_05_last_month_consumption: "Gas Last Month (kWh)",
    g_10_yesterday_volume: "Gas Yesterday (m³)",
    g_11_weekly_volume: "Gas This Week (m³)",
    g_12_last_week_volume: "Gas Last Week (m³)",
    g_13_monthly_volume: "Gas This Month (m³)",
    g_14_last_month_volume: "Gas Last Month (m³)",
  };
  return names[key] ?? key;
}

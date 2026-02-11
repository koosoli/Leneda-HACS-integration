"""HTTP REST API for the Leneda dashboard.

Provides JSON endpoints consumed by the Vite frontend running inside the HA iframe panel.
All endpoints require Home Assistant authentication (session cookie from iframe).

Endpoints:
  GET  /api/leneda/data?range=yesterday|this_week|last_week|this_month|last_month
  GET  /api/leneda/data/custom?start=YYYY-MM-DD&end=YYYY-MM-DD
  GET  /api/leneda/data/timeseries?obis=1-1:1.29.0&start=ISO&end=ISO
  GET  /api/leneda/sensors
  GET  /api/leneda/config
  POST /api/leneda/config
  POST /api/leneda/config/reset
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any

from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

from .const import DOMAIN, CONF_API_KEY, CONF_ENERGY_ID, CONF_METER_HAS_GAS, CONF_METERING_POINT_ID, CONF_METERING_POINT_1_TYPES, CONF_REFERENCE_POWER_ENTITY, CONF_REFERENCE_POWER_STATIC, EXTRA_METER_SLOTS, OBIS_CODES
from .models import BillingConfig

_LOGGER = logging.getLogger(__name__)


class LenedaModeView(HomeAssistantView):
    """Return deployment mode so the frontend knows to hide credential UI."""

    url = "/leneda_api/mode"
    name = "api:leneda:mode"
    requires_auth = False  # Must respond even before auth for mode detection

    async def get(self, request: web.Request) -> web.Response:
        return self.json({"mode": "ha", "configured": True})


def _get_first_coordinator(hass: HomeAssistant):
    """Return the first active coordinator, or None."""
    for key, val in hass.data.get(DOMAIN, {}).items():
        if key not in ("storage", "views_registered") and hasattr(val, "data"):
            return val
    return None


# ─── Data endpoints ──────────────────────────────────────────────

class LenedaDataView(HomeAssistantView):
    """Aggregated energy data for a predefined time range."""

    url = "/leneda_api/data"
    name = "api:leneda:data"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        range_type = request.query.get("range", "yesterday")
        coordinator = _get_first_coordinator(hass)

        if not coordinator or not coordinator.data:
            return self.json({"error": "no_data"}, status_code=503)

        cd = coordinator.data

        # Mapping determines which coordinator keys to use for preset ranges.
        # If a range is not in this mapping (like this_year), we skip coordinator data and fetch live.
        mapping = {
            "yesterday": {
                "consumption": "c_04_yesterday_consumption",
                "production": "p_04_yesterday_production",
                "exported": "p_09_yesterday_exported",
                "self_consumed": "p_12_yesterday_self_consumed",
                "shared": "s_sent_yesterday",
                "shared_with_me": "s_received_yesterday",
                "gas_energy": "g_01_yesterday_consumption",
                "gas_volume": "g_10_yesterday_volume",
                "exceedance": "yesterdays_power_usage_over_reference",
            },
            "this_week": {
                "consumption": "c_05_weekly_consumption",
                "production": "p_05_weekly_production",
                "exported": "p_17_weekly_exported",
                "self_consumed": "p_18_weekly_self_consumed",
                "shared": "s_sent_weekly",
                "shared_with_me": "s_received_weekly",
                "gas_energy": "g_02_weekly_consumption",
                "gas_volume": "g_11_weekly_volume",
                "exceedance": None,
            },
            "last_week": {
                "consumption": "c_06_last_week_consumption",
                "production": "p_06_last_week_production",
                "exported": "p_10_last_week_exported",
                "self_consumed": "p_13_last_week_self_consumed",
                "shared": "s_sent_last_week",
                "shared_with_me": "s_received_last_week",
                "gas_energy": "g_03_last_week_consumption",
                "gas_volume": "g_12_last_week_volume",
                "exceedance": None,
            },
            "this_month": {
                "consumption": "c_07_monthly_consumption",
                "production": "p_07_monthly_production",
                "exported": "p_15_monthly_exported",
                "self_consumed": "p_16_monthly_self_consumed",
                "shared": "s_sent_monthly",
                "shared_with_me": "s_received_monthly",
                "gas_energy": "g_04_monthly_consumption",
                "gas_volume": "g_13_monthly_volume",
                "exceedance": "current_month_power_usage_over_reference",
            },
            "last_month": {
                "consumption": "c_08_previous_month_consumption",
                "production": "p_08_previous_month_production",
                "exported": "p_11_last_month_exported",
                "self_consumed": "p_14_last_month_self_consumed",
                "shared": "s_sent_last_month",
                "shared_with_me": "s_received_last_month",
                "gas_energy": "g_05_last_month_consumption",
                "gas_volume": "g_14_last_month_volume",
                "exceedance": "last_month_power_usage_over_reference",
            },
        }

        # Determine bounds using Home Assistant's time utilities
        from homeassistant.util import dt as dt_util
        now = dt_util.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        s, e = None, None
        if range_type == "yesterday":
            s = today_start - timedelta(days=1)
            e = today_start - timedelta(seconds=1)
        elif range_type == "this_week":
            s = today_start - timedelta(days=now.weekday())
            e = now
        elif range_type == "last_week":
            mon_this_week = today_start - timedelta(days=now.weekday())
            s = mon_this_week - timedelta(days=7)
            e = mon_this_week - timedelta(seconds=1)
        elif range_type == "this_month":
            s = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            e = now
        elif range_type == "last_month":
            first_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            e = first_this_month - timedelta(seconds=1)
            s = e.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif range_type == "this_year":
            s = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            e = now
        elif range_type == "last_year":
            try:
                s = now.replace(year=now.year-1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                e = now.replace(year=now.year-1, month=12, day=31, hour=23, minute=59, second=59, microsecond=0)
            except ValueError: # Leap year edge case
                s = (now - timedelta(days=366)).replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                e = s.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=0)

        # Initialize response
        response = {
            "range": range_type,
            "metering_point": coordinator.metering_point_id,
            "start": s.isoformat() if s else None,
            "end": e.isoformat() if e else None,
        }

        if range_type in mapping:
            keys = mapping[range_type]
            # Peak power: max 15-min consumption reading from the OBIS raw data
            peak_power = cd.get("1-1:1.29.0", 0) or 0
            response.update({
                "consumption": cd.get(keys["consumption"], 0),
                "production": cd.get(keys["production"], 0),
                "exported": cd.get(keys["exported"], 0) if keys["exported"] else 0,
                "self_consumed": cd.get(keys["self_consumed"], 0) if keys["self_consumed"] else 0,
                "shared": cd.get(keys.get("shared"), 0) if keys.get("shared") else 0,
                "shared_with_me": cd.get(keys.get("shared_with_me"), 0) if keys.get("shared_with_me") else 0,
                "gas_energy": cd.get(keys["gas_energy"], 0),
                "gas_volume": cd.get(keys["gas_volume"], 0),
                "peak_power_kw": peak_power,
                "exceedance_kwh": cd.get(keys["exceedance"], 0) if keys.get("exceedance") else 0,
            })
        elif range_type in ("this_year", "last_year"):
            # Fetch live data for yearly ranges
            try:
                live_data = await _fetch_live_aggregated_data(coordinator, s, e)
                response.update(live_data)
                # Gas is not natively aggregated for year in coordinator cache, set to zero for now
                response.update({"gas_energy": 0, "gas_volume": 0})
            except Exception as exc:
                _LOGGER.error("Error fetching live yearly data: %s", exc)
                return self.json({"error": str(exc)}, status_code=500)
        else:
            # Fallback for unknown ranges (should not happen with standard UI)
            return self.json({"error": f"Unsupported range: {range_type}"}, status_code=400)

        return self.json(response)


class LenedaCustomDataView(HomeAssistantView):
    """Aggregated data for a custom date range."""

    url = "/leneda_api/data/custom"
    name = "api:leneda:data:custom"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        start_str = request.query.get("start")
        end_str = request.query.get("end")

        if not start_str or not end_str:
            return self.json({"error": "Missing start or end"}, status_code=400)

        try:
            start_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
            end_dt = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
        except ValueError:
            return self.json({"error": "Invalid date format"}, status_code=400)

        coordinator = _get_first_coordinator(hass)
        if not coordinator:
            return self.json({"error": "no_data"}, status_code=503)

        try:
            live_data = await _fetch_live_aggregated_data(coordinator, start_dt, end_dt)
            response = {
                "start": start_str,
                "end": end_str,
                **live_data
            }
            return self.json(response)
        except Exception as exc:
            _LOGGER.error("Error fetching custom range data: %s", exc)
            return self.json({"error": str(exc)}, status_code=500)

async def _fetch_live_aggregated_data(coordinator, start_dt, end_dt):
    """Fetch and sum aggregated data for any arbitrary date range."""
    import asyncio as _aio

    # Use Month aggregation for ranges longer than 35 days to avoid Infinite issues
    agg_level = "Infinite"
    if (end_dt - start_dt).days > 35:
        agg_level = "Month"

    c_data = await coordinator.api_client.async_get_aggregated_metering_data(
        coordinator._meter_for_obis("1-1:1.29.0"), "1-1:1.29.0", start_dt, end_dt, agg_level
    )

    # Sum production across all production meters
    prod_meters = getattr(coordinator, "production_meters", [coordinator._meter_for_obis("1-1:2.29.0")])
    p_results = await _aio.gather(*[
        coordinator.api_client.async_get_aggregated_metering_data(mid, "1-1:2.29.0", start_dt, end_dt, agg_level)
        for mid in prod_meters
    ], return_exceptions=True)

    # Sum export across meters
    EXPORT_CODE = "1-65:2.29.9"
    e_data = await coordinator.api_client.async_get_aggregated_metering_data(
        coordinator._meter_for_obis(EXPORT_CODE), EXPORT_CODE, start_dt, end_dt, agg_level
    )

    # Shared layers (1-4)
    SHARING_LAYERS = ["1", "2", "3", "4"]

    # Shared With Me (Consumption side sharing)
    c_meter = coordinator._meter_for_obis("1-1:1.29.0")
    swm_results = await _aio.gather(*[
        coordinator.api_client.async_get_aggregated_metering_data(c_meter, f"1-65:1.29.{layer}", start_dt, end_dt, agg_level)
        for layer in SHARING_LAYERS
    ], return_exceptions=True)

    # Shared (Production side sharing)
    shared_results = []
    for mid in prod_meters:
        meter_shared = await _aio.gather(*[
            coordinator.api_client.async_get_aggregated_metering_data(mid, f"1-65:2.29.{layer}", start_dt, end_dt, agg_level)
            for layer in SHARING_LAYERS
        ], return_exceptions=True)
        shared_results.extend(meter_shared)

    c_val = 0
    if c_data.get("aggregatedTimeSeries"):
        c_val = sum(item.get("value", 0) for item in c_data["aggregatedTimeSeries"] if item.get("value") is not None)

    p_val = 0
    for p_data in p_results:
        if isinstance(p_data, dict) and p_data.get("aggregatedTimeSeries"):
            p_val += sum(item.get("value", 0) for item in p_data["aggregatedTimeSeries"] if item.get("value") is not None)

    e_val = 0
    if e_data.get("aggregatedTimeSeries"):
        e_val = sum(item.get("value", 0) for item in e_data["aggregatedTimeSeries"] if item.get("value") is not None)

    swm_val = 0
    for s_data in swm_results:
        if isinstance(s_data, dict) and s_data.get("aggregatedTimeSeries"):
            swm_val += sum(item.get("value", 0) for item in s_data["aggregatedTimeSeries"] if item.get("value") is not None)

    s_val = 0
    for s_data in shared_results:
        if isinstance(s_data, dict) and s_data.get("aggregatedTimeSeries"):
            s_val += sum(item.get("value", 0) for item in s_data["aggregatedTimeSeries"] if item.get("value") is not None)

    sc_val = max(0, p_val - e_val)

    # Peak power & exceedance
    peak_power_kw = 0.0
    exceedance_kwh = 0.0
    try:
        # Note: 15-min data fetch might be limited for very large ranges.
        ts_data = await coordinator.api_client.async_get_metering_data(
            c_meter, "1-1:1.29.0", start_dt, end_dt
        )
        from .const import CONF_REFERENCE_POWER_ENTITY, CONF_REFERENCE_POWER_STATIC
        ref_power = coordinator.entry.data.get(CONF_REFERENCE_POWER_STATIC, 5.0)
        ref_entity = coordinator.entry.data.get(CONF_REFERENCE_POWER_ENTITY)
        if ref_entity:
            ref_state = coordinator.hass.states.get(ref_entity)
            if ref_state and ref_state.state not in ("unknown", "unavailable"):
                ref_power = float(ref_state.state)

        items = ts_data.get("items", []) if isinstance(ts_data, dict) else []
        for item in items:
            try:
                kw = float(item["value"])
                if kw > peak_power_kw:
                    peak_power_kw = kw
                if kw > ref_power:
                    exceedance_kwh += (kw - ref_power) * 0.25
            except (ValueError, TypeError):
                continue
    except Exception:
        pass

    return {
        "consumption": round(c_val, 4),
        "production": round(p_val, 4),
        "exported": round(e_val, 4),
        "self_consumed": round(sc_val, 4),
        "shared": round(s_val, 4),
        "shared_with_me": round(swm_val, 4),
        "peak_power_kw": round(peak_power_kw, 2),
        "exceedance_kwh": round(exceedance_kwh, 4),
    }


class LenedaTimeseriesView(HomeAssistantView):
    """Raw 15-min timeseries data for charts."""

    url = "/leneda_api/data/timeseries"
    name = "api:leneda:data:timeseries"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        obis = request.query.get("obis", "1-1:1.29.0")
        start_str = request.query.get("start")
        end_str = request.query.get("end")

        coordinator = _get_first_coordinator(hass)
        if not coordinator:
            return self.json({"error": "no_data"}, status_code=503)

        # Default: yesterday
        from homeassistant.util import dt as dt_util
        import asyncio as _aio

        now = dt_util.utcnow()
        if start_str and end_str:
            try:
                start_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
                end_dt = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
            except ValueError:
                return self.json({"error": "Invalid date format"}, status_code=400)
        else:
            start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
            end_dt = start_dt.replace(hour=23, minute=59, second=59)

        try:
            # Check if this is a production OBIS code with multiple production meters
            is_prod_obis = (obis.startswith("1-1:2.") or obis.startswith("1-1:4.") or obis.startswith("1-65:2."))
            prod_meters = getattr(coordinator, "production_meters", [])

            if is_prod_obis and len(prod_meters) > 1:
                # Query ALL production meters and merge by timestamp
                all_results = await _aio.gather(*[
                    coordinator.api_client.async_get_metering_data(mid, obis, start_dt, end_dt)
                    for mid in prod_meters
                ], return_exceptions=True)

                merged: dict[str, float] = {}
                unit = "kW"
                interval = "PT15M"
                for result in all_results:
                    if isinstance(result, dict):
                        unit = result.get("unit", unit) or "kW"
                        interval = result.get("intervalLength", interval) or "PT15M"
                        for item in result.get("items", []):
                            ts = item.get("startedAt", "")
                            merged[ts] = merged.get(ts, 0) + (item.get("value", 0) or 0)
                    elif isinstance(result, Exception):
                        _LOGGER.error("Error fetching timeseries for production meter: %s", result)

                items = [{"value": v, "startedAt": k, "type": "measured", "version": 1, "calculated": False}
                         for k, v in sorted(merged.items())]
                return self.json({"obis": obis, "unit": unit, "interval": interval, "items": items})

            # Single-meter path (consumption, gas, or single production meter)
            result = await coordinator.api_client.async_get_metering_data(
                coordinator._meter_for_obis(obis), obis, start_dt, end_dt
            )
            items = result.get("items", []) if isinstance(result, dict) else []
            return self.json({
                "obis": obis,
                "unit": result.get("unit", "kW"),
                "interval": result.get("intervalLength", "PT15M"),
                "items": items,
            })
        except Exception as e:
            _LOGGER.error("Error fetching timeseries: %s", e)
            return self.json({"error": str(e)}, status_code=500)


class LenedaPerMeterTimeseriesView(HomeAssistantView):
    """Per-meter 15-min production timeseries for stacked chart visualisation."""

    url = "/leneda_api/data/timeseries/per-meter"
    name = "api:leneda:data:timeseries:per_meter"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        obis = request.query.get("obis", "1-1:2.29.0")
        start_str = request.query.get("start")
        end_str = request.query.get("end")

        coordinator = _get_first_coordinator(hass)
        if not coordinator:
            return self.json({"error": "no_data"}, status_code=503)

        from homeassistant.util import dt as dt_util
        import asyncio as _aio

        now = dt_util.utcnow()
        if start_str and end_str:
            try:
                start_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
                end_dt = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
            except ValueError:
                return self.json({"error": "Invalid date format"}, status_code=400)
        else:
            start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
            end_dt = start_dt.replace(hour=23, minute=59, second=59)

        prod_meters = getattr(coordinator, "production_meters", [])
        if not prod_meters:
            prod_meters = [coordinator.production_meter]

        try:
            all_results = await _aio.gather(*[
                coordinator.api_client.async_get_metering_data(mid, obis, start_dt, end_dt)
                for mid in prod_meters
            ], return_exceptions=True)

            meters_data = []
            for mid, result in zip(prod_meters, all_results):
                if isinstance(result, dict):
                    meters_data.append({
                        "meter_id": mid,
                        "unit": result.get("unit", "kW"),
                        "interval": result.get("intervalLength", "PT15M"),
                        "items": result.get("items", []),
                    })
                elif isinstance(result, Exception):
                    _LOGGER.error("Error fetching per-meter timeseries for %s: %s", mid, result)
                    meters_data.append({"meter_id": mid, "unit": "kW", "interval": "PT15M", "items": []})

            return self.json({"obis": obis, "meters": meters_data})
        except Exception as e:
            _LOGGER.error("Error fetching per-meter timeseries: %s", e)
            return self.json({"error": str(e)}, status_code=500)


# ─── Sensor overview ─────────────────────────────────────────────

class LenedaSensorsView(HomeAssistantView):
    """All current sensor values + metadata."""

    url = "/leneda_api/sensors"
    name = "api:leneda:sensors"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        coordinator = _get_first_coordinator(hass)

        if not coordinator or not coordinator.data:
            return self.json({"sensors": []})

        sensors = []
        for key, value in coordinator.data.items():
            if key.endswith("_peak_timestamp"):
                continue
            meta = OBIS_CODES.get(key, {})
            sensors.append({
                "key": key,
                "value": value,
                "name": meta.get("name", key),
                "unit": meta.get("unit", "kWh"),
                "peak_timestamp": coordinator.data.get(f"{key}_peak_timestamp"),
            })

        return self.json({"sensors": sensors, "metering_point": coordinator.metering_point_id})


# ─── Config endpoints ────────────────────────────────────────────

class LenedaConfigView(HomeAssistantView):
    """Get/set billing configuration."""

    url = "/leneda_api/config"
    name = "api:leneda:config"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        storage = hass.data.get(DOMAIN, {}).get("storage")
        if not storage:
            return self.json({})

        config_dict = storage.billing_config.to_dict()

        # Merge HA entry credentials (read-only) so the dashboard knows the meter config
        entries = hass.config_entries.async_entries(DOMAIN)
        if entries:
            entry = entries[0]
            # Build meters list for frontend
            meters = []
            m1_id = entry.data.get(CONF_METERING_POINT_ID, "")
            m1_types = entry.data.get(CONF_METERING_POINT_1_TYPES, ["consumption"])
            if m1_id:
                meters.append({"id": m1_id, "types": m1_types})
            all_types = list(m1_types)
            for id_key, types_key in EXTRA_METER_SLOTS:
                mid = (entry.data.get(id_key) or "").strip()
                mtypes = entry.data.get(types_key, [])
                if mid:
                    meters.append({"id": mid, "types": mtypes})
                    all_types.extend(mtypes)
            config_dict["meters"] = meters
            config_dict["ha_meter_id"] = m1_id  # backward compat
            # Derive meter_has_gas from type config
            config_dict["meter_has_gas"] = "gas" in all_types or entry.data.get(CONF_METER_HAS_GAS, False)

        # Resolve feed-in sensor values for each per-meter rate entry
        feed_in_rates = config_dict.get("feed_in_rates", [])
        if isinstance(feed_in_rates, list):
            for rate_entry in feed_in_rates:
                if not isinstance(rate_entry, dict):
                    continue
                if rate_entry.get("mode") == "sensor":
                    entity_id = rate_entry.get("sensor_entity", "")
                    if entity_id:
                        state = hass.states.get(entity_id)
                        if state and state.state not in ("unknown", "unavailable"):
                            try:
                                rate_entry["sensor_value"] = float(state.state)
                            except (ValueError, TypeError):
                                rate_entry["sensor_value"] = None
                        else:
                            rate_entry["sensor_value"] = None
                    else:
                        rate_entry["sensor_value"] = None
            config_dict["feed_in_rates"] = feed_in_rates

        return self.json(config_dict)

    async def post(self, request: web.Request) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        storage = hass.data.get(DOMAIN, {}).get("storage")
        if not storage:
            return self.json({"error": "Storage not initialized"}, status_code=500)

        try:
            data = await request.json()
            config = BillingConfig.from_dict(data)
            storage.billing_config = config
            await storage.async_save()
            return self.json({"status": "ok"})
        except Exception as e:
            _LOGGER.error("Error updating config: %s", e)
            return self.json({"error": str(e)}, status_code=400)


class LenedaConfigResetView(HomeAssistantView):
    """Reset billing config to defaults."""

    url = "/leneda_api/config/reset"
    name = "api:leneda:config:reset"
    requires_auth = True

    async def post(self, request: web.Request) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        storage = hass.data.get(DOMAIN, {}).get("storage")
        if not storage:
            return self.json({"error": "Storage not initialized"}, status_code=500)

        storage.billing_config = BillingConfig()
        await storage.async_save()
        return self.json({"status": "ok"})


class LenedaHAEntitiesView(HomeAssistantView):
    """List HA sensor entities for the feed-in sensor picker.

    Returns only sensor.* entities with a numeric state and a unit
    that suggests an energy price (EUR/kWh, ct/kWh, etc.).
    Falls back to all sensor entities if no price sensors are found.
    """

    url = "/leneda_api/ha-entities"
    name = "api:leneda:ha-entities"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        hass: HomeAssistant = request.app["hass"]
        price_keywords = {"eur/kwh", "ct/kwh", "€/kwh", "eur/mwh", "ct/mwh"}
        all_sensors: list[str] = []
        price_sensors: list[str] = []

        for entity_id, state in hass.states.async_all("sensor"):
            all_sensors.append(entity_id.entity_id)
            unit = (state.attributes.get("unit_of_measurement") or "").lower()
            if unit in price_keywords or "price" in entity_id.entity_id or "tariff" in entity_id.entity_id or "cost" in entity_id.entity_id:
                price_sensors.append(entity_id.entity_id)

        # Return price-related sensors first; if none found, return all sensors
        entities = price_sensors if price_sensors else all_sensors
        entities.sort()
        return self.json({"entities": entities})


# ─── Registration helper ─────────────────────────────────────────

def async_register_api_views(hass: HomeAssistant) -> None:
    """Register all REST API views."""
    views = [
        LenedaModeView(),
        LenedaDataView(),
        LenedaCustomDataView(),
        LenedaTimeseriesView(),
        LenedaPerMeterTimeseriesView(),
        LenedaSensorsView(),
        LenedaConfigView(),
        LenedaConfigResetView(),
        LenedaHAEntitiesView(),
    ]
    for view in views:
        hass.http.register_view(view)
    _LOGGER.info("Registered %d Leneda API views", len(views))

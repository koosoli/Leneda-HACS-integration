"""DataUpdateCoordinator for the Leneda integration.

This module contains the coordinator that handles data fetching from the Leneda API.
It manages three types of data:
1. Live power data (kW) - Current power consumption/production
2. 15-minute interval data - For calculating recent energy consumption
3. Aggregated data - Historical consumption/production over various periods

The coordinator implements intelligent error handling:
- Network timeouts preserve previous values instead of showing zero
- Missing data is handled gracefully without marking sensors as unavailable
- Gas sensors are properly identified and prefixed
"""
from __future__ import annotations

import asyncio
import async_timeout
from datetime import timedelta
import logging
import aiohttp

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import (
    DataUpdateCoordinator,
    UpdateFailed,
)
from homeassistant.util import dt as dt_util

from .api import LenedaApiClient
from .const import DOMAIN, OBIS_CODES

_LOGGER = logging.getLogger(__name__)


class LenedaDataUpdateCoordinator(DataUpdateCoordinator):
    """A coordinator to fetch data from the Leneda API."""

    def __init__(self, hass: HomeAssistant, api_client: LenedaApiClient, metering_point_id: str) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(minutes=15),
        )
        self.api_client = api_client
        self.metering_point_id = metering_point_id

    async def _async_update_data(self) -> dict[str, float | None]:
        """Fetch data from the Leneda API concurrently."""
        _LOGGER.debug("--- Starting Leneda Data Update ---")
        now = dt_util.utcnow()

        try:
            async with async_timeout.timeout(30):
                # Define date ranges
                today_start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
                live_data_start_dt = now - timedelta(minutes=60) # Fetch last 60 mins for live data
                month_start_dt = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                week_start_dt = today_start_dt - timedelta(days=now.weekday())
                yesterday_start_dt = today_start_dt - timedelta(days=1)
                yesterday_end_dt = today_start_dt - timedelta(microseconds=1)
                last_week_start_dt = week_start_dt - timedelta(weeks=1)
                last_week_end_dt = week_start_dt - timedelta(microseconds=1)
                first_day_of_current_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                end_of_last_month = first_day_of_current_month - timedelta(microseconds=1)
                start_of_last_month = end_of_last_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

                CONSUMPTION_CODE = "1-1:1.29.0"
                PRODUCTION_CODE = "1-1:2.29.0"
                GAS_VOLUME_CODE = "7-1:99.23.15"  # m³
                GAS_STANDARD_VOLUME_CODE = "7-1:99.23.17"  # Nm³
                GAS_ENERGY_CODE = "7-20:99.33.17"  # kWh

                # Tasks for live power data (OBIS codes)
                _LOGGER.debug("Setting up tasks for live power data...")
                live_power_tasks = [
                    self.api_client.async_get_metering_data(
                        self.metering_point_id, obis_code, live_data_start_dt, now
                    ) for obis_code in OBIS_CODES
                ]

                # Tasks for 15-minute raw data (for energy calculation)
                _LOGGER.debug("Setting up tasks for 15-minute raw data...")
                quarter_hour_start_dt = now - timedelta(minutes=15)
                quarter_hour_tasks = [
                    self.api_client.async_get_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, quarter_hour_start_dt, now
                    ),
                    self.api_client.async_get_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, quarter_hour_start_dt, now
                    ),
                ]
                
                # Task for yesterday's gas detailed data (for gas peak calculation only)
                _LOGGER.debug("Setting up task for yesterday's gas data for peak calculation...")
                yesterday_detail_tasks = [
                    self.api_client.async_get_metering_data(
                        self.metering_point_id, GAS_ENERGY_CODE, yesterday_start_dt, yesterday_end_dt
                    ),
                ]

                # Tasks for aggregated data
                _LOGGER.debug("Setting up tasks for aggregated data...")
                aggregated_tasks = [
                    # Hourly (Current hour)
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, today_start_dt, now, aggregation_level="Hour"
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, today_start_dt, now, aggregation_level="Hour"
                    ),
                    # Daily
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, today_start_dt, now
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, today_start_dt, now
                    ),
                    # Weekly
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, week_start_dt, now
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, week_start_dt, now
                    ),
                    # Monthly
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, month_start_dt, now
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, month_start_dt, now
                    ),
                    # Yesterday
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, yesterday_start_dt, yesterday_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, yesterday_start_dt, yesterday_end_dt
                    ),
                    # Last Week
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, last_week_start_dt, last_week_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, last_week_start_dt, last_week_end_dt
                    ),
                    # Previous Month
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, start_of_last_month, end_of_last_month
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, start_of_last_month, end_of_last_month
                    ),
                ]
                quarter_hour_keys = [
                    "c_01_quarter_hourly_consumption", "p_01_quarter_hourly_production"
                ]
                
                yesterday_detail_keys = [
                    "_yesterday_detail_gas"
                ]
                
                aggregated_keys = [
                    "c_02_hourly_consumption", "p_02_hourly_production",
                    "c_03_daily_consumption", "p_03_daily_production",
                    "c_05_weekly_consumption", "p_05_weekly_production",
                    "c_07_monthly_consumption", "p_07_monthly_production",
                    "c_04_yesterday_consumption", "p_04_yesterday_production",
                    "c_06_last_week_consumption", "p_06_last_week_production",
                    "c_08_previous_month_consumption", "p_08_previous_month_production",
                ]

                _LOGGER.debug("Gathering all API tasks...")
                all_tasks = live_power_tasks + quarter_hour_tasks + yesterday_detail_tasks + aggregated_tasks
                results = await asyncio.gather(*all_tasks, return_exceptions=True)
                _LOGGER.debug("All API tasks gathered.")

                live_power_results = results[:len(live_power_tasks)]
                quarter_hour_results = results[len(live_power_tasks):len(live_power_tasks) + len(quarter_hour_tasks)]
                yesterday_detail_results = results[len(live_power_tasks) + len(quarter_hour_tasks):len(live_power_tasks) + len(quarter_hour_tasks) + len(yesterday_detail_tasks)]
                aggregated_results = results[len(live_power_tasks) + len(quarter_hour_tasks) + len(yesterday_detail_tasks):]

                data = self.data.copy() if self.data else {}
                _LOGGER.debug("Starting with previous data keys: %s", list(data.keys()) if data else 'None')

                # Track time periods to know when to reset cumulative sensors
                # All times are in UTC. Midnight (00:00) marks the start of a new day.
                current_periods = {
                    "today_date": today_start_dt.date().isoformat(),  # For daily sensors
                    "yesterday_date": yesterday_start_dt.date().isoformat(),
                    "last_week_start": last_week_start_dt.date().isoformat(),
                    "previous_month_start": start_of_last_month.date().isoformat(),
                    "current_week_start": week_start_dt.date().isoformat(),
                    "current_month_start": month_start_dt.date().isoformat(),
                }
                
                # Check if time periods have changed (e.g., new day at 00:00, new week on Monday, new month on 1st)
                previous_periods = data.get("_time_periods", {})
                periods_changed = {
                    "today": previous_periods.get("today_date") != current_periods["today_date"],
                    "yesterday": previous_periods.get("yesterday_date") != current_periods["yesterday_date"],
                    "last_week": previous_periods.get("last_week_start") != current_periods["last_week_start"],
                    "previous_month": previous_periods.get("previous_month_start") != current_periods["previous_month_start"],
                    "current_week": previous_periods.get("current_week_start") != current_periods["current_week_start"],
                    "current_month": previous_periods.get("current_month_start") != current_periods["current_month_start"],
                }
                
                # Log period changes
                for period_name, changed in periods_changed.items():
                    if changed:
                        _LOGGER.info(f"Time period changed: {period_name} - Sensors will be reset if no new data")
                
                # Store current periods for next update
                data["_time_periods"] = current_periods

                # Ensure keys exist before processing, setting a default
                data.setdefault("c_01_quarter_hourly_consumption", 0.0)
                data.setdefault("p_01_quarter_hourly_production", 0.0)

                _LOGGER.debug("Processing live power results...")
                # Process live power results
                for obis_code, result in zip(OBIS_CODES.keys(), live_power_results):
                    from .const import GAS_OBIS_CODES
                    is_gas = obis_code in GAS_OBIS_CODES
                    
                    if isinstance(result, dict) and result.get("items"):
                        if is_gas:
                            _LOGGER.debug(f"[GAS] Processing live data for {obis_code}")
                            _LOGGER.debug(f"[GAS] Full API response: {result}")
                            _LOGGER.debug(f"[GAS] Number of items: {len(result['items'])}")
                            if result['items']:
                                _LOGGER.debug(f"[GAS] First item: {result['items'][0]}")
                                _LOGGER.debug(f"[GAS] Last item: {result['items'][-1]}")
                        
                        latest_item = max(result["items"], key=lambda x: dt_util.parse_datetime(x["startedAt"]))
                        value = latest_item["value"]
                        old_value = data.get(obis_code)
                        data[obis_code] = value
                        data[f"{obis_code}_data_timestamp"] = latest_item["startedAt"]
                        
                        if is_gas:
                            _LOGGER.debug(f"[GAS] {obis_code} - Updated from {old_value} to {value} at {latest_item['startedAt']}")
                        else:
                            _LOGGER.debug(f"Latest item for {obis_code}: value={value}, timestamp={latest_item['startedAt']}")
                    elif isinstance(result, (aiohttp.ClientError, asyncio.TimeoutError)):
                        # Network errors: preserve previous values
                        _LOGGER.error("Error fetching live data for %s: %s", obis_code, result)
                        # Keep existing value - DON'T set to None if we have previous data
                        if obis_code not in data:
                            _LOGGER.warning("%s has no previous value, setting to None", obis_code)
                            data[obis_code] = None
                        else:
                            _LOGGER.info("%s keeping previous value: %s", obis_code, data[obis_code])
                    elif isinstance(result, Exception):
                        _LOGGER.error("Error fetching live data for %s: %s", obis_code, result)
                        # Keep existing value - DON'T set to None if we have previous data
                        if obis_code not in data:
                            _LOGGER.warning("%s has no previous value, setting to None", obis_code)
                            data[obis_code] = None
                        else:
                            _LOGGER.info("%s keeping previous value: %s", obis_code, data[obis_code])
                    else:
                        _LOGGER.warning("No items found for live data obis_code %s. Response: %s", obis_code, result)
                        # Keep existing value - DON'T set to None if we have previous data
                        if obis_code not in data:
                            _LOGGER.warning("%s has no previous value, setting to None", obis_code)
                            data[obis_code] = None
                        else:
                            _LOGGER.info("%s keeping previous value: %s", obis_code, data[obis_code])

                _LOGGER.debug("Processing yesterday's gas detail data for peak calculation...")
                # Process yesterday's gas detailed data to calculate peak consumption
                for key, result in zip(yesterday_detail_keys, yesterday_detail_results):
                    if isinstance(result, dict) and result.get("items"):
                        # Store the raw items data for peak calculation
                        # Don't log the full data to avoid log spam
                        data[key] = result["items"]
                        _LOGGER.debug(f"[GAS PEAK] Stored {len(result['items'])} items for peak calculation")
                    else:
                        data[key] = []
                        _LOGGER.debug(f"[GAS PEAK] No items for peak calculation")
                
                # Calculate gas peak value from yesterday's data
                if data.get("_yesterday_detail_gas"):
                    items = data["_yesterday_detail_gas"]
                    if items:
                        # For gas, the peak is the highest energy reading in a 15-minute interval
                        peak_value = max(item["value"] for item in items)
                        data["g_peak_yesterday"] = peak_value
                        _LOGGER.debug(f"[GAS PEAK] Yesterday's gas peak: {peak_value} kWh (15-min interval)")
                    else:
                        if periods_changed.get("yesterday"):
                            data["g_peak_yesterday"] = None
                        _LOGGER.debug("[GAS PEAK] No gas data for peak calculation")
                else:
                    if periods_changed.get("yesterday"):
                        data["g_peak_yesterday"] = None

                _LOGGER.debug("Processing 15-minute results...")
                # Process 15-minute results for energy calculation (kW * 0.25h = kWh)
                quarter_hour_codes = [CONSUMPTION_CODE, PRODUCTION_CODE]
                for key, code, result in zip(quarter_hour_keys, quarter_hour_codes, quarter_hour_results):
                    if isinstance(result, dict) and result.get("items"):
                        _LOGGER.debug(f"Processing 15-min data for {key}, {len(result.get('items', []))} items")
                        # Sum all 15-minute intervals and convert to kWh
                        total_kwh = sum(item["value"] * 0.25 for item in result["items"])
                        old_value = data.get(key)
                        data[key] = total_kwh
                        _LOGGER.debug(f"15-minute energy for {key}: {old_value} -> {total_kwh} kWh")
                    elif isinstance(result, (aiohttp.ClientError, asyncio.TimeoutError)):
                        # Network errors: preserve previous values
                        _LOGGER.error("Error fetching 15-minute data for %s: %s", key, result)
                        if key not in data:
                            _LOGGER.warning("%s has no previous value, setting to None", key)
                            data[key] = None
                        else:
                            _LOGGER.info("%s keeping previous value: %s", key, data[key])
                    elif isinstance(result, Exception):
                        _LOGGER.error("Error fetching 15-minute data for %s: %s", key, result)
                        if key not in data:
                            _LOGGER.warning("%s has no previous value, setting to None", key)
                            data[key] = None
                        else:
                            _LOGGER.info("%s keeping previous value: %s", key, data[key])
                    else:
                        _LOGGER.warning("No items found for 15-minute data %s. Response: %s", key, result)
                        if key not in data:
                            _LOGGER.warning("%s has no previous value, setting to None", key)
                            data[key] = None
                        else:
                            _LOGGER.info("%s keeping previous value: %s", key, data[key])


                _LOGGER.debug("Processing aggregated results...")
                # Process aggregated results
                for key, result in zip(aggregated_keys, aggregated_results):
                    # Determine which time period this sensor belongs to
                    # This ensures ALL time-based sensors reset when their period changes
                    period_key = None
                    if "yesterday" in key or "_04_" in key or key.endswith("_yesterday"):
                        period_key = "yesterday"
                    elif "last_week" in key or "_06_" in key:
                        period_key = "last_week"
                    elif "previous_month" in key or "_08_" in key:
                        period_key = "previous_month"
                    elif "weekly" in key or "current_week" in key or "_05_" in key:
                        period_key = "current_week"
                    elif "monthly" in key or "current_month" in key or "_07_" in key:
                        period_key = "current_month"
                    elif "daily" in key or "_03_" in key:
                        # Current day resets at midnight (00:00) every day
                        period_key = "today"
                    elif "hourly" in key or "_02_" in key:
                        # Hourly data doesn't need reset logic, it's always current hour
                        period_key = None
                    
                    should_reset = period_key and periods_changed.get(period_key, False)
                    
                    if isinstance(result, dict):
                        series = result.get("aggregatedTimeSeries")
                        unit = result.get("unit", "unknown")
                        _LOGGER.debug(f"Processing aggregated data for {key}, unit={unit}, series_count={len(series) if series else 0}, should_reset={should_reset}")
                        
                        if series and len(series) > 0:
                            if key.startswith("c_02_") or key.startswith("p_02_"): # Hourly - get latest hour
                                new_value = series[-1].get("value", 0.0) if series else 0.0
                                old_value = data.get(key)
                                data[key] = new_value
                                _LOGGER.debug(f"Hourly data for {key}: {old_value} -> {new_value} {unit}")
                            else: # Other aggregated - get first (and usually only) value
                                new_value = series[0].get("value", 0.0) if series else 0.0
                                old_value = data.get(key)
                                data[key] = new_value
                                _LOGGER.debug(f"Aggregated data for {key}: {old_value} -> {new_value} {unit}")
                                if series:
                                    _LOGGER.debug(f"  Period: {series[0].get('startedAt')} to {series[0].get('endedAt')}")
                        else:
                            # Handle missing data based on whether time period changed
                            if should_reset:
                                # New time period started, reset to 0 (no data yet for new period)
                                old_value = data.get(key)
                                data[key] = 0.0
                                _LOGGER.info(f"Time period changed for {key}, resetting from {old_value} to 0.0 {unit}")
                            elif key not in data:
                                # First time fetching this sensor, set to None
                                _LOGGER.warning(f"No aggregated time series for {key} and no previous value exists, setting to None")
                                data[key] = None
                            else:
                                # Same time period, no new data - keep previous value
                                _LOGGER.info(f"No new data for {key}, keeping previous value: {data[key]} {unit}")
                    elif isinstance(result, (aiohttp.ClientError, asyncio.TimeoutError)):
                        # Network errors: handle based on time period
                        _LOGGER.error("Error fetching aggregated data for %s: %s", key, result)
                        if should_reset:
                            # New period but network error - reset to 0
                            old_value = data.get(key)
                            data[key] = 0.0
                            _LOGGER.warning("%s time period changed but network error, resetting from %s to 0.0", key, old_value)
                        elif key not in data:
                            _LOGGER.warning("%s has no previous value, setting to None", key)
                            data[key] = None
                        else:
                            _LOGGER.info("%s keeping previous value due to network error: %s", key, data[key])
                    elif isinstance(result, Exception):
                        _LOGGER.error("Error fetching aggregated data for %s: %s", key, result)
                        if should_reset:
                            # New period but error - reset to 0
                            old_value = data.get(key)
                            data[key] = 0.0
                            _LOGGER.warning("%s time period changed but error, resetting from %s to 0.0", key, old_value)
                        elif key not in data:
                            _LOGGER.warning("%s has no previous value, setting to None", key)
                            data[key] = None
                        else:
                            _LOGGER.info("%s keeping previous value due to error: %s", key, data[key])
                    else:
                        _LOGGER.warning("Unexpected result type for aggregated data %s. Response: %s", key, result)
                        if should_reset:
                            # New period but unexpected response - reset to 0
                            old_value = data.get(key)
                            data[key] = 0.0
                            _LOGGER.warning("%s time period changed but unexpected response, resetting from %s to 0.0", key, old_value)
                        elif key not in data:
                            _LOGGER.warning("%s has no previous value, setting to None", key)
                            data[key] = None
                        else:
                            _LOGGER.info("%s keeping previous value due to unexpected response: %s", key, data[key])

                _LOGGER.debug("--- Leneda Data Update Finished ---")
                _LOGGER.debug("Final coordinated data: %s", data)
                return data
        except (asyncio.TimeoutError, Exception) as err:
            _LOGGER.error("Fatal error during Leneda data fetch: %s", err, exc_info=True)
            raise UpdateFailed(f"Error communicating with API: {err}") from err

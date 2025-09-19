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
                # Define date ranges - Leneda only provides historical data (previous day onwards)
                today_start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
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
                EXPORT_CODE = "1-65:2.29.9"

                # Tasks for OBIS code data (historical data from yesterday)
                _LOGGER.debug("Setting up tasks for OBIS code data...")
                obis_tasks = [
                    self.api_client.async_get_metering_data(
                        self.metering_point_id, obis_code, yesterday_start_dt, yesterday_end_dt
                    ) for obis_code in OBIS_CODES
                ]

                # Tasks for aggregated historical data only
                _LOGGER.debug("Setting up tasks for aggregated historical data...")
                aggregated_tasks = [
                    # Yesterday
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, yesterday_start_dt, yesterday_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, yesterday_start_dt, yesterday_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, EXPORT_CODE, yesterday_start_dt, yesterday_end_dt
                    ),
                    # Weekly (current week so far)
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, week_start_dt, yesterday_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, week_start_dt, yesterday_end_dt
                    ),
                    # Last Week
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, last_week_start_dt, last_week_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, last_week_start_dt, last_week_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, EXPORT_CODE, last_week_start_dt, last_week_end_dt
                    ),
                    # Monthly (current month so far)
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, month_start_dt, yesterday_end_dt
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, month_start_dt, yesterday_end_dt
                    ),
                    # Previous Month
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, CONSUMPTION_CODE, start_of_last_month, end_of_last_month
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, PRODUCTION_CODE, start_of_last_month, end_of_last_month
                    ),
                    self.api_client.async_get_aggregated_metering_data(
                        self.metering_point_id, EXPORT_CODE, start_of_last_month, end_of_last_month
                    ),
                ]
                
                aggregated_keys = [
                    "c_04_yesterday_consumption", "p_04_yesterday_production", "p_09_yesterday_exported",
                    "c_05_weekly_consumption", "p_05_weekly_production",
                    "c_06_last_week_consumption", "p_06_last_week_production", "p_10_last_week_exported",
                    "c_07_monthly_consumption", "p_07_monthly_production",
                    "c_08_previous_month_consumption", "p_08_previous_month_production", "p_11_last_month_exported",
                ]

                _LOGGER.debug("Gathering all API tasks...")
                all_tasks = obis_tasks + aggregated_tasks
                results = await asyncio.gather(*all_tasks, return_exceptions=True)
                _LOGGER.debug("All API tasks gathered.")

                obis_results = results[:len(obis_tasks)]
                aggregated_results = results[len(obis_tasks):]

                data = self.data.copy() if self.data else {}

                # Initialize all sensor keys with 0.0 if not present (first run)
                sensor_keys = [
                    "c_04_yesterday_consumption", "p_04_yesterday_production",
                    "c_05_weekly_consumption", "p_05_weekly_production",
                    "c_06_last_week_consumption", "p_06_last_week_production",
                    "c_07_monthly_consumption", "p_07_monthly_production",
                    "c_08_previous_month_consumption", "p_08_previous_month_production",
                ]
                
                # Set default values only on first run
                for key in sensor_keys:
                    data.setdefault(key, 0.0)
                
                # Initialize OBIS code sensors
                for obis_code in OBIS_CODES.keys():
                    data.setdefault(obis_code, None)

                _LOGGER.debug("Processing OBIS code results...")
                # Process OBIS code results (yesterday's data)
                for obis_code, result in zip(OBIS_CODES.keys(), obis_results):
                    if isinstance(result, dict) and result.get("items"):
                        _LOGGER.debug(f"Processing live data for {obis_code}, result: {result}")
                        latest_item = max(result["items"], key=lambda x: dt_util.parse_datetime(x["startedAt"]))
                        value = latest_item["value"]
                        data[obis_code] = value
                        data[f"{obis_code}_data_timestamp"] = latest_item["startedAt"]
                        _LOGGER.debug(f"Latest item for {obis_code}: {latest_item}")
                    elif isinstance(result, (aiohttp.ClientError, asyncio.TimeoutError)):
                        # Network errors: preserve previous values
                        _LOGGER.error("Error fetching live data for %s: %s", obis_code, result)
                        # Keep existing value if available
                        if obis_code not in data:
                            data[obis_code] = None
                    elif isinstance(result, Exception):
                        _LOGGER.error("Error fetching live data for %s: %s", obis_code, result)
                        # Keep existing value if available
                        if obis_code not in data:
                            data[obis_code] = None
                    else:
                        # Handle empty responses (null meteringPointCode or empty items) more quietly
                        if isinstance(result, dict):
                            # Check if this is a null response (API returned None values)
                            if result.get("meteringPointCode") is None or result.get("obisCode") is None:
                                _LOGGER.debug("API returned null response for obis_code %s (likely not supported by meter)", obis_code)
                            else:
                                _LOGGER.debug("No items found for live data obis_code %s (no recent data available)", obis_code)
                        else:
                            _LOGGER.warning("Unexpected response type for live data obis_code %s: %s", obis_code, result)
                        # Keep existing value if available for empty responses
                        if obis_code not in data:
                            data[obis_code] = None

                _LOGGER.debug("Processing aggregated results...")
                # Process aggregated results
                for key, result in zip(aggregated_keys, aggregated_results):
                    if isinstance(result, dict):
                        _LOGGER.debug(f"Processing aggregated data for {key}, result: {result}")
                        series = result.get("aggregatedTimeSeries")
                        if series and len(series) > 0:
                            if key.startswith("c_02_") or key.startswith("p_02_"): # Hourly - get latest hour
                                data[key] = series[-1].get("value", 0.0) if series else 0.0
                                _LOGGER.debug(f"Processed hourly data for {key}: {data[key]}")
                            else: # Other aggregated - get first (and usually only) value
                                data[key] = series[0].get("value", 0.0) if series else 0.0
                                _LOGGER.debug(f"Processed aggregated data for {key}: {data[key]}")
                        else:
                            # Keep previous value if available, otherwise set to 0.0 for energy sensors
                            if key not in data or data[key] is None:
                                data[key] = 0.0
                            _LOGGER.debug(f"No aggregated time series for {key}, keeping previous value: {data[key]}")
                    elif isinstance(result, (aiohttp.ClientError, asyncio.TimeoutError)):
                        # Network errors: preserve previous values
                        _LOGGER.error("Error fetching aggregated data for %s: %s", key, result)
                        if key not in data: 
                            data[key] = None
                    elif isinstance(result, Exception):
                        _LOGGER.error("Error fetching aggregated data for %s: %s", key, result)
                        # Keep previous value if available
                        if key not in data: 
                            data[key] = 0.0
                    else:
                        # Handle unexpected aggregated results more gracefully
                        if isinstance(result, dict) and result.get("unit") is None:
                            _LOGGER.debug("API returned null unit for aggregated data %s (likely no data for time period)", key)
                        else:
                            _LOGGER.warning("Unexpected result type for aggregated data %s: %s", key, result)
                        # Keep previous value if available
                        if key not in data: 
                            data[key] = 0.0

                # Calculate self-consumption values
                try:
                    # Yesterday
                    prod_yesterday = data.get("p_04_yesterday_production")
                    export_yesterday = data.get("p_09_yesterday_exported")
                    if prod_yesterday is not None and export_yesterday is not None:
                        data["p_12_yesterday_self_consumed"] = round(prod_yesterday - export_yesterday, 2)

                    # Last Week
                    prod_last_week = data.get("p_06_last_week_production")
                    export_last_week = data.get("p_10_last_week_exported")
                    if prod_last_week is not None and export_last_week is not None:
                        data["p_13_last_week_self_consumed"] = round(prod_last_week - export_last_week, 2)

                    # Last Month
                    prod_last_month = data.get("p_08_previous_month_production")
                    export_last_month = data.get("p_11_last_month_exported")
                    if prod_last_month is not None and export_last_month is not None:
                        data["p_14_last_month_self_consumed"] = round(prod_last_month - export_last_month, 2)
                except (TypeError, ValueError) as e:
                    _LOGGER.error("Could not calculate self-consumption values: %s", e)

                _LOGGER.debug("--- Leneda Data Update Finished ---")
                _LOGGER.debug("Final coordinated data: %s", data)
                return data
        except (asyncio.TimeoutError, Exception) as err:
            _LOGGER.error("Fatal error during Leneda data fetch: %s", err, exc_info=True)
            raise UpdateFailed(f"Error communicating with API: {err}") from err

"""Sensor platform for Leneda."""
from __future__ import annotations

from datetime import timedelta
import logging

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from .const import CONF_METERING_POINT_ID, DOMAIN, OBIS_CODES
from .api import LenedaApiClient

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Leneda sensors from a config entry."""
    _LOGGER.debug("Setting up Leneda sensor platform.")
    api_client: LenedaApiClient = hass.data[DOMAIN][entry.entry_id]
    metering_point_id = entry.data[CONF_METERING_POINT_ID]
    version = hass.data[DOMAIN].get("version")

    sensors = [
        LenedaSensor(api_client, metering_point_id, obis_code, details, version)
        for obis_code, details in OBIS_CODES.items()
    ]

    # Add monthly energy sensor
    sensors.append(LenedaMonthlyEnergySensor(api_client, metering_point_id, version))

    _LOGGER.debug(f"Found {len(sensors)} sensors to create.")
    async_add_entities(sensors, True)
    _LOGGER.debug("Finished setting up Leneda sensor platform.")


class LenedaSensor(SensorEntity):
    """Representation of a Leneda sensor."""

    def __init__(
        self,
        api_client: LenedaApiClient,
        metering_point_id: str,
        obis_code: str,
        details: dict,
        version: str | None,
    ):
        """Initialize the sensor."""
        _LOGGER.debug(f"Initializing LenedaSensor for obis_code: {obis_code}")
        self._api_client = api_client
        self._metering_point_id = metering_point_id
        self._obis_code = obis_code
        self._attr_name = f"Leneda {details['name']}"
        self._attr_unique_id = f"{metering_point_id}_{obis_code}"
        self._attr_native_unit_of_measurement = details["unit"]
        if details["unit"] == "kW":
            self._attr_device_class = SensorDeviceClass.POWER
            self._attr_state_class = SensorStateClass.MEASUREMENT
        elif details["unit"] == "kWh":
            self._attr_device_class = SensorDeviceClass.ENERGY
            self._attr_state_class = SensorStateClass.TOTAL_INCREASING
        self._attr_icon = "mdi:flash"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, metering_point_id)},
            name=f"Leneda ({metering_point_id})",
            manufacturer="Leneda",
            model="Metering Point",
            sw_version=version,
        )

    async def async_update(self) -> None:
        """Fetch new state data for the sensor."""
        now = dt_util.utcnow()

        if self._obis_code == "7-20:99.33.17":
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            next_month = start_date.replace(day=28) + timedelta(days=4)
            end_date = next_month - timedelta(days=next_month.day)
            try:
                data = await self._api_client.async_get_aggregated_metering_data(
                    self._metering_point_id, self._obis_code, start_date, end_date
                )
                if data and data.get("aggregatedTimeSeries"):
                    self._attr_native_value = data["aggregatedTimeSeries"][0]["value"]
                else:
                    self._attr_native_value = None
            except Exception as e:
                _LOGGER.error("Error fetching data for sensor %s: %s", self.name, e)
                self._attr_native_value = None
        else:
            start_date = now - timedelta(hours=25)
            end_date = now

            try:
                data = await self._api_client.async_get_metering_data(
                    self._metering_point_id, self._obis_code, start_date, end_date
                )
                if data and data.get("items"):
                    self._attr_native_value = data["items"][-1]["value"]
                else:
                    self._attr_native_value = None
            except Exception as e:
                _LOGGER.error("Error fetching data for sensor %s: %s", self.name, e)
                self._attr_native_value = None


class LenedaMonthlyEnergySensor(SensorEntity):
    """Representation of a Leneda monthly energy sensor."""

    def __init__(
        self,
        api_client: LenedaApiClient,
        metering_point_id: str,
        version: str | None,
    ):
        """Initialize the sensor."""
        _LOGGER.debug("Initializing LenedaMonthlyEnergySensor")
        self._api_client = api_client
        self._metering_point_id = metering_point_id
        self._obis_code = "1-1:1.29.0"  # Using active consumption code
        self._attr_name = "Leneda Monthly Consumed Energy"
        self._attr_unique_id = f"{metering_point_id}_monthly_consumed_energy"
        self._attr_native_unit_of_measurement = "kWh"
        self._attr_device_class = SensorDeviceClass.ENERGY
        self._attr_state_class = SensorStateClass.TOTAL
        self._attr_icon = "mdi:flash"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, metering_point_id)},
            name=f"Leneda ({metering_point_id})",
            manufacturer="Leneda",
            model="Metering Point",
            sw_version=version,
        )

    async def async_update(self) -> None:
        """Fetch new state data for the sensor."""
        now = dt_util.utcnow()
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = start_date.replace(day=28) + timedelta(days=4)
        end_date = next_month - timedelta(days=next_month.day)

        try:
            data = await self._api_client.async_get_aggregated_metering_data(
                self._metering_point_id, self._obis_code, start_date, end_date
            )
            if data and data.get("aggregatedTimeSeries"):
                self._attr_native_value = data["aggregatedTimeSeries"][0]["value"]
            else:
                self._attr_native_value = 0  # Default to 0 if no data
        except Exception as e:
            _LOGGER.error(
                "Error fetching data for monthly energy sensor %s: %s", self.name, e
            )
            self._attr_native_value = None

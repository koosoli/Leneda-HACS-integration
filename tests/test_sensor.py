"""Test the Leneda sensor."""
from unittest.mock import MagicMock

from homeassistant.core import HomeAssistant
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.leneda.const import DOMAIN
from custom_components.leneda.sensor import LenedaSensor


@pytest.fixture
def mock_api_client():
    """Mock Leneda API client."""
    client = MagicMock()
    client.get_aggregated_metering_data.return_value = {"value": 123.45}
    return client


async def test_sensor(hass: HomeAssistant, mock_api_client: MagicMock) -> None:
    """Test the Leneda sensor."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        data={
            "api_key": "test-key",
            "energy_id": "test-energy-id",
            "metering_point_id": "test-point-id",
        },
    )
    entry.add_to_hass(hass)

    sensor = LenedaSensor(mock_api_client)
    sensor.hass = hass
    sensor.entity_id = "sensor.leneda_aggregated_consumption"

    await sensor.async_update()

    assert sensor.native_value == 123.45

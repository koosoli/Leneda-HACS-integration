"""Models for the Leneda integration."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import TypedDict

@dataclass
class BillingConfig:
    """Billing configuration.

    Luxembourg energy billing model:
    - energy_fixed_fee: monthly fixed supplier charge
    - energy_variable_rate: per-kWh supplier charge
    - network_*: grid operator charges
    - reference_power_kw: contracted reference power (Referenzwert) in kW
    - exceedance_rate: surcharge per kW over reference power per 15-min interval
    - feed_in_tariff: compensation per kWh sold back to the grid
    - compensation_fund_rate: renewable energy fund levy (often negative = credit)
    - electricity_tax_rate: government tax per kWh
    - vat_rate: VAT as decimal (0.08 = 8%)
    """
    energy_fixed_fee: float = 1.50
    energy_variable_rate: float = 0.1500
    network_metering_rate: float = 5.90
    network_power_ref_rate: float = 19.27
    network_variable_rate: float = 0.0510
    reference_power_kw: float = 5.0
    exceedance_rate: float = 0.1139
    feed_in_tariff: float = 0.08
    feed_in_rates: list = field(default_factory=list)  # [{meter_id, mode, tariff, sensor_entity}]
    meter_monthly_fees: list = field(default_factory=list)  # [{meter_id, label, fee}]
    gas_fixed_fee: float = 6.50
    gas_variable_rate: float = 0.0550
    gas_network_fee: float = 4.80
    gas_network_variable_rate: float = 0.0120
    gas_tax_rate: float = 0.0010
    gas_vat_rate: float = 0.08
    compensation_fund_rate: float = 0.0010
    electricity_tax_rate: float = 0.0010
    vat_rate: float = 0.08
    currency: str = "EUR"
    meter_has_gas: bool = False
    api_key: str = ""
    energy_id: str = ""
    meters: list = field(default_factory=lambda: [
        {"id": "", "types": ["consumption"]}
    ])

    def to_dict(self) -> dict:
        """Return as dict."""
        return {
            "energy_fixed_fee": self.energy_fixed_fee,
            "energy_variable_rate": self.energy_variable_rate,
            "network_metering_rate": self.network_metering_rate,
            "network_power_ref_rate": self.network_power_ref_rate,
            "network_variable_rate": self.network_variable_rate,
            "reference_power_kw": self.reference_power_kw,
            "exceedance_rate": self.exceedance_rate,
            "feed_in_tariff": self.feed_in_tariff,
            "feed_in_rates": self.feed_in_rates,
            "meter_monthly_fees": self.meter_monthly_fees,
            "gas_fixed_fee": self.gas_fixed_fee,
            "gas_variable_rate": self.gas_variable_rate,
            "gas_network_fee": self.gas_network_fee,
            "gas_network_variable_rate": self.gas_network_variable_rate,
            "gas_tax_rate": self.gas_tax_rate,
            "gas_vat_rate": self.gas_vat_rate,
            "compensation_fund_rate": self.compensation_fund_rate,
            "electricity_tax_rate": self.electricity_tax_rate,
            "vat_rate": self.vat_rate,
            "currency": self.currency,
            "meter_has_gas": self.meter_has_gas,
            "api_key": self.api_key,
            "energy_id": self.energy_id,
            "meters": self.meters,
        }

    @classmethod
    def from_dict(cls, data: dict) -> BillingConfig:
        """Create from dict."""
        return cls(
            energy_fixed_fee=data.get("energy_fixed_fee", 1.50),
            energy_variable_rate=data.get("energy_variable_rate", 0.1500),
            network_metering_rate=data.get("network_metering_rate", 5.90),
            network_power_ref_rate=data.get("network_power_ref_rate", 19.27),
            network_variable_rate=data.get("network_variable_rate", 0.0510),
            reference_power_kw=data.get("reference_power_kw", 5.0),
            exceedance_rate=data.get("exceedance_rate", 0.1139),
            feed_in_tariff=data.get("feed_in_tariff", 0.08),
            feed_in_rates=cls._migrate_feed_in_rates(data),
            meter_monthly_fees=data.get("meter_monthly_fees", []),
            gas_fixed_fee=data.get("gas_fixed_fee", 6.50),
            gas_variable_rate=data.get("gas_variable_rate", 0.0550),
            gas_network_fee=data.get("gas_network_fee", 4.80),
            gas_network_variable_rate=data.get("gas_network_variable_rate", 0.0120),
            gas_tax_rate=data.get("gas_tax_rate", 0.0010),
            gas_vat_rate=data.get("gas_vat_rate", 0.08),
            compensation_fund_rate=data.get("compensation_fund_rate", 0.0010),
            electricity_tax_rate=data.get("electricity_tax_rate", 0.0010),
            vat_rate=data.get("vat_rate", 0.08),
            currency=data.get("currency", "EUR"),
            meter_has_gas=data.get("meter_has_gas", False),
            api_key=data.get("api_key", ""),
            energy_id=data.get("energy_id", ""),
            meters=data.get("meters", [
                {"id": "", "types": ["consumption"]}
            ]),
        )

    @classmethod
    def _migrate_feed_in_rates(cls, data: dict) -> list:
        """Build feed_in_rates list — migrate legacy single-mode fields if present."""
        if "feed_in_rates" in data and isinstance(data["feed_in_rates"], list):
            return data["feed_in_rates"]
        # Legacy migration: single feed_in_mode / feed_in_sensor_entity → rates[]
        mode = data.get("feed_in_mode", "")
        sensor_entity = data.get("feed_in_sensor_entity", "")
        if mode or sensor_entity:
            tariff = data.get("feed_in_tariff", 0.08)
            # Find production meters to assign the legacy config
            meters = data.get("meters", [])
            prod_meters = [m for m in meters if "production" in m.get("types", [])]
            if prod_meters:
                return [
                    {
                        "meter_id": m["id"],
                        "mode": mode or "fixed",
                        "tariff": tariff,
                        "sensor_entity": sensor_entity,
                    }
                    for m in prod_meters
                ]
        return []

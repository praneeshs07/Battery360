from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Dict, Any

VALID_CHEMISTRIES = ["NMC", "LFP", "NCA", "LCO", "LTO"]

class CellModel(BaseModel):
    id: str
    name: str
    manufacturer: str
    chemistry: str
    form_factor: str = "Cylindrical"
    nominal_voltage: float
    max_voltage: float
    min_voltage: float
    capacity_ah: float
    energy_wh: float
    internal_resistance_ohm: float
    internal_resistance_mohm: float
    max_charge_current_a: float
    max_continuous_discharge_current_a: float
    weight_g: float
    diameter_mm: Optional[float] = None
    length_mm: Optional[float] = None
    height_mm: Optional[float] = None
    width_mm: Optional[float] = None
    thickness_mm: Optional[float] = None
    specific_heat_cp: float = 1050.0  # J/(kg*K)
    thermal_conductivity: float = 1.2  # W/(m*K)
    entropic_coeff_mv_per_k: float = -0.15  # mV/K
    max_temp_c: float = 60.0
    thermal_runaway_temp_c: float = 140.0
    nominal_cycle_life: int = 1500
    estimated_cost_usd: float = 4.5
    continuous_c_rate: float = 2.0
    peak_c_rate: float = 4.0
    data_source: str = "Datasheet Verified"  # "Datasheet Verified" | "Illustrative Sample"
    datasheet_reference: Optional[str] = ""
    description: Optional[str] = ""
    is_preset: int = 0

class CellCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    manufacturer: str = Field(..., min_length=2, max_length=100)
    chemistry: str = Field(..., description="Must be NMC, LFP, NCA, LCO, or LTO")
    form_factor: str = Field(default="Cylindrical")
    nominal_voltage: float = Field(gt=0, le=6.0)
    max_voltage: float = Field(gt=0, le=6.5)
    min_voltage: float = Field(gt=0, le=5.0)
    capacity_ah: float = Field(gt=0)
    internal_resistance_ohm: float = Field(gt=0)
    max_charge_current_a: float = Field(gt=0)
    max_continuous_discharge_current_a: float = Field(gt=0)
    weight_g: float = Field(gt=0)
    diameter_mm: Optional[float] = None
    length_mm: Optional[float] = None
    specific_heat_cp: float = Field(default=1050.0, gt=100.0, le=3000.0)
    thermal_conductivity: float = Field(default=1.2, gt=0.05, le=50.0)
    data_source: str = Field(default="Illustrative Sample")
    datasheet_reference: Optional[str] = ""
    description: Optional[str] = ""

    @model_validator(mode="after")
    def validate_voltages_and_chemistry(self):
        # Validate chemistry
        chem_upper = self.chemistry.upper()
        matched = any(c == chem_upper or chem_upper.startswith(c) for c in VALID_CHEMISTRIES)
        if not matched:
            raise ValueError(f"Chemistry must be one of: {', '.join(VALID_CHEMISTRIES)}")
        
        # Validate voltage hierarchy
        if self.min_voltage >= self.nominal_voltage:
            raise ValueError(f"Minimum voltage ({self.min_voltage}V) must be strictly less than nominal voltage ({self.nominal_voltage}V)")
        if self.nominal_voltage >= self.max_voltage:
            raise ValueError(f"Nominal voltage ({self.nominal_voltage}V) must be strictly less than maximum voltage ({self.max_voltage}V)")
        return self

class CellUpdate(BaseModel):
    name: Optional[str] = None
    manufacturer: Optional[str] = None
    chemistry: Optional[str] = None
    form_factor: Optional[str] = None
    nominal_voltage: Optional[float] = None
    max_voltage: Optional[float] = None
    min_voltage: Optional[float] = None
    capacity_ah: Optional[float] = None
    internal_resistance_ohm: Optional[float] = None
    max_charge_current_a: Optional[float] = None
    max_continuous_discharge_current_a: Optional[float] = None
    weight_g: Optional[float] = None
    diameter_mm: Optional[float] = None
    length_mm: Optional[float] = None
    specific_heat_cp: Optional[float] = None
    thermal_conductivity: Optional[float] = None
    data_source: Optional[str] = None
    datasheet_reference: Optional[str] = None
    description: Optional[str] = None

class PackConfigRequest(BaseModel):
    name: str
    cell_id: str
    series_count: int = Field(gt=0, default=96)
    parallel_count: int = Field(gt=0, default=44)
    module_count: int = Field(gt=0, default=8)
    overhead_mass_factor: float = Field(ge=1.0, le=2.5, default=1.25)
    packaging_type: str = "Structural Enclosure"
    cooling_type: str = "Liquid Chiller Loop"
    target_application: str = "EV Passenger"
    notes: Optional[str] = ""

class PackMetrics(BaseModel):
    series_count: int
    parallel_count: int
    module_count: int
    total_cell_count: int
    nominal_voltage: float
    min_voltage: float
    max_voltage: float
    capacity_ah: float
    stored_energy_kwh: float
    cell_mass_kg: float
    total_pack_mass_kg: float
    gravimetric_energy_density_wh_kg: float
    volumetric_energy_density_wh_l: float
    internal_resistance_total_mohm: float
    continuous_discharge_current_a: float
    peak_discharge_current_a: float
    continuous_power_kw: float
    peak_power_kw: float
    estimated_cell_cost_usd: float
    estimated_total_pack_cost_usd: float
    cells_per_module: int

class ElectricalSimRequest(BaseModel):
    cell_id: Optional[str] = None
    series_count: int = 96
    parallel_count: int = 44
    mode: str = "discharge_cc"
    c_rate: float = 1.0
    constant_power_kw: Optional[float] = 50.0
    drive_cycle_name: Optional[str] = "WLTP_Class_3"
    initial_soc: float = 1.0
    target_soc: float = 0.05
    ambient_temp_c: float = 25.0
    time_step_sec: float = 1.0
    max_sim_time_sec: float = 7200.0

class ThermalSimRequest(BaseModel):
    cell_id: Optional[str] = None
    series_count: int = 96
    parallel_count: int = 44
    discharge_c_rate: float = 2.0
    initial_temp_c: float = 25.0
    ambient_temp_c: float = 25.0
    cooling_mode: str = "liquid_chiller"
    coolant_temp_c: float = 20.0
    flow_rate_lpm: float = 12.0
    sim_duration_sec: float = 1800.0

class SafetyAuditRequest(BaseModel):
    cell_id: str
    series_count: int = 96
    parallel_count: int = 44
    operating_temp_c: float = 35.0
    ambient_temp_c: float = 25.0
    max_discharge_c_rate: float = 3.0

class OptimizerRequest(BaseModel):
    target_voltage_v: float = 400.0
    target_energy_kwh: float = 75.0
    max_allowed_weight_kg: Optional[float] = 550.0
    max_allowed_volume_l: Optional[float] = 350.0
    application_preset: str = "EV Passenger"
    prioritize: str = "balanced"

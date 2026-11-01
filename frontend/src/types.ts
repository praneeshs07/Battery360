export interface Cell {
  id: string;
  name: string;
  manufacturer: string;
  chemistry: string;
  form_factor: string;
  nominal_voltage: number;
  min_voltage: number;
  max_voltage: number;
  capacity_ah: number;
  energy_wh: number;
  internal_resistance_mohm: number;
  continuous_c_rate: number;
  peak_c_rate: number;
  weight_g: number;
  diameter_mm?: number | null;
  height_mm?: number | null;
  width_mm?: number | null;
  length_mm?: number | null;
  thickness_mm?: number | null;
  specific_heat_cp: number;
  thermal_conductivity: number;
  entropic_coeff_mv_per_k: number;
  max_temp_c: number;
  thermal_runaway_temp_c: number;
  nominal_cycle_life: number;
  estimated_cost_usd: number;
  description?: string;
  is_preset?: number;
}

export interface PackMetrics {
  series_count: number;
  parallel_count: number;
  module_count: number;
  total_cell_count: number;
  cells_per_module: number;
  nominal_voltage: number;
  min_voltage: number;
  max_voltage: number;
  capacity_ah: number;
  stored_energy_kwh: number;
  cell_mass_kg: number;
  total_pack_mass_kg: number;
  pack_volume_l: number;
  gravimetric_energy_density_wh_kg: number;
  volumetric_energy_density_wh_l: number;
  internal_resistance_total_mohm: number;
  continuous_discharge_current_a: number;
  peak_discharge_current_a: number;
  continuous_power_kw: number;
  peak_power_kw: number;
  estimated_cell_cost_usd: number;
  estimated_total_pack_cost_usd: number;
}

export interface PackConfiguration {
  id: string;
  name: string;
  cell_id: string;
  cell_name?: string;
  cell_chemistry?: string;
  series_count: number;
  parallel_count: number;
  module_count: number;
  overhead_mass_factor: number;
  packaging_type: string;
  cooling_type: string;
  target_application: string;
  notes?: string;
  created_at?: string;
  metrics?: PackMetrics;
}

export interface ElectricalSimResult {
  time_seconds: number[];
  terminal_voltage_v: number[];
  current_a: number[];
  soc_percent: number[];
  power_kw: number[];
  heat_loss_kw: number[];
  summary: {
    duration_minutes: number;
    final_soc_percent: number;
    delivered_energy_kwh: number;
    peak_current_a: number;
    peak_power_kw: number;
    total_heat_generated_mj: number;
    energy_efficiency_percent: number;
    final_voltage_v: number;
  };
}

export interface ThermalSimResult {
  time_seconds: number[];
  core_temperature_c: number[];
  surface_temperature_c: number[];
  joule_heat_generation_kw: number[];
  entropic_heat_generation_kw: number[];
  cooling_heat_dissipation_kw: number[];
  thermal_runaway_risk_index_percent: number[];
  summary: {
    max_core_temp_c: number;
    max_surface_temp_c: number;
    max_thermal_gradient_c: number;
    peak_heat_generation_kw: number;
    peak_heat_dissipated_kw: number;
    cooling_mode: string;
    status_label: string;
    thermal_risk_level: string;
    max_trri_percent: number;
    cooling_adequacy_score: number;
  };
}

export interface SafetyAuditResult {
  short_circuit: {
    peak_short_circuit_current_a: number;
    short_circuit_power_mw: number;
    adiabatic_i2t_action_integral_a2s: number;
    fuse_clearing_time_ms: number;
  };
  operating_envelope: {
    pack_voltage_range_v: string;
    continuous_c_headroom_percent: number;
    c_rate_status: string;
    thermal_headroom_c: number;
    runaway_onset_temp_c: number;
  };
  thermal_propagation: {
    chemistry: string;
    propagation_risk_level: string;
    recommended_barrier_thickness_mm: number;
    max_runaway_temperature_c: number;
    insulation_flammability_standard: string;
  };
  soh_projection: {
    cycles: number[];
    nominal_soh_percent: number[];
    operating_soh_percent: number[];
    projected_cycles_to_80_nominal: number;
    projected_cycles_to_80_operating: number;
  };
  safety_scorecard: {
    overall_safety_score: number;
    grade: string;
    thermal_score: number;
    c_rate_score: number;
    chemistry_score: number;
    short_circuit_score: number;
    engineering_recommendations: string[];
  };
}

export interface OptimizationCandidate {
  cell_id: string;
  cell_name: string;
  chemistry: string;
  form_factor: string;
  series_count: number;
  parallel_count: number;
  total_cells: number;
  pack_voltage_v: number;
  pack_energy_kwh: number;
  pack_mass_kg: number;
  pack_volume_l: number;
  gravimetric_wh_kg: number;
  volumetric_wh_l: number;
  continuous_power_kw: number;
  peak_power_kw: number;
  estimated_cost_usd: number;
  cost_per_kwh_usd: number;
  cycle_life: number;
  overall_score: number;
  radar_metrics: {
    energy_density: number;
    cost_efficiency: number;
    safety_durability: number;
    power_delivery: number;
    lightweight_score: number;
  };
  constraint_pass: boolean;
}

export interface OptimizationResult {
  target_specs: {
    target_voltage_v: number;
    target_energy_kwh: number;
    max_weight_kg: number | null;
    max_volume_l: number | null;
    application_preset: string;
    prioritize: string;
  };
  recommended_design: OptimizationCandidate | null;
  all_candidates: OptimizationCandidate[];
}

export interface BomItem {
  item: string;
  quantity: number;
  unit: string;
  unit_cost_usd: number;
  total_cost_usd: number;
  category: string;
}

export interface EngineeringReport {
  report_id: string;
  title: string;
  generated_at: string;
  executive_summary: {
    pack_configuration: string;
    selected_cell: string;
    nominal_voltage_v: number;
    stored_energy_kwh: number;
    gravimetric_energy_density_wh_kg: number;
    continuous_power_kw: number;
    total_pack_mass_kg: number;
    estimated_bom_cost_usd: number;
    cost_per_kwh_usd: number;
    safety_certification_status: string;
  };
  cell_datasheet: Record<string, any>;
  pack_specifications: PackMetrics;
  bill_of_materials: {
    items: BomItem[];
    total_bom_cost_usd: number;
    cell_cost_fraction_percent: number;
  };
  simulation_audit_notes: {
    electrical: Record<string, any>;
    thermal: Record<string, any>;
    safety: Record<string, any>;
  };
}

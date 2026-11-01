import numpy as np
from typing import Dict, Any, List

def simulate_thermal_pack(cell: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
    s_count = int(params.get("series_count", 96))
    p_count = int(params.get("parallel_count", 44))
    total_cells = s_count * p_count
    
    discharge_c = float(params.get("discharge_c_rate", 2.0))
    initial_t_c = float(params.get("initial_temp_c", 25.0))
    ambient_t_c = float(params.get("ambient_temp_c", 25.0))
    cooling_mode = params.get("cooling_mode", "liquid_chiller")
    coolant_t_c = float(params.get("coolant_temp_c", 20.0))
    flow_rate_lpm = float(params.get("flow_rate_lpm", 12.0))
    duration_s = float(params.get("sim_duration_sec", 1800.0))

    # Cell physical properties
    cell_mass_kg = cell["weight_g"] / 1000.0
    pack_cell_mass_kg = total_cells * cell_mass_kg
    cp = cell.get("specific_heat_cp", 1050.0)  # J/(kg*K)
    
    # Core heat capacity and surface thermal mass partition (75% core, 25% surface/can)
    c_core = pack_cell_mass_kg * cp * 0.75
    c_surf = pack_cell_mass_kg * cp * 0.25

    # Internal thermal resistance between core and cell skin
    k_th = cell.get("thermal_conductivity", 1.2)  # W/(m*K)
    r_cond_core_to_surf = 0.00045 / (k_th * (total_cells / 100.0))

    # Determine convective heat transfer coefficient h and effective area A
    # Estimate total pack surface area in contact with cooling medium
    area_m2 = 0.0035 * total_cells

    if cooling_mode == "natural_convection":
        h_conv = 12.0  # W/(m^2*K)
        t_sink_k = ambient_t_c + 273.15
    elif cooling_mode == "forced_air":
        h_conv = 55.0  # W/(m^2*K)
        t_sink_k = ambient_t_c + 273.15
    elif cooling_mode == "pcm":
        h_conv = 35.0
        t_sink_k = ambient_t_c + 273.15
    else:  # liquid_chiller
        # Scale heat transfer coefficient with coolant flow rate
        h_conv = 220.0 + (flow_rate_lpm * 8.5)
        t_sink_k = coolant_t_c + 273.15

    # Entropic coefficient dU/dT (V/K)
    du_dt = cell.get("entropic_coeff_mv_per_k", -0.15) / 1000.0  # Convert mV/K to V/K

    # Electrical parameters for pack
    r0_cell = cell.get("internal_resistance_mohm", 20.0) / 1000.0
    r0_pack = (s_count / p_count) * r0_cell + (s_count * 0.00008)
    pack_cap_ah = cell["capacity_ah"] * p_count
    current_a = discharge_c * pack_cap_ah  # Amperes

    # Thermal runaway onset temperature for chemistry
    t_runaway_c = cell.get("thermal_runaway_temp_c", 140.0)

    # State variables in Kelvin
    t_core_k = initial_t_c + 273.15
    t_surf_k = initial_t_c + 273.15

    dt = 2.0  # 2 second step
    steps = int(duration_s / dt)

    times: List[float] = []
    t_core_arr: List[float] = []
    t_surf_arr: List[float] = []
    q_joule_kw: List[float] = []
    q_entropic_kw: List[float] = []
    q_dissipated_kw: List[float] = []
    trri_arr: List[float] = []

    # Maximum temperature tracking
    max_core_t = initial_t_c
    max_surf_t = initial_t_c

    # Simulation loop using RK4/Euler integration
    for step in range(steps):
        t_sec = step * dt

        # Joulean heat generation (W): I^2 * R
        # Note: cell resistance increases at lower temperature and degrades slightly at extreme heat
        temp_factor = 1.0 + 0.0035 * ((t_core_k - 273.15) - 25.0)
        q_joule = (current_a ** 2) * (r0_pack * temp_factor)

        # Entropic reversible heat generation: I * T_core * (dU/dT)
        # Note: if dU/dT is negative (common for NMC), discharge yields positive heat
        q_entropic = -current_a * t_core_k * du_dt

        q_total_gen = q_joule + q_entropic

        # Conduction from core to surface
        q_conduction = (t_core_k - t_surf_k) / r_cond_core_to_surf

        # Heat dissipation to coolant/ambient
        q_dissipated = h_conv * area_m2 * (t_surf_k - t_sink_k)

        # Rate of temperature change (K/s)
        dt_core = (q_total_gen - q_conduction) / c_core
        dt_surf = (q_conduction - q_dissipated) / c_surf

        t_core_k += dt_core * dt
        t_surf_k += dt_surf * dt

        core_c = t_core_k - 273.15
        surf_c = t_surf_k - 273.15

        if core_c > max_core_t:
            max_core_t = core_c
        if surf_c > max_surf_t:
            max_surf_t = surf_c

        # Thermal Runaway Risk Index (0 - 100%)
        # Normal safe zone: < 45C (TRRI < 30%)
        # Warning zone: 45C - 60C (TRRI 30% - 65%)
        # Danger zone: > 60C
        denom = max(1.0, t_runaway_c - ambient_t_c)
        trri = min(100.0, max(0.0, ((core_c - ambient_t_c) / denom) * 100.0))

        # Downsample for frontend
        if step % max(1, steps // 200) == 0:
            times.append(round(t_sec, 1))
            t_core_arr.append(round(core_c, 2))
            t_surf_arr.append(round(surf_c, 2))
            q_joule_kw.append(round(q_joule / 1000.0, 3))
            q_entropic_kw.append(round(q_entropic / 1000.0, 3))
            q_dissipated_kw.append(round(q_dissipated / 1000.0, 3))
            trri_arr.append(round(trri, 1))

    # Thermal Status Diagnosis
    status_label = "Optimal"
    risk_level = "Low"
    if max_core_t > 70.0:
        status_label = "Severe Thermal Stress"
        risk_level = "Critical"
    elif max_core_t > 55.0:
        status_label = "Elevated Degradation Risk"
        risk_level = "Moderate"
    elif max_core_t > 45.0:
        status_label = "Adequate Cooling"
        risk_level = "Acceptable"

    return {
        "time_seconds": times,
        "core_temperature_c": t_core_arr,
        "surface_temperature_c": t_surf_arr,
        "joule_heat_generation_kw": q_joule_kw,
        "entropic_heat_generation_kw": q_entropic_kw,
        "cooling_heat_dissipation_kw": q_dissipated_kw,
        "thermal_runaway_risk_index_percent": trri_arr,
        "summary": {
            "max_core_temp_c": round(max_core_t, 2),
            "max_surface_temp_c": round(max_surf_t, 2),
            "max_thermal_gradient_c": round(max_core_t - max_surf_t, 2),
            "peak_heat_generation_kw": round(max(q_joule_kw, default=0) + max(q_entropic_kw, default=0), 2),
            "peak_heat_dissipated_kw": round(max(q_dissipated_kw, default=0), 2),
            "cooling_mode": cooling_mode,
            "status_label": status_label,
            "thermal_risk_level": risk_level,
            "max_trri_percent": round(max(trri_arr, default=0), 1),
            "cooling_adequacy_score": round(min(100.0, max(0.0, 100.0 - (max_core_t - 25.0) * 1.5)), 1)
        }
    }

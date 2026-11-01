import numpy as np
from typing import Dict, Any, List

def perform_safety_audit(cell: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
    s_count = int(params.get("series_count", 96))
    p_count = int(params.get("parallel_count", 44))
    op_temp_c = float(params.get("operating_temp_c", 35.0))
    ambient_temp_c = float(params.get("ambient_temp_c", 25.0))
    max_discharge_c = float(params.get("max_discharge_c_rate", 3.0))

    nom_v = s_count * cell["nominal_voltage"]
    max_v = s_count * cell["max_voltage"]
    min_v = s_count * cell["min_voltage"]
    pack_cap_ah = cell["capacity_ah"] * p_count

    # Internal Resistance
    r0_cell = cell.get("internal_resistance_mohm", 20.0) / 1000.0
    r0_pack = (s_count / p_count) * r0_cell + (s_count * 0.00008)
    
    # 1. Short Circuit Calculations
    # Assume 2 mOhm bolted short external impedance
    r_fault = 0.002
    r_total_short = r0_pack + r_fault
    peak_short_current_a = max_v / r_total_short
    short_circuit_power_mw = (max_v * peak_short_current_a) / 1000000.0
    
    # Pyro-fuse / Contactor blowout I2t requirement (assuming 15ms clearing time)
    clearing_time_ms = 15.0
    clearing_time_s = clearing_time_ms / 1000.0
    i2t_action_integral = (peak_short_current_a ** 2) * clearing_time_s

    # 2. C-Rate & Overcurrent Audit
    cell_cont_c = cell.get("continuous_c_rate", 2.0)
    cell_peak_c = cell.get("peak_c_rate", 4.0)

    cont_margin_pct = ((cell_cont_c - max_discharge_c) / cell_cont_c) * 100.0
    c_rate_status = "Safe" if max_discharge_c <= cell_cont_c else ("Caution (Peak Only)" if max_discharge_c <= cell_peak_c else "Severe Hazard")

    # 3. Thermal Runaway & Barrier Audit
    chem = cell.get("chemistry", "NMC").upper()
    t_runaway_onset = cell.get("thermal_runaway_temp_c", 140.0)

    # Required insulation thickness based on chemistry energy density and heat release rate
    if "LFP" in chem:
        propagation_risk = "Low"
        recommended_barrier_mm = 0.8
        max_runaway_temp_c = 350.0
        ul_flammability = "UL94 V-0 (Self-extinguishing)"
    elif "LTO" in chem:
        propagation_risk = "Negligible"
        recommended_barrier_mm = 0.5
        max_runaway_temp_c = 280.0
        ul_flammability = "Standard Industrial"
    elif "SOLID-STATE" in chem:
        propagation_risk = "Very Low"
        recommended_barrier_mm = 0.6
        max_runaway_temp_c = 300.0
        ul_flammability = "UL94 V-0"
    else:  # NMC / NCA
        propagation_risk = "High"
        recommended_barrier_mm = 1.8  # Aerogel or ceramic compression pads
        max_runaway_temp_c = 750.0
        ul_flammability = "UL94 V-0 + Intumescent Coating"

    # Thermal margin
    thermal_headroom_c = t_runaway_onset - op_temp_c

    # 4. SOH Cycle Life Degradation Modeling (Arrhenius law)
    cycles = np.linspace(0, 2500, 26)
    # Arrhenius parameters: Ea ~ 31.7 kJ/mol, R = 8.314 J/mol*K
    # Capacity loss increases at higher temperatures and higher C-rates
    temp_k_nominal = 25.0 + 273.15
    temp_k_op = op_temp_c + 273.15
    
    # Acceleration factor from temperature
    temp_accel = np.exp((31700.0 / 8.314) * (1.0 / temp_k_nominal - 1.0 / temp_k_op))
    c_rate_accel = (max_discharge_c / 1.0) ** 0.35

    nominal_cycles_arr = []
    operating_cycles_arr = []

    nominal_cycle_rating = cell.get("nominal_cycle_life", 1500)
    base_degrade_rate = 20.0 / (nominal_cycle_rating ** 0.52)  # 20% loss at end of life

    for c in cycles:
        loss_nom = base_degrade_rate * (c ** 0.52)
        loss_op = base_degrade_rate * temp_accel * c_rate_accel * (c ** 0.52)

        soh_nom = max(50.0, 100.0 - loss_nom)
        soh_op = max(40.0, 100.0 - loss_op)

        nominal_cycles_arr.append(round(soh_nom, 2))
        operating_cycles_arr.append(round(soh_op, 2))

    # Projected cycle life to 80% SOH (EV standard threshold)
    cycles_to_80_nom = int((20.0 / base_degrade_rate) ** (1.0 / 0.52))
    cycles_to_80_op = int((20.0 / (base_degrade_rate * temp_accel * c_rate_accel)) ** (1.0 / 0.52))

    # 5. Composite Safety Score Calculation (0 to 100)
    # Factors: thermal headroom (30%), short circuit energy rating (25%), C-rate margin (25%), chemistry stability (20%)
    s_thermal = min(30.0, max(0.0, (thermal_headroom_c / 100.0) * 30.0))
    s_crate = 25.0 if max_discharge_c <= cell_cont_c else (15.0 if max_discharge_c <= cell_peak_c else 5.0)
    s_chem = 20.0 if "LFP" in chem or "LTO" in chem or "SOLID" in chem else 14.0
    s_sc = 25.0 if peak_short_current_a < 15000.0 else (18.0 if peak_short_current_a < 35000.0 else 10.0)

    total_safety_score = round(s_thermal + s_crate + s_chem + s_sc, 1)

    grade = "A+"
    if total_safety_score < 60:
        grade = "D (High Risk)"
    elif total_safety_score < 72:
        grade = "C (Marginal)"
    elif total_safety_score < 82:
        grade = "B (Acceptable)"
    elif total_safety_score < 92:
        grade = "A (Robust)"

    recommendations = []
    if peak_short_current_a > 10000.0:
        recommendations.append(f"Install high-speed Pyro-Switch or Class T semiconductor fuse rated for minimum {int(i2t_action_integral)} A²s.")
    if thermal_headroom_c < 50.0:
        recommendations.append("Increase active liquid cooling flow rate to keep cell core temperature below 45°C.")
    if "NMC" in chem and s_count > 60:
        recommendations.append(f"Use {recommended_barrier_mm}mm Aerogel inter-cell insulation compression pads to prevent thermal propagation.")
    if max_discharge_c > cell_cont_c:
        recommendations.append(f"Discharge rate of {max_discharge_c}C exceeds continuous cell rating ({cell_cont_c}C); program BMS current derating timer.")

    return {
        "short_circuit": {
            "peak_short_circuit_current_a": round(peak_short_current_a, 1),
            "short_circuit_power_mw": round(short_circuit_power_mw, 2),
            "adiabatic_i2t_action_integral_a2s": round(i2t_action_integral, 1),
            "fuse_clearing_time_ms": clearing_time_ms
        },
        "operating_envelope": {
            "pack_voltage_range_v": f"{min_v:.1f}V - {max_v:.1f}V (Nominal: {nom_v:.1f}V)",
            "continuous_c_headroom_percent": round(cont_margin_pct, 1),
            "c_rate_status": c_rate_status,
            "thermal_headroom_c": round(thermal_headroom_c, 1),
            "runaway_onset_temp_c": t_runaway_onset
        },
        "thermal_propagation": {
            "chemistry": chem,
            "propagation_risk_level": propagation_risk,
            "recommended_barrier_thickness_mm": recommended_barrier_mm,
            "max_runaway_temperature_c": max_runaway_temp_c,
            "insulation_flammability_standard": ul_flammability
        },
        "soh_projection": {
            "cycles": [int(c) for c in cycles],
            "nominal_soh_percent": nominal_cycles_arr,
            "operating_soh_percent": operating_cycles_arr,
            "projected_cycles_to_80_nominal": cycles_to_80_nom,
            "projected_cycles_to_80_operating": cycles_to_80_op
        },
        "safety_scorecard": {
            "overall_safety_score": total_safety_score,
            "grade": grade,
            "thermal_score": round(s_thermal, 1),
            "c_rate_score": round(s_crate, 1),
            "chemistry_score": round(s_chem, 1),
            "short_circuit_score": round(s_sc, 1),
            "engineering_recommendations": recommendations
        }
    }

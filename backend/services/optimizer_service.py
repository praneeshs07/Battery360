import math
from typing import List, Dict, Any

def optimize_battery_design(cells: List[Dict[str, Any]], criteria: Dict[str, Any]) -> Dict[str, Any]:
    target_v = float(criteria.get("target_voltage_v", 400.0))
    target_kwh = float(criteria.get("target_energy_kwh", 75.0))
    max_weight_kg = float(criteria.get("max_allowed_weight_kg", 550.0)) if criteria.get("max_allowed_weight_kg") else None
    max_vol_l = float(criteria.get("max_allowed_volume_l", 350.0)) if criteria.get("max_allowed_volume_l") else None
    app_preset = criteria.get("application_preset", "EV Passenger")
    prioritize = criteria.get("prioritize", "balanced")

    # Weights configuration based on user prioritization
    weights = {
        "energy_density": 0.25,
        "cost": 0.20,
        "safety_cycle_life": 0.20,
        "power_compliance": 0.20,
        "weight_margin": 0.15
    }

    if prioritize == "energy_density":
        weights = {"energy_density": 0.45, "cost": 0.10, "safety_cycle_life": 0.15, "power_compliance": 0.15, "weight_margin": 0.15}
    elif prioritize == "low_cost":
        weights = {"energy_density": 0.15, "cost": 0.45, "safety_cycle_life": 0.20, "power_compliance": 0.10, "weight_margin": 0.10}
    elif prioritize == "safety_cycle_life":
        weights = {"energy_density": 0.15, "cost": 0.15, "safety_cycle_life": 0.45, "power_compliance": 0.15, "weight_margin": 0.10}
    elif prioritize == "peak_power":
        weights = {"energy_density": 0.15, "cost": 0.15, "safety_cycle_life": 0.15, "power_compliance": 0.40, "weight_margin": 0.15}

    candidate_results = []

    for cell in cells:
        v_nom = cell["nominal_voltage"]
        s_count = max(1, round(target_v / v_nom))
        
        cell_wh = cell["energy_wh"]
        total_cells_needed = (target_kwh * 1000.0) / cell_wh
        p_count = max(1, math.ceil(total_cells_needed / s_count))

        total_cells = s_count * p_count
        act_v = s_count * v_nom
        act_kwh = (total_cells * cell_wh) / 1000.0
        
        # Packaging overhead (1.25x cell mass for structural enclosure, busbars, thermal plates)
        overhead = 1.25
        cell_mass_kg = (total_cells * cell["weight_g"]) / 1000.0
        pack_mass_kg = cell_mass_kg * overhead

        # Volume estimation
        cell_vol_l = (pack_mass_kg / overhead) / 2.4
        pack_vol_l = cell_vol_l * 1.45

        gravimetric_wh_kg = (act_kwh * 1000.0) / pack_mass_kg
        volumetric_wh_l = (act_kwh * 1000.0) / pack_vol_l

        # Power
        pack_cap_ah = p_count * cell["capacity_ah"]
        cont_p_kw = (act_v * pack_cap_ah * cell.get("continuous_c_rate", 2.0)) / 1000.0
        peak_p_kw = (act_v * pack_cap_ah * cell.get("peak_c_rate", 4.0)) / 1000.0

        # Cost
        cell_cost = total_cells * cell.get("estimated_cost_usd", 4.5)
        pack_cost = cell_cost * 1.35
        cost_per_kwh = pack_cost / act_kwh if act_kwh > 0 else 999.0

        # Check hard constraints
        weight_violation = max_weight_kg is not None and pack_mass_kg > max_weight_kg * 1.15
        vol_violation = max_vol_l is not None and pack_vol_l > max_vol_l * 1.20

        # Sub-scores (normalized 0 to 100)
        s_energy = min(100.0, (gravimetric_wh_kg / 260.0) * 100.0)
        s_cost = min(100.0, max(0.0, (1.0 - (cost_per_kwh - 80.0) / 200.0) * 100.0))
        
        cycle_life = cell.get("nominal_cycle_life", 1500)
        chem = cell.get("chemistry", "")
        chem_bonus = 25.0 if "LFP" in chem or "LTO" in chem or "SOLID" in chem else 0.0
        s_safety = min(100.0, (cycle_life / 3000.0) * 75.0 + chem_bonus)

        s_power = min(100.0, (peak_p_kw / (target_kwh * 4.0)) * 100.0)
        
        weight_margin_score = 100.0
        if max_weight_kg:
            weight_margin_score = min(100.0, max(0.0, ((max_weight_kg - pack_mass_kg) / max_weight_kg + 0.5) * 100.0))

        composite_score = (
            weights["energy_density"] * s_energy +
            weights["cost"] * s_cost +
            weights["safety_cycle_life"] * s_safety +
            weights["power_compliance"] * s_power +
            weights["weight_margin"] * weight_margin_score
        )

        if weight_violation:
            composite_score *= 0.6
        if vol_violation:
            composite_score *= 0.7

        candidate_results.append({
            "cell_id": cell["id"],
            "cell_name": cell["name"],
            "chemistry": cell["chemistry"],
            "form_factor": cell["form_factor"],
            "series_count": s_count,
            "parallel_count": p_count,
            "total_cells": total_cells,
            "pack_voltage_v": round(act_v, 1),
            "pack_energy_kwh": round(act_kwh, 2),
            "pack_mass_kg": round(pack_mass_kg, 1),
            "pack_volume_l": round(pack_vol_l, 1),
            "gravimetric_wh_kg": round(gravimetric_wh_kg, 1),
            "volumetric_wh_l": round(volumetric_wh_l, 1),
            "continuous_power_kw": round(cont_p_kw, 1),
            "peak_power_kw": round(peak_p_kw, 1),
            "estimated_cost_usd": round(pack_cost, 0),
            "cost_per_kwh_usd": round(cost_per_kwh, 1),
            "cycle_life": cycle_life,
            "overall_score": round(composite_score, 1),
            "radar_metrics": {
                "energy_density": round(s_energy, 1),
                "cost_efficiency": round(s_cost, 1),
                "safety_durability": round(s_safety, 1),
                "power_delivery": round(s_power, 1),
                "lightweight_score": round(weight_margin_score, 1)
            },
            "constraint_pass": not (weight_violation or vol_violation)
        })

    # Sort descending by overall_score
    candidate_results.sort(key=lambda x: x["overall_score"], reverse=True)

    recommended = candidate_results[0] if candidate_results else None

    return {
        "target_specs": {
            "target_voltage_v": target_v,
            "target_energy_kwh": target_kwh,
            "max_weight_kg": max_weight_kg,
            "max_volume_l": max_vol_l,
            "application_preset": app_preset,
            "prioritize": prioritize
        },
        "recommended_design": recommended,
        "all_candidates": candidate_results
    }

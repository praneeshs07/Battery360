import math
from typing import Dict, Any

def calculate_pack_metrics(cell: Dict[str, Any], s_count: int, p_count: int, module_count: int, overhead_factor: float = 1.25) -> Dict[str, Any]:
    total_cells = s_count * p_count
    nom_v = s_count * cell["nominal_voltage"]
    min_v = s_count * cell["min_voltage"]
    max_v = s_count * cell["max_voltage"]
    
    capacity_ah = p_count * cell["capacity_ah"]
    energy_wh = nom_v * capacity_ah
    energy_kwh = energy_wh / 1000.0

    # Total cell mass and pack mass
    cell_mass_kg = (total_cells * cell["weight_g"]) / 1000.0
    total_pack_mass_kg = cell_mass_kg * overhead_factor

    # Volume calculation
    cell_vol_l = 0.0
    if cell.get("diameter_mm") and cell.get("height_mm"):
        r = (cell["diameter_mm"] / 2.0) / 10.0  # cm
        h = cell["height_mm"] / 10.0  # cm
        vol_cm3 = math.pi * (r ** 2) * h
        cell_vol_l = (vol_cm3 * total_cells) / 1000.0
    elif cell.get("length_mm") and cell.get("width_mm") and cell.get("height_mm"):
        l = cell["length_mm"] / 10.0
        w = cell["width_mm"] / 10.0
        h = cell["height_mm"] / 10.0
        vol_cm3 = l * w * h
        cell_vol_l = (vol_cm3 * total_cells) / 1000.0
    elif cell.get("length_mm") and cell.get("width_mm") and cell.get("thickness_mm"):
        l = cell["length_mm"] / 10.0
        w = cell["width_mm"] / 10.0
        t = cell["thickness_mm"] / 10.0
        vol_cm3 = l * w * t
        cell_vol_l = (vol_cm3 * total_cells) / 1000.0
    else:
        # Approximate from density ~ 2.4 kg/L
        cell_vol_l = cell_mass_kg / 2.4

    # Pack enclosure volume estimate (structural factor ~ 1.45x cell volume)
    pack_vol_l = cell_vol_l * 1.45

    gravimetric_wh_kg = energy_wh / total_pack_mass_kg if total_pack_mass_kg > 0 else 0.0
    volumetric_wh_l = energy_wh / pack_vol_l if pack_vol_l > 0 else 0.0

    # Internal Resistance
    cell_r_mohm = cell.get("internal_resistance_mohm", 20.0)
    # Pack R = (S / P) * R_cell + busbar resistance estimate
    busbar_resistance_mohm = (s_count * 0.08)  # ~0.08 mOhm per series junction
    internal_resistance_mohm = (s_count / p_count) * cell_r_mohm + busbar_resistance_mohm

    # Current limits
    cont_current_a = p_count * cell["capacity_ah"] * cell.get("continuous_c_rate", 2.0)
    peak_current_a = p_count * cell["capacity_ah"] * cell.get("peak_c_rate", 4.0)

    # Power (kW)
    cont_power_kw = (nom_v * cont_current_a) / 1000.0
    peak_power_kw = (nom_v * peak_current_a) / 1000.0

    # Cost
    cell_cost = total_cells * cell.get("estimated_cost_usd", 4.5)
    # Pack level cost includes BMS, cooling plate, contactors, casing (~ 1.35x cell cost)
    pack_cost = cell_cost * 1.35

    cells_per_mod = total_cells // module_count if module_count > 0 else total_cells

    return {
        "series_count": s_count,
        "parallel_count": p_count,
        "module_count": module_count,
        "total_cell_count": total_cells,
        "cells_per_module": cells_per_mod,
        "nominal_voltage": round(nom_v, 2),
        "min_voltage": round(min_v, 2),
        "max_voltage": round(max_v, 2),
        "capacity_ah": round(capacity_ah, 2),
        "stored_energy_kwh": round(energy_kwh, 3),
        "cell_mass_kg": round(cell_mass_kg, 2),
        "total_pack_mass_kg": round(total_pack_mass_kg, 2),
        "pack_volume_l": round(pack_vol_l, 2),
        "gravimetric_energy_density_wh_kg": round(gravimetric_wh_kg, 1),
        "volumetric_energy_density_wh_l": round(volumetric_wh_l, 1),
        "internal_resistance_total_mohm": round(internal_resistance_mohm, 2),
        "continuous_discharge_current_a": round(cont_current_a, 1),
        "peak_discharge_current_a": round(peak_current_a, 1),
        "continuous_power_kw": round(cont_power_kw, 1),
        "peak_power_kw": round(peak_power_kw, 1),
        "estimated_cell_cost_usd": round(cell_cost, 2),
        "estimated_total_pack_cost_usd": round(pack_cost, 2),
    }

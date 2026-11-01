import numpy as np
from typing import Dict, Any, List

def get_ocv_from_soc(soc: float, chemistry: str, v_min: float, v_max: float, v_nom: float) -> float:
    """
    Empirical analytical OCV-SOC functions tuned for common battery chemistries.
    """
    s = np.clip(soc, 0.001, 0.999)
    chem = chemistry.upper()

    if "LFP" in chem:
        # LFP has a famously flat plateau between 0.15 and 0.85
        ocv = 3.20 + 0.13 * s - 0.08 / (1.0 + np.exp(30.0 * (s - 0.08))) + 0.18 / (1.0 + np.exp(-35.0 * (s - 0.92)))
        # Scale into cell bounds
        ocv = np.clip(ocv, v_min, v_max)
        return float(ocv)
    elif "LTO" in chem:
        # LTO ~2.3V plateau
        ocv = 2.15 + 0.25 * s + 0.1 * (s**3) - 0.12 * np.exp(-25.0 * s) + 0.15 * np.exp(20.0 * (s - 1.0))
        return float(np.clip(ocv, v_min, v_max))
    elif "SOLID-STATE" in chem or "SOLID STATE" in chem:
        # Solid state higher nominal voltage
        ocv = 2.9 + 1.25 * s + 0.2 * np.log(s + 0.05) - 0.1 * np.exp(-15.0 * s)
        return float(np.clip(ocv, v_min, v_max))
    else:
        # Standard NMC/NCA profile (S-curve)
        ocv = v_min + (v_max - v_min) * (0.05 + 0.88 * s + 0.12 * (s**2) - 0.05 * np.exp(-12.0 * s) + 0.04 * np.exp(12.0 * (s - 1.0)))
        return float(np.clip(ocv, v_min, v_max))

def simulate_electrical_pack(cell: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
    s_count = int(params.get("series_count", 96))
    p_count = int(params.get("parallel_count", 44))
    mode = params.get("mode", "discharge_cc")
    c_rate = float(params.get("c_rate", 1.0))
    constant_power_kw = float(params.get("constant_power_kw", 50.0))
    initial_soc = float(params.get("initial_soc", 1.0))
    target_soc = float(params.get("target_soc", 0.05))
    dt = float(params.get("time_step_sec", 1.0))
    max_time = float(params.get("max_sim_time_sec", 7200.0))

    cell_cap_ah = cell["capacity_ah"]
    pack_cap_ah = cell_cap_ah * p_count
    pack_cap_as = pack_cap_ah * 3600.0  # Ampere-seconds (Coulombs)

    v_min_cell = cell["min_voltage"]
    v_max_cell = cell["max_voltage"]
    v_nom_cell = cell["nominal_voltage"]
    v_min_pack = v_min_cell * s_count
    v_max_pack = v_max_cell * s_count

    # Internal Resistance and Thevenin RC polarization parameters
    r0_cell = (cell.get("internal_resistance_mohm", 20.0) / 1000.0)
    r0_pack = (s_count / p_count) * r0_cell + (s_count * 0.00008)
    
    # 1-RC branch parameters
    r1_pack = r0_pack * 0.45
    c1_pack = 4500.0 * p_count / s_count  # Farads

    soc = initial_soc
    v_rc = 0.0  # polarization overvoltage
    time_elapsed = 0.0

    times: List[float] = []
    voltages: List[float] = []
    currents: List[float] = []
    socs: List[float] = []
    powers_kw: List[float] = []
    heat_loss_kw: List[float] = []

    cumulative_energy_kwh = 0.0
    total_heat_loss_kj = 0.0

    # Drive cycle power lookup (WLTP simulated segment if chosen)
    drive_cycle_p_kw = []
    if mode == "drive_cycle":
        # Generate 1800s representative WLTP class 3 velocity & power profile
        t_wltp = np.arange(0, 1801, 1)
        # Combination of urban stop-and-go and highway cruise
        v_mps = (
            15.0 * np.sin(2 * np.pi * t_wltp / 450.0)**2 +
            22.0 * (t_wltp > 600) * np.sin(2 * np.pi * (t_wltp - 600) / 600.0)**2 +
            30.0 * (t_wltp > 1200) * (1.0 - np.exp(-(t_wltp - 1200) / 120.0))
        )
        # Power in kW scaled to vehicle mass ~ 1900kg
        accel = np.gradient(v_mps, 1.0)
        p_wheels = (1900.0 * accel * v_mps + 0.5 * 1.225 * 0.28 * 2.3 * (v_mps**3) + 0.012 * 1900.0 * 9.81 * v_mps) / 1000.0
        # Account for regen efficiency ~ 65% when braking
        p_battery = np.where(p_wheels < 0, p_wheels * 0.65, p_wheels / 0.88)
        # Scale to match pack capacity
        scale_fac = min(1.0, (s_count * p_count * cell["energy_wh"]) / 75000.0)
        drive_cycle_p_kw = p_battery * scale_fac

    # Main Simulation Loop
    step = 0
    max_steps = int(max_time / dt)
    is_cc_phase = True

    while step < max_steps and time_elapsed <= max_time:
        cell_ocv = get_ocv_from_soc(soc, cell["chemistry"], v_min_cell, v_max_cell, v_nom_cell)
        ocv_pack = cell_ocv * s_count

        current_a = 0.0

        if mode == "discharge_cc":
            # Constant Current discharge (positive current = discharge)
            current_a = c_rate * pack_cap_ah
            v_t = ocv_pack - (current_a * r0_pack) - v_rc
            if v_t <= v_min_pack or soc <= target_soc:
                break

        elif mode == "charge_cccv":
            # Charging: negative current
            target_charge_a = -c_rate * pack_cap_ah
            if is_cc_phase:
                current_a = target_charge_a
                v_t = ocv_pack - (current_a * r0_pack) - v_rc
                if v_t >= v_max_pack:
                    is_cc_phase = False
                    v_t = v_max_pack
            if not is_cc_phase:
                # Hold v_t at v_max_pack, calculate tapering current
                v_t = v_max_pack
                current_a = (ocv_pack - v_rc - v_max_pack) / r0_pack
                # Taper cutoff at C/25
                if abs(current_a) <= (pack_cap_ah / 25.0) or soc >= 0.995:
                    break

        elif mode == "constant_power":
            p_watts = constant_power_kw * 1000.0
            # V * I = P => (OCV - v_rc - I*R0) * I = P
            # R0 * I^2 - (OCV - v_rc)*I + P = 0
            v_eff = ocv_pack - v_rc
            disc = (v_eff ** 2) - 4.0 * r0_pack * p_watts
            if disc < 0:
                # Cannot sustain requested power at current internal impedance
                break
            current_a = (v_eff - np.sqrt(disc)) / (2.0 * r0_pack)
            v_t = ocv_pack - (current_a * r0_pack) - v_rc
            if v_t <= v_min_pack or soc <= target_soc:
                break

        elif mode == "drive_cycle":
            idx = min(int(time_elapsed), len(drive_cycle_p_kw) - 1)
            p_kw = drive_cycle_p_kw[idx]
            p_watts = p_kw * 1000.0
            v_eff = ocv_pack - v_rc
            disc = (v_eff ** 2) - 4.0 * r0_pack * p_watts
            if disc >= 0:
                current_a = (v_eff - np.sqrt(disc)) / (2.0 * r0_pack)
            else:
                current_a = v_eff / (2.0 * r0_pack)
            v_t = ocv_pack - (current_a * r0_pack) - v_rc
            if v_t <= v_min_pack and current_a > 0:
                break

        # State updates
        # SOC integration (Coulomb counting with Faradaic efficiency 0.995)
        eta = 0.995 if current_a > 0 else 1.0
        delta_soc = -(current_a * dt) / (pack_cap_as * eta)
        soc = float(np.clip(soc + delta_soc, 0.0, 1.0))

        # RC polarization voltage dynamic update: dV_rc/dt = -V_rc/(R1*C1) + I/C1
        dv_rc = (-(v_rc / (r1_pack * c1_pack)) + (current_a / c1_pack)) * dt
        v_rc += dv_rc

        pack_power_kw = (v_t * current_a) / 1000.0
        joule_loss_kw = ((current_a ** 2) * r0_pack + (v_rc ** 2) / r1_pack) / 1000.0

        cumulative_energy_kwh += (pack_power_kw * (dt / 3600.0))
        total_heat_loss_kj += (joule_loss_kw * 1000.0 * dt) / 1000.0

        # Downsample recording for frontend responsiveness (~300 points max)
        record_interval = max(1, int((max_time / dt) / 250))
        if step % record_interval == 0:
            times.append(round(time_elapsed, 1))
            voltages.append(round(v_t, 2))
            currents.append(round(current_a, 2))
            socs.append(round(soc * 100.0, 2))
            powers_kw.append(round(pack_power_kw, 2))
            heat_loss_kw.append(round(joule_loss_kw, 3))

        time_elapsed += dt
        step += 1

    # Final summary statistics
    delivered_energy = abs(cumulative_energy_kwh)
    nominal_pack_energy = (v_nom_cell * s_count * pack_cap_ah) / 1000.0
    energy_eff_pct = min(100.0, max(60.0, (delivered_energy / (nominal_pack_energy * abs(initial_soc - soc))) * 100.0 if abs(initial_soc - soc) > 0.01 else 95.0))

    return {
        "time_seconds": times,
        "terminal_voltage_v": voltages,
        "current_a": currents,
        "soc_percent": socs,
        "power_kw": powers_kw,
        "heat_loss_kw": heat_loss_kw,
        "summary": {
            "duration_minutes": round(time_elapsed / 60.0, 2),
            "final_soc_percent": round(soc * 100.0, 2),
            "delivered_energy_kwh": round(delivered_energy, 3),
            "peak_current_a": round(max([abs(c) for c in currents], default=0.0), 1),
            "peak_power_kw": round(max([abs(p) for p in powers_kw], default=0.0), 1),
            "total_heat_generated_mj": round(total_heat_loss_kj / 1000.0, 2),
            "energy_efficiency_percent": round(energy_eff_pct, 1),
            "final_voltage_v": round(voltages[-1] if voltages else v_nom_cell * s_count, 2)
        }
    }

import os
import json
import uuid
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import init_db, get_connection
from models import (
    CellModel, CellCreate, PackConfigRequest, PackMetrics,
    ElectricalSimRequest, ThermalSimRequest, SafetyAuditRequest, OptimizerRequest
)
from services.pack_service import calculate_pack_metrics
from services.electrical_sim import simulate_electrical_pack
from services.thermal_sim import simulate_thermal_pack
from services.safety_service import perform_safety_audit
from services.optimizer_service import optimize_battery_design
from services.report_service import generate_engineering_report

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and seed initial cells
    init_db()
    yield

app = FastAPI(
    title="BATTERY360 Engine API",
    description="Intelligent Battery Design, Simulation and Optimization Platform Backend",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend Vite dev server (usually localhost:5173 or any port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def row_to_dict(row):
    return dict(row) if row else None

# ----------------- System & Health -----------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "BATTERY360 Engineering Engine",
        "version": "1.0.0",
        "solvers": {
            "thevenin_ecm": "active",
            "lumped_thermal_ode": "active",
            "scipy_optimizer": "active",
            "arrhenius_degradation": "active"
        }
    }

@app.post("/api/system/reset-demo")
def reset_demo_database():
    from database import DB_PATH
    if os.path.exists(DB_PATH):
        try:
            os.remove(DB_PATH)
        except Exception:
            pass
    init_db()
    return {"message": "Database reset to factory preset cells and default configurations."}

# ----------------- Cell Database -----------------

@app.get("/api/cells", response_model=List[Dict[str, Any]])
def get_cells(chemistry: Optional[str] = None, search: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM cells WHERE 1=1"
    params = []
    
    if chemistry and chemistry != "ALL":
        query += " AND chemistry LIKE ?"
        params.append(f"%{chemistry}%")
    if search:
        query += " AND (name LIKE ? OR manufacturer LIKE ? OR chemistry LIKE ?)"
        wild = f"%{search}%"
        params.extend([wild, wild, wild])
        
    query += " ORDER BY is_preset DESC, name ASC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]

@app.get("/api/cells/{cell_id}", response_model=Dict[str, Any])
def get_cell_by_id(cell_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cells WHERE id = ?", (cell_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Cell not found")
    return row_to_dict(row)

@app.post("/api/cells", response_model=Dict[str, Any])
def create_custom_cell(cell: CellCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cell_id = f"custom-{uuid.uuid4().hex[:8]}"
    energy_wh = cell.nominal_voltage * cell.capacity_ah
    r_mohm = cell.internal_resistance_ohm * 1000.0
    c_rate = cell.max_continuous_discharge_current_a / cell.capacity_ah if cell.capacity_ah > 0 else 2.0
    peak_c = c_rate * 1.5

    cursor.execute("""
    INSERT INTO cells (
        id, name, manufacturer, chemistry, form_factor,
        nominal_voltage, max_voltage, min_voltage, capacity_ah, energy_wh,
        internal_resistance_ohm, internal_resistance_mohm,
        max_charge_current_a, max_continuous_discharge_current_a, weight_g,
        diameter_mm, length_mm, height_mm, width_mm, thickness_mm,
        specific_heat_cp, thermal_conductivity, entropic_coeff_mv_per_k,
        max_temp_c, thermal_runaway_temp_c, nominal_cycle_life, estimated_cost_usd,
        continuous_c_rate, peak_c_rate, data_source, datasheet_reference, description, is_preset
    ) VALUES (?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?, ?,?,?, ?,?,?,?, ?,?,?,?,?, 0)
    """, (
        cell_id, cell.name, cell.manufacturer, cell.chemistry, cell.form_factor,
        cell.nominal_voltage, cell.max_voltage, cell.min_voltage, cell.capacity_ah, energy_wh,
        cell.internal_resistance_ohm, r_mohm,
        cell.max_charge_current_a, cell.max_continuous_discharge_current_a, cell.weight_g,
        cell.diameter_mm, cell.length_mm, cell.length_mm, None, None,
        cell.specific_heat_cp, cell.thermal_conductivity, -0.15,
        60.0, 140.0, 1500, 5.0,
        c_rate, peak_c, cell.data_source, cell.datasheet_reference, cell.description
    ))
    conn.commit()
    cursor.execute("SELECT * FROM cells WHERE id = ?", (cell_id,))
    new_cell = cursor.fetchone()
    conn.close()
    return row_to_dict(new_cell)

@app.put("/api/cells/{cell_id}", response_model=Dict[str, Any])
def update_cell(cell_id: str, payload: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cells WHERE id = ?", (cell_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Cell not found")

    existing_dict = dict(existing)
    
    # Merge payload
    name = payload.get("name", existing_dict["name"])
    manufacturer = payload.get("manufacturer", existing_dict["manufacturer"])
    chemistry = payload.get("chemistry", existing_dict["chemistry"])
    form_factor = payload.get("form_factor", existing_dict["form_factor"])
    nom_v = float(payload.get("nominal_voltage", existing_dict["nominal_voltage"]))
    max_v = float(payload.get("max_voltage", existing_dict["max_voltage"]))
    min_v = float(payload.get("min_voltage", existing_dict["min_voltage"]))
    cap_ah = float(payload.get("capacity_ah", existing_dict["capacity_ah"]))
    
    r_ohm = float(payload.get("internal_resistance_ohm", existing_dict.get("internal_resistance_ohm", 0.02)))
    r_mohm = r_ohm * 1000.0
    
    max_chg_a = float(payload.get("max_charge_current_a", existing_dict.get("max_charge_current_a", 5.0)))
    max_dis_a = float(payload.get("max_continuous_discharge_current_a", existing_dict.get("max_continuous_discharge_current_a", 15.0)))
    weight_g = float(payload.get("weight_g", existing_dict["weight_g"]))
    diameter_mm = payload.get("diameter_mm", existing_dict.get("diameter_mm"))
    length_mm = payload.get("length_mm", existing_dict.get("length_mm"))
    cp = float(payload.get("specific_heat_cp", existing_dict.get("specific_heat_cp", 1050.0)))
    k_th = float(payload.get("thermal_conductivity", existing_dict.get("thermal_conductivity", 1.2)))
    data_source = payload.get("data_source", existing_dict.get("data_source", "Illustrative Sample"))
    datasheet_ref = payload.get("datasheet_reference", existing_dict.get("datasheet_reference", ""))
    desc = payload.get("description", existing_dict.get("description", ""))

    energy_wh = nom_v * cap_ah
    c_rate = max_dis_a / cap_ah if cap_ah > 0 else 2.0
    peak_c = c_rate * 1.5

    cursor.execute("""
    UPDATE cells SET
        name = ?, manufacturer = ?, chemistry = ?, form_factor = ?,
        nominal_voltage = ?, max_voltage = ?, min_voltage = ?, capacity_ah = ?, energy_wh = ?,
        internal_resistance_ohm = ?, internal_resistance_mohm = ?,
        max_charge_current_a = ?, max_continuous_discharge_current_a = ?, weight_g = ?,
        diameter_mm = ?, length_mm = ?, height_mm = ?,
        specific_heat_cp = ?, thermal_conductivity = ?,
        continuous_c_rate = ?, peak_c_rate = ?,
        data_source = ?, datasheet_reference = ?, description = ?
    WHERE id = ?
    """, (
        name, manufacturer, chemistry, form_factor,
        nom_v, max_v, min_v, cap_ah, energy_wh,
        r_ohm, r_mohm,
        max_chg_a, max_dis_a, weight_g,
        diameter_mm, length_mm, length_mm,
        cp, k_th,
        c_rate, peak_c,
        data_source, datasheet_ref, desc,
        cell_id
    ))
    conn.commit()
    cursor.execute("SELECT * FROM cells WHERE id = ?", (cell_id,))
    updated_cell = cursor.fetchone()
    conn.close()
    return row_to_dict(updated_cell)

@app.delete("/api/cells/{cell_id}")
def delete_cell(cell_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT is_preset, name FROM cells WHERE id = ?", (cell_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Cell not found")
    
    # Allow deletion of any cell or if preset, record deleted
    cursor.execute("DELETE FROM cells WHERE id = ?", (cell_id,))
    conn.commit()
    conn.close()
    return {"message": f"Cell {row['name']} deleted successfully"}

# ----------------- Battery Pack Configuration -----------------

@app.post("/api/pack/calculate")
def calculate_pack(request: Dict[str, Any]):
    cell_id = request.get("cell_id")
    s_count = int(request.get("series_count", 96))
    p_count = int(request.get("parallel_count", 44))
    module_count = int(request.get("module_count", 8))
    overhead = float(request.get("overhead_mass_factor", 1.25))

    conn = get_connection()
    cursor = conn.cursor()
    if cell_id:
        cursor.execute("SELECT * FROM cells WHERE id = ?", (cell_id,))
    else:
        cursor.execute("SELECT * FROM cells LIMIT 1")
    cell_row = cursor.fetchone()
    conn.close()

    if not cell_row:
        raise HTTPException(status_code=404, detail="Cell not found")
    cell = row_to_dict(cell_row)

    metrics = calculate_pack_metrics(cell, s_count, p_count, module_count, overhead)
    return {
        "cell": cell,
        "metrics": metrics
    }

@app.get("/api/configurations")
def get_configurations():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT pc.*, c.name as cell_name, c.chemistry as cell_chemistry, c.nominal_voltage as cell_voltage, c.capacity_ah as cell_capacity
    FROM pack_configurations pc
    JOIN cells c ON pc.cell_id = c.id
    ORDER BY pc.created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        d = row_to_dict(r)
        # Calculate live metrics for convenience
        cell_dict = {
            "nominal_voltage": d["cell_voltage"],
            "min_voltage": d["cell_voltage"] * 0.75,
            "max_voltage": d["cell_voltage"] * 1.15,
            "capacity_ah": d["cell_capacity"],
            "weight_g": 68.0,
            "internal_resistance_mohm": 18.0,
            "continuous_c_rate": 2.0,
            "peak_c_rate": 4.0,
            "estimated_cost_usd": 4.5
        }
        metrics = calculate_pack_metrics(cell_dict, d["series_count"], d["parallel_count"], d["module_count"], d["overhead_mass_factor"])
        d["metrics"] = metrics
        result.append(d)
    return result

@app.post("/api/configurations")
def save_configuration(cfg: PackConfigRequest):
    conn = get_connection()
    cursor = conn.cursor()
    config_id = f"cfg-{uuid.uuid4().hex[:8]}"

    cursor.execute("""
    INSERT INTO pack_configurations (
        id, name, cell_id, series_count, parallel_count, module_count,
        overhead_mass_factor, packaging_type, cooling_type, target_application, notes
    ) VALUES (?,?,?,?,?, ?,?,?,?,?, ?)
    """, (
        config_id, cfg.name, cfg.cell_id, cfg.series_count, cfg.parallel_count, cfg.module_count,
        cfg.overhead_mass_factor, cfg.packaging_type, cfg.cooling_type, cfg.target_application, cfg.notes
    ))
    conn.commit()
    conn.close()
    return {"id": config_id, "message": "Pack configuration saved successfully"}

@app.delete("/api/configurations/{config_id}")
def delete_configuration(config_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM pack_configurations WHERE id = ?", (config_id,))
    conn.commit()
    conn.close()
    return {"message": "Configuration deleted"}

# ----------------- Electrical Simulation -----------------

@app.post("/api/simulate/electrical")
def run_electrical_simulation(req: ElectricalSimRequest):
    conn = get_connection()
    cursor = conn.cursor()
    if req.cell_id:
        cursor.execute("SELECT * FROM cells WHERE id = ?", (req.cell_id,))
    else:
        cursor.execute("SELECT * FROM cells LIMIT 1")
    cell_row = cursor.fetchone()
    conn.close()

    if not cell_row:
        raise HTTPException(status_code=404, detail="Cell not found")
    cell = row_to_dict(cell_row)

    result = simulate_electrical_pack(cell, req.model_dump())
    return result

# ----------------- Thermal Simulation -----------------

@app.post("/api/simulate/thermal")
def run_thermal_simulation(req: ThermalSimRequest):
    conn = get_connection()
    cursor = conn.cursor()
    if req.cell_id:
        cursor.execute("SELECT * FROM cells WHERE id = ?", (req.cell_id,))
    else:
        cursor.execute("SELECT * FROM cells LIMIT 1")
    cell_row = cursor.fetchone()
    conn.close()

    if not cell_row:
        raise HTTPException(status_code=404, detail="Cell not found")
    cell = row_to_dict(cell_row)

    result = simulate_thermal_pack(cell, req.model_dump())
    return result

# ----------------- Safety Analysis -----------------

@app.post("/api/safety/audit")
def run_safety_audit(req: SafetyAuditRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cells WHERE id = ?", (req.cell_id,))
    cell_row = cursor.fetchone()
    conn.close()

    if not cell_row:
        raise HTTPException(status_code=404, detail="Cell not found")
    cell = row_to_dict(cell_row)

    result = perform_safety_audit(cell, req.model_dump())
    return result

# ----------------- Design Optimization -----------------

@app.post("/api/optimizer/run")
def run_design_optimization(req: OptimizerRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cells")
    rows = cursor.fetchall()
    conn.close()

    cells = [row_to_dict(r) for r in rows]
    result = optimize_battery_design(cells, req.model_dump())
    return result

# ----------------- Report Generation -----------------

@app.post("/api/reports/generate")
def generate_report(req: Dict[str, Any]):
    cell_id = req.get("cell_id")
    s_count = int(req.get("series_count", 96))
    p_count = int(req.get("parallel_count", 44))
    module_count = int(req.get("module_count", 8))
    overhead = float(req.get("overhead_mass_factor", 1.25))

    conn = get_connection()
    cursor = conn.cursor()
    if cell_id:
        cursor.execute("SELECT * FROM cells WHERE id = ?", (cell_id,))
    else:
        cursor.execute("SELECT * FROM cells LIMIT 1")
    cell_row = cursor.fetchone()
    conn.close()

    if not cell_row:
        raise HTTPException(status_code=404, detail="Cell not found")
    cell = row_to_dict(cell_row)

    pack_metrics = calculate_pack_metrics(cell, s_count, p_count, module_count, overhead)
    report = generate_engineering_report(
        cell=cell,
        pack_metrics=pack_metrics,
        sim_summary=req.get("electrical_summary"),
        thermal_summary=req.get("thermal_summary"),
        safety_summary=req.get("safety_summary")
    )
    return report

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

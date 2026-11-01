# BATTERY360 – Intelligent Battery Design, Simulation & Optimization Platform

**BATTERY360** is a professional engineering web platform built for battery systems engineers, powertrain designers, and electrochemists. It enables battery pack sizing, equivalent circuit electrical simulations, coupled lumped thermal modeling, safety qualification, Pareto multi-objective optimization, and automated engineering reports.

---

## 🚀 Key Modules & Capabilities

1. **Dashboard:** High-level telemetry, active digital twin KPIs (System Voltage, Energy, Mass, Gravimetric Density, Peak Power, BOM Cost), and active cell datasheet.
2. **Cell Database:** Library of 9 commercial and research cells (Tesla 2170 NMC-811, CATL 280Ah LFP, LG M50LT, Samsung 30Q, Toshiba SCiB LTO, BYD Blade, Molicel P45B, Solid-State Li-Metal, Sodium-Ion), with support for creating custom electrochemical cells.
3. **Battery Configuration:** Interactive Series ($S$) and Parallel ($P$) pack topology builder with module grouping, packaging overhead factor, and a real-time **2D Module & Cell Matrix Schematic** showing cell polarities and busbar connections.
4. **Electrical Simulation:** Dynamic **Thevenin Equivalent Circuit Model (ECM)** with Runge-Kutta integration:
   - Constant Current (CC) discharge (0.1C to 5.0C)
   - CC-CV fast charging with exponential current taper
   - Constant Power (kW) discharge (solving quadratic $V_t = OCV - I R_0$)
   - WLTP Class 3 dynamic velocity-to-power drive cycle with regenerative braking
   - Interactive Plotly time-series curves for $V(t)$, $SOC(t)$, $I(t)$, and Power/Losses.
5. **Thermal Simulation:** Lumped 2-node coupled electro-thermal differential equation solver ($m C_p \frac{dT}{dt} = \dot{Q}_{gen} - \dot{Q}_{cool}$):
   - Joulean heating ($I^2 R_0$) + entropic reversible heating ($I \cdot T \cdot \frac{dE_0}{dT}$)
   - Cooling modes: Liquid Chiller Bottom Cold-Plate (with coolant flow rate & temperature), Forced Air Blower, Natural Convection, and Phase Change Material (PCM)
   - Core vs Surface transient temperature gradient $\Delta T$ and Thermal Runaway Risk Index (TRRI %).
6. **Safety Analysis:**
   - Dead bolted short-circuit fault current ($I_{sc}$) and power (MW)
   - Pyro-switch and fast fuse adiabatic action integral ($I^2 t$) sizing
   - Inter-cell thermal runaway propagation barrier audit (aerogel/mica thickness)
   - Arrhenius-law State of Health (SOH) cycle degradation modeling up to 2500 cycles
   - Composite safety scorecard and grade (A+ to F).
7. **Design Optimization:**
   - Input target voltage, energy capacity, max weight, and volume
   - Application presets (EV Passenger, Heavy Bus, Drone / UAV, Grid BESS)
   - Multi-objective Pareto evaluation ranking all cell candidates by energy density, cost, durability, and power
   - Interactive spider/radar trade-off chart and one-click "Apply to Active Pack" button.
8. **Results Dashboard:** Side-by-side comparative benchmarking for saved configurations with key performance bar charts.
9. **Reports & Bill of Materials:** Automated engineering dossier roll-up with an itemized Bill of Materials (BOM) cost schedule, exportable to JSON or print-to-PDF.
10. **Settings:** Units toggle (Metric SI vs Imperial), numerical solver time-step ($dt$), physical ambient baselines, and database reset button.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons, Plotly (`plotly.js-dist-min`).
- **Backend:** Python 3.14, FastAPI, Uvicorn, NumPy, SciPy (ODE & mathematical solvers), SQLite3, Pydantic.
- **Architecture:** PyBaMM-ready modular service layout with clean REST APIs.

---

## 🏁 Quickstart Guide

### 1. Prerequisites
- Python 3.10+ (with `pip`)
- Node.js 18+ (with `npm`)

### 2. Backend Setup & Run

Open a terminal in the root directory:

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The FastAPI backend will start at:
- **API Server:** `http://127.0.0.1:8000`
- **Swagger Interactive API Docs:** `http://127.0.0.1:8000/docs`

### 3. Frontend Setup & Run

Open a second terminal in the root directory:

```bash
cd frontend
npm install
npm run dev
```

Open your browser at:
👉 **`http://127.0.0.1:5173`**

---

## 📁 Repository Structure

```
Battery-design/
├── backend/
│   ├── database.py              # SQLite connection, tables & preset cell seed data
│   ├── main.py                  # FastAPI server with CORS & endpoints
│   ├── models.py                # Pydantic schemas for cells, packs & simulations
│   ├── requirements.txt         # Python dependencies (fastapi, uvicorn, numpy, scipy)
│   └── services/
│       ├── cell_service.py      # Electrochemical cell management
│       ├── electrical_sim.py    # Thevenin ECM solver (CC-CV, CC, Power, WLTP)
│       ├── optimizer_service.py # Multi-objective Pareto optimizer
│       ├── pack_service.py      # S-P sizing, busbar, energy, mass & volume calculations
│       ├── report_service.py    # Engineering dossier & Bill of Materials (BOM)
│       ├── safety_service.py    # Fault current, I2t fuse & Arrhenius SOH degradation
│       └── thermal_sim.py       # 2-node lumped ODE thermal solver with liquid chiller
├── frontend/
│   ├── index.html               # Main HTML with engineering fonts & favicon
│   ├── package.json             # React 19, Vite, Tailwind CSS, Plotly
│   ├── vite.config.ts           # Vite bundler config with /api proxy to port 8000
│   └── src/
│       ├── App.tsx              # Root app orchestrating all 10 modules & telemetry
│       ├── index.css            # Dark navy blue, turquoise and crisp white engineering styling
│       ├── types.ts             # TypeScript interfaces
│       ├── components/
│       │   ├── Header.tsx       # Top telemetry bar & quick actions
│       │   ├── PlotlyChart.tsx  # Interactive Plotly chart wrapper
│       │   └── Sidebar.tsx      # 10-module navigation bar with status badges
│       ├── services/
│       │   └── api.ts           # REST API client connecting to FastAPI backend
│       └── views/
│           ├── BatteryConfigurationView.tsx # S-P topology & 2D pack matrix visualizer
│           ├── CellDatabaseView.tsx         # Commercial cell library & custom cell creator
│           ├── DashboardView.tsx            # Digital twin overview & KPI cards
│           ├── DesignOptimizationView.tsx   # Multi-objective optimizer & radar chart
│           ├── ElectricalSimulationView.tsx # Thevenin ECM time-series simulation
│           ├── ReportsView.tsx              # Qualification report & itemized BOM
│           ├── ResultsDashboardView.tsx     # Multi-pack comparative benchmarking
│           ├── SafetyAnalysisView.tsx       # Short circuit, TRRI & SOH degradation
│           ├── SettingsView.tsx             # Units, solver dt, and DB maintenance
│           └── ThermalSimulationView.tsx    # Core vs surface thermal ODE solver
└── README.md
```

---

## 📜 Engineering Formulas Implemented

- **Pack Stored Energy:** $E_{pack} = (S \cdot V_{cell,nom}) \times (P \cdot Ah_{cell}) / 1000$ [kWh]
- **Thevenin Terminal Voltage:** $V_t(t) = OCV(SOC(t)) - I(t) R_0 - V_{RC}(t)$
- **Lumped Thermal Differential Equations:**
  $$\dot{Q}_{gen} = I^2 R_0 + I \cdot T_{core} \cdot \frac{dE_0}{dT}$$
  $$C_{core} \frac{dT_{core}}{dt} = \dot{Q}_{gen} - \frac{T_{core} - T_{surf}}{R_{cond}}$$
  $$C_{surf} \frac{dT_{surf}}{dt} = \frac{T_{core} - T_{surf}}{R_{cond}} - h A_{eff} (T_{surf} - T_{coolant})$$
- **Dead Short-Circuit Current:** $I_{sc} = \frac{V_{max}}{R_{pack} + R_{fault}}$
- **Fuse Melting Integral:** $\int I^2 dt = I_{sc}^2 \cdot t_{clear}$
- **Arrhenius Capacity Decay Model:**
  $$Q_{loss}(N) = B \cdot \exp\left(-\frac{E_a}{R T}\right) \cdot (C_{rate})^{0.35} \cdot N^{0.52}$$

import React from 'react';
import {
  Zap,
  Flame,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Scale,
  DollarSign,
  Activity,
  CheckCircle,
  Database,
  BarChart2
} from 'lucide-react';
import { Cell, PackMetrics, PackConfiguration } from '../types';
import { NavTab } from '../components/Sidebar';

interface DashboardViewProps {
  activeCell: Cell | null;
  packMetrics: PackMetrics | null;
  savedConfigs: PackConfiguration[];
  setActiveTab: (tab: NavTab) => void;
  onSelectCell: (cell: Cell) => void;
  allCells: Cell[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeCell,
  packMetrics,
  savedConfigs,
  setActiveTab,
  onSelectCell,
  allCells,
}) => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Hero Engineering Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-850 via-navy-800 to-navy-900 border border-navy-card p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                ACTIVE DIGITAL TWIN
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeCell?.name || 'Tesla 2170 NMC'} • {packMetrics?.series_count}S{packMetrics?.parallel_count}P Topology
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Intelligent Battery Design, Simulation & Optimization Platform
            </h2>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              BATTERY360 provides end-to-end electrochemical pack sizing, Thevenin equivalent circuit electrical solvers, lumped coupled thermal dynamics, safety audits, and Pareto multi-objective optimization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('battery-config')}
              className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-400/20 transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Modify Pack Design</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('design-optimization')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Run AI Optimizer</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-navy-panel border border-navy-card rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider">Pack Voltage</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {packMetrics?.nominal_voltage ?? 0} <span className="text-xs text-cyan-400 font-sans">V</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Range: {packMetrics?.min_voltage}V – {packMetrics?.max_voltage}V
          </div>
        </div>

        <div className="bg-navy-panel border border-navy-card rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider">Stored Energy</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {packMetrics?.stored_energy_kwh ?? 0} <span className="text-xs text-emerald-400 font-sans">kWh</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Capacity: {packMetrics?.capacity_ah} Ah
          </div>
        </div>

        <div className="bg-navy-panel border border-navy-card rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider">Total Pack Mass</span>
            <Scale className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {packMetrics?.total_pack_mass_kg ?? 0} <span className="text-xs text-blue-400 font-sans">kg</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Cells: {packMetrics?.cell_mass_kg} kg
          </div>
        </div>

        <div className="bg-navy-panel border border-navy-card rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider">Energy Density</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">
            {packMetrics?.gravimetric_energy_density_wh_kg ?? 0} <span className="text-xs font-sans">Wh/kg</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Vol: {packMetrics?.volumetric_energy_density_wh_l} Wh/L
          </div>
        </div>

        <div className="bg-navy-panel border border-navy-card rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider">Peak Power</span>
            <Zap className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {packMetrics?.peak_power_kw ?? 0} <span className="text-xs text-violet-400 font-sans">kW</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Cont: {packMetrics?.continuous_power_kw} kW
          </div>
        </div>

        <div className="bg-navy-panel border border-navy-card rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider">BOM Cost</span>
            <DollarSign className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-teal-300 font-mono">
            ${packMetrics?.estimated_total_pack_cost_usd?.toLocaleString() ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            ${packMetrics ? Math.round(packMetrics.estimated_total_pack_cost_usd / (packMetrics.stored_energy_kwh || 1)) : 0}/kWh
          </div>
        </div>
      </div>

      {/* Main Grid: Active Cell Details & Quick Navigation Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Cell Card */}
        <div className="lg:col-span-1 bg-navy-panel border border-navy-card rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Active Electrochemical Cell</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                {activeCell?.chemistry || 'NMC'}
              </span>
            </div>

            <div className="bg-slate-900/90 rounded-lg p-4 border border-slate-800 mb-4">
              <h4 className="text-base font-bold text-white">{activeCell?.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{activeCell?.manufacturer} • {activeCell?.form_factor}</p>

              <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block">NOMINAL VOLTAGE</span>
                  <span className="text-cyan-300 font-bold">{activeCell?.nominal_voltage} V</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">RATED CAPACITY</span>
                  <span className="text-white font-bold">{activeCell?.capacity_ah} Ah</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">INTERNAL ESR</span>
                  <span className="text-white font-bold">{activeCell?.internal_resistance_mohm} mΩ</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">DISCHARGE C-RATE</span>
                  <span className="text-white font-bold">{activeCell?.continuous_c_rate}C / {activeCell?.peak_c_rate}C pk</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">UNIT MASS</span>
                  <span className="text-white font-bold">{activeCell?.weight_g} g</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">CYCLE DURABILITY</span>
                  <span className="text-emerald-400 font-bold">{activeCell?.nominal_cycle_life} cycles</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {activeCell?.description}
            </p>
          </div>

          <button
            onClick={() => setActiveTab('cell-database')}
            className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Browse Full Cell Library ({allCells.length} Cells)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center/Right: Engineering Modules Hub */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Engineering Solvers & Workflows
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Electrical Sim card */}
            <div
              onClick={() => setActiveTab('electrical-sim')}
              className="bg-navy-panel border border-navy-card hover:border-cyan-500/50 rounded-xl p-5 transition-all cursor-pointer group shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-cyan-300 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Launch <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                Thevenin ECM Electrical Simulation
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Run numerical CC-CV charging curves, multi-C constant current discharges, and real-world WLTP Class 3 drive cycle power simulations.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span className="bg-slate-800 px-2 py-0.5 rounded">OCV-SOC Mapping</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded">RC Polarization</span>
              </div>
            </div>

            {/* Thermal Sim card */}
            <div
              onClick={() => setActiveTab('thermal-sim')}
              className="bg-navy-panel border border-navy-card hover:border-amber-500/50 rounded-xl p-5 transition-all cursor-pointer group shadow-lg hover:shadow-amber-500/10"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500/20 transition-all">
                  <Flame className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-amber-300 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Launch <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                Coupled Electro-Thermal Simulation
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Simulate core vs surface temperature gradients, Joulean & entropic reversible heat, and evaluate liquid chiller cooling channels.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span className="bg-slate-800 px-2 py-0.5 rounded">Liquid Chiller</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded">TRRI Audit</span>
              </div>
            </div>

            {/* Safety card */}
            <div
              onClick={() => setActiveTab('safety-analysis')}
              className="bg-navy-panel border border-navy-card hover:border-emerald-500/50 rounded-xl p-5 transition-all cursor-pointer group shadow-lg hover:shadow-emerald-500/10"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-emerald-300 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Launch <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                Safety & SOH Degradation Audit
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Compute bolted short-circuit fault current (I_sc), pyro-fuse clearance (I²t), thermal barrier thickness, and Arrhenius cycle degradation.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span className="bg-slate-800 px-2 py-0.5 rounded">Short Circuit</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded">2500 Cycle SOH</span>
              </div>
            </div>

            {/* Optimizer card */}
            <div
              onClick={() => setActiveTab('design-optimization')}
              className="bg-navy-panel border border-navy-card hover:border-cyan-400 rounded-xl p-5 transition-all cursor-pointer group shadow-lg hover:shadow-cyan-400/10"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-cyan-300 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Launch <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                Multi-Objective Pack Optimizer
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Specify target voltage, energy capacity, and mass limits. The engine evaluates chemistry candidates and returns Pareto-optimal architectures.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span className="bg-slate-800 px-2 py-0.5 rounded">Pareto Optimal</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded">Radar Comparison</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

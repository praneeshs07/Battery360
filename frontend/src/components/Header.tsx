import React from 'react';
import {
  Cpu,
  Zap,
  RotateCcw,
  Download,
  Share2,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Cell, PackMetrics } from '../types';
import { NavTab } from './Sidebar';

interface HeaderProps {
  activeTab: NavTab;
  activeCell: Cell | null;
  packMetrics: PackMetrics | null;
  onQuickSimulate: () => void;
  onResetPack: () => void;
  isBackendHealthy: boolean;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  'dashboard': {
    title: 'Platform Overview & Engineering Telemetry',
    subtitle: 'System-wide battery pack architecture, active cell chemistry, and solver performance',
  },
  'cell-database': {
    title: 'Electrochemical Cell Library',
    subtitle: 'Commercial, prototype, and solid-state cell specifications, parameters, and form factors',
  },
  'battery-config': {
    title: 'Pack Architecture & Series-Parallel Configuration',
    subtitle: 'Matrix topology, voltage, capacity, gravimetric/volumetric density, and schematic layout',
  },
  'electrical-sim': {
    title: 'Thevenin ECM Electrical Simulation',
    subtitle: 'Dynamic Runge-Kutta simulation of CC-CV charging, multi-C discharge, and drive cycles',
  },
  'thermal-sim': {
    title: 'Coupled Electro-Thermal & Cooling Simulation',
    subtitle: 'Core-to-surface heat dissipation, Joulean + entropic heating, and runaway risk audit',
  },
  'safety-analysis': {
    title: 'Safety Qualification & SOH Aging Analysis',
    subtitle: 'Short-circuit fault current, pyro-fuse sizing, thermal barrier audit, and cycle life decay',
  },
  'design-optimization': {
    title: 'Multi-Objective Battery Pack Optimizer',
    subtitle: 'Pareto-optimal cell and topology selection constrained by voltage, energy, mass, and cost',
  },
  'results-dashboard': {
    title: 'Multi-Configuration Comparative Analytics',
    subtitle: 'Side-by-side trade-off evaluation, spider charts, and comparative engineering tables',
  },
  'reports': {
    title: 'Engineering Dossier & Bill of Materials',
    subtitle: 'Automated qualification report generator, BOM cost roll-up, and exportable documentation',
  },
  'settings': {
    title: 'System Preferences & Physical Constants',
    subtitle: 'Unit systems, thermal ambient baselines, ODE solver step-size, and database maintenance',
  },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  activeCell,
  packMetrics,
  onQuickSimulate,
  onResetPack,
  isBackendHealthy,
}) => {
  const current = TAB_TITLES[activeTab] || { title: 'BATTERY360', subtitle: '' };

  return (
    <header className="bg-navy-900 border-b border-navy-card px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur-md bg-opacity-95">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-mono font-semibold tracking-wider text-cyan-400 uppercase bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            {activeTab.replace('-', ' ')}
          </span>
          <span className="text-slate-500">/</span>
          <span className="text-xs font-mono text-slate-400">BATTERY360-CORE</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">{current.title}</h1>
        <p className="text-xs text-slate-400 mt-0.5">{current.subtitle}</p>
      </div>

      {/* Right Quick Telemetry & Actions */}
      <div className="flex items-center gap-3">
        {packMetrics && activeCell && (
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs font-mono">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">SYS VOLTAGE</span>
              <span className="text-cyan-300 font-bold">{packMetrics.nominal_voltage} V</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">ENERGY</span>
              <span className="text-white font-bold">{packMetrics.stored_energy_kwh} kWh</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">MASS</span>
              <span className="text-white font-bold">{packMetrics.total_pack_mass_kg} kg</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">DENSITY</span>
              <span className="text-emerald-400 font-bold">{packMetrics.gravimetric_energy_density_wh_kg} Wh/kg</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={onQuickSimulate}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
            title="Execute fast multi-physics check"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Simulate</span>
          </button>

          <button
            onClick={onResetPack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-all cursor-pointer"
            title="Reset to default 96S44P Tesla 2170 config"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};

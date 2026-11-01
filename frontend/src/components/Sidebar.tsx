import React from 'react';
import {
  LayoutDashboard,
  Database,
  Layers,
  Zap,
  Flame,
  ShieldAlert,
  Sparkles,
  BarChart3,
  FileText,
  Settings,
  BatteryCharging,
  CircleDot
} from 'lucide-react';
import { Cell, PackMetrics } from '../types';

export type NavTab =
  | 'dashboard'
  | 'cell-database'
  | 'battery-config'
  | 'electrical-sim'
  | 'thermal-sim'
  | 'safety-analysis'
  | 'design-optimization'
  | 'results-dashboard'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  activeCell: Cell | null;
  packMetrics: PackMetrics | null;
  isBackendHealthy: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeCell,
  packMetrics,
  isBackendHealthy,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'cell-database', label: 'Cell Database', icon: <Database className="w-5 h-5" />, badge: 'Library' },
    { id: 'battery-config', label: 'Battery Configuration', icon: <Layers className="w-5 h-5" /> },
    { id: 'electrical-sim', label: 'Electrical Simulation', icon: <Zap className="w-5 h-5" />, badge: 'ECM' },
    { id: 'thermal-sim', label: 'Thermal Simulation', icon: <Flame className="w-5 h-5" /> },
    { id: 'safety-analysis', label: 'Safety Analysis', icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'design-optimization', label: 'Design Optimization', icon: <Sparkles className="w-5 h-5" />, badge: 'AI' },
    { id: 'results-dashboard', label: 'Results Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-5 h-5" />, badge: 'BOM' },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-navy-panel border-r border-navy-card flex flex-col h-screen select-none shrink-0 sticky top-0">
      {/* Platform Branding */}
      <div className="p-5 border-b border-navy-card/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <BatteryCharging className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-wider text-white">BATTERY</span>
              <span className="font-black text-xl text-cyan-400">360</span>
            </div>
            <p className="text-[10px] text-cyan-300/70 tracking-widest font-mono uppercase">Engineering Suite</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-3 pb-2 font-semibold">
          Modules & Solvers
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border-l-4 border-cyan-400 font-semibold shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isActive ? 'bg-cyan-400/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Active Pack Status Widget */}
      <div className="p-3 border-t border-navy-card/80 bg-slate-950/40">
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-lg p-3 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-400 font-mono text-[11px]">ACTIVE DESIGN</span>
            <span className="text-cyan-400 font-bold font-mono text-[11px]">
              {packMetrics ? `${packMetrics.series_count}S${packMetrics.parallel_count}P` : 'None'}
            </span>
          </div>
          <div className="text-slate-200 font-medium truncate mb-1">
            {activeCell ? activeCell.name : 'No Cell Selected'}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800">
            <span>{packMetrics ? `${packMetrics.stored_energy_kwh} kWh` : '0.0 kWh'}</span>
            <span>{packMetrics ? `${packMetrics.nominal_voltage} V` : '0 V'}</span>
          </div>
        </div>

        {/* Engine Connectivity Status */}
        <div className="mt-2.5 flex items-center justify-between px-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <CircleDot className={`w-3 h-3 ${isBackendHealthy ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
            <span className="text-slate-400 font-mono">
              Engine {isBackendHealthy ? 'Online (8000)' : 'Offline'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">
            PyBaMM-Ready
          </span>
        </div>
      </div>
    </aside>
  );
};

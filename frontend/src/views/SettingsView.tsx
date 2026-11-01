import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  Cpu,
  Layers,
  Sparkles,
  ShieldAlert,
  Flame,
  Zap
} from 'lucide-react';
import { resetDemoDatabase, fetchHealth } from '../services/api';

interface SettingsViewProps {
  isBackendHealthy: boolean;
  onRefreshAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isBackendHealthy,
  onRefreshAll,
}) => {
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [defaultAmbient, setDefaultAmbient] = useState<number>(25.0);
  const [defaultCoolant, setDefaultCoolant] = useState<number>(20.0);
  const [defaultDt, setDefaultDt] = useState<number>(1.0);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleResetDb = async () => {
    if (!confirm('Are you sure you want to reset the database? This will restore factory preset cells and default battery configurations.')) {
      return;
    }
    setIsResetting(true);
    setStatusMessage(null);
    try {
      await resetDemoDatabase();
      setStatusMessage('Database reset successfully to factory defaults!');
      onRefreshAll();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to reset database');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Settings Header */}
      <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center border border-slate-700">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Platform Configuration & Environment Settings</h2>
            <p className="text-xs text-slate-400">
              Set units of measure, baseline physical environment values, and backend engine status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isBackendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          <span className="text-xs font-mono text-slate-300">
            {isBackendHealthy ? 'API Engine Active' : 'Offline'}
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Unit Systems & Defaults */}
      <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Units & Simulation Constants
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="text-slate-400 block mb-2 font-mono uppercase">Unit Display System</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setUnitSystem('metric')}
                className={`py-2 px-3 rounded-lg border font-mono transition-colors cursor-pointer ${
                  unitSystem === 'metric'
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                Metric (SI: °C, kg, mm, L)
              </button>
              <button
                onClick={() => setUnitSystem('imperial')}
                className={`py-2 px-3 rounded-lg border font-mono transition-colors cursor-pointer ${
                  unitSystem === 'imperial'
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                Imperial (US: °F, lbs, in, gal)
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-2 font-mono uppercase">Numerical Solver Time-Step (dt)</label>
            <select
              value={defaultDt}
              onChange={(e) => setDefaultDt(parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            >
              <option value="0.2">0.2 seconds (Extreme Precision)</option>
              <option value="0.5">0.5 seconds (High Fidelity)</option>
              <option value="1.0">1.0 second (Standard Benchmark)</option>
              <option value="2.0">2.0 seconds (Fast Approximate)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Default Ambient Temperature (°C)</label>
            <input
              type="number"
              step="1"
              value={defaultAmbient}
              onChange={(e) => setDefaultAmbient(parseFloat(e.target.value) || 25.0)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Default Coolant Chiller Inlet (°C)</label>
            <input
              type="number"
              step="1"
              value={defaultCoolant}
              onChange={(e) => setDefaultCoolant(parseFloat(e.target.value) || 20.0)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* Backend & Solvers Diagnostic */}
      <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          Active Computational Solvers & PyBaMM Readiness
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-200">Thevenin ECM Electrical Solver</span>
            </div>
            <span className="text-emerald-400 font-bold">READY (Active)</span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="text-slate-200">SciPy 2-Node Thermal ODE</span>
            </div>
            <span className="text-emerald-400 font-bold">READY (Active)</span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-slate-200">Pareto Multi-Objective Optimizer</span>
            </div>
            <span className="text-emerald-400 font-bold">READY (Active)</span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-200">Arrhenius Degradation Modeler</span>
            </div>
            <span className="text-emerald-400 font-bold">READY (Active)</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
          <strong className="text-cyan-400 block mb-1">PyBaMM & P2D Integration Architecture:</strong>
          BATTERY360 backend is architected with modular service abstractions designed to swap or parallelize equivalent circuit models (ECM) with full Doyle-Fuller-Newman (DFN / P2D) electrochemical simulations via Python PyBaMM when required for electrode-scale lithium plating and solid electrolyte interphase (SEI) film growth modeling.
        </div>
      </div>

      {/* Database Maintenance */}
      <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <Database className="w-4 h-4 text-rose-400" />
          Database Management & Factory Reset
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white">Restore Factory Database</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Re-seed all 9 preset commercial cells (Tesla 2170, CATL LFP, Solid-State, etc.) and reset stored configurations.
            </p>
          </div>

          <button
            onClick={handleResetDb}
            disabled={isResetting}
            className="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting DB...' : 'Reset Factory Presets'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

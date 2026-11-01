import React, { useState } from 'react';
import {
  Layers,
  Zap,
  Scale,
  DollarSign,
  TrendingUp,
  Cpu,
  BookmarkPlus,
  Sliders,
  CheckCircle2,
  Box,
  Flame,
  Grid
} from 'lucide-react';
import { Cell, PackMetrics, PackConfiguration } from '../types';
import { saveConfiguration } from '../services/api';

interface BatteryConfigurationViewProps {
  activeCell: Cell | null;
  packMetrics: PackMetrics | null;
  seriesCount: number;
  parallelCount: number;
  moduleCount: number;
  overheadFactor: number;
  packagingType: string;
  coolingType: string;
  targetApp: string;
  onUpdateParams: (params: {
    seriesCount?: number;
    parallelCount?: number;
    moduleCount?: number;
    overheadFactor?: number;
    packagingType?: string;
    coolingType?: string;
    targetApp?: string;
  }) => void;
  onRefreshConfigs: () => void;
}

export const BatteryConfigurationView: React.FC<BatteryConfigurationViewProps> = ({
  activeCell,
  packMetrics,
  seriesCount,
  parallelCount,
  moduleCount,
  overheadFactor,
  packagingType,
  coolingType,
  targetApp,
  onUpdateParams,
  onRefreshConfigs,
}) => {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [configName, setConfigName] = useState(
    `${activeCell?.name || 'EV'} ${seriesCount}S${parallelCount}P`
  );
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCell) return;
    setIsSaving(true);
    try {
      await saveConfiguration({
        name: configName,
        cell_id: activeCell.id,
        series_count: seriesCount,
        parallel_count: parallelCount,
        module_count: moduleCount,
        overhead_mass_factor: overheadFactor,
        packaging_type: packagingType,
        cooling_type: coolingType,
        target_application: targetApp,
        notes: notes,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setSaveModalOpen(false);
      }, 1500);
      onRefreshConfigs();
    } catch (err: any) {
      alert(err.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Preset Configurations
  const applyPreset = (s: number, p: number, mod: number, packType: string, app: string) => {
    onUpdateParams({
      seriesCount: s,
      parallelCount: p,
      moduleCount: mod,
      packagingType: packType,
      targetApp: app,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Configuration Controls Bar */}
      <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Series & Parallel Topology Builder</h2>
              <p className="text-xs text-slate-400">
                Cell: <strong className="text-cyan-300">{activeCell?.name}</strong> ({activeCell?.nominal_voltage}V, {activeCell?.capacity_ah}Ah, {activeCell?.chemistry})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setConfigName(`${activeCell?.name || 'Pack'} ${seriesCount}S${parallelCount}P`);
                setSaveModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>Save Pack Configuration</span>
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px] uppercase mr-1">Industry Presets:</span>
          <button
            onClick={() => applyPreset(96, 44, 8, 'Structural Enclosure', 'EV Passenger')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer font-mono"
          >
            400V 75kWh Long-Range EV (96S44P)
          </button>
          <button
            onClick={() => applyPreset(192, 22, 16, 'Structural Enclosure', 'EV Passenger')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer font-mono"
          >
            800V Ultra-Fast Charge EV (192S22P)
          </button>
          <button
            onClick={() => applyPreset(14, 4, 1, 'Pouch Cassette', 'Drone / UAV')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer font-mono"
          >
            52V High-Rate UAV Drone (14S4P)
          </button>
          <button
            onClick={() => applyPreset(16, 2, 2, 'Structural Enclosure', 'Grid BESS')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer font-mono"
          >
            51.2V LFP Home Storage (16S2P)
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          {/* Series Slider */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono uppercase text-slate-400 font-bold">Series (S Count)</label>
              <input
                type="number"
                min="1"
                max="300"
                value={seriesCount}
                onChange={(e) => onUpdateParams({ seriesCount: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-right font-mono text-cyan-300 font-bold text-xs"
              />
            </div>
            <input
              type="range"
              min="1"
              max="200"
              value={seriesCount}
              onChange={(e) => onUpdateParams({ seriesCount: parseInt(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>1S</span>
              <span className="text-cyan-400 font-bold">{seriesCount * (activeCell?.nominal_voltage || 3.7)}V Nom</span>
              <span>200S</span>
            </div>
          </div>

          {/* Parallel Slider */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono uppercase text-slate-400 font-bold">Parallel (P Count)</label>
              <input
                type="number"
                min="1"
                max="200"
                value={parallelCount}
                onChange={(e) => onUpdateParams({ parallelCount: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-right font-mono text-cyan-300 font-bold text-xs"
              />
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={parallelCount}
              onChange={(e) => onUpdateParams({ parallelCount: parseInt(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>1P</span>
              <span className="text-cyan-400 font-bold">{(parallelCount * (activeCell?.capacity_ah || 5)).toFixed(1)}Ah</span>
              <span>100P</span>
            </div>
          </div>

          {/* Module Count */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono uppercase text-slate-400 font-bold">Modules Count</label>
              <input
                type="number"
                min="1"
                max="32"
                value={moduleCount}
                onChange={(e) => onUpdateParams({ moduleCount: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-right font-mono text-cyan-300 font-bold text-xs"
              />
            </div>
            <input
              type="range"
              min="1"
              max="24"
              value={moduleCount}
              onChange={(e) => onUpdateParams({ moduleCount: parseInt(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>1 Module</span>
              <span className="text-cyan-400 font-bold">
                {Math.floor((seriesCount * parallelCount) / moduleCount)} cells/mod
              </span>
              <span>24 Modules</span>
            </div>
          </div>

          {/* Packaging Overhead */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono uppercase text-slate-400 font-bold">Packaging Overhead</label>
              <span className="text-xs font-mono text-cyan-300 font-bold">{overheadFactor}x Mass</span>
            </div>
            <input
              type="range"
              min="1.05"
              max="1.60"
              step="0.05"
              value={overheadFactor}
              onChange={(e) => onUpdateParams({ overheadFactor: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>1.05x (CTP Blade)</span>
              <span>1.60x (Cast Al)</span>
            </div>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-xs text-slate-400 block mb-1 font-mono">ENCLOSURE ARCHITECTURE</label>
            <select
              value={packagingType}
              onChange={(e) => onUpdateParams({ packagingType: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
            >
              <option value="Structural Enclosure">Structural Aluminum Enclosure</option>
              <option value="Cell-To-Pack (CTP)">Cell-To-Pack (CTP Modular)</option>
              <option value="Cell-To-Chassis (CTC)">Cell-To-Chassis (CTC Integrated)</option>
              <option value="Pouch Cassette">Pouch Clamping Cassette</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-mono">THERMAL MANAGEMENT SYSTEM</label>
            <select
              value={coolingType}
              onChange={(e) => onUpdateParams({ coolingType: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
            >
              <option value="Liquid Chiller Loop">Liquid Chiller Bottom Cold-Plate</option>
              <option value="Immersion Dielectric">Dielectric Fluid Direct Immersion</option>
              <option value="Forced Air Blower">Forced Air High-Static Blower</option>
              <option value="Phase Change Material">Phase Change Material (PCM Composite)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-mono">TARGET APPLICATION DOMAIN</label>
            <select
              value={targetApp}
              onChange={(e) => onUpdateParams({ targetApp: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
            >
              <option value="EV Passenger">EV Passenger Powertrain</option>
              <option value="Commercial Bus / Heavy Truck">Commercial Bus / Heavy Truck</option>
              <option value="Drone / UAV">Drone / UAV Aerospace</option>
              <option value="Grid BESS">Utility Scale Grid BESS</option>
              <option value="Marine Power">Marine Electric Propulsion</option>
              <option value="Industrial Power Tool">High-Rate Power Tool</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Calculated Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-navy-panel border border-navy-card rounded-xl p-4 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Cell Count</span>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {packMetrics?.total_cell_count.toLocaleString() ?? 0}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {seriesCount}S × {parallelCount}P across {moduleCount} mods
          </span>
        </div>

        <div className="bg-navy-panel border border-navy-card rounded-xl p-4 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">System Stored Energy</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {packMetrics?.stored_energy_kwh ?? 0} <span className="text-sm">kWh</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Capacity: {packMetrics?.capacity_ah} Ah
          </span>
        </div>

        <div className="bg-navy-panel border border-navy-card rounded-xl p-4 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Gravimetric Density</span>
          <div className="text-2xl font-bold text-amber-300 font-mono mt-1">
            {packMetrics?.gravimetric_energy_density_wh_kg ?? 0} <span className="text-sm">Wh/kg</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Volumetric: {packMetrics?.volumetric_energy_density_wh_l} Wh/L
          </span>
        </div>

        <div className="bg-navy-panel border border-navy-card rounded-xl p-4 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Pack Impedance</span>
          <div className="text-2xl font-bold text-cyan-300 font-mono mt-1">
            {packMetrics?.internal_resistance_total_mohm ?? 0} <span className="text-sm">mΩ</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Includes ~{(seriesCount * 0.08).toFixed(1)}mΩ busbars
          </span>
        </div>
      </div>

      {/* 2D Interactive Pack Matrix & Architecture Visualizer */}
      <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-navy-card mb-4">
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">2D Battery Pack Module & Cell Matrix Schematic</h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
              <span className="text-slate-300">Positive Pin (+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-700" />
              <span className="text-slate-300">Negative Can (-)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1.5 bg-amber-400/80 rounded" />
              <span className="text-slate-300">Copper Busbar</span>
            </div>
          </div>
        </div>

        {/* Visualizer Canvas */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 overflow-x-auto">
          <div className="min-w-[600px] space-y-6">
            {/* High Voltage Main Busbar Rail */}
            <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-rose-400 font-bold">HV+ TERMINAL ({packMetrics?.nominal_voltage}V)</span>
              </div>
              <span className="text-slate-400">Total Series Nodes: {seriesCount}</span>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">HV- TERMINAL (0.0V REF)</span>
                <span className="w-3 h-3 rounded-full bg-cyan-500" />
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: Math.min(moduleCount, 8) }).map((_, mIdx) => (
                <div
                  key={mIdx}
                  className="bg-navy-card/80 border border-slate-700/80 rounded-xl p-3 relative group hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-2 mb-2 border-b border-slate-800">
                    <span className="text-cyan-300 font-bold">MODULE #{mIdx + 1}</span>
                    <span>{Math.round(seriesCount / moduleCount)}S × {parallelCount}P</span>
                  </div>

                  {/* Cell matrix preview inside module */}
                  <div className="grid grid-cols-6 gap-1.5 p-2 bg-slate-950/80 rounded-lg">
                    {Array.from({ length: 24 }).map((_, cIdx) => {
                      const isAlternate = (cIdx + mIdx) % 2 === 0;
                      return (
                        <div
                          key={cIdx}
                          className={`aspect-square rounded-full flex items-center justify-center text-[8px] font-mono font-bold transition-transform hover:scale-125 cursor-pointer shadow-sm ${
                            isAlternate
                              ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 shadow-cyan-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                          title={`Cell in Mod ${mIdx + 1} (${isAlternate ? 'Cathode' : 'Anode'})`}
                        >
                          {isAlternate ? '+' : '–'}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-2 text-[10px] text-center text-slate-400 font-mono">
                    Integrated Thermistor NTC: <span className="text-emerald-400">25.4°C</span>
                  </div>
                </div>
              ))}
            </div>

            {moduleCount > 8 && (
              <div className="text-center text-xs text-slate-500 font-mono">
                + {moduleCount - 8} additional symmetrical modules in series circuit...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Configuration Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-navy-card rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Save Battery Pack Architecture</h3>
            <p className="text-xs text-slate-400 mb-4">
              Store this {seriesCount}S{parallelCount}P layout to compare in the Results Dashboard and generate engineering reports.
            </p>

            {saveSuccess ? (
              <div className="py-6 text-center text-emerald-400 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
                <span className="font-bold text-sm">Configuration Saved Successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Configuration Name</label>
                  <input
                    type="text"
                    required
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Design Notes & Constraints</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter intended chassis volume, vehicle specs, cooling requirements..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-card">
                  <button
                    type="button"
                    onClick={() => setSaveModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-md shadow-cyan-400/20"
                  >
                    {isSaving ? 'Saving...' : 'Confirm & Save'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

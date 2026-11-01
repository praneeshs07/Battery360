import React, { useState } from 'react';
import {
  Flame,
  Play,
  RotateCcw,
  Thermometer,
  ShieldAlert,
  Wind,
  Droplets,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Cell, PackMetrics, ThermalSimResult } from '../types';
import { simulateThermal } from '../services/api';
import { PlotlyChart } from '../components/PlotlyChart';

interface ThermalSimulationViewProps {
  activeCell: Cell | null;
  packMetrics: PackMetrics | null;
  seriesCount: number;
  parallelCount: number;
  thermalResult: ThermalSimResult | null;
  setThermalResult: (res: ThermalSimResult | null) => void;
}

export const ThermalSimulationView: React.FC<ThermalSimulationViewProps> = ({
  activeCell,
  packMetrics,
  seriesCount,
  parallelCount,
  thermalResult,
  setThermalResult,
}) => {
  const [dischargeC, setDischargeC] = useState<number>(2.0);
  const [coolingMode, setCoolingMode] = useState<string>('liquid_chiller');
  const [initialTemp, setInitialTemp] = useState<number>(25.0);
  const [ambientTemp, setAmbientTemp] = useState<number>(25.0);
  const [coolantTemp, setCoolantTemp] = useState<number>(20.0);
  const [flowRate, setFlowRate] = useState<number>(12.0);
  const [duration, setDuration] = useState<number>(1800.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeChartTab, setActiveChartTab] = useState<'temps' | 'heat' | 'trri'>('temps');

  const handleRunSim = async () => {
    if (!activeCell) return;
    setIsLoading(true);
    try {
      const res = await simulateThermal({
        cell_id: activeCell.id,
        series_count: seriesCount,
        parallel_count: parallelCount,
        discharge_c_rate: dischargeC,
        initial_temp_c: initialTemp,
        ambient_temp_c: ambientTemp,
        cooling_mode: coolingMode,
        coolant_temp_c: coolantTemp,
        flow_rate_lpm: flowRate,
        sim_duration_sec: duration,
      });
      setThermalResult(res);
    } catch (err: any) {
      alert(err.message || 'Thermal simulation execution failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getChartData = () => {
    if (!thermalResult) return { data: [], layout: {} };

    const t = thermalResult.time_seconds.map((s) => s / 60.0); // convert to minutes

    if (activeChartTab === 'temps') {
      const runawayLimit = activeCell?.thermal_runaway_temp_c || 140.0;
      return {
        data: [
          {
            x: t,
            y: thermalResult.core_temperature_c,
            type: 'scatter',
            mode: 'lines',
            name: 'Cell Core Temp T_core (°C)',
            line: { color: '#EF4444', width: 2.5 },
          },
          {
            x: t,
            y: thermalResult.surface_temperature_c,
            type: 'scatter',
            mode: 'lines',
            name: 'Cell Surface / Cold Plate T_surf (°C)',
            line: { color: '#00F0FF', width: 2.5 },
          },
        ],
        layout: {
          title: { text: 'Core vs Surface Transient Temperatures', font: { color: '#F8FAFC' } },
          xaxis: { title: { text: 'Time (minutes)', font: { color: '#94A3B8' } } },
          yaxis: { title: { text: 'Temperature (°C)', font: { color: '#F8FAFC' } } },
          shapes: [
            {
              type: 'line',
              x0: 0,
              x1: t[t.length - 1],
              y0: 60,
              y1: 60,
              line: { color: '#F59E0B', width: 1.5, dash: 'dash' },
            },
          ],
        },
      };
    }

    if (activeChartTab === 'heat') {
      return {
        data: [
          {
            x: t,
            y: thermalResult.joule_heat_generation_kw,
            type: 'scatter',
            mode: 'lines',
            name: 'Joule Heating (kW)',
            line: { color: '#EF4444', width: 2 },
          },
          {
            x: t,
            y: thermalResult.entropic_heat_generation_kw,
            type: 'scatter',
            mode: 'lines',
            name: 'Entropic Reversible Heat (kW)',
            line: { color: '#F59E0B', width: 2 },
          },
          {
            x: t,
            y: thermalResult.cooling_heat_dissipation_kw,
            type: 'scatter',
            mode: 'lines',
            name: 'Cooling Rejection Rate (kW)',
            line: { color: '#00F0FF', width: 2 },
          },
        ],
        layout: {
          title: { text: 'Thermal Balance: Generation vs Rejection Rate', font: { color: '#F8FAFC' } },
          xaxis: { title: { text: 'Time (minutes)', font: { color: '#94A3B8' } } },
          yaxis: { title: { text: 'Heat Flow (kW)', font: { color: '#F8FAFC' } } },
        },
      };
    }

    // TRRI Chart
    return {
      data: [
        {
          x: t,
          y: thermalResult.thermal_runaway_risk_index_percent,
          type: 'scatter',
          mode: 'lines',
          name: 'TRRI Index (%)',
          line: { color: '#EC4899', width: 2.5 },
          fill: 'tozeroy',
          fillcolor: 'rgba(236, 72, 153, 0.1)',
        },
      ],
      layout: {
        title: { text: 'Thermal Runaway Risk Index (TRRI %)', font: { color: '#F8FAFC' } },
        xaxis: { title: { text: 'Time (minutes)', font: { color: '#94A3B8' } } },
        yaxis: { title: { text: 'Risk Index (%)', font: { color: '#EC4899' } }, range: [0, 100] },
      },
    };
  };

  const chart = getChartData();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Controls Container */}
      <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Coupled Electro-Thermal & Cooling Solver</h2>
              <p className="text-xs text-slate-400">
                2-Node lumped core/surface model with Joulean + entropic reversible heating [m · Cp · dT/dt = Q_gen - Q_cool]
              </p>
            </div>
          </div>

          <button
            onClick={handleRunSim}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Integrating ODE Equations...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Execute Thermal Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* Input Parameters Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 pt-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Cooling Technology</label>
            <select
              value={coolingMode}
              onChange={(e) => setCoolingMode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-medium"
            >
              <option value="liquid_chiller">Liquid Chiller Cold Plate</option>
              <option value="forced_air">Forced Air Blower Fan</option>
              <option value="natural_convection">Natural Convection (Passive)</option>
              <option value="pcm">Phase Change Material (PCM)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Discharge C-Rate</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="5.0"
              value={dischargeC}
              onChange={(e) => setDischargeC(parseFloat(e.target.value) || 2.0)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Coolant Flow (L/min)</label>
            <input
              type="number"
              step="1"
              min="1"
              max="35"
              value={flowRate}
              onChange={(e) => setFlowRate(parseFloat(e.target.value) || 12.0)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
              disabled={coolingMode !== 'liquid_chiller'}
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Coolant Temp (°C)</label>
            <input
              type="number"
              step="1"
              value={coolantTemp}
              onChange={(e) => setCoolantTemp(parseFloat(e.target.value) || 20.0)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
              disabled={coolingMode !== 'liquid_chiller'}
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Ambient Temp (°C)</label>
            <input
              type="number"
              step="1"
              value={ambientTemp}
              onChange={(e) => setAmbientTemp(parseFloat(e.target.value) || 25.0)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Duration (sec)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            >
              <option value="600">10 min (Fast)</option>
              <option value="1800">30 min (Standard)</option>
              <option value="3600">60 min (Full Cycle)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary Telemetry Cards */}
      {thermalResult && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-navy-panel border border-navy-card rounded-xl p-3 shadow-md">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Max Core Temp</span>
            <div className={`text-xl font-bold font-mono mt-0.5 ${
              thermalResult.summary.max_core_temp_c > 55 ? 'text-rose-400' : 'text-amber-300'
            }`}>
              {thermalResult.summary.max_core_temp_c} °C
            </div>
          </div>

          <div className="bg-navy-panel border border-navy-card rounded-xl p-3 shadow-md">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Max Surface Temp</span>
            <div className="text-xl font-bold text-cyan-300 font-mono mt-0.5">
              {thermalResult.summary.max_surface_temp_c} °C
            </div>
          </div>

          <div className="bg-navy-panel border border-navy-card rounded-xl p-3 shadow-md">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Thermal Gradient ΔT</span>
            <div className="text-xl font-bold text-white font-mono mt-0.5">
              {thermalResult.summary.max_thermal_gradient_c} °C
            </div>
          </div>

          <div className="bg-navy-panel border border-navy-card rounded-xl p-3 shadow-md">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Peak Heat Rate</span>
            <div className="text-xl font-bold text-violet-400 font-mono mt-0.5">
              {thermalResult.summary.peak_heat_generation_kw} kW
            </div>
          </div>

          <div className="bg-navy-panel border border-navy-card rounded-xl p-3 shadow-md">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Runaway Risk TRRI</span>
            <div className="text-xl font-bold text-pink-400 font-mono mt-0.5">
              {thermalResult.summary.max_trri_percent}%
            </div>
          </div>

          <div className="bg-navy-panel border border-navy-card rounded-xl p-3 shadow-md">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Cooling Adequacy</span>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
              {thermalResult.summary.cooling_adequacy_score} / 100
            </div>
          </div>
        </div>
      )}

      {/* Charts Container */}
      <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-navy-card mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Thermal Dynamics Telemetry</h3>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
            <button
              onClick={() => setActiveChartTab('temps')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeChartTab === 'temps' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Temperatures T(t)
            </button>
            <button
              onClick={() => setActiveChartTab('heat')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeChartTab === 'heat' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Heat Rates Q(t)
            </button>
            <button
              onClick={() => setActiveChartTab('trri')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeChartTab === 'trri' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Runaway Risk (TRRI)
            </button>
          </div>
        </div>

        {thermalResult ? (
          <div className="w-full">
            <PlotlyChart
              data={chart.data}
              layout={chart.layout}
              style={{ minHeight: '420px' }}
            />
          </div>
        ) : (
          <div className="py-24 text-center">
            <Flame className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
            <h4 className="text-base font-bold text-slate-300">No thermal simulation executed yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Select cooling mode and click "Execute Thermal Simulation" to solve core and surface thermal differential equations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

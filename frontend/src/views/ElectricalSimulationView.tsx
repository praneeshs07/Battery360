import React, { useState } from 'react';
import {
  Zap,
  Play,
  RotateCcw,
  Activity,
  Layers,
  Clock,
  TrendingDown,
  Flame,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { Cell, PackMetrics, ElectricalSimResult } from '../types';
import { simulateElectrical } from '../services/api';
import { PlotlyChart } from '../components/PlotlyChart';

interface ElectricalSimulationViewProps {
  activeCell: Cell | null;
  packMetrics: PackMetrics | null;
  seriesCount: number;
  parallelCount: number;
  simResult: ElectricalSimResult | null;
  setSimResult: (res: ElectricalSimResult | null) => void;
}

export const ElectricalSimulationView: React.FC<ElectricalSimulationViewProps> = ({
  activeCell,
  packMetrics,
  seriesCount,
  parallelCount,
  simResult,
  setSimResult,
}) => {
  const [mode, setMode] = useState<string>('discharge_cc');
  const [cRate, setCRate] = useState<number>(1.0);
  const [constantPowerKw, setConstantPowerKw] = useState<number>(50.0);
  const [initialSoc, setInitialSoc] = useState<number>(1.0);
  const [targetSoc, setTargetSoc] = useState<number>(0.05);
  const [dt, setDt] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeChartTab, setActiveChartTab] = useState<'voltage' | 'soc' | 'current' | 'power'>('voltage');

  const handleRunSim = async () => {
    if (!activeCell) return;
    setIsLoading(true);
    try {
      const res = await simulateElectrical({
        cell_id: activeCell.id,
        series_count: seriesCount,
        parallel_count: parallelCount,
        mode: mode,
        c_rate: cRate,
        constant_power_kw: constantPowerKw,
        initial_soc: initialSoc,
        target_soc: targetSoc,
        time_step_sec: dt,
      });
      setSimResult(res);
    } catch (err: any) {
      alert(err.message || 'Simulation execution failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Build Plotly Data based on active tab
  const getChartData = () => {
    if (!simResult) return { data: [], layout: {} };

    const t = simResult.time_seconds;

    if (activeChartTab === 'voltage') {
      return {
        data: [
          {
            x: t,
            y: simResult.terminal_voltage_v,
            type: 'scatter',
            mode: 'lines',
            name: 'Pack Terminal Voltage (V)',
            line: { color: '#00F0FF', width: 2.5 },
          },
        ],
        layout: {
          title: { text: `Pack Terminal Voltage vs Time (${mode.toUpperCase()})`, font: { color: '#F8FAFC' } },
          xaxis: { title: { text: 'Time (seconds)', font: { color: '#94A3B8' } } },
          yaxis: { title: { text: 'Voltage (V)', font: { color: '#00F0FF' } } },
        },
      };
    }

    if (activeChartTab === 'soc') {
      return {
        data: [
          {
            x: t,
            y: simResult.soc_percent,
            type: 'scatter',
            mode: 'lines',
            name: 'SOC (%)',
            line: { color: '#10B981', width: 2.5 },
            fill: 'tozeroy',
            fillcolor: 'rgba(16, 185, 129, 0.08)',
          },
        ],
        layout: {
          title: { text: 'Battery State of Charge (SOC) Trajectory', font: { color: '#F8FAFC' } },
          xaxis: { title: { text: 'Time (seconds)', font: { color: '#94A3B8' } } },
          yaxis: { title: { text: 'State of Charge (%)', font: { color: '#10B981' } }, range: [0, 105] },
        },
      };
    }

    if (activeChartTab === 'current') {
      return {
        data: [
          {
            x: t,
            y: simResult.current_a,
            type: 'scatter',
            mode: 'lines',
            name: 'Discharge Current (A)',
            line: { color: '#F59E0B', width: 2 },
          },
        ],
        layout: {
          title: { text: 'Current Profile vs Time', font: { color: '#F8FAFC' } },
          xaxis: { title: { text: 'Time (seconds)', font: { color: '#94A3B8' } } },
          yaxis: { title: { text: 'Current (A)', font: { color: '#F59E0B' } } },
        },
      };
    }

    // Power & heat
    return {
      data: [
        {
          x: t,
          y: simResult.power_kw,
          type: 'scatter',
          mode: 'lines',
          name: 'Delivered Power (kW)',
          line: { color: '#8B5CF6', width: 2 },
        },
        {
          x: t,
          y: simResult.heat_loss_kw,
          type: 'scatter',
          mode: 'lines',
          name: 'Joulean Heat Loss (kW)',
          line: { color: '#EF4444', width: 2, dash: 'dot' },
        },
      ],
      layout: {
        title: { text: 'Pack Power & Internal Joule Losses', font: { color: '#F8FAFC' } },
        xaxis: { title: { text: 'Time (seconds)', font: { color: '#94A3B8' } } },
        yaxis: { title: { text: 'Power (kW)', font: { color: '#8B5CF6' } } },
      },
    };
  };

  const chart = getChartData();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Simulation Controls Panel */}
      <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Thevenin ECM Electrical Simulation Solver</h2>
              <p className="text-xs text-slate-400">
                Coupled OCV-SOC polynomial and 1-RC branch polarization dynamics for {seriesCount}S{parallelCount}P {activeCell?.name}
              </p>
            </div>
          </div>

          <button
            onClick={handleRunSim}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Solving Differential Equations...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Execute Electrical Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* Input Parameters Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Simulation Mode</label>
            <select
              value={mode}
              onChange={(e) => {
                const newMode = e.target.value;
                setMode(newMode);
                if (newMode === 'charge_cccv') {
                  setInitialSoc(0.1);
                  setTargetSoc(1.0);
                } else if (newMode === 'discharge_cc' || newMode === 'constant_power') {
                  setInitialSoc(1.0);
                  setTargetSoc(0.05);
                }
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-medium"
            >
              <option value="discharge_cc">Constant Current (CC) Discharge</option>
              <option value="charge_cccv">CC-CV Fast Charging</option>
              <option value="constant_power">Constant Power (kW) Discharge</option>
              <option value="drive_cycle">WLTP Class 3 Dynamic Drive Cycle</option>
            </select>
          </div>

          {mode === 'discharge_cc' || mode === 'charge_cccv' ? (
            <div>
              <label className="text-slate-400 block mb-1 font-mono uppercase">C-Rate Rate</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5.0"
                  value={cRate}
                  onChange={(e) => setCRate(parseFloat(e.target.value) || 1.0)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                />
                <span className="text-cyan-400 font-mono font-bold text-xs">{cRate}C</span>
              </div>
            </div>
          ) : mode === 'constant_power' ? (
            <div>
              <label className="text-slate-400 block mb-1 font-mono uppercase">Power (kW)</label>
              <input
                type="number"
                step="5"
                min="5"
                max="300"
                value={constantPowerKw}
                onChange={(e) => setConstantPowerKw(parseFloat(e.target.value) || 50.0)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
          ) : (
            <div>
              <label className="text-slate-400 block mb-1 font-mono uppercase">Drive Cycle</label>
              <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-300 font-mono">
                WLTP Class 3 (1800s)
              </div>
            </div>
          )}

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Initial SOC (%)</label>
            <input
              type="number"
              step="5"
              min="0"
              max="100"
              value={Math.round(initialSoc * 100)}
              onChange={(e) => setInitialSoc(Math.min(1.0, Math.max(0.0, (parseFloat(e.target.value) || 0) / 100.0)))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Cutoff SOC (%)</label>
            <input
              type="number"
              step="5"
              min="0"
              max="100"
              value={Math.round(targetSoc * 100)}
              onChange={(e) => setTargetSoc(Math.min(1.0, Math.max(0.0, (parseFloat(e.target.value) || 0) / 100.0)))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Solver Step (dt)</label>
            <select
              value={dt}
              onChange={(e) => setDt(parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            >
              <option value="0.5">0.5 sec (High Fidelity)</option>
              <option value="1.0">1.0 sec (Standard)</option>
              <option value="2.0">2.0 sec (Fast)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary Telemetry Cards */}
      {simResult && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-navy-panel border border-navy-card rounded-xl p-3 shadow-md">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Duration</span>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              {simResult.summary.duration_minutes} <span className="text-xs">min</span>
            </div>
          </div>

          <div className="bg-navy-panel border border-navy-card rounded-xl p-3 shadow-md">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Delivered Energy</span>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              {simResult.summary.delivered_energy_kwh} <span className="text-xs">kWh</span>
            </div>
          </div>

          <div className="bg-navy-panel border border-navy-card rounded-xl p-3 shadow-md">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Efficiency</span>
            <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">
              {simResult.summary.energy_efficiency_percent}%
            </div>
          </div>

          <div className="bg-navy-panel border border-navy-card rounded-xl p-3 shadow-md">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Peak Current</span>
            <div className="text-lg font-bold text-amber-300 font-mono mt-0.5">
              {simResult.summary.peak_current_a} <span className="text-xs">A</span>
            </div>
          </div>

          <div className="bg-navy-panel border border-navy-card rounded-xl p-3 shadow-md">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Peak Power</span>
            <div className="text-lg font-bold text-violet-400 font-mono mt-0.5">
              {simResult.summary.peak_power_kw} <span className="text-xs">kW</span>
            </div>
          </div>

          <div className="bg-navy-panel border border-navy-card rounded-xl p-3 shadow-md">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Joule Loss</span>
            <div className="text-lg font-bold text-rose-400 font-mono mt-0.5">
              {simResult.summary.total_heat_generated_mj} <span className="text-xs">MJ</span>
            </div>
          </div>

          <div className="bg-navy-panel border border-navy-card rounded-xl p-3 shadow-md">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Final Voltage</span>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              {simResult.summary.final_voltage_v} <span className="text-xs">V</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Charts Container */}
      <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-navy-card mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Simulation Time-Series Telemetry</h3>
          </div>

          {/* Chart Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
            <button
              onClick={() => setActiveChartTab('voltage')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeChartTab === 'voltage' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Voltage V(t)
            </button>
            <button
              onClick={() => setActiveChartTab('soc')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeChartTab === 'soc' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              SOC %(t)
            </button>
            <button
              onClick={() => setActiveChartTab('current')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeChartTab === 'current' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Current I(t)
            </button>
            <button
              onClick={() => setActiveChartTab('power')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeChartTab === 'power' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Power & Losses
            </button>
          </div>
        </div>

        {simResult ? (
          <div className="w-full">
            <PlotlyChart
              data={chart.data}
              layout={chart.layout}
              style={{ minHeight: '420px' }}
            />
          </div>
        ) : (
          <div className="py-24 text-center">
            <Zap className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
            <h4 className="text-base font-bold text-slate-300">No simulation runs executed yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Configure your simulation parameters above and click "Execute Electrical Simulation" to solve Thevenin ECM equations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Trophy,
  Scale,
  DollarSign,
  TrendingUp,
  Zap,
  ShieldCheck,
  ArrowRight,
  Filter
} from 'lucide-react';
import { OptimizationResult, OptimizationCandidate, Cell } from '../types';
import { runOptimizer } from '../services/api';
import { PlotlyChart } from '../components/PlotlyChart';

interface DesignOptimizationViewProps {
  onApplyDesign: (candidate: OptimizationCandidate) => void;
  allCells: Cell[];
}

export const DesignOptimizationView: React.FC<DesignOptimizationViewProps> = ({
  onApplyDesign,
  allCells,
}) => {
  const [targetV, setTargetV] = useState<number>(400.0);
  const [targetKwh, setTargetKwh] = useState<number>(75.0);
  const [maxWeight, setMaxWeight] = useState<number>(550.0);
  const [maxVol, setMaxVol] = useState<number>(350.0);
  const [preset, setPreset] = useState<string>('EV Passenger');
  const [prioritize, setPrioritize] = useState<string>('balanced');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const handleRunOptimizer = async () => {
    setIsLoading(true);
    try {
      const res = await runOptimizer({
        target_voltage_v: targetV,
        target_energy_kwh: targetKwh,
        max_allowed_weight_kg: maxWeight > 0 ? maxWeight : null,
        max_allowed_volume_l: maxVol > 0 ? maxVol : null,
        application_preset: preset,
        prioritize: prioritize,
      });
      setResult(res);
    } catch (err: any) {
      alert(err.message || 'Optimization failed');
    } finally {
      setIsLoading(false);
    }
  };

  const applyApplicationPreset = (name: string, v: number, kwh: number, wt: number, vol: number) => {
    setPreset(name);
    setTargetV(v);
    setTargetKwh(kwh);
    setMaxWeight(wt);
    setMaxVol(vol);
  };

  const getRadarChart = (candidate: OptimizationCandidate) => {
    const categories = ['Energy Density', 'Cost Efficiency', 'Safety & Durability', 'Power Delivery', 'Lightweight'];
    const values = [
      candidate.radar_metrics.energy_density,
      candidate.radar_metrics.cost_efficiency,
      candidate.radar_metrics.safety_durability,
      candidate.radar_metrics.power_delivery,
      candidate.radar_metrics.lightweight_score,
    ];

    return {
      data: [
        {
          type: 'scatterpolar' as const,
          r: [...values, values[0]],
          theta: [...categories, categories[0]],
          fill: 'toself' as const,
          fillcolor: 'rgba(0, 240, 255, 0.18)',
          line: { color: '#00F0FF', width: 2 },
          name: candidate.cell_name,
        },
      ],
      layout: {
        polar: {
          radialaxis: {
            visible: true,
            range: [0, 100],
            color: '#64748B',
            gridcolor: 'rgba(58, 80, 107, 0.4)',
          },
          angularaxis: {
            color: '#CBD5E1',
            gridcolor: 'rgba(58, 80, 107, 0.4)',
          },
          bgcolor: 'rgba(11, 19, 43, 0.6)',
        },
        margin: { l: 40, r: 40, t: 25, b: 25 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#94A3B8', size: 10 },
      },
    };
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Constraints & Optimizer Input Panel */}
      <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Multi-Objective Battery Pack Optimizer</h2>
              <p className="text-xs text-slate-400">
                Pareto trade-off evaluator solving S-P topologies and cell selection against physical constraints
              </p>
            </div>
          </div>

          <button
            onClick={handleRunOptimizer}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Evaluating Pareto Frontier...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Run Design Optimization</span>
              </>
            )}
          </button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px] uppercase mr-1">Target Application Presets:</span>
          <button
            onClick={() => applyApplicationPreset('EV Passenger', 400, 75, 550, 350)}
            className={`px-2.5 py-1 rounded border font-mono transition-colors cursor-pointer ${
              preset === 'EV Passenger' ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            EV Sedan (400V, 75kWh, 550kg)
          </button>
          <button
            onClick={() => applyApplicationPreset('Heavy Truck / Bus', 750, 280, 2200, 1600)}
            className={`px-2.5 py-1 rounded border font-mono transition-colors cursor-pointer ${
              preset === 'Heavy Truck / Bus' ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            Heavy Bus (750V, 280kWh, 2200kg)
          </button>
          <button
            onClick={() => applyApplicationPreset('Drone / UAV', 50, 2.5, 12, 10)}
            className={`px-2.5 py-1 rounded border font-mono transition-colors cursor-pointer ${
              preset === 'Drone / UAV' ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            UAV Drone (50V, 2.5kWh, 12kg)
          </button>
          <button
            onClick={() => applyApplicationPreset('Grid BESS', 1000, 500, 4800, 3800)}
            className={`px-2.5 py-1 rounded border font-mono transition-colors cursor-pointer ${
              preset === 'Grid BESS' ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            Grid BESS (1000V, 500kWh, 4800kg)
          </button>
        </div>

        {/* Sliders and Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-2 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Target Voltage (V)</label>
            <input
              type="number"
              step="10"
              value={targetV}
              onChange={(e) => setTargetV(parseFloat(e.target.value) || 400)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Target Energy (kWh)</label>
            <input
              type="number"
              step="1"
              value={targetKwh}
              onChange={(e) => setTargetKwh(parseFloat(e.target.value) || 75)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Max Weight (kg)</label>
            <input
              type="number"
              step="25"
              value={maxWeight}
              onChange={(e) => setMaxWeight(parseFloat(e.target.value) || 550)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Max Volume (L)</label>
            <input
              type="number"
              step="25"
              value={maxVol}
              onChange={(e) => setMaxVol(parseFloat(e.target.value) || 350)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Optimization Goal</label>
            <select
              value={prioritize}
              onChange={(e) => setPrioritize(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-medium"
            >
              <option value="balanced">Balanced Multi-Disciplinary</option>
              <option value="energy_density">Gravimetric Energy Density (Wh/kg)</option>
              <option value="low_cost">Minimum Pack BOM Cost ($)</option>
              <option value="safety_cycle_life">Extreme Safety & Cycle Life</option>
              <option value="peak_power">High Discharge & Peak Power</option>
            </select>
          </div>
        </div>
      </div>

      {result && result.recommended_design && (
        <div className="space-y-6">
          {/* Recommended Winner Hero Card */}
          <div className="bg-gradient-to-r from-navy-850 via-navy-800 to-navy-900 border-2 border-cyan-400/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider bg-cyan-400 text-slate-950 flex items-center gap-1 shadow-md">
                    <Trophy className="w-3.5 h-3.5 fill-slate-950" />
                    <span>#1 RECOMMENDED OPTIMAL DESIGN</span>
                  </span>
                  <span className="text-xs font-mono text-cyan-300">
                    Fitness Score: {result.recommended_design.overall_score} / 100
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {result.recommended_design.series_count}S {result.recommended_design.parallel_count}P Topology
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Powered by <strong className="text-cyan-300">{result.recommended_design.cell_name}</strong> ({result.recommended_design.chemistry}, {result.recommended_design.form_factor}).
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-mono">
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">SYSTEM VOLTAGE</span>
                    <span className="text-cyan-300 font-bold">{result.recommended_design.pack_voltage_v} V</span>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">STORED ENERGY</span>
                    <span className="text-emerald-400 font-bold">{result.recommended_design.pack_energy_kwh} kWh</span>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">PACK MASS</span>
                    <span className="text-white font-bold">{result.recommended_design.pack_mass_kg} kg</span>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">GRAV DENSITY</span>
                    <span className="text-amber-300 font-bold">{result.recommended_design.gravimetric_wh_kg} Wh/kg</span>
                  </div>
                </div>
              </div>

              {/* Spider Radar Chart & Apply Button */}
              <div className="flex flex-col items-center">
                <div className="w-64 h-60">
                  <PlotlyChart
                    data={getRadarChart(result.recommended_design).data}
                    layout={getRadarChart(result.recommended_design).layout}
                    style={{ minHeight: '240px' }}
                  />
                </div>
                <button
                  onClick={() => onApplyDesign(result.recommended_design!)}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-400/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply This Design To Active Pack</span>
                </button>
              </div>
            </div>
          </div>

          {/* All Candidates Ranking Table */}
          <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              All Pareto Candidate Configurations Evaluated ({result.all_candidates.length})
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-navy-card text-slate-400 text-[11px]">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Cell Name</th>
                    <th className="py-2.5 px-3">Chemistry</th>
                    <th className="py-2.5 px-3">Arrangement</th>
                    <th className="py-2.5 px-3">Voltage</th>
                    <th className="py-2.5 px-3">Energy</th>
                    <th className="py-2.5 px-3">Mass</th>
                    <th className="py-2.5 px-3">Wh/kg</th>
                    <th className="py-2.5 px-3">Est. Cost</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {result.all_candidates.map((cand, idx) => (
                    <tr
                      key={cand.cell_id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        idx === 0 ? 'bg-cyan-950/20 text-cyan-200' : 'text-slate-300'
                      }`}
                    >
                      <td className="py-3 px-3 font-bold">
                        {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                      </td>
                      <td className="py-3 px-3 font-sans font-semibold text-white">{cand.cell_name}</td>
                      <td className="py-3 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {cand.chemistry}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-cyan-300 font-bold">{cand.series_count}S {cand.parallel_count}P</td>
                      <td className="py-3 px-3">{cand.pack_voltage_v}V</td>
                      <td className="py-3 px-3 text-emerald-400">{cand.pack_energy_kwh}kWh</td>
                      <td className="py-3 px-3">{cand.pack_mass_kg}kg</td>
                      <td className="py-3 px-3 text-amber-300">{cand.gravimetric_wh_kg}</td>
                      <td className="py-3 px-3">${cand.estimated_cost_usd.toLocaleString()}</td>
                      <td className="py-3 px-3 font-bold text-cyan-400">{cand.overall_score}</td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onApplyDesign(cand)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 text-[11px] font-semibold border border-slate-700 cursor-pointer transition-colors"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

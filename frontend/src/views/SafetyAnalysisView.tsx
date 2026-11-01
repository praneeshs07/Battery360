import React, { useState } from 'react';
import {
  ShieldAlert,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Flame,
  Award,
  Layers,
  TrendingDown,
  Info
} from 'lucide-react';
import { Cell, PackMetrics, SafetyAuditResult } from '../types';
import { auditSafety } from '../services/api';
import { PlotlyChart } from '../components/PlotlyChart';

interface SafetyAnalysisViewProps {
  activeCell: Cell | null;
  packMetrics: PackMetrics | null;
  seriesCount: number;
  parallelCount: number;
  safetyResult: SafetyAuditResult | null;
  setSafetyResult: (res: SafetyAuditResult | null) => void;
}

export const SafetyAnalysisView: React.FC<SafetyAnalysisViewProps> = ({
  activeCell,
  packMetrics,
  seriesCount,
  parallelCount,
  safetyResult,
  setSafetyResult,
}) => {
  const [opTemp, setOpTemp] = useState<number>(35.0);
  const [ambientTemp, setAmbientTemp] = useState<number>(25.0);
  const [maxC, setMaxC] = useState<number>(3.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRunAudit = async () => {
    if (!activeCell) return;
    setIsLoading(true);
    try {
      const res = await auditSafety({
        cell_id: activeCell.id,
        series_count: seriesCount,
        parallel_count: parallelCount,
        operating_temp_c: opTemp,
        ambient_temp_c: ambientTemp,
        max_discharge_c_rate: maxC,
      });
      setSafetyResult(res);
    } catch (err: any) {
      alert(err.message || 'Safety audit failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getSohChart = () => {
    if (!safetyResult) return { data: [], layout: {} };
    return {
      data: [
        {
          x: safetyResult.soh_projection.cycles,
          y: safetyResult.soh_projection.nominal_soh_percent,
          type: 'scatter',
          mode: 'lines',
          name: 'Nominal Baseline (25°C, 1.0C)',
          line: { color: '#10B981', width: 2.5 },
        },
        {
          x: safetyResult.soh_projection.cycles,
          y: safetyResult.soh_projection.operating_soh_percent,
          type: 'scatter',
          mode: 'lines',
          name: `Operating Condition (${opTemp}°C, ${maxC}C)`,
          line: { color: '#EF4444', width: 2.5, dash: 'dot' },
        },
      ],
      layout: {
        title: { text: 'Arrhenius State-of-Health (SOH) Cycle Life Decay Projection', font: { color: '#F8FAFC' } },
        xaxis: { title: { text: 'Equivalent Full Cycles (EFC)', font: { color: '#94A3B8' } } },
        yaxis: { title: { text: 'Remaining Capacity SOH (%)', font: { color: '#F8FAFC' } }, range: [60, 102] },
        shapes: [
          {
            type: 'line',
            x0: 0,
            x1: 2500,
            y0: 80,
            y1: 80,
            line: { color: '#F59E0B', width: 1.5, dash: 'dash' },
          },
        ],
      },
    };
  };

  const sohChart = getSohChart();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Controls Container */}
      <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Battery Pack Safety Qualification & Aging Audit</h2>
              <p className="text-xs text-slate-400">
                Short-circuit fault calculations, thermal runaway barrier sizing, and Arrhenius cycle degradation modeling
              </p>
            </div>
          </div>

          <button
            onClick={handleRunAudit}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Auditing Safety Matrices...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Run Safety & Aging Audit</span>
              </>
            )}
          </button>
        </div>

        {/* Input Parameters Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Operating Temperature (°C)</label>
            <input
              type="number"
              step="1"
              value={opTemp}
              onChange={(e) => setOpTemp(parseFloat(e.target.value) || 35.0)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Ambient Temperature (°C)</label>
            <input
              type="number"
              step="1"
              value={ambientTemp}
              onChange={(e) => setAmbientTemp(parseFloat(e.target.value) || 25.0)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase">Worst-Case Discharge C-Rate</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="10.0"
              value={maxC}
              onChange={(e) => setMaxC(parseFloat(e.target.value) || 3.0)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
            />
          </div>
        </div>
      </div>

      {safetyResult && (
        <div className="space-y-6">
          {/* Composite Scorecard Banner */}
          <div className="bg-gradient-to-r from-navy-850 to-navy-900 border border-navy-card rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-slate-950 border-2 border-cyan-400 flex flex-col items-center justify-center shadow-lg shadow-cyan-500/20">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Grade</span>
                <span className="text-2xl font-black text-cyan-300 font-mono">
                  {safetyResult.safety_scorecard.grade.split(' ')[0]}
                </span>
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  OVERALL SAFETY INDEX
                </span>
                <h3 className="text-2xl font-bold text-white">
                  Score: {safetyResult.safety_scorecard.overall_safety_score} / 100
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Evaluated across thermal headroom, C-rate compliance, short-circuit protection, and chemical stability.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">THERMAL</span>
                <span className="text-emerald-400 font-bold">{safetyResult.safety_scorecard.thermal_score} / 30</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">C-RATE</span>
                <span className="text-cyan-300 font-bold">{safetyResult.safety_scorecard.c_rate_score} / 25</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">CHEMISTRY</span>
                <span className="text-amber-300 font-bold">{safetyResult.safety_scorecard.chemistry_score} / 20</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">SHORT CIRCUIT</span>
                <span className="text-violet-400 font-bold">{safetyResult.safety_scorecard.short_circuit_score} / 25</span>
              </div>
            </div>
          </div>

          {/* Fault & Barrier Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Short Circuit Card */}
            <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-card">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Dead Bolted Short-Circuit Analysis</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">PEAK FAULT CURRENT</span>
                  <div className="text-xl font-bold text-rose-400 mt-1">
                    {safetyResult.short_circuit.peak_short_circuit_current_a.toLocaleString()} A
                  </div>
                  <span className="text-[10px] text-slate-500">@ 2mΩ external bolt short</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">SHORT CIRCUIT POWER</span>
                  <div className="text-xl font-bold text-amber-300 mt-1">
                    {safetyResult.short_circuit.short_circuit_power_mw} MW
                  </div>
                  <span className="text-[10px] text-slate-500">Instantaneous discharge</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">ADIABATIC ACTION INTEGRAL (I²t)</span>
                  <div className="text-xl font-bold text-cyan-300 mt-1">
                    {safetyResult.short_circuit.adiabatic_i2t_action_integral_a2s.toLocaleString()} A²s
                  </div>
                  <span className="text-[10px] text-slate-500">Minimum fuse melting rating</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">CLEARANCE TIME LIMIT</span>
                  <div className="text-xl font-bold text-white mt-1">
                    &lt; {safetyResult.short_circuit.fuse_clearing_time_ms} ms
                  </div>
                  <span className="text-[10px] text-slate-500">Pyro-switch / fast fuse</span>
                </div>
              </div>
            </div>

            {/* Thermal Propagation Barrier Card */}
            <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-card">
                <Flame className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">Thermal Propagation Barrier Audit</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">PROPAGATION RISK</span>
                  <div className={`text-xl font-bold mt-1 ${
                    safetyResult.thermal_propagation.propagation_risk_level === 'High' ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {safetyResult.thermal_propagation.propagation_risk_level}
                  </div>
                  <span className="text-[10px] text-slate-500">{activeCell?.chemistry} chemistry</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">RECOMMENDED BARRIER</span>
                  <div className="text-xl font-bold text-cyan-300 mt-1">
                    {safetyResult.thermal_propagation.recommended_barrier_thickness_mm} mm
                  </div>
                  <span className="text-[10px] text-slate-500">Aerogel / ceramic insulation</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">PEAK VENTING TEMP</span>
                  <div className="text-xl font-bold text-amber-300 mt-1">
                    {safetyResult.thermal_propagation.max_runaway_temperature_c} °C
                  </div>
                  <span className="text-[10px] text-slate-500">Thermal runaway core peak</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">FIRE SAFETY SPEC</span>
                  <div className="text-sm font-bold text-white mt-1 truncate">
                    {safetyResult.thermal_propagation.insulation_flammability_standard}
                  </div>
                  <span className="text-[10px] text-slate-500">Flame retardance cert</span>
                </div>
              </div>
            </div>
          </div>

          {/* SOH Cycle Life Plot */}
          <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-navy-card">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Degradation & Cycle Life SOH Projection</h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-emerald-400">
                  80% SOH Nominal: <strong>{safetyResult.soh_projection.projected_cycles_to_80_nominal} cycles</strong>
                </span>
                <span className="text-rose-400">
                  80% SOH Operating: <strong>{safetyResult.soh_projection.projected_cycles_to_80_operating} cycles</strong>
                </span>
              </div>
            </div>

            <PlotlyChart
              data={sohChart.data}
              layout={sohChart.layout}
              style={{ minHeight: '380px' }}
            />
          </div>

          {/* Recommendations Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Automated Engineering Recommendations
            </h4>
            <ul className="space-y-2">
              {safetyResult.safety_scorecard.engineering_recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <span className="text-cyan-400 font-mono font-bold mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

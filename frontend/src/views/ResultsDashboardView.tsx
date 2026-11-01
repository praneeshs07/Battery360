import React, { useState } from 'react';
import {
  BarChart3,
  Layers,
  Trash2,
  CheckCircle2,
  Download,
  Scale,
  Zap,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Eye
} from 'lucide-react';
import { PackConfiguration, Cell } from '../types';
import { deleteConfiguration } from '../services/api';
import { PlotlyChart } from '../components/PlotlyChart';

interface ResultsDashboardViewProps {
  savedConfigs: PackConfiguration[];
  allCells: Cell[];
  onSelectConfig: (cfg: PackConfiguration) => void;
  onRefreshConfigs: () => void;
}

export const ResultsDashboardView: React.FC<ResultsDashboardViewProps> = ({
  savedConfigs,
  allCells,
  onSelectConfig,
  onRefreshConfigs,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    savedConfigs.slice(0, 3).map((c) => c.id)
  );

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((item) => item !== id));
      }
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds([...selectedIds, id]);
      } else {
        alert('You can compare a maximum of 4 configurations side-by-side.');
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete configuration ${name}?`)) return;
    try {
      await deleteConfiguration(id);
      setSelectedIds(selectedIds.filter((item) => item !== id));
      onRefreshConfigs();
    } catch (err: any) {
      alert(err.message || 'Error deleting configuration');
    }
  };

  const comparedConfigs = savedConfigs.filter((c) => selectedIds.includes(c.id));

  // Comparative Plotly Bar Chart Data
  const getComparisonBarChart = () => {
    if (comparedConfigs.length === 0) return { data: [], layout: {} };

    const names = comparedConfigs.map((c) => c.name);
    const gravimetricDensities = comparedConfigs.map((c) => c.metrics?.gravimetric_energy_density_wh_kg || 0);
    const powers = comparedConfigs.map((c) => c.metrics?.continuous_power_kw || 0);

    return {
      data: [
        {
          x: names,
          y: gravimetricDensities,
          name: 'Gravimetric Density (Wh/kg)',
          type: 'bar',
          marker: { color: '#00F0FF' },
        },
        {
          x: names,
          y: powers,
          name: 'Continuous Power (kW)',
          type: 'bar',
          marker: { color: '#8B5CF6' },
        },
      ],
      layout: {
        title: { text: 'Key Performance Metric Benchmark', font: { color: '#F8FAFC' } },
        barmode: 'group',
        xaxis: { color: '#94A3B8' },
        yaxis: { title: { text: 'Magnitude', font: { color: '#94A3B8' } } },
      },
    };
  };

  const barChart = getComparisonBarChart();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Multi-Configuration Comparative Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Compare stored pack architectures across gravimetric density, continuous power, thermal burden, and BOM economics.
          </p>
        </div>

        <div className="text-xs font-mono text-cyan-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          Comparing {comparedConfigs.length} / {savedConfigs.length} Designs
        </div>
      </div>

      {/* Configuration Selectors Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-slate-400 uppercase mr-1">Select to Compare:</span>
        {savedConfigs.map((cfg) => {
          const isSelected = selectedIds.includes(cfg.id);
          return (
            <button
              key={cfg.id}
              onClick={() => toggleSelect(cfg.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-slate-600'}`} />
              <span>{cfg.name}</span>
            </button>
          );
        })}
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {comparedConfigs.map((cfg) => (
          <div
            key={cfg.id}
            className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-cyan-500/50 transition-all relative"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                    {cfg.target_application}
                  </span>
                  <h3 className="text-base font-bold text-white leading-tight mt-0.5">{cfg.name}</h3>
                </div>
                <button
                  onClick={() => handleDelete(cfg.id, cfg.name)}
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Delete configuration"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 mb-4 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Topology:</span>
                  <span className="text-cyan-300 font-bold">{cfg.series_count}S {cfg.parallel_count}P ({cfg.module_count} Mods)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Cell:</span>
                  <span className="text-white truncate max-w-[150px]">{cfg.cell_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Nominal Voltage:</span>
                  <span className="text-white font-bold">{cfg.metrics?.nominal_voltage} V</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Capacity:</span>
                  <span className="text-white">{cfg.metrics?.capacity_ah} Ah</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Stored Energy:</span>
                  <span className="text-emerald-400 font-bold">{cfg.metrics?.stored_energy_kwh} kWh</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Total Pack Mass:</span>
                  <span className="text-white">{cfg.metrics?.total_pack_mass_kg} kg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Gravimetric Density:</span>
                  <span className="text-amber-300 font-bold">{cfg.metrics?.gravimetric_energy_density_wh_kg} Wh/kg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Continuous Power:</span>
                  <span className="text-violet-400 font-bold">{cfg.metrics?.continuous_power_kw} kW</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Estimated Pack BOM:</span>
                  <span className="text-teal-300 font-bold">${cfg.metrics?.estimated_total_pack_cost_usd.toLocaleString()}</span>
                </div>
              </div>

              {cfg.notes && (
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                  {cfg.notes}
                </p>
              )}
            </div>

            <button
              onClick={() => onSelectConfig(cfg)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Load Into Active Simulation Twin</span>
            </button>
          </div>
        ))}
      </div>

      {/* Comparative Plotly Visualization */}
      {comparedConfigs.length > 0 && (
        <div className="bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl">
          <PlotlyChart
            data={barChart.data}
            layout={barChart.layout}
            style={{ minHeight: '380px' }}
          />
        </div>
      )}
    </div>
  );
};

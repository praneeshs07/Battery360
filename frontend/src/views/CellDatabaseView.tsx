import React, { useState } from 'react';
import {
  Database,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Info,
  Layers,
  Thermometer,
  Zap,
  Scale,
  RefreshCw,
  X
} from 'lucide-react';
import { Cell } from '../types';
import { createCell, deleteCell } from '../services/api';

interface CellDatabaseViewProps {
  cells: Cell[];
  activeCell: Cell | null;
  onSelectCell: (cell: Cell) => void;
  onRefreshCells: () => void;
}

const CHEMISTRIES = ['ALL', 'NMC', 'LFP', 'NCA', 'LTO', 'Solid-State', 'Sodium-Ion'];

export const CellDatabaseView: React.FC<CellDatabaseViewProps> = ({
  cells,
  activeCell,
  onSelectCell,
  onRefreshCells,
}) => {
  const [selectedChem, setSelectedChem] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Custom Cell Form State
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: 'Custom Lab',
    chemistry: 'NMC-811',
    form_factor: 'Cylindrical',
    nominal_voltage: 3.7,
    min_voltage: 2.8,
    max_voltage: 4.2,
    capacity_ah: 5.0,
    internal_resistance_mohm: 18.0,
    continuous_c_rate: 2.5,
    peak_c_rate: 5.0,
    weight_g: 70.0,
    specific_heat_cp: 1050.0,
    thermal_conductivity: 1.2,
    entropic_coeff_mv_per_k: -0.15,
    max_temp_c: 60.0,
    thermal_runaway_temp_c: 145.0,
    nominal_cycle_life: 1500,
    estimated_cost_usd: 5.0,
    description: '',
  });

  const filteredCells = cells.filter((c) => {
    const matchesChem = selectedChem === 'ALL' || c.chemistry.toUpperCase().includes(selectedChem.toUpperCase());
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.chemistry.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChem && matchesSearch;
  });

  const handleCreateCell = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const newCell = await createCell(formData);
      setIsModalOpen(false);
      onRefreshCells();
      onSelectCell(newCell);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create cell');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCell = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete custom cell: ${name}?`)) return;
    try {
      await deleteCell(id);
      onRefreshCells();
    } catch (err: any) {
      alert(err.message || 'Error deleting cell');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-panel border border-navy-card p-4 rounded-xl shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          {CHEMISTRIES.map((chem) => (
            <button
              key={chem}
              onClick={() => setSelectedChem(chem)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                selectedChem === chem
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {chem}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search cells..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Cell</span>
          </button>
        </div>
      </div>

      {/* Cells Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCells.map((cell) => {
          const isSelected = activeCell?.id === cell.id;
          return (
            <div
              key={cell.id}
              className={`bg-navy-panel border rounded-xl p-5 shadow-xl flex flex-col justify-between transition-all relative ${
                isSelected
                  ? 'border-cyan-400 ring-2 ring-cyan-400/20 bg-slate-900/90'
                  : 'border-navy-card hover:border-slate-600'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-2.5 right-4 bg-cyan-400 text-slate-950 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>ACTIVE CELL</span>
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                      {cell.manufacturer}
                    </span>
                    <h3 className="text-base font-bold text-white leading-tight">{cell.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {cell.chemistry}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
                  <span>Form: <strong className="text-slate-200">{cell.form_factor}</strong></span>
                  <span>•</span>
                  <span>Cost: <strong className="text-teal-300">${cell.estimated_cost_usd}</strong></span>
                </div>

                {/* Metrics Table */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 text-xs font-mono mb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block">NOM VOLTAGE</span>
                    <span className="text-cyan-300 font-bold">{cell.nominal_voltage} V</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">CAPACITY</span>
                    <span className="text-white font-bold">{cell.capacity_ah} Ah</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">ENERGY</span>
                    <span className="text-emerald-400 font-bold">{cell.energy_wh} Wh</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">ESR RESIST</span>
                    <span className="text-white font-bold">{cell.internal_resistance_mohm} mΩ</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">CONT C-RATE</span>
                    <span className="text-white font-bold">{cell.continuous_c_rate}C</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">CYCLE LIFE</span>
                    <span className="text-amber-300 font-bold">{cell.nominal_cycle_life}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">MASS</span>
                    <span className="text-white font-bold">{cell.weight_g} g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">GRAV DENSITY</span>
                    <span className="text-cyan-300 font-bold">{Math.round((cell.energy_wh / (cell.weight_g / 1000)))} Wh/kg</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">RUNAWAY T</span>
                    <span className="text-rose-400 font-bold">{cell.thermal_runaway_temp_c}°C</span>
                  </div>
                </div>

                {cell.description && (
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                    {cell.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => onSelectCell(cell)}
                  disabled={isSelected}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60 cursor-default'
                      : 'bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 border border-slate-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isSelected ? 'Active Digital Twin' : 'Select for Pack Design'}</span>
                </button>

                {cell.is_preset === 0 && (
                  <button
                    onClick={() => handleDeleteCell(cell.id, cell.name)}
                    className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition-colors cursor-pointer"
                    title="Delete custom cell"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredCells.length === 0 && (
        <div className="text-center py-16 bg-navy-panel border border-navy-card rounded-xl">
          <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-300">No battery cells match your query</h4>
          <p className="text-xs text-slate-500 mt-1">Try selecting a different chemistry tab or clearing your search filter.</p>
        </div>
      )}

      {/* Add Custom Cell Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-navy-card rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-navy-card mb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Define Custom Electrochemical Cell</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateCell} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Cell Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Apex 5000mAh Ultra"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Manufacturer</label>
                  <input
                    type="text"
                    required
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g. NextGen Cell Labs"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Chemistry</label>
                  <select
                    value={formData.chemistry}
                    onChange={(e) => setFormData({ ...formData, chemistry: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="NMC-811">NMC-811 (High Energy)</option>
                    <option value="LFP">LFP (Lithium Iron Phosphate)</option>
                    <option value="NCA">NCA (High Power)</option>
                    <option value="LTO">LTO (Ultra-Fast Charging)</option>
                    <option value="Solid-State">Solid-State Li-Metal</option>
                    <option value="Sodium-Ion">Sodium-Ion (Abundant)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Form Factor</label>
                  <select
                    value={formData.form_factor}
                    onChange={(e) => setFormData({ ...formData, form_factor: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Cylindrical">Cylindrical (18650 / 21700 / 4680)</option>
                    <option value="Prismatic">Prismatic Can</option>
                    <option value="Pouch">Pouch / Polymer</option>
                    <option value="Blade">Blade CTP</option>
                  </select>
                </div>
              </div>

              {/* Electrical Parameters */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2">
                  Electrical & Voltage Limits
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Nominal V</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.nominal_voltage}
                      onChange={(e) => setFormData({ ...formData, nominal_voltage: parseFloat(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Capacity (Ah)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.capacity_ah}
                      onChange={(e) => setFormData({ ...formData, capacity_ah: parseFloat(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Min Cutoff V</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.min_voltage}
                      onChange={(e) => setFormData({ ...formData, min_voltage: parseFloat(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Max Charge V</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.max_voltage}
                      onChange={(e) => setFormData({ ...formData, max_voltage: parseFloat(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">ESR (mΩ)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.internal_resistance_mohm}
                      onChange={(e) => setFormData({ ...formData, internal_resistance_mohm: parseFloat(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Cont C-Rate</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.continuous_c_rate}
                      onChange={(e) => setFormData({ ...formData, continuous_c_rate: parseFloat(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Unit Mass (g)</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={formData.weight_g}
                      onChange={(e) => setFormData({ ...formData, weight_g: parseFloat(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Cycle Life</label>
                    <input
                      type="number"
                      required
                      value={formData.nominal_cycle_life}
                      onChange={(e) => setFormData({ ...formData, nominal_cycle_life: parseInt(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Thermal & Cost */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Runaway Onset (°C)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.thermal_runaway_temp_c}
                    onChange={(e) => setFormData({ ...formData, thermal_runaway_temp_c: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Entropic Coeff (mV/K)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.entropic_coeff_mv_per_k}
                    onChange={(e) => setFormData({ ...formData, entropic_coeff_mv_per_k: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Estimated Cost ($)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.estimated_cost_usd}
                    onChange={(e) => setFormData({ ...formData, estimated_cost_usd: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 text-xs">Description & Application Notes</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter cell test laboratory notes, intended target application..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-card">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-md shadow-cyan-400/20 cursor-pointer"
                >
                  {isSubmitting ? 'Registering...' : 'Save Cell to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

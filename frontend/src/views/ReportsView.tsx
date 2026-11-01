import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  RotateCcw,
  CheckCircle2,
  Layers,
  Zap,
  Flame,
  ShieldCheck,
  DollarSign,
  Package
} from 'lucide-react';
import { Cell, PackMetrics, EngineeringReport } from '../types';
import { generateEngineeringReport } from '../services/api';

interface ReportsViewProps {
  activeCell: Cell | null;
  packMetrics: PackMetrics | null;
  seriesCount: number;
  parallelCount: number;
  moduleCount: number;
  overheadFactor: number;
  electricalSummary?: any;
  thermalSummary?: any;
  safetySummary?: any;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  activeCell,
  packMetrics,
  seriesCount,
  parallelCount,
  moduleCount,
  overheadFactor,
  electricalSummary,
  thermalSummary,
  safetySummary,
}) => {
  const [report, setReport] = useState<EngineeringReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchReport = async () => {
    if (!activeCell) return;
    setIsLoading(true);
    try {
      const data = await generateEngineeringReport({
        cell_id: activeCell.id,
        series_count: seriesCount,
        parallel_count: parallelCount,
        module_count: moduleCount,
        overhead_mass_factor: overheadFactor,
        electrical_summary: electricalSummary,
        thermal_summary: thermalSummary,
        safety_summary: safetySummary,
      });
      setReport(data);
    } catch (err: any) {
      alert(err.message || 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeCell?.id, seriesCount, parallelCount, moduleCount]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.report_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Action Controls (hidden in print) */}
      <div className="print:hidden bg-navy-panel border border-navy-card rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Automated Engineering Dossier & Bill of Materials (BOM)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate formal technical specifications and itemized manufacturing cost schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReport}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>

          <button
            onClick={handleDownloadJson}
            disabled={!report}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!report}
            className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-md shadow-cyan-400/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Sheet */}
      {report && (
        <div className="bg-navy-panel border border-navy-card rounded-2xl p-8 shadow-2xl space-y-8 text-slate-200 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
          {/* Report Letterhead Header */}
          <div className="border-b-2 border-cyan-400 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-extrabold text-2xl tracking-wider text-white print:text-black">BATTERY</span>
                <span className="font-black text-2xl text-cyan-400 print:text-blue-600">360</span>
                <span className="text-xs font-mono uppercase bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 ml-2 print:border-slate-300 print:bg-slate-100 print:text-slate-800">
                  Engineering Qualification Dossier
                </span>
              </div>
              <h1 className="text-lg font-bold text-white print:text-black">{report.title}</h1>
              <p className="text-xs text-slate-400 print:text-slate-600 font-mono mt-1">
                Report Identifier: {report.report_id} • Generated: {report.generated_at}
              </p>
            </div>

            <div className="text-right text-xs font-mono text-slate-400 print:text-slate-600">
              <span className="text-cyan-400 print:text-blue-600 font-bold block">CONFIDENTIAL DESIGN</span>
              <span>ISO 6469 / UL 2580 Target</span>
            </div>
          </div>

          {/* Executive Summary Metrics Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400 print:text-blue-600">
              1. Executive Architecture Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-950/80 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-lg">
                <span className="text-[10px] text-slate-400 print:text-slate-500 block">TOPOLOGY</span>
                <span className="text-white print:text-black font-bold text-sm">
                  {report.executive_summary.pack_configuration}
                </span>
              </div>
              <div className="p-3 bg-slate-950/80 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-lg">
                <span className="text-[10px] text-slate-400 print:text-slate-500 block">NOMINAL VOLTAGE</span>
                <span className="text-cyan-300 print:text-blue-600 font-bold text-sm">
                  {report.executive_summary.nominal_voltage_v} V
                </span>
              </div>
              <div className="p-3 bg-slate-950/80 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-lg">
                <span className="text-[10px] text-slate-400 print:text-slate-500 block">ENERGY CAPACITY</span>
                <span className="text-emerald-400 print:text-green-700 font-bold text-sm">
                  {report.executive_summary.stored_energy_kwh} kWh
                </span>
              </div>
              <div className="p-3 bg-slate-950/80 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-lg">
                <span className="text-[10px] text-slate-400 print:text-slate-500 block">GRAVIMETRIC DENSITY</span>
                <span className="text-amber-300 print:text-amber-700 font-bold text-sm">
                  {report.executive_summary.gravimetric_energy_density_wh_kg} Wh/kg
                </span>
              </div>
            </div>
          </div>

          {/* Cell & Physical Specifications Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400 print:text-blue-600">
              2. Electrochemical Cell & Pack Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-950/80 print:bg-slate-50 p-4 rounded-xl border border-slate-800 print:border-slate-300 space-y-2">
                <h4 className="font-bold text-slate-300 print:text-slate-900 pb-1 border-b border-slate-800 print:border-slate-300">
                  Cell Baseline Parameters
                </h4>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400 print:text-slate-600">Cell Name:</span>
                  <span className="text-white print:text-black font-semibold">{report.cell_datasheet.name}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400 print:text-slate-600">Manufacturer / Form:</span>
                  <span className="text-white print:text-black">{report.cell_datasheet.manufacturer} ({report.cell_datasheet.form_factor})</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400 print:text-slate-600">Chemistry:</span>
                  <span className="text-cyan-300 print:text-blue-600 font-bold">{report.cell_datasheet.chemistry}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400 print:text-slate-600">Nominal Voltage:</span>
                  <span className="text-white print:text-black">{report.cell_datasheet.nominal_voltage_v} V</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400 print:text-slate-600">Rated Capacity:</span>
                  <span className="text-white print:text-black">{report.cell_datasheet.capacity_ah} Ah</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400 print:text-slate-600">Nominal Cycle Life:</span>
                  <span className="text-emerald-400 print:text-green-700">{report.cell_datasheet.cycle_life_rating} cycles</span>
                </div>
              </div>

              <div className="bg-slate-950/80 print:bg-slate-50 p-4 rounded-xl border border-slate-800 print:border-slate-300 space-y-2">
                <h4 className="font-bold text-slate-300 print:text-slate-900 pb-1 border-b border-slate-800 print:border-slate-300">
                  System Sizing Metrics
                </h4>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400 print:text-slate-600">Total Cell Count:</span>
                  <span className="text-white print:text-black font-semibold">{report.pack_specifications.total_cell_count}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400 print:text-slate-600">Cells Net Mass:</span>
                  <span className="text-white print:text-black">{report.pack_specifications.cell_mass_kg} kg</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400 print:text-slate-600">Total Pack Mass:</span>
                  <span className="text-white print:text-black font-bold">{report.pack_specifications.total_pack_mass_kg} kg</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400 print:text-slate-600">Internal Resistance:</span>
                  <span className="text-white print:text-black">{report.pack_specifications.internal_resistance_total_mohm} mΩ</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400 print:text-slate-600">Continuous Power:</span>
                  <span className="text-cyan-300 print:text-blue-600 font-bold">{report.pack_specifications.continuous_power_kw} kW</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400 print:text-slate-600">Peak Discharge Power:</span>
                  <span className="text-violet-400 print:text-purple-700 font-bold">{report.pack_specifications.peak_power_kw} kW</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill of Materials (BOM) Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400 print:text-blue-600">
                3. Manufacturing Bill of Materials (BOM) Roll-up
              </h3>
              <span className="text-xs font-mono text-emerald-400 print:text-green-700 font-bold">
                Total BOM: ${report.bill_of_materials.total_bom_cost_usd.toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border border-slate-800 print:border-slate-300 rounded-lg">
                <thead className="bg-slate-900 print:bg-slate-100 text-slate-400 print:text-slate-700">
                  <tr className="border-b border-slate-800 print:border-slate-300 text-[11px]">
                    <th className="py-2 px-3">Subsystem Category</th>
                    <th className="py-2 px-3">Component Item Description</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3">Unit</th>
                    <th className="py-2 px-3 text-right">Unit ($)</th>
                    <th className="py-2 px-3 text-right">Extended Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-300">
                  {report.bill_of_materials.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 print:hover:bg-transparent">
                      <td className="py-2.5 px-3 text-cyan-300 print:text-blue-700 font-semibold">{item.category}</td>
                      <td className="py-2.5 px-3 text-white print:text-black font-sans">{item.item}</td>
                      <td className="py-2.5 px-3 text-right">{item.quantity.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-slate-400 print:text-slate-600">{item.unit}</td>
                      <td className="py-2.5 px-3 text-right">${item.unit_cost_usd.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white print:text-black">
                        ${item.total_cost_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-950 print:bg-slate-100 font-bold text-white print:text-black">
                    <td colSpan={5} className="py-3 px-3 text-right uppercase">
                      Total Calculated Pack Production Cost:
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 print:text-green-700 text-sm">
                      ${report.bill_of_materials.total_bom_cost_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Qualification Footer */}
          <div className="pt-6 border-t border-slate-800 print:border-slate-300 text-xs text-slate-400 print:text-slate-600 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span>Certification Baseline: UN 38.3 Lithium Transport Safety • ISO 6469-1 Electric Powertrains</span>
            <span className="font-mono">Approved for Engineering Prototyping</span>
          </div>
        </div>
      )}
    </div>
  );
};

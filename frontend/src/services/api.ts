import {
  Cell, PackMetrics, PackConfiguration, ElectricalSimResult,
  ThermalSimResult, SafetyAuditResult, OptimizationResult, EngineeringReport
} from '../types';

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchCells(chemistry?: string, search?: string): Promise<Cell[]> {
  const params = new URLSearchParams();
  if (chemistry && chemistry !== 'ALL') params.append('chemistry', chemistry);
  if (search) params.append('search', search);
  const res = await fetch(`${API_BASE}/cells?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch cells');
  return res.json();
}

export async function createCell(cellData: Partial<Cell>): Promise<Cell> {
  const res = await fetch(`${API_BASE}/cells`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cellData),
  });
  if (!res.ok) throw new Error('Failed to create custom cell');
  return res.json();
}

export async function deleteCell(cellId: string) {
  const res = await fetch(`${API_BASE}/cells/${cellId}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to delete cell');
  }
  return res.json();
}

export async function calculatePack(payload: {
  cell_id?: string;
  series_count: number;
  parallel_count: number;
  module_count: number;
  overhead_mass_factor: number;
}): Promise<{ cell: Cell; metrics: PackMetrics }> {
  const res = await fetch(`${API_BASE}/pack/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to calculate pack');
  return res.json();
}

export async function fetchConfigurations(): Promise<PackConfiguration[]> {
  const res = await fetch(`${API_BASE}/configurations`);
  if (!res.ok) throw new Error('Failed to fetch configurations');
  return res.json();
}

export async function saveConfiguration(config: Partial<PackConfiguration>) {
  const res = await fetch(`${API_BASE}/configurations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to save configuration');
  return res.json();
}

export async function deleteConfiguration(configId: string) {
  const res = await fetch(`${API_BASE}/configurations/${configId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete configuration');
  return res.json();
}

export async function simulateElectrical(payload: {
  cell_id?: string;
  series_count: number;
  parallel_count: number;
  mode: string;
  c_rate: number;
  constant_power_kw?: number;
  initial_soc: number;
  target_soc: number;
  ambient_temp_c?: number;
  time_step_sec?: number;
}): Promise<ElectricalSimResult> {
  const res = await fetch(`${API_BASE}/simulate/electrical`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to run electrical simulation');
  return res.json();
}

export async function simulateThermal(payload: {
  cell_id?: string;
  series_count: number;
  parallel_count: number;
  discharge_c_rate: number;
  initial_temp_c: number;
  ambient_temp_c: number;
  cooling_mode: string;
  coolant_temp_c: number;
  flow_rate_lpm: number;
  sim_duration_sec: number;
}): Promise<ThermalSimResult> {
  const res = await fetch(`${API_BASE}/simulate/thermal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to run thermal simulation');
  return res.json();
}

export async function auditSafety(payload: {
  cell_id: string;
  series_count: number;
  parallel_count: number;
  operating_temp_c: number;
  ambient_temp_c: number;
  max_discharge_c_rate: number;
}): Promise<SafetyAuditResult> {
  const res = await fetch(`${API_BASE}/safety/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to run safety audit');
  return res.json();
}

export async function runOptimizer(payload: {
  target_voltage_v: number;
  target_energy_kwh: number;
  max_allowed_weight_kg?: number | null;
  max_allowed_volume_l?: number | null;
  application_preset: string;
  prioritize: string;
}): Promise<OptimizationResult> {
  const res = await fetch(`${API_BASE}/optimizer/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to run optimizer');
  return res.json();
}

export async function generateEngineeringReport(payload: {
  cell_id: string;
  series_count: number;
  parallel_count: number;
  module_count: number;
  overhead_mass_factor: number;
  electrical_summary?: any;
  thermal_summary?: any;
  safety_summary?: any;
}): Promise<EngineeringReport> {
  const res = await fetch(`${API_BASE}/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to generate report');
  return res.json();
}

export async function resetDemoDatabase() {
  const res = await fetch(`${API_BASE}/system/reset-demo`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset demo database');
  return res.json();
}

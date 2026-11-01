import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { CellDatabaseView } from './views/CellDatabaseView';
import { BatteryConfigurationView } from './views/BatteryConfigurationView';
import { ElectricalSimulationView } from './views/ElectricalSimulationView';
import { ThermalSimulationView } from './views/ThermalSimulationView';
import { SafetyAnalysisView } from './views/SafetyAnalysisView';
import { DesignOptimizationView } from './views/DesignOptimizationView';
import { ResultsDashboardView } from './views/ResultsDashboardView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';

import {
  Cell,
  PackMetrics,
  PackConfiguration,
  ElectricalSimResult,
  ThermalSimResult,
  SafetyAuditResult,
  OptimizationCandidate,
} from './types';

import {
  fetchHealth,
  fetchCells,
  calculatePack,
  fetchConfigurations,
  simulateElectrical,
  simulateThermal,
} from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(true);

  // Electrochemical & Pack State
  const [cells, setCells] = useState<Cell[]>([]);
  const [activeCell, setActiveCell] = useState<Cell | null>(null);
  const [seriesCount, setSeriesCount] = useState<number>(96);
  const [parallelCount, setParallelCount] = useState<number>(44);
  const [moduleCount, setModuleCount] = useState<number>(8);
  const [overheadFactor, setOverheadFactor] = useState<number>(1.25);
  const [packagingType, setPackagingType] = useState<string>('Structural Enclosure');
  const [coolingType, setCoolingType] = useState<string>('Liquid Chiller Loop');
  const [targetApp, setTargetApp] = useState<string>('EV Passenger');
  const [packMetrics, setPackMetrics] = useState<PackMetrics | null>(null);

  // Saved Configurations
  const [savedConfigs, setSavedConfigs] = useState<PackConfiguration[]>([]);

  // Simulation State Cache
  const [electricalSimResult, setElectricalSimResult] = useState<ElectricalSimResult | null>(null);
  const [thermalSimResult, setThermalSimResult] = useState<ThermalSimResult | null>(null);
  const [safetyAuditResult, setSafetyAuditResult] = useState<SafetyAuditResult | null>(null);

  // Initialize data on mount
  const loadInitialData = async () => {
    try {
      await fetchHealth();
      setIsBackendHealthy(true);
    } catch {
      setIsBackendHealthy(false);
    }

    try {
      const cellList = await fetchCells();
      setCells(cellList);
      if (cellList.length > 0 && !activeCell) {
        const defaultCell = cellList[0];
        setActiveCell(defaultCell);
        // Calculate initial pack metrics
        const calc = await calculatePack({
          cell_id: defaultCell.id,
          series_count: 96,
          parallel_count: 44,
          module_count: 8,
          overhead_mass_factor: 1.25,
        });
        setPackMetrics(calc.metrics);
      }
    } catch (e) {
      console.error('Failed to load cells:', e);
    }

    try {
      const configs = await fetchConfigurations();
      setSavedConfigs(configs);
    } catch (e) {
      console.error('Failed to load configurations:', e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Recalculate pack metrics when cell, S, P, or overhead changes
  const updatePackCalculation = async (
    c: Cell | null,
    s: number,
    p: number,
    mod: number,
    overhead: number
  ) => {
    if (!c) return;
    try {
      const res = await calculatePack({
        cell_id: c.id,
        series_count: s,
        parallel_count: p,
        module_count: mod,
        overhead_mass_factor: overhead,
      });
      setPackMetrics(res.metrics);
    } catch (err) {
      console.error('Pack recalculation error:', err);
    }
  };

  const handleSelectCell = (cell: Cell) => {
    setActiveCell(cell);
    updatePackCalculation(cell, seriesCount, parallelCount, moduleCount, overheadFactor);
  };

  const handleUpdateTopology = (params: {
    seriesCount?: number;
    parallelCount?: number;
    moduleCount?: number;
    overheadFactor?: number;
    packagingType?: string;
    coolingType?: string;
    targetApp?: string;
  }) => {
    const newS = params.seriesCount ?? seriesCount;
    const newP = params.parallelCount ?? parallelCount;
    const newMod = params.moduleCount ?? moduleCount;
    const newOverhead = params.overheadFactor ?? overheadFactor;

    if (params.seriesCount !== undefined) setSeriesCount(params.seriesCount);
    if (params.parallelCount !== undefined) setParallelCount(params.parallelCount);
    if (params.moduleCount !== undefined) setModuleCount(params.moduleCount);
    if (params.overheadFactor !== undefined) setOverheadFactor(params.overheadFactor);
    if (params.packagingType !== undefined) setPackagingType(params.packagingType);
    if (params.coolingType !== undefined) setCoolingType(params.coolingType);
    if (params.targetApp !== undefined) setTargetApp(params.targetApp);

    updatePackCalculation(activeCell, newS, newP, newMod, newOverhead);
  };

  const handleSelectSavedConfig = (cfg: PackConfiguration) => {
    const matchedCell = cells.find((c) => c.id === cfg.cell_id) || activeCell;
    if (matchedCell) setActiveCell(matchedCell);
    setSeriesCount(cfg.series_count);
    setParallelCount(cfg.parallel_count);
    setModuleCount(cfg.module_count);
    setOverheadFactor(cfg.overhead_mass_factor);
    setPackagingType(cfg.packaging_type);
    setCoolingType(cfg.cooling_type);
    setTargetApp(cfg.target_application);

    updatePackCalculation(
      matchedCell,
      cfg.series_count,
      cfg.parallel_count,
      cfg.module_count,
      cfg.overhead_mass_factor
    );
    setActiveTab('battery-config');
  };

  const handleApplyOptimizerDesign = (cand: OptimizationCandidate) => {
    const matchedCell = cells.find((c) => c.id === cand.cell_id) || activeCell;
    if (matchedCell) setActiveCell(matchedCell);
    setSeriesCount(cand.series_count);
    setParallelCount(cand.parallel_count);
    const estModules = Math.max(1, Math.round(cand.series_count / 12));
    setModuleCount(estModules);

    updatePackCalculation(
      matchedCell,
      cand.series_count,
      cand.parallel_count,
      estModules,
      overheadFactor
    );
    setActiveTab('battery-config');
  };

  const handleResetToDefault = () => {
    if (cells.length > 0) {
      const teslaCell = cells.find((c) => c.id.includes('tesla')) || cells[0];
      setActiveCell(teslaCell);
      setSeriesCount(96);
      setParallelCount(44);
      setModuleCount(8);
      setOverheadFactor(1.25);
      setPackagingType('Structural Enclosure');
      setCoolingType('Liquid Chiller Loop');
      setTargetApp('EV Passenger');
      updatePackCalculation(teslaCell, 96, 44, 8, 1.25);
    }
  };

  const handleQuickSimulate = async () => {
    if (!activeCell) return;
    setActiveTab('electrical-sim');
    try {
      const elecRes = await simulateElectrical({
        cell_id: activeCell.id,
        series_count: seriesCount,
        parallel_count: parallelCount,
        mode: 'discharge_cc',
        c_rate: 1.0,
        initial_soc: 1.0,
        target_soc: 0.05,
      });
      setElectricalSimResult(elecRes);

      const thermRes = await simulateThermal({
        cell_id: activeCell.id,
        series_count: seriesCount,
        parallel_count: parallelCount,
        discharge_c_rate: 2.0,
        initial_temp_c: 25.0,
        ambient_temp_c: 25.0,
        cooling_mode: 'liquid_chiller',
        coolant_temp_c: 20.0,
        flow_rate_lpm: 12.0,
        sim_duration_sec: 1800.0,
      });
      setThermalSimResult(thermRes);
    } catch (e) {
      console.error('Quick simulate error:', e);
    }
  };

  return (
    <div className="flex min-h-screen bg-navy-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeCell={activeCell}
        packMetrics={packMetrics}
        isBackendHealthy={isBackendHealthy}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          activeCell={activeCell}
          packMetrics={packMetrics}
          onQuickSimulate={handleQuickSimulate}
          onResetPack={handleResetToDefault}
          isBackendHealthy={isBackendHealthy}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              activeCell={activeCell}
              packMetrics={packMetrics}
              savedConfigs={savedConfigs}
              setActiveTab={setActiveTab}
              onSelectCell={handleSelectCell}
              allCells={cells}
            />
          )}

          {activeTab === 'cell-database' && (
            <CellDatabaseView
              cells={cells}
              activeCell={activeCell}
              onSelectCell={handleSelectCell}
              onRefreshCells={loadInitialData}
            />
          )}

          {activeTab === 'battery-config' && (
            <BatteryConfigurationView
              activeCell={activeCell}
              packMetrics={packMetrics}
              seriesCount={seriesCount}
              parallelCount={parallelCount}
              moduleCount={moduleCount}
              overheadFactor={overheadFactor}
              packagingType={packagingType}
              coolingType={coolingType}
              targetApp={targetApp}
              onUpdateParams={handleUpdateTopology}
              onRefreshConfigs={loadInitialData}
            />
          )}

          {activeTab === 'electrical-sim' && (
            <ElectricalSimulationView
              activeCell={activeCell}
              packMetrics={packMetrics}
              seriesCount={seriesCount}
              parallelCount={parallelCount}
              simResult={electricalSimResult}
              setSimResult={setElectricalSimResult}
            />
          )}

          {activeTab === 'thermal-sim' && (
            <ThermalSimulationView
              activeCell={activeCell}
              packMetrics={packMetrics}
              seriesCount={seriesCount}
              parallelCount={parallelCount}
              thermalResult={thermalSimResult}
              setThermalResult={setThermalSimResult}
            />
          )}

          {activeTab === 'safety-analysis' && (
            <SafetyAnalysisView
              activeCell={activeCell}
              packMetrics={packMetrics}
              seriesCount={seriesCount}
              parallelCount={parallelCount}
              safetyResult={safetyAuditResult}
              setSafetyResult={setSafetyAuditResult}
            />
          )}

          {activeTab === 'design-optimization' && (
            <DesignOptimizationView
              onApplyDesign={handleApplyOptimizerDesign}
              allCells={cells}
            />
          )}

          {activeTab === 'results-dashboard' && (
            <ResultsDashboardView
              savedConfigs={savedConfigs}
              allCells={cells}
              onSelectConfig={handleSelectSavedConfig}
              onRefreshConfigs={loadInitialData}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              activeCell={activeCell}
              packMetrics={packMetrics}
              seriesCount={seriesCount}
              parallelCount={parallelCount}
              moduleCount={moduleCount}
              overheadFactor={overheadFactor}
              electricalSummary={electricalSimResult?.summary}
              thermalSummary={thermalSimResult?.summary}
              safetySummary={safetyAuditResult?.safety_scorecard}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              isBackendHealthy={isBackendHealthy}
              onRefreshAll={loadInitialData}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

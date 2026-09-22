import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { FaultInjectionBar } from './components/FaultInjectionBar';
import { DemoTourModal } from './components/DemoTourModal';

import { OverviewPage } from './pages/OverviewPage';
import { LiveEnginePage } from './pages/LiveEnginePage';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { HealthDiagnosticsPage } from './pages/HealthDiagnosticsPage';
import { PredictiveMaintenancePage } from './pages/PredictiveMaintenancePage';
import { MissionSimulationPage } from './pages/MissionSimulationPage';
import { MissionReplayPage } from './pages/MissionReplayPage';
import { FaultAnalysisPage } from './pages/FaultAnalysisPage';
import { HistoricalDataPage } from './pages/HistoricalDataPage';
import { SystemArchitecturePage } from './pages/SystemArchitecturePage';

import {
  fetchSystemStatus,
  fetchLiveTelemetry,
  injectFault,
  resetEngine,
  fetchDemoSteps
} from './api';
import { LiveTelemetryResponse, SystemStatus, DemoStep } from './types';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<string>('overview');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [telemetry, setTelemetry] = useState<LiveTelemetryResponse | null>(null);
  const [demoSteps, setDemoSteps] = useState<DemoStep[]>([]);
  const [isDemoOpen, setIsDemoOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Rolling telemetry history map for sparklines and charts
  const [historyMap, setHistoryMap] = useState<Record<string, number[]>>({
    rpm: [5180, 5175, 5185, 5180, 5190, 5180],
    cht: [154.0, 154.5, 155.0, 154.8, 155.2, 155.0],
    egt: [690.0, 689.5, 691.0, 690.5, 692.0, 690.0],
    oil_pressure: [4.70, 4.72, 4.69, 4.71, 4.70, 4.70],
    oil_temperature: [92.0, 92.2, 92.5, 92.4, 92.8, 92.5],
    fuel_flow: [17.5, 17.6, 17.4, 17.5, 17.7, 17.5],
    vibration: [2.50, 2.52, 2.48, 2.51, 2.53, 2.50],
    battery_voltage: [28.0, 28.0, 27.9, 28.0, 28.1, 28.0],
    alternator_current: [34.0, 34.2, 33.8, 34.1, 34.5, 34.0],
    injection_timing: [28.0, 28.1, 27.9, 28.0, 28.2, 28.0]
  });

  const pollIntervalRef = useRef<any>(null);

  // Fetch initial system status & demo steps
  useEffect(() => {
    fetchSystemStatus()
      .then((status) => setSystemStatus(status))
      .catch((err) => console.error('Failed to load system status:', err));

    fetchDemoSteps()
      .then((steps) => setDemoSteps(steps))
      .catch((err) => console.error('Failed to load demo steps:', err));
  }, []);

  // Continuous Telemetry Polling (1 Hz)
  useEffect(() => {
    const fetchTelemetryTick = async () => {
      try {
        const live = await fetchLiveTelemetry();
        setTelemetry(live);

        // Append to rolling history
        setHistoryMap((prev) => {
          const maxHistory = 40;
          const obs = live.observed;
          const next: Record<string, number[]> = {};

          const keys = ['rpm', 'cht', 'egt', 'oil_pressure', 'oil_temperature', 'fuel_flow', 'vibration', 'battery_voltage', 'alternator_current', 'injection_timing'];
          keys.forEach((k) => {
            const arr = prev[k] || [];
            const val = (obs as any)[k];
            const updated = arr.length >= maxHistory ? [...arr.slice(1), val] : [...arr, val];
            next[k] = updated;
          });

          return next;
        });
      } catch (err) {
        console.error('Telemetry polling error:', err);
      }
    };

    fetchTelemetryTick();
    pollIntervalRef.current = setInterval(fetchTelemetryTick, 1000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleInjectFault = async (type: string, severity: number, active: boolean) => {
    try {
      await injectFault(type, severity, active);
      const updated = await fetchLiveTelemetry();
      setTelemetry(updated);
    } catch (err) {
      console.error('Failed to apply fault injection:', err);
    }
  };

  const handleResetEngine = async () => {
    try {
      await resetEngine();
      const updated = await fetchLiveTelemetry();
      setTelemetry(updated);
    } catch (err) {
      console.error('Failed to reset engine:', err);
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Navigation Sidebar */}
      <Sidebar
        activePage={activePage}
        onSelectPage={(pageId) => {
          setActivePage(pageId);
          setIsMobileSidebarOpen(false);
        }}
        systemStatus={systemStatus}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="main-wrapper">
        {/* Top Header */}
        <TopHeader
          systemStatus={systemStatus}
          onOpenDemo={() => setIsDemoOpen(true)}
          onResetEngine={handleResetEngine}
          syncPct={telemetry?.twin_synchronization_pct ?? 98.7}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Persistent Fault Injection Bar (Section 10) */}
        <FaultInjectionBar
          currentFault={telemetry?.active_fault ?? { type: 'Normal Operation', severity: 0.5, active: false }}
          onInject={handleInjectFault}
          anomalyDetected={telemetry?.ml_anomaly?.is_anomaly ?? false}
          healthIndex={telemetry?.engine_health_index ?? 98}
        />

        {/* Active Page View */}
        {activePage === 'overview' && (
          <OverviewPage telemetry={telemetry} historyMap={historyMap} />
        )}
        {activePage === 'live-engine' && (
          <LiveEnginePage telemetry={telemetry} historyMap={historyMap} />
        )}
        {activePage === 'digital-twin' && (
          <DigitalTwinPage telemetry={telemetry} historyMap={historyMap} />
        )}
        {activePage === 'health-diagnostics' && (
          <HealthDiagnosticsPage telemetry={telemetry} />
        )}
        {activePage === 'predictive-maint' && (
          <PredictiveMaintenancePage telemetry={telemetry} />
        )}
        {activePage === 'mission-sim' && (
          <MissionSimulationPage />
        )}
        {activePage === 'mission-replay' && (
          <MissionReplayPage />
        )}
        {activePage === 'fault-analysis' && (
          <FaultAnalysisPage />
        )}
        {activePage === 'historical-data' && (
          <HistoricalDataPage />
        )}
        {activePage === 'system-arch' && (
          <SystemArchitecturePage />
        )}

        {/* Bottom Technical Disclaimer & Integrity Status */}
        <footer className="bottom-disclaimer">
          <div>
            Prototype system · Simulation and model outputs are for demonstration and engineering research only and are not intended for flight-critical decision making.
          </div>
          <div style={{ display: 'flex', gap: '14px', fontFamily: 'var(--font-mono)' }}>
            <span>DATA: <strong style={{ color: '#0369a1' }}>SIMULATED</strong></span>
            <span>AIRFRAME: <strong>MALE-UAV-42</strong></span>
            <span>ENGINE: <strong>ENG-01</strong></span>
          </div>
        </footer>
      </div>

      {/* Guided Demonstration Modal */}
      <DemoTourModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        steps={demoSteps}
        onNavigatePage={setActivePage}
        onInjectFault={handleInjectFault}
      />
    </div>
  );
};

export default App;

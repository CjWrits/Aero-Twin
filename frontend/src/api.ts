import {
  LiveTelemetryResponse,
  SystemStatus,
  TwinStateResponse,
  Mission042ReplayResponse,
  FaultEvent,
  HistoricalMission,
  HistoricalSummary,
  MaintenanceRecord,
  DemoStep
} from './types';

const API_BASE = ''; // uses Vite proxy to http://127.0.0.1:8000

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE}/api/system/status`);
  if (!res.ok) throw new Error('Failed to fetch system status');
  return res.json();
}

export async function fetchLiveTelemetry(): Promise<LiveTelemetryResponse> {
  const res = await fetch(`${API_BASE}/api/engine/telemetry/live`);
  if (!res.ok) throw new Error('Failed to fetch live telemetry');
  return res.json();
}

export async function injectFault(fault_type: string, severity: number, active: boolean) {
  const res = await fetch(`${API_BASE}/api/engine/fault/inject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fault_type, severity, active })
  });
  if (!res.ok) throw new Error('Failed to inject fault');
  return res.json();
}

export async function updateControls(params: {
  throttle?: number;
  engine_load?: number;
  altitude?: number;
  ambient_temperature?: number;
}) {
  const res = await fetch(`${API_BASE}/api/engine/controls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Failed to update engine controls');
  return res.json();
}

export async function resetEngine() {
  const res = await fetch(`${API_BASE}/api/engine/reset`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to reset engine');
  return res.json();
}

export async function fetchTwinState(): Promise<TwinStateResponse> {
  const res = await fetch(`${API_BASE}/api/twin/state`);
  if (!res.ok) throw new Error('Failed to fetch digital twin state');
  return res.json();
}

export async function runMissionSimulation(params: {
  preset_name: string;
  altitude_m: number;
  ambient_temp_c: number;
  throttle: number;
  engine_load: number;
  duration_min: number;
  degradation_level: number;
}) {
  const res = await fetch(`${API_BASE}/api/simulation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Failed to execute mission simulation');
  return res.json();
}

export async function fetchMission042Replay(): Promise<Mission042ReplayResponse> {
  const res = await fetch(`${API_BASE}/api/replay/mission-042`);
  if (!res.ok) throw new Error('Failed to fetch Mission-042 replay data');
  return res.json();
}

export async function fetchFaultEvents(): Promise<FaultEvent[]> {
  const res = await fetch(`${API_BASE}/api/faults/events`);
  if (!res.ok) throw new Error('Failed to fetch fault events');
  return res.json();
}

export async function fetchHistoricalData(): Promise<{
  summary: HistoricalSummary;
  missions: HistoricalMission[];
  faults: FaultEvent[];
  maintenance: MaintenanceRecord[];
}> {
  const res = await fetch(`${API_BASE}/api/history/data`);
  if (!res.ok) throw new Error('Failed to fetch historical dataset');
  return res.json();
}

export async function fetchDemoSteps(): Promise<DemoStep[]> {
  const res = await fetch(`${API_BASE}/api/demo/steps`);
  if (!res.ok) throw new Error('Failed to fetch demo steps');
  return res.json();
}

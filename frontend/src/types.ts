export interface EngineState {
  timestamp: number;
  rpm: number;
  throttle: number;
  engine_load: number;
  altitude: number;
  ambient_temperature: number;
  cht: number;
  egt: number;
  oil_pressure: number;
  oil_temperature: number;
  fuel_flow: number;
  vibration: number;
  battery_voltage: number;
  alternator_current: number;
  injection_timing: number;
  manifold_pressure: number;
}

export interface TwinResiduals {
  rpm: number;
  cht: number;
  egt: number;
  oil_pressure: number;
  oil_temperature: number;
  fuel_flow: number;
  vibration: number;
  battery_voltage: number;
  alternator_current: number;
  injection_timing: number;
}

export interface SubsystemHealth {
  name: string;
  health_index: number;
  status: 'NORMAL' | 'WATCH' | 'DEGRADING' | 'CRITICAL';
  trend: 'STABLE' | 'DOWN' | 'UP';
  primary_metric: string;
  observed_metric: string;
  residual_metric: string;
  evidence: string[];
}

export interface DiagnosticReasoning {
  probable_condition: string;
  confidence_pct: number;
  severity: 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
  model_interpretation: string;
  evidence_signals: string[];
  maintenance_advisory: string;
  maintenance_priority: 'ROUTINE' | 'MEDIUM' | 'HIGH' | 'IMMEDIATE';
  recommended_action: string;
  twin_synchronization_pct: number;
  disclaimer: string;
}

export interface RULProjection {
  current_health_index: number;
  predicted_rul_hours_min: number;
  predicted_rul_hours_max: number;
  confidence_pct: number;
  degradation_rate_per_10h: number;
  status: string;
  historical_hours: number[];
  historical_health: number[];
  projected_hours: number[];
  projected_health: number[];
  projected_upper_bound: number[];
  projected_lower_bound: number[];
}

export interface MLAnomalyResult {
  is_anomaly: boolean;
  anomaly_score: number;
  decision_function: number;
  model_label: string;
  model_version: string;
  training_sample_count: number;
  contributing_features: Array<{
    parameter: string;
    z_score: number;
    residual: number;
  }>;
}

export interface LiveTelemetryResponse {
  timestamp: number;
  engine_id: string;
  mission_id: string;
  operating_mode: string;
  engine_health_index: number;
  health_status: string;
  twin_synchronization_pct: number;
  observed: EngineState;
  expected: EngineState;
  residuals: TwinResiduals;
  subsystems: Record<string, SubsystemHealth>;
  diagnostic_reasoning: DiagnosticReasoning;
  predicted_rul: RULProjection;
  ml_anomaly: MLAnomalyResult;
  active_fault: {
    type: string;
    severity: number;
    active: boolean;
  };
}

export interface SystemStatus {
  system_name: string;
  subtitle: string;
  system_status: string;
  data_source: string;
  engine_id: string;
  mission_id: string;
  twin_synchronization_pct: number;
  model_version: string;
  last_sync: string;
  disclaimer: string;
}

export interface TwinParameterComparison {
  name: string;
  key: string;
  unit: string;
  observed: string;
  expected: string;
  residual: string;
  confidence: number;
  subsystem: string;
}

export interface TwinStateResponse {
  pipeline: Array<{ step: string; description: string }>;
  parameters: TwinParameterComparison[];
  overall_health_index: number;
  subsystems: Record<string, SubsystemHealth>;
  twin_synchronization_pct: number;
}

export interface ReplayMilestone {
  time_str: string;
  sec: number;
  label: string;
  description: string;
}

export interface ReplaySample {
  step_index: number;
  seconds: number;
  time_str: string;
  phase: string;
  throttle: number;
  altitude_m: number;
  rpm: number;
  cht: number;
  egt: number;
  oil_pressure: number;
  oil_temperature: number;
  fuel_flow: number;
  vibration: number;
  health_index: number;
  residual_egt: number;
  is_anomaly: boolean;
  active_alert: {
    level: string;
    message: string;
    timestamp: string;
  } | null;
}

export interface Mission042ReplayResponse {
  metadata: {
    mission_id: string;
    engine_id: string;
    aircraft_type: string;
    propulsion_type: string;
    total_duration_str: string;
    total_duration_sec: number;
    recorded_samples_count: number;
    milestones: ReplayMilestone[];
  };
  timeline: ReplaySample[];
}

export interface HistoricalMission {
  mission_id: string;
  date_str: string;
  callsign: string;
  duration_hours: number;
  avg_altitude_m: number;
  avg_rpm: number;
  avg_cht_c: number;
  avg_egt_c: number;
  fuel_consumed_liters: number;
  peak_vibration_mms: number;
  final_health_index: number;
  fault_count: number;
  status: string;
}

export interface FaultEvent {
  event_id: string;
  mission_id: string;
  timestamp_str: string;
  subsystem: string;
  severity: string;
  observed_param: string;
  observed_value: string;
  expected_value: string;
  residual: string;
  associated_signals: string;
  probable_fault: string;
  confidence_pct: number;
  model_detection: string;
  required_action: string;
}

export interface MaintenanceRecord {
  record_id: string;
  engine_hours: number;
  date_str: string;
  action_type: string;
  technician: string;
  description: string;
  status: string;
}

export interface HistoricalSummary {
  engine_id: string;
  total_operating_hours: number;
  total_fuel_consumed_liters: number;
  completed_missions_count: number;
  recorded_fault_events_count: number;
  average_cruise_cht: number;
  average_cruise_egt: number;
  mean_fleet_vibration: number;
  current_status: string;
}

export interface DemoStep {
  step: number;
  title: string;
  page: string;
  action: string;
}

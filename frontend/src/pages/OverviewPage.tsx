import React from 'react';
import {
  Activity,
  Cpu,
  AlertTriangle,
  Clock,
  Radio,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import { LiveTelemetryResponse } from '../types';
import { Sparkline } from '../components/Sparkline';

interface OverviewPageProps {
  telemetry: LiveTelemetryResponse | null;
  historyMap: Record<string, number[]>;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ telemetry, historyMap }) => {
  if (!telemetry) {
    return (
      <div className="panel" style={{ padding: '24px', textAlign: 'center' }}>
        <span style={{ color: '#64748b' }}>Awaiting engine telemetry synchronization...</span>
      </div>
    );
  }

  const obs = telemetry.observed;
  const healthIndex = telemetry.engine_health_index;
  const isDegraded = healthIndex < 88;
  const isCritical = healthIndex < 70;

  const getStatusBadge = () => {
    if (isCritical) {
      return { label: 'CRITICAL ANOMALY', bg: '#fef2f2', text: '#b91c1c', border: '#fca5a5' };
    }
    if (isDegraded) {
      return { label: 'DEGRADATION DETECTED', bg: '#fffbeb', text: '#b45309', border: '#fcd34d' };
    }
    return { label: 'NORMAL OPERATION', bg: '#f0fdf4', text: '#15803d', border: '#86efac' };
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="page-content">
      {/* Top Banner / Hero Summary Card */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Cpu size={15} color="#2563eb" />
            <span>PROPULSION DIGITAL TWIN HEALTH SUMMARY</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Data Source:</span>
            <span className="badge badge-sim">SIMULATED TELEMETRY</span>
          </div>
        </div>

        <div className="panel-body" style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {/* Health Index */}
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Engine Health Index
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: isCritical ? '#dc2626' : (isDegraded ? '#d97706' : '#15803d') }}>
                  {healthIndex}
                </span>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>/ 100</span>
              </div>
              <div style={{ marginTop: '6px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: statusBadge.bg,
                    color: statusBadge.text,
                    border: `1px solid ${statusBadge.border}`
                  }}
                >
                  {statusBadge.label}
                </span>
              </div>
            </div>

            {/* Predicted RUL */}
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Predicted RUL
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '6px' }}>
                {telemetry.predicted_rul.predicted_rul_hours_min}–{telemetry.predicted_rul.predicted_rul_hours_max} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>flight hours</span>
              </div>
              <div style={{ marginTop: '6px', fontSize: '10.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} color="#0284c7" />
                <span>Confidence: <strong>{telemetry.predicted_rul.confidence_pct}%</strong> (Prototype estimate)</span>
              </div>
            </div>

            {/* Current Operating Mode */}
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Operating Mode
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '8px' }}>
                {telemetry.operating_mode}
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#475569' }}>
                Altitude: <strong>{obs.altitude.toFixed(0)} m</strong> | Throttle: <strong>{Math.round(obs.throttle * 100)}%</strong>
              </div>
            </div>

            {/* Twin Synchronization */}
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Twin Synchronization
              </div>
              <div style={{ fontSize: '30px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#1d4ed8', marginTop: '4px' }}>
                {telemetry.twin_synchronization_pct.toFixed(1)}%
              </div>
              <div style={{ marginTop: '4px', fontSize: '10.5px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} />
                <span>Thermodynamic state locked</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Telemetry Grid */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Activity size={15} color="#2563eb" />
            <span>PRIMARY PROPULSION TELEMETRY (ENGINEERING UNITS)</span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Continuous sampling · Real-time simulation model
          </span>
        </div>

        <div className="panel-body">
          <div className="telemetry-grid">
            {/* RPM */}
            <div className="telemetry-card">
              <div className="telemetry-label">
                <span>Crankshaft Speed</span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>RPM</span>
              </div>
              <div className="telemetry-val-group">
                <span className="telemetry-val">{obs.rpm.toFixed(0)}</span>
                <span className="telemetry-unit">rpm</span>
              </div>
              <div className="telemetry-footer">
                <span>Nominal: 5,180</span>
                <Sparkline data={historyMap['rpm'] || []} color="#2563eb" />
              </div>
            </div>

            {/* CHT */}
            <div className={`telemetry-card ${obs.cht > 185 ? 'alert-critical' : (obs.cht > 170 ? 'alert-warning' : '')}`}>
              <div className="telemetry-label">
                <span>Cyl Head Temp (CHT)</span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>THERMAL</span>
              </div>
              <div className="telemetry-val-group">
                <span className="telemetry-val" style={{ color: obs.cht > 175 ? '#b45309' : undefined }}>
                  {obs.cht.toFixed(1)}
                </span>
                <span className="telemetry-unit">°C</span>
              </div>
              <div className="telemetry-footer">
                <span>Limit: &lt;195 °C</span>
                <Sparkline data={historyMap['cht'] || []} color={obs.cht > 170 ? '#d97706' : '#2563eb'} />
              </div>
            </div>

            {/* EGT */}
            <div className={`telemetry-card ${obs.egt > 740 ? 'alert-critical' : (obs.egt > 715 ? 'alert-warning' : '')}`}>
              <div className="telemetry-label">
                <span>Exhaust Gas (EGT)</span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>EXHAUST</span>
              </div>
              <div className="telemetry-val-group">
                <span className="telemetry-val" style={{ color: obs.egt > 720 ? '#b45309' : undefined }}>
                  {obs.egt.toFixed(1)}
                </span>
                <span className="telemetry-unit">°C</span>
              </div>
              <div className="telemetry-footer">
                <span>Model Exp: {telemetry.expected.egt.toFixed(1)}</span>
                <Sparkline data={historyMap['egt'] || []} color={obs.egt > 715 ? '#b45309' : '#2563eb'} />
              </div>
            </div>

            {/* Oil Pressure */}
            <div className={`telemetry-card ${obs.oil_pressure < 3.2 ? 'alert-critical' : (obs.oil_pressure < 4.0 ? 'alert-warning' : '')}`}>
              <div className="telemetry-label">
                <span>Oil Pressure</span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>LUB</span>
              </div>
              <div className="telemetry-val-group">
                <span className="telemetry-val" style={{ color: obs.oil_pressure < 4.0 ? '#b45309' : undefined }}>
                  {obs.oil_pressure.toFixed(2)}
                </span>
                <span className="telemetry-unit">bar</span>
              </div>
              <div className="telemetry-footer">
                <span>Nominal: 4.7 bar</span>
                <Sparkline data={historyMap['oil_pressure'] || []} color={obs.oil_pressure < 4.0 ? '#dc2626' : '#2563eb'} />
              </div>
            </div>

            {/* Oil Temperature */}
            <div className={`telemetry-card ${obs.oil_temperature > 110 ? 'alert-critical' : (obs.oil_temperature > 102 ? 'alert-warning' : '')}`}>
              <div className="telemetry-label">
                <span>Oil Temperature</span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>LUB</span>
              </div>
              <div className="telemetry-val-group">
                <span className="telemetry-val">{obs.oil_temperature.toFixed(1)}</span>
                <span className="telemetry-unit">°C</span>
              </div>
              <div className="telemetry-footer">
                <span>Limit: &lt;115 °C</span>
                <Sparkline data={historyMap['oil_temperature'] || []} color="#2563eb" />
              </div>
            </div>

            {/* Fuel Flow */}
            <div className="telemetry-card">
              <div className="telemetry-label">
                <span>Fuel Flow Rate</span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>CONSUMPTION</span>
              </div>
              <div className="telemetry-val-group">
                <span className="telemetry-val">{obs.fuel_flow.toFixed(2)}</span>
                <span className="telemetry-unit">L/h</span>
              </div>
              <div className="telemetry-footer">
                <span>Exp: {telemetry.expected.fuel_flow.toFixed(2)}</span>
                <Sparkline data={historyMap['fuel_flow'] || []} color="#2563eb" />
              </div>
            </div>

            {/* Vibration */}
            <div className={`telemetry-card ${obs.vibration > 5.0 ? 'alert-critical' : (obs.vibration > 3.0 ? 'alert-warning' : '')}`}>
              <div className="telemetry-label">
                <span>Block Vibration RMS</span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>DYNAMICS</span>
              </div>
              <div className="telemetry-val-group">
                <span className="telemetry-val" style={{ color: obs.vibration > 3.0 ? '#b45309' : undefined }}>
                  {obs.vibration.toFixed(2)}
                </span>
                <span className="telemetry-unit">mm/s</span>
              </div>
              <div className="telemetry-footer">
                <span>Baseline: 2.5 mm/s</span>
                <Sparkline data={historyMap['vibration'] || []} color={obs.vibration > 3.0 ? '#dc2626' : '#2563eb'} />
              </div>
            </div>

            {/* Battery Voltage */}
            <div className="telemetry-card">
              <div className="telemetry-label">
                <span>Bus Battery Voltage</span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>ELEC</span>
              </div>
              <div className="telemetry-val-group">
                <span className="telemetry-val">{obs.battery_voltage.toFixed(2)}</span>
                <span className="telemetry-unit">V</span>
              </div>
              <div className="telemetry-footer">
                <span>Nominal: 28.0 V</span>
                <Sparkline data={historyMap['battery_voltage'] || []} color="#2563eb" />
              </div>
            </div>

            {/* Alternator Output */}
            <div className="telemetry-card">
              <div className="telemetry-label">
                <span>Alternator Current</span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>ELEC</span>
              </div>
              <div className="telemetry-val-group">
                <span className="telemetry-val">{obs.alternator_current.toFixed(1)}</span>
                <span className="telemetry-unit">A</span>
              </div>
              <div className="telemetry-footer">
                <span>Max: 45 A</span>
                <Sparkline data={historyMap['alternator_current'] || []} color="#2563eb" />
              </div>
            </div>

            {/* Injection Timing */}
            <div className="telemetry-card">
              <div className="telemetry-label">
                <span>Injection Timing</span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>ECU</span>
              </div>
              <div className="telemetry-val-group">
                <span className="telemetry-val">{obs.injection_timing.toFixed(1)}</span>
                <span className="telemetry-unit">° BTDC</span>
              </div>
              <div className="telemetry-footer">
                <span>Exp: {telemetry.expected.injection_timing.toFixed(1)}°</span>
                <Sparkline data={historyMap['injection_timing'] || []} color="#2563eb" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subsystems Health Breakdown & Model Diagnostic Reasoning Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        {/* Subsystems Quick Table */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Sliders size={14} color="#2563eb" />
              <span>SUBSYSTEM HEALTH STATUS</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>6 Subsystems Monitored</span>
          </div>

          <div className="panel-body" style={{ padding: '0' }}>
            <table className="eng-table">
              <thead>
                <tr>
                  <th>Subsystem</th>
                  <th>Health</th>
                  <th>Observed</th>
                  <th>Model Residual</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(telemetry.subsystems).map((sub) => {
                  const isSubDegraded = sub.health_index < 88;
                  const isSubCrit = sub.health_index < 70;
                  return (
                    <tr key={sub.name}>
                      <td style={{ fontWeight: 600 }}>{sub.name}</td>
                      <td className="mono" style={{ fontWeight: 700, color: isSubCrit ? '#dc2626' : (isSubDegraded ? '#d97706' : '#15803d') }}>
                        {sub.health_index}%
                      </td>
                      <td className="mono">{sub.observed_metric}</td>
                      <td className="mono" style={{ color: sub.residual_metric.startsWith('+') && !sub.residual_metric.includes('0.0') ? '#b45309' : '#475569' }}>
                        {sub.residual_metric}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '2px',
                            backgroundColor: isSubCrit ? '#fef2f2' : (isSubDegraded ? '#fffbeb' : '#f0fdf4'),
                            color: isSubCrit ? '#b91c1c' : (isSubDegraded ? '#b45309' : '#15803d'),
                            border: `1px solid ${isSubCrit ? '#fca5a5' : (isSubDegraded ? '#fcd34d' : '#86efac')}`
                          }}
                        >
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time Diagnostic Reasoning Snapshot */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <ShieldAlert size={14} color="#b45309" />
              <span>ACTIVE DIAGNOSTIC REASONING</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Confidence: <strong style={{ color: '#0f172a' }}>{telemetry.diagnostic_reasoning.confidence_pct}%</strong>
            </span>
          </div>

          <div className="panel-body">
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '10px', marginBottom: '10px' }}>
              <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Model Assessment:
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {telemetry.diagnostic_reasoning.probable_condition}
              </div>
              <p style={{ fontSize: '11.5px', color: '#334155', marginTop: '4px', lineHeight: 1.4 }}>
                {telemetry.diagnostic_reasoning.model_interpretation}
              </p>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                Active Telemetry Evidence:
              </div>
              <ul style={{ listStyleType: 'none', padding: 0, fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {telemetry.diagnostic_reasoning.evidence_signals.map((sig, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b' }}>
                    <span style={{ color: '#2563eb' }}>▪</span>
                    <span>{sig}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '4px', padding: '8px 10px', fontSize: '11px', color: '#92400e' }}>
              <strong>Advisory:</strong> {telemetry.diagnostic_reasoning.maintenance_advisory}
            </div>

            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '8px', fontStyle: 'italic' }}>
              {telemetry.diagnostic_reasoning.disclaimer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

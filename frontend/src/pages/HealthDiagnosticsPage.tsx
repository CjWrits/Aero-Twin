import React from 'react';
import { HeartPulse, ShieldAlert, AlertTriangle, CheckCircle2, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { LiveTelemetryResponse } from '../types';

interface HealthDiagnosticsPageProps {
  telemetry: LiveTelemetryResponse | null;
}

export const HealthDiagnosticsPage: React.FC<HealthDiagnosticsPageProps> = ({ telemetry }) => {
  if (!telemetry) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Awaiting diagnostic telemetry...</div>;
  }

  const diag = telemetry.diagnostic_reasoning;
  const subsystems = telemetry.subsystems;
  const ml = telemetry.ml_anomaly;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL': return { text: '#15803d', bg: '#f0fdf4', border: '#86efac' };
      case 'WATCH': return { text: '#0284c7', bg: '#f0f9ff', border: '#7dd3fc' };
      case 'DEGRADING': return { text: '#b45309', bg: '#fffbeb', border: '#fcd34d' };
      case 'CRITICAL': return { text: '#b91c1c', bg: '#fef2f2', border: '#fca5a5' };
      default: return { text: '#475569', bg: '#f8fafc', border: '#cbd5e1' };
    }
  };

  return (
    <div className="page-content">
      {/* Top Banner: Subsystems Health Grid */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <HeartPulse size={15} color="#2563eb" />
            <span>PROPULSION SUBSYSTEM HEALTH STATUS & ANOMALY SIGNALS</span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Cumulative Health Index: <strong style={{ color: telemetry.engine_health_index < 88 ? '#b45309' : '#15803d' }}>{telemetry.engine_health_index}/100</strong>
          </span>
        </div>

        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {Object.entries(subsystems).map(([key, sub]) => {
              const sc = getStatusColor(sub.status);
              return (
                <div
                  key={key}
                  style={{
                    background: '#ffffff',
                    border: `1px solid ${sub.health_index < 88 ? sc.border : 'var(--border-medium)'}`,
                    borderRadius: '4px',
                    padding: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                      {sub.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: sc.bg,
                          color: sc.text,
                          border: `1px solid ${sc.border}`
                        }}
                      >
                        {sub.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: sc.text }}>
                      {sub.health_index}%
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Trend: <strong>{sub.trend}</strong>
                    </span>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '3px', padding: '8px', marginBottom: '8px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#64748b' }}>Primary Telemetry:</span>
                      <strong className="mono">{sub.observed_metric}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Twin Residual:</span>
                      <strong className="mono" style={{ color: sub.residual_metric.startsWith('+') && !sub.residual_metric.includes('0.0') ? '#b45309' : '#0f172a' }}>
                        {sub.residual_metric}
                      </strong>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Detected Evidence Signals:
                    </div>
                    <ul style={{ listStyleType: 'none', padding: 0, fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {sub.evidence.map((ev, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#334155' }}>
                          <span style={{ color: sc.text }}>▸</span>
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Diagnostic Reasoning & AI/ML Isolation Forest Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        {/* Diagnostic Reasoning Card */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <ShieldAlert size={15} color="#b45309" />
              <span>DIAGNOSTIC REASONING (EXPLAINABLE MODEL OUTPUT)</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Confidence: <strong style={{ color: '#0f172a' }}>{diag.confidence_pct}%</strong>
            </span>
          </div>

          <div className="panel-body">
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Model Assessed Interpretation:
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {diag.probable_condition}
              </div>
              <p style={{ fontSize: '12px', color: '#334155', marginTop: '6px', lineHeight: 1.45 }}>
                {diag.model_interpretation}
              </p>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                Observed Telemetry Evidence Chain:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {diag.evidence_signals.map((sig, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', background: '#ffffff', border: '1px solid var(--border-light)', padding: '6px 10px', borderRadius: '3px' }}>
                    <AlertTriangle size={13} color="#d97706" />
                    <span>{sig}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '10px 12px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>
                  Maintenance Verification Advisory
                </span>
                <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '2px', backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                  PRIORITY: {diag.maintenance_priority}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#1e3a8a', fontWeight: 500 }}>
                "{diag.maintenance_advisory}"
              </div>
              <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '4px' }}>
                <strong>Recommended Action:</strong> {diag.recommended_action}
              </div>
            </div>

            <div style={{ fontSize: '10.5px', color: '#64748b', fontStyle: 'italic', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
              {diag.disclaimer}
            </div>
          </div>
        </div>

        {/* AI/ML Isolation Forest Anomaly Analysis */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <CheckCircle2 size={15} color="#2563eb" />
              <span>AI / ML ANOMALY DETECTION ENGINE</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {ml.model_version}
            </span>
          </div>

          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-medium)' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>
                  Isolation Forest Anomaly Score:
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: ml.is_anomaly ? '#dc2626' : '#15803d', marginTop: '4px' }}>
                  {ml.anomaly_score.toFixed(3)}
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                  Threshold: <strong>0.450</strong>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-medium)' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>
                  Classifier Decision:
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: ml.is_anomaly ? '#dc2626' : '#15803d', marginTop: '8px' }}>
                  {ml.is_anomaly ? 'ANOMALY DETECTED' : 'NOMINAL INLIER'}
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px' }}>
                  Decision Function: <span className="mono">{ml.decision_function}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                Primary Contributing Telemetry Features:
              </div>
              {ml.contributing_features && ml.contributing_features.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {ml.contributing_features.map((feat, i) => (
                    <div key={i} style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '3px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '12px', color: '#0f172a' }}>{feat.parameter}</strong>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                          Residual: <span className="mono">{feat.residual > 0 ? `+${feat.residual}` : feat.residual}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#b45309' }}>
                          z = {feat.z_score}σ
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Statistical deviation</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '3px', border: '1px solid var(--border-light)', fontSize: '11.5px', color: '#16a34a' }}>
                  All multivariable features currently reside within the 1.5σ baseline distribution envelope.
                </div>
              )}
            </div>

            <div style={{ background: '#f1f5f9', border: '1px solid var(--border-medium)', borderRadius: '3px', padding: '8px 10px', fontSize: '10.5px', color: '#475569' }}>
              <strong>ML Model Metadata:</strong> {ml.model_label} trained on {ml.training_sample_count} synthetic flight regimes (contamination factor = 0.04).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

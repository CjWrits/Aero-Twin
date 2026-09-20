import React from 'react';
import { TrendingDown, Clock, ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import { LiveTelemetryResponse } from '../types';

interface PredictiveMaintenancePageProps {
  telemetry: LiveTelemetryResponse | null;
}

export const PredictiveMaintenancePage: React.FC<PredictiveMaintenancePageProps> = ({ telemetry }) => {
  if (!telemetry) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Awaiting predictive model output...</div>;
  }

  const rul = telemetry.predicted_rul;
  const diag = telemetry.diagnostic_reasoning;

  // Render SVG Graph of Health Index vs Operating Hours
  const renderRulGraph = () => {
    const svgWidth = 720;
    const svgHeight = 260;
    const padLeft = 45;
    const padRight = 35;
    const padTop = 25;
    const padBottom = 35;

    const plotWidth = svgWidth - padLeft - padRight;
    const plotHeight = svgHeight - padTop - padBottom;

    // Hours range 0 to 150
    const minHours = 0;
    const maxHours = 150;
    const minHealth = 40;
    const maxHealth = 105;

    const getX = (hrs: number) => padLeft + ((hrs - minHours) / (maxHours - minHours)) * plotWidth;
    const getY = (h: number) => padTop + plotHeight - ((h - minHealth) / (maxHealth - minHealth)) * plotHeight;

    // Historical Points (0 to 100 hrs)
    const histPointsStr = rul.historical_hours
      .map((h, i) => `${getX(h).toFixed(1)},${getY(rul.historical_health[i]).toFixed(1)}`)
      .join(' ');

    // Projected Points (100 to 150 hrs)
    const projPointsStr = rul.projected_hours
      .map((h, i) => `${getX(h).toFixed(1)},${getY(rul.projected_health[i]).toFixed(1)}`)
      .join(' ');

    // Upper and Lower confidence bounds polygon
    const upperPoints = rul.projected_hours.map((h, i) => `${getX(h).toFixed(1)},${getY(rul.projected_upper_bound[i]).toFixed(1)}`);
    const lowerPoints = [...rul.projected_hours].reverse().map((h, revIdx) => {
      const origIdx = rul.projected_hours.length - 1 - revIdx;
      return `${getX(h).toFixed(1)},${getY(rul.projected_lower_bound[origIdx]).toFixed(1)}`;
    });
    const confidencePolygon = [...upperPoints, ...lowerPoints].join(' ');

    const currentHoursX = getX(100);
    const criticalThresholdY = getY(60);

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', maxHeight: '280px' }}>
        {/* Background Grids */}
        {[50, 60, 70, 80, 90, 100].map((hVal) => (
          <g key={hVal}>
            <line
              x1={padLeft}
              y1={getY(hVal)}
              x2={svgWidth - padRight}
              y2={getY(hVal)}
              stroke={hVal === 60 ? '#fca5a5' : '#f1f5f9'}
              strokeWidth={hVal === 60 ? 1.5 : 1}
              strokeDasharray={hVal === 60 ? '4,4' : undefined}
            />
            <text x={padLeft - 6} y={getY(hVal) + 3} fontSize="9" fill={hVal === 60 ? '#b91c1c' : '#94a3b8'} textAnchor="end" fontFamily="var(--font-mono)">
              {hVal}
            </text>
          </g>
        ))}

        {/* X Axis Grid / Hours */}
        {[0, 25, 50, 75, 100, 125, 150].map((hrs) => (
          <g key={hrs}>
            <line
              x1={getX(hrs)}
              y1={padTop}
              x2={getX(hrs)}
              y2={svgHeight - padBottom}
              stroke={hrs === 100 ? '#94a3b8' : '#f1f5f9'}
              strokeWidth={hrs === 100 ? 1.5 : 1}
              strokeDasharray={hrs === 100 ? '3,3' : undefined}
            />
            <text x={getX(hrs)} y={svgHeight - padBottom + 15} fontSize="9" fill="#64748b" textAnchor="middle" fontFamily="var(--font-mono)">
              {hrs} h
            </text>
          </g>
        ))}

        {/* Shaded Observed Region Background */}
        <rect
          x={padLeft}
          y={padTop}
          width={currentHoursX - padLeft}
          height={plotHeight}
          fill="#f8fafc"
          opacity="0.6"
        />

        {/* Shaded Projected Region Background */}
        <rect
          x={currentHoursX}
          y={padTop}
          width={svgWidth - padRight - currentHoursX}
          height={plotHeight}
          fill="#fffbeb"
          opacity="0.3"
        />

        {/* Confidence Band Polygon */}
        <polygon points={confidencePolygon} fill="#fcd34d" opacity="0.35" />

        {/* Critical Maintenance Limit Annotation */}
        <line x1={padLeft} y1={criticalThresholdY} x2={svgWidth - padRight} y2={criticalThresholdY} stroke="#dc2626" strokeDasharray="5,5" strokeWidth="1.25" />
        <text x={svgWidth - padRight - 5} y={criticalThresholdY - 5} fontSize="9" fill="#dc2626" textAnchor="end" fontWeight="700">
          Critical Maintenance Limit (Health &lt; 60)
        </text>

        {/* Current Time Divider */}
        <line x1={currentHoursX} y1={padTop} x2={currentHoursX} y2={svgHeight - padBottom} stroke="#0f172a" strokeWidth="1.5" strokeDasharray="3,3" />
        <text x={currentHoursX} y={padTop - 8} fontSize="9.5" fill="#0f172a" fontWeight="700" textAnchor="middle">
          Current Engine Hours (100.0 h)
        </text>

        {/* Historical Observed Curve */}
        <polyline
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="2.5"
          points={histPointsStr}
        />

        {/* Projected Degradation Curve */}
        <polyline
          fill="none"
          stroke="#d97706"
          strokeWidth="2.5"
          strokeDasharray="5,4"
          points={projPointsStr}
        />

        {/* Current Point Dot */}
        <circle cx={currentHoursX} cy={getY(rul.current_health_index)} r="4.5" fill="#1d4ed8" stroke="#ffffff" strokeWidth="2" />

        {/* Legend */}
        <g transform={`translate(${padLeft + 15}, ${svgHeight - 14})`}>
          <line x1="0" y1="0" x2="16" y2="0" stroke="#1d4ed8" strokeWidth="2.5" />
          <text x="22" y="3" fontSize="9" fill="#334155" fontWeight="600">Observed History (0–100 hrs)</text>

          <line x1="180" y1="0" x2="196" y2="0" stroke="#d97706" strokeWidth="2.5" strokeDasharray="4,3" />
          <text x="202" y="3" fontSize="9" fill="#334155" fontWeight="600">Projected Health Trend (100–150 hrs)</text>

          <rect x="380" y="-4" width="14" height="8" fill="#fcd34d" opacity="0.6" />
          <text x="400" y="3" fontSize="9" fill="#334155" fontWeight="600">80% Confidence Interval</text>
        </g>
      </svg>
    );
  };

  return (
    <div className="page-content">
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div className="panel" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Current Health Index
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: rul.current_health_index < 88 ? '#b45309' : '#15803d', marginTop: '4px' }}>
            {rul.current_health_index} / 100
          </div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
            Status: <strong>{rul.status}</strong>
          </div>
        </div>

        <div className="panel" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Predicted Remaining Useful Life (RUL)
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '4px' }}>
            {rul.predicted_rul_hours_min}–{rul.predicted_rul_hours_max} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>flight hrs</span>
          </div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
            Confidence Level: <strong style={{ color: '#0284c7' }}>{rul.confidence_pct}%</strong>
          </div>
        </div>

        <div className="panel" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Estimated Degradation Rate
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#b45309', marginTop: '4px' }}>
            -{rul.degradation_rate_per_10h} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>pts / 10 hrs</span>
          </div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
            Non-linear wear progression
          </div>
        </div>
      </div>

      {/* Health Index vs Engine Operating Hours Graph */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <TrendingDown size={15} color="#2563eb" />
            <span>ENGINE HEALTH INDEX vs OPERATING FLIGHT HOURS (HISTORICAL & PROJECTED RUL)</span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Observed 0–100 hrs | Projected 100–150 hrs · Model: <strong>Prototype / Simulated Training Data</strong>
          </span>
        </div>

        <div className="panel-body">
          {renderRulGraph()}
        </div>
      </div>

      {/* Maintenance Advisory Card */}
      <div className="panel" style={{ borderLeft: '4px solid #b45309' }}>
        <div className="panel-header">
          <div className="panel-title">
            <ShieldAlert size={15} color="#b45309" />
            <span>MAINTENANCE ADVISORY</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Priority:</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '3px',
                backgroundColor: diag.maintenance_priority === 'IMMEDIATE' ? '#fef2f2' : '#fffbeb',
                color: diag.maintenance_priority === 'IMMEDIATE' ? '#b91c1c' : '#b45309',
                border: `1px solid ${diag.maintenance_priority === 'IMMEDIATE' ? '#fca5a5' : '#fcd34d'}`
              }}
            >
              {diag.maintenance_priority}
            </span>
          </div>
        </div>

        <div className="panel-body">
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
            "{diag.maintenance_advisory}"
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '10px 12px', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '3px' }}>
              Model Reason & Justification:
            </div>
            <div style={{ fontSize: '12px', color: '#1e293b' }}>
              {diag.model_interpretation}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#334155' }}>
            <div>
              <strong>Action Required:</strong> {diag.recommended_action}
            </div>
            <div style={{ color: '#64748b' }}>
              Target Window: Before next <strong>{rul.predicted_rul_hours_min} flight hours</strong>
            </div>
          </div>

          <div style={{ fontSize: '10.5px', color: '#94a3b8', fontStyle: 'italic', borderTop: '1px solid var(--border-light)', paddingTop: '10px', marginTop: '12px' }}>
            {diag.disclaimer}
          </div>
        </div>
      </div>
    </div>
  );
};

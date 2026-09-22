import React, { useState } from 'react';
import { Activity, ArrowUpRight, ArrowDownRight, Minus, Sliders, Box, Eye, EyeOff } from 'lucide-react';
import { LiveTelemetryResponse } from '../types';
import { Sparkline } from '../components/Sparkline';
import { EngineTwin3D } from '../components/EngineTwin3D';

interface LiveEnginePageProps {
  telemetry: LiveTelemetryResponse | null;
  historyMap: Record<string, number[]>;
}

export const LiveEnginePage: React.FC<LiveEnginePageProps> = ({ telemetry, historyMap }) => {
  const [timeRange, setTimeRange] = useState<'5 min' | '15 min' | '30 min' | '1 hr'>('15 min');
  const [show3DTwin, setShow3DTwin] = useState<boolean>(true);

  if (!telemetry) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Awaiting telemetry feed...</div>;
  }

  const obs = telemetry.observed;
  const exp = telemetry.expected;

  const getTrendArrow = (_key: string, currentVal: number, expectedVal: number, tolerance = 0.05) => {
    const diff = currentVal - expectedVal;
    const pct = Math.abs(diff) / (expectedVal || 1);
    if (pct < tolerance) {
      return <span title="Within normal band"><Minus size={14} color="#64748b" /></span>;
    }
    if (diff > 0) {
      return <span title="Elevated vs Expected"><ArrowUpRight size={14} color="#b45309" /></span>;
    }
    return <span title="Depressed vs Expected"><ArrowDownRight size={14} color="#2563eb" /></span>;
  };

  // Render a clean engineering SVG multi-point chart
  const renderChart = (title: string, data: number[], unit: string, nominalVal: number, color: string, limitVal?: number) => {
    const chartHeight = 110;
    const chartWidth = 320;
    const pts = data && data.length > 0 ? data : [nominalVal, nominalVal];
    const min = Math.min(...pts, nominalVal * 0.92);
    const max = Math.max(...pts, (limitVal || nominalVal) * 1.05);
    const range = max - min || 1;

    const pointsStr = pts
      .map((v, i) => {
        const x = (i / Math.max(1, pts.length - 1)) * (chartWidth - 50) + 40;
        const y = chartHeight - 20 - ((v - min) / range) * (chartHeight - 35);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const nominalY = chartHeight - 20 - ((nominalVal - min) / range) * (chartHeight - 35);

    return (
      <div style={{ background: '#ffffff', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
            {title} ({unit})
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color }}>
            {pts[pts.length - 1]?.toFixed(1)} {unit}
          </span>
        </div>

        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '95px' }}>
          {/* Y Axis Gridlines */}
          <line x1="40" y1="15" x2={chartWidth} y2="15" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="40" y1="55" x2={chartWidth} y2="55" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="40" y1={chartHeight - 20} x2={chartWidth} y2={chartHeight - 20} stroke="#cbd5e1" strokeWidth="1" />
          <line x1="40" y1="10" x2="40" y2={chartHeight - 20} stroke="#cbd5e1" strokeWidth="1" />

          {/* Nominal reference line */}
          <line
            x1="40"
            y1={nominalY}
            x2={chartWidth}
            y2={nominalY}
            stroke="#94a3b8"
            strokeDasharray="3,3"
            strokeWidth="1"
          />

          {/* Y Labels */}
          <text x="36" y="20" fontSize="8.5" fill="#94a3b8" textAnchor="end" fontFamily="var(--font-mono)">
            {max.toFixed(0)}
          </text>
          <text x="36" y={nominalY + 3} fontSize="8.5" fill="#64748b" textAnchor="end" fontFamily="var(--font-mono)">
            {nominalVal.toFixed(0)}
          </text>
          <text x="36" y={chartHeight - 22} fontSize="8.5" fill="#94a3b8" textAnchor="end" fontFamily="var(--font-mono)">
            {min.toFixed(0)}
          </text>

          {/* Data Polyline */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="1.75"
            strokeLinecap="round"
            points={pointsStr}
          />
        </svg>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>
          <span>-{timeRange}</span>
          <span>Nominal: {nominalVal} {unit}</span>
          <span>Now</span>
        </div>
      </div>
    );
  };

  const paramsList = [
    { label: 'Crankshaft Speed', key: 'rpm', val: obs.rpm.toFixed(0), exp: exp.rpm, unit: 'rpm', nominal: '5,180' },
    { label: 'Throttle Position', key: 'throttle', val: `${(obs.throttle * 100).toFixed(1)}%`, exp: exp.throttle * 100, unit: '%', nominal: '72%' },
    { label: 'Engine Load', key: 'engine_load', val: `${(obs.engine_load * 100).toFixed(1)}%`, exp: exp.engine_load * 100, unit: '%', nominal: '70%' },
    { label: 'Fuel Flow Rate', key: 'fuel_flow', val: obs.fuel_flow.toFixed(2), exp: exp.fuel_flow, unit: 'L/h', nominal: '17.5' },
    { label: 'Cyl Head Temp (CHT)', key: 'cht', val: obs.cht.toFixed(1), exp: exp.cht, unit: '°C', nominal: '155' },
    { label: 'Exhaust Gas (EGT)', key: 'egt', val: obs.egt.toFixed(1), exp: exp.egt, unit: '°C', nominal: '690' },
    { label: 'Oil Pressure', key: 'oil_pressure', val: obs.oil_pressure.toFixed(2), exp: exp.oil_pressure, unit: 'bar', nominal: '4.7' },
    { label: 'Oil Temperature', key: 'oil_temperature', val: obs.oil_temperature.toFixed(1), exp: exp.oil_temperature, unit: '°C', nominal: '92' },
    { label: 'Block Vibration RMS', key: 'vibration', val: obs.vibration.toFixed(2), exp: exp.vibration, unit: 'mm/s', nominal: '2.5' },
    { label: 'Bus Battery Voltage', key: 'battery_voltage', val: obs.battery_voltage.toFixed(2), exp: exp.battery_voltage, unit: 'V', nominal: '28.0' },
    { label: 'Alternator Output', key: 'alternator_current', val: obs.alternator_current.toFixed(1), exp: exp.alternator_current, unit: 'A', nominal: '34.0' },
    { label: 'Injection Timing', key: 'injection_timing', val: obs.injection_timing.toFixed(1), exp: exp.injection_timing, unit: '° BTDC', nominal: '28.0' }
  ];

  return (
    <div className="page-content">
      {/* 3D Realistic Digital Twin Live Kinematic Simulation */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Box size={15} color="#2563eb" />
            <span>REAL-TIME 3D PROPULSION DIGITAL TWIN & KINEMATICS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Physics kinematic replica · Real-time shaft RPM & thermal simulation
            </span>
            <button
              type="button"
              onClick={() => setShow3DTwin(!show3DTwin)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                fontSize: '10.5px',
                borderRadius: '3px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              {show3DTwin ? <EyeOff size={12} /> : <Eye size={12} />}
              <span>{show3DTwin ? 'Minimize 3D Twin' : 'Expand 3D Twin'}</span>
            </button>
          </div>
        </div>

        {show3DTwin && (
          <div className="panel-body">
            <EngineTwin3D
              telemetry={telemetry}
              historyMap={historyMap}
              height={460}
            />
          </div>
        )}
      </div>

      {/* Parameters Header */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Activity size={15} color="#2563eb" />
            <span>REAL-TIME ENGINE OPERATING PARAMETERS</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Buffer View:</span>
            {(['5 min', '15 min', '30 min', '1 hr'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                style={{
                  padding: '2px 8px',
                  fontSize: '10.5px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: timeRange === r ? '#1d4ed8' : '#cbd5e1',
                  backgroundColor: timeRange === r ? '#eff6ff' : '#ffffff',
                  color: timeRange === r ? '#1d4ed8' : '#475569',
                  fontWeight: timeRange === r ? 700 : 500
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-body">
          <div className="telemetry-grid">
            {paramsList.map((p) => {
              const currentNum = (obs as any)[p.key];
              const history = historyMap[p.key] || [];
              const isAlert = p.key === 'egt' && obs.egt > 720 || p.key === 'cht' && obs.cht > 175 || p.key === 'oil_pressure' && obs.oil_pressure < 3.8;
              return (
                <div key={p.key} className={`telemetry-card ${isAlert ? 'alert-warning' : ''}`}>
                  <div className="telemetry-label">
                    <span>{p.label}</span>
                    <span>{getTrendArrow(p.key, currentNum, p.exp)}</span>
                  </div>
                  <div className="telemetry-val-group">
                    <span className="telemetry-val">{p.val}</span>
                    <span className="telemetry-unit">{p.unit}</span>
                  </div>
                  <div className="telemetry-footer">
                    <span>Nom: {p.nominal}</span>
                    <Sparkline data={history} color={isAlert ? '#b45309' : '#2563eb'} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real-Time Engineering Charts Section */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Sliders size={15} color="#2563eb" />
            <span>DYNAMIC TELEMETRY HISTORICAL CHARTS</span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Synchronized at 1 Hz · Physical model reference dashed
          </span>
        </div>

        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {renderChart('RPM vs Time', historyMap['rpm'] || [], 'rpm', 5180, '#2563eb', 5800)}
            {renderChart('CHT vs Time', historyMap['cht'] || [], '°C', 155, '#d97706', 195)}
            {renderChart('EGT vs Time', historyMap['egt'] || [], '°C', 690, '#dc2626', 760)}
            {renderChart('Oil Pressure vs Time', historyMap['oil_pressure'] || [], 'bar', 4.7, '#059669', 5.5)}
            {renderChart('Vibration vs Time', historyMap['vibration'] || [], 'mm/s', 2.5, '#7c3aed', 6.0)}
          </div>
        </div>
      </div>
    </div>
  );
};

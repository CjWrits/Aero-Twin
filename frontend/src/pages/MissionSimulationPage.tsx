import React, { useState } from 'react';
import { Navigation, Play, CheckCircle2, AlertTriangle, Gauge, Fuel, Thermometer } from 'lucide-react';
import { runMissionSimulation } from '../api';

const PRESETS: Record<string, {
  altitude: number;
  oat: number;
  throttle: number;
  load: number;
  duration: number;
  deg: number;
  desc: string;
}> = {
  'NORMAL CRUISE': { altitude: 3500, oat: 15, throttle: 0.72, load: 0.70, duration: 120, deg: 0.0, desc: 'Nominal mid-altitude loiter; balanced thermodynamic margins' },
  'HIGH ALTITUDE': { altitude: 7500, oat: -22, throttle: 0.88, load: 0.85, duration: 90, deg: 0.05, desc: 'Critical turbocharger boost regime; reduced ambient cooling density' },
  'ENDURANCE': { altitude: 4200, oat: 8, throttle: 0.65, load: 0.64, duration: 360, deg: 0.12, desc: 'Extended 6-hour endurance profile; progressive thermal accumulation' },
  'HOT WEATHER': { altitude: 1200, oat: 44, throttle: 0.80, load: 0.78, duration: 60, deg: 0.08, desc: 'Extreme OAT (+44°C); reduced CHT safety margin and elevated oil temp' },
  'RAPID THROTTLE TRANSITION': { altitude: 2800, oat: 18, throttle: 0.70, load: 0.70, duration: 45, deg: 0.02, desc: 'Dynamic combat / terrain-following throttle sweeps' }
};

export const MissionSimulationPage: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string>('NORMAL CRUISE');
  const [altitude, setAltitude] = useState<number>(3500);
  const [ambientTemp, setAmbientTemp] = useState<number>(15);
  const [throttle, setThrottle] = useState<number>(0.72);
  const [engineLoad, setEngineLoad] = useState<number>(0.70);
  const [duration, setDuration] = useState<number>(120);
  const [degradation, setDegradation] = useState<number>(0.0);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  const applyPreset = (name: string) => {
    const p = PRESETS[name];
    if (!p) return;
    setSelectedPreset(name);
    setAltitude(p.altitude);
    setAmbientTemp(p.oat);
    setThrottle(p.throttle);
    setEngineLoad(p.load);
    setDuration(p.duration);
    setDegradation(p.deg);
  };

  const handleRunSimulation = async () => {
    setIsRunning(true);
    try {
      const res = await runMissionSimulation({
        preset_name: selectedPreset,
        altitude_m: altitude,
        ambient_temp_c: ambientTemp,
        throttle,
        engine_load: engineLoad,
        duration_min: duration,
        degradation_level: degradation
      });
      setSimResult(res);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Run on first mount if empty
  React.useEffect(() => {
    handleRunSimulation();
  }, []);

  const renderTrajectoryChart = () => {
    if (!simResult || !simResult.telemetry_profile || simResult.telemetry_profile.length === 0) return null;
    const pts = simResult.telemetry_profile;
    const svgWidth = 720;
    const svgHeight = 220;
    const pad = 40;

    const xStep = (svgWidth - pad * 2) / (pts.length - 1);

    // Normalize CHT (120 to 220 °C)
    const chtPoints = pts.map((p: any, i: number) => {
      const x = pad + i * xStep;
      const y = svgHeight - pad - ((p.cht - 120) / 100) * (svgHeight - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    // Normalize EGT (600 to 800 °C)
    const egtPoints = pts.map((p: any, i: number) => {
      const x = pad + i * xStep;
      const y = svgHeight - pad - ((p.egt - 600) / 200) * (svgHeight - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    // Normalize Health (40 to 100)
    const healthPoints = pts.map((p: any, i: number) => {
      const x = pad + i * xStep;
      const y = svgHeight - pad - ((p.health_index - 40) / 60) * (svgHeight - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', maxHeight: '240px' }}>
        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
          const y = pad + frac * (svgHeight - pad * 2);
          return (
            <line key={idx} x1={pad} y1={y} x2={svgWidth - pad} y2={y} stroke="#f1f5f9" strokeWidth="1" />
          );
        })}

        {/* Polylines */}
        <polyline fill="none" stroke="#d97706" strokeWidth="2" points={chtPoints} />
        <polyline fill="none" stroke="#dc2626" strokeWidth="2" points={egtPoints} />
        <polyline fill="none" stroke="#15803d" strokeWidth="2.5" strokeDasharray="4,2" points={healthPoints} />

        {/* Axis Labels */}
        <text x={pad} y={svgHeight - 12} fontSize="9.5" fill="#64748b" fontFamily="var(--font-mono)">0.0 min</text>
        <text x={svgWidth / 2} y={svgHeight - 12} fontSize="9.5" fill="#64748b" textAnchor="middle" fontFamily="var(--font-mono)">
          Mission Duration: {duration} min
        </text>
        <text x={svgWidth - pad} y={svgHeight - 12} fontSize="9.5" fill="#64748b" textAnchor="end" fontFamily="var(--font-mono)">
          {duration} min
        </text>

        {/* Legend */}
        <g transform={`translate(${pad}, 18)`}>
          <circle cx="5" cy="0" r="4" fill="#dc2626" />
          <text x="14" y="3" fontSize="9.5" fill="#334155" fontWeight="600">EGT (°C)</text>

          <circle cx="85" cy="0" r="4" fill="#d97706" />
          <text x="94" y="3" fontSize="9.5" fill="#334155" fontWeight="600">CHT (°C)</text>

          <line x1="160" y1="0" x2="175" y2="0" stroke="#15803d" strokeWidth="2" strokeDasharray="3,2" />
          <text x="180" y="3" fontSize="9.5" fill="#334155" fontWeight="600">Health Index (/100)</text>
        </g>
      </svg>
    );
  };

  return (
    <div className="page-content">
      {/* Preset Buttons */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Navigation size={15} color="#2563eb" />
            <span>MISSION OPERATIONAL ENVELOPE PRESETS</span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Preconfigured aerospace operational regimes
          </span>
        </div>

        <div className="panel-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.keys(PRESETS).map((pName) => (
              <button
                key={pName}
                onClick={() => applyPreset(pName)}
                className="btn-eng"
                style={{
                  padding: '6px 12px',
                  backgroundColor: selectedPreset === pName ? '#eff6ff' : '#ffffff',
                  borderColor: selectedPreset === pName ? '#1d4ed8' : '#cbd5e1',
                  color: selectedPreset === pName ? '#1d4ed8' : '#334155',
                  fontWeight: selectedPreset === pName ? 700 : 500
                }}
              >
                {pName}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '8px', fontStyle: 'italic' }}>
            {PRESETS[selectedPreset]?.desc}
          </div>
        </div>
      </div>

      {/* Interactive Controls & Run Simulation */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Gauge size={15} color="#2563eb" />
            <span>MISSION SIMULATION CONFIGURATION PARAMETERS</span>
          </div>
          <button
            className="btn-eng btn-eng-primary"
            onClick={handleRunSimulation}
            disabled={isRunning}
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            <Play size={14} />
            <span>{isRunning ? 'CALCULATING DYNAMICS...' : 'RUN SIMULATION'}</span>
          </button>
        </div>

        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {/* Altitude */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Flight Altitude:</span>
                <span className="mono" style={{ fontWeight: 700 }}>{altitude} m</span>
              </div>
              <input
                type="range"
                min="500"
                max="8500"
                step="100"
                value={altitude}
                onChange={(e) => setAltitude(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8' }}>
                <span>500 m</span>
                <span>8,500 m</span>
              </div>
            </div>

            {/* Ambient Temp */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Ambient Air Temp (OAT):</span>
                <span className="mono" style={{ fontWeight: 700 }}>{ambientTemp} °C</span>
              </div>
              <input
                type="range"
                min="-30"
                max="50"
                step="1"
                value={ambientTemp}
                onChange={(e) => setAmbientTemp(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8' }}>
                <span>-30 °C</span>
                <span>+50 °C</span>
              </div>
            </div>

            {/* Throttle */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Throttle Command:</span>
                <span className="mono" style={{ fontWeight: 700 }}>{Math.round(throttle * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.30"
                max="1.0"
                step="0.02"
                value={throttle}
                onChange={(e) => setThrottle(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8' }}>
                <span>30%</span>
                <span>100% (Takeoff)</span>
              </div>
            </div>

            {/* Engine Load */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Propeller Absorption Load:</span>
                <span className="mono" style={{ fontWeight: 700 }}>{Math.round(engineLoad * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.30"
                max="1.0"
                step="0.02"
                value={engineLoad}
                onChange={(e) => setEngineLoad(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8' }}>
                <span>30%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Mission Duration:</span>
                <span className="mono" style={{ fontWeight: 700 }}>{duration} min</span>
              </div>
              <input
                type="range"
                min="30"
                max="360"
                step="15"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8' }}>
                <span>30 min</span>
                <span>360 min (6 hrs)</span>
              </div>
            </div>

            {/* Degradation */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Baseline Engine Wear / Deg:</span>
                <span className="mono" style={{ fontWeight: 700 }}>{Math.round(degradation * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.50"
                step="0.02"
                value={degradation}
                onChange={(e) => setDegradation(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8' }}>
                <span>0% (New Engine)</span>
                <span>50% (Aged)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Results Section */}
      {simResult && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <CheckCircle2 size={15} color="#16a34a" />
              <span>SIMULATED MISSION OUTCOMES & THERMAL EQUILIBRIUM TRAJECTORY</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Flight Feasibility:</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '3px',
                  backgroundColor: simResult.summary.status === 'MISSION FEASIBLE' ? '#f0fdf4' : '#fef2f2',
                  color: simResult.summary.status === 'MISSION FEASIBLE' ? '#15803d' : '#b91c1c',
                  border: `1px solid ${simResult.summary.status === 'MISSION FEASIBLE' ? '#86efac' : '#fca5a5'}`
                }}
              >
                {simResult.summary.status}
              </span>
            </div>
          </div>

          <div className="panel-body">
            {/* Outcome KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '10px' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Total Fuel Burn</div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '2px' }}>
                  {simResult.summary.total_fuel_consumed_liters} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>L</span>
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  Avg: {simResult.summary.average_fuel_flow_lh} L/h
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '10px' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Peak CHT</div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: simResult.summary.peak_cht_c > 185 ? '#dc2626' : '#0f172a', marginTop: '2px' }}>
                  {simResult.summary.peak_cht_c} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>°C</span>
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  Thermal Margin: {simResult.summary.thermal_margin_pct}%
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '10px' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Mean EGT</div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '2px' }}>
                  {simResult.summary.mean_egt_c} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>°C</span>
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  Combustion equilibrium
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '10px' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Peak Vibration</div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: simResult.summary.peak_vibration_mms > 4.0 ? '#b45309' : '#0f172a', marginTop: '2px' }}>
                  {simResult.summary.peak_vibration_mms} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>mm/s</span>
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  Mechanical stress level
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '10px' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Mission End Health</div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: simResult.summary.final_health_index < 80 ? '#dc2626' : '#15803d', marginTop: '2px' }}>
                  {simResult.summary.final_health_index} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>/ 100</span>
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  Post-mission index
                </div>
              </div>
            </div>

            {/* Multi-parameter Trajectory SVG Chart */}
            <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '4px', padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                Thermodynamic Stabilization & Degradation Curve:
              </div>
              {renderTrajectoryChart()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

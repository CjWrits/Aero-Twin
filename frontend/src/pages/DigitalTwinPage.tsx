import React, { useState } from 'react';
import { Cpu, CheckCircle, ArrowRight, Activity, ShieldCheck, AlertCircle } from 'lucide-react';
import { LiveTelemetryResponse } from '../types';
import { EngineSchematic } from '../components/EngineSchematic';

interface DigitalTwinPageProps {
  telemetry: LiveTelemetryResponse | null;
}

export const DigitalTwinPage: React.FC<DigitalTwinPageProps> = ({ telemetry }) => {
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('combustion');

  if (!telemetry) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Awaiting Digital Twin link...</div>;
  }

  const obs = telemetry.observed;
  const exp = telemetry.expected;
  const res = telemetry.residuals;

  const pipelineStages = [
    { title: '1. PHYSICAL ENGINE', desc: '4-Cyl Turbo Aero-Piston Sensors', icon: Activity },
    { title: '2. TELEMETRY', desc: 'CAN / Serial Bus Ingestion', icon: ArrowRight },
    { title: '3. STATE ESTIMATION', desc: 'Kalman Filter & Data Validation', icon: ShieldCheck },
    { title: '4. PHYSICS MODEL', desc: 'Thermodynamic Flight Envelope', icon: Cpu },
    { title: '5. AI/ML ANALYTICS', desc: 'Isolation Forest Anomaly Scoring', icon: AlertCircle },
    { title: '6. VIRTUAL ENGINE STATE', desc: 'Synchronized Physics Replica', icon: Cpu },
    { title: '7. HEALTH / PREDICTION', desc: 'Subsystem Indices & RUL', icon: CheckCircle }
  ];

  const parameters = [
    { name: 'Exhaust Gas Temp (EGT)', unit: '°C', exp: exp.egt.toFixed(1), obs: obs.egt.toFixed(1), res: res.egt, conf: 94, tol: '±15.0 °C', sub: 'Combustion / Fuel Inj' },
    { name: 'Cylinder Head Temp (CHT)', unit: '°C', exp: exp.cht.toFixed(1), obs: obs.cht.toFixed(1), res: res.cht, conf: 95, tol: '±10.0 °C', sub: 'Cooling / Head' },
    { name: 'Engine Lubrication Pressure', unit: 'bar', exp: exp.oil_pressure.toFixed(2), obs: obs.oil_pressure.toFixed(2), res: res.oil_pressure, conf: 96, tol: '±0.40 bar', sub: 'Lubrication' },
    { name: 'Engine Oil Temperature', unit: '°C', exp: exp.oil_temperature.toFixed(1), obs: obs.oil_temperature.toFixed(1), res: res.oil_temperature, conf: 93, tol: '±8.0 °C', sub: 'Lubrication / Cooler' },
    { name: 'Fuel Flow Rate', unit: 'L/h', exp: exp.fuel_flow.toFixed(2), obs: obs.fuel_flow.toFixed(2), res: res.fuel_flow, conf: 92, tol: '±0.60 L/h', sub: 'Fuel Injection' },
    { name: 'Crankshaft Speed (RPM)', unit: 'rpm', exp: exp.rpm.toFixed(0), obs: obs.rpm.toFixed(0), res: res.rpm, conf: 98, tol: '±60 rpm', sub: 'Crankshaft / Gov' },
    { name: 'Block RMS Vibration', unit: 'mm/s', exp: exp.vibration.toFixed(2), obs: obs.vibration.toFixed(2), res: res.vibration, conf: 91, tol: '±0.80 mm/s', sub: 'Mechanical Kinematics' },
    { name: 'Bus Battery Voltage', unit: 'V', exp: exp.battery_voltage.toFixed(2), obs: obs.battery_voltage.toFixed(2), res: res.battery_voltage, conf: 99, tol: '±0.60 V', sub: 'Electrical' },
    { name: 'Alternator Output', unit: 'A', exp: exp.alternator_current.toFixed(1), obs: obs.alternator_current.toFixed(1), res: res.alternator_current, conf: 97, tol: '±4.0 A', sub: 'Electrical' },
    { name: 'Injection Advance Angle', unit: '° BTDC', exp: exp.injection_timing.toFixed(1), obs: obs.injection_timing.toFixed(1), res: res.injection_timing, conf: 95, tol: '±1.5 °', sub: 'Electronic ECU' }
  ];

  return (
    <div className="page-content">
      {/* Visual Pipeline Header */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Cpu size={15} color="#2563eb" />
            <span>DIGITAL TWIN INFORMATION FLOW ARCHITECTURE</span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Closed-Loop Telemetry to Virtual State Synchronization
          </span>
        </div>

        <div className="panel-body" style={{ padding: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
            {pipelineStages.map((st, i) => (
              <div
                key={i}
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '3px',
                  padding: '8px 10px',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#1e40af', letterSpacing: '0.02em' }}>
                  {st.title}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', lineHeight: 1.25 }}>
                  {st.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Central Visual Representation: Engine Schematic */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Activity size={15} color="#2563eb" />
            <span>AERO-PISTON SUBSYSTEM HEALTH & KINEMATIC TOPOLOGY</span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Interactive subsystem selection updates telemetry delta inspection
          </span>
        </div>

        <div className="panel-body">
          <EngineSchematic
            subsystems={telemetry.subsystems}
            selectedSubsystemKey={selectedSubsystem}
            onSelectSubsystem={setSelectedSubsystem}
          />
        </div>
      </div>

      {/* Digital Twin State Table: Expected vs Observed vs Residual */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <ShieldCheck size={15} color="#2563eb" />
            <span>DIGITAL TWIN STATE VECTOR (OBSERVED vs EXPECTED RESIDUAL ANALYSIS)</span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Twin Synchronization: <strong>{telemetry.twin_synchronization_pct.toFixed(1)}%</strong> | Residual = Observed - Expected
          </span>
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          <table className="eng-table">
            <thead>
              <tr>
                <th>Parameter Name</th>
                <th>Subsystem</th>
                <th>Expected State (Twin)</th>
                <th>Observed State (Sensors)</th>
                <th>Residual Δ</th>
                <th>Confidence</th>
                <th>Model Status</th>
              </tr>
            </thead>
            <tbody>
              {parameters.map((p) => {
                const isSignificant = Math.abs(p.res) > 0.001;
                const isWarning =
                  (p.name.includes('EGT') && Math.abs(p.res) > 20) ||
                  (p.name.includes('CHT') && Math.abs(p.res) > 15) ||
                  (p.name.includes('Oil Pressure') && p.res < -0.4) ||
                  (p.name.includes('Vibration') && p.res > 0.8);

                return (
                  <tr key={p.name}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: '#64748b' }}>{p.sub}</td>
                    <td className="mono" style={{ color: '#0369a1' }}>
                      {p.exp} {p.unit}
                    </td>
                    <td className="mono" style={{ fontWeight: 700 }}>
                      {p.obs} {p.unit}
                    </td>
                    <td
                      className="mono"
                      style={{
                        fontWeight: 700,
                        color: isWarning ? '#dc2626' : (isSignificant ? '#b45309' : '#15803d')
                      }}
                    >
                      {p.res > 0 ? `+${p.res}` : p.res} {p.unit}
                    </td>
                    <td className="mono">{p.conf}%</td>
                    <td>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '2px',
                          backgroundColor: isWarning ? '#fef2f2' : '#f0fdf4',
                          color: isWarning ? '#b91c1c' : '#15803d',
                          border: `1px solid ${isWarning ? '#fca5a5' : '#86efac'}`
                        }}
                      >
                        {isWarning ? 'SIGNIFICANT RESIDUAL' : 'WITHIN NOMINAL BAND'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

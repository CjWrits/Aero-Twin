import React, { useState } from 'react';
import { AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';

interface FaultInjectionBarProps {
  currentFault: {
    type: string;
    severity: number;
    active: boolean;
  };
  onInject: (type: string, severity: number, active: boolean) => void;
  anomalyDetected: boolean;
  healthIndex: number;
}

const FAULT_OPTIONS = [
  'Normal Operation',
  'Injector Degradation',
  'Misfire',
  'Lubrication Degradation',
  'Cooling Degradation',
  'Overheating',
  'Abnormal Vibration',
  'Sensor Drift',
  'Combustion Instability'
];

export const FaultInjectionBar: React.FC<FaultInjectionBarProps> = ({
  currentFault,
  onInject,
  anomalyDetected,
  healthIndex
}) => {
  const [selectedType, setSelectedType] = useState<string>(currentFault.type || 'Normal Operation');
  const [severity, setSeverity] = useState<number>(currentFault.severity || 0.65);

  const handleApply = (type: string, sev: number) => {
    setSelectedType(type);
    if (type === 'Normal Operation') {
      onInject(type, 0.0, false);
    } else {
      onInject(type, sev, true);
    }
  };

  const handleToggle = () => {
    if (currentFault.active) {
      handleApply('Normal Operation', 0.0);
    } else {
      handleApply(selectedType === 'Normal Operation' ? 'Injector Degradation' : selectedType, severity);
    }
  };

  const isFaultActive = currentFault.active && currentFault.type !== 'Normal Operation';

  return (
    <div className="fault-console-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Zap size={14} color={isFaultActive ? '#ef4444' : '#60a5fa'} />
        <span style={{ fontWeight: 700, letterSpacing: '0.04em', color: '#f8fafc' }}>
          FAULT INJECTION CONSOLE:
        </span>
      </div>

      <div className="fault-selector-group">
        <label style={{ fontSize: '11px', color: '#94a3b8' }}>Fault Model:</label>
        <select
          className="fault-select"
          value={selectedType}
          onChange={(e) => {
            const newType = e.target.value;
            setSelectedType(newType);
            if (isFaultActive || newType === 'Normal Operation') {
              handleApply(newType, severity);
            }
          }}
        >
          {FAULT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        {selectedType !== 'Normal Operation' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Severity:</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={severity}
              onChange={(e) => {
                const s = parseFloat(e.target.value);
                setSeverity(s);
                if (isFaultActive) {
                  onInject(selectedType, s, true);
                }
              }}
              style={{ width: '80px', cursor: 'pointer' }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', minWidth: '32px' }}>
              {Math.round(severity * 100)}%
            </span>
          </div>
        )}

        <button
          className={`btn-eng ${isFaultActive ? 'btn-eng-danger' : 'btn-eng-warning'}`}
          onClick={handleToggle}
          style={{ padding: '4px 10px', fontSize: '11px' }}
        >
          {isFaultActive ? 'CLEAR FAULT' : 'INJECT FAULT'}
        </button>
      </div>

      {/* Real-time Cause-Effect Cascade Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px' }}>
        <span style={{ color: '#94a3b8' }}>Cascade:</span>
        <span style={{ color: isFaultActive ? '#f87171' : '#4ade80', fontWeight: 600 }}>
          {isFaultActive ? `1. ${currentFault.type}` : '1. Nominal Dynamics'}
        </span>
        <span style={{ color: '#64748b' }}>→</span>
        <span style={{ color: isFaultActive ? '#fbbf24' : '#94a3b8' }}>
          2. Residual Shift
        </span>
        <span style={{ color: '#64748b' }}>→</span>
        <span style={{ color: anomalyDetected ? '#f87171' : '#94a3b8', fontWeight: anomalyDetected ? 700 : 400 }}>
          3. ML Alert ({anomalyDetected ? 'TRIPPED' : 'QUIET'})
        </span>
        <span style={{ color: '#64748b' }}>→</span>
        <span style={{ color: healthIndex < 88 ? '#f87171' : '#4ade80', fontWeight: 600 }}>
          4. Health: {healthIndex}/100
        </span>
      </div>
    </div>
  );
};

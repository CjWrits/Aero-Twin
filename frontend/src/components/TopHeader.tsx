import React from 'react';
import { RotateCcw, PlayCircle, ShieldCheck, Radio } from 'lucide-react';
import { SystemStatus } from '../types';

interface TopHeaderProps {
  systemStatus: SystemStatus | null;
  onOpenDemo: () => void;
  onResetEngine: () => void;
  syncPct: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  systemStatus,
  onOpenDemo,
  onResetEngine,
  syncPct
}) => {
  return (
    <header className="top-header">
      <div className="top-header-left">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', letterSpacing: '0.04em' }}>
              AEROTWIN
            </span>
            <span style={{ color: '#94a3b8' }}>|</span>
            <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>
              Digital Twin & Propulsion Health Monitoring
            </span>
          </div>
        </div>

        <div className="top-header-badges">
          <span className="badge badge-online">
            <span className="led-indicator led-green"></span>
            {systemStatus?.system_status || 'SYSTEM ONLINE'}
          </span>

          <span className="badge badge-sim">
            <Radio size={11} />
            {systemStatus?.data_source || 'SIMULATION / TEST DATA'}
          </span>

          <span className="badge badge-engine">
            ENGINE: <strong>{systemStatus?.engine_id || 'ENG-01'}</strong>
          </span>

          <span className="badge badge-mission">
            MISSION: <strong>{systemStatus?.mission_id || 'MISSION-042'}</strong>
          </span>
        </div>
      </div>

      <div className="top-header-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px', fontSize: '11px', color: '#475569' }}>
          <ShieldCheck size={14} color="#2563eb" />
          <span>Twin Sync:</span>
          <strong style={{ fontFamily: 'var(--font-mono)', color: '#0f172a' }}>{syncPct.toFixed(1)}%</strong>
        </div>

        <button className="btn-eng btn-eng-primary" onClick={onOpenDemo}>
          <PlayCircle size={13} />
          <span>DEMO MODE</span>
        </button>

        <button className="btn-eng" onClick={onResetEngine} title="Reset engine to nominal endurance cruise">
          <RotateCcw size={13} />
          <span>RESET ENG</span>
        </button>
      </div>
    </header>
  );
};

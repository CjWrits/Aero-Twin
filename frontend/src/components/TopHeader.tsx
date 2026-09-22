import React from 'react';
import { RotateCcw, PlayCircle, ShieldCheck, Radio, Menu } from 'lucide-react';
import { SystemStatus } from '../types';

interface TopHeaderProps {
  systemStatus: SystemStatus | null;
  onOpenDemo: () => void;
  onResetEngine: () => void;
  syncPct: number;
  onToggleSidebar?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  systemStatus,
  onOpenDemo,
  onResetEngine,
  syncPct,
  onToggleSidebar
}) => {
  return (
    <header className="top-header">
      <div className="top-header-left">
        {onToggleSidebar && (
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </button>
        )}

        <div className="top-header-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', letterSpacing: '0.04em' }}>
              AEROTWIN
            </span>
            <span className="hide-on-mobile" style={{ color: '#94a3b8' }}>|</span>
            <span className="top-header-sub hide-on-mobile" style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>
              Digital Twin & Propulsion Health Monitoring
            </span>
          </div>
        </div>

        <div className="top-header-badges">
          <span className="badge badge-online">
            <span className="led-indicator led-green"></span>
            <span>{systemStatus?.system_status || 'ONLINE'}</span>
          </span>

          <span className="badge badge-sim hide-on-small-mobile">
            <Radio size={11} />
            <span>{systemStatus?.data_source || 'SIMULATION'}</span>
          </span>

          <span className="badge badge-engine hide-on-mobile">
            ENG: <strong>{systemStatus?.engine_id || 'ENG-01'}</strong>
          </span>

          <span className="badge badge-mission hide-on-mobile">
            MSN: <strong>{systemStatus?.mission_id || 'MSN-042'}</strong>
          </span>
        </div>
      </div>

      <div className="top-header-right">
        <div className="top-header-sync" style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '4px', fontSize: '11px', color: '#475569' }}>
          <ShieldCheck size={14} color="#2563eb" />
          <span className="hide-on-small-mobile">Sync:</span>
          <strong style={{ fontFamily: 'var(--font-mono)', color: '#0f172a' }}>{syncPct.toFixed(1)}%</strong>
        </div>

        <button className="btn-eng btn-eng-primary" onClick={onOpenDemo} title="Guided Demonstration Mode">
          <PlayCircle size={13} />
          <span>DEMO</span>
        </button>

        <button className="btn-eng" onClick={onResetEngine} title="Reset engine to nominal endurance cruise">
          <RotateCcw size={13} />
          <span className="hide-on-small-mobile">RESET ENG</span>
        </button>
      </div>
    </header>
  );
};

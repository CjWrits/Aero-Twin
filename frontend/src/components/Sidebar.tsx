import React from 'react';
import {
  Gauge,
  Activity,
  Cpu,
  HeartPulse,
  TrendingDown,
  Navigation,
  RotateCcw,
  AlertTriangle,
  Database,
  Network
} from 'lucide-react';
import { SystemStatus } from '../types';

interface SidebarProps {
  activePage: string;
  onSelectPage: (pageId: string) => void;
  systemStatus: SystemStatus | null;
}

const navItems = [
  { id: 'overview', label: '1. Overview', icon: Gauge },
  { id: 'live-engine', label: '2. Live Engine', icon: Activity },
  { id: 'digital-twin', label: '3. Digital Twin', icon: Cpu },
  { id: 'health-diagnostics', label: '4. Health & Diagnostics', icon: HeartPulse },
  { id: 'predictive-maint', label: '5. Predictive Maintenance', icon: TrendingDown },
  { id: 'mission-sim', label: '6. Mission Simulation', icon: Navigation },
  { id: 'mission-replay', label: '7. Mission Replay', icon: RotateCcw },
  { id: 'fault-analysis', label: '8. Fault Analysis', icon: AlertTriangle },
  { id: 'historical-data', label: '9. Historical Data', icon: Database },
  { id: 'system-arch', label: '10. System Architecture', icon: Network }
];

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onSelectPage, systemStatus }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <Cpu size={18} color="#60a5fa" />
          <span>AEROTWIN</span>
        </div>
        <div className="sidebar-subtitle">
          Propulsion Digital Twin · MALE UAV
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPage(item.id)}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-row">
          <span>System Status:</span>
          <span className="sidebar-footer-val" style={{ color: '#4ade80' }}>
            ● ONLINE
          </span>
        </div>
        <div className="sidebar-footer-row">
          <span>Data Connection:</span>
          <span className="sidebar-footer-val">TELEMETRY SYNC</span>
        </div>
        <div className="sidebar-footer-row">
          <span>Model Version:</span>
          <span className="sidebar-footer-val">v1.4.2-aero</span>
        </div>
        <div className="sidebar-footer-row">
          <span>Last Sync:</span>
          <span className="sidebar-footer-val">
            {systemStatus ? systemStatus.last_sync.slice(11, 19) + ' UTC' : '00:00:00 UTC'}
          </span>
        </div>
      </div>
    </aside>
  );
};

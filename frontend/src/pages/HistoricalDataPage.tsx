import React, { useState, useEffect } from 'react';
import { Database, Search, Calendar, Filter, Wrench, Fuel, Clock } from 'lucide-react';
import { fetchHistoricalData } from '../api';
import { HistoricalMission, HistoricalSummary, MaintenanceRecord, FaultEvent } from '../types';

export const HistoricalDataPage: React.FC = () => {
  const [data, setData] = useState<{
    summary: HistoricalSummary;
    missions: HistoricalMission[];
    faults: FaultEvent[];
    maintenance: MaintenanceRecord[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'missions' | 'maintenance' | 'faults'>('missions');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchHistoricalData()
      .then((d) => setData(d))
      .catch((err) => console.error('Failed to load historical data:', err));
  }, []);

  if (!data) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading historical propulsion database...</div>;
  }

  const { summary, missions, maintenance, faults } = data;

  const filteredMissions = missions.filter((m) =>
    m.mission_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.date_str.includes(searchQuery)
  );

  return (
    <div className="page-content">
      {/* Top Historical KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div className="panel" style={{ padding: '12px' }}>
          <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Operating Hours
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '2px' }}>
            {summary.total_operating_hours} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>hrs</span>
          </div>
          <div style={{ fontSize: '10.5px', color: '#16a34a', marginTop: '2px' }}>
            Time Since Overhaul (TSO)
          </div>
        </div>

        <div className="panel" style={{ padding: '12px' }}>
          <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Cumulative Fuel Burned
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '2px' }}>
            {summary.total_fuel_consumed_liters} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>L</span>
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
            Avg: 17.6 L/h cruise
          </div>
        </div>

        <div className="panel" style={{ padding: '12px' }}>
          <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Fleet Mean Cruise CHT
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '2px' }}>
            {summary.average_cruise_cht} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>°C</span>
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
            Nominal equilibrium
          </div>
        </div>

        <div className="panel" style={{ padding: '12px' }}>
          <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Mean Fleet Vibration
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '2px' }}>
            {summary.mean_fleet_vibration} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>mm/s</span>
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
            Normal kinematic limit: 3.5
          </div>
        </div>

        <div className="panel" style={{ padding: '12px' }}>
          <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Logged Sorties
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#1d4ed8', marginTop: '2px' }}>
            {summary.completed_missions_count}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
            {summary.recorded_fault_events_count} events flagged
          </div>
        </div>
      </div>

      {/* Main Historical Table & Filtering */}
      <div className="panel">
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={15} color="#2563eb" />
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className="btn-eng"
                onClick={() => setActiveTab('missions')}
                style={{
                  backgroundColor: activeTab === 'missions' ? '#eff6ff' : '#ffffff',
                  borderColor: activeTab === 'missions' ? '#1d4ed8' : '#cbd5e1',
                  color: activeTab === 'missions' ? '#1d4ed8' : '#334155',
                  fontWeight: activeTab === 'missions' ? 700 : 500
                }}
              >
                Sortie Logs ({missions.length})
              </button>

              <button
                className="btn-eng"
                onClick={() => setActiveTab('maintenance')}
                style={{
                  backgroundColor: activeTab === 'maintenance' ? '#eff6ff' : '#ffffff',
                  borderColor: activeTab === 'maintenance' ? '#1d4ed8' : '#cbd5e1',
                  color: activeTab === 'maintenance' ? '#1d4ed8' : '#334155',
                  fontWeight: activeTab === 'maintenance' ? 700 : 500
                }}
              >
                Maintenance Log ({maintenance.length})
              </button>

              <button
                className="btn-eng"
                onClick={() => setActiveTab('faults')}
                style={{
                  backgroundColor: activeTab === 'faults' ? '#eff6ff' : '#ffffff',
                  borderColor: activeTab === 'faults' ? '#1d4ed8' : '#cbd5e1',
                  color: activeTab === 'faults' ? '#1d4ed8' : '#334155',
                  fontWeight: activeTab === 'faults' ? 700 : 500
                }}
              >
                Historical Faults ({faults.length})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} color="#64748b" />
            <input
              type="text"
              placeholder="Search by mission, date, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                border: '1px solid var(--border-medium)',
                borderRadius: '4px',
                width: '180px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          {activeTab === 'missions' && (
            <table className="eng-table">
              <thead>
                <tr>
                  <th>Mission ID</th>
                  <th>Date</th>
                  <th>Callsign</th>
                  <th>Duration</th>
                  <th>Mean Altitude</th>
                  <th>Mean RPM</th>
                  <th>Mean CHT</th>
                  <th>Mean EGT</th>
                  <th>Fuel Burn</th>
                  <th>Health Index</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMissions.map((m) => (
                  <tr key={m.mission_id}>
                    <td className="mono" style={{ fontWeight: 700, color: '#1d4ed8' }}>{m.mission_id}</td>
                    <td className="mono">{m.date_str}</td>
                    <td className="mono">{m.callsign}</td>
                    <td className="mono">{m.duration_hours} h</td>
                    <td className="mono">{m.avg_altitude_m} m</td>
                    <td className="mono">{m.avg_rpm.toFixed(0)}</td>
                    <td className="mono">{m.avg_cht_c.toFixed(1)} °C</td>
                    <td className="mono">{m.avg_egt_c.toFixed(1)} °C</td>
                    <td className="mono">{m.fuel_consumed_liters} L</td>
                    <td className="mono" style={{ fontWeight: 700, color: m.final_health_index < 88 ? '#b45309' : '#15803d' }}>
                      {m.final_health_index}%
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '2px',
                          backgroundColor: m.fault_count > 0 ? '#fffbeb' : '#f0fdf4',
                          color: m.fault_count > 0 ? '#b45309' : '#15803d',
                          border: `1px solid ${m.fault_count > 0 ? '#fcd34d' : '#86efac'}`
                        }}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'maintenance' && (
            <table className="eng-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Engine Hours</th>
                  <th>Date</th>
                  <th>Action Type</th>
                  <th>Technician</th>
                  <th>Engineering Details</th>
                  <th>Sign-off</th>
                </tr>
              </thead>
              <tbody>
                {maintenance.map((rec) => (
                  <tr key={rec.record_id}>
                    <td className="mono" style={{ fontWeight: 700, color: '#1d4ed8' }}>{rec.record_id}</td>
                    <td className="mono">{rec.engine_hours} h</td>
                    <td className="mono">{rec.date_str}</td>
                    <td style={{ fontWeight: 600 }}>{rec.action_type}</td>
                    <td>{rec.technician}</td>
                    <td style={{ maxWidth: '380px' }}>{rec.description}</td>
                    <td>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#15803d', backgroundColor: '#f0fdf4', border: '1px solid #86efac', padding: '2px 6px', borderRadius: '2px' }}>
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'faults' && (
            <table className="eng-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Mission</th>
                  <th>Timestamp</th>
                  <th>Subsystem</th>
                  <th>Observed Residual</th>
                  <th>Confidence</th>
                  <th>Required Maintenance</th>
                </tr>
              </thead>
              <tbody>
                {faults.map((f) => (
                  <tr key={f.event_id}>
                    <td className="mono" style={{ fontWeight: 700, color: '#1d4ed8' }}>{f.event_id}</td>
                    <td className="mono">{f.mission_id}</td>
                    <td className="mono">{f.timestamp_str}</td>
                    <td style={{ fontWeight: 600 }}>{f.subsystem}</td>
                    <td className="mono" style={{ fontWeight: 700, color: '#b45309' }}>{f.residual}</td>
                    <td className="mono">{f.confidence_pct}%</td>
                    <td>{f.required_action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

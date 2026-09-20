import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, Search, Filter, Wrench } from 'lucide-react';
import { fetchFaultEvents } from '../api';
import { FaultEvent } from '../types';

export const FaultAnalysisPage: React.FC = () => {
  const [events, setEvents] = useState<FaultEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('EVT-0042');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  useEffect(() => {
    fetchFaultEvents()
      .then((data) => setEvents(data))
      .catch((err) => console.error('Failed to load fault events:', err));
  }, []);

  const selectedEvent = events.find((e) => e.event_id === selectedEventId) || events[0];

  const filteredEvents = events.filter((e) => {
    if (filterSeverity !== 'ALL' && e.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="page-content">
      {/* Top Banner */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <AlertTriangle size={15} color="#b45309" />
            <span>AEROSPACE PROPULSION FAULT ANALYSIS & INCIDENT INVESTIGATION</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Filter Severity:</span>
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                style={{
                  padding: '2px 8px',
                  fontSize: '10.5px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: filterSeverity === sev ? '#1d4ed8' : '#cbd5e1',
                  backgroundColor: filterSeverity === sev ? '#eff6ff' : '#ffffff',
                  color: filterSeverity === sev ? '#1d4ed8' : '#475569',
                  fontWeight: filterSeverity === sev ? 700 : 500
                }}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          <table className="eng-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Mission</th>
                <th>Flight Timestamp</th>
                <th>Subsystem</th>
                <th>Observed Parameter</th>
                <th>Model Residual</th>
                <th>Confidence</th>
                <th>Severity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((evt) => {
                const isSelected = evt.event_id === selectedEventId;
                const isHigh = evt.severity === 'HIGH';
                return (
                  <tr
                    key={evt.event_id}
                    onClick={() => setSelectedEventId(evt.event_id)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#eff6ff' : undefined
                    }}
                  >
                    <td className="mono" style={{ fontWeight: 700, color: '#1d4ed8' }}>
                      {evt.event_id}
                    </td>
                    <td className="mono">{evt.mission_id}</td>
                    <td className="mono">{evt.timestamp_str}</td>
                    <td style={{ fontWeight: 600 }}>{evt.subsystem}</td>
                    <td>{evt.observed_param} ({evt.observed_value})</td>
                    <td className="mono" style={{ fontWeight: 700, color: evt.residual.startsWith('+') ? '#b45309' : '#0f172a' }}>
                      {evt.residual}
                    </td>
                    <td className="mono">{evt.confidence_pct}%</td>
                    <td>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '2px',
                          backgroundColor: isHigh ? '#fef2f2' : '#fffbeb',
                          color: isHigh ? '#b91c1c' : '#b45309',
                          border: `1px solid ${isHigh ? '#fca5a5' : '#fcd34d'}`
                        }}
                      >
                        {evt.severity}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-eng"
                        style={{ padding: '2px 8px', fontSize: '10.5px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventId(evt.event_id);
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Technical Event Inspection Dossier */}
      {selectedEvent && (
        <div className="panel" style={{ borderLeft: '4px solid #1d4ed8' }}>
          <div className="panel-header">
            <div className="panel-title">
              <ShieldAlert size={15} color="#1d4ed8" />
              <span>EVENT INVESTIGATION DOSSIER: {selectedEvent.event_id}</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Sortie: <strong className="mono">{selectedEvent.mission_id}</strong> @ <strong className="mono">{selectedEvent.timestamp_str}</strong>
            </span>
          </div>

          <div className="panel-body">
            {/* Top parameter matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '10px' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Observed Parameter</div>
                <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '2px' }}>
                  {selectedEvent.observed_param}: {selectedEvent.observed_value}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Expected Nominal: <span className="mono">{selectedEvent.expected_value}</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '10px' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Model Residual Δ</div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#b45309', marginTop: '2px' }}>
                  {selectedEvent.residual}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Exceeds 3.0σ statistical envelope
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '10px' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Model Classification</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  {selectedEvent.probable_fault}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Model Confidence: <strong style={{ color: '#0284c7' }}>{selectedEvent.confidence_pct}%</strong>
                </div>
              </div>
            </div>

            {/* Associated Telemetry Signatures */}
            <div style={{ background: '#ffffff', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                Coupled Telemetry Signals (Multi-Variable Signature):
              </div>
              <p style={{ fontSize: '12px', color: '#1e293b', lineHeight: 1.4 }}>
                {selectedEvent.associated_signals}
              </p>
            </div>

            {/* Model Detection Method */}
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                Digital Twin Detection Logic:
              </div>
              <p style={{ fontSize: '12px', color: '#334155', lineHeight: 1.45 }}>
                {selectedEvent.model_detection}
              </p>
            </div>

            {/* Required Action */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Wrench size={15} color="#1d4ed8" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>
                  Required Ground Maintenance Action
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#1e3a8a', fontWeight: 500 }}>
                {selectedEvent.required_action}
              </p>
            </div>

            <div style={{ fontSize: '10.5px', color: '#94a3b8', fontStyle: 'italic', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
              Model output generated for engineering demonstration and research analysis. Maintenance verification must be signed off by a certified propulsion technician before release to service.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

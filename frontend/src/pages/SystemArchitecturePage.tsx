import React from 'react';
import { Network, Database, Cpu, Activity, ShieldCheck, CheckCircle2, Layers, Server, Terminal } from 'lucide-react';

export const SystemArchitecturePage: React.FC = () => {
  return (
    <div className="page-content">
      {/* Visual System Architecture Diagram */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Network size={15} color="#2563eb" />
            <span>AEROTWIN END-TO-END SYSTEM ARCHITECTURE PIPELINE</span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Multi-Tier Ground Station & Propulsion Digital Twin Blueprint
          </span>
        </div>

        <div className="panel-body">
          <svg viewBox="0 0 860 460" style={{ width: '100%', height: 'auto', maxHeight: '420px' }}>
            <defs>
              <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 z" fill="#475569" />
              </marker>
            </defs>

            {/* Stage 1: Engine & Sensor Input */}
            <g transform="translate(30, 20)">
              <rect width="180" height="85" rx="4" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
              <text x="90" y="24" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">1. ENGINE & SENSORS</text>
              <text x="90" y="42" textAnchor="middle" fontSize="9" fill="#475569">• 4-Cyl Horizontally Opposed</text>
              <text x="90" y="56" textAnchor="middle" fontSize="9" fill="#475569">• Thermocouples (CHT/EGT)</text>
              <text x="90" y="70" textAnchor="middle" fontSize="9" fill="#475569">• Piezo Oil Press & Accel</text>
            </g>

            {/* Arrow 1 -> 2 */}
            <line x1="210" y1="62" x2="250" y2="62" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arr)" />

            {/* Stage 2: Telemetry Ingestion */}
            <g transform="translate(255, 20)">
              <rect width="170" height="85" rx="4" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
              <text x="85" y="24" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">2. TELEMETRY INGESTION</text>
              <text x="85" y="42" textAnchor="middle" fontSize="9" fill="#475569">• CAN / SocketCAN Bus</text>
              <text x="85" y="56" textAnchor="middle" fontSize="9" fill="#475569">• Serial FADEC / ECU link</text>
              <text x="85" y="70" textAnchor="middle" fontSize="9" fill="#475569">• Rate Limiter & Frame Sync</text>
            </g>

            {/* Arrow 2 -> 3 */}
            <line x1="425" y1="62" x2="465" y2="62" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arr)" />

            {/* Stage 3: Data Validation & Conditioning */}
            <g transform="translate(470, 20)">
              <rect width="170" height="85" rx="4" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
              <text x="85" y="24" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">3. DATA CONDITIONING</text>
              <text x="85" y="42" textAnchor="middle" fontSize="9" fill="#475569">• Range / Plausibility Check</text>
              <text x="85" y="56" textAnchor="middle" fontSize="9" fill="#475569">• Kalman State Filter</text>
              <text x="85" y="70" textAnchor="middle" fontSize="9" fill="#475569">• Sensor Drift Decoupling</text>
            </g>

            {/* Arrow 3 -> Digital Twin Box */}
            <line x1="555" y1="105" x2="555" y2="155" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arr)" />

            {/* Big Stage 4: Digital Twin Core (Wide Box) */}
            <g transform="translate(140, 160)">
              <rect width="680" height="110" rx="4" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
              <text x="340" y="25" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e40af">
                4. DIGITAL TWIN CORE ENGINE (STATE ESTIMATION & RESIDUAL SYNCHRONIZATION)
              </text>

              {/* 4 Internal Sub-blocks */}
              <g transform="translate(20, 38)">
                <rect width="145" height="58" rx="3" fill="#ffffff" stroke="#93c5fd" strokeWidth="1" />
                <text x="72" y="22" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1e3a8a">Physics Model</text>
                <text x="72" y="38" textAnchor="middle" fontSize="8.5" fill="#64748b">ISA Atmosphere &</text>
                <text x="72" y="49" textAnchor="middle" fontSize="8.5" fill="#64748b">Thermodynamics</text>
              </g>

              <g transform="translate(180, 38)">
                <rect width="145" height="58" rx="3" fill="#ffffff" stroke="#93c5fd" strokeWidth="1" />
                <text x="72" y="22" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1e3a8a">State Estimation</text>
                <text x="72" y="38" textAnchor="middle" fontSize="8.5" fill="#64748b">Expected vs Observed</text>
                <text x="72" y="49" textAnchor="middle" fontSize="8.5" fill="#64748b">Real-time Vectors</text>
              </g>

              <g transform="translate(340, 38)">
                <rect width="145" height="58" rx="3" fill="#ffffff" stroke="#93c5fd" strokeWidth="1" />
                <text x="72" y="22" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1e3a8a">Residual Engine</text>
                <text x="72" y="38" textAnchor="middle" fontSize="8.5" fill="#64748b">Δ = Obs - Exp</text>
                <text x="72" y="49" textAnchor="middle" fontSize="8.5" fill="#64748b">Multi-Signal Deltas</text>
              </g>

              <g transform="translate(500, 38)">
                <rect width="145" height="58" rx="3" fill="#ffffff" stroke="#93c5fd" strokeWidth="1" />
                <text x="72" y="22" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1e3a8a">Performance Map</text>
                <text x="72" y="38" textAnchor="middle" fontSize="8.5" fill="#64748b">BSFC / Torque</text>
                <text x="72" y="49" textAnchor="middle" fontSize="8.5" fill="#64748b">Turbo Boost Curve</text>
              </g>
            </g>

            {/* Arrow Digital Twin -> AI/ML Analytics */}
            <line x1="480" y1="270" x2="480" y2="310" stroke="#475569" strokeWidth="1.5" markerEnd="url(#arr)" />

            {/* Big Stage 5: AI/ML Analytics Box */}
            <g transform="translate(140, 315)">
              <rect width="680" height="95" rx="4" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1.75" />
              <text x="340" y="24" textAnchor="middle" fontSize="12" fontWeight="700" fill="#15803d">
                5. AI / ML ANALYTICS & PREDICTIVE HEALTH ENGINE
              </text>

              <g transform="translate(25, 36)">
                <rect width="145" height="46" rx="3" fill="#ffffff" stroke="#86efac" strokeWidth="1" />
                <text x="72" y="20" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#166534">Isolation Forest</text>
                <text x="72" y="34" textAnchor="middle" fontSize="8.5" fill="#64748b">Unsupervised Anomaly</text>
              </g>

              <g transform="translate(185, 36)">
                <rect width="145" height="46" rx="3" fill="#ffffff" stroke="#86efac" strokeWidth="1" />
                <text x="72" y="20" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#166534">Fault Classifier</text>
                <text x="72" y="34" textAnchor="middle" fontSize="8.5" fill="#64748b">Diagnostic Matrix</text>
              </g>

              <g transform="translate(345, 36)">
                <rect width="145" height="46" rx="3" fill="#ffffff" stroke="#86efac" strokeWidth="1" />
                <text x="72" y="20" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#166534">Degradation Tracker</text>
                <text x="72" y="34" textAnchor="middle" fontSize="8.5" fill="#64748b">Multi-Order Aging</text>
              </g>

              <g transform="translate(505, 36)">
                <rect width="145" height="46" rx="3" fill="#ffffff" stroke="#86efac" strokeWidth="1" />
                <text x="72" y="20" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#166534">RUL Estimator</text>
                <text x="72" y="34" textAnchor="middle" fontSize="8.5" fill="#64748b">Flight Hours Margin</text>
              </g>
            </g>

            {/* Storage Subsystem (Left side column) */}
            <g transform="translate(10, 175)">
              <rect width="115" height="235" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
              <text x="57" y="24" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a">STORAGE TIER</text>
              <text x="57" y="36" textAnchor="middle" fontSize="8.5" fill="#64748b">(SQLite / Timescale)</text>

              <rect x="8" y="50" width="99" height="36" rx="2" fill="#ffffff" stroke="#e2e8f0" />
              <text x="57" y="66" textAnchor="middle" fontSize="8.5" fontWeight="600">Telemetry Log</text>
              <text x="57" y="78" textAnchor="middle" fontSize="7.5" fill="#64748b">1 Hz Ring Buffer</text>

              <rect x="8" y="94" width="99" height="36" rx="2" fill="#ffffff" stroke="#e2e8f0" />
              <text x="57" y="110" textAnchor="middle" fontSize="8.5" fontWeight="600">Mission Profiles</text>
              <text x="57" y="122" textAnchor="middle" fontSize="7.5" fill="#64748b">Sortie Records</text>

              <rect x="8" y="138" width="99" height="36" rx="2" fill="#ffffff" stroke="#e2e8f0" />
              <text x="57" y="154" textAnchor="middle" fontSize="8.5" fontWeight="600">Fault Events</text>
              <text x="57" y="166" textAnchor="middle" fontSize="7.5" fill="#64748b">EVT-0042 etc.</text>

              <rect x="8" y="182" width="99" height="36" rx="2" fill="#ffffff" stroke="#e2e8f0" />
              <text x="57" y="198" textAnchor="middle" fontSize="8.5" fontWeight="600">Maintenance</text>
              <text x="57" y="210" textAnchor="middle" fontSize="7.5" fill="#64748b">Inspection Logs</text>
            </g>

            {/* Storage bi-directional connecting line */}
            <line x1="125" y1="215" x2="140" y2="215" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="2,2" />
            <line x1="125" y1="360" x2="140" y2="360" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="2,2" />
          </svg>
        </div>
      </div>

      {/* Technical Defense & Evaluator Questioning Reference */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Layers size={15} color="#2563eb" />
            <span>TECHNICAL EVALUATION & DEFENSE REFERENCE</span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Prepared answers for technical viva / faculty demonstration questions
          </span>
        </div>

        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a', marginBottom: '4px' }}>
                Q1: How does the Digital Twin calculate the "Expected State"?
              </div>
              <p style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.45 }}>
                The expected state is determined by a deterministic thermodynamic model parameterizing ISA ambient lapse rate, turbocharger wastegate boost capacity, and electronic ECU fuel-air tables as a function of atmospheric inputs (Altitude, Ambient Temperature) and command levers (Throttle, Load). This provides the baseline physical truth against which sensor noise and degradation are isolated.
              </p>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a', marginBottom: '4px' }}>
                Q2: How does the system distinguish sensor drift from real component failure?
              </div>
              <p style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.45 }}>
                Through thermodynamic cross-coupling validation. For instance, in our <em>Sensor Drift</em> test case, CHT indicates high thermal levels, but EGT, oil temperature, and vibration remain normal. The Digital Twin recognizes the violation of heat balance physics and flags sensor instrumentation drift rather than genuine cylinder overheating.
              </p>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a', marginBottom: '4px' }}>
                Q3: What Machine Learning method is used and why?
              </div>
              <p style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.45 }}>
                We utilize an <strong>Isolation Forest</strong> algorithm implemented in scikit-learn. It is trained entirely on nominal physics-derived operating envelopes across varying altitudes and power settings. Because true aviation catastrophic failure data is rare in real life, unsupervised anomaly detection is the recognized aerospace engineering industry standard.
              </p>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a', marginBottom: '4px' }}>
                Q4: How is Remaining Useful Life (RUL) estimated?
              </div>
              <p style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.45 }}>
                Rather than claiming black-box certainty, AEROTWIN uses a transparent wear acceleration trend curve based on multi-variable residual accumulation. If the health index falls into accelerated decay, RUL is projected forward with statistical 80% confidence interval bands until the critical maintenance threshold (Health &lt; 60) is reached.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, AlertTriangle, ShieldAlert, CheckCircle2, FastForward, Clock } from 'lucide-react';
import { fetchMission042Replay } from '../api';
import { Mission042ReplayResponse, ReplaySample } from '../types';

export const MissionReplayPage: React.FC = () => {
  const [replayData, setReplayData] = useState<Mission042ReplayResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x
  const timerRef = useRef<any>(null);

  useEffect(() => {
    fetchMission042Replay()
      .then((data) => {
        setReplayData(data);
      })
      .catch((err) => console.error('Failed to load replay data:', err));
  }, []);

  useEffect(() => {
    if (isPlaying && replayData && replayData.timeline.length > 0) {
      const intervalMs = 1000 / playbackSpeed;
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= replayData.timeline.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, replayData]);

  if (!replayData || replayData.timeline.length === 0) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading MISSION-042 recorded flight telemetry...</div>;
  }

  const currentSample: ReplaySample = replayData.timeline[currentIndex] || replayData.timeline[0];
  const milestones = replayData.metadata.milestones;

  const handleSeek = (idx: number) => {
    setCurrentIndex(idx);
  };

  const jumpToMilestone = (sec: number) => {
    // Find closest sample index
    let closestIdx = 0;
    let minDiff = Infinity;
    replayData.timeline.forEach((s, i) => {
      const diff = Math.abs(s.seconds - sec);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });
    setCurrentIndex(closestIdx);
  };

  const isAnomalyPoint = currentSample.seconds >= 5175; // 01:26:15
  const isAlertPoint = currentSample.seconds >= 5500; // 01:31:40

  return (
    <div className="page-content">
      {/* Header Info Panel */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Clock size={15} color="#2563eb" />
            <span>HISTORICAL MISSION TELEMETRY REPLAY · MISSION-042</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Total Flight Duration:</span>
            <span className="mono" style={{ fontWeight: 700 }}>{replayData.metadata.total_duration_str}</span>
            <span className="badge badge-engine">ENG-01</span>
          </div>
        </div>

        <div className="panel-body">
          {/* Main Scrubber Control Bar */}
          <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '14px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  className={`btn-eng ${isPlaying ? 'btn-eng-warning' : 'btn-eng-primary'}`}
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{ minWidth: '85px', justifyContent: 'center' }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                </button>

                <button
                  className="btn-eng"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentIndex(0);
                  }}
                  title="Reset to 00:00"
                >
                  <RotateCcw size={14} />
                  <span>RESET</span>
                </button>

                {/* Playback Speeds */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', marginRight: '2px' }}>Speed:</span>
                  {[1, 2, 5].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: playbackSpeed === spd ? '#1d4ed8' : '#cbd5e1',
                        backgroundColor: playbackSpeed === spd ? '#eff6ff' : '#ffffff',
                        color: playbackSpeed === spd ? '#1d4ed8' : '#475569',
                        fontWeight: playbackSpeed === spd ? 700 : 500
                      }}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Time Display */}
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Elapsed Sortie Time:</span>
                <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                  {currentSample.time_str}
                </div>
              </div>
            </div>

            {/* Timeline Progress Slider */}
            <input
              type="range"
              min="0"
              max={replayData.timeline.length - 1}
              value={currentIndex}
              onChange={(e) => handleSeek(parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', margin: '8px 0' }}
            />

            {/* Milestones Quick Jump Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
              {milestones.map((m, idx) => {
                const isPassed = currentSample.seconds >= m.sec;
                const isCurrent = Math.abs(currentSample.seconds - m.sec) < 120;
                return (
                  <button
                    key={idx}
                    onClick={() => jumpToMilestone(m.sec)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '10.5px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: isCurrent ? '#1d4ed8' : (isPassed ? '#93c5fd' : '#cbd5e1'),
                      backgroundColor: isCurrent ? '#dbeafe' : (isPassed ? '#f0f9ff' : '#ffffff'),
                      color: isCurrent ? '#1e40af' : (isPassed ? '#0369a1' : '#475569'),
                      fontWeight: isCurrent ? 700 : 500
                    }}
                    title={m.description}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', marginRight: '4px' }}>{m.time_str}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Point-of-Degradation Banner (Appears dynamically at 01:26:15) */}
          {isAnomalyPoint && (
            <div
              style={{
                background: isAlertPoint ? '#fef2f2' : '#fffbeb',
                border: `1px solid ${isAlertPoint ? '#fca5a5' : '#fcd34d'}`,
                borderRadius: '4px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isAlertPoint ? <ShieldAlert size={22} color="#dc2626" /> : <AlertTriangle size={22} color="#d97706" />}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: isAlertPoint ? '#b91c1c' : '#92400e' }}>
                    {isAlertPoint ? 'DETECTION EVENT ACTIVE: EVT-0042 (Predictive Degradation Confirmed)' : 'ANOMALY INCEPTION DETECTED AT 01:26:15'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#334155', marginTop: '2px' }}>
                    Observed EGT residual climbed to <strong className="mono">+{currentSample.residual_egt} °C</strong> above expected twin model.
                    Fuel trim compensated +1.4 L/h. Health Index decayed from 98 to {currentSample.health_index}.
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '3px',
                    backgroundColor: isAlertPoint ? '#dc2626' : '#d97706',
                    color: '#ffffff'
                  }}
                >
                  {isAlertPoint ? 'PREDICTIVE ALERT' : 'THERMAL WATCH'}
                </span>
              </div>
            </div>
          )}

          {/* Synchronized Live Gauges Grid at current scrubber time */}
          <div className="telemetry-grid">
            <div className="telemetry-card">
              <div className="telemetry-label">Flight Phase</div>
              <div className="telemetry-val" style={{ fontSize: '16px', color: '#1d4ed8', marginTop: '8px' }}>
                {currentSample.phase}
              </div>
              <div className="telemetry-footer">
                <span>Alt: {currentSample.altitude_m} m</span>
                <span>Th: {Math.round(currentSample.throttle * 100)}%</span>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-label">Crankshaft Speed</div>
              <div className="telemetry-val-group">
                <span className="telemetry-val">{currentSample.rpm}</span>
                <span className="telemetry-unit">rpm</span>
              </div>
              <div className="telemetry-footer">
                <span>Phase demand</span>
              </div>
            </div>

            <div className={`telemetry-card ${currentSample.cht > 170 ? 'alert-warning' : ''}`}>
              <div className="telemetry-label">Cylinder Head Temp</div>
              <div className="telemetry-val-group">
                <span className="telemetry-val">{currentSample.cht}</span>
                <span className="telemetry-unit">°C</span>
              </div>
              <div className="telemetry-footer">
                <span>Limit: 195 °C</span>
              </div>
            </div>

            <div className={`telemetry-card ${currentSample.residual_egt > 20 ? 'alert-critical' : ''}`}>
              <div className="telemetry-label">Exhaust Gas Temp (EGT)</div>
              <div className="telemetry-val-group">
                <span className="telemetry-val" style={{ color: currentSample.residual_egt > 20 ? '#dc2626' : undefined }}>
                  {currentSample.egt}
                </span>
                <span className="telemetry-unit">°C</span>
              </div>
              <div className="telemetry-footer">
                <span style={{ color: currentSample.residual_egt > 15 ? '#b45309' : '#64748b' }}>
                  Δ Residual: {currentSample.residual_egt > 0 ? `+${currentSample.residual_egt}` : currentSample.residual_egt} °C
                </span>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-label">Oil Pressure</div>
              <div className="telemetry-val-group">
                <span className="telemetry-val">{currentSample.oil_pressure}</span>
                <span className="telemetry-unit">bar</span>
              </div>
              <div className="telemetry-footer">
                <span>Nominal 4.7 bar</span>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-label">RMS Vibration</div>
              <div className="telemetry-val-group">
                <span className="telemetry-val">{currentSample.vibration}</span>
                <span className="telemetry-unit">mm/s</span>
              </div>
              <div className="telemetry-footer">
                <span>Dynamics</span>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-label">Engine Health Index</div>
              <div className="telemetry-val-group">
                <span className="telemetry-val" style={{ color: currentSample.health_index < 88 ? '#d97706' : '#15803d' }}>
                  {currentSample.health_index}
                </span>
                <span className="telemetry-unit">/ 100</span>
              </div>
              <div className="telemetry-footer">
                <span>{currentSample.health_index < 88 ? 'Degrading' : 'Nominal'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

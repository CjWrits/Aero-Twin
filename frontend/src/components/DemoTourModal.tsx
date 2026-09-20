import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, ArrowLeft, X, Sparkles } from 'lucide-react';
import { DemoStep } from '../types';

interface DemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: DemoStep[];
  onNavigatePage: (pageId: string) => void;
  onInjectFault: (faultType: string, severity: number, active: boolean) => void;
}

const PAGE_ID_MAP: Record<string, string> = {
  'Overview': 'overview',
  'Live Engine': 'live-engine',
  'Digital Twin': 'digital-twin',
  'Health & Diagnostics': 'health-diagnostics',
  'Predictive Maintenance': 'predictive-maint',
  'Mission Simulation': 'mission-sim',
  'Mission Replay': 'mission-replay',
  'Fault Analysis': 'fault-analysis',
  'Historical Data': 'historical-data',
  'System Architecture': 'system-arch'
};

export const DemoTourModal: React.FC<DemoTourModalProps> = ({
  isOpen,
  onClose,
  steps,
  onNavigatePage,
  onInjectFault
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen || !steps || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const nextStep = steps[nextIdx];
      const targetPageId = PAGE_ID_MAP[nextStep.page] || 'overview';
      onNavigatePage(targetPageId);

      // Automatic action triggers for demonstration ease
      if (nextStep.step === 6) {
        onInjectFault('Injector Degradation', 0.65, true);
      } else if (nextStep.step === 1) {
        onInjectFault('Normal Operation', 0.0, false);
      }
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      const prevStep = steps[prevIdx];
      const targetPageId = PAGE_ID_MAP[prevStep.page] || 'overview';
      onNavigatePage(targetPageId);
    }
  };

  const handleJump = (idx: number) => {
    setCurrentStepIndex(idx);
    const step = steps[idx];
    const targetPageId = PAGE_ID_MAP[step.page] || 'overview';
    onNavigatePage(targetPageId);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#7c3aed" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Guided Evaluator Demonstration Flow
            </h3>
            <span className="badge badge-demo">STEP {currentStep.step} / {steps.length}</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Demonstration Target:
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
              {currentStep.title}
            </h2>
            <div style={{ display: 'inline-block', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, marginTop: '6px' }}>
              Screen: {currentStep.page}
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
              Action for Evaluators:
            </div>
            <p style={{ fontSize: '13px', color: '#1e293b', lineHeight: 1.5 }}>
              {currentStep.action}
            </p>
          </div>

          {/* Stepper Navigation Pills */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
              Sequence Outline:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {steps.map((s, idx) => (
                <button
                  key={s.step}
                  onClick={() => handleJump(idx)}
                  style={{
                    padding: '3px 7px',
                    fontSize: '10.5px',
                    fontFamily: 'var(--font-mono)',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: idx === currentStepIndex ? '#1d4ed8' : '#cbd5e1',
                    background: idx === currentStepIndex ? '#dbeafe' : (idx < currentStepIndex ? '#f1f5f9' : '#ffffff'),
                    color: idx === currentStepIndex ? '#1e40af' : '#475569',
                    fontWeight: idx === currentStepIndex ? 700 : 500
                  }}
                >
                  {s.step}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn-eng"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            style={{ opacity: currentStepIndex === 0 ? 0.5 : 1 }}
          >
            <ArrowLeft size={13} />
            <span>Previous</span>
          </button>

          <button className="btn-eng btn-eng-primary" onClick={handleNext}>
            <span>{currentStepIndex === steps.length - 1 ? 'Finish Flow' : 'Next Step'}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

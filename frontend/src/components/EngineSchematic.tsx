import React, { useState } from 'react';
import { SubsystemHealth, LiveTelemetryResponse } from '../types';
import { Gauge, Zap, Wind, Droplets, Activity, Cpu, Eye, CheckCircle, Info, Box, Layers } from 'lucide-react';
import { EngineTwin3D } from './EngineTwin3D';

interface EngineSchematicProps {
  subsystems: Record<string, SubsystemHealth>;
  onSelectSubsystem?: (subsystemKey: string) => void;
  selectedSubsystemKey?: string;
  telemetry?: LiveTelemetryResponse | null;
  historyMap?: Record<string, number[]>;
}

export const EngineSchematic: React.FC<EngineSchematicProps> = ({
  subsystems,
  onSelectSubsystem,
  selectedSubsystemKey = 'combustion',
  telemetry,
  historyMap
}) => {
  const [activeKey, setActiveKey] = useState<string>(selectedSubsystemKey);
  const [simulationMode, setSimulationMode] = useState<'3d' | '2d'>('3d');
  const [viewMode, setViewMode] = useState<'cutaway' | 'sensors' | 'flow'>('cutaway');

  const handleSelect = (key: string) => {
    setActiveKey(key);
    if (onSelectSubsystem) onSelectSubsystem(key);
  };

  const getSubColor = (key: string) => {
    const sub = subsystems[key];
    if (!sub) return '#2563eb';
    if (sub.health_index >= 88) return '#16a34a';
    if (sub.health_index >= 75) return '#d97706';
    return '#dc2626';
  };

  const getSubFill = (key: string) => {
    const sub = subsystems[key];
    if (!sub) return '#eff6ff';
    if (sub.health_index >= 88) return '#f0fdf4';
    if (sub.health_index >= 75) return '#fffbeb';
    return '#fef2f2';
  };

  const activeSub = subsystems[activeKey] || subsystems['combustion'];

  // Helper to determine if element belongs to active subsystem
  const isActive = (key: string) => activeKey === key;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Schematic Control Header & Subsystem Pills */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        background: '#f8fafc',
        border: '1px solid var(--border-medium)',
        borderRadius: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ENGINE DIGITAL TWIN CAD SCHEMATIC
          </span>
          <span style={{
            fontSize: '9.5px',
            background: '#e2e8f0',
            color: '#475569',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)'
          }}>
            ROTARY-BOXER 4-CYL TURBO
          </span>
        </div>

        {/* Simulation Engine Mode Switcher: 3D Realistic vs 2D CAD */}
        <div style={{ display: 'flex', gap: '4px', background: '#0f172a', padding: '3px', borderRadius: '5px' }}>
          <button
            type="button"
            onClick={() => setSimulationMode('3d')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 11px',
              fontSize: '11px',
              fontWeight: simulationMode === '3d' ? 700 : 500,
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              background: simulationMode === '3d' ? '#2563eb' : 'transparent',
              color: simulationMode === '3d' ? '#ffffff' : '#94a3b8',
              boxShadow: simulationMode === '3d' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Box size={13} />
            <span>3D Realistic Digital Twin</span>
          </button>
          <button
            type="button"
            onClick={() => setSimulationMode('2d')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 11px',
              fontSize: '11px',
              fontWeight: simulationMode === '2d' ? 700 : 500,
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              background: simulationMode === '2d' ? '#2563eb' : 'transparent',
              color: simulationMode === '2d' ? '#ffffff' : '#94a3b8',
              boxShadow: simulationMode === '2d' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Layers size={13} />
            <span>2D CAD Cutaway</span>
          </button>
        </div>

        {/* 2D View Mode Switcher (Visible in 2D CAD mode) */}
        {simulationMode === '2d' && (
          <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', padding: '2px', borderRadius: '4px' }}>
            <button
              onClick={() => setViewMode('cutaway')}
              style={{
                padding: '4px 10px',
                fontSize: '10.5px',
                fontWeight: viewMode === 'cutaway' ? 700 : 500,
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                background: viewMode === 'cutaway' ? '#ffffff' : 'transparent',
                color: viewMode === 'cutaway' ? '#1e293b' : '#64748b',
                boxShadow: viewMode === 'cutaway' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Mechanical Cutaway
            </button>
            <button
              onClick={() => setViewMode('sensors')}
              style={{
                padding: '4px 10px',
                fontSize: '10.5px',
                fontWeight: viewMode === 'sensors' ? 700 : 500,
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                background: viewMode === 'sensors' ? '#ffffff' : 'transparent',
                color: viewMode === 'sensors' ? '#1e293b' : '#64748b',
                boxShadow: viewMode === 'sensors' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Telemetry Sensors
            </button>
            <button
              onClick={() => setViewMode('flow')}
              style={{
                padding: '4px 10px',
                fontSize: '10.5px',
                fontWeight: viewMode === 'flow' ? 700 : 500,
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                background: viewMode === 'flow' ? '#ffffff' : 'transparent',
                color: viewMode === 'flow' ? '#1e293b' : '#64748b',
                boxShadow: viewMode === 'flow' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Gas / Fluid Flow
            </button>
          </div>
        )}

        {/* Subsystem Direct Select Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { key: 'combustion', label: 'Combustion (Cyl 1,3,4)', icon: Zap },
            { key: 'fuel_injection', label: 'Fuel Injection (Cyl 2)', icon: Wind },
            { key: 'vibration', label: 'PRSU / Vibration', icon: Activity },
            { key: 'lubrication', label: 'Lubrication', icon: Droplets },
            { key: 'cooling', label: 'Cooling System', icon: Gauge },
            { key: 'electrical', label: 'Electrical / FADEC', icon: Cpu }
          ].map(item => {
            const isSel = activeKey === item.key;
            const col = getSubColor(item.key);
            const sub = subsystems[item.key];
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => handleSelect(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: isSel ? 700 : 500,
                  cursor: 'pointer',
                  border: `1px solid ${isSel ? col : '#cbd5e1'}`,
                  background: isSel ? getSubFill(item.key) : '#ffffff',
                  color: isSel ? col : '#334155',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: col }} />
                <Icon size={12} />
                <span>{item.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, opacity: 0.85 }}>
                  {sub?.health_index ?? 90}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulation View: 3D Realistic Digital Twin vs 2D CAD Cutaway */}
      {simulationMode === '3d' ? (
        <EngineTwin3D
          telemetry={telemetry}
          historyMap={historyMap}
          selectedSubsystemKey={activeKey}
          onSelectSubsystem={handleSelect}
          height={540}
        />
      ) : (
        <div style={{ display: 'flex', gap: '14px', alignItems: 'stretch', flexWrap: 'wrap' }}>
        {/* Left: Realistic Vector Cutaway Drawing */}
        <div style={{
          flex: '1 1 58%',
          minWidth: '540px',
          background: '#090e17',
          border: '1px solid #1e293b',
          borderRadius: '6px',
          padding: '10px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
        }}>
          {/* Schematic Overlay Legend / Header */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '14px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.06em' }}>
              HORIZONTALLY OPPOSED 4-CYLINDER TURBOCHARGED AERO-ENGINE
            </span>
            <span style={{ fontSize: '9px', color: '#94a3b8', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>ROTATING CUTAWAY TOPOLOGY</span>
              <span>•</span>
              <span style={{ color: '#38bdf8' }}>BOXER DUAL-IGNITION</span>
              <span>•</span>
              <span style={{ color: '#fbbf24' }}>TURBO INTERCOOLED</span>
            </span>
          </div>

          <div style={{
            position: 'absolute',
            top: '12px',
            right: '14px',
            zIndex: 10,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            border: '1px solid #334155',
            borderRadius: '4px',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '9.5px',
            color: '#cbd5e1'
          }}>
            <Eye size={12} color="#38bdf8" />
            <span>Interactive: Click engine components to diagnose</span>
          </div>

          {/* High-Fidelity SVG Aero Engine Vector Schematic */}
          <svg
            viewBox="0 0 880 500"
            style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '470px' }}
          >
            <defs>
              {/* CAD Fine Grid */}
              <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#172554" strokeWidth="0.5" strokeOpacity="0.3" />
              </pattern>
              <pattern id="cadGridMajor" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="none" stroke="#1e293b" strokeWidth="0.8" strokeOpacity="0.4" />
              </pattern>

              {/* Realistic Gradients */}
              {/* Aluminum Cast Crankcase */}
              <linearGradient id="crankcaseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="35%" stopColor="#334155" />
                <stop offset="70%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              {/* Polished Propeller Spinner Cone */}
              <linearGradient id="spinnerGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="30%" stopColor="#cbd5e1" />
                <stop offset="70%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              {/* Carbon Composite Propeller Blade */}
              <linearGradient id="carbonBladeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="40%" stopColor="#334155" />
                <stop offset="70%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              {/* Reduction Gearbox Casing */}
              <linearGradient id="gearboxGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="45%" stopColor="#475569" />
                <stop offset="85%" stopColor="#1e293b" />
              </linearGradient>

              {/* Steel Cylinder Liner */}
              <linearGradient id="cylinderLinerGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="20%" stopColor="#64748b" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="80%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              {/* Aluminum Piston */}
              <linearGradient id="pistonGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="40%" stopColor="#f1f5f9" />
                <stop offset="70%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>

              {/* Forged Steel Crankshaft & Rods */}
              <linearGradient id="steelRodGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="50%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              {/* Turbo Turbine Hot Side (Glowing Heat Tint) */}
              <linearGradient id="turboTurbineGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="40%" stopColor="#d97706" />
                <stop offset="80%" stopColor="#7c2d12" />
                <stop offset="100%" stopColor="#431407" />
              </linearGradient>

              {/* Turbo Compressor Cold Side (Billet Aluminum) */}
              <linearGradient id="turboCompressorGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>

              {/* Stainless Steel Exhaust Tubing */}
              <linearGradient id="exhaustPipeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ca8a04" />
                <stop offset="35%" stopColor="#854d0e" />
                <stop offset="70%" stopColor="#713f12" />
                <stop offset="100%" stopColor="#3f2305" />
              </linearGradient>

              {/* Pressurized Intake Boost Pipe */}
              <linearGradient id="boostPipeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>

              {/* Fuel Rail Anodized Brass / Steel */}
              <linearGradient id="fuelRailGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="40%" stopColor="#eab308" />
                <stop offset="80%" stopColor="#a16207" />
                <stop offset="100%" stopColor="#713f12" />
              </linearGradient>

              {/* Blue Silicone Coolant Hose */}
              <linearGradient id="coolantHoseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="40%" stopColor="#0284c7" />
                <stop offset="80%" stopColor="#075985" />
                <stop offset="100%" stopColor="#0c4a6e" />
              </linearGradient>

              {/* Oil Line Braided Bronze */}
              <linearGradient id="oilLineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>

              {/* Combustion Chamber Flame Glow */}
              <radialGradient id="combustionFlame" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="25%" stopColor="#fef08a" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#f97316" stopOpacity="0.6" />
                <stop offset="90%" stopColor="#ef4444" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>

              {/* Subsystem Selection Glow Filters */}
              <filter id="glowActive" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="warningPulse" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 0.2 0 0 0  0 0 0.2 0 0  0 0 0 1 0"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Grid Elements */}
            <rect width="880" height="500" fill="url(#cadGrid)" />
            <rect width="880" height="500" fill="url(#cadGridMajor)" />

            {/* Engine Centerline Axis (Datum) */}
            <line x1="20" y1="250" x2="860" y2="250" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="6 3 2 3" strokeOpacity="0.35" />
            <text x="865" y="253" fontSize="8" fill="#38bdf8" opacity="0.6" fontFamily="var(--font-mono)">CL CRANKSHAFT</text>

            {/* ==================================================================== */}
            {/* 1. EXHAUST SYSTEM & TURBOCHARGER (Mounted Aft, X: 500 to 760)       */}
            {/* ==================================================================== */}
            <g id="turbocharger-group">
              {/* Stainless Exhaust Headers from Cylinders to Collector */}
              <g stroke="#9a3412" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
                {/* From Cyl 1 (Top Left) */}
                <path d="M 285 70 C 310 40, 480 40, 560 190" />
                {/* From Cyl 3 (Top Right) */}
                <path d="M 435 70 C 470 45, 520 80, 560 200" />
                {/* From Cyl 2 (Bottom Left) */}
                <path d="M 285 430 C 310 460, 480 460, 560 240" />
                {/* From Cyl 4 (Bottom Right) */}
                <path d="M 435 430 C 470 455, 520 420, 560 230" />
              </g>

              {/* Exhaust Inner Glow Overlay */}
              <g stroke="url(#exhaustPipeGrad)" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 285 70 C 310 40, 480 40, 560 190" />
                <path d="M 435 70 C 470 45, 520 80, 560 200" />
                <path d="M 285 430 C 310 460, 480 460, 560 240" />
                <path d="M 435 430 C 470 455, 520 420, 560 230" />
              </g>

              {/* 4-into-1 Merge Collector Flange */}
              <polygon points="555,185 575,195 575,235 555,245" fill="#431407" stroke="#b45309" strokeWidth="1.5" />

              {/* Turbocharger Assembly: Hot Turbine Housing (Aft Left) */}
              <g
                onClick={() => handleSelect('combustion')}
                style={{ cursor: 'pointer' }}
                filter={isActive('combustion') ? 'url(#glowActive)' : undefined}
              >
                {/* Turbine Snail Volute Scroll */}
                <path
                  d="M 575 190 C 610 170, 650 185, 650 215 C 650 245, 620 260, 595 260 L 590 290 L 570 290 L 575 255 C 565 240, 565 205, 575 190 Z"
                  fill="url(#turboTurbineGrad)"
                  stroke={isActive('combustion') ? getSubColor('combustion') : '#ca8a04'}
                  strokeWidth={isActive('combustion') ? 2.5 : 1.5}
                />
                {/* Turbine Blades inside cutaway */}
                <circle cx="612" cy="218" r="22" fill="#291004" stroke="#78350f" strokeWidth="1" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <line
                    key={i}
                    x1="612"
                    y1="218"
                    x2={612 + 18 * Math.cos((angle * Math.PI) / 180)}
                    y2={218 + 18 * Math.sin((angle * Math.PI) / 180)}
                    stroke="#fbbf24"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                ))}
                {/* Exhaust Downpipe Outlet */}
                <path d="M 570 290 L 550 330 L 570 330 L 590 290 Z" fill="#292524" stroke="#78716c" strokeWidth="1.5" />
                <text x="545" y="342" fontSize="7.5" fill="#a8a29e" fontFamily="var(--font-mono)">EXHAUST DUMP</text>
              </g>

              {/* Turbo Center Cartridge (CHRA) & Oil Feed */}
              <rect x="645" y="206" width="16" height="24" rx="2" fill="#475569" stroke="#64748b" strokeWidth="1" />
              <line x1="653" y1="180" x2="653" y2="206" stroke="url(#oilLineGrad)" strokeWidth="2.5" />
              <circle cx="653" cy="178" r="3" fill="#d97706" />

              {/* Turbo Compressor Housing (Cold Side, Cast Aluminum) */}
              <g
                onClick={() => handleSelect('combustion')}
                style={{ cursor: 'pointer' }}
                filter={isActive('combustion') ? 'url(#glowActive)' : undefined}
              >
                <path
                  d="M 661 190 C 695 175, 730 190, 730 218 C 730 248, 700 262, 675 262 L 675 225 C 665 210, 665 200, 661 190 Z"
                  fill="url(#turboCompressorGrad)"
                  stroke={isActive('combustion') ? getSubColor('combustion') : '#94a3b8'}
                  strokeWidth={isActive('combustion') ? 2.5 : 1.5}
                />
                {/* Compressor Inducer Wheel */}
                <circle cx="694" cy="218" r="20" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                {[20, 65, 110, 155, 200, 245, 290, 335].map((angle, i) => (
                  <line
                    key={i}
                    x1="694"
                    y1="218"
                    x2={694 + 17 * Math.cos((angle * Math.PI) / 180)}
                    y2={218 + 17 * Math.sin((angle * Math.PI) / 180)}
                    stroke="#38bdf8"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                ))}
                {/* Compressor Air Intake Bellmouth */}
                <rect x="725" y="208" width="15" height="20" rx="3" fill="#334155" stroke="#64748b" strokeWidth="1" />
                <text x="745" y="222" fontSize="7.5" fill="#38bdf8" fontFamily="var(--font-mono)">RAM AIR INLET</text>
              </g>

              {/* Wastegate Actuator Canister */}
              <rect x="625" y="145" width="28" height="18" rx="3" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="625" y1="154" x2="590" y2="175" stroke="#cbd5e1" strokeWidth="2" />
              <text x="639" y="141" textAnchor="middle" fontSize="7" fill="#94a3b8" fontFamily="var(--font-mono)">WASTEGATE</text>

              {/* Intercooler (Charge Air Cooler Matrix) */}
              <g
                onClick={() => handleSelect('cooling')}
                style={{ cursor: 'pointer' }}
                filter={isActive('cooling') ? 'url(#glowActive)' : undefined}
              >
                {/* Boost Pipe from Turbo to Intercooler */}
                <path d="M 685 190 L 685 145 L 715 145" fill="none" stroke="url(#boostPipeGrad)" strokeWidth="6" strokeLinecap="round" />
                {/* Intercooler Box Core */}
                <rect
                  x="715"
                  y="95"
                  width="75"
                  height="70"
                  rx="4"
                  fill="#0f172a"
                  stroke={isActive('cooling') ? getSubColor('cooling') : '#0284c7'}
                  strokeWidth={isActive('cooling') ? 2.5 : 1.5}
                />
                {/* Cooling Matrix Fins */}
                {[103, 111, 119, 127, 135, 143, 151, 159].map(y => (
                  <line key={y} x1="720" y1={y} x2="785" y2={y} stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.75" />
                ))}
                <text x="752" y="115" textAnchor="middle" fontSize="8" fontWeight="700" fill="#f8fafc">INTERCOOLER</text>
                <text x="752" y="127" textAnchor="middle" fontSize="7" fill="#38bdf8">Charge Air Core</text>
                <text x="752" y="148" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#38bdf8" fontFamily="var(--font-mono)">
                  -34 °C ΔT
                </text>
              </g>

              {/* Charge Boost Pipe from Intercooler to Central Intake Plenum */}
              <path
                d="M 752 95 L 752 65 L 360 65 L 360 175"
                fill="none"
                stroke="url(#boostPipeGrad)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Flow Arrows on Boost Pipe */}
              <polygon points="620,62 610,58 610,66" fill="#f8fafc" />
              <polygon points="460,62 450,58 450,66" fill="#f8fafc" />
            </g>

            {/* ==================================================================== */}
            {/* 2. CENTRAL CRANKCASE & ROTATING ASSEMBLY                             */}
            {/* ==================================================================== */}
            <g id="crankcase-block-group">
              {/* Cast Aluminum Engine Block Shell */}
              <rect
                x="185"
                y="175"
                width="320"
                height="150"
                rx="6"
                fill="url(#crankcaseGrad)"
                stroke="#64748b"
                strokeWidth="2"
              />

              {/* Structural Reinforcing Ribs across Case */}
              <line x1="185" y1="205" x2="505" y2="205" stroke="#1e293b" strokeWidth="2.5" />
              <line x1="185" y1="295" x2="505" y2="295" stroke="#1e293b" strokeWidth="2.5" />
              <line x1="260" y1="175" x2="260" y2="325" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2" />
              <line x1="430" y1="175" x2="430" y2="325" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2" />

              {/* Perimeter Crankcase Assembly Bolts (Hex Heads) */}
              {[195, 230, 270, 310, 350, 390, 430, 470, 495].map(x => (
                <React.Fragment key={x}>
                  <circle cx={x} cy="180" r="3" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />
                  <circle cx={x} cy="320" r="3" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />
                </React.Fragment>
              ))}

              {/* Crankcase Center Cutaway Window */}
              <rect x="200" y="195" width="290" height="110" rx="4" fill="#0b0f19" stroke="#334155" strokeWidth="1" />

              {/* Forged Steel Crankshaft with 3 Main Bearing Journals */}
              {/* Main Bearing 1 (Front / Left) */}
              <rect x="210" y="235" width="22" height="30" rx="2" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
              {/* Main Bearing 2 (Center) */}
              <rect x="335" y="235" width="24" height="30" rx="2" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
              {/* Main Bearing 3 (Aft / Right) */}
              <rect x="460" y="235" width="22" height="30" rx="2" fill="#475569" stroke="#94a3b8" strokeWidth="1" />

              {/* Crankshaft Main Shaft Bar */}
              <line x1="170" y1="250" x2="495" y2="250" stroke="url(#steelRodGrad)" strokeWidth="14" strokeLinecap="round" />

              {/* Crankshaft Counterweights & Throws (Boxer 180° Kinematics) */}
              {/* Throw 1 & 2 */}
              <path d="M 235 250 L 255 210 L 280 210 L 290 250 Z" fill="url(#steelRodGrad)" stroke="#334155" strokeWidth="1" />
              <circle cx="267" cy="216" r="4" fill="#1e293b" />
              {/* Throw 3 & 4 */}
              <path d="M 405 250 L 425 290 L 450 290 L 460 250 Z" fill="url(#steelRodGrad)" stroke="#334155" strokeWidth="1" />
              <circle cx="437" cy="284" r="4" fill="#1e293b" />

              {/* Connecting Rods (H-Beam Forged Steel) */}
              {/* Rod 1 -> Cyl 1 (Top Left) */}
              <line x1="267" y1="216" x2="260" y2="140" stroke="url(#steelRodGrad)" strokeWidth="7" strokeLinecap="round" />
              <circle cx="260" cy="140" r="4.5" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />

              {/* Rod 3 -> Cyl 3 (Top Right) */}
              <line x1="410" y1="235" x2="410" y2="155" stroke="url(#steelRodGrad)" strokeWidth="7" strokeLinecap="round" />
              <circle cx="410" cy="155" r="4.5" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />

              {/* Rod 2 -> Cyl 2 (Bottom Left - Focus) */}
              <line x1="267" y1="265" x2="260" y2="355" stroke="url(#steelRodGrad)" strokeWidth="7" strokeLinecap="round" />
              <circle cx="260" cy="355" r="4.5" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />

              {/* Rod 4 -> Cyl 4 (Bottom Right) */}
              <line x1="437" y1="284" x2="410" y2="345" stroke="url(#steelRodGrad)" strokeWidth="7" strokeLinecap="round" />
              <circle cx="410" cy="345" r="4.5" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />

              {/* Oil Pressure Galleys through Crankcase (LUBRICATION) */}
              <g
                onClick={() => handleSelect('lubrication')}
                style={{ cursor: 'pointer' }}
                filter={isActive('lubrication') ? 'url(#glowActive)' : undefined}
              >
                <path
                  d="M 221 250 L 347 250 L 471 250"
                  fill="none"
                  stroke={isActive('lubrication') ? getSubColor('lubrication') : '#f59e0b'}
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
              </g>

              {/* Central Block Label */}
              <text x="350" y="208" textAnchor="middle" fontSize="9" fontWeight="700" fill="#94a3b8" letterSpacing="0.05em">
                CRANKCASE / MAIN BEARINGS (SPLIT ALLOY)
              </text>
            </g>

            {/* ==================================================================== */}
            {/* 3. PROPELLER & REDUCTION GEARBOX (PRSU - Left Side, X: 20 to 185)    */}
            {/* ==================================================================== */}
            <g
              id="prsu-propeller-group"
              onClick={() => handleSelect('vibration')}
              style={{ cursor: 'pointer' }}
              filter={isActive('vibration') ? 'url(#glowActive)' : undefined}
            >
              {/* Reduction Gearbox Housing (Cast Aluminum Flanged Bellhousing) */}
              <path
                d="M 120 185 L 185 175 L 185 325 L 120 315 L 105 285 L 105 215 Z"
                fill="url(#gearboxGrad)"
                stroke={isActive('vibration') ? getSubColor('vibration') : '#64748b'}
                strokeWidth={isActive('vibration') ? 2.5 : 1.5}
              />
              {/* External Reinforcement Ribs */}
              <line x1="120" y1="215" x2="185" y2="215" stroke="#334155" strokeWidth="2" />
              <line x1="120" y1="285" x2="185" y2="285" stroke="#334155" strokeWidth="2" />

              {/* Gearbox Cutaway: Internal Helical Reduction Gears (2.43:1) */}
              <rect x="120" y="210" width="55" height="80" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />

              {/* Large Driven Bull Gear (Prop Shaft) */}
              <circle cx="148" cy="240" r="24" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 1.5" />
              <circle cx="148" cy="240" r="14" fill="#334155" stroke="#cbd5e1" strokeWidth="1" />

              {/* Small Driving Pinion Gear (Crankshaft Output) */}
              <circle cx="150" cy="275" r="12" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="2.5 1" />

              {/* Torsional Overload Clutch / Damper Ring */}
              <circle cx="148" cy="240" r="6" fill="#f8fafc" />

              {/* Propeller Drive Shaft */}
              <rect x="75" y="234" width="35" height="12" fill="#cbd5e1" stroke="#475569" strokeWidth="1.2" />

              {/* Propeller Hub Flange with 6 Retention Hex Bolts */}
              <rect x="68" y="218" width="8" height="44" rx="1.5" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
              {[224, 234, 244, 254].map(y => (
                <circle key={y} cx="72" cy={y} r="2" fill="#f8fafc" stroke="#1e293b" strokeWidth="0.8" />
              ))}

              {/* Aerodynamic Propeller Spinner Cone */}
              <path
                d="M 68 212 C 45 220, 22 238, 20 240 C 22 242, 45 260, 68 268 Z"
                fill="url(#spinnerGrad)"
                stroke="#64748b"
                strokeWidth="1.5"
              />
              {/* Spinner Center Highlight Specular */}
              <ellipse cx="45" cy="235" rx="18" ry="4" fill="#ffffff" opacity="0.35" transform="rotate(-10, 45, 235)" />

              {/* Carbon Composite Propeller Blades (Scimitar Airfoil Profile) */}
              {/* Upper Blade */}
              <path
                d="M 66 215 C 62 170, 48 110, 36 30 C 44 28, 52 35, 58 70 C 64 120, 70 175, 72 215 Z"
                fill="url(#carbonBladeGrad)"
                stroke="#475569"
                strokeWidth="1.2"
              />
              {/* Upper Blade Yellow Hazard Warning Tip */}
              <path d="M 36 30 C 44 28, 52 35, 54 50 L 39 52 Z" fill="#eab308" />
              <path d="M 40 58 L 55 56 L 56 66 L 41 68 Z" fill="#eab308" />

              {/* Lower Blade */}
              <path
                d="M 66 265 C 62 310, 48 370, 36 450 C 44 452, 52 445, 58 410 C 64 360, 70 305, 72 265 Z"
                fill="url(#carbonBladeGrad)"
                stroke="#475569"
                strokeWidth="1.2"
              />
              {/* Lower Blade Yellow Hazard Warning Tip */}
              <path d="M 36 450 C 44 452, 52 445, 54 430 L 39 428 Z" fill="#eab308" />
              <path d="M 40 422 L 55 424 L 56 414 L 41 412 Z" fill="#eab308" />

              {/* Blade Pitch Swirl / Motion Indication Arc */}
              <path d="M 85 195 C 100 180, 100 150, 85 135" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
              <polygon points="85,135 88,143 81,141" fill="#38bdf8" opacity="0.8" />

              {/* Accelerometer / Piezo Vibration Sensor on PRSU casing */}
              <rect x="138" y="172" width="16" height="13" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
              <line x1="146" y1="172" x2="146" y2="155" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="146" cy="155" r="2.5" fill="#f8fafc" />

              {/* PRSU Engineering Label */}
              <text x="145" y="306" textAnchor="middle" fontSize="8" fontWeight="700" fill="#f8fafc">
                PRSU 2.43:1
              </text>
              <text x="145" y="316" textAnchor="middle" fontSize="7" fill="#94a3b8">
                Torsion Damper
              </text>
            </g>

            {/* ==================================================================== */}
            {/* 4. CYLINDER 1 & 3: TOP OPPOSED BANK (STARBOARD)                      */}
            {/* ==================================================================== */}
            {/* CYLINDER 1 (Top Left, FWD - COMBUSTION) */}
            <g
              id="cyl-1-group"
              onClick={() => handleSelect('combustion')}
              style={{ cursor: 'pointer' }}
              filter={isActive('combustion') ? 'url(#glowActive)' : undefined}
            >
              {/* Cylinder Barrel Wall & Machined Aluminum Cooling Fins (Signature Look) */}
              <g stroke="#64748b" strokeWidth="1">
                {/* 9 Deep Machined Air/Liquid Cooling Fins */}
                {[90, 100, 110, 120, 130, 140, 150, 160, 170].map(y => (
                  <rect key={y} x="206" y={y} width="108" height="5" rx="1.5" fill="#475569" stroke="#334155" />
                ))}
              </g>

              {/* Cutaway Cylinder Bore Sleeve */}
              <rect x="220" y="80" width="80" height="98" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

              {/* Piston 1 (Aluminum Alloy with Compression Rings & Crown Pockets) */}
              <g transform="translate(0, -10)">
                <rect x="222" y="115" width="76" height="42" rx="3" fill="url(#pistonGrad)" stroke="#475569" strokeWidth="1.2" />
                {/* Ring Lands */}
                <line x1="222" y1="121" x2="298" y2="121" stroke="#0f172a" strokeWidth="1.5" />
                <line x1="222" y1="126" x2="298" y2="126" stroke="#0f172a" strokeWidth="1.5" />
                <line x1="222" y1="131" x2="298" y2="131" stroke="#0f172a" strokeWidth="1.5" />
                {/* Gudgeon / Wrist Pin */}
                <rect x="248" y="132" width="24" height="14" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="260" cy="139" r="3.5" fill="#0f172a" />
              </g>

              {/* Cylinder Head (Pent-Roof Combustion Chamber & Valves) */}
              <path
                d="M 215 80 L 215 50 L 305 50 L 305 80 Z"
                fill="url(#crankcaseGrad)"
                stroke={isActive('combustion') ? getSubColor('combustion') : '#64748b'}
                strokeWidth={isActive('combustion') ? 2 : 1.5}
              />

              {/* Combustion Fire Flash (Cutaway Indicator) */}
              <path d="M 225 78 C 245 68, 275 68, 295 78 Z" fill="url(#combustionFlame)" opacity="0.8" />

              {/* Dual Aviation Spark Plugs (Redundant Ignition) */}
              {/* Plug A */}
              <rect x="232" y="40" width="8" height="12" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1" />
              <line x1="236" y1="40" x2="236" y2="28" stroke="#ef4444" strokeWidth="2" />
              {/* Plug B */}
              <rect x="280" y="40" width="8" height="12" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1" />
              <line x1="284" y1="40" x2="284" y2="28" stroke="#ef4444" strokeWidth="2" />

              {/* Intake & Exhaust Poppet Valves */}
              <line x1="245" y1="52" x2="245" y2="76" stroke="#f8fafc" strokeWidth="2.5" />
              <polygon points="239,76 251,76 245,72" fill="#cbd5e1" />
              <line x1="275" y1="52" x2="275" y2="76" stroke="#f8fafc" strokeWidth="2.5" />
              <polygon points="269,76 281,76 275,72" fill="#cbd5e1" />

              {/* CHT Thermocouple Sensor Boss */}
              <circle cx="260" cy="46" r="3.5" fill="#eab308" stroke="#713f12" strokeWidth="1" />

              {/* Cylinder 1 HUD Label */}
              <text x="260" y="38" textAnchor="middle" fontSize="9" fontWeight="800" fill="#f8fafc">
                CYL 1 [FWD]
              </text>
              <text x="260" y="105" textAnchor="middle" fontSize="7.5" fill="#94a3b8" fontFamily="var(--font-mono)">
                EGT: {subsystems['combustion']?.observed_metric ?? '812°C'}
              </text>
            </g>

            {/* CYLINDER 3 (Top Right, AFT - COMBUSTION) */}
            <g
              id="cyl-3-group"
              onClick={() => handleSelect('combustion')}
              style={{ cursor: 'pointer' }}
              filter={isActive('combustion') ? 'url(#glowActive)' : undefined}
            >
              {/* Cooling Fins */}
              {[90, 100, 110, 120, 130, 140, 150, 160, 170].map(y => (
                <rect key={y} x="356" y={y} width="108" height="5" rx="1.5" fill="#475569" stroke="#334155" strokeWidth="1" />
              ))}

              {/* Cylinder Sleeve Bore */}
              <rect x="370" y="80" width="80" height="98" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

              {/* Piston 3 */}
              <g transform="translate(0, 10)">
                <rect x="372" y="115" width="76" height="42" rx="3" fill="url(#pistonGrad)" stroke="#475569" strokeWidth="1.2" />
                <line x1="372" y1="121" x2="448" y2="121" stroke="#0f172a" strokeWidth="1.5" />
                <line x1="372" y1="126" x2="448" y2="126" stroke="#0f172a" strokeWidth="1.5" />
                <rect x="398" y="132" width="24" height="14" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="410" cy="139" r="3.5" fill="#0f172a" />
              </g>

              {/* Cylinder Head */}
              <path
                d="M 365 80 L 365 50 L 455 50 L 455 80 Z"
                fill="url(#crankcaseGrad)"
                stroke={isActive('combustion') ? getSubColor('combustion') : '#64748b'}
                strokeWidth={isActive('combustion') ? 2 : 1.5}
              />
              <path d="M 375 78 C 395 68, 425 68, 445 78 Z" fill="url(#combustionFlame)" opacity="0.8" />

              {/* Dual Plugs */}
              <rect x="382" y="40" width="8" height="12" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1" />
              <line x1="386" y1="40" x2="386" y2="28" stroke="#ef4444" strokeWidth="2" />
              <rect x="430" y="40" width="8" height="12" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1" />
              <line x1="434" y1="40" x2="434" y2="28" stroke="#ef4444" strokeWidth="2" />

              <text x="410" y="38" textAnchor="middle" fontSize="9" fontWeight="800" fill="#f8fafc">
                CYL 3 [AFT]
              </text>
              <text x="410" y="105" textAnchor="middle" fontSize="7.5" fill="#94a3b8" fontFamily="var(--font-mono)">
                EGT: {subsystems['combustion']?.observed_metric ?? '809°C'}
              </text>
            </g>

            {/* ==================================================================== */}
            {/* 5. CYLINDER 2 & 4: BOTTOM OPPOSED BANK (PORT)                        */}
            {/* ==================================================================== */}
            {/* CYLINDER 2 (Bottom Left, FWD - PRIMARY INJECTION MONITORING) */}
            <g
              id="cyl-2-group"
              onClick={() => handleSelect('fuel_injection')}
              style={{ cursor: 'pointer' }}
              filter={isActive('fuel_injection') ? 'url(#glowActive)' : (subsystems['fuel_injection']?.health_index < 85 ? 'url(#warningPulse)' : undefined)}
            >
              {/* Cooling Fins */}
              {[330, 340, 350, 360, 370, 380, 390, 400, 410].map(y => (
                <rect key={y} x="206" y={y} width="108" height="5" rx="1.5" fill="#475569" stroke="#334155" strokeWidth="1" />
              ))}

              {/* Cylinder Bore Sleeve */}
              <rect x="220" y="322" width="80" height="98" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

              {/* Piston 2 */}
              <g transform="translate(0, 35)">
                <rect x="222" y="315" width="76" height="42" rx="3" fill="url(#pistonGrad)" stroke="#475569" strokeWidth="1.2" />
                <line x1="222" y1="345" x2="298" y2="345" stroke="#0f172a" strokeWidth="1.5" />
                <line x1="222" y1="350" x2="298" y2="350" stroke="#0f172a" strokeWidth="1.5" />
                <rect x="248" y="325" width="24" height="14" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="260" cy="332" r="3.5" fill="#0f172a" />
              </g>

              {/* Cylinder Head */}
              <path
                d="M 215 420 L 215 450 L 305 450 L 305 420 Z"
                fill="url(#crankcaseGrad)"
                stroke={isActive('fuel_injection') ? getSubColor('fuel_injection') : '#64748b'}
                strokeWidth={isActive('fuel_injection') ? 2.5 : 1.5}
              />

              {/* Electronic Fuel Injector Nozzle (Cylinder 2 Focus) */}
              <g transform="translate(230, 420)">
                <rect x="0" y="0" width="14" height="24" rx="2" fill="#d97706" stroke="#fef08a" strokeWidth="1.2" />
                <line x1="7" y1="-8" x2="7" y2="0" stroke="#fde047" strokeWidth="2.5" />
                {/* Fuel Atomization Spray Cone */}
                <polygon points="7,24 0,38 14,38" fill="#fbbf24" opacity="0.6" />
                {/* Diagnostic Warning Beacon if degraded */}
                {subsystems['fuel_injection']?.health_index < 88 && (
                  <circle cx="7" cy="12" r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                )}
              </g>

              {/* Dual Plugs */}
              <rect x="275" y="448" width="8" height="12" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1" />
              <line x1="279" y1="460" x2="279" y2="472" stroke="#ef4444" strokeWidth="2" />

              {/* Cylinder 2 HUD Label */}
              <text x="260" y="465" textAnchor="middle" fontSize="9" fontWeight="800" fill={isActive('fuel_injection') ? getSubColor('fuel_injection') : '#f8fafc'}>
                CYL 2 [INJ 2 DEFICIT]
              </text>
              <text x="260" y="477" textAnchor="middle" fontSize="8" fontWeight="700" fill={getSubColor('fuel_injection')} fontFamily="var(--font-mono)">
                FLOW: {subsystems['fuel_injection']?.observed_metric ?? '29.8 L/h'}
              </text>
            </g>

            {/* CYLINDER 4 (Bottom Right, AFT - COMBUSTION) */}
            <g
              id="cyl-4-group"
              onClick={() => handleSelect('combustion')}
              style={{ cursor: 'pointer' }}
              filter={isActive('combustion') ? 'url(#glowActive)' : undefined}
            >
              {/* Cooling Fins */}
              {[330, 340, 350, 360, 370, 380, 390, 400, 410].map(y => (
                <rect key={y} x="356" y={y} width="108" height="5" rx="1.5" fill="#475569" stroke="#334155" strokeWidth="1" />
              ))}

              {/* Cylinder Bore Sleeve */}
              <rect x="370" y="322" width="80" height="98" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

              {/* Piston 4 */}
              <g transform="translate(0, 15)">
                <rect x="372" y="315" width="76" height="42" rx="3" fill="url(#pistonGrad)" stroke="#475569" strokeWidth="1.2" />
                <line x1="372" y1="345" x2="448" y2="345" stroke="#0f172a" strokeWidth="1.5" />
                <line x1="372" y1="350" x2="448" y2="350" stroke="#0f172a" strokeWidth="1.5" />
                <rect x="398" y="325" width="24" height="14" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="410" cy="332" r="3.5" fill="#0f172a" />
              </g>

              {/* Cylinder Head */}
              <path
                d="M 365 420 L 365 450 L 455 450 L 455 420 Z"
                fill="url(#crankcaseGrad)"
                stroke={isActive('combustion') ? getSubColor('combustion') : '#64748b'}
                strokeWidth={isActive('combustion') ? 2 : 1.5}
              />

              {/* Dual Plugs */}
              <rect x="425" y="448" width="8" height="12" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1" />
              <line x1="429" y1="460" x2="429" y2="472" stroke="#ef4444" strokeWidth="2" />

              <text x="410" y="465" textAnchor="middle" fontSize="9" fontWeight="800" fill="#f8fafc">
                CYL 4 [AFT]
              </text>
              <text x="410" y="477" textAnchor="middle" fontSize="7.5" fill="#94a3b8" fontFamily="var(--font-mono)">
                EGT: {subsystems['combustion']?.observed_metric ?? '811°C'}
              </text>
            </g>

            {/* ==================================================================== */}
            {/* 6. FUEL RAIL & ELECTRONIC INJECTION MANIFOLD (X: 195 to 480)         */}
            {/* ==================================================================== */}
            <g
              id="fuel-rail-group"
              onClick={() => handleSelect('fuel_injection')}
              style={{ cursor: 'pointer' }}
              filter={isActive('fuel_injection') ? 'url(#glowActive)' : undefined}
            >
              {/* Common Rail Tube */}
              <rect
                x="195"
                y="262"
                width="290"
                height="8"
                rx="3"
                fill="url(#fuelRailGrad)"
                stroke={isActive('fuel_injection') ? getSubColor('fuel_injection') : '#a16207'}
                strokeWidth={isActive('fuel_injection') ? 2 : 1}
              />
              {/* Injector Delivery Jumpers */}
              <line x1="237" y1="262" x2="237" y2="420" stroke="#fde047" strokeWidth="2.5" />
              <line x1="395" y1="262" x2="395" y2="420" stroke="#fde047" strokeWidth="2.5" />
              <line x1="237" y1="262" x2="237" y2="80" stroke="#fde047" strokeWidth="2.5" />
              <line x1="395" y1="262" x2="395" y2="80" stroke="#fde047" strokeWidth="2.5" />

              {/* Fuel Pressure Regulator (FPR) */}
              <circle cx="488" cy="266" r="10" fill="#d97706" stroke="#fde047" strokeWidth="1.5" />
              <text x="488" y="269" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#ffffff">3.8B</text>

              {/* Fuel Rail Label */}
              <text x="340" y="278" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#fde047" fontFamily="var(--font-mono)">
                ELECTRONIC COMMON-RAIL [3.8 BAR]
              </text>
            </g>

            {/* ==================================================================== */}
            {/* 7. LUBRICATION SUMP & GEAR PUMP (Bottom Right, X: 480 to 600)        */}
            {/* ==================================================================== */}
            <g
              id="lubrication-group"
              onClick={() => handleSelect('lubrication')}
              style={{ cursor: 'pointer' }}
              filter={isActive('lubrication') ? 'url(#glowActive)' : undefined}
            >
              {/* Oil Sump / Pan below Engine Block */}
              <path
                d="M 230 325 L 245 350 L 445 350 L 460 325 Z"
                fill="#1e293b"
                stroke={isActive('lubrication') ? getSubColor('lubrication') : '#d97706'}
                strokeWidth={isActive('lubrication') ? 2 : 1.2}
              />
              {/* Sump Cooling Fins */}
              <line x1="260" y1="350" x2="430" y2="350" stroke="#d97706" strokeWidth="2" />
              <circle cx="345" cy="346" r="3" fill="#f59e0b" />

              {/* Spin-On Aviation Oil Filter */}
              <g transform="translate(480, 275)">
                <rect
                  x="0"
                  y="0"
                  width="36"
                  height="46"
                  rx="4"
                  fill="#ffffff"
                  stroke={isActive('lubrication') ? getSubColor('lubrication') : '#94a3b8'}
                  strokeWidth={isActive('lubrication') ? 2 : 1.2}
                />
                <line x1="0" y1="12" x2="36" y2="12" stroke="#e2e8f0" strokeWidth="1" />
                <text x="18" y="24" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#0f172a">OIL</text>
                <text x="18" y="32" textAnchor="middle" fontSize="6" fill="#64748b">FILTER</text>
                <circle cx="18" cy="39" r="2" fill="#ef4444" />
              </g>

              {/* Engine-Driven Trochoid Oil Pump Housing */}
              <circle
                cx="500"
                cy="245"
                r="18"
                fill="#334155"
                stroke={isActive('lubrication') ? getSubColor('lubrication') : '#d97706'}
                strokeWidth={isActive('lubrication') ? 2 : 1.2}
              />
              <circle cx="500" cy="245" r="8" fill="#d97706" />

              {/* Oil Line to Turbo Bearings */}
              <path d="M 500 227 L 500 180 L 645 180" fill="none" stroke="url(#oilLineGrad)" strokeWidth="3" />

              {/* HUD Tag */}
              <text x="500" y="335" textAnchor="middle" fontSize="8" fontWeight="700" fill="#f59e0b">
                LUBRICATION SUMP
              </text>
              <text x="500" y="346" textAnchor="middle" fontSize="7" fill="#fbbf24" fontFamily="var(--font-mono)">
                {subsystems['lubrication']?.observed_metric ?? '4.2 bar'}
              </text>
            </g>

            {/* ==================================================================== */}
            {/* 8. COOLING SYSTEM (Water Pump & Expansion Tank, X: 480 to 570)       */}
            {/* ==================================================================== */}
            <g
              id="cooling-group"
              onClick={() => handleSelect('cooling')}
              style={{ cursor: 'pointer' }}
              filter={isActive('cooling') ? 'url(#glowActive)' : undefined}
            >
              {/* Coolant Expansion Header Tank (Top Right of Engine) */}
              <rect
                x="485"
                y="90"
                width="42"
                height="50"
                rx="4"
                fill="#0c4a6e"
                stroke={isActive('cooling') ? getSubColor('cooling') : '#38bdf8'}
                strokeWidth={isActive('cooling') ? 2 : 1.2}
              />
              {/* Coolant Fluid Sight Glass Level */}
              <rect x="492" y="105" width="28" height="26" rx="2" fill="#0284c7" opacity="0.8" />
              <line x1="492" y1="112" x2="520" y2="112" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 1" />
              {/* Pressure Radiator Cap (1.2 Bar) */}
              <rect x="498" y="84" width="16" height="7" rx="2" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />

              {/* Blue Silicone Coolant Distribution Lines to Cylinder Heads */}
              <path
                d="M 485 120 L 455 120 L 455 70"
                fill="none"
                stroke="url(#coolantHoseGrad)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 505 140 L 505 380 L 455 380 L 455 420"
                fill="none"
                stroke="url(#coolantHoseGrad)"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Centrifugal Water Pump on Accessory Gearcase */}
              <circle
                cx="505"
                cy="162"
                r="14"
                fill="#1e293b"
                stroke={isActive('cooling') ? getSubColor('cooling') : '#0284c7'}
                strokeWidth={isActive('cooling') ? 2 : 1.2}
              />
              <path d="M 500 155 Q 505 162 510 155" fill="none" stroke="#38bdf8" strokeWidth="2" />
              <path d="M 500 169 Q 505 162 510 169" fill="none" stroke="#38bdf8" strokeWidth="2" />

              {/* HUD Tag */}
              <text x="506" y="78" textAnchor="middle" fontSize="8" fontWeight="700" fill="#38bdf8">
                COOLANT TANK
              </text>
              <text x="506" y="150" textAnchor="middle" fontSize="7" fill="#bae6fd" fontFamily="var(--font-mono)">
                CHT: {subsystems['cooling']?.observed_metric ?? '94°C'}
              </text>
            </g>

            {/* ==================================================================== */}
            {/* 9. ELECTRICAL & FADEC DUAL-LANE ECU (Aft Base, X: 640 to 820)       */}
            {/* ==================================================================== */}
            <g
              id="electrical-group"
              onClick={() => handleSelect('electrical')}
              style={{ cursor: 'pointer' }}
              filter={isActive('electrical') ? 'url(#glowActive)' : undefined}
            >
              {/* 28V DC Internal Brushless Alternator */}
              <g transform="translate(640, 310)">
                <rect
                  x="0"
                  y="0"
                  width="54"
                  height="48"
                  rx="4"
                  fill="#1e293b"
                  stroke={isActive('electrical') ? getSubColor('electrical') : '#94a3b8'}
                  strokeWidth={isActive('electrical') ? 2 : 1.2}
                />
                {/* Copper Stator Windings Visible through Vents */}
                {[8, 16, 24, 32, 40].map(x => (
                  <line key={x} x1={x} y1="8" x2={x} y2="40" stroke="#d97706" strokeWidth="2" />
                ))}
                <circle cx="27" cy="24" r="10" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                <text x="27" y="27" textAnchor="middle" fontSize="7" fontWeight="700" fill="#f8fafc">28V</text>
              </g>

              {/* Dual FADEC Engine Control Units (Lane A & Lane B) */}
              <g transform="translate(710, 290)">
                <rect
                  x="0"
                  y="0"
                  width="70"
                  height="72"
                  rx="4"
                  fill="#0b0f19"
                  stroke={isActive('electrical') ? getSubColor('electrical') : '#3b82f6'}
                  strokeWidth={isActive('electrical') ? 2.5 : 1.5}
                />
                <rect x="5" y="6" width="60" height="26" rx="2" fill="#1e293b" />
                <text x="35" y="18" textAnchor="middle" fontSize="8" fontWeight="800" fill="#f8fafc">FADEC LANE A</text>
                <text x="35" y="27" textAnchor="middle" fontSize="7" fill="#22c55e" fontFamily="var(--font-mono)">● ACTIVE MASTER</text>

                <rect x="5" y="38" width="60" height="26" rx="2" fill="#1e293b" />
                <text x="35" y="50" textAnchor="middle" fontSize="8" fontWeight="800" fill="#f8fafc">FADEC LANE B</text>
                <text x="35" y="59" textAnchor="middle" fontSize="7" fill="#3b82f6" fontFamily="var(--font-mono)">● HOT STANDBY</text>

                {/* Military-Grade Circular Harness Plugs (Mil-DTL-38999) */}
                <circle cx="-6" cy="18" r="4" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />
                <circle cx="-6" cy="50" r="4" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />
              </g>

              {/* Electrical Harness Wiring Conduit */}
              <path d="M 694 330 L 704 330" stroke="#facc15" strokeWidth="3" />
              <path d="M 745 290 L 745 250 L 500 250" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />

              {/* Electrical HUD Tag */}
              <text x="745" y="380" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#60a5fa">
                DUAL FADEC & 28V BUS
              </text>
              <text x="745" y="392" textAnchor="middle" fontSize="7.5" fill="#93c5fd" fontFamily="var(--font-mono)">
                {subsystems['electrical']?.observed_metric ?? '28.2 V / 42 A'}
              </text>
            </g>

            {/* ==================================================================== */}
            {/* 10. SENSOR & TELEMETRY OVERLAY LAYER (When ViewMode === 'sensors')    */}
            {/* ==================================================================== */}
            {(viewMode === 'sensors' || viewMode === 'flow') && (
              <g id="telemetry-sensor-overlay">
                {/* EGT Sensor Thermocouple Rings */}
                {[
                  { x: 300, y: 55, label: 'EGT 1' },
                  { x: 445, y: 55, label: 'EGT 3' },
                  { x: 300, y: 445, label: 'EGT 2' },
                  { x: 445, y: 445, label: 'EGT 4' }
                ].map(s => (
                  <g key={s.label}>
                    <circle cx={s.x} cy={s.y} r="6" fill="#ef4444" fillOpacity="0.4" stroke="#fca5a5" strokeWidth="1.5" />
                    <circle cx={s.x} cy={s.y} r="2.5" fill="#f8fafc" />
                    <text x={s.x + 8} y={s.y + 3} fontSize="7" fontWeight="700" fill="#fca5a5" fontFamily="var(--font-mono)">
                      {s.label}
                    </text>
                  </g>
                ))}

                {/* CHT Head Probes */}
                {[
                  { x: 250, y: 45, label: 'CHT 1' },
                  { x: 400, y: 45, label: 'CHT 3' },
                  { x: 250, y: 455, label: 'CHT 2' },
                  { x: 400, y: 455, label: 'CHT 4' }
                ].map(s => (
                  <g key={s.label}>
                    <circle cx={s.x} cy={s.y} r="5" fill="#38bdf8" fillOpacity="0.5" stroke="#bae6fd" strokeWidth="1.5" />
                    <circle cx={s.x} cy={s.y} r="2" fill="#ffffff" />
                  </g>
                ))}

                {/* Oil Pressure & Vibration Probes */}
                <g transform="translate(146, 155)">
                  <circle cx="0" cy="0" r="7" fill="#8b5cf6" fillOpacity="0.4" stroke="#c4b5fd" strokeWidth="1.5" />
                  <text x="9" y="3" fontSize="7" fontWeight="700" fill="#c4b5fd" fontFamily="var(--font-mono)">VIB PIEZO</text>
                </g>

                <g transform="translate(500, 245)">
                  <circle cx="0" cy="0" r="7" fill="#f59e0b" fillOpacity="0.4" stroke="#fde68a" strokeWidth="1.5" />
                  <text x="10" y="3" fontSize="7" fontWeight="700" fill="#fde68a" fontFamily="var(--font-mono)">OIL PRESS</text>
                </g>
              </g>
            )}

            {/* ==================================================================== */}
            {/* 11. ACTIVE SELECTION POINTER / HUD TARGET BRACKETS                   */}
            {/* ==================================================================== */}
            {activeKey === 'combustion' && (
              <g stroke="#22c55e" strokeWidth="1.5" fill="none" opacity="0.9">
                <rect x="200" y="35" width="270" height="155" rx="6" strokeDasharray="6 4" />
                <text x="210" y="25" fill="#22c55e" fontSize="9" fontWeight="800" fontFamily="var(--font-mono)">
                  TARGET ACTIVE: COMBUSTION CHAMBER & CYLINDERS
                </text>
              </g>
            )}

            {activeKey === 'fuel_injection' && (
              <g stroke="#f59e0b" strokeWidth="2" fill="none">
                <rect x="195" y="255" width="130" height="230" rx="6" strokeDasharray="8 4" />
                <circle cx="237" cy="432" r="16" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />
                <text x="205" y="248" fill="#f59e0b" fontSize="9" fontWeight="800" fontFamily="var(--font-mono)">
                  TARGET ACTIVE: CYL 2 FUEL INJECTION NOZZLE
                </text>
              </g>
            )}

            {activeKey === 'vibration' && (
              <g stroke="#3b82f6" strokeWidth="1.5" fill="none">
                <rect x="15" y="165" width="180" height="170" rx="6" strokeDasharray="6 4" />
                <text x="25" y="155" fill="#3b82f6" fontSize="9" fontWeight="800" fontFamily="var(--font-mono)">
                  TARGET ACTIVE: REDUCTION GEARBOX (PRSU)
                </text>
              </g>
            )}

            {activeKey === 'lubrication' && (
              <g stroke="#d97706" strokeWidth="1.5" fill="none">
                <rect x="220" y="220" width="310" height="145" rx="6" strokeDasharray="6 4" />
                <text x="230" y="215" fill="#d97706" fontSize="9" fontWeight="800" fontFamily="var(--font-mono)">
                  TARGET ACTIVE: HYDRODYNAMIC LUBRICATION SYSTEM
                </text>
              </g>
            )}

            {activeKey === 'cooling' && (
              <g stroke="#0284c7" strokeWidth="1.5" fill="none">
                <rect x="475" y="60" width="320" height="120" rx="6" strokeDasharray="6 4" />
                <text x="485" y="52" fill="#0284c7" fontSize="9" fontWeight="800" fontFamily="var(--font-mono)">
                  TARGET ACTIVE: LIQUID COOLING JACKET & HEAT EXCHANGER
                </text>
              </g>
            )}

            {activeKey === 'electrical' && (
              <g stroke="#6366f1" strokeWidth="1.5" fill="none">
                <rect x="630" y="280" width="160" height="120" rx="6" strokeDasharray="6 4" />
                <text x="640" y="272" fill="#6366f1" fontSize="9" fontWeight="800" fontFamily="var(--font-mono)">
                  TARGET ACTIVE: 28V ALTERNATOR & DUAL FADEC
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Right: Subsystem State Inspector & Physics Delta Card */}
        <div style={{
          flex: '1 1 38%',
          minWidth: '320px',
          background: '#ffffff',
          border: '1px solid var(--border-medium)',
          borderRadius: '6px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div>
            {/* Header with Subsystem Health Badge */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '12px',
              marginBottom: '14px'
            }}>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  AERO PROPULSION TELEMETRY INSPECTOR
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>
                  {activeSub?.name || 'Selected Subsystem'}
                </h3>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                  {activeKey === 'combustion' && 'Cylinders 1, 3, 4 combustion chambers, dual ignition & EGT manifold'}
                  {activeKey === 'fuel_injection' && 'Cylinder 2 solenoid injector, 3.8 bar fuel rail & flow trims'}
                  {activeKey === 'vibration' && 'Propeller governor, 2.43:1 helical reduction gear & main bearing balance'}
                  {activeKey === 'lubrication' && 'Scavenge oil sump, high-flow trochoid pump, filter & oil radiator'}
                  {activeKey === 'cooling' && 'Cylinder head liquid jackets, centrifugal coolant pump & expansion tank'}
                  {activeKey === 'electrical' && 'Internal 28V alternator, starter bendix & dual-redundant FADEC lanes'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: getSubColor(activeKey), lineHeight: 1 }}>
                  {activeSub?.health_index ?? 100}%
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: getSubFill(activeKey),
                    color: getSubColor(activeKey),
                    border: `1px solid ${getSubColor(activeKey)}`
                  }}
                >
                  {activeSub?.status || 'NORMAL'}
                </span>
              </div>
            </div>

            {/* Metric Comparison Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Primary Sensor Signal:</div>
                <div style={{ fontWeight: 700, fontSize: '12px', color: '#1e293b', marginTop: '2px' }}>
                  {activeSub?.primary_metric}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 800, marginTop: '4px', color: '#0f172a' }}>
                  {activeSub?.observed_metric}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Digital Twin Model Residual:</div>
                <div style={{ fontWeight: 700, fontSize: '12px', color: '#1e293b', marginTop: '2px' }}>
                  Δ (Observed - Expected)
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '15px',
                    fontWeight: 800,
                    marginTop: '4px',
                    color: activeSub?.residual_metric?.startsWith('+') && !activeSub.residual_metric.includes('0.0') ? '#b45309' : (activeSub?.residual_metric?.startsWith('-') ? '#dc2626' : '#15803d')
                  }}
                >
                  {activeSub?.residual_metric}
                </div>
              </div>
            </div>

            {/* Diagnostic Evidence Feed */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                Physics-Informed Sensor Evidence:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeSub?.evidence?.map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      background: '#f8fafc',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      borderLeft: `3px solid ${getSubColor(activeKey)}`,
                      fontSize: '11.5px',
                      color: '#334155'
                    }}
                  >
                    <Info size={14} color={getSubColor(activeKey)} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ lineHeight: 1.35 }}>{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subsystem Technical Specifications Sheet */}
            <div style={{
              background: '#f1f5f9',
              padding: '10px 12px',
              borderRadius: '4px',
              border: '1px solid var(--border-medium)',
              fontSize: '11px',
              marginBottom: '10px'
            }}>
              <div style={{ fontWeight: 700, color: '#334155', marginBottom: '6px', fontSize: '10px', textTransform: 'uppercase' }}>
                Component Blueprint Parameters:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', color: '#475569' }}>
                {activeKey === 'combustion' && (
                  <>
                    <div>Bore × Stroke: <strong>84 × 61 mm</strong></div>
                    <div>Compression Ratio: <strong>9.0 : 1</strong></div>
                    <div>Firing Order: <strong>1 - 3 - 2 - 4</strong></div>
                    <div>Max Continuous EGT: <strong>850 °C</strong></div>
                  </>
                )}
                {activeKey === 'fuel_injection' && (
                  <>
                    <div>Injector Type: <strong>High-Z Solenoid</strong></div>
                    <div>Rail Pressure: <strong>3.8 bar nominal</strong></div>
                    <div>Duty Cycle Margin: <strong>&lt; 85% limit</strong></div>
                    <div>Spray Geometry: <strong>15° Dual Cone</strong></div>
                  </>
                )}
                {activeKey === 'vibration' && (
                  <>
                    <div>Gear Ratio: <strong>2.43 : 1 Helical</strong></div>
                    <div>Propeller: <strong>3-Blade Scimitar</strong></div>
                    <div>Vibration ISO Class: <strong>Class 2.8 Aero</strong></div>
                    <div>Overload Clutch: <strong>600 Nm break</strong></div>
                  </>
                )}
                {activeKey === 'lubrication' && (
                  <>
                    <div>Sump Capacity: <strong>3.2 Liters AeroShell</strong></div>
                    <div>Nominal Pressure: <strong>3.5 - 5.0 bar</strong></div>
                    <div>Pump Output: <strong>18 L/min @ 5500 RPM</strong></div>
                    <div>Oil Cooler: <strong>Thermostatic 80°C</strong></div>
                  </>
                )}
                {activeKey === 'cooling' && (
                  <>
                    <div>Cooling Media: <strong>50/50 Glycol/Water</strong></div>
                    <div>Pump Drive: <strong>Crankshaft Gear Driven</strong></div>
                    <div>Max Permissible CHT: <strong>135 °C</strong></div>
                    <div>Cap Relief Rating: <strong>1.2 bar (17.4 psi)</strong></div>
                  </>
                )}
                {activeKey === 'electrical' && (
                  <>
                    <div>Alternator Rating: <strong>28V DC / 50A</strong></div>
                    <div>ECU Architecture: <strong>Dual-Lane FADEC</strong></div>
                    <div>Bus Regulation: <strong>Solid-State 28.2V</strong></div>
                    <div>Spark Energy: <strong>45 mJ per discharge</strong></div>
                  </>
                )}
              </div>
            </div>
          </div>


 
          {/* Bottom Evaluation Note */}
          <div style={{
            background: '#f8fafc',
            padding: '8px 10px',
            borderRadius: '4px',
            border: '1px solid var(--border-light)',
            fontSize: '10px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <CheckCircle size={13} color="#16a34a" style={{ flexShrink: 0 }} />
            <span>
              Real-time aero-mechanical digital twin residual calibrated against FAA/EASA certified flight envelope thermodynamics.
            </span>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

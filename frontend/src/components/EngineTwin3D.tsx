import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LiveTelemetryResponse } from '../types';
import './EngineTwin3D.css';

const TAU = Math.PI * 2;

// Kinematic configuration
const STATION_X = [-1.05, 0, 1.05];
const BOXER_OFFSET = 0.12;
const THROW_ANGLE = [0, (4 * Math.PI) / 3, (2 * Math.PI) / 3];
const THROW_R = 0.22;
const ROD_L = 0.85;
const CRANK_PLANE_PIN_HALF = 0.075;

export interface SensorMeta {
  num: number;
  name: string;
  subsystemKey: string;
  unit: string;
  label: string;
  blurb: string;
  nominal: [number, number];
  lowWarn?: number;
  lowCrit?: number;
  highWarn?: number;
  highCrit?: number;
}

export const SENSORS: Record<string, SensorMeta> = {
  cht: {
    num: 1,
    name: 'Cylinder Heads & Barrels',
    subsystemKey: 'combustion',
    unit: '°C',
    label: 'Cylinder Head Temp (CHT)',
    blurb: 'Finned cylinder barrels and CNC heads. Thermal glow follows live CHT — the classic indicator for thermal overload, mixture detonation, or cooling loss.',
    nominal: [130, 160],
    highWarn: 165,
    highCrit: 175,
  },
  egt: {
    num: 2,
    name: 'Exhaust Headers & Turbo Scroll',
    subsystemKey: 'combustion',
    unit: '°C',
    label: 'Exhaust Gas Temp (EGT)',
    blurb: 'Stainless header runners, twin collectors, and turbocharger turbine scroll. Glow tracks combustion exhaust temperature and turbo inlet enthalpy.',
    nominal: [650, 720],
    highWarn: 740,
    highCrit: 770,
  },
  oilPressure: {
    num: 3,
    name: 'Oil Sump & Scavenge Pump',
    subsystemKey: 'lubrication',
    unit: 'bar',
    label: 'Engine Oil Pressure',
    blurb: 'Ribbed wet oil sump, gerotor pressure pump, and spin-on filter with -AN aero fittings. Low pressure risks journal bearing seizure.',
    nominal: [4.2, 5.2],
    lowWarn: 3.8,
    lowCrit: 3.2,
  },
  oilTemp: {
    num: 4,
    name: 'Oil Cooler Matrix & Lines',
    subsystemKey: 'cooling',
    unit: '°C',
    label: 'Engine Oil Temperature',
    blurb: 'Finned aluminum radiator on the oil cooling circuit with braided aero hoses. Rising oil temperature points to heat exchanger blockage.',
    nominal: [82, 102],
    highWarn: 105,
    highCrit: 115,
  },
  fuelFlow: {
    num: 5,
    name: 'Fuel Rail & Injectors',
    subsystemKey: 'fuel_injection',
    unit: 'L/h',
    label: 'Fuel Flow Rate',
    blurb: 'Multi-port electronic fuel injectors, distribution rail, and return regulator. Starvation or nozzle clogging alters delivery pressure.',
    nominal: [15.0, 19.5],
    lowWarn: 13.5,
    lowCrit: 11.0,
    highWarn: 21.0,
    highCrit: 24.0,
  },
  manifoldPressure: {
    num: 6,
    name: 'Turbo Compressor & Plenum',
    subsystemKey: 'combustion',
    unit: 'kPa',
    label: 'Manifold Air Pressure (MAP / Boost)',
    blurb: 'Centrifugal turbo compressor, boost crossover tube, and plenum runners feeding boxer cylinders. Reflects forced-induction density.',
    nominal: [85, 105],
    lowWarn: 78,
    lowCrit: 70,
  },
  vibration: {
    num: 7,
    name: 'Crankcase & Dynamic Mounts',
    subsystemKey: 'vibration',
    unit: 'mm/s',
    label: 'RMS Block Vibration',
    blurb: 'Split cast aluminum crankcase with isolation bushings. Vibration anomalies indicate rotor unbalance, mount fatigue, or blade track error.',
    nominal: [1.5, 2.8],
    highWarn: 3.2,
    highCrit: 4.2,
  },
  rpm: {
    num: 8,
    name: 'Crankshaft & Propeller Assembly',
    subsystemKey: 'vibration',
    unit: 'rpm',
    label: 'Crankshaft Speed (RPM)',
    blurb: 'Drop-forged counterweighted crankshaft, opposed pistons, poppet valves, and pitch-twisted aerodynamic carbon propeller blades.',
    nominal: [4800, 5400],
    lowWarn: 4400,
    lowCrit: 4000,
    highWarn: 5600,
    highCrit: 5900,
  },
  batteryVoltage: {
    num: 9,
    name: 'Alternator & 28V DC Bus',
    subsystemKey: 'electrical',
    unit: 'V',
    label: 'Electrical Bus Voltage',
    blurb: 'Engine-driven alternator and v-belt drive supplying 28V DC power to FADEC electronics, dual ignition coils, and telemetry bus sensors.',
    nominal: [27.0, 28.6],
    lowWarn: 26.2,
    lowCrit: 24.5,
    highWarn: 29.5,
    highCrit: 30.5,
  },
};

const PART_ORDER = Object.keys(SENSORS);

export interface EngineTwin3DProps {
  telemetry?: LiveTelemetryResponse | null;
  historyMap?: Record<string, number[]>;
  selectedSubsystemKey?: string;
  onSelectSubsystem?: (key: string) => void;
  height?: number | string;
}

export const EngineTwin3D: React.FC<EngineTwin3DProps> = ({
  telemetry,
  historyMap,
  selectedSubsystemKey,
  onSelectSubsystem,
  height = 560,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const sparklineCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render style mode: Realistic PBR | FLIR Thermal Infrared | FEA Stress Analysis
  const [renderMode, setRenderMode] = useState<'realistic' | 'flir' | 'fea'>('realistic');

  // Camera presets
  const [currentView, setCurrentView] = useState<'iso' | 'front' | 'side' | 'top' | 'rear' | 'cinematic'>('iso');

  // Display layer toggles & sliders
  const [xray, setXray] = useState<boolean>(false);
  const [sectionCut, setSectionCut] = useState<boolean>(false);
  const [sectionDepth, setSectionDepth] = useState<number>(0.1);
  const [explodePct, setExplodePct] = useState<number>(0);
  const [isExploding, setIsExploding] = useState<boolean>(false);
  const [flow, setFlow] = useState<boolean>(true);
  const [showValves, setShowValves] = useState<boolean>(true);
  const [labels, setLabels] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [slowRatio, setSlowRatio] = useState<number>(60);
  const [selectedPartKey, setSelectedPartKey] = useState<string | null>(null);
  const [hoveredPartKey, setHoveredPartKey] = useState<string | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

  // HUD stats
  const [hudState, setHudState] = useState({
    synced: true,
    tail: 'UAV-01 (MALE TURBO)',
    rpm: 5180,
    cycleDeg: 0,
    boostKpa: 94.0,
    linkAge: 0.5,
  });

  // Pin screen positions: map of key -> { x: number, y: number, visible: boolean }
  const [pinPositions, setPinPositions] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});

  const localHistoryRef = useRef<Record<string, number[]>>({});

  // Animation Loop Bridge Ref
  const loopBridgeRef = useRef({
    telemetry,
    historyMap,
    renderMode,
    xray,
    sectionCut,
    sectionDepth,
    explodePct,
    isExploding,
    flow,
    showValves,
    autoRotate,
    isPaused,
    slowRatio,
    currentView,
    selectedPartKey,
    hoveredPartKey,
    onViewChange: (_view: string) => {},
    onZoomFactor: (_factor: number) => {},
    onSelectPart: (_key: string | null) => {},
  });

  // Extract current readings
  const currentReadings = useMemo(() => {
    const obs = telemetry?.observed;
    return {
      cht: obs?.cht ?? 154.5,
      egt: obs?.egt ?? 690.0,
      oilPressure: obs?.oil_pressure ?? 4.70,
      oilTemp: obs?.oil_temperature ?? 92.5,
      fuelFlow: obs?.fuel_flow ?? 17.5,
      manifoldPressure: obs?.manifold_pressure ?? 94.0,
      vibration: obs?.vibration ?? 2.50,
      rpm: obs?.rpm ?? 5180,
      batteryVoltage: obs?.battery_voltage ?? 28.0,
    };
  }, [telemetry]);

  const partStatuses = useMemo(() => {
    const subs = telemetry?.subsystems || {};
    const res: Record<string, 'nominal' | 'warning' | 'critical'> = {};

    PART_ORDER.forEach((key) => {
      const s = SENSORS[key];
      const sub = subs[s.subsystemKey];
      const val = (currentReadings as any)[key];

      let st: 'nominal' | 'warning' | 'critical' = 'nominal';
      if (s.highCrit !== undefined && val >= s.highCrit) st = 'critical';
      else if (s.lowCrit !== undefined && val <= s.lowCrit) st = 'critical';
      else if (s.highWarn !== undefined && val >= s.highWarn) st = 'warning';
      else if (s.lowWarn !== undefined && val <= s.lowWarn) st = 'warning';

      if (sub) {
        if (sub.status === 'CRITICAL' || sub.health_index < 70) {
          st = 'critical';
        } else if ((sub.status === 'DEGRADING' || sub.status === 'WATCH' || sub.health_index < 88) && st === 'nominal') {
          st = 'warning';
        }
      }
      res[key] = st;
    });

    return res;
  }, [telemetry, currentReadings]);

  // Synchronize selection with parent if selectedSubsystemKey changes
  useEffect(() => {
    if (selectedSubsystemKey) {
      const found = PART_ORDER.find((k) => SENSORS[k].subsystemKey === selectedSubsystemKey);
      if (found) {
        setSelectedPartKey((prev) => (prev !== found ? found : prev));
      }
    }
  }, [selectedSubsystemKey]);

  const handleSelectPart = useCallback((key: string | null) => {
    setSelectedPartKey(key);
    if (key && onSelectSubsystem) {
      onSelectSubsystem(SENSORS[key].subsystemKey);
    }
  }, [onSelectSubsystem]);

  // Synchronize latest reactive state to animation loop bridge
  useEffect(() => {
    loopBridgeRef.current.telemetry = telemetry;
    loopBridgeRef.current.historyMap = historyMap;
    loopBridgeRef.current.renderMode = renderMode;
    loopBridgeRef.current.xray = xray;
    loopBridgeRef.current.sectionCut = sectionCut;
    loopBridgeRef.current.sectionDepth = sectionDepth;
    loopBridgeRef.current.explodePct = isExploding ? 1 : explodePct;
    loopBridgeRef.current.isExploding = isExploding;
    loopBridgeRef.current.flow = flow;
    loopBridgeRef.current.showValves = showValves;
    loopBridgeRef.current.autoRotate = autoRotate;
    loopBridgeRef.current.isPaused = isPaused;
    loopBridgeRef.current.slowRatio = slowRatio;
    loopBridgeRef.current.currentView = currentView;
    loopBridgeRef.current.selectedPartKey = selectedPartKey;
    loopBridgeRef.current.hoveredPartKey = hoveredPartKey;
    loopBridgeRef.current.onSelectPart = handleSelectPart;
  });

  // Sparkline drawing inside detail inspector
  useEffect(() => {
    const canvas = sparklineCanvasRef.current;
    if (!canvas || !selectedPartKey) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const key = selectedPartKey;
    const meta = SENSORS[key];
    const mapKey = key === 'oilPressure' ? 'oil_pressure' : key === 'oilTemp' ? 'oil_temperature' : key === 'fuelFlow' ? 'fuel_flow' : key === 'batteryVoltage' ? 'battery_voltage' : key;
    const data = (historyMap && historyMap[mapKey]) || localHistoryRef.current[key] || [(currentReadings as any)[key]];

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (data.length < 2) return;

    let min = Math.min(...data, meta.nominal[0]);
    let max = Math.max(...data, meta.nominal[1]);
    const pad = (max - min) * 0.12 || 1;
    min -= pad;
    max += pad;

    const getY = (val: number) => h - ((val - min) / (max - min)) * h;

    const nomY1 = getY(meta.nominal[1]);
    const nomY0 = getY(meta.nominal[0]);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.14)';
    ctx.fillRect(0, Math.min(nomY0, nomY1), w, Math.abs(nomY1 - nomY0));

    ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(0, nomY1);
    ctx.lineTo(w, nomY1);
    ctx.moveTo(0, nomY0);
    ctx.lineTo(w, nomY0);
    ctx.stroke();
    ctx.setLineDash([]);

    const st = partStatuses[key] || 'nominal';
    ctx.strokeStyle = st === 'critical' ? '#ef4444' : st === 'warning' ? '#f59e0b' : '#38bdf8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = (i / Math.max(1, data.length - 1)) * w;
      const y = getY(val);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [selectedPartKey, currentReadings, partStatuses, historyMap]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const stage = stageRef.current;
    const host = canvasHostRef.current;
    if (!stage || !host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      queueMicrotask(() => setWebglError('WebGL is unavailable in this environment.'));
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.localClippingEnabled = true;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    let envTarget: THREE.WebGLRenderTarget | null = null;

    function buildEnvironment() {
      const room = new RoomEnvironment();
      const target = pmrem.fromScene(room, 0.04);
      room.dispose();
      if (envTarget) envTarget.dispose();
      envTarget = target;
      scene.environment = target.texture;
    }
    buildEnvironment();
    scene.environmentIntensity = 0.85;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
    const VIEWS = {
      iso: { pos: [7.4, 3.8, 8.0], target: [0.5, -0.3, 0] },
      front: { pos: [13, 0.8, 0.01], target: [0.4, -0.2, 0] },
      side: { pos: [0.4, 0.6, 14], target: [0.4, -0.2, 0] },
      top: { pos: [0.4, 14, 0.01], target: [0.4, -0.2, 0] },
      rear: { pos: [-11, 2.2, 5], target: [-0.6, -0.4, 0] },
      cinematic: { pos: [8.5, 4.5, 7.5], target: [0.4, -0.2, 0] },
    };
    camera.position.set(...(VIEWS.iso.pos as [number, number, number]));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...(VIEWS.iso.target as [number, number, number]));
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3.5;
    controls.maxDistance = 28;
    controls.maxPolarAngle = Math.PI * 0.96;
    controls.autoRotateSpeed = 1.2;

    // Studio Lighting
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(7, 10, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    Object.assign(keyLight.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 32 });
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.03;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.3);
    rimLight.position.set(-8, 4, -7);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffedd5, 0.75);
    fillLight.position.set(4, -3, 6);
    scene.add(fillLight);

    scene.add(new THREE.HemisphereLight(0xc7d2fe, 0x1e1b18, 0.4));

    // Pedestal Test Bench Platform
    buildPedestal(scene);

    // Engine Main Vibration Group
    const engineGroup = new THREE.Group();
    scene.add(engineGroup);

    // Section Clipping Plane (CAD Cutaway Slice)
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.1);

    // Procedural Engine Model Architecture
    const model = buildEngine(engineGroup, clipPlane);
    const flows = buildFlows(scene, engineGroup, model);

    // Interactive Raycasting
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerInside = false;
    let downAt: [number, number] | null = null;
    const dom = renderer.domElement;

    const onPointerMove = (e: PointerEvent) => {
      const r = dom.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      pointerInside = true;
    };
    const onPointerLeave = () => {
      pointerInside = false;
      setHoveredPartKey(null);
      dom.style.cursor = 'grab';
    };
    const onPointerDown = (e: PointerEvent) => {
      downAt = [e.clientX, e.clientY];
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!downAt) return;
      const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
      downAt = null;
      if (moved > 5) return; // Orbit gesture
      if (loopBridgeRef.current.hoveredPartKey) {
        loopBridgeRef.current.onSelectPart(loopBridgeRef.current.hoveredPartKey);
      }
    };

    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerleave', onPointerLeave);
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointerup', onPointerUp);

    // Sizing & ResizeObserver
    function resize() {
      if (!stage) return;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();

    // Camera view transitions
    let camTween: {
      t: number;
      fromPos: THREE.Vector3;
      fromTarget: THREE.Vector3;
      toPos: THREE.Vector3;
      toTarget: THREE.Vector3;
    } | null = null;

    loopBridgeRef.current.onViewChange = (vName: string) => {
      const v = (VIEWS as any)[vName];
      if (!v) return;
      camTween = {
        t: 0,
        fromPos: camera.position.clone(),
        fromTarget: controls.target.clone(),
        toPos: new THREE.Vector3(...v.pos),
        toTarget: new THREE.Vector3(...v.target),
      };
    };

    loopBridgeRef.current.onZoomFactor = (factor: number) => {
      const dir = camera.position.clone().sub(controls.target).multiplyScalar(factor);
      camTween = {
        t: 0,
        fromPos: camera.position.clone(),
        fromTarget: controls.target.clone(),
        toPos: controls.target.clone().add(dir),
        toTarget: controls.target.clone(),
      };
    };

    // Main Animation Loop
    let rafId = 0;
    let lastT = performance.now();
    let elapsed = 0;
    let crankTheta = 0;
    let explodeAmount = 0;
    let lastHudAt = 0;
    let lastPinUpdateAt = 0;
    let cinematicAngle = 0;
    const vProj = new THREE.Vector3();
    const cdir = new THREE.Vector3();

    const STATUS_RGB = {
      nominal: new THREE.Color(0x22c55e),
      warning: new THREE.Color(0xf59e0b),
      critical: new THREE.Color(0xef4444),
    };
    const thermalColor = new THREE.Color();
    const emissiveBuffer = new THREE.Color();

    function tick() {
      const now = performance.now();
      const dt = Math.min((now - lastT) / 1000, 0.1);
      lastT = now;
      elapsed += dt;

      const bridge = loopBridgeRef.current;
      const obs = bridge.telemetry?.observed;
      const rpm = obs?.rpm ?? 5180;
      const vibration = obs?.vibration ?? 2.5;
      const cht = obs?.cht ?? 154.5;
      const egt = obs?.egt ?? 690.0;
      const mapVal = obs?.manifold_pressure ?? 94.0;

      // Section Clipping plane adjustment
      clipPlane.constant = bridge.sectionDepth * 3.0;
      renderer.localClippingEnabled = bridge.sectionCut;

      // Explode smoothing
      const targetExplode = bridge.explodePct;
      explodeAmount += (targetExplode - explodeAmount) * (1 - Math.exp(-dt / 0.28));

      // Cinematic Camera Drone Flyby
      if (bridge.currentView === 'cinematic') {
        cinematicAngle += dt * 0.22;
        const cRadius = 9.5;
        const cHeight = 4.0 + Math.sin(cinematicAngle * 1.5) * 1.8;
        camera.position.set(
          Math.cos(cinematicAngle) * cRadius + 0.4,
          cHeight,
          Math.sin(cinematicAngle) * cRadius
        );
        controls.target.set(0.4, -0.3, 0);
      } else if (camTween) {
        camTween.t = Math.min(1, camTween.t + dt / 0.85);
        const e = camTween.t * camTween.t * (3 - 2 * camTween.t);
        camera.position.lerpVectors(camTween.fromPos, camTween.toPos, e);
        controls.target.lerpVectors(camTween.fromTarget, camTween.toTarget, e);
        if (camTween.t >= 1) camTween = null;
      }

      controls.autoRotate = bridge.autoRotate && bridge.currentView !== 'cinematic';
      controls.update();

      // Raycasting hover check
      if (pointerInside) {
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(model.pickables, false)[0];
        const nextPart = hit ? (hit.object.userData.partKey as string) : null;
        if (nextPart !== bridge.hoveredPartKey) {
          setHoveredPartKey(nextPart);
          dom.style.cursor = nextPart ? 'pointer' : 'grab';
        }
      }

      // Kinematic shaft & cycle integration
      if (!bridge.isPaused) {
        const omega = ((rpm * TAU) / 60) / bridge.slowRatio;
        crankTheta += omega * dt;
        model.animate(crankTheta, omega, explodeAmount, bridge.xray, bridge.showValves);
      }

      // Multi-axis engine vibration shake
      const a = Math.max(0, vibration - 1.4) * 0.008 + vibration * 0.0008;
      engineGroup.position.set(
        Math.sin(elapsed * 61.3) * a * 0.5,
        Math.sin(elapsed * 47.1 + 1.3) * a,
        Math.sin(elapsed * 53.7 + 2.1) * a * 0.8
      );
      engineGroup.rotation.x = Math.sin(elapsed * 39.9) * a * 0.1;

      // Surface Shading: Realistic vs FLIR Thermal vs FEA Stress
      const chtThermalNorm = Math.pow(Math.min(1, Math.max(0, (cht - 100) / 75)), 2.6);
      const egtThermalNorm = Math.pow(Math.min(1, Math.max(0, (egt - 580) / 200)), 3.0) * 0.95;

      PART_ORDER.forEach((key) => {
        const p = model.parts[key];
        const sMeta = SENSORS[key];
        const sub = bridge.telemetry?.subsystems?.[sMeta.subsystemKey];

        let status: 'nominal' | 'warning' | 'critical' = 'nominal';
        const val = key === 'cht' ? cht : key === 'egt' ? egt : key === 'rpm' ? rpm : (obs as any)?.[key] ?? 0;
        if (sMeta.highCrit !== undefined && val >= sMeta.highCrit) status = 'critical';
        else if (sMeta.lowCrit !== undefined && val <= sMeta.lowCrit) status = 'critical';
        else if (sMeta.highWarn !== undefined && val >= sMeta.highWarn) status = 'warning';
        else if (sMeta.lowWarn !== undefined && val <= sMeta.lowWarn) status = 'warning';

        if (sub && (sub.status === 'CRITICAL' || sub.health_index < 70)) status = 'critical';
        else if (sub && (sub.status === 'DEGRADING' || sub.status === 'WATCH' || sub.health_index < 88) && status === 'nominal') status = 'warning';

        let statusPulse = 0;
        if (status === 'warning') statusPulse = 0.16 + 0.1 * Math.sin(elapsed * 3.2);
        else if (status === 'critical') statusPulse = 0.35 + 0.25 * Math.sin(elapsed * 9);

        const isSelected = bridge.selectedPartKey === key;
        const isHovered = bridge.hoveredPartKey === key;
        const accentPulse = isSelected ? 0.26 + 0.08 * Math.sin(elapsed * 4) : isHovered ? 0.16 : 0;

        for (const mat of p.mats) {
          emissiveBuffer.setRGB(0, 0, 0);

          if (bridge.renderMode === 'flir') {
            // FLIR Thermal Infrared Heat Palette: Deep violet -> Blue -> Green -> Amber -> Bright Red -> White
            let flirNorm = 0.15;
            if (key === 'cht') flirNorm = Math.min(1, 0.3 + (cht / 180) * 0.7);
            else if (key === 'egt') flirNorm = Math.min(1, 0.45 + (egt / 800) * 0.55);
            else if (key === 'oilTemp' || key === 'oilPressure') flirNorm = 0.55;
            else if (key === 'manifoldPressure') flirNorm = 0.35;
            else flirNorm = 0.22;

            getFlirColor(flirNorm, thermalColor);
            mat.color.copy(thermalColor);
            mat.emissive.copy(thermalColor).multiplyScalar(0.4);
            continue;
          } else if (bridge.renderMode === 'fea') {
            // FEA Von Mises Stress Analysis Palette: Blue (low) -> Cyan -> Yellow -> Red (peak combustion spike)
            let stressNorm = 0.1;
            if (key === 'rpm') {
              const degInCycle = (((crankTheta * 180) / Math.PI) % 180 + 180) % 180;
              const spike = degInCycle < 40 ? Math.sin((degInCycle / 40) * Math.PI) : 0;
              stressNorm = 0.25 + spike * 0.75;
            } else if (key === 'vibration') {
              stressNorm = Math.min(1, 0.3 + (vibration / 4.5) * 0.7);
            } else if (key === 'cht') {
              stressNorm = 0.45;
            }

            getFeaStressColor(stressNorm, thermalColor);
            mat.color.copy(thermalColor);
            mat.emissive.copy(thermalColor).multiplyScalar(0.35);
            continue;
          } else {
            // Restore realistic PBR base colors
            if (mat.userData.origColor) mat.color.copy(mat.userData.origColor);
          }

          // Thermal Emission
          if (mat.userData.thermal) {
            const tNorm = key === 'cht' ? chtThermalNorm : egtThermalNorm;
            if (tNorm > 0) {
              if (tNorm < 0.5) {
                thermalColor.setRGB(0.55 * (tNorm / 0.5), 0.05 * (tNorm / 0.5), 0);
              } else {
                const u = (tNorm - 0.5) / 0.5;
                thermalColor.setRGB(0.55 + 0.45 * u, 0.05 + 0.5 * u, 0.02 + 0.2 * u);
              }
              emissiveBuffer.add(thermalColor.multiplyScalar(mat.userData.thermal));
            }
          }

          // Status & Selection Alert Pulses
          if (statusPulse > 0) {
            emissiveBuffer.add(thermalColor.copy(STATUS_RGB[status]).multiplyScalar(statusPulse * (mat.userData.statusGain ?? 1)));
          }

          if (accentPulse > 0) {
            emissiveBuffer.add(thermalColor.setRGB(0.22, 0.74, 0.98).multiplyScalar(accentPulse));
          }

          mat.emissive.copy(emissiveBuffer);
        }
      });

      // Update fluid, gas, and propeller slipstream flows
      flows.update(dt, {
        flow: bridge.flow,
        explode: explodeAmount,
        rpm,
        cht,
        egt,
        fuelFlow: obs?.fuel_flow ?? 17.5,
        oilPressure: obs?.oil_pressure ?? 4.7,
        manifoldPressure: mapVal,
        slowRatio: bridge.slowRatio,
        isPaused: bridge.isPaused,
      });

      // Periodic HUD and Screen Pin projection updates
      if (now - lastHudAt > 200) {
        lastHudAt = now;
        const deg = Math.round((((crankTheta * 180) / Math.PI) % 720 + 720) % 720);
        setHudState({
          synced: !!bridge.telemetry,
          tail: bridge.telemetry?.engine_id || 'UAV-01 (MALE TURBO)',
          rpm: Math.round(rpm),
          cycleDeg: deg,
          boostKpa: mapVal,
          linkAge: 0.5,
        });
      }

      if (now - lastPinUpdateAt > 40 && stage) {
        lastPinUpdateAt = now;
        const w = stage.clientWidth;
        const h = stage.clientHeight;
        const newPins: Record<string, { x: number; y: number; visible: boolean }> = {};

        PART_ORDER.forEach((k) => {
          const part = model.parts[k];
          if (!part.anchor) return;
          part.anchor.getWorldPosition(vProj);
          cdir.copy(camera.position).sub(vProj).normalize();
          const facing = cdir.dot(part.normal) > -0.15;
          vProj.project(camera);
          const isVisible = facing && vProj.z < 1 && Math.abs(vProj.x) < 1.05 && Math.abs(vProj.y) < 1.05;
          newPins[k] = {
            x: ((vProj.x + 1) / 2) * w,
            y: ((-vProj.y + 1) / 2) * h,
            visible: isVisible,
          };
        });
        setPinPositions(newPins);
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(rafId);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerleave', onPointerLeave);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointerup', onPointerUp);
      ro.disconnect();
      controls.dispose();
      scene.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m: any) => {
            Object.values(m).forEach((v: any) => {
              if (v && v.isTexture) v.dispose();
            });
            m.dispose();
          });
        }
      });
      if (envTarget) envTarget.dispose();
      pmrem.dispose();
      renderer.dispose();
      dom.remove();
    };
  }, []);

  // Handlers for UI controls
  const handleViewClick = (v: 'iso' | 'front' | 'side' | 'top' | 'rear' | 'cinematic') => {
    setCurrentView(v);
    loopBridgeRef.current.onViewChange(v);
  };

  const handleExplodeToggle = () => {
    const next = !isExploding;
    setIsExploding(next);
    setExplodePct(next ? 1 : 0);
    loopBridgeRef.current.onZoomFactor(next ? 1.3 : 1 / 1.3);
  };

  const handleExplodeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) / 100;
    setExplodePct(val);
    setIsExploding(val > 0.05);
  };

  const handleSectionCutToggle = () => {
    setSectionCut(!sectionCut);
  };

  const handleSectionDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSectionDepth(Number(e.target.value) / 100);
  };

  const handleSlowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    const ratio = Math.round(12 * Math.pow(400 / 12, v));
    setSlowRatio(ratio);
  };

  const formatSensorValue = (key: string) => {
    const val = (currentReadings as any)[key];
    if (typeof val !== 'number') return '--';
    if (key === 'rpm') return val.toFixed(0);
    if (key === 'vibration' || key === 'batteryVoltage' || key === 'oilPressure' || key === 'fuelFlow') return val.toFixed(2);
    return val.toFixed(1);
  };

  return (
    <div className="twin-container">
      {/* 3D Stage Viewport */}
      <div className="twin-stage" ref={stageRef} style={{ height: typeof height === 'number' ? `${height}px` : height }}>
        <div className="twin-canvas-host" ref={canvasHostRef} />

        {webglError && (
          <div className="twin-overlay">
            <strong>Simulation Note:</strong> {webglError} Telemetry parameters continue to be processed.
          </div>
        )}

        {/* 3D Screen Projected Label Pins */}
        <div className={`twin-pins ${labels ? '' : 'hidden'}`}>
          {PART_ORDER.map((key) => {
            const pos = pinPositions[key];
            if (!pos) return null;
            const meta = SENSORS[key];
            const status = partStatuses[key] || 'nominal';
            const isSelected = selectedPartKey === key;
            const isHovered = hoveredPartKey === key;

            return (
              <button
                key={key}
                type="button"
                className={`twin-pin status-${status} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                style={{
                  opacity: pos.visible ? 1 : 0,
                  pointerEvents: pos.visible ? 'auto' : 'none',
                  transform: `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`,
                }}
                onClick={() => handleSelectPart(isSelected ? null : key)}
                onPointerEnter={() => setHoveredPartKey(key)}
                onPointerLeave={() => setHoveredPartKey(null)}
                title={`${meta.num}. ${meta.label}`}
              >
                <span className="tp-num">{meta.num}</span>
                <span className="tp-chip">
                  {meta.label}: {formatSensorValue(key)} {meta.unit}
                </span>
              </button>
            );
          })}
        </div>

        {/* Multi-Tier Toolbar Controls */}
        <div className="twin-toolbar" role="toolbar" aria-label="3D Twin Next-Gen Controls">
          {/* Row 1: Render Shader Styles + Camera Presets */}
          <div className="twin-toolbar-row">
            {/* Visual Render Modes */}
            <div className="tt-group" title="Select 3D shader and physical inspection mode">
              <button
                type="button"
                className={renderMode === 'realistic' ? 'active' : ''}
                onClick={() => setRenderMode('realistic')}
              >
                REALISTIC PBR
              </button>
              <button
                type="button"
                className={renderMode === 'flir' ? 'active-flir' : ''}
                onClick={() => setRenderMode('flir')}
                title="FLIR Infrared Thermal Camera Spectrum"
              >
                FLIR THERMAL
              </button>
              <button
                type="button"
                className={renderMode === 'fea' ? 'active-fea' : ''}
                onClick={() => setRenderMode('fea')}
                title="Dynamic Von Mises Mechanical Stress Distribution"
              >
                FEA STRESS
              </button>
            </div>

            {/* Camera Views */}
            <div className="tt-group">
              {(['iso', 'front', 'side', 'top', 'rear', 'cinematic'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={currentView === v ? 'active' : ''}
                  onClick={() => handleViewClick(v)}
                >
                  {v.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Play / Pause Toggle */}
            <div className="tt-group">
              <button
                type="button"
                className="tt-btn-play"
                onClick={() => setIsPaused(!isPaused)}
                title="Pause or Resume shaft and piston animation"
              >
                {isPaused ? '▶ RESUME' : '❚❚ FREEZE'}
              </button>
            </div>
          </div>

          {/* Row 2: Physics Layers & Dynamic Slices */}
          <div className="twin-toolbar-row">
            <div className="tt-group">
              <button
                type="button"
                className={xray ? 'active' : ''}
                onClick={() => setXray(!xray)}
                title="Ghost casings to reveal reciprocating pistons, rods, poppet valves, and combustion flashes"
              >
                X-RAY
              </button>
              <button
                type="button"
                className={sectionCut ? 'active' : ''}
                onClick={handleSectionCutToggle}
                title="Interactive CAD clipping cross-section plane through the cylinders"
              >
                SECTION CUT
              </button>
              <button
                type="button"
                className={isExploding ? 'active' : ''}
                onClick={handleExplodeToggle}
                title="Separate engine assemblies along disassembly vectors"
              >
                EXPLODE
              </button>
              <button
                type="button"
                className={flow ? 'active' : ''}
                onClick={() => setFlow(!flow)}
                title="Toggle air, turbo boost, fuel, exhaust, oil, and prop vortex slipstream flow lines"
              >
                FLOW
              </button>
              <button
                type="button"
                className={showValves ? 'active' : ''}
                onClick={() => setShowValves(!showValves)}
                title="Highlight dynamic overhead poppet valves and springs"
              >
                VALVES
              </button>
              <button
                type="button"
                className={labels ? 'active' : ''}
                onClick={() => setLabels(!labels)}
                title="Toggle 3D telemetry marker pins"
              >
                LABELS
              </button>
              <button
                type="button"
                className={autoRotate ? 'active' : ''}
                onClick={() => setAutoRotate(!autoRotate)}
                title="Toggle turntable auto-orbit"
              >
                ORBIT
              </button>
            </div>

            {/* Slow Motion Ratio Slider */}
            <div className="tt-slow" title="Slow-motion ratio so high shaft RPM (~5000) does not alias on screen">
              <span>SLOW-MO <b>1:{slowRatio}</b></span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={Math.round((Math.log(slowRatio / 12) / Math.log(400 / 12)) * 100)}
                onChange={handleSlowChange}
                aria-label="Slow-motion ratio"
              />
            </div>

            {/* Continuous Explode Slider (when exploding) */}
            {isExploding && (
              <div className="tt-slider-group" title="Continuous exploded assembly separation distance">
                <span>EXPLODE <b>{Math.round(explodePct * 100)}%</b></span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(explodePct * 100)}
                  onChange={handleExplodeSliderChange}
                  aria-label="Explode separation percentage"
                />
              </div>
            )}

            {/* Section Cut Slice Depth Slider (when section cut active) */}
            {sectionCut && (
              <div className="tt-slider-group" title="Adjust CAD transverse cross-section slice position">
                <span>SLICE <b>{Math.round(sectionDepth * 100)}%</b></span>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="2"
                  value={Math.round(sectionDepth * 100)}
                  onChange={handleSectionDepthChange}
                  aria-label="Cross-section slice depth"
                />
              </div>
            )}
          </div>
        </div>

        {/* Head-Up Display (HUD) */}
        <div className="twin-hud">
          <div className="th-live ok">
            <span className={`th-mode-badge ${renderMode}`}>
              {renderMode === 'realistic' ? 'PBR CAD' : renderMode === 'flir' ? 'FLIR INFRARED' : 'FEA STRESS'}
            </span>
            <span>{hudState.synced ? '● TWIN SYNCED' : '▲ OFFLINE'}</span>
          </div>
          <span>{hudState.tail}</span>
          <span>SHAFT {hudState.rpm} RPM</span>
          <span>CYCLE {String(hudState.cycleDeg).padStart(3, '0')}° BTDC</span>
          <span>BOOST {hudState.boostKpa.toFixed(1)} kPa</span>
          <span>SYNC AGE {hudState.linkAge.toFixed(1)}s</span>
        </div>

        {/* Floating Detail Inspector */}
        {selectedPartKey && (
          <aside
            className="twin-detail"
            data-status={partStatuses[selectedPartKey] || 'nominal'}
            role="region"
            aria-label="Component telemetry detail"
          >
            <div className="td-head">
              <span className="td-title">
                {SENSORS[selectedPartKey].num}. {SENSORS[selectedPartKey].name}
              </span>
              <span className={`td-badge status-${partStatuses[selectedPartKey] || 'nominal'}`}>
                {(partStatuses[selectedPartKey] || 'nominal').toUpperCase()}
              </span>
              <button
                type="button"
                className="td-close"
                onClick={() => handleSelectPart(null)}
                aria-label="Close component detail"
              >
                ×
              </button>
            </div>

            <div className="td-reading">
              <span className="td-value">
                {formatSensorValue(selectedPartKey)} {SENSORS[selectedPartKey].unit}
              </span>
              <span className="td-sensor">{SENSORS[selectedPartKey].label}</span>
            </div>

            <canvas
              ref={sparklineCanvasRef}
              className="td-sparkline-canvas"
              width={300}
              height={46}
              role="img"
              aria-label="Recent telemetry trend sparkline"
            />

            <div className="td-band">
              Nominal {SENSORS[selectedPartKey].nominal[0]}–{SENSORS[selectedPartKey].nominal[1]} {SENSORS[selectedPartKey].unit}
              {SENSORS[selectedPartKey].highWarn ? ` · Warn ≥ ${SENSORS[selectedPartKey].highWarn}` : ''}
              {SENSORS[selectedPartKey].highCrit ? ` · Crit ≥ ${SENSORS[selectedPartKey].highCrit}` : ''}
              {SENSORS[selectedPartKey].lowWarn ? ` · Warn ≤ ${SENSORS[selectedPartKey].lowWarn}` : ''}
            </div>

            <p className="td-blurb">{SENSORS[selectedPartKey].blurb}</p>
          </aside>
        )}
      </div>

      {/* Sensor Readout Rail Below Viewport */}
      <div className="twin-rail" role="group" aria-label="Interactive component sensor readouts">
        {PART_ORDER.map((key) => {
          const meta = SENSORS[key];
          const st = partStatuses[key] || 'nominal';
          const isSelected = selectedPartKey === key;
          const isHovered = hoveredPartKey === key;

          return (
            <button
              key={key}
              type="button"
              className={`twin-row status-${st} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
              onClick={() => handleSelectPart(isSelected ? null : key)}
              onPointerEnter={() => setHoveredPartKey(key)}
              onPointerLeave={() => setHoveredPartKey(null)}
            >
              <span className="tr-num">{meta.num}</span>
              <span className="tr-name">{meta.label}</span>
              <span className="tr-val">
                {formatSensorValue(key)} {meta.unit}
              </span>
              <i className="tr-dot" />
            </button>
          );
        })}
      </div>

      <p className="engine-diagram-caption">
        DRAG TO ORBIT · SCROLL TO ZOOM · TOGGLE FLIR THERMAL OR FEA STRESS SHADERS · SLICE SECTION CUT TO INSPECT INTERNAL RECIPROCATING HARDWARE
      </p>
    </div>
  );
};

// =========================================================================
// Color Ramp Generators for FLIR Thermal & FEA Stress Modes
// =========================================================================

function getFlirColor(u: number, out: THREE.Color) {
  // FLIR Ironbow spectrum: dark purple -> deep blue -> teal -> green -> yellow -> bright orange -> white
  if (u < 0.2) {
    const t = u / 0.2;
    out.setRGB(0.12 + 0.15 * t, 0.02, 0.25 + 0.5 * t);
  } else if (u < 0.4) {
    const t = (u - 0.2) / 0.2;
    out.setRGB(0.27 - 0.2 * t, 0.02 + 0.55 * t, 0.75 - 0.1 * t);
  } else if (u < 0.6) {
    const t = (u - 0.4) / 0.2;
    out.setRGB(0.07 + 0.8 * t, 0.57 + 0.35 * t, 0.65 - 0.6 * t);
  } else if (u < 0.8) {
    const t = (u - 0.6) / 0.2;
    out.setRGB(0.87 + 0.13 * t, 0.92 - 0.3 * t, 0.05);
  } else {
    const t = (u - 0.8) / 0.2;
    out.setRGB(1.0, 0.62 + 0.38 * t, 0.05 + 0.95 * t);
  }
}

function getFeaStressColor(u: number, out: THREE.Color) {
  // Von Mises Stress spectrum: Dark Blue -> Cyan -> Green -> Yellow -> Vibrant Red
  if (u < 0.25) {
    const t = u / 0.25;
    out.setRGB(0.05, 0.15 + 0.7 * t, 0.85);
  } else if (u < 0.5) {
    const t = (u - 0.25) / 0.25;
    out.setRGB(0.05 + 0.3 * t, 0.85 + 0.15 * t, 0.85 - 0.65 * t);
  } else if (u < 0.75) {
    const t = (u - 0.5) / 0.25;
    out.setRGB(0.35 + 0.65 * t, 1.0 - 0.25 * t, 0.2 - 0.2 * t);
  } else {
    const t = (u - 0.75) / 0.25;
    out.setRGB(1.0, 0.75 - 0.65 * t, 0.0);
  }
}

// =========================================================================
// Procedural Three.js 3D Engine Builder Helpers
// =========================================================================

function buildPedestal(scene: THREE.Scene) {
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(7.6, 7.8, 0.18, 96),
    new THREE.MeshStandardMaterial({ color: 0x080c14, metalness: 0.65, roughness: 0.55 })
  );
  platform.position.set(0.3, -2.85, 0);
  platform.receiveShadow = true;
  scene.add(platform);

  for (const [r, o] of [[3.2, 0.28], [5.2, 0.18], [7.2, 0.12]] as [number, number][]) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r, r + 0.035, 128),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: o, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0.3, -2.75, 0);
    scene.add(ring);
  }

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(32, 32), new THREE.ShadowMaterial({ opacity: 0.5 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0.3, -2.75, 0);
  shadow.receiveShadow = true;
  scene.add(shadow);
}

function buildEngine(root: THREE.Group, clipPlane: THREE.Plane) {
  const parts: Record<string, { mats: THREE.MeshStandardMaterial[]; anchor: THREE.Object3D | null; normal: THREE.Vector3; meshes: THREE.Mesh[] }> = {};
  PART_ORDER.forEach((key) => {
    parts[key] = { mats: [], anchor: null, normal: new THREE.Vector3(0, 1, 0), meshes: [] };
  });

  const pickables: THREE.Mesh[] = [];
  const xrayMats: [THREE.MeshStandardMaterial, number][] = [];
  const assemblies: { group: THREE.Group; dir: THREE.Vector3 }[] = [];

  const matFactory = (partKey: string | null, params: THREE.MeshStandardMaterialParameters, flags: Record<string, any> = {}) => {
    const m = new THREE.MeshStandardMaterial({
      envMapIntensity: 1.1,
      clippingPlanes: [clipPlane],
      clipShadows: true,
      ...params,
    });
    m.userData = { origColor: m.color.clone(), ...flags };
    if (partKey && parts[partKey]) {
      parts[partKey].mats.push(m);
    }
    return m;
  };

  const mesh = (
    geom: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D,
    partKey: string | null,
    opts: { pos?: [number, number, number]; rot?: [number, number, number]; cast?: boolean } = {}
  ) => {
    const m = new THREE.Mesh(geom, material);
    if (opts.pos) m.position.set(...opts.pos);
    if (opts.rot) m.rotation.set(...opts.rot);
    m.castShadow = opts.cast !== false;
    m.receiveShadow = true;
    if (partKey) {
      m.userData.partKey = partKey;
      pickables.push(m);
      parts[partKey].meshes.push(m);
    }
    parent.add(m);
    return m;
  };

  const assembly = (name: string, explodeVec: [number, number, number], partKey: string) => {
    const g = new THREE.Group();
    g.name = name;
    root.add(g);
    assemblies.push({ group: g, dir: new THREE.Vector3(...explodeVec) });
    g.userData.partKey = partKey;
    return g;
  };

  const anchorOn = (partKey: string, group: THREE.Object3D, pos: [number, number, number], normal: [number, number, number]) => {
    const a = new THREE.Object3D();
    a.position.set(...pos);
    group.add(a);
    parts[partKey].anchor = a;
    parts[partKey].normal.set(...normal).normalize();
  };

  // Base Aerospace Materials
  const alu = { color: 0xa9afb8, metalness: 0.92, roughness: 0.32 };
  const darkAlu = { color: 0x3d434d, metalness: 0.88, roughness: 0.4 };
  const darkAluM = new THREE.MeshStandardMaterial({ ...darkAlu, clippingPlanes: [clipPlane] });
  const chromeM = new THREE.MeshStandardMaterial({ color: 0xd4d8de, metalness: 1, roughness: 0.12, clippingPlanes: [clipPlane] });
  const redM = new THREE.MeshStandardMaterial({ color: 0xc41e1e, roughness: 0.45, metalness: 0.1, clippingPlanes: [clipPlane] });
  const rubberM = new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.85, metalness: 0, clippingPlanes: [clipPlane] });
  const steelM = new THREE.MeshStandardMaterial({ color: 0x8a8f98, metalness: 1, roughness: 0.28, clippingPlanes: [clipPlane] });
  const oilOrangeM = new THREE.MeshStandardMaterial({ color: 0xd98a1f, metalness: 0.4, roughness: 0.5, clippingPlanes: [clipPlane] });

  // Aerospace Anodized -AN Fittings (-AN6 / -AN8 Blue & Red)
  const anBlueM = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.9, roughness: 0.2, clippingPlanes: [clipPlane] });
  const anRedM = new THREE.MeshStandardMaterial({ color: 0xd92626, metalness: 0.9, roughness: 0.2, clippingPlanes: [clipPlane] });

  // 1. Crankcase & Engine Mounts (vibration)
  const caseMat = matFactory('vibration', { ...alu, color: 0x9ba1ab });
  xrayMats.push([caseMat, 0.18]);
  const caseSeamMat = matFactory('vibration', { color: 0x0c0d10, metalness: 0.4, roughness: 0.7 });
  const caseGroup = assembly('crankcase', [0, 0, 0], 'vibration');
  const halves: { group: THREE.Group; side: number }[] = [];

  for (const side of [1, -1]) {
    const h = new THREE.Group();
    caseGroup.add(h);
    halves.push({ group: h, side });
    mesh(new RoundedBoxGeometry(3.9, 1.15, 0.5, 4, 0.1), caseMat, h, 'vibration', { pos: [-0.05, 0, side * 0.25] });

    for (const sx of STATION_X) {
      mesh(new RoundedBoxGeometry(0.82, 1.0, 0.16, 3, 0.05), caseMat, h, 'vibration', { pos: [sx + side * BOXER_OFFSET, 0, side * 0.55] });
    }
    for (let i = 0; i < 9; i++) {
      for (const y of [0.5, -0.5]) {
        mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.04, 10), steelM, h, null, { pos: [-1.8 + i * 0.44, y, side * 0.5], rot: [Math.PI / 2, 0, 0], cast: false });
      }
    }
    // Dynafocal rubber engine isolation vibration mounts
    for (const my of [0.38, -0.38]) {
      mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.2, 16), rubberM, h, null, { pos: [-1.95, my, side * 0.52], rot: [Math.PI / 2, 0, 0] });
      mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 12), steelM, h, null, { pos: [-1.95, my, side * 0.52], rot: [Math.PI / 2, 0, 0] });
    }
  }
  mesh(new THREE.BoxGeometry(3.86, 1.0, 0.012), caseSeamMat, caseGroup, 'vibration', { cast: false, pos: [-0.05, 0, 0] });

  // Rear Accessory Case & Dual Magnetos
  const acc = assembly('accessory', [-1.6, 0, 0], 'vibration');
  mesh(new RoundedBoxGeometry(0.55, 1.0, 0.95, 4, 0.08), caseMat, acc, 'vibration', { pos: [-2.28, 0, 0] });
  const magMat = matFactory('vibration', { ...darkAlu, color: 0x1b1c20 });
  const magTerminals: THREE.Vector3[] = [];

  for (const side of [1, -1]) {
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 28), magMat, acc, 'vibration', { pos: [-2.72, 0.22, side * 0.31], rot: [0, 0, Math.PI / 2] });
    mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.06, 28), steelM, acc, 'vibration', { pos: [-2.5, 0.22, side * 0.31], rot: [0, 0, Math.PI / 2] });
    mesh(new RoundedBoxGeometry(0.18, 0.2, 0.26, 2, 0.03), rubberM, acc, null, { pos: [-2.86, 0.4, side * 0.31] });
    magTerminals.push(new THREE.Vector3(-2.86, 0.52, side * 0.31));
  }

  // Starter Motor on Flywheel Housing
  mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.65, 28), darkAluM, acc, 'vibration', { pos: [-2.45, -0.65, 0.38], rot: [0, 0, Math.PI / 2] });
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.38, 20), steelM, acc, null, { pos: [-2.45, -0.42, 0.44], rot: [0, 0, Math.PI / 2] }); // Starter Solenoid
  anchorOn('vibration', caseGroup, [-0.1, 0.62, 0.3], [0, 1, 0]);

  // Nose casting behind propeller flange
  const noseMat = matFactory('vibration', { ...alu, color: 0x8f959e });
  mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.3, 40), noseMat, caseGroup, 'vibration', { pos: [2.05, 0, 0], rot: [0, 0, Math.PI / 2] });

  // 2. Oil Sump & Scavenge System (oilPressure)
  const sumpMat = matFactory('oilPressure', { ...alu, color: 0x8d939d });
  const sump = assembly('sump', [0, -1.2, 0], 'oilPressure');
  mesh(new RoundedBoxGeometry(3.2, 0.5, 1.0, 4, 0.09), sumpMat, sump, 'oilPressure', { pos: [-0.25, -0.8, 0] });
  for (let i = 0; i < 9; i++) {
    mesh(new RoundedBoxGeometry(0.035, 0.32, 1.08, 1, 0.012), sumpMat, sump, 'oilPressure', { pos: [-1.65 + i * 0.4, -0.84, 0] });
  }
  mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.1, 6), steelM, sump, null, { pos: [-0.9, -1.09, 0] });
  const filterMat = matFactory('oilPressure', { color: 0x1c3a63, metalness: 0.5, roughness: 0.45 });
  mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.44, 28), filterMat, sump, 'oilPressure', { pos: [-2.72, -0.32, -0.28], rot: [0, 0, Math.PI / 2] });
  mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.06, 28), steelM, sump, 'oilPressure', { pos: [-2.5, -0.32, -0.28], rot: [0, 0, Math.PI / 2] });

  // Anodized -AN Hex Fittings at oil filter & drain
  mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 6), anBlueM, sump, null, { pos: [-2.4, -0.32, -0.28], rot: [0, 0, Math.PI / 2] });
  mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.05, 6), anRedM, sump, null, { pos: [-2.33, -0.32, -0.28], rot: [0, 0, Math.PI / 2] });
  mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.9, 10), chromeM, sump, null, { pos: [0.75, -0.3, 0.55], rot: [0.14, 0, 0.08], cast: false });
  mesh(new THREE.SphereGeometry(0.06, 12, 12), oilOrangeM, sump, null, { pos: [0.77, 0.14, 0.62] });
  anchorOn('oilPressure', sump, [-0.6, -1.06, 0.42], [0, -0.5, 1]);

  // 3. Oil Cooler & Braided Aerospace Lines (oilTemp)
  const coolerMat = matFactory('oilTemp', { color: 0x22262d, metalness: 0.75, roughness: 0.38 });
  const coolerFinMat = matFactory('oilTemp', { color: 0xb9bec7, metalness: 0.9, roughness: 0.35 });
  const cooler = assembly('cooler', [1.4, -0.2, -1.15], 'oilTemp');
  const cc: [number, number, number] = [1.9, -0.6, -1.05];
  mesh(new RoundedBoxGeometry(0.2, 0.9, 0.9, 3, 0.04), coolerMat, cooler, 'oilTemp', { pos: cc });
  for (let i = 0; i < 16; i++) {
    mesh(new THREE.BoxGeometry(0.24, 0.014, 0.78), coolerFinMat, cooler, 'oilTemp', { pos: [cc[0] + 0.02, cc[1] - 0.38 + i * 0.05, cc[2]], cast: false });
  }

  // Braided stainless oil hoses with dual -AN blue & red collar couplings
  const hoseGeo = (pts: number[][], r: number) =>
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 32, r, 10, false);
  const oilHoseA = [[1.3, -0.75, -0.45], [1.6, -0.85, -0.7], [1.75, -0.85, -0.95], [1.85, -0.98, -1.2]];
  const oilHoseB = [[1.25, -0.6, -0.5], [1.55, -0.45, -0.72], [1.72, -0.35, -0.95], [1.85, -0.25, -1.2]];
  mesh(hoseGeo(oilHoseA, 0.055), rubberM, cooler, 'oilTemp');
  mesh(hoseGeo(oilHoseB, 0.055), rubberM, cooler, 'oilTemp');
  mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.08, 6), anBlueM, cooler, null, { pos: [1.85, -0.98, -1.14], rot: [0, 0, Math.PI / 2] });
  mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.08, 6), anRedM, cooler, null, { pos: [1.85, -0.25, -1.14], rot: [0, 0, Math.PI / 2] });
  anchorOn('oilTemp', cooler, [2.0, -0.6, -1.05], [1, 0, -0.6]);

  // 4. Alternator & Electrical Drive (batteryVoltage)
  const altMat = matFactory('batteryVoltage', { ...darkAlu, color: 0x1a1c22 });
  const altCapMat = matFactory('batteryVoltage', { ...alu, color: 0x8e949e });
  const alt = assembly('alternator', [1.2, -0.8, 0], 'batteryVoltage');
  mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.5, 36), altMat, alt, 'batteryVoltage', { pos: [1.85, -0.92, 0], rot: [0, 0, Math.PI / 2] });
  mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.06, 36), altCapMat, alt, 'batteryVoltage', { pos: [2.12, -0.92, 0], rot: [0, 0, Math.PI / 2] });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    mesh(new THREE.BoxGeometry(0.38, 0.03, 0.02), altCapMat, alt, null, {
      pos: [1.78, -0.92 + Math.sin(a) * 0.262, Math.cos(a) * 0.262],
      rot: [-a + Math.PI / 2, 0, 0],
      cast: false,
    });
  }
  const altPulley = new THREE.Group();
  altPulley.position.set(2.26, -0.92, 0);
  alt.add(altPulley);
  mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 32), steelM, altPulley, 'batteryVoltage', { rot: [0, 0, Math.PI / 2] });
  mesh(new THREE.BoxGeometry(0.1, 0.07, 0.04), redM, altPulley, null, { pos: [0, 0.16, 0], cast: false });

  // Heavy duty ribbed belt
  const beltMat = matFactory('batteryVoltage', { color: 0x08090b, roughness: 0.9, metalness: 0 });
  for (const side of [1, -1]) {
    const a = new THREE.Vector3(2.26, 0, side * 0.5);
    const b = new THREE.Vector3(2.26, -0.92, side * 0.2);
    const len = a.distanceTo(b);
    const belt = mesh(new THREE.BoxGeometry(0.09, len, 0.025), beltMat, alt, null, { cast: false });
    belt.position.copy(a).add(b).multiplyScalar(0.5);
    belt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  }
  anchorOn('batteryVoltage', alt, [1.85, -1.2, 0.05], [0, -1, 0.3]);

  // 5. Cylinders, Heads & Working Poppet Valves (cht)
  const barrelMat = matFactory('cht', { color: 0x22252a, metalness: 0.75, roughness: 0.4 }, { thermal: 0.95 });
  const finMat = matFactory('cht', { color: 0x2a2e34, metalness: 0.78, roughness: 0.36 }, { thermal: 1 });
  const headMat = matFactory('cht', { color: 0x181a1e, metalness: 0.8, roughness: 0.38 }, { thermal: 1 });
  const coverMat = matFactory('cht', { color: 0xe2e6ec, metalness: 0.88, roughness: 0.22 }, { statusGain: 1.2 });
  const valveSpringMat = matFactory('cht', { color: 0xd1d5db, metalness: 0.95, roughness: 0.2 });
  xrayMats.push([barrelMat, 0.2], [finMat, 0.22], [headMat, 0.3]);

  const cylinders: {
    station: number;
    side: number;
    xc: number;
    asm: THREE.Group;
    flash: THREE.Mesh;
    flashMat: THREE.MeshBasicMaterial;
    intakeValve: THREE.Group;
    exhaustValve: THREE.Group;
    ex: THREE.Object3D;
    inl: THREE.Object3D;
    beta?: number;
    pinAng?: number;
  }[] = [];

  // Spark plug ceramic white insulator material
  const ceramicPlugMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15, metalness: 0.1, clippingPlanes: [clipPlane] });

  STATION_X.forEach((sx, station) => {
    for (const side of [1, -1]) {
      const xc = sx + side * BOXER_OFFSET;
      const asm = assembly(`cyl-${station}-${side}`, [0, 0, side * 1.2], 'cht');
      const holder = new THREE.Group();
      holder.position.set(xc, 0, 0);
      holder.rotation.x = side * (Math.PI / 2);
      asm.add(holder);

      const inner = new THREE.Group();
      inner.scale.z = side;
      holder.add(inner);

      // Barrel & cooling fins
      mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.78, 36), barrelMat, inner, 'cht', { pos: [0, 0.94, 0] });
      for (let i = 0; i < 7; i++) {
        mesh(new THREE.CylinderGeometry(0.375 - i * 0.004, 0.375 - i * 0.004, 0.03, 36), finMat, inner, 'cht', { pos: [0, 0.62 + i * 0.095, 0] });
      }

      // CNC Cylinder head & head fins
      mesh(new RoundedBoxGeometry(0.8, 0.52, 0.68, 4, 0.07), headMat, inner, 'cht', { pos: [0, 1.58, 0] });
      for (let i = 0; i < 6; i++) {
        mesh(new RoundedBoxGeometry(0.9, 0.028, 0.76, 1, 0.012), finMat, inner, 'cht', { pos: [0, 1.36 + i * 0.096, 0], cast: false });
      }

      // Rocker cover
      mesh(new RoundedBoxGeometry(0.64, 0.17, 0.52, 4, 0.06), coverMat, inner, 'cht', { pos: [0, 1.93, 0] });
      for (const bx of [-0.24, 0.24]) {
        for (const bz of [-0.18, 0.18]) {
          mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 10), steelM, inner, null, { pos: [bx, 2.02, bz], cast: false });
        }
      }

      // Dual Spark Plugs (Dual Aviation Ignition System)
      for (const pAngle of [-0.18, 0.18]) {
        const plug = new THREE.Group();
        plug.position.set(0.48, 1.58, pAngle);
        plug.rotation.z = Math.PI / 2;
        inner.add(plug);
        mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 6), steelM, plug, null); // Hex base
        mesh(new THREE.CylinderGeometry(0.042, 0.045, 0.14, 16), ceramicPlugMat, plug, null, { pos: [0, 0.1, 0] }); // Ceramic body
        mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.06, 10), chromeM, plug, null, { pos: [0, 0.2, 0] }); // Stud terminal
        mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.18, 16), rubberM, plug, null, { pos: [0, 0.24, 0] }); // Silicone boot
      }

      // Dynamic Valvetrain: Intake & Exhaust Poppet Valves with Springs
      const buildPoppetValve = (xOff: number) => {
        const vGroup = new THREE.Group();
        vGroup.position.set(xOff, 1.58, 0.1);
        inner.add(vGroup);
        // Stem and disc face
        mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 12), steelM, vGroup, null, { pos: [0, 0, 0] });
        mesh(new THREE.CylinderGeometry(0.12, 0.03, 0.05, 20), steelM, vGroup, null, { pos: [0, -0.21, 0] }); // Valve face
        // Valve spring coils
        for (let s = 0; s < 5; s++) {
          mesh(new THREE.TorusGeometry(0.055, 0.014, 8, 20), valveSpringMat, vGroup, null, {
            pos: [0, 0.05 + s * 0.045, 0],
            rot: [Math.PI / 2, 0, 0],
            cast: false,
          });
        }
        return vGroup;
      };

      const intakeValve = buildPoppetValve(0.16);
      const exhaustValve = buildPoppetValve(-0.16);

      // Pushrod tubes
      for (const px of [-0.16, 0.16]) {
        mesh(new THREE.CylinderGeometry(0.024, 0.024, 1.3, 10), chromeM, inner, null, { pos: [px, 1.2, -0.42], cast: false });
      }

      // Exhaust and intake port flanges
      const ex = new THREE.Object3D();
      ex.position.set(-0.2, 1.62, 0.4);
      inner.add(ex);

      const inl = new THREE.Object3D();
      inl.position.set(0.2, 1.62, 0.4);
      inner.add(inl);

      mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 24), chromeM, inner, null, { pos: [-0.2, 1.62, 0.4], rot: [Math.PI / 2, 0, 0], cast: false });
      mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 24), steelM, inner, null, { pos: [0.2, 1.62, 0.4], rot: [Math.PI / 2, 0, 0], cast: false });

      // Internal combustion flame wavefront
      const flashMat = new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      const flash = mesh(new THREE.SphereGeometry(0.26, 18, 18), flashMat, inner, null, { pos: [0, 1.32, 0], cast: false });
      flash.visible = false;

      cylinders.push({ station, side, xc, asm, flash, flashMat, intakeValve, exhaustValve, ex, inl });
    }
  });
  anchorOn('cht', cylinders[2].asm, [cylinders[2].xc, 0.1, 2.08], [0, 0.15, 1]);

  // 6. Crankshaft, Pistons with Rings, Connecting Rods, Propeller (rpm)
  const rotMat = matFactory('rpm', { color: 0x70757e, metalness: 1, roughness: 0.28 });
  const crankMat = matFactory('rpm', { color: 0x9aa0a9, metalness: 1, roughness: 0.22 });
  const spinnerMat = matFactory('rpm', { color: 0xdfe3e8, metalness: 1, roughness: 0.1 });
  const bladeMat = matFactory('rpm', { color: 0xffffff, metalness: 0.35, roughness: 0.42, vertexColors: true, side: THREE.DoubleSide });
  const pistonMat = matFactory('rpm', { color: 0xb8bcc4, metalness: 0.9, roughness: 0.3 });
  const rodMat = matFactory('rpm', { color: 0x8e939c, metalness: 1, roughness: 0.25 });
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x22262d, metalness: 0.95, roughness: 0.2, clippingPlanes: [clipPlane] });

  const crank = assembly('crank', [0, 0, 0], 'rpm');
  const rot = new THREE.Group();
  crank.add(rot);
  mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.2, 24), rotMat, rot, 'rpm', { pos: [-0.2, 0, 0], rot: [0, 0, Math.PI / 2] });

  cylinders.forEach((c) => {
    const beta = THROW_ANGLE[c.station];
    const pinAng = c.side === 1 ? beta : beta + Math.PI;
    c.beta = beta;
    c.pinAng = pinAng;

    for (const dx of [-0.09, 0.09]) {
      mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.06, 32), crankMat, rot, 'rpm', { pos: [c.xc + dx, 0, 0], rot: [0, 0, Math.PI / 2] });
    }
    const cw = new THREE.CylinderGeometry(0.3, 0.3, 0.07, 32, 1, false, pinAng + Math.PI / 2, Math.PI);
    cw.rotateZ(Math.PI / 2);
    mesh(cw, crankMat, rot, 'rpm', { pos: [c.xc + 0.09, 0, 0] });
    mesh(new THREE.CylinderGeometry(CRANK_PLANE_PIN_HALF, CRANK_PLANE_PIN_HALF, 0.2, 16), crankMat, rot, 'rpm', {
      pos: [c.xc, THROW_R * Math.sin(pinAng), THROW_R * Math.cos(pinAng)],
      rot: [0, 0, Math.PI / 2],
    });
  });

  // Pistons with 3 Machined Piston Rings & Wrist Pins
  const pistons = cylinders.map((c) => {
    const g = new THREE.Group();
    root.add(g);
    const dir = new THREE.Vector3(0, 0, c.side);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    mesh(new THREE.CylinderGeometry(0.265, 0.265, 0.3, 32), pistonMat, g, 'rpm', { pos: [0, 0.06, 0] });

    // Top compression ring, second scraper ring, oil control ring
    for (const y of [0.13, 0.19, 0.25]) {
      mesh(new THREE.CylinderGeometry(0.272, 0.272, 0.014, 32), ringMat, g, null, { pos: [0, y, 0], cast: false });
    }
    mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.5, 16), steelM, g, null, { rot: [0, 0, Math.PI / 2], cast: false });
    const rod = mesh(new THREE.CylinderGeometry(0.038, 0.06, ROD_L, 16), rodMat, root, 'rpm');
    const bigEnd = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 20), rodMat, root, null, { cast: false });
    bigEnd.rotation.z = Math.PI / 2;
    return { c, g, rod, bigEnd, dir };
  });

  // Propeller, Machined Hub & Pitch Governor Spinner
  mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 40), rotMat, rot, 'rpm', { pos: [2.24, 0, 0], rot: [0, 0, Math.PI / 2] });
  mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.13, 48), crankMat, rot, 'rpm', { pos: [2.38, 0, 0], rot: [0, 0, Math.PI / 2] });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 10), steelM, rot, null, {
      pos: [2.46, Math.sin(a) * 0.5, Math.cos(a) * 0.5],
      rot: [0, 0, Math.PI / 2],
      cast: false,
    });
  }

  const spinnerProfile: THREE.Vector2[] = [];
  const SP_LEN = 1.55;
  for (let i = 0; i <= 28; i++) {
    const u = i / 28;
    const r = 0.66 * Math.sqrt(Math.max(0, 1 - Math.pow(u, 1.7))) * (1 - 0.05 * u);
    spinnerProfile.push(new THREE.Vector2(Math.max(r, 0.001), u * SP_LEN));
  }
  mesh(new THREE.LatheGeometry(spinnerProfile, 56), spinnerMat, rot, 'rpm', { pos: [2.45, 0, 0], rot: [0, 0, -Math.PI / 2] });

  const blades = new THREE.Group();
  rot.add(blades);
  blades.position.set(2.86, 0, 0);
  for (const flip of [1, -1]) {
    const b = mesh(bladeGeometry(), bladeMat, blades, 'rpm');
    b.rotation.x = flip === 1 ? 0 : Math.PI;
  }

  // Motion blur disc
  const discMat = new THREE.MeshBasicMaterial({ color: 0x9db4d6, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(3.05, 64), discMat);
  disc.rotation.y = Math.PI / 2;
  disc.position.set(2.86, 0, 0);
  root.add(disc);
  anchorOn('rpm', crank, [3.3, 0.5, 0], [1, 0.3, 0.3]);

  // 7. Forced Induction: Turbocharger & Intercooler Duct (manifoldPressure)
  const plenumMat = matFactory('manifoldPressure', { color: 0x7d8590, metalness: 0.95, roughness: 0.28 });
  const turboCompMat = matFactory('manifoldPressure', { color: 0xc8ccd4, metalness: 0.95, roughness: 0.2 });
  const intake = assembly('intake', [0, -1.4, 0], 'manifoldPressure');

  // Intake Plenum
  mesh(new THREE.CylinderGeometry(0.13, 0.13, 3.1, 28), plenumMat, intake, 'manifoldPressure', { pos: [-0.05, -1.22, 0], rot: [0, 0, Math.PI / 2] });
  const intakeCurves: THREE.CatmullRomCurve3[] = [];

  cylinders.forEach((c) => {
    const s = c.side;
    const pts = [
      [c.xc, -1.22, s * 0.05],
      [c.xc + 0.03, -1.26, s * 0.7],
      [c.xc + 0.2, -0.9, s * 1.4],
      [c.xc + 0.2, -0.42, s * 1.62],
    ].map((p) => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(pts);
    intakeCurves.push(curve);
    mesh(new THREE.TubeGeometry(curve, 28, 0.075, 14, false), plenumMat, intake, 'manifoldPressure');
  });

  // Turbocharger Assembly on Intake/Exhaust junction
  const turboGroup = new THREE.Group();
  turboGroup.position.set(-2.6, -1.15, -0.95);
  intake.add(turboGroup);

  // Compressor scroll
  mesh(new THREE.TorusGeometry(0.24, 0.09, 16, 32), turboCompMat, turboGroup, 'manifoldPressure', { rot: [0, Math.PI / 2, 0] });
  mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.28, 24), turboCompMat, turboGroup, 'manifoldPressure', { pos: [0.15, 0, 0], rot: [0, 0, Math.PI / 2] });
  // Turbo boost crossover pipe to intake plenum
  const boostPipePts = [
    new THREE.Vector3(-2.45, -1.15, -0.95),
    new THREE.Vector3(-2.1, -1.22, -0.65),
    new THREE.Vector3(-1.6, -1.22, 0),
  ];
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(boostPipePts), 24, 0.09, 16, false), turboCompMat, intake, 'manifoldPressure');

  // Wastegate Actuator Canister & Linkage Arm
  mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 16), steelM, turboGroup, null, { pos: [0, 0.26, -0.15], rot: [0, 0, Math.PI / 2] });
  mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.26, 8), steelM, turboGroup, null, { pos: [-0.08, 0.16, -0.1], rot: [0.4, 0, 0] });
  anchorOn('manifoldPressure', intake, [-0.05, -1.36, 0.16], [0, -1, 0.4]);

  // 8. Electronic Fuel Injection Rail & Servo (fuelFlow)
  const servoMat = matFactory('fuelFlow', { color: 0x3b3f46, metalness: 0.85, roughness: 0.35 });
  const fuelLineMat = matFactory('fuelFlow', { color: 0xd4d8de, metalness: 1, roughness: 0.14 });
  const filtMat = matFactory('fuelFlow', { color: 0xc8ccd2, metalness: 0.95, roughness: 0.22 });
  const fuel = assembly('fuel', [0.4, -1.6, 0], 'fuelFlow');

  mesh(new RoundedBoxGeometry(0.7, 0.32, 0.55, 3, 0.06), servoMat, fuel, 'fuelFlow', { pos: [-0.05, -1.62, 0] });
  mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.3, 24), servoMat, fuel, 'fuelFlow', { pos: [-0.05, -1.38, 0] });
  mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.1, 28), filtMat, fuel, 'fuelFlow', { pos: [0.85, -1.62, 0], rot: [0, 0, Math.PI / 2] });
  mesh(new THREE.CylinderGeometry(0.31, 0.27, 0.16, 28), servoMat, fuel, 'fuelFlow', { pos: [1.46, -1.62, 0], rot: [0, 0, Math.PI / 2] });

  // Electronic Fuel Injectors mounted at each intake port runner
  cylinders.forEach((c) => {
    const s = c.side;
    const inj = new THREE.Group();
    inj.position.set(c.xc + 0.2, -0.65, s * 1.55);
    inj.rotation.x = s * 0.4;
    fuel.add(inj);
    mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 12), steelM, inj, 'fuelFlow');
    mesh(new THREE.BoxGeometry(0.06, 0.07, 0.06), darkAluM, inj, 'fuelFlow', { pos: [0, 0.09, 0] }); // Connector
  });

  const fuelPts = [[-0.05, -1.62, 0.4], [-0.6, -1.78, 0.95], [-1.9, -1.5, 1.05], [-2.8, -0.9, 0.95], [-3.0, -0.3, 0.7]];
  const fuelCurve = new THREE.CatmullRomCurve3(fuelPts.map((p) => new THREE.Vector3(...p)));
  mesh(new THREE.TubeGeometry(fuelCurve, 50, 0.04, 10, false), fuelLineMat, fuel, 'fuelFlow');
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 6), anBlueM, fuel, null, { pos: [-0.05, -1.62, 0.4] });
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 6), anRedM, fuel, null, { pos: [-3.0, -0.3, 0.7], rot: [0, 0, Math.PI / 2] });
  anchorOn('fuelFlow', fuel, [0.85, -1.9, 0.1], [0, -1, 0.3]);

  // 9. Titanium/Stainless Exhaust System with Heat Temper Colors & Turbo Turbine (egt)
  const exMat = matFactory('egt', { color: 0xcdd2d8, metalness: 1, roughness: 0.2 }, { thermal: 1.25 });
  const exCollMat = matFactory('egt', { color: 0xb9bec6, metalness: 1, roughness: 0.22 }, { thermal: 1.25 });
  const exhaust = assembly('exhaust', [-1.3, -1.0, 0], 'egt');
  const exhaustCurves: THREE.CatmullRomCurve3[] = [];
  root.updateMatrixWorld(true);

  // Titanium heat temper discoloration ring materials (Straw Gold -> Violet -> Heat Blue)
  const temperGoldM = new THREE.MeshStandardMaterial({ color: 0xd4a359, metalness: 0.95, roughness: 0.25, clippingPlanes: [clipPlane] });
  const temperBlueM = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.95, roughness: 0.25, clippingPlanes: [clipPlane] });

  const exhaustByBank: Record<number, number[]> = { 1: [], [-1]: [] };
  cylinders.forEach((c) => {
    const s = c.side;
    const p0 = c.ex.getWorldPosition(new THREE.Vector3());
    const endX = c.xc - 0.55;
    const pts = [
      p0.clone(),
      new THREE.Vector3(p0.x - 0.04, p0.y - 0.35, s * 1.86),
      new THREE.Vector3(p0.x - 0.3, -1.0, s * 1.95),
      new THREE.Vector3(endX, -1.0, s * 1.95),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    mesh(new THREE.TubeGeometry(curve, 30, 0.085, 14, false), exMat, exhaust, 'egt');

    // Heat temper color bands at each cylinder exhaust exit bend
    mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16), temperGoldM, exhaust, null, { pos: [p0.x - 0.04, p0.y - 0.2, s * 1.8] });
    mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.05, 16), temperBlueM, exhaust, null, { pos: [p0.x - 0.08, p0.y - 0.3, s * 1.84] });

    exhaustByBank[s].push(endX);
    exhaustCurves.push(new THREE.CatmullRomCurve3([...pts, new THREE.Vector3(-3.15, -1.0, s * 1.95)]));
  });

  for (const s of [1, -1]) {
    const startX = Math.max(...exhaustByBank[s]);
    const len = startX - -3.1;
    mesh(new THREE.CylinderGeometry(0.135, 0.135, len, 28), exCollMat, exhaust, 'egt', { pos: [startX - len / 2, -1.0, s * 1.95], rot: [0, 0, Math.PI / 2] });
    mesh(new THREE.CylinderGeometry(0.18, 0.135, 0.3, 28, 1, true), exCollMat, exhaust, 'egt', { pos: [-3.25, -1.0, s * 1.95], rot: [0, 0, Math.PI / 2] }).material.side = THREE.DoubleSide;
    mesh(new THREE.TorusGeometry(0.15, 0.02, 10, 28), steelM, exhaust, null, { pos: [startX - 0.3, -1.0, s * 1.95], rot: [0, Math.PI / 2, 0], cast: false });
  }

  // Turbo Exhaust Turbine Housing (Cast Iron Snail Scroll)
  const turbineMat = matFactory('egt', { color: 0x33373e, metalness: 0.8, roughness: 0.5 }, { thermal: 1.3 });
  mesh(new THREE.TorusGeometry(0.26, 0.1, 16, 32), turbineMat, exhaust, 'egt', { pos: [-2.6, -1.15, -1.18], rot: [0, Math.PI / 2, 0] });
  mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.32, 24), turbineMat, exhaust, 'egt', { pos: [-2.75, -1.15, -1.18], rot: [0, 0, Math.PI / 2] });
  anchorOn('egt', exhaust, [-1.6, -1.15, 1.95], [0, -0.4, 1]);

  // Ignition Harness Leads
  cylinders.forEach((c) => {
    const s = c.side;
    const b = new THREE.Vector3(c.xc + 0.6, 0, s * 1.5);
    const term = magTerminals[s === 1 ? 0 : 1];
    const pts = [
      b,
      new THREE.Vector3(b.x + 0.06, 0.32, s * 1.34),
      new THREE.Vector3(b.x - 0.1, 0.8, s * 1.0),
      new THREE.Vector3((b.x + term.x) / 2, 0.86, s * 0.62),
      new THREE.Vector3(term.x + 0.55, 0.78, s * 0.42),
      new THREE.Vector3(term.x + 0.1, 0.66, s * 0.32),
      term,
    ];
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 44, 0.017, 8, false), redM, root, null, { cast: false });
  });

  // X-Ray Transparency Mode
  const setXrayMode = (on: boolean) => {
    for (const [m, o] of xrayMats) {
      m.transparent = on;
      m.opacity = on ? o : 1;
      m.depthWrite = !on;
      m.needsUpdate = true;
    }
  };

  let lastXray = false;
  const tmpP = new THREE.Vector3();
  const tmpQ = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);

  function animate(theta: number, omega: number, explodeAmt: number, isXray: boolean, valvesActive: boolean) {
    if (lastXray !== isXray) {
      setXrayMode(isXray);
      lastXray = isXray;
    }

    rot.rotation.x = -theta;
    altPulley.rotation.x = -theta * 2.5;
    disc.material.opacity = Math.min(0.045, Math.max(0, (omega - 6) / 200)) * (1 - Math.min(1, explodeAmt * 2));

    // Explode disassembly vectors
    for (const a of assemblies) {
      a.group.position.copy(a.dir).multiplyScalar(explodeAmt);
    }
    for (const h of halves) {
      h.group.position.set(0, 0, h.side * explodeAmt * 0.75);
    }
    caseSeamMat.visible = explodeAmt < 0.05;

    // Kinematic Slider-Crank Equations, Poppet Valves & 4-stroke cycle
    for (const p of pistons) {
      const c = p.c;
      const phi = theta + (c.beta ?? 0);
      const s = THROW_R * Math.cos(phi) + Math.sqrt(ROD_L * ROD_L - THROW_R * THROW_R * Math.sin(phi) ** 2);
      p.g.position.set(c.xc, 0, c.side * s);

      const ang = theta + (c.pinAng ?? 0);
      tmpP.set(c.xc, THROW_R * Math.sin(ang), THROW_R * Math.cos(ang));
      tmpQ.set(c.xc, 0, c.side * s);

      p.rod.position.copy(tmpP).add(tmpQ).multiplyScalar(0.5);
      p.rod.quaternion.setFromUnitVectors(yAxis, tmpQ.clone().sub(tmpP).normalize());
      p.bigEnd.position.copy(tmpP);

      // Four-stroke timing angle (0 to 720 degrees)
      const cam = c.side === 1 ? 0 : 1;
      const psi = (((theta + (c.beta ?? 0) + cam * TAU) % (2 * TAU)) + 2 * TAU) % (2 * TAU);

      // 1. Combustion flame flash just after compression TDC
      const burn = psi < Math.PI ? Math.exp(-psi * 1.7) : 0;
      c.flash.visible = isXray;
      c.flashMat.opacity = isXray ? burn * 0.85 : 0;

      // 2. Poppet Valve Kinematics:
      // Intake valve opens during intake stroke (approx 540 deg to 720 deg)
      // Exhaust valve opens during exhaust stroke (approx 360 deg to 540 deg)
      if (valvesActive) {
        const intakeLift = psi > Math.PI * 1.5 ? Math.sin((psi - Math.PI * 1.5) * 2) * 0.09 : 0;
        const exhaustLift = psi > Math.PI * 0.8 && psi < Math.PI * 1.4 ? Math.sin(((psi - Math.PI * 0.8) / 0.6) * Math.PI) * 0.09 : 0;
        c.intakeValve.position.y = 1.58 - intakeLift;
        c.exhaustValve.position.y = 1.58 - exhaustLift;
      }
    }
  }

  // Generate Propeller Slipstream Helical Vortex Streamlines
  const propSlipstreamCurves: THREE.CatmullRomCurve3[] = [];
  for (let b = 0; b < 2; b++) {
    const slipPts: THREE.Vector3[] = [];
    const bOffset = b * Math.PI;
    for (let s = 0; s <= 24; s++) {
      const u = s / 24;
      const angle = bOffset - u * Math.PI * 3.5;
      const radius = 2.9 * (1 + u * 0.35);
      const x = 2.86 - u * 6.5;
      slipPts.push(new THREE.Vector3(x, Math.sin(angle) * radius, Math.cos(angle) * radius));
    }
    propSlipstreamCurves.push(new THREE.CatmullRomCurve3(slipPts));
  }

  return {
    parts,
    pickables,
    animate,
    cylinders,
    intakeCurves,
    exhaustCurves,
    propSlipstreamCurves,
    fuelCurve,
    oilCurves: [
      new THREE.CatmullRomCurve3(oilHoseA.map((p) => new THREE.Vector3(...p))),
      new THREE.CatmullRomCurve3(oilHoseB.map((p) => new THREE.Vector3(...p)).reverse()),
    ],
  };
}

function bladeGeometry() {
  const STATIONS = 16;
  const RING = 18;
  const R0 = 0.55;
  const R1 = 3.0;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];

  for (let i = 0; i < STATIONS; i++) {
    const u = i / (STATIONS - 1);
    const r = R0 + (R1 - R0) * u;
    const chord = 0.36 + 0.3 * Math.sin(Math.PI * Math.min(1, u * 1.15 + 0.1)) - 0.16 * u;
    const thick = chord * (0.17 - 0.09 * u);
    const twist = THREE.MathUtils.degToRad(38 - 32 * Math.pow(u, 0.8));
    const c = Math.cos(twist);
    const s = Math.sin(twist);

    for (let j = 0; j < RING; j++) {
      const a = (j / RING) * TAU;
      const along = Math.cos(a) * 0.5 * chord;
      const camber = Math.sin(a) * 0.5 * thick * (Math.sin(a) > 0 ? 1.25 : 0.7);
      pos.push(along * s + camber * c, r, along * c - camber * s);

      const tip = u > 0.94;
      col.push(tip ? 1 : 0.13, tip ? 0.72 : 0.14, tip ? 0.12 : 0.16);
    }
  }

  for (let i = 0; i < STATIONS - 1; i++) {
    for (let j = 0; j < RING; j++) {
      const a = i * RING + j;
      const b = i * RING + ((j + 1) % RING);
      idx.push(a, b, a + RING, b, b + RING, a + RING);
    }
  }

  const tipCenter = pos.length / 3;
  pos.push(0, R1 + 0.01, 0);
  col.push(1, 0.72, 0.12);

  for (let j = 0; j < RING; j++) {
    idx.push((STATIONS - 1) * RING + ((j + 1) % RING), (STATIONS - 1) * RING + j, tipCenter);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function buildFlows(
  _scene: THREE.Scene,
  engine: THREE.Group,
  model: {
    intakeCurves: THREE.CatmullRomCurve3[];
    exhaustCurves: THREE.CatmullRomCurve3[];
    propSlipstreamCurves: THREE.CatmullRomCurve3[];
    fuelCurve: THREE.CatmullRomCurve3;
    oilCurves: THREE.CatmullRomCurve3[];
  }
) {
  const groups: {
    pts: THREE.Points;
    geo: THREE.BufferGeometry;
    arr: Float32Array;
    curves: THREE.CatmullRomCurve3[];
    lens: number[];
    st: { c: number; u: number }[];
    count: number;
    speedFn: (d: any) => number;
    densityFn: (d: any) => number;
  }[] = [];

  const make = (
    curves: THREE.CatmullRomCurve3[],
    color: number,
    count: number,
    size: number,
    speedFn: (d: any) => number,
    densityFn: (d: any) => number
  ) => {
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));

    const mat = new THREE.PointsMaterial({
      color,
      size,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    engine.add(pts);

    const lens = curves.map((c) => c.getLength());
    const st = Array.from({ length: count }, () => ({
      c: Math.floor(Math.random() * curves.length),
      u: Math.random(),
    }));
    groups.push({ pts, geo, arr, curves, lens, st, count, speedFn, densityFn });
  };

  // 1. Intake air & turbo boost stream
  make(
    model.intakeCurves,
    0x38bdf8,
    280,
    0.075,
    (d) => 0.35 + (d.rpm / 5200) * 2.4,
    (d) => 0.25 + 0.75 * Math.min(1, d.manifoldPressure / 100)
  );

  // 2. High-temp combustion exhaust stream
  make(
    model.exhaustCurves,
    0xff8a3d,
    280,
    0.085,
    (d) => 0.4 + (d.rpm / 5200) * 2.8,
    (d) => 0.35 + 0.65 * Math.min(1, d.egt / 760)
  );

  // 3. Atomized fuel delivery spray
  make(
    [model.fuelCurve],
    0xfacc15,
    70,
    0.07,
    (d) => 0.15 + (d.fuelFlow / 18) * 1.0,
    (d) => 0.3 + 0.7 * Math.min(1, d.fuelFlow / 18)
  );

  // 4. Lubrication oil circuit
  make(
    model.oilCurves,
    0xfb923c,
    80,
    0.07,
    (d) => 0.1 + (d.oilPressure / 5.0) * 0.9,
    (d) => Math.min(1, 0.3 + d.oilPressure / 5.5)
  );

  // 5. Propeller Aerodynamic Helical Slipstream Vortex Streamlines
  make(
    model.propSlipstreamCurves,
    0x7dd3fc,
    140,
    0.09,
    (d) => 0.6 + (d.rpm / 5200) * 3.5,
    () => 0.85
  );

  const tmp = new THREE.Vector3();

  return {
    update(
      dt: number,
      st: {
        flow: boolean;
        explode: number;
        rpm: number;
        cht: number;
        egt: number;
        fuelFlow: number;
        oilPressure: number;
        manifoldPressure: number;
        slowRatio: number;
        isPaused: boolean;
      }
    ) {
      if (st.isPaused) return;

      for (const g of groups) {
        g.pts.visible = st.flow && st.explode < 0.05;
        if (!g.pts.visible) continue;

        const speed = (g.speedFn(st) / st.slowRatio) * 12;
        const dens = g.densityFn(st);

        for (let i = 0; i < g.count; i++) {
          const p = g.st[i];
          if (i / g.count > dens) {
            g.arr[i * 3 + 1] = -999;
            continue;
          }
          p.u += (speed * dt * 3.2) / g.lens[p.c];
          if (p.u >= 1) {
            p.u = 0;
            p.c = Math.floor(Math.random() * g.curves.length);
          }
          g.curves[p.c].getPointAt(p.u, tmp);
          g.arr[i * 3] = tmp.x;
          g.arr[i * 3 + 1] = tmp.y;
          g.arr[i * 3 + 2] = tmp.z;
        }
        g.geo.attributes.position.needsUpdate = true;
      }
    },
  };
}

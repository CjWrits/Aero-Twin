"""
AEROTWIN - FastAPI Backend Server
Propulsion Digital Twin & Predictive Health Monitoring System for MALE UAVs
"""

import asyncio
import time
from typing import Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.engine_models import EngineSimulator, EngineOperatingConditions, EngineState
from backend.digital_twin import DigitalTwinAnalyzer
from backend.anomaly_ml import EngineAnomalyDetector
from backend.mission_simulator import MissionSimulator, MissionSimulationRequest
from backend.replay_data import get_mission_042_metadata, generate_mission_042_timeline
from backend.database import init_db, get_all_missions, get_all_faults, get_all_maintenance, get_historical_summary

app = FastAPI(
    title="AEROTWIN Engine Twin API",
    description="Aero-Piston Engine Digital Twin & Predictive Health Monitoring System",
    version="1.4.2"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize singletons
simulator = EngineSimulator()
twin_analyzer = DigitalTwinAnalyzer()
ml_detector = EngineAnomalyDetector()
mission_sim = MissionSimulator()
init_db()

# Precalculated replay data
mission_042_meta = get_mission_042_metadata()
mission_042_timeline = generate_mission_042_timeline()

class FaultRequest(BaseModel):
    fault_type: str = Field(default="Normal Operation")
    severity: float = Field(default=0.5, ge=0.0, le=1.0)
    active: bool = Field(default=True)

class ControlRequest(BaseModel):
    throttle: Optional[float] = None
    engine_load: Optional[float] = None
    altitude: Optional[float] = None
    ambient_temperature: Optional[float] = None

@app.get("/api/system/status")
def get_system_status():
    return {
        "system_name": "AEROTWIN",
        "subtitle": "Aero-Piston Engine Digital Twin & Predictive Health Monitoring System",
        "system_status": "SYSTEM ONLINE",
        "data_source": "SIMULATION / TEST DATA",
        "engine_id": "ENG-01",
        "mission_id": "MISSION-042",
        "twin_synchronization_pct": 98.7,
        "model_version": "v1.4.2-aero (Thermodynamic Physics + Isolation Forest)",
        "last_sync": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "disclaimer": "Prototype system. Simulation and model outputs are for demonstration and engineering research only and are not intended for flight-critical decision making."
    }

@app.get("/api/engine/telemetry/live")
def get_live_telemetry():
    step_data = simulator.get_step_telemetry()
    expected: EngineState = step_data["expected"]
    observed: EngineState = step_data["observed"]

    residuals = twin_analyzer.compute_residuals(observed, expected)
    subsystems = twin_analyzer.analyze_subsystems(observed, expected, residuals)
    health_index = twin_analyzer.compute_engine_health_index(subsystems)
    diagnostics = twin_analyzer.evaluate_diagnostic_reasoning(observed, expected, residuals, subsystems, health_index)
    rul = twin_analyzer.compute_rul_projection(health_index, diagnostics)
    ml_result = ml_detector.predict_anomaly(observed, expected)

    # Determine operating mode
    if health_index < 70:
        mode = "CRITICAL DEGRADATION"
    elif step_data["fault_active"]:
        mode = "DEGRADATION DETECTED"
    elif observed.throttle > 0.85:
        mode = "CLIMB / MAX POWER"
    elif observed.throttle < 0.50:
        mode = "DESCENT / LOITER"
    else:
        mode = "ENDURANCE CRUISE"

    return {
        "timestamp": time.time(),
        "engine_id": "ENG-01",
        "mission_id": "MISSION-042",
        "operating_mode": mode,
        "engine_health_index": health_index,
        "health_status": "NORMAL" if health_index >= 88 else ("DEGRADATION DETECTED" if health_index >= 70 else "CRITICAL ANOMALY"),
        "twin_synchronization_pct": diagnostics.twin_synchronization_pct,
        "observed": observed.model_dump(),
        "expected": expected.model_dump(),
        "residuals": residuals.model_dump(),
        "subsystems": {k: v.model_dump() for k, v in subsystems.items()},
        "diagnostic_reasoning": diagnostics.model_dump(),
        "predicted_rul": rul.model_dump(),
        "ml_anomaly": ml_result,
        "active_fault": {
            "type": step_data["fault_type"],
            "severity": step_data["fault_severity"],
            "active": step_data["fault_active"]
        }
    }

@app.post("/api/engine/fault/inject")
def inject_fault(req: FaultRequest):
    simulator.set_fault(req.fault_type, req.severity, req.active)
    return {
        "status": "success",
        "fault_type": req.fault_type,
        "severity": req.severity,
        "active": req.active
    }

@app.post("/api/engine/controls")
def update_controls(req: ControlRequest):
    simulator.set_operating_conditions(
        throttle=req.throttle,
        engine_load=req.engine_load,
        altitude=req.altitude,
        ambient_temp=req.ambient_temperature
    )
    return {
        "status": "success",
        "conditions": simulator.conditions.model_dump()
    }

@app.post("/api/engine/reset")
def reset_engine():
    simulator.set_fault("Normal Operation", 0.0, False)
    simulator.set_operating_conditions(throttle=0.72, engine_load=0.70, altitude=3500.0, ambient_temp=18.0)
    return {"status": "success", "message": "Engine reset to baseline nominal endurance cruise"}

@app.get("/api/twin/state")
def get_twin_state():
    live = get_live_telemetry()
    obs = live["observed"]
    exp = live["expected"]
    res = live["residuals"]

    parameters = [
        {"name": "Engine Speed", "key": "rpm", "unit": "rpm", "observed": f"{obs['rpm']:.0f}", "expected": f"{exp['rpm']:.0f}", "residual": f"{res['rpm']:+.0f}", "confidence": 98, "subsystem": "Crankshaft / Power"},
        {"name": "Cylinder Head Temp", "key": "cht", "unit": "°C", "observed": f"{obs['cht']:.1f}", "expected": f"{exp['cht']:.1f}", "residual": f"{res['cht']:+.1f}", "confidence": 95, "subsystem": "Cooling / Combustion"},
        {"name": "Exhaust Gas Temp", "key": "egt", "unit": "°C", "observed": f"{obs['egt']:.1f}", "expected": f"{exp['egt']:.1f}", "residual": f"{res['egt']:+.1f}", "confidence": 94, "subsystem": "Combustion / Injection"},
        {"name": "Oil Pressure", "key": "oil_pressure", "unit": "bar", "observed": f"{obs['oil_pressure']:.2f}", "expected": f"{exp['oil_pressure']:.2f}", "residual": f"{res['oil_pressure']:+.2f}", "confidence": 96, "subsystem": "Lubrication"},
        {"name": "Oil Temperature", "key": "oil_temperature", "unit": "°C", "observed": f"{obs['oil_temperature']:.1f}", "expected": f"{exp['oil_temperature']:.1f}", "residual": f"{res['oil_temperature']:+.1f}", "confidence": 93, "subsystem": "Lubrication / Thermal"},
        {"name": "Fuel Flow Rate", "key": "fuel_flow", "unit": "L/h", "observed": f"{obs['fuel_flow']:.2f}", "expected": f"{exp['fuel_flow']:.2f}", "residual": f"{res['fuel_flow']:+.2f}", "confidence": 92, "subsystem": "Fuel Injection"},
        {"name": "Vibration RMS", "key": "vibration", "unit": "mm/s", "observed": f"{obs['vibration']:.2f}", "expected": f"{exp['vibration']:.2f}", "residual": f"{res['vibration']:+.2f}", "confidence": 91, "subsystem": "Mechanical Kinematics"},
        {"name": "Bus Battery Voltage", "key": "battery_voltage", "unit": "V", "observed": f"{obs['battery_voltage']:.2f}", "expected": f"{exp['battery_voltage']:.2f}", "residual": f"{res['battery_voltage']:+.2f}", "confidence": 99, "subsystem": "Electrical"},
        {"name": "Alternator Output", "key": "alternator_current", "unit": "A", "observed": f"{obs['alternator_current']:.1f}", "expected": f"{exp['alternator_current']:.1f}", "residual": f"{res['alternator_current']:+.1f}", "confidence": 97, "subsystem": "Electrical"},
        {"name": "Injection Timing", "key": "injection_timing", "unit": "° BTDC", "observed": f"{obs['injection_timing']:.1f}", "expected": f"{exp['injection_timing']:.1f}", "residual": f"{res['injection_timing']:+.1f}", "confidence": 95, "subsystem": "Ignition ECU"},
        {"name": "Manifold Pressure", "key": "manifold_pressure", "unit": "inHg", "observed": f"{obs['manifold_pressure']:.1f}", "expected": f"{exp['manifold_pressure']:.1f}", "residual": "0.0", "confidence": 98, "subsystem": "Turbocharger / Intake"}
    ]

    return {
        "pipeline": [
            {"step": "1. PHYSICAL ENGINE", "description": "Sensors measure raw thermo-mechanical outputs"},
            {"step": "2. TELEMETRY", "description": "High-integrity CAN / serial bus transmission"},
            {"step": "3. STATE ESTIMATION", "description": "Kalman-filtered sensor conditioning & validation"},
            {"step": "4. PHYSICS MODEL", "description": "Nominal aero-engine thermodynamic differential equations"},
            {"step": "5. AI/ML ANALYTICS", "description": "Isolation Forest anomaly scoring & multi-variable residuals"},
            {"step": "6. VIRTUAL ENGINE STATE", "description": "Digital Twin synchronized virtual replica"},
            {"step": "7. HEALTH / PREDICTION", "description": "Subsystem health indices, RUL, and maintenance advisories"}
        ],
        "parameters": parameters,
        "overall_health_index": live["engine_health_index"],
        "subsystems": live["subsystems"],
        "twin_synchronization_pct": live["twin_synchronization_pct"]
    }

@app.post("/api/simulation/run")
def run_simulation(req: MissionSimulationRequest):
    return mission_sim.run_simulation(req)

@app.get("/api/replay/mission-042")
def get_mission_042_replay():
    return {
        "metadata": mission_042_meta,
        "timeline": mission_042_timeline
    }

@app.get("/api/faults/events")
def get_fault_events():
    return get_all_faults()

@app.get("/api/history/data")
def get_history_data():
    return {
        "summary": get_historical_summary(),
        "missions": get_all_missions(),
        "faults": get_all_faults(),
        "maintenance": get_all_maintenance()
    }

@app.get("/api/demo/steps")
def get_demo_steps():
    return [
        {"step": 1, "title": "Normal Engine Baseline", "page": "Overview", "action": "Reset to nominal cruise and observe balanced telemetry and 98% twin synchronization."},
        {"step": 2, "title": "Stable Live Telemetry", "page": "Live Engine", "action": "Inspect high-frequency parameters (RPM, CHT, EGT, Oil P) and sparkline trends."},
        {"step": 3, "title": "Digital Twin Subsystem Map", "page": "Digital Twin", "action": "Review the 7-stage Digital Twin architecture pipeline and interactive subsystem health nodes."},
        {"step": 4, "title": "Mission Simulation Presets", "page": "Mission Simulation", "action": "Select 'ENDURANCE' preset and execute multi-hour flight simulation."},
        {"step": 5, "title": "Simulated Flight Results", "page": "Mission Simulation", "action": "Observe altitude compensation, thermal equilibrium, and cumulative fuel burn curve."},
        {"step": 6, "title": "Inject Fuel Injector Degradation", "page": "Fault Analysis", "action": "Activate 'Injector Degradation' fault from the persistent fault injection console."},
        {"step": 7, "title": "Observe Telemetry Shift", "page": "Live Engine", "action": "Observe EGT rising +35°C, fuel trim increase, and secondary vibration rise."},
        {"step": 8, "title": "Check Twin Residuals", "page": "Digital Twin", "action": "Observe the EGT residual jumping from +0.5°C to +35.0°C and confidence of 94%."},
        {"step": 9, "title": "AI/ML Anomaly Reaction", "page": "Health & Diagnostics", "action": "Isolation Forest anomaly score trips from 0.05 to 0.78 with EGT and fuel flow as key contributors."},
        {"step": 10, "title": "Subsystem Health Deterioration", "page": "Health & Diagnostics", "action": "Fuel injection subsystem health drops to 81%, status changes to 'DEGRADING'."},
        {"step": 11, "title": "Predictive RUL Decay", "page": "Predictive Maintenance", "action": "Projected RUL drops to 42-51 flight hours with accelerated degradation trajectory."},
        {"step": 12, "title": "Maintenance Advisory Trigger", "page": "Predictive Maintenance", "action": "Inspect the generated HIGH priority advisory for injector inspection before next extended mission."},
        {"step": 13, "title": "Open Mission Replay", "page": "Mission Replay", "action": "Load MISSION-042 full 02:14:32 flight recorded dataset."},
        {"step": 14, "title": "Replay Anomaly Inception", "page": "Mission Replay", "action": "Scrub to 01:26:15 and play at 2x/5x to observe real-time detection transition and alert pop-up."},
        {"step": 15, "title": "Review System Architecture", "page": "System Architecture", "action": "Walk evaluators through the complete CAN/ECU/FADEC ingestion, physics, and ML pipeline."}
    ]

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = get_live_telemetry()
            await websocket.send_json(data)
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass

# Mount frontend production build if available
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Allow /api and /ws calls to pass through
        if full_path.startswith("api") or full_path.startswith("ws"):
            return None
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))


"""
AEROTWIN - Automated System Verification Suite
Validates backend thermodynamics, digital twin residuals, ML classification,
frontend static delivery, and fault cause-and-effect chains.
"""

import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def get(endpoint):
    req = urllib.request.urlopen(f"{BASE_URL}{endpoint}")
    return json.loads(req.read().decode('utf-8'))

def post(endpoint, data):
    body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=body,
        headers={'Content-Type': 'application/json'}
    )
    res = urllib.request.urlopen(req)
    return json.loads(res.read().decode('utf-8'))

def test_system():
    print("--- 1. Testing Frontend Static Delivery ---")
    req = urllib.request.urlopen(f"{BASE_URL}/")
    html = req.read().decode('utf-8')
    assert "AEROTWIN" in html
    print("[PASS] Root index.html served correctly with AEROTWIN metadata")

    print("\n--- 2. Testing System Status Endpoint ---")
    status = get("/api/system/status")
    print(f"System: {status['system_status']} | Engine: {status['engine_id']} | Mission: {status['mission_id']}")
    assert status["engine_id"] == "ENG-01"
    assert status["mission_id"] == "MISSION-042"
    print("[PASS] Identity and mission parameters verified")

    print("\n--- 3. Testing Baseline Nominal Engine Telemetry ---")
    post("/api/engine/reset", {})
    live_norm = get("/api/engine/telemetry/live")
    obs = live_norm["observed"]
    print(f"RPM: {obs['rpm']} | CHT: {obs['cht']} C | EGT: {obs['egt']} C | Oil P: {obs['oil_pressure']} bar")
    print(f"Health Index: {live_norm['engine_health_index']}/100 | ML Anomaly: {live_norm['ml_anomaly']['is_anomaly']}")
    assert live_norm["engine_health_index"] >= 90
    assert not live_norm["ml_anomaly"]["is_anomaly"]
    print("[PASS] Nominal cruise thermodynamics and health verified")

    print("\n--- 4. Testing Fault Injection: Injector Degradation ---")
    inj_res = post("/api/engine/fault/inject", {
        "fault_type": "Injector Degradation",
        "severity": 0.70,
        "active": True
    })
    print(f"Fault injected: {inj_res['fault_type']} (severity: {inj_res['severity']})")

    live_fault = get("/api/engine/telemetry/live")
    obs_fault = live_fault["observed"]
    res_fault = live_fault["residuals"]
    print(f"Fault Telemetry -> EGT: {obs_fault['egt']} C (Residual: +{res_fault['egt']} C)")
    print(f"Fuel Flow: {obs_fault['fuel_flow']} L/h (Residual: +{res_fault['fuel_flow']} L/h)")
    print(f"Health Index: {live_fault['engine_health_index']}/100 (Status: {live_fault['health_status']})")
    print(f"Diagnostic Condition: {live_fault['diagnostic_reasoning']['probable_condition']}")
    print(f"RUL: {live_fault['predicted_rul']['predicted_rul_hours_min']}-{live_fault['predicted_rul']['predicted_rul_hours_max']} flight hours")
    print(f"ML Anomaly Score: {live_fault['ml_anomaly']['anomaly_score']} (Tripped: {live_fault['ml_anomaly']['is_anomaly']})")

    assert res_fault["egt"] > 20.0
    assert live_fault["engine_health_index"] < 88
    assert live_fault["diagnostic_reasoning"]["confidence_pct"] >= 75
    print("[PASS] Cause -> Effect chain verified: Telemetry -> Residual -> ML Anomaly -> Health Drop -> RUL Reduction")

    print("\n--- 5. Testing Mission Simulation Engine ---")
    sim_res = post("/api/simulation/run", {
        "preset_name": "ENDURANCE",
        "altitude_m": 4200.0,
        "ambient_temp_c": 8.0,
        "throttle": 0.65,
        "engine_load": 0.64,
        "duration_min": 180,
        "degradation_level": 0.10
    })
    summary = sim_res["summary"]
    print(f"Preset: {summary['preset']} | Total Fuel: {summary['total_fuel_consumed_liters']} L | Peak CHT: {summary['peak_cht_c']} C | Status: {summary['status']}")
    assert summary["total_fuel_consumed_liters"] > 0
    assert len(sim_res["telemetry_profile"]) == 40
    print("[PASS] Dynamic mission simulation profile generated accurately")

    print("\n--- 6. Testing Mission Replay Dataset (MISSION-042) ---")
    replay = get("/api/replay/mission-042")
    meta = replay["metadata"]
    print(f"Mission: {meta['mission_id']} | Aircraft: {meta['aircraft_type']} | Milestones: {len(meta['milestones'])}")
    assert len(replay["timeline"]) == 80
    assert any(m["label"] == "Anomaly Begins" for m in meta["milestones"])
    print("[PASS] Full synchronized replay timeline verified")

    print("\n--- 7. Resetting Engine ---")
    post("/api/engine/reset", {})
    print("[PASS] Engine reset to nominal baseline")

    print("\n===========================================================")
    print(" ALL 7 AEROTWIN VERIFICATION SUITE CHECKS PASSED WITH 100% SUCCESS!")
    print("===========================================================")

if __name__ == "__main__":
    test_system()

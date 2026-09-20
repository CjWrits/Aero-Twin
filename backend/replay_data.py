"""
AEROTWIN - Mission Replay Precalculated High-Fidelity Dataset
Generates synchronized telemetry profile for MISSION-042 (02:14:32 duration)
with clear anomaly detection milestones.
"""

from typing import List, Dict, Any

def get_mission_042_metadata() -> Dict[str, Any]:
    return {
        "mission_id": "MISSION-042",
        "engine_id": "ENG-01",
        "aircraft_type": "MALE UAV (Medium Altitude Long Endurance)",
        "propulsion_type": "Rotax 914 Turbocharged Aero-Piston",
        "total_duration_str": "02:14:32",
        "total_duration_sec": 8072,
        "recorded_samples_count": 80,
        "milestones": [
            {"time_str": "00:00", "sec": 0, "label": "Takeoff", "description": "Full throttle takeoff roll and initial rotation"},
            {"time_str": "08:14", "sec": 494, "label": "Climb", "description": "Passing 1500m climbing toward cruise flight level"},
            {"time_str": "21:32", "sec": 1292, "label": "Cruise", "description": "Level cruise reached at 4200m. Nominal endurance mode"},
            {"time_str": "47:10", "sec": 2830, "label": "High Altitude", "description": "Step climb to 6200m; ambient air temp drops to -18°C"},
            {"time_str": "01:14:32", "sec": 4472, "label": "Throttle Transition", "description": "Tactical throttle adjustment for sensor reconnaissance"},
            {"time_str": "01:26:15", "sec": 5175, "label": "Anomaly Begins", "description": "Injector cylinder 2 nozzle restriction initiates EGT thermal deviation"},
            {"time_str": "01:31:40", "sec": 5500, "label": "Predictive Alert", "description": "Digital Twin residual triggers warning: EGT +35°C, RUL reduced to 42-51 hrs"},
            {"time_str": "01:48:00", "sec": 6480, "label": "Recovery / Loiter", "description": "Power reduced to 60% cruise to preserve thermal safety margin"}
        ]
    }

def generate_mission_042_timeline() -> List[Dict[str, Any]]:
    """
    Generates 80 distinct sample points along the 02:14:32 timeline.
    Provides realistic physics, residual calculation, and health index progression.
    """
    steps = 80
    total_sec = 8072
    timeline = []

    for i in range(steps):
        t_sec = int(i * (total_sec / (steps - 1)))
        m = t_sec // 60
        s = t_sec % 60
        h = m // 60
        m = m % 60
        time_str = f"{h:02d}:{m:02d}:{s:02d}"

        # Phase logic
        if t_sec < 494: # Takeoff
            phase = "Takeoff"
            throttle = 0.98
            altitude = 120 + (t_sec / 494.0) * 1380
            rpm = 5620 + (t_sec % 25)
            cht = 155.0 + (t_sec / 494.0) * 15.0
            egt = 710.0 + (t_sec / 494.0) * 12.0
            oil_p = 4.9
            oil_t = 88.0 + (t_sec / 494.0) * 8.0
            ff = 24.2
            vib = 3.1
            health = 99
            alert = None
            anomaly = False
            residual_egt = +2.0

        elif t_sec < 1292: # Climb
            phase = "Climb"
            throttle = 0.85
            altitude = 1500 + ((t_sec - 494) / 798.0) * 2700
            rpm = 5400 + (t_sec % 20)
            cht = 170.0 - ((t_sec - 494) / 798.0) * 8.0
            egt = 705.0
            oil_p = 4.8
            oil_t = 94.0
            ff = 21.0
            vib = 2.8
            health = 98
            alert = None
            anomaly = False
            residual_egt = +1.5

        elif t_sec < 2830: # Cruise
            phase = "Cruise"
            throttle = 0.72
            altitude = 4200.0
            rpm = 5180 + (t_sec % 15)
            cht = 158.0
            egt = 690.0
            oil_p = 4.7
            oil_t = 93.0
            ff = 18.2
            vib = 2.5
            health = 97
            alert = None
            anomaly = False
            residual_egt = +0.5

        elif t_sec < 4472: # High Altitude
            phase = "High Altitude"
            throttle = 0.76
            altitude = 6200.0
            rpm = 5220 + (t_sec % 18)
            cht = 152.0
            egt = 694.0
            oil_p = 4.65
            oil_t = 91.0
            ff = 17.6
            vib = 2.4
            health = 96
            alert = None
            anomaly = False
            residual_egt = +1.0

        elif t_sec < 5175: # Throttle Transition
            phase = "Throttle Transition"
            throttle = 0.68
            altitude = 5800.0
            rpm = 5050 + (t_sec % 20)
            cht = 154.0
            egt = 688.0
            oil_p = 4.6
            oil_t = 92.0
            ff = 16.8
            vib = 2.4
            health = 96
            alert = None
            anomaly = False
            residual_egt = +1.2

        elif t_sec < 5500: # Anomaly Begins (5175 to 5500 sec)
            phase = "Anomaly Inception"
            prog = (t_sec - 5175) / 325.0
            throttle = 0.72
            altitude = 5600.0
            rpm = 5160 + (t_sec % 30)
            residual_egt = round(2.0 + prog * 33.0, 1) # EGT residual climbs to +35°C
            egt = round(690.0 + residual_egt, 1)
            cht = round(156.0 + prog * 18.0, 1)
            oil_p = 4.6
            oil_t = round(92.0 + prog * 4.0, 1)
            ff = round(17.8 + prog * 1.5, 2)
            vib = round(2.5 + prog * 0.7, 2)
            health = int(95 - prog * 8) # drops to 87
            anomaly = prog > 0.6
            alert = {
                "level": "WARNING",
                "message": f"Thermal gradient detected on Cyl-2: EGT residual {residual_egt:+.1f} °C",
                "timestamp": time_str
            } if prog > 0.4 else None

        elif t_sec < 6480: # Predictive Alert Active (5500 to 6480 sec)
            phase = "Predictive Alert Active"
            prog = min(1.0, (t_sec - 5500) / 980.0)
            throttle = 0.72
            altitude = 5500.0
            residual_egt = round(35.0 + prog * 6.0, 1)
            egt = round(690.0 + residual_egt, 1)
            cht = round(174.0 + prog * 3.0, 1)
            rpm = 5150 + (t_sec % 35)
            oil_p = 4.55
            oil_t = 97.0
            ff = round(19.2 + prog * 0.4, 2)
            vib = round(3.2 + prog * 0.3, 2)
            health = int(87 - prog * 5) # drops to 82
            anomaly = True
            alert = {
                "level": "CRITICAL" if health < 84 else "WARNING",
                "message": f"EVT-0042: Cylinder 2 Injector Degradation confirmed (EGT residual {residual_egt:+.1f} °C, RUL 42-51h)",
                "timestamp": time_str
            }

        else: # Recovery / Loiter (6480 to 8072 sec)
            phase = "Controlled Loiter / Precautionary"
            prog = (t_sec - 6480) / 1592.0
            throttle = 0.60
            altitude = 4800.0 - prog * 1200.0
            rpm = 4780 + (t_sec % 18)
            residual_egt = round(28.0 - prog * 8.0, 1)
            egt = round(660.0 + residual_egt, 1)
            cht = round(165.0 - prog * 10.0, 1)
            oil_p = 4.6
            oil_t = 93.0
            ff = 15.4
            vib = 2.7
            health = int(82 + prog * 3) # stabilizes around 85
            anomaly = True
            alert = {
                "level": "WARNING",
                "message": "Engine operating in derated loiter. Post-flight injector maintenance required.",
                "timestamp": time_str
            }

        timeline.append({
            "step_index": i,
            "seconds": t_sec,
            "time_str": time_str,
            "phase": phase,
            "throttle": round(throttle, 2),
            "altitude_m": round(altitude, 0),
            "rpm": round(rpm, 1),
            "cht": round(cht, 1),
            "egt": round(egt, 1),
            "oil_pressure": round(oil_p, 2),
            "oil_temperature": round(oil_t, 1),
            "fuel_flow": round(ff, 2),
            "vibration": round(vib, 2),
            "health_index": health,
            "residual_egt": residual_egt,
            "is_anomaly": anomaly,
            "active_alert": alert
        })

    return timeline

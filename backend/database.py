"""
AEROTWIN - SQLite Database & Historical Data Store
Manages historical engine missions, fault logs, and maintenance records.
"""

import sqlite3
import os
from typing import List, Dict, Any

DB_PATH = os.path.join(os.path.dirname(__file__), "aerotwin.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()

    # Missions Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS missions (
        mission_id TEXT PRIMARY KEY,
        date_str TEXT,
        callsign TEXT,
        duration_hours REAL,
        avg_altitude_m REAL,
        avg_rpm REAL,
        avg_cht_c REAL,
        avg_egt_c REAL,
        fuel_consumed_liters REAL,
        peak_vibration_mms REAL,
        final_health_index INTEGER,
        fault_count INTEGER,
        status TEXT
    )
    """)

    # Fault Events Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS fault_events (
        event_id TEXT PRIMARY KEY,
        mission_id TEXT,
        timestamp_str TEXT,
        subsystem TEXT,
        severity TEXT,
        observed_param TEXT,
        observed_value TEXT,
        expected_value TEXT,
        residual TEXT,
        associated_signals TEXT,
        probable_fault TEXT,
        confidence_pct INTEGER,
        model_detection TEXT,
        required_action TEXT
    )
    """)

    # Maintenance Records Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS maintenance_records (
        record_id TEXT PRIMARY KEY,
        engine_hours REAL,
        date_str TEXT,
        action_type TEXT,
        technician TEXT,
        description TEXT,
        status TEXT
    )
    """)

    # Seed baseline historical data if empty
    cur.execute("SELECT COUNT(*) as count FROM missions")
    if cur.fetchone()["count"] == 0:
        missions_data = [
            ("MISSION-038", "2026-09-04", "HAWK-1", 4.2, 3800, 5140, 154.2, 688.0, 78.5, 2.3, 98, 0, "COMPLETED - NOMINAL"),
            ("MISSION-039", "2026-09-08", "HAWK-1", 5.8, 4500, 5210, 156.8, 692.0, 112.4, 2.4, 97, 1, "COMPLETED - SENSOR WATCH"),
            ("MISSION-040", "2026-09-12", "HAWK-1", 6.1, 5200, 5180, 153.0, 689.5, 116.8, 2.5, 95, 0, "COMPLETED - NOMINAL"),
            ("MISSION-041", "2026-09-16", "HAWK-1", 3.8, 2900, 5260, 161.4, 695.0, 74.2, 2.6, 92, 1, "COMPLETED - THERMAL FLUTTER"),
            ("MISSION-042", "2026-09-20", "HAWK-1", 2.2, 4200, 5180, 174.0, 725.0, 42.8, 3.2, 87, 1, "IN PROGRESS - DEGRADATION DETECTED")
        ]
        cur.executemany("""
        INSERT INTO missions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, missions_data)

        faults_data = [
            (
                "EVT-0042", "MISSION-042", "01:26:15", "Fuel Injection / Combustion", "HIGH",
                "EGT", "725.0 °C", "690.0 °C", "+35.0 °C",
                "CHT ↑ (174.0 °C), Fuel Flow ↑ (19.2 L/h), Vibration ↑ (3.2 mm/s)",
                "Probable combustion abnormality / Injector degradation", 87,
                "Exhaust gas thermal residual exceeded 3-sigma statistical threshold with active trim enrichment",
                "Inspect cylinder 2 injector nozzle, perform flow bench calibration, inspect spark plug condition."
            ),
            (
                "EVT-0039", "MISSION-039", "03:42:10", "Lubrication Instrumentation", "LOW",
                "Oil Pressure", "4.92 bar", "4.80 bar", "+0.12 bar",
                "Alternator current nominal, oil temperature nominal",
                "Sensor signal jitter / pressure transducer wiring noise", 76,
                "High-frequency instrumentation ripple without thermodynamic pressure drop",
                "Check oil pressure sensor shield continuity at bulkhead connector J-04."
            ),
            (
                "EVT-0036", "MISSION-041", "02:11:45", "Cooling Subsystem", "MEDIUM",
                "CHT", "182.0 °C", "168.0 °C", "+14.0 °C",
                "Oil temperature ↑ (+8 °C), Ram air airspeed steady",
                "Probable cooling duct flap partial stiction", 82,
                "Thermal rejection deficit detected during descent at high ambient",
                "Lubricate cooling air intake cowl flap hinge and servo pushrod."
            )
        ]
        cur.executemany("""
        INSERT INTO fault_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, faults_data)

        maintenance_data = [
            ("MNT-0104", 48.5, "2026-09-05", "50-Hour Scheduled Inspection", "Tech S. Rao", "Replaced aero-engine synthetic oil (AeroShell Sport Plus 4) and full-flow oil filter. Cut filter element for visual check: no metal particles.", "SIGNED OFF"),
            ("MNT-0105", 92.0, "2026-09-13", "Ignition & Electrical Check", "Tech M. Vance", "Removed spark plugs; measured gap 0.65 mm. Cleaned carbon deposits, checked secondary coil resistances (6.2 kOhm).", "SIGNED OFF"),
            ("MNT-0106", 98.4, "2026-09-17", "Turbocharger Actuator Calibration", "Tech K. Lind", "Bench tested wastegate pneumatic servo and pressure control solenoid valve. Calibrated zero-play linkage.", "SIGNED OFF")
        ]
        cur.executemany("""
        INSERT INTO maintenance_records VALUES (?, ?, ?, ?, ?, ?, ?)
        """, maintenance_data)

    conn.commit()
    conn.close()

def get_all_missions() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM missions ORDER BY mission_id DESC")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def get_all_faults() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM fault_events ORDER BY event_id DESC")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def get_all_maintenance() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM maintenance_records ORDER BY engine_hours DESC")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def get_historical_summary() -> Dict[str, Any]:
    return {
        "engine_id": "ENG-01",
        "total_operating_hours": 104.6,
        "total_fuel_consumed_liters": 1842.0,
        "completed_missions_count": 5,
        "recorded_fault_events_count": 3,
        "average_cruise_cht": 156.4,
        "average_cruise_egt": 692.8,
        "mean_fleet_vibration": 2.54,
        "current_status": "MONITORING - SIMULATED TELEMETRY"
    }

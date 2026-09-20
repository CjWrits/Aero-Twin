# AEROTWIN

### Aero-Piston Engine Digital Twin & Predictive Health Monitoring System for MALE UAVs

A technical software demonstrator and digital twin framework for a horizontally opposed turbocharged 4-cylinder aero-piston engine (Rotax 914 / 915 iS class) deployed in Medium Altitude Long Endurance (MALE) Unmanned Aerial Vehicles.

Designed according to aerospace ground control, aircraft maintenance engineering, and industrial SCADA/HMI standards.

---

## 1. Quick Start

### Prerequisites
* **Python 3.10+** (fastapi, uvicorn, scikit-learn, numpy, pydantic)
* **Node.js 18+** & npm (for frontend modifications; pre-built production files are already packaged in `frontend/dist`)

### Running the Application

To launch the complete application (FastAPI backend + React engineering dashboard):

```bash
python run.py
```

Open your browser at:
**`http://127.0.0.1:8000`**

*(Interactive Swagger API documentation is available at `http://127.0.0.1:8000/docs`)*

---

## 2. Demonstration Flow for Evaluators & Faculty

Click the **`DEMO MODE`** button in the top header to launch the interactive 15-step guided walkthrough:

1. **Normal Engine Baseline (Overview):** Observe baseline endurance cruise telemetry (5,180 RPM, 155°C CHT, 690°C EGT, 4.7 bar Oil Pressure) and 98.7% Twin Synchronization.
2. **Stable Live Telemetry (Live Engine):** Review dynamic sparklines and multi-range telemetry buffer charts (5 min, 15 min, 30 min, 1 hr).
3. **Subsystem Topology & Physics (Digital Twin):** Explore the 7-stage Digital Twin data pipeline and click on cylinders, fuel rail, oil pump, and cooling jackets on the interactive engine schematic.
4. **Mission Simulation (Mission Simulation):** Select presets (`NORMAL CRUISE`, `HIGH ALTITUDE`, `ENDURANCE`, `HOT WEATHER`, `RAPID THROTTLE TRANSITION`) and run multi-hour aerodynamic flight simulations.
5. **Simulated Trajectory Results:** Observe altitude lapse effects, fuel burn totals, thermal stabilization, and degradation curves.
6. **Inject Fault (Fault Injection Console):** Select `Injector Degradation` (or `Misfire`, `Lubrication Degradation`, `Cooling Degradation`, `Overheating`, `Sensor Drift`, etc.) and click `INJECT FAULT`.
7. **Observe Physical Cause & Effect:**
   * **Telemetry:** EGT surges +35°C to +65°C, ECU trims fuel flow +1.8 L/h, vibration rises.
   * **Twin Residuals:** EGT residual Δ(Obs - Exp) jumps to +35.0°C (Confidence: 94%).
   * **AI/ML Anomaly:** Scikit-Learn Isolation Forest anomaly score trips (> 0.45 threshold) flagging EGT and Fuel Flow as primary contributors.
   * **Health Index:** Decays from 98/100 to 87/100 (Status: *DEGRADATION DETECTED*).
   * **Predictive RUL:** Decreases from 160h to 42–51 flight hours with accelerated wear trajectory.
   * **Maintenance Advisory:** High-priority inspection advisory is automatically generated with technical evidence.
8. **Mission Replay (Mission Replay):** Scrub through `MISSION-042` (02:14:32 duration). Play at 1x, 2x, or 5x speed to witness the exact detection transition at `01:26:15` and predictive alert at `01:31:40`.
9. **Fault Dossier (Fault Analysis):** Review the engineering report for event `EVT-0042` including multivariable residuals and recommended ground actions.
10. **System Architecture (System Architecture):** Walk through the CAN/ECU ingestion, physics models, isolation forest, and technical viva defense Q&A.

---

## 3. Project Structure

```
SIH/
├── backend/
│   ├── engine_models.py       # Thermodynamic & mechanical aero-piston physics equations
│   ├── digital_twin.py        # Residual calculations, subsystem indices, diagnostics, RUL
│   ├── anomaly_ml.py          # Scikit-learn Isolation Forest unsupervised anomaly detector
│   ├── mission_simulator.py   # Flight profile simulator with atmospheric compensation
│   ├── replay_data.py         # MISSION-042 full flight recorded timeline
│   ├── database.py            # SQLite historical missions, faults, and maintenance logs
│   ├── test_api.py            # Automated test suite for backend APIs and cause-effect chain
│   └── main.py                # FastAPI REST endpoints, WebSockets, and static frontend mount
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx            # Left navigation with status & synchronization footer
│   │   │   ├── TopHeader.tsx          # System identity, telemetry badges, and demo launcher
│   │   │   ├── FaultInjectionBar.tsx  # Persistent demonstration fault console with cascade breadcrumbs
│   │   │   ├── EngineSchematic.tsx    # Interactive vector schematic of 4-cyl opposed aero-engine
│   │   │   ├── Sparkline.tsx          # SVG real-time sparkline renderer
│   │   │   └── DemoTourModal.tsx      # 15-step interactive evaluator guided tour
│   │   ├── pages/
│   │   │   ├── OverviewPage.tsx               # Primary demonstration screen with health index & telemetry
│   │   │   ├── LiveEnginePage.tsx             # Parameter sparklines & time-series engineering charts
│   │   │   ├── DigitalTwinPage.tsx            # 7-stage pipeline, schematic, and residual matrix
│   │   │   ├── HealthDiagnosticsPage.tsx      # Subsystem health, evidence chain, and ML detector
│   │   │   ├── PredictiveMaintenancePage.tsx  # RUL curve with confidence interval & advisory
│   │   │   ├── MissionSimulationPage.tsx      # Multi-parameter physics sliders & flight outcomes
│   │   │   ├── MissionReplayPage.tsx          # MISSION-042 timeline scrubber with 1x/2x/5x controls
│   │   │   ├── FaultAnalysisPage.tsx          # Event EVT-0042 dossier and historical fault logs
│   │   │   ├── HistoricalDataPage.tsx         # Sortie history, fuel burn, and maintenance records
│   │   │   └── SystemArchitecturePage.tsx     # Technical architecture diagram and defense Q&A
│   │   ├── types.ts           # Strictly typed TypeScript data models
│   │   ├── api.ts             # API client service
│   │   ├── index.css          # Aerospace engineering SCADA/HMI stylesheet
│   │   └── App.tsx            # Root application layout
│   └── dist/                  # Pre-compiled high-performance production build
└── run.py                     # One-click startup script
```

---

## 4. Verification & Testing

To run the automated verification test suite:

```bash
python backend/test_api.py
```

Output:
```
--- 1. Testing Frontend Static Delivery ---
[PASS] Root index.html served correctly with AEROTWIN metadata

--- 2. Testing System Status Endpoint ---
System: SYSTEM ONLINE | Engine: ENG-01 | Mission: MISSION-042
[PASS] Identity and mission parameters verified

--- 3. Testing Baseline Nominal Engine Telemetry ---
RPM: 4880.8 | CHT: 177.8 C | EGT: 721.7 C | Oil P: 4.8 bar
Health Index: 99/100 | ML Anomaly: False
[PASS] Nominal cruise thermodynamics and health verified

--- 4. Testing Fault Injection: Injector Degradation ---
Fault injected: Injector Degradation (severity: 0.7)
Fault Telemetry -> EGT: 782.8 C (Residual: +62.1 C)
Fuel Flow: 23.11 L/h (Residual: +2.32 L/h)
Health Index: 55/100 (Status: CRITICAL ANOMALY)
Diagnostic Condition: Probable condition: Fuel injector degradation / localized lean combustion
RUL: 4-9 flight hours
ML Anomaly Score: 0.583 (Tripped: True)
[PASS] Cause -> Effect chain verified: Telemetry -> Residual -> ML Anomaly -> Health Drop -> RUL Reduction

--- 5. Testing Mission Simulation Engine ---
Preset: ENDURANCE | Total Fuel: 56.8 L | Peak CHT: 169.0 C | Status: MISSION FEASIBLE
[PASS] Dynamic mission simulation profile generated accurately

--- 6. Testing Mission Replay Dataset (MISSION-042) ---
Mission: MISSION-042 | Aircraft: MALE UAV (Medium Altitude Long Endurance) | Milestones: 8
[PASS] Full synchronized replay timeline verified

--- 7. Resetting Engine ---
[PASS] Engine reset to nominal baseline

===========================================================
 ALL 7 AEROTWIN VERIFICATION SUITE CHECKS PASSED WITH 100% SUCCESS!
===========================================================
```

---

## 5. Technical Integrity & Honest Framing

* **Prototype System:** Simulation and model outputs are strictly for demonstration and engineering research only and are not intended for flight-critical decision making.
* **Model Labels:** Unsupervised models are clearly labeled `Isolation Forest (Prototype / Simulated Training Data)`.
* **State Attribution:** Displayed data explicitly distinguishes between `LIVE SENSOR DATA`, `SIMULATED TELEMETRY`, `MODEL ESTIMATE`, and `AI PREDICTION`.

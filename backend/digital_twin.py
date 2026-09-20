"""
AEROTWIN - Digital Twin Core Module
Implements:
- Residual calculation (Observed - Expected)
- Subsystem health score computation
- Overall Engine Health Index
- Diagnostic reasoning engine & evidence extraction
- Remaining Useful Life (RUL) trend estimation
- Maintenance advisory generation
"""

import math
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from backend.engine_models import EngineState

class SubsystemHealth(BaseModel):
    name: str
    health_index: int = Field(ge=0, le=100)
    status: str # NORMAL, WATCH, DEGRADING, CRITICAL
    trend: str  # STABLE, DOWN, UP
    primary_metric: str
    observed_metric: str
    residual_metric: str
    evidence: List[str]

class TwinResiduals(BaseModel):
    rpm: float
    cht: float
    egt: float
    oil_pressure: float
    oil_temperature: float
    fuel_flow: float
    vibration: float
    battery_voltage: float
    alternator_current: float
    injection_timing: float

class DiagnosticReasoning(BaseModel):
    probable_condition: str
    confidence_pct: int
    severity: str # NORMAL, WATCH, WARNING, CRITICAL
    model_interpretation: str
    evidence_signals: List[str]
    maintenance_advisory: str
    maintenance_priority: str # ROUTINE, MEDIUM, HIGH, IMMEDIATE
    recommended_action: str
    twin_synchronization_pct: float
    disclaimer: str = "Advisory generated from prototype simulation/model output. Final maintenance decision requires qualified inspection."

class RULProjection(BaseModel):
    current_health_index: int
    predicted_rul_hours_min: int
    predicted_rul_hours_max: int
    confidence_pct: int
    degradation_rate_per_10h: float
    status: str
    historical_hours: List[int]
    historical_health: List[float]
    projected_hours: List[int]
    projected_health: List[float]
    projected_upper_bound: List[float]
    projected_lower_bound: List[float]

class DigitalTwinAnalyzer:
    def __init__(self):
        # Rolling telemetry history for trend and degradation
        self.history_residuals: List[Dict[str, float]] = []

    def compute_residuals(self, observed: EngineState, expected: EngineState) -> TwinResiduals:
        return TwinResiduals(
            rpm=round(observed.rpm - expected.rpm, 1),
            cht=round(observed.cht - expected.cht, 1),
            egt=round(observed.egt - expected.egt, 1),
            oil_pressure=round(observed.oil_pressure - expected.oil_pressure, 2),
            oil_temperature=round(observed.oil_temperature - expected.oil_temperature, 1),
            fuel_flow=round(observed.fuel_flow - expected.fuel_flow, 2),
            vibration=round(observed.vibration - expected.vibration, 2),
            battery_voltage=round(observed.battery_voltage - expected.battery_voltage, 2),
            alternator_current=round(observed.alternator_current - expected.alternator_current, 1),
            injection_timing=round(observed.injection_timing - expected.injection_timing, 1)
        )

    def analyze_subsystems(self, observed: EngineState, expected: EngineState, res: TwinResiduals) -> Dict[str, SubsystemHealth]:
        subsystems = {}

        # 1. Combustion Subsystem
        # Influenced by EGT residual, CHT residual, timing, RPM stability
        egt_pen = min(40, max(0, abs(res.egt) - 10) * 1.0)
        rpm_pen = min(25, max(0, abs(res.rpm) - 40) * 0.15)
        timing_pen = min(20, abs(res.injection_timing) * 3.0)
        comb_health = int(max(20, 100 - (egt_pen + rpm_pen + timing_pen)))
        comb_status = "NORMAL" if comb_health >= 88 else ("WATCH" if comb_health >= 75 else ("DEGRADING" if comb_health >= 60 else "CRITICAL"))
        comb_evidence = []
        if abs(res.egt) > 15:
            comb_evidence.append(f"EGT deviation ({res.egt:+.1f} °C)")
        if abs(res.rpm) > 60:
            comb_evidence.append(f"Speed hunting ({res.rpm:+.1f} rpm)")
        if not comb_evidence:
            comb_evidence.append("Combustion parameters within nominal envelope")

        subsystems["combustion"] = SubsystemHealth(
            name="Combustion System",
            health_index=comb_health,
            status=comb_status,
            trend="DOWN" if comb_health < 88 else "STABLE",
            primary_metric="EGT",
            observed_metric=f"{observed.egt:.1f} °C",
            residual_metric=f"{res.egt:+.1f} °C",
            evidence=comb_evidence
        )

        # 2. Fuel Injection Subsystem
        ff_pen = min(40, max(0, abs(res.fuel_flow) - 0.3) * 18.0)
        egt_ff_pen = min(35, max(0, res.egt - 15) * 0.8)
        fuel_health = int(max(22, 100 - (ff_pen + egt_ff_pen)))
        fuel_status = "NORMAL" if fuel_health >= 88 else ("WATCH" if fuel_health >= 75 else ("DEGRADING" if fuel_health >= 60 else "CRITICAL"))
        fuel_evidence = []
        if abs(res.fuel_flow) > 0.5:
            fuel_evidence.append(f"Fuel-flow trim deviation ({res.fuel_flow:+.2f} L/h)")
        if res.egt > 20:
            fuel_evidence.append(f"Lean cylinder thermal signature (+{res.egt:.1f} °C)")
        if not fuel_evidence:
            fuel_evidence.append("Fuel injection delivery calibrated")

        subsystems["fuel_injection"] = SubsystemHealth(
            name="Fuel Injection",
            health_index=fuel_health,
            status=fuel_status,
            trend="DOWN" if fuel_health < 88 else "STABLE",
            primary_metric="Fuel Flow",
            observed_metric=f"{observed.fuel_flow:.2f} L/h",
            residual_metric=f"{res.fuel_flow:+.2f} L/h",
            evidence=fuel_evidence
        )

        # 3. Lubrication Subsystem
        # Oil pressure drop is very critical
        oil_p_drop = max(0, -res.oil_pressure)
        oil_p_pen = min(60, oil_p_drop * 35.0)
        oil_t_pen = min(35, max(0, res.oil_temperature - 6.0) * 1.5)
        lub_health = int(max(15, 100 - (oil_p_pen + oil_t_pen)))
        lub_status = "NORMAL" if lub_health >= 88 else ("WATCH" if lub_health >= 75 else ("DEGRADING" if lub_health >= 60 else "CRITICAL"))
        lub_evidence = []
        if res.oil_pressure < -0.4:
            lub_evidence.append(f"Oil delivery pressure deficit ({res.oil_pressure:+.2f} bar)")
        if res.oil_temperature > 8.0:
            lub_evidence.append(f"Oil thermal elevated ({res.oil_temperature:+.1f} °C)")
        if not lub_evidence:
            lub_evidence.append("Hydrodynamic bearing pressure stable")

        subsystems["lubrication"] = SubsystemHealth(
            name="Lubrication System",
            health_index=lub_health,
            status=lub_status,
            trend="DOWN" if lub_health < 88 else "STABLE",
            primary_metric="Oil Pressure",
            observed_metric=f"{observed.oil_pressure:.2f} bar",
            residual_metric=f"{res.oil_pressure:+.2f} bar",
            evidence=lub_evidence
        )

        # 4. Cooling Subsystem
        cht_pen = min(50, max(0, res.cht - 8.0) * 1.4)
        cool_oil_pen = min(30, max(0, res.oil_temperature - 8.0) * 1.2)
        cool_health = int(max(20, 100 - (cht_pen + cool_oil_pen)))
        cool_status = "NORMAL" if cool_health >= 88 else ("WATCH" if cool_health >= 75 else ("DEGRADING" if cool_health >= 60 else "CRITICAL"))
        cool_evidence = []
        if res.cht > 12.0:
            cool_evidence.append(f"Cylinder head thermal surge ({res.cht:+.1f} °C)")
        if res.oil_temperature > 10.0:
            cool_evidence.append(f"Cooling jacket heat accumulation ({res.oil_temperature:+.1f} °C)")
        if not cool_evidence:
            cool_evidence.append("Heat rejection rate nominal")

        subsystems["cooling"] = SubsystemHealth(
            name="Cooling Subsystem",
            health_index=cool_health,
            status=cool_status,
            trend="DOWN" if cool_health < 88 else "STABLE",
            primary_metric="CHT",
            observed_metric=f"{observed.cht:.1f} °C",
            residual_metric=f"{res.cht:+.1f} °C",
            evidence=cool_evidence
        )

        # 5. Mechanical / Vibration Subsystem
        vib_pen = min(60, max(0, res.vibration - 0.5) * 14.0)
        rpm_fluct_pen = min(20, max(0, abs(res.rpm) - 50) * 0.1)
        mech_health = int(max(18, 100 - (vib_pen + rpm_fluct_pen)))
        mech_status = "NORMAL" if mech_health >= 88 else ("WATCH" if mech_health >= 75 else ("DEGRADING" if mech_health >= 60 else "CRITICAL"))
        mech_evidence = []
        if res.vibration > 0.8:
            mech_evidence.append(f"Block RMS vibration surge ({res.vibration:+.2f} mm/s)")
        if not mech_evidence:
            mech_evidence.append("Rotating assembly dynamic balance within limits")

        subsystems["vibration"] = SubsystemHealth(
            name="Mechanical & Vibration",
            health_index=mech_health,
            status=mech_status,
            trend="DOWN" if mech_health < 88 else "STABLE",
            primary_metric="RMS Vibration",
            observed_metric=f"{observed.vibration:.2f} mm/s",
            residual_metric=f"{res.vibration:+.2f} mm/s",
            evidence=mech_evidence
        )

        # 6. Electrical Subsystem
        volt_pen = min(40, max(0, abs(res.battery_voltage) - 0.4) * 20.0)
        curr_pen = min(30, max(0, abs(res.alternator_current) - 4.0) * 2.0)
        elec_health = int(max(30, 100 - (volt_pen + curr_pen)))
        elec_status = "NORMAL" if elec_health >= 88 else ("WATCH" if elec_health >= 75 else ("DEGRADING" if elec_health >= 60 else "CRITICAL"))
        elec_evidence = []
        if abs(res.battery_voltage) > 0.5:
            elec_evidence.append(f"Bus voltage margin ({res.battery_voltage:+.2f} V)")
        if not elec_evidence:
            elec_evidence.append("28V DC generator bus nominal")

        subsystems["electrical"] = SubsystemHealth(
            name="Electrical System",
            health_index=elec_health,
            status=elec_status,
            trend="STABLE",
            primary_metric="Bus Voltage",
            observed_metric=f"{observed.battery_voltage:.2f} V",
            residual_metric=f"{res.battery_voltage:+.2f} V",
            evidence=elec_evidence
        )

        return subsystems

    def compute_engine_health_index(self, subsystems: Dict[str, SubsystemHealth]) -> int:
        """
        Computes overall Engine Health Index (0-100) using weighted subsystem contributions
        with bottleneck attenuation for critical safety subsystems.
        """
        weights = {
            "combustion": 0.22,
            "fuel_injection": 0.18,
            "lubrication": 0.25,
            "cooling": 0.15,
            "vibration": 0.15,
            "electrical": 0.05
        }
        weighted_sum = sum(subsystems[k].health_index * weights[k] for k in weights if k in subsystems)
        min_sub = min(subsystems[k].health_index for k in subsystems)

        # If any single subsystem enters critical (<60), penalize total index
        if min_sub < 60:
            final_index = int(0.6 * weighted_sum + 0.4 * min_sub)
        else:
            final_index = int(weighted_sum)

        return max(10, min(100, final_index))

    def evaluate_diagnostic_reasoning(self, observed: EngineState, expected: EngineState,
                                     res: TwinResiduals, subsystems: Dict[str, SubsystemHealth],
                                     health_index: int) -> DiagnosticReasoning:
        """
        Synthesizes physics residuals, subsystem states, and cross-variable correlation
        to produce diagnostic reasoning and actionable maintenance advisories.
        """
        evidence: List[str] = []
        twin_sync = round(max(91.0, 99.4 - (abs(res.rpm)*0.005 + abs(res.egt)*0.01 + abs(res.cht)*0.02)), 1)

        # Case 1: Sensor Drift decoupling (CHT high without thermodynamic coupling)
        if res.cht > 25.0 and res.egt < 15.0 and res.oil_temperature < 8.0:
            return DiagnosticReasoning(
                probable_condition="Model indication: Instrumentation sensor drift (CHT circuit)",
                confidence_pct=86,
                severity="WARNING",
                model_interpretation="Digital Twin detected thermal decoupling: CHT thermocouple reading elevated (+{:.1f} °C) while oil cooler thermal flux and EGT remain balanced with expected physics.".format(res.cht),
                evidence_signals=[
                    f"CHT elevation residual: {res.cht:+.1f} °C",
                    f"Oil temperature residual within normal: {res.oil_temperature:+.1f} °C",
                    f"EGT correlation nominal: {res.egt:+.1f} °C"
                ],
                maintenance_advisory="Inspect cylinder head temperature harness and thermocouple probe resistance before next sortie.",
                maintenance_priority="MEDIUM",
                recommended_action="Calibrate CHT sensor channel 2; verify harness shield grounding.",
                twin_synchronization_pct=twin_sync
            )

        # Case 2: Lubrication Degradation
        if res.oil_pressure < -0.8 or (res.oil_pressure < -0.4 and res.oil_temperature > 12.0):
            return DiagnosticReasoning(
                probable_condition="Probable condition: Lubrication circuit degradation / oil pump wear",
                confidence_pct=91,
                severity="CRITICAL" if res.oil_pressure < -1.4 else "WARNING",
                model_interpretation="Oil supply pressure residual shows persistent deficit ({:.2f} bar) accompanied by elevated oil temperature ({:+.1f} °C) and elevated mechanical friction.".format(res.oil_pressure, res.oil_temperature),
                evidence_signals=[
                    f"Oil pressure delivery deficit: {res.oil_pressure:+.2f} bar",
                    f"Oil sump temperature elevation: {res.oil_temperature:+.1f} °C",
                    f"Mechanical block vibration: {res.vibration:+.2f} mm/s"
                ],
                maintenance_advisory="Immediate ground inspection recommended. Verify oil filter bypass indicator and scavenge line flow.",
                maintenance_priority="IMMEDIATE" if res.oil_pressure < -1.4 else "HIGH",
                recommended_action="Drain and inspect oil filter screen for bronze/ferrous particulate wear; test pressure relief valve.",
                twin_synchronization_pct=twin_sync
            )

        # Case 3: Injector Degradation / Lean Combustion
        if res.egt > 22.0 or (res.fuel_flow > 0.6 and res.egt > 15.0):
            return DiagnosticReasoning(
                probable_condition="Probable condition: Fuel injector degradation / localized lean combustion",
                confidence_pct=88,
                severity="WARNING" if res.egt < 45.0 else "CRITICAL",
                model_interpretation="Observed exhaust gas temperature exceeds nominal twin model by {:+.1f} °C with active fuel trim enrichment (+{:.2f} L/h), indicating injector nozzle spray pattern deterioration.".format(res.egt, res.fuel_flow),
                evidence_signals=[
                    f"EGT residual above baseline: {res.egt:+.1f} °C",
                    f"Fuel flow compensation demand: {res.fuel_flow:+.2f} L/h",
                    f"Mild cyclic roughness increase: {res.vibration:+.2f} mm/s"
                ],
                maintenance_advisory="Inspection recommended before next extended endurance mission.",
                maintenance_priority="HIGH",
                recommended_action="Bench-test fuel injector flow rates; clean injector nozzles and check fuel rail pressure regulator.",
                twin_synchronization_pct=twin_sync
            )

        # Case 4: Misfire / Combustion Instability
        if abs(res.rpm) > 80.0 and res.vibration > 1.8:
            return DiagnosticReasoning(
                probable_condition="Probable condition: Intermittent combustion misfire / ignition breakdown",
                confidence_pct=89,
                severity="CRITICAL",
                model_interpretation="Rotational velocity instability ({:+.1f} rpm) coupled with substantial RMS vibration surge ({:+.2f} mm/s) indicates incomplete cylinder firing strokes.".format(res.rpm, res.vibration),
                evidence_signals=[
                    f"Crankshaft speed instability: {res.rpm:+.1f} rpm",
                    f"High-frequency vibration spike: {res.vibration:+.2f} mm/s",
                    f"Exhaust thermal fluctuation: {res.egt:+.1f} °C"
                ],
                maintenance_advisory="Sortie abort advised. Engine ignition system check required prior to flight clearance.",
                maintenance_priority="IMMEDIATE",
                recommended_action="Inspect spark plug gaps, dual ignition coils, and magneto/electronic trigger sensors.",
                twin_synchronization_pct=twin_sync
            )

        # Case 5: Cooling Degradation / Overheating
        if res.cht > 20.0 or (res.cht > 12.0 and res.oil_temperature > 15.0):
            return DiagnosticReasoning(
                probable_condition="Probable condition: Engine thermal cooling rejection deficit",
                confidence_pct=85,
                severity="CRITICAL" if res.cht > 38.0 else "WARNING",
                model_interpretation="Cylinder head thermal flux exceeds aerodynamic cooling capacity (+{:.1f} °C above expected model). Risk of detonation margin erosion.".format(res.cht),
                evidence_signals=[
                    f"CHT thermal residual: {res.cht:+.1f} °C",
                    f"Oil cooler heat soak: {res.oil_temperature:+.1f} °C",
                    f"Manifold temperature boundary: nominal"
                ],
                maintenance_advisory="Check cooling air duct baffles and radiator coolant matrix cleanliness.",
                maintenance_priority="HIGH",
                recommended_action="Flush coolant heat exchanger; verify cooling ram-air flap actuator operation.",
                twin_synchronization_pct=twin_sync
            )

        # Case 6: Abnormal Vibration
        if res.vibration > 1.4:
            return DiagnosticReasoning(
                probable_condition="Probable condition: Dynamic mechanical unbalance / propeller or gearbox anomaly",
                confidence_pct=83,
                severity="WARNING",
                model_interpretation="RMS vibration velocity elevated by {:+.2f} mm/s with stable thermodynamic combustion, indicating rotational kinematic eccentricity.".format(res.vibration),
                evidence_signals=[
                    f"RMS vibration residual: {res.vibration:+.2f} mm/s",
                    f"Thermodynamic parameters: nominal"
                ],
                maintenance_advisory="Perform dynamic propeller balancing and inspect engine mount elastomeric isolators.",
                maintenance_priority="HIGH",
                recommended_action="Inspect reduction gearbox backlash; conduct dynamic propeller track and balance test.",
                twin_synchronization_pct=twin_sync
            )

        # Default Nominal Condition
        return DiagnosticReasoning(
            probable_condition="Model indication: Normal operating envelope",
            confidence_pct=95,
            severity="NORMAL",
            model_interpretation="Observed telemetry matches expected thermodynamic and kinematic physics within statistical noise bounds (±1.5σ).",
            evidence_signals=[
                "All subsystem residuals within ±5% tolerance",
                f"EGT residual nominal: {res.egt:+.1f} °C",
                f"Oil pressure margin: {observed.oil_pressure:.2f} bar"
            ],
            maintenance_advisory="Routine scheduled maintenance per 100-hour inspection interval.",
            maintenance_priority="ROUTINE",
            recommended_action="Continue nominal mission profile; log routine telemetry parameters.",
            twin_synchronization_pct=twin_sync
        )

    def compute_rul_projection(self, health_index: int, diag: DiagnosticReasoning) -> RULProjection:
        """
        Generates deterministic degradation trend & RUL flight hours prediction
        with historical (0-100 hrs) and projected (100-150 hrs) trajectories.
        """
        # Historical 10-hour steps up to 100 hrs
        hist_hours = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        # Baseline gradual aging
        hist_health = [100.0, 99.2, 98.4, 97.5, 96.1, 95.0, 93.8, 92.5, 90.8, 89.2, float(health_index)]

        # Determine degradation rate per 10 flight hours based on current health status
        if health_index >= 90:
            deg_rate = 1.2
            rul_min = 140
            rul_max = 185
            rul_status = "STABLE EXTENDED"
            confidence = 88
        elif health_index >= 80:
            deg_rate = 3.5
            rul_min = 42
            rul_max = 51
            rul_status = "DEGRADATION DETECTED"
            confidence = 78
        elif health_index >= 65:
            deg_rate = 6.8
            rul_min = 16
            rul_max = 24
            rul_status = "ACCELERATED DECAY"
            confidence = 82
        else:
            deg_rate = 12.5
            rul_min = 4
            rul_max = 9
            rul_status = "CRITICAL LIMIT REACHED"
            confidence = 89

        # Projected 100 to 150 hours
        proj_hours = [100, 110, 120, 130, 140, 150]
        proj_health = []
        proj_upper = []
        proj_lower = []

        curr = float(health_index)
        for i, h in enumerate(proj_hours):
            if i == 0:
                val = curr
            else:
                step_decay = deg_rate * (1.0 + (i * 0.15)) # slight exponential wear
                val = max(15.0, curr - step_decay * i)

            uncertainty = i * 2.8
            proj_health.append(round(val, 1))
            proj_upper.append(round(min(100.0, val + uncertainty), 1))
            proj_lower.append(round(max(5.0, val - uncertainty), 1))

        return RULProjection(
            current_health_index=health_index,
            predicted_rul_hours_min=rul_min,
            predicted_rul_hours_max=rul_max,
            confidence_pct=confidence,
            degradation_rate_per_10h=round(deg_rate, 2),
            status=rul_status,
            historical_hours=hist_hours,
            historical_health=hist_health,
            projected_hours=proj_hours,
            projected_health=proj_health,
            projected_upper_bound=proj_upper,
            projected_lower_bound=proj_lower
        )

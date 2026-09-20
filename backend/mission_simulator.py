"""
AEROTWIN - Mission Simulation Logic
Calculates dynamic mission flight profiles based on aero-thermodynamic engine model.
"""

import math
import random
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from backend.engine_models import PhysicsEngineModel, EngineOperatingConditions

class MissionSimulationRequest(BaseModel):
    preset_name: str = "NORMAL CRUISE"
    altitude_m: float = Field(default=3500.0, ge=0.0, le=9000.0)
    ambient_temp_c: float = Field(default=15.0, ge=-40.0, le=55.0)
    throttle: float = Field(default=0.72, ge=0.0, le=1.0)
    engine_load: float = Field(default=0.70, ge=0.0, le=1.0)
    duration_min: int = Field(default=120, ge=10, le=600)
    degradation_level: float = Field(default=0.0, ge=0.0, le=1.0)

class MissionSimulationResult(BaseModel):
    summary: Dict[str, Any]
    telemetry_profile: List[Dict[str, Any]]

class MissionSimulator:
    def __init__(self):
        self.physics = PhysicsEngineModel()

    def run_simulation(self, req: MissionSimulationRequest) -> MissionSimulationResult:
        """
        Executes deterministic multi-step flight mission profile.
        Produces 40 time-series points capturing thermal soak, fuel consumption,
        and degradation dynamics.
        """
        steps = 40
        time_step_min = req.duration_min / float(steps)

        points = []
        total_fuel_liters = 0.0
        peak_cht = 0.0
        mean_egt_accum = 0.0
        peak_vib = 0.0

        for i in range(steps):
            t_min = round(i * time_step_min, 1)

            # Throttle profile variation if "RAPID THROTTLE TRANSITION" preset
            if req.preset_name == "RAPID THROTTLE TRANSITION":
                th = req.throttle + 0.22 * math.sin(i * 0.7)
                th = max(0.35, min(0.95, th))
                load = th * 0.95
            else:
                # Slight operational variation
                th = req.throttle
                load = req.engine_load

            # Thermal soak: engine takes ~10-15 mins to reach steady-state equilibrium
            soak_fraction = min(1.0, (t_min + 5.0) / 18.0)

            # Cumulative degradation effect during endurance
            wear_factor = req.degradation_level * (1.0 + (t_min / req.duration_min) * 0.4)

            cond = EngineOperatingConditions(
                throttle=th,
                engine_load=load,
                altitude=req.altitude_m,
                ambient_temperature=req.ambient_temp_c
            )
            nominal = self.physics.calculate_expected_state(cond)

            # Apply thermal soak and degradation perturbation
            cht_val = round(nominal.cht * (0.85 + 0.15 * soak_fraction) + (wear_factor * 18.0), 1)
            egt_val = round(nominal.egt + (wear_factor * 34.0), 1)
            oil_p_val = round(nominal.oil_pressure - (wear_factor * 0.7), 2)
            oil_t_val = round(nominal.oil_temperature * (0.88 + 0.12 * soak_fraction) + (wear_factor * 12.0), 1)
            ff_val = round(nominal.fuel_flow * (1.0 + wear_factor * 0.08), 2)
            vib_val = round(nominal.vibration + (wear_factor * 1.8), 2)
            health_val = int(max(40, 100 - (wear_factor * 42.0)))

            # Accumulate fuel consumption
            hours_fraction = time_step_min / 60.0
            total_fuel_liters += ff_val * hours_fraction

            if cht_val > peak_cht:
                peak_cht = cht_val
            if vib_val > peak_vib:
                peak_vib = vib_val
            mean_egt_accum += egt_val

            points.append({
                "time_min": t_min,
                "altitude_m": req.altitude_m,
                "throttle_pct": round(th * 100, 1),
                "rpm": nominal.rpm,
                "cht": cht_val,
                "egt": egt_val,
                "oil_pressure": oil_p_val,
                "oil_temperature": oil_t_val,
                "fuel_flow": ff_val,
                "vibration": vib_val,
                "health_index": health_val
            })

        avg_egt = round(mean_egt_accum / steps, 1)

        summary = {
            "preset": req.preset_name,
            "duration_hours": round(req.duration_min / 60.0, 2),
            "total_fuel_consumed_liters": round(total_fuel_liters, 1),
            "average_fuel_flow_lh": round(total_fuel_liters / (req.duration_min / 60.0), 2),
            "peak_cht_c": peak_cht,
            "mean_egt_c": avg_egt,
            "peak_vibration_mms": peak_vib,
            "final_health_index": points[-1]["health_index"],
            "thermal_margin_pct": round(max(0, (210.0 - peak_cht) / 210.0 * 100), 1),
            "status": "MISSION FEASIBLE" if peak_cht < 195.0 and points[-1]["health_index"] >= 70 else "MARGIN CRITICAL"
        }

        return MissionSimulationResult(
            summary=summary,
            telemetry_profile=points
        )

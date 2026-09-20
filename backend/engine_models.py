"""
AEROTWIN - Aero-Piston Engine Models and Simulation State
Simulates a turbocharged 4-cylinder horizontally opposed aero-piston engine
typical of MALE UAV propulsion systems (e.g. Rotax 914 / 915 iS class).
"""

import math
import random
import time
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class EngineOperatingConditions(BaseModel):
    throttle: float = Field(default=0.72, ge=0.0, le=1.0, description="Throttle lever position (0-1)")
    engine_load: float = Field(default=0.70, ge=0.0, le=1.0, description="Propeller absorption / aerodynamic load")
    altitude: float = Field(default=3500.0, ge=0.0, le=9000.0, description="Altitude in meters")
    ambient_temperature: float = Field(default=18.0, description="Outside air temperature in Celsius")

class EngineState(BaseModel):
    timestamp: float = Field(default_factory=time.time)
    rpm: float = Field(description="Crankshaft speed [rpm]")
    throttle: float = Field(description="Throttle fraction [0-1]")
    engine_load: float = Field(description="Engine load fraction [0-1]")
    altitude: float = Field(description="Flight altitude [m]")
    ambient_temperature: float = Field(description="Ambient temperature [°C]")
    cht: float = Field(description="Cylinder Head Temperature [°C]")
    egt: float = Field(description="Exhaust Gas Temperature [°C]")
    oil_pressure: float = Field(description="Engine lubrication pressure [bar]")
    oil_temperature: float = Field(description="Engine oil temperature [°C]")
    fuel_flow: float = Field(description="Volumetric fuel flow rate [L/h]")
    vibration: float = Field(description="Engine block RMS vibration velocity [mm/s]")
    battery_voltage: float = Field(description="Aircraft bus / battery voltage [V]")
    alternator_current: float = Field(description="Alternator electrical output current [A]")
    injection_timing: float = Field(description="Ignition/injection advance angle [° BTDC]")
    manifold_pressure: float = Field(default=35.4, description="Intake manifold pressure [inHg]")

class FaultInjectionConfig(BaseModel):
    fault_type: str = Field(default="Normal Operation")
    severity: float = Field(default=0.5, ge=0.0, le=1.0, description="Severity fraction 0.0 to 1.0")
    active: bool = Field(default=False)

class PhysicsEngineModel:
    """
    Thermodynamic and mechanical physics model of the aero-piston engine.
    Computes theoretical / expected parameter values under baseline nominal conditions.
    """
    def __init__(self):
        # Baseline engine constants (Rotax 914 turbo / 915 iS class)
        self.rpm_idle = 1800.0
        self.rpm_max = 5800.0
        self.base_cht = 135.0   # °C at nominal cruise
        self.base_egt = 690.0   # °C at stoichiometric cruise
        self.base_oil_p = 4.8   # bar
        self.base_oil_t = 92.0  # °C
        self.base_fuel_flow = 17.5 # L/h

    def calculate_expected_state(self, conditions: EngineOperatingConditions) -> EngineState:
        """
        Calculates deterministic expected nominal state based on atmospheric
        and control inputs using aero-engine thermodynamic equations.
        """
        th = conditions.throttle
        load = conditions.engine_load
        alt = conditions.altitude
        oat = conditions.ambient_temperature

        # Standard ISA lapse rate calculation for air density ratio
        # Temperature lapse: -6.5°C per 1000m
        isa_temp_k = (15.0 - 0.0065 * alt) + 273.15
        actual_temp_k = oat + 273.15
        temp_ratio = actual_temp_k / isa_temp_k
        pressure_ratio = math.pow(1.0 - (0.0065 * alt) / 288.15, 5.25588)
        density_ratio = (pressure_ratio / temp_ratio) if temp_ratio > 0 else 1.0

        # Turbocharger wastegate control compensation up to critical altitude (4500m)
        turbo_boost_capacity = 1.0 if alt <= 4500 else max(0.65, 1.0 - (alt - 4500) * 0.00008)
        effective_map_inHg = 29.92 * (0.6 + 0.75 * th * turbo_boost_capacity)

        # Expected RPM (governed constant speed prop characteristic with throttle command)
        expected_rpm = self.rpm_idle + (self.rpm_max - self.rpm_idle) * (0.2 + 0.8 * th)
        # Minor load pull-down
        expected_rpm -= (load - 0.5) * 120.0

        # Expected Fuel Flow (L/h) - function of MAP and RPM
        expected_fuel_flow = (effective_map_inHg / 29.92) * (expected_rpm / 5000.0) * 19.5 * (0.85 + 0.15 * th)

        # Expected CHT (°C) - affected by combustion power and cooling airflow (ambient temp + air density)
        heat_generation = th * 55.0 + (load * 20.0)
        cooling_factor = math.sqrt(max(0.3, density_ratio))
        expected_cht = 95.0 + (oat * 0.75) + (heat_generation / cooling_factor)

        # Expected EGT (°C) - peak near optimal cruise mixture (th ~ 0.7 - 0.75)
        # Full throttle enriches mixture for detonation protection, dropping EGT
        mixture_enrichment = 40.0 * max(0.0, th - 0.85) / 0.15 if th > 0.85 else 0.0
        expected_egt = 640.0 + (th * 110.0) - mixture_enrichment + (oat - 15.0) * 0.5

        # Expected Oil Pressure (bar) - gear pump delivery proportional to RPM, inversely to viscosity (oil temp)
        expected_oil_p = 3.6 + (expected_rpm / 5800.0) * 1.5 - (oat - 15.0) * 0.015

        # Expected Oil Temperature (°C) - coupled to CHT and cooling oil cooler
        expected_oil_t = 70.0 + (oat * 0.55) + (th * 26.0)

        # Expected Vibration RMS (mm/s) - baseline 2-3 mm/s from 2nd order reciprocating mass
        expected_vibration = 1.8 + 1.6 * (expected_rpm / 5800.0) ** 1.5 + (load * 0.5)

        # Electrical subsystem (28V DC nominal aviation bus)
        expected_voltage = 28.1 - (load * 0.4)
        expected_alternator = 22.0 + (th * 18.0)

        # Injection Timing (° BTDC) - electronic ECU mapped table
        expected_timing = 24.0 + (1.0 - th) * 8.0 - (alt / 5000.0) * 2.0

        return EngineState(
            timestamp=time.time(),
            rpm=round(expected_rpm, 1),
            throttle=round(th, 3),
            engine_load=round(load, 3),
            altitude=round(alt, 1),
            ambient_temperature=round(oat, 1),
            cht=round(expected_cht, 1),
            egt=round(expected_egt, 1),
            oil_pressure=round(expected_oil_p, 2),
            oil_temperature=round(expected_oil_t, 1),
            fuel_flow=round(expected_fuel_flow, 2),
            vibration=round(expected_vibration, 2),
            battery_voltage=round(expected_voltage, 2),
            alternator_current=round(expected_alternator, 1),
            injection_timing=round(expected_timing, 1),
            manifold_pressure=round(effective_map_inHg, 1)
        )

class EngineSimulator:
    """
    Simulates the actual physical engine telemetry, incorporating deterministic
    thermodynamics, sensor measurement noise, and active fault injection dynamics.
    """
    def __init__(self):
        self.physics_model = PhysicsEngineModel()
        self.conditions = EngineOperatingConditions()
        self.active_fault = FaultInjectionConfig()
        self._step_counter = 0

    def set_operating_conditions(self, throttle: Optional[float] = None,
                                 engine_load: Optional[float] = None,
                                 altitude: Optional[float] = None,
                                 ambient_temp: Optional[float] = None):
        if throttle is not None:
            self.conditions.throttle = max(0.0, min(1.0, throttle))
        if engine_load is not None:
            self.conditions.engine_load = max(0.0, min(1.0, engine_load))
        if altitude is not None:
            self.conditions.altitude = max(0.0, min(9000.0, altitude))
        if ambient_temp is not None:
            self.conditions.ambient_temperature = max(-40.0, min(55.0, ambient_temp))

    def set_fault(self, fault_type: str, severity: float = 0.5, active: bool = True):
        self.active_fault.fault_type = fault_type
        self.active_fault.severity = max(0.0, min(1.0, severity))
        self.active_fault.active = active and (fault_type != "Normal Operation")

    def get_step_telemetry(self) -> Dict[str, Any]:
        """
        Calculates one discrete time step of the physical engine telemetry
        and compares it against the digital twin expected state.
        """
        self._step_counter += 1
        expected = self.physics_model.calculate_expected_state(self.conditions)
        sev = self.active_fault.severity if self.active_fault.active else 0.0
        f_type = self.active_fault.fault_type if self.active_fault.active else "Normal Operation"

        # Baseline measurement noise (small bounded Gaussians)
        # Using pseudo-random with stable seeds or bounded jitter to prevent erratic jumping
        n_rpm = random.gauss(0, 12.0)
        n_cht = random.gauss(0, 0.4)
        n_egt = random.gauss(0, 1.2)
        n_oil_p = random.gauss(0, 0.02)
        n_oil_t = random.gauss(0, 0.3)
        n_ff = random.gauss(0, 0.08)
        n_vib = random.gauss(0, 0.05)
        n_volt = random.gauss(0, 0.04)
        n_amp = random.gauss(0, 0.3)
        n_timing = random.gauss(0, 0.1)

        # Physical perturbations based on fault injection models
        d_rpm = 0.0
        d_cht = 0.0
        d_egt = 0.0
        d_oil_p = 0.0
        d_oil_t = 0.0
        d_ff = 0.0
        d_vib = 0.0
        d_volt = 0.0
        d_amp = 0.0
        d_timing = 0.0

        if f_type == "Injector Degradation":
            # Cylinder running lean/clogged: EGT surges (+35 to +75°C), ECU trims fuel flow up, slight roughness
            d_egt = 25.0 + sev * 55.0 + random.gauss(0, 3.0)
            d_ff = 0.8 + sev * 2.2
            d_vib = 0.6 + sev * 1.5
            d_cht = 4.0 + sev * 12.0
            d_timing = -1.2 * sev

        elif f_type == "Misfire":
            # Intermittent ignition misfire: sharp RPM drop & hunting, unburnt gas & massive vibration spike
            misfire_cycle = math.sin(self._step_counter * 0.8) > 0.3
            d_rpm = - (150.0 + sev * 400.0) if misfire_cycle else -30.0
            d_vib = 4.0 + sev * 8.5 + random.gauss(0, 0.8)
            d_egt = - (60.0 + sev * 120.0) if misfire_cycle else 20.0
            d_ff = 1.2 * sev

        elif f_type == "Lubrication Degradation":
            # Oil pressure drop, bearing friction rising oil temperature, progressive metal roughness
            d_oil_p = - (1.2 + sev * 2.2) # drops below 3.0 bar
            d_oil_t = 16.0 + sev * 38.0
            d_vib = 1.2 + sev * 3.4
            d_cht = 5.0 + sev * 14.0

        elif f_type == "Cooling Degradation":
            # Heat exchanger fouling or coolant loss: CHT skyrockets, oil temp increases
            d_cht = 32.0 + sev * 68.0
            d_oil_t = 18.0 + sev * 32.0
            d_egt = 8.0 + sev * 18.0
            d_vib = 0.4 + sev * 1.0

        elif f_type == "Overheating":
            # Combined extreme thermal distress
            d_cht = 40.0 + sev * 75.0
            d_oil_t = 28.0 + sev * 45.0
            d_oil_p = - (0.6 + sev * 1.4)
            d_vib = 1.5 + sev * 3.8
            d_egt = 30.0 + sev * 50.0

        elif f_type == "Abnormal Vibration":
            # Propeller imbalance or main bearing micro-damage: massive RMS vibration rise
            d_vib = 3.5 + sev * 8.2 + math.sin(self._step_counter * 1.2) * 1.5
            d_rpm = random.gauss(0, 25.0 * sev)

        elif f_type == "Sensor Drift":
            # Pure instrumentation failure: CHT thermocouple drifts without thermodynamic backing
            d_cht = 38.0 + sev * 55.0
            # EGT and oil stay normal! This tests Digital Twin residual sanity!

        elif f_type == "Combustion Instability":
            # Cyclic hunting and ignition jitter
            instability_phase = math.sin(self._step_counter * 0.5)
            d_egt = instability_phase * (35.0 + sev * 45.0)
            d_rpm = instability_phase * (120.0 + sev * 180.0)
            d_vib = 1.8 + sev * 3.0
            d_timing = instability_phase * 4.0

        observed = EngineState(
            timestamp=expected.timestamp,
            rpm=max(0.0, round(expected.rpm + n_rpm + d_rpm, 1)),
            throttle=expected.throttle,
            engine_load=expected.engine_load,
            altitude=expected.altitude,
            ambient_temperature=expected.ambient_temperature,
            cht=round(expected.cht + n_cht + d_cht, 1),
            egt=round(expected.egt + n_egt + d_egt, 1),
            oil_pressure=max(0.2, round(expected.oil_pressure + n_oil_p + d_oil_p, 2)),
            oil_temperature=round(expected.oil_temperature + n_oil_t + d_oil_t, 1),
            fuel_flow=max(0.5, round(expected.fuel_flow + n_ff + d_ff, 2)),
            vibration=max(0.1, round(expected.vibration + n_vib + d_vib, 2)),
            battery_voltage=round(expected.battery_voltage + n_volt + d_volt, 2),
            alternator_current=round(expected.alternator_current + n_amp + d_amp, 1),
            injection_timing=round(expected.injection_timing + n_timing + d_timing, 1),
            manifold_pressure=expected.manifold_pressure
        )

        return {
            "expected": expected,
            "observed": observed,
            "fault_active": self.active_fault.active,
            "fault_type": self.active_fault.fault_type,
            "fault_severity": self.active_fault.severity
        }

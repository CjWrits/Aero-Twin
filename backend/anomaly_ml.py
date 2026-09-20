"""
AEROTWIN - Machine Learning & Anomaly Detection Module
Uses Scikit-Learn Isolation Forest trained on nominal physics-based aero-piston
engine operating data across various operational envelopes (climb, cruise, loiter, high alt).
"""

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from typing import Dict, Any, List
from backend.engine_models import PhysicsEngineModel, EngineOperatingConditions, EngineState

class EngineAnomalyDetector:
    def __init__(self):
        self.model_label = "Isolation Forest (Prototype / Simulated Training Data)"
        self.model_version = "v1.4.2-aero"
        self.feature_names = [
            "rpm", "cht", "egt", "oil_pressure", "oil_temperature",
            "fuel_flow", "vibration", "injection_timing"
        ]
        self.scaler = StandardScaler()
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.04,
            random_state=42
        )
        self._is_trained = False
        self._baseline_means = {}
        self._baseline_stds = {}
        self.train_on_nominal_envelope()

    def train_on_nominal_envelope(self, sample_count: int = 600):
        """
        Generates synthetic nominal aero-engine telemetry covering full flight regime
        (throttle 0.4 to 0.95, altitude 500m to 6000m, ambient -10°C to +35°C) and fits
        the Isolation Forest anomaly detector.
        """
        physics = PhysicsEngineModel()
        np.random.seed(42)

        data = []
        for _ in range(sample_count):
            th = np.random.uniform(0.40, 0.92)
            load = th * np.random.uniform(0.92, 1.02)
            alt = np.random.uniform(500.0, 5500.0)
            oat = np.random.uniform(-5.0, 32.0)

            cond = EngineOperatingConditions(
                throttle=th,
                engine_load=load,
                altitude=alt,
                ambient_temperature=oat
            )
            st = physics.calculate_expected_state(cond)

            # Add normal sensor noise
            row = [
                st.rpm + np.random.normal(0, 10.0),
                st.cht + np.random.normal(0, 0.5),
                st.egt + np.random.normal(0, 1.5),
                st.oil_pressure + np.random.normal(0, 0.03),
                st.oil_temperature + np.random.normal(0, 0.4),
                st.fuel_flow + np.random.normal(0, 0.1),
                st.vibration + np.random.normal(0, 0.06),
                st.injection_timing + np.random.normal(0, 0.15)
            ]
            data.append(row)

        X = np.array(data)
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        self._is_trained = True

        for i, name in enumerate(self.feature_names):
            self._baseline_means[name] = float(np.mean(X[:, i]))
            self._baseline_stds[name] = float(np.std(X[:, i]))

    def predict_anomaly(self, observed: EngineState, expected: EngineState) -> Dict[str, Any]:
        """
        Evaluates real-time engine telemetry against the trained nominal distribution
        and returns normalized anomaly score, binary flag, and contributing features.
        """
        obs_features = np.array([[
            observed.rpm,
            observed.cht,
            observed.egt,
            observed.oil_pressure,
            observed.oil_temperature,
            observed.fuel_flow,
            observed.vibration,
            observed.injection_timing
        ]])

        obs_scaled = self.scaler.transform(obs_features)
        raw_score = float(self.model.decision_function(obs_scaled)[0])
        # Decision function: positive for inliers, negative for outliers
        # Map raw_score (typically -0.35 to +0.25) to normalized anomaly probability [0.0, 1.0]
        # raw_score ~ 0.15 -> anomaly score 0.05
        # raw_score ~ -0.25 -> anomaly score 0.95
        anomaly_score = 1.0 / (1.0 + np.exp(12.0 * raw_score))
        anomaly_score = round(float(np.clip(anomaly_score, 0.02, 0.99)), 3)

        is_anomaly = anomaly_score > 0.45

        # Compute z-score contributions from residuals
        contributions = []
        residuals = {
            "rpm": observed.rpm - expected.rpm,
            "cht": observed.cht - expected.cht,
            "egt": observed.egt - expected.egt,
            "oil_pressure": observed.oil_pressure - expected.oil_pressure,
            "oil_temperature": observed.oil_temperature - expected.oil_temperature,
            "fuel_flow": observed.fuel_flow - expected.fuel_flow,
            "vibration": observed.vibration - expected.vibration,
            "injection_timing": observed.injection_timing - expected.injection_timing
        }

        for k, diff in residuals.items():
            std = self._baseline_stds.get(k, 1.0)
            z = abs(diff) / max(0.01, std * 0.4)
            if z > 1.8:
                contributions.append({
                    "parameter": k.upper(),
                    "z_score": round(float(z), 2),
                    "residual": round(float(diff), 2)
                })

        # Sort descending by z_score
        contributions.sort(key=lambda x: x["z_score"], reverse=True)

        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": anomaly_score,
            "decision_function": round(raw_score, 4),
            "model_label": self.model_label,
            "model_version": self.model_version,
            "training_sample_count": 600,
            "contributing_features": contributions[:3]
        }

"""
Spring Recharge Suitability ML Model
Uses Random Forest Classifier + Regressor ensemble trained on synthetic
hydro-geological features representative of Western Ghats tribal areas.

For production: replace synthetic training data with real field data
from CGWB, IMD, ISRO Bhuvan datasets.
"""

import os
import json
import logging
import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, accuracy_score
from sklearn.pipeline import Pipeline

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "recharge_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "scaler.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "encoders.pkl")
MODEL_VERSION = "1.0.0"

FEATURE_COLUMNS = [
    "annual_rainfall_mm", "elevation_m", "slope_deg",
    "soil_permeability", "land_use_encoded", "geology_encoded",
    "distance_to_stream_m", "ndvi_value",
    "rainfall_elevation_ratio", "slope_permeability_product"
]

LAND_USE_MAP = {
    "forest": 0, "mixed_forest": 1, "plantation": 2, "grassland": 3,
    "agriculture": 4, "scrubland": 5, "wetland": 6, "barren": 7, "urban": 8,
}

GEOLOGY_MAP = {
    "granite": 0, "basalt": 1, "limestone": 2, "schist": 3,
    "sandstone": 4, "alluvial": 5, "laterite": 6, "quartzite": 7,
}


def encode_features(data: dict) -> np.ndarray:
    """Encode categorical features and engineer new ones."""
    land_use_enc = LAND_USE_MAP.get(str(data.get("land_use_code", "forest")).lower(), 0)
    geology_enc = GEOLOGY_MAP.get(str(data.get("geology_type", "granite")).lower(), 0)

    annual_rainfall = float(data.get("annual_rainfall_mm", 1800))
    elevation = float(data.get("elevation_m", 500))
    slope = float(data.get("slope_deg", 15))
    permeability = float(data.get("soil_permeability", 0.3))
    distance = float(data.get("distance_to_stream_m", 300))
    ndvi = float(data.get("ndvi_value", 0.5))

    # Engineered features
    rainfall_elev_ratio = annual_rainfall / max(elevation, 1)
    slope_perm_product = slope * permeability

    return np.array([[
        annual_rainfall, elevation, slope,
        permeability, land_use_enc, geology_enc,
        distance, ndvi,
        rainfall_elev_ratio, slope_perm_product
    ]])


def generate_training_data(n_samples: int = 2000) -> pd.DataFrame:
    """
    Generate synthetic training data representative of tribal hill areas
    in Western Ghats, Eastern Ghats, and tribal belts of central India.
    """
    np.random.seed(42)
    rng = np.random.default_rng(42)

    land_uses = list(LAND_USE_MAP.keys())
    geologies = list(GEOLOGY_MAP.keys())

    data = {
        "annual_rainfall_mm": rng.normal(2000, 600, n_samples).clip(400, 5000),
        "elevation_m":        rng.normal(600, 350, n_samples).clip(50, 2500),
        "slope_deg":          rng.lognormal(2.5, 0.8, n_samples).clip(1, 60),
        "soil_permeability":  rng.beta(3, 4, n_samples),
        "land_use_code":      rng.choice(land_uses, n_samples),
        "geology_type":       rng.choice(geologies, n_samples),
        "distance_to_stream_m": rng.exponential(400, n_samples).clip(10, 8000),
        "ndvi_value":         rng.beta(4, 3, n_samples) * 0.9,
    }

    df = pd.DataFrame(data)

    # Encode categoricals
    df["land_use_encoded"] = df["land_use_code"].map(LAND_USE_MAP)
    df["geology_encoded"]  = df["geology_type"].map(GEOLOGY_MAP)

    # Feature engineering
    df["rainfall_elevation_ratio"] = df["annual_rainfall_mm"] / (df["elevation_m"] + 1)
    df["slope_permeability_product"] = df["slope_deg"] * df["soil_permeability"]

    # ── Construct ground truth score using domain rules ──────────────────────
    # High rainfall, low slope, high permeability, near stream = high score
    score = (
          (df["annual_rainfall_mm"] / 5000) * 35           # max 35 pts
        + (1 - df["slope_deg"] / 60)       * 20            # max 20 pts
        + df["soil_permeability"]           * 20            # max 20 pts
        + df["ndvi_value"]                  * 15            # max 15 pts
        + (1 - df["distance_to_stream_m"] / 8000) * 10     # max 10 pts
    ) * 100

    # Geology bonus
    geology_bonus = df["geology_type"].map({
        "limestone": 5, "alluvial": 4, "sandstone": 3,
        "laterite": 2, "granite": 1, "basalt": 0,
        "schist": -1, "quartzite": -2,
    }).fillna(0)

    land_use_bonus = df["land_use_code"].map({
        "forest": 8, "mixed_forest": 6, "wetland": 7, "plantation": 4,
        "grassland": 3, "agriculture": 1, "scrubland": 0,
        "barren": -3, "urban": -5,
    }).fillna(0)

    df["recharge_score"] = (score + geology_bonus + land_use_bonus).clip(0, 100)

    # Add noise
    df["recharge_score"] += rng.normal(0, 3, n_samples)
    df["recharge_score"] = df["recharge_score"].clip(0, 100)

    return df


class ModelService:
    _regressor = None
    _scaler = None

    @classmethod
    def load_or_train(cls):
        """Load model from disk or train a new one."""
        if os.path.exists(MODEL_PATH):
            try:
                cls._regressor = joblib.load(MODEL_PATH)
                cls._scaler = joblib.load(SCALER_PATH)
                logger.info(f"✅ Model loaded from {MODEL_PATH}")
                return
            except Exception as e:
                logger.warning(f"Failed to load model: {e}. Retraining...")

        cls.train()

    @classmethod
    def train(cls) -> dict:
        """Train and persist the model."""
        logger.info("🔧 Training recharge model on synthetic data...")
        df = generate_training_data(n_samples=3000)

        X = df[FEATURE_COLUMNS].values
        y = df["recharge_score"].values

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        scaler = StandardScaler()
        X_train_s = scaler.fit_transform(X_train)
        X_test_s  = scaler.transform(X_test)

        model = RandomForestRegressor(
            n_estimators=200,
            max_depth=12,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )
        model.fit(X_train_s, y_train)

        score = r2_score(y_test, model.predict(X_test_s))
        logger.info(f"✅ Model trained | R² = {score:.4f} on {len(X_test)} test samples")

        # Persist
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(model, MODEL_PATH)
        joblib.dump(scaler, SCALER_PATH)

        cls._regressor = model
        cls._scaler = scaler

        return {
            "r2_score": round(score, 4),
            "training_samples": len(X_train),
            "model_version": MODEL_VERSION,
            "features_used": FEATURE_COLUMNS,
        }

    @classmethod
    def predict(cls, features: dict) -> dict:
        """Run prediction and return full result dict."""
        if cls._regressor is None:
            cls.load_or_train()

        X = encode_features(features)
        X_s = cls._scaler.transform(X)

        raw_score = float(cls._regressor.predict(X_s)[0])
        recharge_score = round(max(0.0, min(100.0, raw_score)), 2)

        # Confidence: based on tree variance
        tree_preds = np.array([t.predict(X_s)[0] for t in cls._regressor.estimators_])
        std_dev = float(np.std(tree_preds))
        confidence_score = round(max(0, min(100, 100 - std_dev * 3)), 2)

        # Risk level
        if recharge_score >= 70:
            risk_level = "low"
        elif recharge_score >= 45:
            risk_level = "medium"
        elif recharge_score >= 25:
            risk_level = "high"
        else:
            risk_level = "critical"

        # Interventions based on score & features
        interventions = determine_interventions(recharge_score, features)

        # Feature importances explanation
        importances = dict(zip(FEATURE_COLUMNS, cls._regressor.feature_importances_))
        top_features = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            "recharge_score": recharge_score,
            "confidence_score": confidence_score,
            "risk_level": risk_level,
            "interventions": interventions,
            "model_version": MODEL_VERSION,
            "details": {
                "top_features": [{"feature": k, "importance": round(v, 4)} for k, v in top_features],
                "input_features": features,
                "std_deviation": round(std_dev, 4),
                "explanation": build_explanation(recharge_score, features),
            },
        }


def determine_interventions(score: float, features: dict) -> list:
    """Rule-based intervention recommendation."""
    interventions = []
    slope = float(features.get("slope_deg", 15))
    rainfall = float(features.get("annual_rainfall_mm", 1800))
    distance = float(features.get("distance_to_stream_m", 300))
    permeability = float(features.get("soil_permeability", 0.3))

    if slope > 20:
        interventions.append("contour_trench")
    if slope < 15 and rainfall > 1500:
        interventions.append("check_dam")
    if permeability > 0.5 and rainfall > 1200:
        interventions.append("recharge_pit")
    if distance > 500 and score < 60:
        interventions.append("percolation_tank")
    if score >= 50:
        interventions.append("spring_protection")
    if slope > 30:
        interventions.append("gabion_structure")

    return list(set(interventions)) if interventions else ["spring_protection"]


def build_explanation(score: float, features: dict) -> str:
    """Generate human-readable explanation of the prediction."""
    parts = []
    rainfall = float(features.get("annual_rainfall_mm", 1800))
    slope = float(features.get("slope_deg", 15))
    permeability = float(features.get("soil_permeability", 0.3))
    ndvi = float(features.get("ndvi_value", 0.5))

    if rainfall > 2000:
        parts.append("high annual rainfall favouring infiltration")
    elif rainfall < 1000:
        parts.append("low rainfall limiting recharge potential")

    if slope < 10:
        parts.append("gentle terrain promoting water retention")
    elif slope > 30:
        parts.append("steep slope increasing surface runoff")

    if permeability > 0.6:
        parts.append("highly permeable soils ideal for recharge")
    elif permeability < 0.2:
        parts.append("low soil permeability restricting infiltration")

    if ndvi > 0.6:
        parts.append("dense vegetation cover reducing evapotranspiration loss")

    prefix = {
        range(70, 101): "High recharge potential due to",
        range(45, 70):  "Moderate recharge potential — site shows",
        range(25, 45):  "Low recharge potential — challenges include",
        range(0, 25):   "Very low recharge potential — critical issues:",
    }

    label = "Recharge analysis:"
    for r, p in prefix.items():
        if int(score) in r:
            label = p
            break

    return f"{label} {', '.join(parts) if parts else 'standard hydro-geological conditions'}."

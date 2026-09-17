"""
Pydantic schemas for AI service request/response validation
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class InterventionType(str, Enum):
    CHECK_DAM = "check_dam"
    RECHARGE_PIT = "recharge_pit"
    CONTOUR_TRENCH = "contour_trench"
    PERCOLATION_TANK = "percolation_tank"
    SPRING_PROTECTION = "spring_protection"
    GABION_STRUCTURE = "gabion_structure"


class PredictionRequest(BaseModel):
    """Input features for spring recharge suitability prediction"""

    latitude: float = Field(..., ge=8.0, le=37.0, description="Latitude (India range)")
    longitude: float = Field(..., ge=68.0, le=97.0, description="Longitude (India range)")

    # Hydro-meteorological
    annual_rainfall_mm: float = Field(1800.0, ge=0, le=10000, description="Annual rainfall in mm")

    # Terrain
    elevation_m: float = Field(500.0, ge=0, le=8848, description="Elevation in metres")
    slope_deg: float = Field(15.0, ge=0, le=90, description="Slope in degrees")

    # Soil / geology
    soil_permeability: float = Field(
        0.3, ge=0.0, le=1.0,
        description="Soil permeability index (0=impermeable, 1=highly permeable)"
    )
    land_use_code: str = Field("forest", description="Land use classification")
    geology_type: str = Field("granite", description="Dominant geology type")

    # Hydrological
    distance_to_stream_m: float = Field(
        300.0, ge=0, le=50000,
        description="Distance to nearest stream/river in metres"
    )
    ndvi_value: float = Field(
        0.5, ge=-1.0, le=1.0,
        description="Normalised Difference Vegetation Index"
    )

    @field_validator("land_use_code")
    @classmethod
    def validate_land_use(cls, v: str) -> str:
        valid = {"forest", "grassland", "agriculture", "scrubland", "urban",
                 "barren", "wetland", "plantation", "mixed_forest"}
        return v if v in valid else "mixed_forest"


class PredictionResponse(BaseModel):
    """AI model output"""

    recharge_score: float = Field(..., ge=0, le=100, description="Recharge suitability score 0-100")
    confidence_score: float = Field(..., ge=0, le=100, description="Model confidence 0-100")
    risk_level: RiskLevel
    interventions: List[InterventionType]
    model_version: str = "1.0.0"

    details: Dict[str, Any] = Field(
        default_factory=dict,
        description="Detailed explanation of the prediction"
    )


class BatchPredictionRequest(BaseModel):
    locations: List[PredictionRequest]


class TrainResponse(BaseModel):
    status: str
    accuracy: float
    model_version: str
    features_used: List[str]
    training_samples: int

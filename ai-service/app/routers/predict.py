"""
Prediction router — handles single and batch predictions
"""

from fastapi import APIRouter, HTTPException
from app.models.schemas import PredictionRequest, PredictionResponse, BatchPredictionRequest
from app.services.model_service import ModelService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=PredictionResponse)
async def predict_single(request: PredictionRequest):
    """
    Predict recharge suitability score for a single location.

    Returns:
    - recharge_score: 0–100 (higher = better recharge potential)
    - confidence_score: model confidence percentage
    - risk_level: low | medium | high | critical
    - interventions: recommended recharge structures
    - details: feature importances and explanation
    """
    try:
        features = request.model_dump()
        result = ModelService.predict(features)
        return result
    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/batch")
async def predict_batch(request: BatchPredictionRequest):
    """Batch predict for multiple locations."""
    results = []
    for loc in request.locations:
        try:
            features = loc.model_dump()
            result = ModelService.predict(features)
            result["latitude"] = loc.latitude
            result["longitude"] = loc.longitude
            results.append(result)
        except Exception as e:
            results.append({
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "error": str(e)
            })

    return {"predictions": results, "total": len(results)}

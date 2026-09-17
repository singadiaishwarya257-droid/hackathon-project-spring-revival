from fastapi import APIRouter
from datetime import datetime
from app.services.model_service import ModelService, MODEL_VERSION

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "spring-revival-ai",
        "model_loaded": ModelService._regressor is not None,
        "model_version": MODEL_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
    }

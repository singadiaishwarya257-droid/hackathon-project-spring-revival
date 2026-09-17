from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.model_service import ModelService, MODEL_VERSION, FEATURE_COLUMNS
from app.models.schemas import TrainResponse
import os

router = APIRouter()
security = HTTPBearer(auto_error=False)

TRAIN_SECRET = os.getenv("TRAIN_SECRET", "changeme-train-secret")


@router.post("", response_model=TrainResponse)
async def retrain_model(
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Retrain the ML model. Requires Bearer token matching TRAIN_SECRET env var.
    Training runs synchronously here; use BackgroundTasks for async in production.
    """
    if not credentials or credentials.credentials != TRAIN_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    result = ModelService.train()

    return TrainResponse(
        status="trained",
        accuracy=result["r2_score"],
        model_version=result["model_version"],
        features_used=result["features_used"],
        training_samples=result["training_samples"],
    )

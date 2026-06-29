from fastapi import APIRouter

from app.schemas.health import HealthResponse


router = APIRouter(tags=["Health"])


@router.get("/", response_model=HealthResponse)
def home() -> HealthResponse:
    return HealthResponse(
        status="success",
        message="AI Beauty Recommendation API Running",
    )

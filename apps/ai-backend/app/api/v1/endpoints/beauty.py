from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.beauty_profile import BeautyProfile, BeautyProfileRequest
from app.services.beauty.beauty_profile_service import BeautyProfileService

router = APIRouter(tags=["Beauty Profile - Phase 5"])


def get_beauty_profile_service() -> BeautyProfileService:
    return BeautyProfileService()


@router.post(
    "/beauty/profile",
    response_model=BeautyProfile,
    summary="Generate Beauty Profile from Face Analysis Results",
    response_description="Returns the classified face shape, skin tone, undertone, and key structural features.",
)
def generate_beauty_profile(
    payload: BeautyProfileRequest,
    beauty_service: BeautyProfileService = Depends(get_beauty_profile_service),
) -> BeautyProfile:
    """
    Generate a complete beauty profile based on face shape, skin tone, undertone,
    and detailed key measurements. Uses coordinates (if landmarks are provided)
    to compute symmetry.
    """
    return beauty_service.generate_profile(
        face_shape=payload.face_shape,
        skin_tone=payload.skin_tone,
        undertone=payload.undertone,
        measurements=payload.measurements,
        landmarks=payload.landmarks,
    )

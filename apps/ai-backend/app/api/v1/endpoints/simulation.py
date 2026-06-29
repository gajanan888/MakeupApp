from uuid import uuid4
import cv2
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.schemas.makeup_recommendation import RecommendedLook
from app.services.vision.landmark_service import LandmarkService
from app.services.beauty.face_shape_service import FaceShapeService
from app.services.beauty.skin_tone_service import SkinToneService
from app.services.beauty.makeup_recommendation_service import MakeupRecommendationService
from app.services.beauty.makeup_simulation_service import MakeupSimulationService
from app.utils.image_io import read_upload_as_image

router = APIRouter(prefix="/simulation", tags=["Simulation - Phase 6"])


def get_landmark_service() -> LandmarkService:
    return LandmarkService()


def get_face_shape_service() -> FaceShapeService:
    return FaceShapeService()


def get_skin_tone_service() -> SkinToneService:
    return SkinToneService()


def get_makeup_recommendation_service() -> MakeupRecommendationService:
    return MakeupRecommendationService()


def get_makeup_simulation_service() -> MakeupSimulationService:
    return MakeupSimulationService()


@router.post(
    "/makeup",
    summary="Simulate Makeup Application on Face Image",
    response_description="Applies foundation, lipstick, blush, eyeshadow, and liner overlays on the face image.",
)
async def simulate_makeup(
    look_id: str,
    step: int = 3,
    lash_intensity: float = 0.8,
    lash_style: str | None = None,
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
    landmark_service: LandmarkService = Depends(get_landmark_service),
    face_shape_service: FaceShapeService = Depends(get_face_shape_service),
    skin_tone_service: SkinToneService = Depends(get_skin_tone_service),
    recommendation_service: MakeupRecommendationService = Depends(get_makeup_recommendation_service),
    simulation_service: MakeupSimulationService = Depends(get_makeup_simulation_service),
) -> dict:
    """
    Applies recommended makeup shades dynamically onto the face photo:
    - **look_id**: The ID of the makeup look (e.g. natural_glow, soft_glam).
    - **step**: The tutorial step (1 = Foundation Base only, 2 = Eyes only, 3 = Complete Look).
    """
    try:
        # 1. Read uploaded image
        image, _ = await read_upload_as_image(file, settings)

        # 2. Extract landmarks
        try:
            landmark_result = landmark_service.extract(image=image)
        except Exception:
            raise HTTPException(status_code=400, detail="No face detected in the image.")

        if not landmark_result.face_detected or not landmark_result.landmarks:
            raise HTTPException(status_code=400, detail="No face detected in the image.")

        first_face = landmark_result.landmarks[0]

        face_for_classification = first_face
        if hasattr(landmark_result, "normalized_landmarks") and isinstance(landmark_result.normalized_landmarks, list) and landmark_result.normalized_landmarks:
            face_for_classification = landmark_result.normalized_landmarks[0]

        # 3. Classify Face Shape & Skin Tone to determine personalized colors
        face_shape, _, _ = face_shape_service.classify(face_for_classification)
        try:
            skin_result = skin_tone_service.analyze(image, first_face)
        except ValueError:
            raise HTTPException(status_code=400, detail="Unable to determine skin tone features.")

        # 4. Get look recommendations with customized colors
        looks = recommendation_service.get_recommendations(
            face_shape=face_shape,
            skin_tone=skin_result["skin_tone"],
            undertone=skin_result["undertone"],
            db=db,
        )

        # Find the matching look
        look = next((l for l in looks if l.id == look_id), None)
        if not look:
            raise HTTPException(
                status_code=404,
                detail=f"Look '{look_id}' is not suitable or not found for your face profile.",
            )

        # 5. Run simulation drawing overlays for all three steps
        settings.generated_dir.mkdir(parents=True, exist_ok=True)
        urls = {}
        for s in [1, 2, 3]:
            simulated_image = simulation_service.simulate(
                image=image.copy(),  # Copy image to avoid drawing cumulatively on the same canvas
                landmarks=first_face,
                look=look,
                step=s,
                lash_intensity=lash_intensity,
                lash_style=lash_style,
            )
            filename = f"{uuid4().hex}.jpg"
            file_path = settings.generated_dir / filename
            cv2.imwrite(str(file_path), simulated_image)
            urls[str(s)] = f"/generated/{filename}"

        # Return static access URLs for all steps (keeping simulated_image_url for compatibility)
        return {
            "simulated_image_url": urls[str(step)] if str(step) in urls else urls["3"],
            "steps": urls
        }


    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Makeup simulation failed: {str(error)}",
        ) from error

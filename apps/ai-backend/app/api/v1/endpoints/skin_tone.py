from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.config import Settings, get_settings
from app.core.errors import AIServiceError, to_http_exception
from app.schemas.skin_tone import SkinToneResponse
from app.services.beauty.skin_tone_service import SkinToneService
from app.services.vision.landmark_service import LandmarkService
from app.utils.image_io import read_upload_as_image

router = APIRouter(prefix="/vision", tags=["Vision - Phase 4"])


def get_landmark_service() -> LandmarkService:
    return LandmarkService()


def get_skin_tone_service() -> SkinToneService:
    return SkinToneService()


@router.post(
    "/skin-tone",
    response_model=SkinToneResponse,
    summary="Analyze Skin Tone and Undertone from Uploaded Image",
    response_description="Returns classified skin tone, undertone, confidence scores, and average RGB/LAB values.",
)
async def analyze_skin_tone(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
    landmark_service: LandmarkService = Depends(get_landmark_service),
    skin_tone_service: SkinToneService = Depends(get_skin_tone_service),
) -> SkinToneResponse:
    """
    Upload an image of a face, extract facial landmarks, mask the cheek and forehead areas,
    and classify the skin tone and undertone.

    Returns:
    - **face_detected**: Boolean flag indicating if any face was found.
    - **skin_tone**: Classified skin tone: Fair, Light, Medium, Tan, Deep.
    - **skin_tone_confidence**: Similarity confidence score.
    - **undertone**: Classified undertone: Warm, Cool, Neutral.
    - **undertone_confidence**: Similarity confidence score.
    - **average_rgb**: Rounded average RGB list.
    - **average_lab**: Rounded average LAB list in standard range ([0,100], [-128,127], [-128,127]).
    - **message**: Present when face_detected is False.
    - **error**: Present when face_detected is True but skin pixels cannot be analyzed.
    """
    try:
        # Read upload and convert to OpenCV numpy array
        image, _ = await read_upload_as_image(file, settings)

        # Run face landmark extraction
        try:
            landmark_result = landmark_service.extract(image=image)
        except Exception:
            return SkinToneResponse(
                face_detected=False,
                message="No face detected",
            )

        # Handle cases with no detected faces
        if not landmark_result.face_detected or not landmark_result.landmarks:
            return SkinToneResponse(
                face_detected=False,
                message="No face detected",
            )

        # Use landmarks of the first detected face
        first_face = landmark_result.landmarks[0]

        try:
            result = skin_tone_service.analyze(image, first_face)
        except ValueError:
            return SkinToneResponse(
                face_detected=True,
                error="Unable to determine skin tone",
            )

        return SkinToneResponse(
            face_detected=True,
            skin_tone=result["skin_tone"],
            skin_tone_confidence=result["skin_tone_confidence"],
            undertone=result["undertone"],
            undertone_confidence=result["undertone_confidence"],
            average_rgb=result["average_rgb"],
            average_lab=result["average_lab"],
        )
    except AIServiceError as error:
        raise to_http_exception(error) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Skin tone analysis failed: {str(error)}",
        ) from error

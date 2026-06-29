from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.config import Settings, get_settings
from app.core.errors import AIServiceError, to_http_exception
from app.schemas.face_shape import FaceShapeResponse
from app.services.beauty.face_shape_service import FaceShapeService
from app.services.vision.landmark_service import LandmarkService
from app.utils.image_io import read_upload_as_image

router = APIRouter(prefix="/vision", tags=["Vision - Phase 3"])


def get_landmark_service() -> LandmarkService:
    return LandmarkService()


def get_face_shape_service() -> FaceShapeService:
    return FaceShapeService()


@router.post(
    "/face-shape",
    response_model=FaceShapeResponse,
    summary="Classify Face Shape from Uploaded Image",
    response_description="Returns classified face shape (Oval, Round, Square, Rectangle, Heart, Diamond), confidence score, and facial measurements.",
)
async def classify_face_shape(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
    landmark_service: LandmarkService = Depends(get_landmark_service),
    face_shape_service: FaceShapeService = Depends(get_face_shape_service),
) -> FaceShapeResponse:
    """
    Upload an image of a face, extract landmarks, calculate horizontal and vertical
    facial proportions, and classify the face shape.

    Renders responses conformant to the AI Beauty Recommendation pipeline:
    - **face_detected**: Boolean flag indicating if any face was found.
    - **face_shape**: String representing the final geometric classification.
    - **confidence**: Score representing how well the facial ratios align with the ideal shape proportions.
    - **measurements**: Object containing pixel dimensions and ratios.
    """
    try:
        # Read upload and convert to OpenCV numpy array
        image, _ = await read_upload_as_image(file, settings)

        # Run face landmark extraction
        try:
            landmark_result = landmark_service.extract(image=image)
        except Exception:
            # Handles cases where landmarks fall outside [0, 1] due to cropped features,
            # causing Pydantic schema validation to fail.
            return FaceShapeResponse(
                face_detected=False,
                message="No face detected",
            )

        # Handle cases with no detected faces
        if not landmark_result.face_detected or not landmark_result.landmarks:
            return FaceShapeResponse(
                face_detected=False,
                message="No face detected",
            )

        # Use landmarks of the first detected face to classify shape
        first_face = landmark_result.landmarks[0]

        # Check if the face is partially cut off at the boundaries (e.g. missing forehead)
        if face_shape_service.is_face_cropped(
            first_face, landmark_result.image_width, landmark_result.image_height
        ):
            return FaceShapeResponse(
                face_detected=False,
                message="No face detected",
            )

        face_for_classification = first_face
        if hasattr(landmark_result, "normalized_landmarks") and isinstance(landmark_result.normalized_landmarks, list) and landmark_result.normalized_landmarks:
            face_for_classification = landmark_result.normalized_landmarks[0]
            
        face_shape, confidence, measurements = face_shape_service.classify(face_for_classification)

        return FaceShapeResponse(
            face_detected=True,
            face_shape=face_shape,
            confidence=confidence,
            measurements=measurements,
        )
    except AIServiceError as error:
        raise to_http_exception(error) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Face shape classification failed: {str(error)}",
        ) from error

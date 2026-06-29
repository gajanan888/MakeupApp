from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.config import Settings, get_settings
from app.core.errors import AIServiceError, to_http_exception
from app.schemas.face import FaceDetectionResponse
from app.services.vision.face_detection_service import FaceDetectionService
from app.utils.image_io import read_upload_as_image, save_upload


router = APIRouter(prefix="/vision", tags=["Vision - Phase 1"])


def get_face_detection_service() -> FaceDetectionService:
    return FaceDetectionService()


@router.post("/detect-face", response_model=FaceDetectionResponse)
async def detect_face(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
    service: FaceDetectionService = Depends(get_face_detection_service),
) -> FaceDetectionResponse:
    try:
        image, content = await read_upload_as_image(file, settings)
        saved_path = save_upload(content, file.filename, settings.upload_dir)
        return service.detect(image=image, saved_image_path=str(saved_path))
    except AIServiceError as error:
        raise to_http_exception(error) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Face detection failed.",
        ) from error

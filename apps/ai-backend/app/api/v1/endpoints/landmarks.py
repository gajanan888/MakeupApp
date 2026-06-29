from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.config import Settings, get_settings
from app.core.errors import AIServiceError, to_http_exception
from app.schemas.face import FaceLandmarkResponse
from app.services.vision.landmark_service import LandmarkService
from app.utils.image_io import read_upload_as_image, save_upload


router = APIRouter(prefix="/vision", tags=["Vision - Phase 2"])


def get_landmark_service() -> LandmarkService:
    return LandmarkService()


@router.post("/extract-landmarks", response_model=FaceLandmarkResponse)
async def extract_landmarks(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
    service: LandmarkService = Depends(get_landmark_service),
) -> FaceLandmarkResponse:
    try:
        image, content = await read_upload_as_image(file, settings)
        saved_path = save_upload(content, file.filename, settings.upload_dir)
        return service.extract(image=image, saved_image_path=str(saved_path))
    except AIServiceError as error:
        raise to_http_exception(error) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Face landmark extraction failed.",
        ) from error

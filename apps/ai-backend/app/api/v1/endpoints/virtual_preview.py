import logging
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database.session import get_preview_db
from app.models.virtual_preview import (
    SelfieModel,
    FaceAnalysisModel,
    ChatSessionModel,
    MakeupPreviewModel,
)
from app.schemas.virtual_preview import (
    SelfieResponse,
    ValidateImageRequest,
    ValidationResponse,
    AnalyzeFaceRequest,
    FaceAnalysisResponse,
    ChatRequest,
    ChatResponse,
    GeneratePromptRequest,
    PromptGenerationResponse,
    GeneratePreviewRequest,
    PreviewResponse,
    SubmitPreferencesRequest,
)
from app.config.config import get_preview_settings
from app.storage.service import StorageService
from app.validation.service import ImageValidationService
from app.vision.service import FaceVisionService
from app.parsing.service import FaceParsingService
from app.gemini.service import GeminiService
from app.generation.service import ImageGenerationService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/virtual-preview", tags=["Virtual Makeup Preview"])
settings = get_preview_settings()


@router.post(
    "/upload",
    response_model=SelfieResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a user selfie",
)
async def upload_selfie(
    file: UploadFile = File(...),
    db: Session = Depends(get_preview_db),
    storage: StorageService = Depends(),
) -> SelfieResponse:
    """
    Uploads a user selfie, saves it locally or to Cloudinary, and registers a record in the database.
    """
    try:
        # Validate file type
        if file.content_type not in settings.allowed_image_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image type. Allowed: {settings.allowed_image_types}",
            )

        # Read file bytes to check size
        file_bytes = await file.read()
        if len(file_bytes) > settings.max_upload_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {settings.max_upload_size_mb}MB.",
            )

        # Save upload using storage service
        file_path, image_url = await storage.save_upload(file_bytes, file.filename or "upload.jpg")

        # Create database record
        selfie = SelfieModel(
            filename=file.filename or "upload.jpg",
            file_path=file_path,
            image_url=image_url,
        )
        db.add(selfie)
        db.commit()
        db.refresh(selfie)

        logger.info(f"Selfie registered in database: {selfie.id}")
        return selfie
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload selfie: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload selfie: {str(e)}",
        )


@router.post(
    "/validate-image",
    response_model=ValidationResponse,
    summary="Validate selfie image quality",
)
async def validate_image(
    request: ValidateImageRequest,
    db: Session = Depends(get_preview_db),
    validator: ImageValidationService = Depends(),
) -> ValidationResponse:
    """
    Performs quality and suitability validation on the uploaded selfie.
    """
    selfie = db.query(SelfieModel).filter(SelfieModel.id == request.selfie_id).first()
    if not selfie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Selfie not found.",
        )

    try:
        is_valid, error_msg, checks = await validator.validate(selfie)
        
        # Update database
        selfie.is_valid = is_valid  # type: ignore
        selfie.validation_error = error_msg if not is_valid else None  # type: ignore
        db.commit()

        return ValidationResponse(
            selfie_id=str(selfie.id),
            is_valid=is_valid,
            error_message=str(selfie.validation_error) if selfie.validation_error else None,
            checks_passed=checks,
        )
    except Exception as e:
        logger.error(f"Validation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation failed: {str(e)}",
        )


@router.post(
    "/analyze-face",
    response_model=FaceAnalysisResponse,
    summary="Detect landmarks and parse face masks",
)
async def analyze_face(
    request: AnalyzeFaceRequest,
    db: Session = Depends(get_preview_db),
    vision: FaceVisionService = Depends(),
    parser: FaceParsingService = Depends(),
) -> FaceAnalysisResponse:
    """
    Detects face landmarks and runs semantic face parsing to generate individual masks.
    """
    selfie = db.query(SelfieModel).filter(SelfieModel.id == request.selfie_id).first()
    if not selfie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Selfie not found.",
        )

    if selfie.is_valid is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot analyze an invalid selfie. Please upload a higher quality front-facing photo.",
        )

    try:
        # 1. Detect landmarks
        landmarks = await vision.detect_landmarks(selfie)
        
        # 2. Parse face masks
        masks = await parser.generate_masks(selfie, landmarks)

        # 3. Save or update face analysis record
        analysis = db.query(FaceAnalysisModel).filter(FaceAnalysisModel.selfie_id == selfie.id).first()
        if not analysis:
            analysis = FaceAnalysisModel(selfie_id=selfie.id)
            db.add(analysis)
            
        analysis.landmarks = landmarks  # type: ignore
        analysis.lip_mask_path = masks.get("lip")  # type: ignore
        analysis.eye_mask_path = masks.get("eye")  # type: ignore
        analysis.eyebrow_mask_path = masks.get("eyebrow")  # type: ignore
        analysis.hair_mask_path = masks.get("hair")  # type: ignore
        analysis.skin_mask_path = masks.get("skin")  # type: ignore
        analysis.cheek_mask_path = masks.get("cheek")  # type: ignore
        analysis.forehead_mask_path = masks.get("forehead")  # type: ignore
        analysis.jawline_mask_path = masks.get("jawline")  # type: ignore
        
        db.commit()
        db.refresh(analysis)

        return FaceAnalysisResponse(
            selfie_id=str(selfie.id),
            landmarks=analysis.landmarks,  # type: ignore
            masks={
                "lip": str(analysis.lip_mask_path) if analysis.lip_mask_path else None,
                "eye": str(analysis.eye_mask_path) if analysis.eye_mask_path else None,
                "eyebrow": str(analysis.eyebrow_mask_path) if analysis.eyebrow_mask_path else None,
                "hair": str(analysis.hair_mask_path) if analysis.hair_mask_path else None,
                "skin": str(analysis.skin_mask_path) if analysis.skin_mask_path else None,
                "cheek": str(analysis.cheek_mask_path) if analysis.cheek_mask_path else None,
                "forehead": str(analysis.forehead_mask_path) if analysis.forehead_mask_path else None,
                "jawline": str(analysis.jawline_mask_path) if analysis.jawline_mask_path else None,
            }
        )
    except Exception as e:
        logger.error(f"Face analysis failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face analysis failed: {str(e)}",
        )


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Interact with Gemini for makeup preferences",
)
async def chat_turn(
    request: ChatRequest,
    db: Session = Depends(get_preview_db),
    gemini: GeminiService = Depends(),
) -> ChatResponse:
    """
    Handles a conversation turn with Gemini to collect makeup preferences.
    """
    session = None
    
    # Retrieve or create session
    if request.chat_session_id:
        session = db.query(ChatSessionModel).filter(ChatSessionModel.id == request.chat_session_id).first()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found.",
            )
    elif request.selfie_id:
        # Verify selfie exists
        selfie = db.query(SelfieModel).filter(SelfieModel.id == request.selfie_id).first()
        if not selfie:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selfie not found.",
            )
        session = ChatSessionModel(selfie_id=request.selfie_id)
        db.add(session)
        db.commit()
        db.refresh(session)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either selfie_id or chat_session_id must be provided to chat.",
        )

    try:
        reply, is_complete, preferences = await gemini.process_chat_turn(session, request.message)
        
        session.is_complete = is_complete  # type: ignore
        if is_complete and preferences:
            session.preferences = preferences  # type: ignore
            
        db.commit()

        return ChatResponse(
            chat_session_id=str(session.id),
            reply=reply,
            is_complete=is_complete,
            preferences=session.preferences,  # type: ignore
        )
    except Exception as e:
        logger.error(f"Chat turn failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat turn failed: {str(e)}",
        )


@router.post(
    "/generate-prompt",
    response_model=PromptGenerationResponse,
    summary="Generate optimized image editing prompt",
)
async def generate_prompt(
    request: GeneratePromptRequest,
    db: Session = Depends(get_preview_db),
    gemini: GeminiService = Depends(),
) -> PromptGenerationResponse:
    """
    Converts collected preferences JSON into an optimized image editing prompt.
    """
    session = db.query(ChatSessionModel).filter(ChatSessionModel.id == request.chat_session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found.",
        )

    if not session.is_complete or not session.preferences:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate prompt. Preference collection is not complete yet.",
        )

    try:
        prompt = await gemini.generate_prompt(session.preferences)  # type: ignore
        return PromptGenerationResponse(
            chat_session_id=str(session.id),
            prompt=prompt,
        )
    except Exception as e:
        logger.error(f"Prompt generation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prompt generation failed: {str(e)}",
        )


@router.post(
    "/generate-preview",
    response_model=PreviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate virtual makeup preview",
)
async def generate_preview(
    request: GeneratePreviewRequest,
    db: Session = Depends(get_preview_db),
    generator: ImageGenerationService = Depends(),
) -> PreviewResponse:
    """
    Edits the selfie image to apply the requested makeup based on the prompt and parsed face masks.
    """
    selfie = db.query(SelfieModel).filter(SelfieModel.id == request.selfie_id).first()
    if not selfie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Selfie not found.",
        )

    analysis = db.query(FaceAnalysisModel).filter(FaceAnalysisModel.selfie_id == selfie.id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selfie must be analyzed before generating a preview. Please call /analyze-face first.",
        )

    # Fetch preferences from chat session if available
    preferences = {}
    if request.chat_session_id:
        session = db.query(ChatSessionModel).filter(ChatSessionModel.id == request.chat_session_id).first()
        if session and session.preferences:
            preferences = session.preferences

    try:
        masks = {
            "lip": analysis.lip_mask_path,
            "eye": analysis.eye_mask_path,
            "eyebrow": analysis.eyebrow_mask_path,
            "hair": analysis.hair_mask_path,
            "skin": analysis.skin_mask_path,
            "cheek": analysis.cheek_mask_path,
            "forehead": analysis.forehead_mask_path,
            "jawline": analysis.jawline_mask_path,
        }
        
        edited_image_url, quality_score = await generator.generate_makeup_preview(
            selfie, request.prompt, masks, preferences  # type: ignore
        )

        preview = MakeupPreviewModel(
            selfie_id=selfie.id,
            chat_session_id=request.chat_session_id,
            prompt=request.prompt,
            edited_image_url=edited_image_url,
            quality_score=quality_score,
        )
        db.add(preview)
        db.commit()
        db.refresh(preview)

        if request.chat_session_id:
            session = db.query(ChatSessionModel).filter(ChatSessionModel.id == request.chat_session_id).first()
            if session:
                preview.preferences = session.preferences

        preview.selfie_image_url = selfie.image_url
        return preview
    except Exception as e:
        logger.error(f"Preview generation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Preview generation failed: {str(e)}",
        )


@router.get(
    "/preview/{id}",
    response_model=PreviewResponse,
    summary="Get virtual makeup preview by ID",
)
async def get_preview(
    id: str,
    db: Session = Depends(get_preview_db),
) -> PreviewResponse:
    """
    Retrieves a previously generated virtual makeup preview by its ID.
    """
    preview = db.query(MakeupPreviewModel).filter(MakeupPreviewModel.id == id).first()
    if not preview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preview not found.",
        )
        
    if preview.chat_session_id:
        session = db.query(ChatSessionModel).filter(ChatSessionModel.id == preview.chat_session_id).first()
        if session:
            preview.preferences = session.preferences
            
    if preview.selfie:
        preview.selfie_image_url = preview.selfie.image_url
            
    return preview


@router.post(
    "/submit-preferences",
    response_model=ChatResponse,
    summary="Submit all makeup preferences at once from the questionnaire form",
)
async def submit_preferences(
    request: SubmitPreferencesRequest,
    db: Session = Depends(get_preview_db),
    gemini: GeminiService = Depends(),
) -> ChatResponse:
    """
    Submits all collected questionnaire preferences at once, compiles specific cosmetic options, and prepares for generation.
    """
    try:
        # Create session
        session = ChatSessionModel(selfie_id=request.selfie_id)
        session.is_complete = True  # type: ignore
        
        # Populate history with form values for compatibility
        history = []
        for key, value in request.preferences.items():
            history.append({"role": "model", "content": f"Form value for {key}", "key": key})
            history.append({"role": "user", "content": str(value), "key": key})
        session.history = history  # type: ignore
        
        # Compile preferences (calls Gemini for MUA product matching)
        compiled_prefs = await gemini._compile_preferences(history)
        session.preferences = compiled_prefs  # type: ignore
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return ChatResponse(
            chat_session_id=str(session.id),
            reply="Preferences submitted successfully.",
            is_complete=True,
            preferences=session.preferences,  # type: ignore
        )
    except Exception as e:
        logger.error(f"Failed to submit preferences: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit preferences: {str(e)}",
        )


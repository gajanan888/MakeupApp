from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class SelfieResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    image_url: Optional[str] = None
    created_at: datetime


class ValidateImageRequest(BaseModel):
    selfie_id: str


class ValidationResponse(BaseModel):
    selfie_id: str
    is_valid: bool
    error_message: Optional[str] = None
    checks_passed: dict[str, bool] = Field(
        default_factory=lambda: {
            "exactly_one_face": False,
            "front_facing": False,
            "min_resolution": False,
            "no_sunglasses": False,
            "no_heavy_filters": False,
            "eyes_visible": False,
            "lighting_acceptable": False,
            "not_blurry": False,
        }
    )


class AnalyzeFaceRequest(BaseModel):
    selfie_id: str


class FaceAnalysisResponse(BaseModel):
    selfie_id: str
    landmarks: Optional[dict[str, Any]] = None
    masks: dict[str, Optional[str]] = Field(
        default_factory=lambda: {
            "lip": None,
            "eye": None,
            "eyebrow": None,
            "hair": None,
            "skin": None,
            "cheek": None,
            "forehead": None,
            "jawline": None,
        }
    )


class ChatRequest(BaseModel):
    selfie_id: Optional[str] = None
    chat_session_id: Optional[str] = None
    message: str


class ChatResponse(BaseModel):
    chat_session_id: str
    reply: str
    is_complete: bool
    preferences: Optional[dict[str, Any]] = None


class GeneratePromptRequest(BaseModel):
    chat_session_id: str


class PromptGenerationResponse(BaseModel):
    chat_session_id: str
    prompt: str


class GeneratePreviewRequest(BaseModel):
    selfie_id: str
    prompt: str
    chat_session_id: Optional[str] = None


class PreviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    selfie_id: str
    chat_session_id: Optional[str] = None
    prompt: Optional[str] = None
    edited_image_url: Optional[str] = None
    selfie_image_url: Optional[str] = None
    quality_score: Optional[float] = None
    preferences: Optional[dict[str, Any]] = None
    created_at: datetime


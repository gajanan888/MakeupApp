from pydantic import BaseModel, Field


class SkinToneResponse(BaseModel):
    """Response schema for skin tone and undertone analysis."""

    face_detected: bool = Field(
        ...,
        description="True if a face was detected and processed; False otherwise."
    )
    skin_tone: str | None = Field(
        default=None,
        description="Classified skin tone: Fair, Light, Medium, Tan, Deep."
    )
    skin_tone_confidence: float | None = Field(
        default=None,
        description="Confidence score for the skin tone classification (0.0 to 1.0)."
    )
    undertone: str | None = Field(
        default=None,
        description="Classified undertone: Warm, Cool, Neutral."
    )
    undertone_confidence: float | None = Field(
        default=None,
        description="Confidence score for the undertone classification (0.0 to 1.0)."
    )
    average_rgb: list[int] | None = Field(
        default=None,
        description="Average RGB color values of the extracted skin region."
    )
    average_lab: list[int] | None = Field(
        default=None,
        description="Average LAB color values (L in [0, 100], a,b in [-128, 127]) of the extracted skin region."
    )
    message: str | None = Field(
        default=None,
        description="Status message (e.g. 'No face detected')."
    )
    error: str | None = Field(
        default=None,
        description="Error message if processing fails (e.g. 'Unable to determine skin tone')."
    )

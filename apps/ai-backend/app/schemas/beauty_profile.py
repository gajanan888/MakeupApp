from pydantic import BaseModel, Field
from app.schemas.face import FaceLandmark
from app.schemas.face_shape import FaceMeasurements


class BeautyFeatures(BaseModel):
    """Specific facial characteristics analyzed from landmarks and ratios."""
    forehead: str = Field(..., description="Forehead description: Balanced, Narrow, Wide.")
    cheekbones: str = Field(..., description="Cheekbone description: Defined, High & Defined, Prominent, Soft.")
    jawline: str = Field(..., description="Jawline description: Soft, Soft & Rounded, Tapered, Strong & Square.")
    symmetry: str = Field(..., description="Overall face horizontal symmetry: High, Moderate, Low.")


class BeautyProfile(BaseModel):
    """The consolidated beauty profile representing shape, skin tone, undertone, and key features."""
    face_shape: str = Field(..., description="Classified face shape: Oval, Round, Square, Rectangle, Heart, Diamond.")
    skin_tone: str = Field(..., description="Classified skin tone: Fair, Light, Medium, Tan, Deep.")
    undertone: str = Field(..., description="Classified undertone: Warm, Cool, Neutral.")
    features: BeautyFeatures = Field(..., description="Specific facial feature descriptions.")


class BeautyProfileRequest(BaseModel):
    """Request body for generating a beauty profile."""
    face_shape: str = Field(..., description="Classified face shape.")
    skin_tone: str = Field(..., description="Classified skin tone.")
    undertone: str = Field(..., description="Classified undertone.")
    measurements: FaceMeasurements | None = Field(default=None, description="Optional facial measurements.")
    landmarks: list[FaceLandmark] | None = Field(default=None, description="Optional face mesh landmarks to compute true symmetry.")

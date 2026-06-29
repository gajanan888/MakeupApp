from pydantic import BaseModel, Field
from app.schemas.beauty_profile import BeautyProfile


class ProductRecommendations(BaseModel):
    """General generic products configured for this look."""
    lipstick: list[str] = Field(default=[], description="Recommended lipstick categories or styles.")
    blush: list[str] = Field(default=[], description="Recommended blush styles.")
    eyeshadow: list[str] = Field(default=[], description="Recommended eyeshadow styles.")


class RecommendedFor(BaseModel):
    """The facial profile types this look is recommended for."""
    face_shape: list[str] = Field(default=[], description="Suitable face shapes.")
    skin_tone: list[str] = Field(default=[], description="Suitable skin tones.")
    undertone: list[str] = Field(default=[], description="Suitable undertones.")


class PersonalizedRecommendations(BaseModel):
    """Dynamic, personal makeup product selections customized for the user's specific skin tone and face shape."""
    foundation_shade: str = Field(..., description="Personalized matching foundation shade.")
    lipstick_color: str = Field(..., description="Personalized matching lipstick color.")
    blush_color: str = Field(..., description="Personalized matching blush color.")
    eyeshadow_color: str = Field(..., description="Personalized matching eyeshadow color.")
    contour_intensity: str = Field(..., description="Personalized contour intensity level.")
    highlight_style: str = Field(..., description="Personalized matching highlight style.")
    eyebrow_shape: str = Field(..., description="Personalized matching eyebrow shape.")
    seasonal_profile: str | None = Field(default=None, description="Calculated color harmony profile (e.g. Autumn Warm).")
    contour_style: str | None = Field(default=None, description="Geometric contour placement guidelines.")


class LookStep(BaseModel):
    """A detailed step-by-step instruction to achieve a makeup look."""
    step_number: int = Field(..., description="Sequence step number (e.g. 1, 2, 3).")
    title: str = Field(..., description="Title of this step (e.g. Eye Makeup).")
    instruction: str = Field(..., description="Actionable instruction text.")
    products: list[str] = Field(default=[], description="Specific tools or products to apply in this step.")


class RecommendedLook(BaseModel):
    """A personalized makeup look profile containing suitabilities, products, and customized shades."""
    id: str = Field(..., description="Unique slug or identifier for the look.")
    name: str = Field(..., description="Name of the look (e.g. Natural Glow).")
    description: str = Field(..., description="Description of the look.")
    time_estimate: str | None = Field(default=None, description="Estimated duration (e.g. 30-45 min).")
    coverage: str | None = Field(default=None, description="Coverage level (e.g. Medium Coverage).")
    long_description: str | None = Field(default=None, description="Detailed look description.")
    category: str | None = Field(default=None, description="Look category (e.g. Natural, Glam, Bridal).")
    recommended_for: RecommendedFor = Field(..., description="Target attributes suitable for this look.")
    products: ProductRecommendations = Field(..., description="Generic product recommendation types.")
    personalized_recommendations: PersonalizedRecommendations = Field(..., description="Dynamically matched shade and style options.")
    steps: list[LookStep] | None = Field(default=None, description="Step-by-step application instructions.")


class LookRecommendationResponse(BaseModel):
    """Response containing the full face classification pipeline results and look recommendations."""
    face_detected: bool = Field(..., description="Flag indicating if a face was detected in the input image.")
    beauty_profile: BeautyProfile | None = Field(default=None, description="Generated Beauty Profile.")
    recommended_looks: list[RecommendedLook] | None = Field(default=None, description="Matched and personalized looks list.")
    message: str | None = Field(default=None, description="Optional status message (e.g. if face detection failed).")

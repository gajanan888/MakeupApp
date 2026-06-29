from pydantic import BaseModel, Field


class FaceMeasurements(BaseModel):
    """Calculated key facial measurements (in pixels) and their relative geometric ratios."""

    face_length: float = Field(
        ...,
        description="Distance from forehead top (landmark 10) to chin bottom (landmark 152) in pixels.",
    )
    forehead_width: float = Field(
        ...,
        description="Distance between left forehead (landmark 103) and right forehead (landmark 332) in pixels.",
    )
    cheekbone_width: float = Field(
        ...,
        description="Distance between left cheekbone (landmark 234) and right cheekbone (landmark 454) in pixels.",
    )
    jaw_width: float = Field(
        ...,
        description="Distance between left jaw (landmark 132) and right jaw (landmark 361) in pixels.",
    )
    face_width_ratio: float = Field(
        ...,
        description="Ratio of cheekbone width to face length.",
    )
    length_to_width_ratio: float = Field(
        ...,
        description="Ratio of face length to cheekbone width.",
    )
    chin_angle: float | None = Field(
        default=None,
        description="Chin angle in degrees.",
    )
    face_width: float | None = Field(
        default=None,
        description="Face width (cheekbone width) in pixels.",
    )
    face_height: float | None = Field(
        default=None,
        description="Face height (face length) in pixels.",
    )


class FaceShapeResponse(BaseModel):
    """Response schema for face shape classification."""

    face_detected: bool = Field(
        ...,
        description="True if a face was detected and processed; False otherwise.",
    )
    face_shape: str | None = Field(
        default=None,
        description="Classified face shape: Oval, Round, Square, Rectangle, Heart, Diamond.",
    )
    confidence: float | None = Field(
        default=None,
        description="Confidence score for the classification (between 0.0 and 1.0).",
    )
    secondary_shape: str | None = Field(
        default=None,
        description="Secondary matching face shape.",
    )
    all_scores: dict[str, float] | None = Field(
        default=None,
        description="Scores for all classified face shapes.",
    )
    measurements: FaceMeasurements | None = Field(
        default=None,
        description="Detailed pixel-based facial measurements and geometric ratios.",
    )
    message: str | None = Field(
        default=None,
        description="Optional error or status message (e.g. 'No face detected').",
    )

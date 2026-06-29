from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    x: int = Field(ge=0)
    y: int = Field(ge=0)
    width: int = Field(ge=0)
    height: int = Field(ge=0)


class FaceDetectionItem(BaseModel):
    confidence: float = Field(ge=0.0, le=1.0)
    bounding_box: BoundingBox


class FaceDetectionResponse(BaseModel):
    face_detected: bool
    face_count: int = Field(ge=0)
    image_width: int = Field(gt=0)
    image_height: int = Field(gt=0)
    detections: list[FaceDetectionItem]
    saved_image_path: str | None = None


class FaceLandmark(BaseModel):
    index: int = Field(ge=0)
    x: float
    y: float
    z: float
    x_px: int
    y_px: int


class LandmarkRegion(BaseModel):
    name: str
    indices: list[int]
    points: list[FaceLandmark]


class FaceLandmarkResponse(BaseModel):
    face_detected: bool
    face_count: int = Field(ge=0)
    image_width: int = Field(gt=0)
    image_height: int = Field(gt=0)
    landmarks: list[list[FaceLandmark]]
    regions: list[LandmarkRegion]
    saved_image_path: str | None = None
    pitch: float | None = None
    yaw: float | None = None
    roll: float | None = None
    scale: float | None = None
    normalized_landmarks: list[list[FaceLandmark]] | None = None

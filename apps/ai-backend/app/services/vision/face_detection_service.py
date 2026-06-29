import os
from pathlib import Path
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[3]
MPL_CACHE_DIR = BACKEND_ROOT / ".cache" / "matplotlib"
MPL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(MPL_CACHE_DIR))

import cv2
import mediapipe as mp
import numpy as np

from app.schemas.face import BoundingBox, FaceDetectionItem, FaceDetectionResponse


class FaceDetectionService:
    """Detects faces with MediaPipe Face Detection."""

    def __init__(
        self,
        model_selection: int = 1,
        min_detection_confidence: float = 0.5,
    ) -> None:
        self.model_selection = model_selection
        self.min_detection_confidence = min_detection_confidence
        self._face_detection = mp.solutions.face_detection

    def detect(
        self,
        image: np.ndarray,
        saved_image_path: str | None = None,
    ) -> FaceDetectionResponse:
        image_height, image_width = image.shape[:2]
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        with self._face_detection.FaceDetection(
            model_selection=self.model_selection,
            min_detection_confidence=self.min_detection_confidence,
        ) as detector:
            results = detector.process(rgb_image)

        detections = []
        raw_detections = getattr(results, "detections", None) or []
        for detection in raw_detections:
            item = self._to_detection_item(detection, image_width, image_height)
            box = item.bounding_box
            # Check if the bounding box touches the image edges (indicating a cropped face)
            is_cropped = (
                box.x <= 2 or
                box.y <= 2 or
                box.x + box.width >= image_width - 3 or
                box.y + box.height >= image_height - 3
            )
            if not is_cropped:
                detections.append(item)

        return FaceDetectionResponse(
            face_detected=bool(detections),
            face_count=len(detections),
            image_width=image_width,
            image_height=image_height,
            detections=detections,
            saved_image_path=saved_image_path,
        )

    def _to_detection_item(
        self,
        detection: Any,
        image_width: int,
        image_height: int,
    ) -> FaceDetectionItem:
        relative_box = detection.location_data.relative_bounding_box

        x = max(0, int(relative_box.xmin * image_width))
        y = max(0, int(relative_box.ymin * image_height))
        width = min(image_width - x, int(relative_box.width * image_width))
        height = min(image_height - y, int(relative_box.height * image_height))

        confidence = float(detection.score[0]) if detection.score else 0.0

        return FaceDetectionItem(
            confidence=confidence,
            bounding_box=BoundingBox(
                x=x,
                y=y,
                width=max(0, width),
                height=max(0, height),
            ),
        )

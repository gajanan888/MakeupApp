import cv2
import logging
from typing import Dict, Any
from app.models.virtual_preview import SelfieModel
from app.services.vision.landmark_service import LandmarkService

logger = logging.getLogger(__name__)


class FaceVisionService:
    """
    Service for face and landmark detection using MediaPipe (Phase 3).
    """

    def __init__(self):
        self.landmark_service = LandmarkService()

    async def detect_landmarks(self, selfie: SelfieModel) -> Dict[str, Any]:
        """
        Detects facial landmarks using MediaPipe.
        """
        logger.info(f"Detecting landmarks for selfie: {selfie.id} (path: {selfie.file_path})")
        
        image = cv2.imread(selfie.file_path)
        if image is None:
            raise ValueError("Failed to read selfie image from disk.")

        result = self.landmark_service.extract(image=image)
        if not result.face_detected or not result.landmarks:
            raise ValueError("No face detected in the uploaded image.")

        # Convert the first face's landmarks to a serializable list of dicts
        first_face = result.landmarks[0]
        landmarks_list = [
            {
                "index": lm.index,
                "x": lm.x,
                "y": lm.y,
                "z": lm.z,
                "x_px": lm.x_px,
                "y_px": lm.y_px,
            }
            for lm in first_face
        ]
        
        return {
            "face_detected": True,
            "landmark_count": len(landmarks_list),
            "landmarks": landmarks_list
        }

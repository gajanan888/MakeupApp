import cv2
import hashlib
import mediapipe as mp
import numpy as np
from typing import List, Tuple, Dict

class LandmarksProcessor:
    """
    Extracts and caches 468+ facial landmark coordinate pairs (x, y) 
    using MediaPipe Face Mesh to optimize consecutive makeup operations.
    """
    
    # Static dictionary to cache landmarks using MD5 hash of the raw image bytes
    _cache: Dict[str, List[Tuple[int, int]]] = {}

    def __init__(self, min_detection_confidence: float = 0.5):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.min_confidence = min_detection_confidence

    def _get_image_hash(self, image: np.ndarray) -> str:
        """Generates a fast MD5 checksum of the image content."""
        return hashlib.md5(image.tobytes()).hexdigest()

    def get_landmarks(self, image: np.ndarray) -> List[Tuple[int, int]]:
        """
        Detects facial landmarks for the first face in BGR image.
        Returns a list of (x, y) pixel coordinates. Returns empty list if no face is found.
        """
        if image is None or image.size == 0:
            return []
            
        img_hash = self._get_image_hash(image)
        if img_hash in self._cache:
            return self._cache[img_hash]

        h, w = image.shape[:2]
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        landmarks: List[Tuple[int, int]] = []
        with self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True, # Enables iris/eyelid detail points
            min_detection_confidence=self.min_confidence
        ) as face_mesh:
            results = face_mesh.process(rgb_image)
            if results.multi_face_landmarks:
                first_face = results.multi_face_landmarks[0]
                for pt in first_face.landmark:
                    x_px = min(w - 1, max(0, int(pt.x * w)))
                    y_px = min(h - 1, max(0, int(pt.y * h)))
                    landmarks.append((x_px, y_px))
                    
        # Cache results if we successfully extracted landmarks
        if landmarks:
            self._cache[img_hash] = landmarks
            
        return landmarks

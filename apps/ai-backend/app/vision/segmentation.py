import cv2
import numpy as np
from typing import List, Tuple, Dict

class FaceSegmentation:
    """Generates high-precision binary masks for individual facial regions from landmark coordinates."""

    # Landmark indices for polygons
    UPPER_LIP_INDICES = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 78]
    LOWER_LIP_INDICES = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78]
    
    OUTER_LIPS_INDICES = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146]
    INNER_LIPS_INDICES = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95]
    
    LEFT_EYE_INDICES = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7]
    RIGHT_EYE_INDICES = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249]
    
    LEFT_EYEBROW_INDICES = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46]
    RIGHT_EYEBROW_INDICES = [336, 296, 334, 293, 300, 285, 295, 282, 283, 276]
    
    LEFT_CHEEK_INDICES = [50, 101, 118, 117, 123, 147, 187, 205, 203, 36]
    RIGHT_CHEEK_INDICES = [280, 330, 347, 346, 352, 376, 411, 425, 423, 266]
    
    FOREHEAD_INDICES = [103, 67, 109, 10, 338, 297, 332, 296, 334, 293, 300, 285, 251, 21, 54, 70, 63, 105, 66, 107, 55]
    NOSE_INDICES = [168, 6, 197, 195, 5, 4, 1, 2, 98, 327]
    CHIN_INDICES = [152, 377, 400, 378, 379, 148, 176, 149, 150]
    
    JAWLINE_INDICES = [234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454]
    
    # Combined boundary contour of the full face (jawline + top forehead boundary)
    FACE_BOUNDARY_INDICES = [
        454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234,
        127, 162, 21, 54, 103, 67, 109, 10, 338, 297, 332, 284, 251, 389, 356
    ]

    def _create_polygon_mask(self, landmarks: List[Tuple[int, int]], indices: List[int], shape: Tuple[int, int]) -> np.ndarray:
        """Helper to create a binary mask (0 and 255) for a polygon defined by indices."""
        mask = np.zeros(shape, dtype=np.uint8)
        pts = np.array([landmarks[i] for i in indices if i < len(landmarks)], dtype=np.int32)
        if len(pts) > 0:
            cv2.fillPoly(mask, [pts], 255)
        return mask

    def get_masks(self, landmarks: List[Tuple[int, int]], image_shape: Tuple[int, int]) -> Dict[str, np.ndarray]:
        """
        Generates individual masks for lips, eyes, eyebrows, cheeks, forehead, nose, chin, jawline, and skin.
        Returns a dictionary of BGR shape-compatible uint8 masks (255 inside region, 0 outside).
        """
        h, w = image_shape[:2]
        shape = (h, w)
        
        # 1. Base masks
        upper_lip = self._create_polygon_mask(landmarks, self.UPPER_LIP_INDICES, shape)
        lower_lip = self._create_polygon_mask(landmarks, self.LOWER_LIP_INDICES, shape)
        
        # Entire lips with mouth cavity subtracted
        outer_lips = self._create_polygon_mask(landmarks, self.OUTER_LIPS_INDICES, shape)
        inner_lips = self._create_polygon_mask(landmarks, self.INNER_LIPS_INDICES, shape)
        lips = cv2.subtract(outer_lips, inner_lips)
        
        left_eye = self._create_polygon_mask(landmarks, self.LEFT_EYE_INDICES, shape)
        right_eye = self._create_polygon_mask(landmarks, self.RIGHT_EYE_INDICES, shape)
        
        left_eyebrow = self._create_polygon_mask(landmarks, self.LEFT_EYEBROW_INDICES, shape)
        right_eyebrow = self._create_polygon_mask(landmarks, self.RIGHT_EYEBROW_INDICES, shape)
        eyebrows = cv2.bitwise_or(left_eyebrow, right_eyebrow)
        
        left_cheek = self._create_polygon_mask(landmarks, self.LEFT_CHEEK_INDICES, shape)
        right_cheek = self._create_polygon_mask(landmarks, self.RIGHT_CHEEK_INDICES, shape)
        
        forehead = self._create_polygon_mask(landmarks, self.FOREHEAD_INDICES, shape)
        nose = self._create_polygon_mask(landmarks, self.NOSE_INDICES, shape)
        chin = self._create_polygon_mask(landmarks, self.CHIN_INDICES, shape)
        jawline = self._create_polygon_mask(landmarks, self.JAWLINE_INDICES, shape)
        
        # 2. Skin region (Full face minus features that should not have foundation applied)
        face_full = self._create_polygon_mask(landmarks, self.FACE_BOUNDARY_INDICES, shape)
        
        # Features to subtract
        non_skin = np.zeros(shape, dtype=np.uint8)
        non_skin = cv2.bitwise_or(non_skin, left_eye)
        non_skin = cv2.bitwise_or(non_skin, right_eye)
        non_skin = cv2.bitwise_or(non_skin, eyebrows)
        non_skin = cv2.bitwise_or(non_skin, outer_lips) # Subtract full mouth region
        
        # Skin is face minus eyes/brows/lips
        skin = cv2.subtract(face_full, non_skin)
        
        return {
            "upper_lip": upper_lip,
            "lower_lip": lower_lip,
            "lips": lips,
            "left_eye": left_eye,
            "right_eye": right_eye,
            "eyebrows": eyebrows,
            "left_eyebrow": left_eyebrow,
            "right_eyebrow": right_eyebrow,
            "left_cheek": left_cheek,
            "right_cheek": right_cheek,
            "forehead": forehead,
            "nose": nose,
            "chin": chin,
            "jawline": jawline,
            "skin": skin
        }

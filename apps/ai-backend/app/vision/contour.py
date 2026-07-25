import cv2
import numpy as np
from typing import List, Tuple
from app.vision.blending import BlendingUtils

class ContourProcessor:
    """Applies contour shading by decreasing Lightness in the LAB color space to simulate natural shadows."""

    def _get_contour_mask(self, landmarks: List[Tuple[int, int]], shape: Tuple[int, int]) -> np.ndarray:
        """
        Generates a combined binary mask of cheekbone, jawline, and forehead sides.
        """
        h, w = shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)
        
        # 1. Left Cheekbone Contour
        lc_pts = np.array([landmarks[137], landmarks[227], landmarks[118], landmarks[117], landmarks[137]], dtype=np.int32)
        cv2.fillPoly(mask, [lc_pts], 255)
        
        # 2. Right Cheekbone Contour
        rc_pts = np.array([landmarks[366], landmarks[447], landmarks[347], landmarks[346], landmarks[366]], dtype=np.int32)
        cv2.fillPoly(mask, [rc_pts], 255)
        
        # 3. Forehead Sides (left and right temples)
        lf_pts = np.array([landmarks[21], landmarks[54], landmarks[103], landmarks[67], landmarks[109], landmarks[21]], dtype=np.int32)
        rf_pts = np.array([landmarks[251], landmarks[284], landmarks[332], landmarks[297], landmarks[338], landmarks[251]], dtype=np.int32)
        cv2.fillPoly(mask, [lf_pts], 255)
        cv2.fillPoly(mask, [rf_pts], 255)
        
        # 4. Jawline Bottom Contour (shifted inwards to contour the underside of the jaw)
        jawline_indices = [136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397]
        jaw_pts = []
        nose_tip = landmarks[1]
        for idx in jawline_indices:
            p = landmarks[idx]
            dx = nose_tip[0] - p[0]
            dy = nose_tip[1] - p[1]
            dist = np.sqrt(dx**2 + dy**2)
            if dist > 0:
                shift_x = int(p[0] + (dx / dist) * int(h * 0.015))
                shift_y = int(p[1] + (dy / dist) * int(h * 0.015))
                jaw_pts.append((shift_x, shift_y))
                
        for idx in reversed(jawline_indices):
            jaw_pts.append(landmarks[idx])
            
        jaw_arr = np.array(jaw_pts, dtype=np.int32)
        cv2.fillPoly(mask, [jaw_arr], 255)
        
        return mask

    def apply(self, image: np.ndarray, landmarks: List[Tuple[int, int]], intensity: float) -> np.ndarray:
        """
        Applies contour shadowing to the image by reducing Lightness in the LAB color space.
        """
        if intensity <= 0.0 or not landmarks:
            return image

        h, w = image.shape[:2]
        mask = self._get_contour_mask(landmarks, (h, w))
        if np.sum(mask) == 0:
            return image

        # Feather mask heavily (blur size 55) for smooth contour fade
        feathered = BlendingUtils.feather_mask(mask, blur_size=55)
        
        # Convert to LAB space
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        
        # Decrease Lightness (L) inside the feathered contour mask (max -25 points)
        l_float = l_channel.astype(np.float32)
        l_float -= (25.0 * intensity) * feathered
        new_l = np.clip(l_float, 0, 255).astype(np.uint8)
        
        # We merge back without changing A and B (preserves original skin hues for clean shadow)
        merged_lab = cv2.merge([new_l, a_channel, b_channel])
        return cv2.cvtColor(merged_lab, cv2.COLOR_LAB2BGR)

import cv2
import numpy as np
from typing import Dict, Tuple
from app.vision.blending import BlendingUtils

class BlushProcessor:
    """Applies blush rose tones to the cheeks using radial soft gradients instead of flat polygon fills."""

    BLUSH_COLOR_BGR = (140, 120, 235)  # RGB(235, 120, 140) Pink Rose

    # Mapping of styles to (radial_radius_ratio, opacity_scale)
    STYLES: Dict[str, Tuple[float, float]] = {
        "Soft": (0.04, 0.12),
        "Medium": (0.05, 0.22),
        "Heavy": (0.06, 0.32)
    }

    def _create_radial_mask(self, mask: np.ndarray, shape: Tuple[int, int], radius_px: int) -> np.ndarray:
        """Finds the center of the cheek mask and draws a soft radial gradient circle."""
        h, w = shape[:2]
        radial = np.zeros((h, w), dtype=np.uint8)
        
        # Find moments/centroid of the cheek polygon
        M = cv2.moments(mask)
        if M["m00"] > 0:
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
            
            # Draw a filled white circle at the cheekbone center
            cv2.circle(radial, (cx, cy), radius_px, 255, -1)
            
            # Constrain to the actual cheekbone polygon so it does not bleed into the nose or eyes
            radial = cv2.bitwise_and(radial, mask)
            
        return radial

    def apply(self, image: np.ndarray, style_name: str, left_cheek_mask: np.ndarray, right_cheek_mask: np.ndarray, opacity: float) -> np.ndarray:
        """
        Applies blush inside the cheek regions using a radial gradient.
        """
        if opacity <= 0.0:
            return image

        if left_cheek_mask is None or right_cheek_mask is None:
            return image

        h, w = image.shape[:2]
        
        # Get style configs
        radius_ratio, style_opacity = self.STYLES.get(style_name.capitalize(), self.STYLES["Medium"])
        radius_px = int(w * radius_ratio)
        final_opacity = opacity * style_opacity

        # 1. Create radial masks for left and right cheeks
        left_radial = self._create_radial_mask(left_cheek_mask, (h, w), radius_px)
        right_radial = self._create_radial_mask(right_cheek_mask, (h, w), radius_px)
        
        cheeks_radial = cv2.bitwise_or(left_radial, right_radial)
        if np.sum(cheeks_radial) == 0:
            return image

        # 2. Feather heavily using a wide blur size for a soft focus highlight
        feathered = BlendingUtils.feather_mask(cheeks_radial, blur_size=55)
        mask_3d = np.expand_dims(feathered * final_opacity, axis=2)
        
        # 3. Alpha blend color layer
        color_layer = np.full(image.shape, self.BLUSH_COLOR_BGR, dtype=np.uint8)
        blended = image * (1.0 - mask_3d) + color_layer * mask_3d
        
        return np.clip(blended, 0, 255).astype(np.uint8)

import cv2
import numpy as np
from typing import List, Tuple
from app.vision.blending import BlendingUtils

class HighlighterProcessor:
    """Applies glowing pearl/champagne highlights by adjusting brightness and hues in the LAB space."""

    CHAMPAGNE_GLOW_BGR = (210, 230, 245)  # Soft pearl champagne tint

    def _get_highlight_mask(self, landmarks: List[Tuple[int, int]], shape: Tuple[int, int]) -> np.ndarray:
        """
        Generates a combined binary mask of nose bridge, upper cheekbones, and Cupid's bow.
        """
        h, w = shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)
        
        # 1. Nose Bridge (thin vertical stripe)
        # Landmarks: 168 (top of nose bridge) to 2 (nose tip)
        cv2.line(mask, landmarks[168], landmarks[2], 255, thickness=int(w * 0.012))
        
        # 2. Left Upper Cheekbone Highlight
        lc_pts = np.array([landmarks[116], landmarks[117], landmarks[123], landmarks[147], landmarks[116]], dtype=np.int32)
        cv2.fillPoly(mask, [lc_pts], 255)
        
        # 3. Right Upper Cheekbone Highlight
        rc_pts = np.array([landmarks[345], landmarks[346], landmarks[352], landmarks[376], landmarks[345]], dtype=np.int32)
        cv2.fillPoly(mask, [rc_pts], 255)
        
        # 4. Cupid's Bow
        cv2.circle(mask, landmarks[0], int(w * 0.010), 255, -1)
        
        return mask

    def apply(self, image: np.ndarray, landmarks: List[Tuple[int, int]], opacity: float) -> np.ndarray:
        """
        Applies highlighter to the specified facial regions in LAB color space.
        """
        if opacity <= 0.0 or not landmarks:
            return image

        h, w = image.shape[:2]
        mask = self._get_highlight_mask(landmarks, (h, w))
        if np.sum(mask) == 0:
            return image

        # Feather mask heavily for smooth glow transition
        feathered = BlendingUtils.feather_mask(mask, blur_size=31)
        
        # Convert to LAB space to adjust lightness
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        
        # Increase Lightness (L) slightly (max +30 points brightness) to create shine
        l_float = l_channel.astype(np.float32)
        l_float += (30.0 * opacity) * feathered
        new_l = np.clip(l_float, 0, 255).astype(np.uint8)
        
        # Blend a small amount of champagne tint into the color channels (A, B)
        color_img = np.full(image.shape, self.CHAMPAGNE_GLOW_BGR, dtype=np.uint8)
        color_lab = cv2.cvtColor(color_img, cv2.COLOR_BGR2LAB)
        _, target_a, target_b = cv2.split(color_lab)
        
        # Soft blend factor (max 15% color tint to remain skin-like)
        blend_factor = feathered * opacity * 0.15
        
        new_a = a_channel.astype(np.float32) * (1.0 - blend_factor) + target_a.astype(np.float32) * blend_factor
        new_b = b_channel.astype(np.float32) * (1.0 - blend_factor) + target_b.astype(np.float32) * blend_factor
        
        # Merge and convert back to BGR
        merged_lab = cv2.merge([new_l, new_a.astype(np.uint8), new_b.astype(np.uint8)])
        return cv2.cvtColor(merged_lab, cv2.COLOR_LAB2BGR)

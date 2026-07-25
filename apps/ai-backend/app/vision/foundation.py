import cv2
import numpy as np
from typing import Dict, Tuple
from app.vision.blending import BlendingUtils

class FoundationProcessor:
    """Applies foundation color tones to the face skin mask with skin-smoothing filters."""
    
    SHADES_BGR: Dict[str, Tuple[int, int, int]] = {
        "Alabaster": (211, 228, 248),  # RGB(248, 228, 211)
        "Ivory": (201, 219, 242),      # RGB(242, 219, 201)
        "Natural": (171, 196, 232),    # RGB(232, 196, 171)
        "Warm Beige": (150, 182, 224), # RGB(224, 182, 150)
        "Sand": (145, 177, 216),       # RGB(216, 177, 145)
        "Honey": (119, 153, 201),      # RGB(201, 153, 119)
        "Espresso": (57, 82, 122)      # RGB(122, 82, 57)
    }

    def apply(self, image: np.ndarray, shade_name: str, mask: np.ndarray, opacity: float) -> np.ndarray:
        """
        Applies foundation using translucent tinting and bilateral skin smoothing.
        """
        if opacity <= 0.0 or mask is None or np.sum(mask) == 0:
            return image

        color_bgr = self.SHADES_BGR.get(shade_name, self.SHADES_BGR["Warm Beige"])
        
        # 1. Convert to LAB space
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        
        # 2. Smooth the L (Lightness) channel using a bilateral filter (preserves facial edges while smoothing skin)
        l_smoothed = cv2.bilateralFilter(l_channel, 9, 50, 50)
        
        # 3. Convert target foundation color to LAB
        color_img = np.full(image.shape, color_bgr, dtype=np.uint8)
        color_lab = cv2.cvtColor(color_img, cv2.COLOR_BGR2LAB)
        _, target_a, target_b = cv2.split(color_lab)
        
        # 4. Feather foundation mask heavily
        feathered = BlendingUtils.feather_mask(mask, blur_size=25)
        mask_2d = feathered * opacity
        
        # 5. Smooth skin texture (blend original L with smoothed L)
        # We blend up to 35% of the smoothed L to keep details natural
        new_l = l_channel * (1.0 - mask_2d * 0.35) + l_smoothed * (mask_2d * 0.35)
        
        # 6. Translucent color blending (mix 45% target color with original color to avoid a flat mask look)
        blend_ratio = 0.45
        target_a_translucent = a_channel * (1.0 - blend_ratio) + target_a * blend_ratio
        target_b_translucent = b_channel * (1.0 - blend_ratio) + target_b * blend_ratio
        
        new_a = a_channel * (1.0 - mask_2d) + target_a_translucent * mask_2d
        new_b = b_channel * (1.0 - mask_2d) + target_b_translucent * mask_2d
        
        # Merge and convert back to BGR
        merged_lab = cv2.merge([new_l.astype(np.uint8), new_a.astype(np.uint8), new_b.astype(np.uint8)])
        return cv2.cvtColor(merged_lab, cv2.COLOR_LAB2BGR)

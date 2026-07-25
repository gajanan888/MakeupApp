import numpy as np
from typing import Dict, Tuple
from app.vision.blending import BlendingUtils

class EyebrowProcessor:
    """Tints and darkens the eyebrows using Brown, Black, or Dark Brown shades."""

    COLORS_BGR: Dict[str, Tuple[int, int, int]] = {
        "Brown": (40, 60, 90),         # RGB(90, 60, 40)
        "Dark Brown": (20, 35, 55),    # RGB(55, 35, 20)
        "Black": (20, 20, 20)          # RGB(20, 20, 20)
    }

    def apply(self, image: np.ndarray, color_name: str, mask: np.ndarray, opacity: float) -> np.ndarray:
        """
        Tints the eyebrows by blending the chosen color into the HSV space inside the eyebrow mask.
        Preserves individual eyebrow hair details.
        """
        if opacity <= 0.0 or mask is None or np.sum(mask) == 0:
            return image

        # Get color
        color_bgr = self.COLORS_BGR.get(color_name.strip().title(), self.COLORS_BGR["Brown"])
        
        # We use HSV tinting to keep hair texture (value channel is preserved)
        # We scale the opacity slightly (e.g. max 0.65) so it doesn't look like blocky markers
        scaled_opacity = opacity * 0.65
        
        return BlendingUtils.blend_hsv_tint(image, color_bgr, mask, scaled_opacity)

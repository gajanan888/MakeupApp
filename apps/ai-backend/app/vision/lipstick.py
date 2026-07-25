import cv2
import numpy as np
from typing import Dict, Tuple
from app.vision.blending import BlendingUtils

class LipstickProcessor:
    """Applies realistic lipstick colors inside the lips mask with support for custom hex colors."""

    COLORS_BGR: Dict[str, Tuple[int, int, int]] = {
        "Red": (30, 15, 185),        # Classic Crimson RGB(185, 15, 30)
        "Pink": (125, 95, 215),      # Muted Rose Pink RGB(215, 95, 125)
        "Nude": (105, 125, 190),     # Warm Toffee Nude RGB(190, 125, 105)
        "Brown": (50, 65, 110),      # Rich Mocha RGB(110, 65, 50)
        "Wine": (45, 20, 100),       # Deep Berry Wine RGB(100, 20, 45)
        "Coral": (85, 105, 225),     # Soft Salmon Coral RGB(225, 105, 85)
        "Peach": (110, 135, 225),    # Muted Velvet Peach RGB(225, 135, 110)
        "Maroon": (25, 10, 115)      # Dark Burgundy Maroon RGB(115, 10, 25)
    }

    def apply(self, image: np.ndarray, color_name: str, style: str, mask: np.ndarray, opacity: float) -> np.ndarray:
        """
        Applies lipstick onto the lips mask.
        Supports colors like Red, Pink, Nude, etc. or a custom Hex code (e.g. '#FF5733').
        """
        if opacity <= 0.0 or mask is None or np.sum(mask) == 0:
            return image

        # 1. Parse BGR color (supports name lookup or custom Hex input)
        if color_name.startswith('#'):
            try:
                hex_str = color_name.lstrip('#')
                # Parse R, G, B channels from hex string
                rgb = tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))
                color_bgr = (rgb[2], rgb[1], rgb[0]) # BGR order
            except Exception:
                color_bgr = self.COLORS_BGR["Red"]
        else:
            color_bgr = self.COLORS_BGR.get(color_name, self.COLORS_BGR["Red"])
        
        # 2. Base color overlay using alpha blending
        blur_size = 9 if style.lower() == "matte" else 7
        feathered = BlendingUtils.feather_mask(mask, blur_size=blur_size)
        mask_3d = np.expand_dims(feathered * opacity, axis=2)
        
        color_layer = np.full(image.shape, color_bgr, dtype=np.uint8)
        
        blended = image * (1.0 - mask_3d) + color_layer * mask_3d
        blended = np.clip(blended, 0, 255).astype(np.uint8)

        # 3. Add finish-specific highlights
        if style.lower() == "gloss":
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            _, highlights = cv2.threshold(gray, 180, 255, cv2.THRESH_TOZERO)
            highlights = cv2.bitwise_and(highlights, mask)
            highlights_blurred = cv2.GaussianBlur(highlights, (5, 5), 0)
            
            highlights_3d = np.expand_dims(highlights_blurred.astype(np.float32) / 255.0 * 0.45, axis=2)
            blended_float = blended.astype(np.float32)
            blended_float += 255.0 * highlights_3d
            blended = np.clip(blended_float, 0, 255).astype(np.uint8)
            
        elif style.lower() == "cream":
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            _, highlights = cv2.threshold(gray, 190, 255, cv2.THRESH_TOZERO)
            highlights = cv2.bitwise_and(highlights, mask)
            highlights_blurred = cv2.GaussianBlur(highlights, (3, 3), 0)
            
            highlights_3d = np.expand_dims(highlights_blurred.astype(np.float32) / 255.0 * 0.20, axis=2)
            blended_float = blended.astype(np.float32)
            blended_float += 255.0 * highlights_3d
            blended = np.clip(blended_float, 0, 255).astype(np.uint8)

        return blended

import cv2
import numpy as np
from typing import List, Tuple, Dict
from app.vision.blending import BlendingUtils

class EyeshadowProcessor:
    """Applies eyeshadow inside the dynamic eyelid regions with Matte, Shimmer, or Smokey finishes."""

    # Upper and lower eye contour indices to calculate eye height and boundaries
    LEFT_EYE_UPPER = [33, 246, 161, 160, 159, 158, 157, 173, 133]
    LEFT_EYE_LOWER = [33, 7, 163, 144, 145, 153, 154, 155, 133]
    
    RIGHT_EYE_UPPER = [263, 466, 388, 387, 386, 385, 384, 398, 362]
    RIGHT_EYE_LOWER = [263, 249, 390, 373, 374, 380, 381, 382, 362]

    def _get_eyeshadow_mask(self, landmarks: List[Tuple[int, int]], shape: Tuple[int, int], is_left: bool) -> Tuple[np.ndarray, Tuple[int, int]]:
        """
        Dynamically constructs an eyelid polygon mask by shifting the upper eye boundary landmarks upwards.
        Returns the mask and the outer corner point of the eye.
        """
        h, w = shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)
        
        upper_idx = self.LEFT_EYE_UPPER if is_left else self.RIGHT_EYE_UPPER
        lower_idx = self.LEFT_EYE_LOWER if is_left else self.RIGHT_EYE_LOWER
        
        # Calculate eye height
        upper_pts = [landmarks[i] for i in upper_idx]
        lower_pts = [landmarks[i] for i in lower_idx]
        
        avg_upper_y = sum(p[1] for p in upper_pts) / len(upper_pts)
        avg_lower_y = sum(p[1] for p in lower_pts) / len(lower_pts)
        eye_height = max(5, abs(avg_lower_y - avg_upper_y))
        
        # Generate eyeshadow eyelid points by shifting upper points up
        eyeshadow_pts = []
        # Upper points shifted up
        for p in upper_pts:
            # Shift up by 0.5 to 1.1 times the eye height
            shift = int(eye_height * 0.75)
            eyeshadow_pts.append((p[0], max(0, p[1] - shift)))
            
        # Connect back along the upper eye boundary in reverse order
        for p in reversed(upper_pts):
            eyeshadow_pts.append(p)
            
        pts_arr = np.array(eyeshadow_pts, dtype=np.int32)
        cv2.fillPoly(mask, [pts_arr], 255)
        
        # Outer corner point for smokey blending
        outer_pt = landmarks[33] if is_left else landmarks[263]
        
        return mask, outer_pt

    def apply(self, image: np.ndarray, landmarks: List[Tuple[int, int]], color_name: str, style: str, opacity: float) -> np.ndarray:
        """
        Applies eyeshadow to both eyelids.
        Colors supported: Pink, Peach, Purple, Brown, Gold.
        Styles supported: Matte, Shimmer, Smokey.
        """
        if opacity <= 0.0 or not landmarks:
            return image

        colors_bgr = {
            "Pink": (150, 110, 240),
            "Peach": (110, 150, 230),
            "Purple": (140, 50, 120),
            "Brown": (60, 80, 110),
            "Gold": (80, 180, 220)
        }
        color_bgr = colors_bgr.get(color_name, colors_bgr["Pink"])
        
        h, w = image.shape[:2]
        result = image.copy()
        
        for is_left in [True, False]:
            mask, outer_pt = self._get_eyeshadow_mask(landmarks, (h, w), is_left)
            
            # Feather mask heavily for smooth transition
            feathered = BlendingUtils.feather_mask(mask, blur_size=17)
            mask_3d = np.expand_dims(feathered * opacity, axis=2)
            
            # Create base colored layer
            color_layer = np.full(image.shape, color_bgr, dtype=np.uint8)
            
            # Apply Smokey style gradient (darker towards the outer corner of the eye)
            if style.lower() == "smokey":
                # Create a radial black gradient centered at the outer corner
                gradient = np.zeros((h, w), dtype=np.float32)
                cv2.circle(gradient, outer_pt, int(w * 0.08), 1.0, -1)
                gradient = cv2.GaussianBlur(gradient, (45, 45), 0)
                
                # Darken the color layer in that outer corner
                gradient_3d = np.expand_dims(gradient, axis=2)
                # Mix color with dark charcoal/black
                dark_color = (25, 25, 25)
                color_layer = (color_layer * (1.0 - gradient_3d * 0.6) + 
                               np.full(image.shape, dark_color, dtype=np.uint8) * (gradient_3d * 0.6)).astype(np.uint8)
            
            # Blend eyeshadow
            blended = result * (1.0 - mask_3d) + color_layer * mask_3d
            result = np.clip(blended, 0, 255).astype(np.uint8)
            
            # Apply Shimmer style glitter effect
            if style.lower() == "shimmer":
                # Create fine speckles of white noise inside the eyeshadow mask
                noise = np.random.randint(0, 255, (h, w), dtype=np.uint8)
                _, shimmers = cv2.threshold(noise, 240, 255, cv2.THRESH_BINARY)
                shimmers = cv2.bitwise_and(shimmers, mask)
                shimmers_blurred = cv2.GaussianBlur(shimmers, (3, 3), 0)
                
                # Overlay shimmer as soft white highlights
                shimmer_3d = np.expand_dims(shimmers_blurred.astype(np.float32) / 255.0 * 0.40 * opacity, axis=2)
                result_float = result.astype(np.float32)
                result_float += 255.0 * shimmer_3d
                result = np.clip(result_float, 0, 255).astype(np.uint8)

        return result

import cv2
import numpy as np
from typing import List, Tuple

class EyelinerProcessor:
    """Draws eyeliner along the upper eyelid contours with Thin, Medium, or Winged styles."""

    LEFT_UPPER_EYELID = [133, 173, 157, 158, 159, 160, 161, 246, 33] # from inner to outer corner
    RIGHT_UPPER_EYELID = [362, 398, 384, 385, 386, 387, 388, 466, 263] # from inner to outer corner

    def _draw_eyeliner(self, image: np.ndarray, landmarks: List[Tuple[int, int]], is_left: bool, style: str, opacity: float) -> np.ndarray:
        """
        Draws the eyeliner curve and wing for a single eye.
        """
        h, w = image.shape[:2]
        overlay = image.copy()
        
        eyelid_indices = self.LEFT_UPPER_EYELID if is_left else self.RIGHT_UPPER_EYELID
        pts = [landmarks[i] for i in eyelid_indices if i < len(landmarks)]
        if len(pts) < 2:
            return image

        # Set line parameters based on style
        thickness = 1
        if style.lower() == "medium":
            thickness = 3
        elif style.lower() == "winged":
            thickness = 3

        # Draw anti-aliased polyline
        pts_arr = np.array(pts, dtype=np.int32).reshape((-1, 1, 2))
        cv2.polylines(overlay, [pts_arr], isClosed=False, color=(15, 15, 15), thickness=thickness, lineType=cv2.LINE_AA)
        
        # Add the wing extension if "winged"
        if style.lower() == "winged" and len(pts) >= 3:
            # Outer corner is the last point
            outer_corner = pts[-1]
            prev_point = pts[-2]
            
            # Calculate direction vector from previous point to outer corner
            dx = outer_corner[0] - prev_point[0]
            dy = outer_corner[1] - prev_point[1]
            
            # Normalize vector
            dist = np.sqrt(dx**2 + dy**2)
            if dist > 0:
                dx, dy = dx / dist, dy / dist
                
                # We want the wing to extend outwards and slightly upwards
                # In screen coordinates, moving up means subtracting y
                wing_length = int(np.sqrt((pts[0][0] - pts[-1][0])**2 + (pts[0][1] - pts[-1][1])**2) * 0.28)
                
                # Apply upward angle tilt to the wing vector
                tilt_angle = -0.30 if is_left else -0.30
                cos_t, sin_t = np.cos(tilt_angle), np.sin(tilt_angle)
                rotated_dx = dx * cos_t - dy * sin_t
                rotated_dy = dx * sin_t + dy * cos_t
                
                wing_tip_x = int(outer_corner[0] + rotated_dx * wing_length)
                wing_tip_y = int(outer_corner[1] + rotated_dy * wing_length)
                
                # Draw the wing stroke
                cv2.line(overlay, outer_corner, (wing_tip_x, wing_tip_y), (15, 15, 15), thickness=thickness, lineType=cv2.LINE_AA)
                
                # Draw a tiny connecting triangle to fill the corner beautifully
                corner_fill = np.array([prev_point, outer_corner, (wing_tip_x, wing_tip_y)], dtype=np.int32)
                cv2.fillPoly(overlay, [corner_fill], (15, 15, 15))

        # Alpha blend the overlay with the original image
        blended = cv2.addWeighted(overlay, opacity, image, 1.0 - opacity, 0)
        return blended

    def apply(self, image: np.ndarray, landmarks: List[Tuple[int, int]], style: str, opacity: float) -> np.ndarray:
        """
        Applies eyeliner to both eyes.
        """
        if opacity <= 0.0 or not landmarks:
            return image

        # Apply left eye eyeliner
        img_with_left = self._draw_eyeliner(image, landmarks, is_left=True, style=style, opacity=opacity)
        # Apply right eye eyeliner
        img_with_both = self._draw_eyeliner(img_with_left, landmarks, is_left=False, style=style, opacity=opacity)
        
        return img_with_both

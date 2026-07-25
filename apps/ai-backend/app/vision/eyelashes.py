import cv2
import numpy as np
import math
from typing import List, Tuple

class EyelashesProcessor:
    """Applies realistic eyelash extensions by drawing curved, tapered lash strokes from the upper eyelid perimeters."""

    def apply(self, image: np.ndarray, landmarks: List[Tuple[int, int]], style: str, opacity: float) -> np.ndarray:
        """
        Draws curved, realistic eyelash strokes extending from the upper eye landmarks.
        Styles: 'Natural', 'Volume', 'Dramatic'
        """
        if opacity <= 0.0 or not landmarks:
            return image

        # Style configs: (length_multiplier, density_steps)
        configs = {
            "natural": (0.6, 4),
            "volume": (0.8, 6),
            "dramatic": (1.0, 8)
        }
        
        style_lower = style.lower()
        length_mult, density_steps = configs.get(style_lower, configs["natural"])
        
        h, w = image.shape[:2]
        overlay = image.copy()
        
        # Left Eye Upper Indices (outer corner 33 to inner corner 133)
        left_upper = [33, 246, 161, 160, 159, 158, 157, 173, 133]
        # Right Eye Upper Indices (outer corner 263 to inner corner 362)
        right_upper = [263, 466, 388, 387, 386, 385, 384, 398, 362]
        
        def draw_eye_lashes(upper_indices: List[int], is_left: bool):
            coords = [landmarks[idx] for idx in upper_indices]
            n_pts = len(coords)
            
            # Generate dense points along the upper eyelid by interpolating between landmarks
            eyelid_points = []
            # Skip the extreme corners to look natural
            for i in range(1, n_pts - 2):
                p1 = coords[i]
                p2 = coords[i+1]
                for t in np.linspace(0, 1, density_steps, endpoint=False):
                    eyelid_points.append((
                        p1[0] + (p2[0] - p1[0]) * t,
                        p1[1] + (p2[1] - p1[1]) * t,
                        (i + t) / (n_pts - 1)
                    ))
            
            # Base length of lash (proportional to image width - short and delicate)
            base_len = w * 0.007 * length_mult
            
            for px, py, fraction in eyelid_points:
                # Left eye outer corner is index 0, inner is index 8.
                # Right eye outer corner is index 0, inner is index 8.
                if is_left:
                    # Lashes are longer in the outer half (fraction close to 0)
                    length = base_len * (1.2 - 0.7 * fraction)
                    # Left eye curl angle: from -140 deg (outer) to -90 deg (inner)
                    angle_deg = -142.0 + 50.0 * fraction
                else:
                    # Right eye outer is fraction close to 0
                    length = base_len * (1.2 - 0.7 * fraction)
                    # Right eye curl angle: from -38 deg (outer) to -90 deg (inner)
                    angle_deg = -38.0 - 50.0 * fraction
                
                # Dynamic noise so they don't look artificial
                # Using deterministic coordinate hashing for reproducible noise
                coord_sum = int(px) + int(py)
                noise_len = ((coord_sum % 5) - 2) * 0.08 * base_len
                noise_ang = ((coord_sum % 7) - 3) * 1.5
                
                final_length = max(1.0, length + noise_len)
                final_angle = angle_deg + noise_ang
                angle_rad = math.radians(final_angle)
                
                # End point of lash
                ex = int(px + final_length * math.cos(angle_rad))
                ey = int(py + final_length * math.sin(angle_rad))
                
                # Control point for quadratic Bezier curl (pulls Y up and curls outward)
                ctrl_x = int(px + (ex - px) * 0.45)
                ctrl_y = int(py + (ey - py) * 0.45 - final_length * 0.22)
                
                # Draw the lash stroke as segments with fading thickness and color (tapering)
                t_steps = 6
                curve_pts = []
                for t in np.linspace(0, 1, t_steps):
                    qx = int((1-t)**2 * px + 2*(1-t)*t * ctrl_x + t**2 * ex)
                    qy = int((1-t)**2 * py + 2*(1-t)*t * ctrl_y + t**2 * ey)
                    curve_pts.append((qx, qy))
                
                # Draw segment-by-segment with tapering colors (black to charcoal to translucent)
                for s in range(t_steps - 1):
                    p_start = curve_pts[s]
                    p_end = curve_pts[s+1]
                    
                    # Fading factor (1.0 at root, 0.1 at tip)
                    fade = 1.0 - (s / (t_steps - 1)) * 0.9
                    
                    # Dark charcoal color values fading out
                    c_val = int(35 * (1.0 - fade) + 15 * fade) # range from 15 to 35
                    color = (c_val, c_val, c_val)
                    
                    cv2.line(overlay, p_start, p_end, color, thickness=1, lineType=cv2.LINE_AA)

        draw_eye_lashes(left_upper, is_left=True)
        draw_eye_lashes(right_upper, is_left=False)
        
        # Blend with original image using opacity
        return cv2.addWeighted(overlay, opacity, image, 1.0 - opacity, 0)

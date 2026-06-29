import cv2
import numpy as np
import math
from app.schemas.face import FaceLandmark

class LashRenderer:
    """
    Renders realistic, production-quality eyelashes using MediaPipe landmarks.
    Supports Natural, Wispy, Bridal, Glam, and Cat-Eye lash styles.
    """

    # Eyelid landmark sequences (outer corner to inner corner / vice versa)
    LEFT_EYELID_UPPER = [130, 246, 161, 160, 159, 158, 157, 173, 133]
    RIGHT_EYELID_UPPER = [362, 398, 384, 385, 386, 387, 388, 466, 263]

    LEFT_OUTER_CORNER = 130
    LEFT_INNER_CORNER = 133
    RIGHT_OUTER_CORNER = 263
    RIGHT_INNER_CORNER = 362

    def render(self, image: np.ndarray, lm_dict: dict[int, FaceLandmark],
               style: str, intensity: float = 0.8) -> np.ndarray:
        """
        Renders lashes onto the image.
        - style: "Natural", "Wispy", "Bridal", "Glam", "Cat-Eye"
        - intensity: float between 0.0 and 1.0 (opacity / density modifier)
        """
        h, w = image.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)

        # Helper to get point coordinates
        def _get_pt(idx):
            if idx in lm_dict:
                return np.array([lm_dict[idx].x_px, lm_dict[idx].y_px], dtype=np.float32)
            return None

        # Left eye
        left_pts = [p for p in [_get_pt(i) for i in self.LEFT_EYELID_UPPER] if p is not None]
        # Right eye
        right_pts = [p for p in [_get_pt(i) for i in self.RIGHT_EYELID_UPPER] if p is not None]

        # Get eye widths for scaling
        left_outer = _get_pt(self.LEFT_OUTER_CORNER)
        left_inner = _get_pt(self.LEFT_INNER_CORNER)
        left_width = np.linalg.norm(left_outer - left_inner) if (left_outer is not None and left_inner is not None) else 40.0

        right_outer = _get_pt(self.RIGHT_OUTER_CORNER)
        right_inner = _get_pt(self.RIGHT_INNER_CORNER)
        right_width = np.linalg.norm(right_outer - right_inner) if (right_outer is not None and right_inner is not None) else 40.0

        if len(left_pts) >= 3:
            self._draw_eye_lashes(mask, left_pts, left_outer, left_width, is_left=True, style=style, intensity=intensity)

        if len(right_pts) >= 3:
            self._draw_eye_lashes(mask, right_pts, right_outer, right_width, is_left=False, style=style, intensity=intensity)

        # Smooth the mask to blend with natural lash line
        mask_blurred = cv2.GaussianBlur(mask, (3, 3), 0)

        # Blend using multiply (black lashes)
        # Apply intensity multiplier directly on mask values
        opacity = intensity * 0.9  # cap max opacity at 90%
        return self._blend_multiply(image, mask_blurred, (12, 12, 16), opacity=opacity)

    def _draw_eye_lashes(self, mask: np.ndarray, pts: list[np.ndarray],
                         outer_corner: np.ndarray, eye_width: float,
                         is_left: bool, style: str, intensity: float):
        """Draws individual lashes along the eyelid points."""
        n = len(pts)
        if n < 2:
            return

        # Interpolate points along upper eyelid for dense lashes (9 points -> 49 points)
        interpolated_pts = []
        for idx in range(n - 1):
            p_start = pts[idx]
            p_end = pts[idx + 1]
            steps = 6
            for step_idx in range(steps):
                t = step_idx / steps
                pt = (1.0 - t) * p_start + t * p_end
                interpolated_pts.append(pt)
        interpolated_pts.append(pts[-1])
        pts = interpolated_pts
        n = len(pts)

        # Base settings based on style
        # Styles: Natural, Wispy, Bridal, Glam, Cat-Eye
        density_step = 1
        if style == "Natural":
            density_step = 2  # skip every other point for sparse lashes
            base_length_factor = 0.11
            thickness = 1
        elif style == "Wispy":
            density_step = 1
            base_length_factor = 0.14
            thickness = 1
        elif style == "Bridal":
            density_step = 1
            base_length_factor = 0.14
            thickness = 1
        elif style == "Glam":
            density_step = 1
            base_length_factor = 0.16
            thickness = 1
        elif style == "Cat-Eye":
            density_step = 1
            base_length_factor = 0.16
            thickness = 1
        else:
            base_length_factor = 0.14
            thickness = 1

        for i in range(0, n, density_step):
            p0 = pts[i]

            # Local tangent and normal
            if i == 0:
                tangent = pts[1] - pts[0]
            elif i == n - 1:
                tangent = pts[n - 1] - pts[n - 2]
            else:
                tangent = pts[i + 1] - pts[i - 1]

            norm = np.linalg.norm(tangent)
            if norm == 0:
                continue
            tangent /= norm

            # Upward normal vector (dy, -dx)
            normal = np.array([tangent[1], -tangent[0]], dtype=np.float32)
            # Ensure it points upwards
            if normal[1] > 0:
                normal = -normal

            # Outward flare direction (towards the outer corner)
            to_outer = outer_corner - p0
            dist_to_outer = np.linalg.norm(to_outer)
            if dist_to_outer > 0:
                to_outer /= dist_to_outer
            else:
                to_outer = normal

            # Lash length calculation
            # Lashes are shorter near the inner corner, longer near the outer/middle
            # Calculate position fraction from inner to outer corner
            # For left eye: points are outer (0) to inner (n-1)
            # For right eye: points are inner (0) to outer (n-1)
            if is_left:
                pos_frac = 1.0 - (i / (n - 1))  # 0 at inner, 1 at outer
            else:
                pos_frac = i / (n - 1)          # 0 at inner, 1 at outer

            # Inner corner has very short/no lashes
            if pos_frac < 0.15:
                continue  # skip innermost lashes

            # Determine specific lash length for this point
            length = eye_width * base_length_factor

            # Shape-specific variations
            if style == "Cat-Eye":
                # Cat-eye has short inner and extremely long outer wing
                length_mult = 0.4 + 1.2 * (pos_frac ** 1.5)
            elif style == "Wispy" or style == "Bridal":
                # Alternating spikes
                is_spike = (i % 2 == 0)
                length_mult = (0.7 + 0.5 * pos_frac) if is_spike else (0.4 + 0.3 * pos_frac)
            else:
                # Normal curve (longer in middle and outer third)
                length_mult = math.sin(pos_frac * math.pi) * 0.9 + 0.3

            length *= length_mult

            # Add deterministic pseudo-random length variation (+/- 8%)
            length *= (1.0 + 0.08 * math.sin(i * 1.7))

            # Blend normal and outer direction for lash direction
            # Lashes flare outward more near the outer corner
            flare_weight = 0.1 + 0.55 * pos_frac
            if style == "Cat-Eye":
                flare_weight = 0.2 + 0.7 * pos_frac

            direction = (1.0 - flare_weight) * normal + flare_weight * to_outer

            # Add deterministic pseudo-random angle variation along tangent
            direction = direction + (0.12 * math.cos(i * 2.3)) * tangent

            dir_norm = np.linalg.norm(direction)
            if dir_norm > 0:
                direction /= dir_norm
            else:
                direction = normal

            # Render lash hair as a quadratic Bezier curve: p0 -> control -> tip
            # Control point slightly bends outward
            p1 = p0 + direction * (length * 0.4)
            # Add a slight extra upward bend to control point to simulate 3D curl
            p1[1] -= length * 0.15

            # Tip of the lash
            p2 = p0 + direction * length
            # Apply 3D curl upward at the tip
            p2[1] -= length * 0.25

            # Draw the lash curve
            self._draw_bezier_lash(mask, p0, p1, p2, thickness)

            # Glam style gets a second slightly offset lash for double volume
            if style == "Glam" and pos_frac > 0.3:
                # Offset by 1.5px for high density volume
                p0_offset = p0 + tangent * 1.5
                p1_offset = p1 + tangent * 1.5
                p2_offset = p2 + tangent * 1.5
                self._draw_bezier_lash(mask, p0_offset, p1_offset, p2_offset, thickness=1)

    def _draw_bezier_lash(self, mask: np.ndarray, p0: np.ndarray, p1: np.ndarray, p2: np.ndarray, thickness: int):
        """Generates points along a quadratic bezier curve and draws them."""
        steps = 8
        curve_pts = []
        for t_val in range(steps + 1):
            t = t_val / steps
            pt = (1 - t)**2 * p0 + 2 * (1 - t) * t * p1 + t**2 * p2
            curve_pts.append(pt.astype(np.int32))

        curve_pts = np.array(curve_pts, dtype=np.int32)
        cv2.polylines(mask, [curve_pts], False, 255, thickness=thickness, lineType=cv2.LINE_AA)

    def _blend_multiply(self, image: np.ndarray, mask: np.ndarray,
                        color: tuple[int, int, int], opacity: float) -> np.ndarray:
        m = (mask.astype(np.float32) / 255.0) * opacity
        m = m[:, :, np.newaxis]
        c = np.array(color, dtype=np.float32) / 255.0
        multiplied = image.astype(np.float32) * c
        blended = image.astype(np.float32) * (1.0 - m) + multiplied * m
        return np.clip(blended, 0, 255).astype(np.uint8)

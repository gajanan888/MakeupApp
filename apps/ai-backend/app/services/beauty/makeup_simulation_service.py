import cv2
import numpy as np
import math
from app.schemas.face import FaceLandmark
from app.schemas.makeup_recommendation import RecommendedLook


class MakeupSimulationService:
    """
    Applies professional 2D makeup simulations using MediaPipe landmarks.
    Rendering quality targets realistic cosmetic blending via LAB color space,
    gradient masks, and photographic multiply/screen compositing.
    """

    def __init__(self):
        from app.services.beauty.lash_renderer import LashRenderer
        self.lash_renderer = LashRenderer()

    # ── Landmark index mappings ────────────────────────────────────────────────
    OUTER_LIPS  = [61, 185, 40, 39, 37, 0, 267, 269, 270, 291, 321, 314, 17, 84, 91, 146]
    INNER_LIPS  = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178]
    # Cheek apple: 205 = left, 425 = right
    LEFT_CHEEK  = 205
    RIGHT_CHEEK = 425
    # ── Eyeshadow region = convex hull of (upper lash line + brow landmarks)
    # This spans the full lid+crease from lash line up to the brow, giving a
    # visible ~40-60px tall shadow region on a real face photo.
    # Lash line inner->outer + brow outer->inner, convexHull used in render.
    LEFT_EYELID  = [33, 246, 161, 160, 159, 158, 157, 173, 133,   # upper lash line
                    46, 53, 52, 65, 55, 107, 66, 105, 63, 70]      # left brow (outer->inner)
    RIGHT_EYELID = [362, 398, 384, 385, 386, 387, 388, 466, 263,   # upper lash line
                    276, 283, 282, 295, 285, 336, 296, 334, 293, 300]  # right brow (outer->inner)
    # Upper lash line (eyeliner path)
    LEFT_LASH_LINE  = [130, 246, 161, 160, 159, 158, 157, 173, 133]
    RIGHT_LASH_LINE = [362, 398, 384, 385, 386, 387, 388, 466, 263]
    LEFT_EYELINER  = [130, 246, 161, 160, 159, 158, 157, 173, 133]
    RIGHT_EYELINER = [362, 398, 384, 385, 386, 387, 388, 466, 263]
    # Eye opening hull (hollowed out of eyeshadow so colour never covers iris)
    LEFT_EYE_OPEN  = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7]
    RIGHT_EYE_OPEN = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249]
    # Eyebrow fill points (convex hull filled)
    LEFT_EYEBROW  = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46]
    RIGHT_EYEBROW = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276]
    # Foundation skin regions
    LEFT_CHEEK_MASK  = [50, 101, 118, 117, 123, 147, 187, 205, 203, 36]
    RIGHT_CHEEK_MASK = [280, 330, 347, 346, 352, 376, 411, 425, 423, 266]
    FOREHEAD_MASK    = [10, 338, 297, 332, 284, 251, 389, 356, 454, 234, 127, 162, 21, 54, 103, 67, 109]

    # ── Color map (BGR) ────────────────────────────────────────────────────────
    def _parse_color(self, name: str) -> tuple[int, int, int]:
        """Maps a cosmetic color description to its BGR tuple."""
        color_map = {
            # Lipsticks — warm, vibrant BGR values
            "Peach Nude":                    (148, 168, 225),
            "Dusty Rose":                    (132, 112, 192),
            "Mauve":                         (115,  85, 172),
            "Rosewood":                      ( 88,  60, 175),  # warm deep rose
            "True Red":                      (  5,   5, 225),
            "Deep Plum":                     ( 62,  12,  98),
            "Naked Brown":                   ( 95, 105, 168),
            "Pink Nude":                     (162, 148, 222),
            "Berry Mauve":                   ( 98,  42, 128),
            "Warm Red":                      ( 10,  18, 210),
            "Warm Red / Coral Nude":         ( 55,  85, 220),
            "Soft Rosewood":                 ( 95,  72, 168),
            "Dusky Rose":                    (122, 102, 178),
            "Coral Pink":                    (105, 125, 228),
            "Plum Berry":                    ( 72,  22, 115),
            "Naked Rose":                    (135, 112, 195),
            "Warm Terracotta":               ( 45,  72, 205),
            "Spiced Cinnamon / Nutmeg":      ( 55,  82, 185),
            "Warm Caramel Nude":             ( 92, 122, 205),
            "Vibrant Rosewood":              ( 75,  60, 175),
            "Soft Dusty Mauve":              (138, 115, 182),
            "Cool Pink Nude":                (172, 148, 218),
            "True Cherry Red / Deep Plum":   ( 35,   5, 162),
            "Soft Cranberry / Crimson":      ( 45,  22, 188),
            "Berry Nude":                    (112,  82, 172),
            "Berry Pink":                    (105,  55, 185),
            "Vibrant Red":                   (  5,   8, 228),
            "Soft Plum":                     ( 88,  55, 148),
            # Blushes
            "Peach-Rose":                    (148, 138, 238),
            "Coral":                         ( 78, 118, 238),
            "Soft Pink":                     (188, 175, 238),
            "Peach-Pink":                    (158, 158, 238),
            "Terracotta":                    ( 38,  88, 188),
            "Cool Berry":                    ( 98,  38, 148),
            "Rose":                          (138, 128, 218),
            "Dusty Mauve":                   (138, 108, 158),
            "Warm Apricot":                  ( 88, 138, 228),
            "Rose-Pink":                     (158, 138, 218),
            "Soft Apricot":                  (108, 158, 238),
            "Coral Pink":                    (118, 138, 238),
            "Warm Peach / Coral":            (108, 138, 243),
            "Soft Cool Pink / Mauve":        (168, 138, 228),
            "Dusty Rose / Rose-Pink":        (148, 128, 208),
            "Terracotta / Deep Peach":       ( 78, 108, 218),
            "Plum Berry / Cool Rose":        (118,  58, 178),
            # Eyeshadows
            "Gold":                          ( 58, 188, 208),
            "Bronze":                        ( 48, 118, 168),
            "Champagne":                     (158, 198, 218),
            "Taupe":                         (118, 118, 138),
            "Rose Gold":                     (148, 148, 208),
            "Smokey Bronze":                 ( 58,  88, 118),
            "Charcoal":                      ( 48,  48,  48),
            "Champagne Shimmer":             (168, 208, 228),
            "Warm Brown":                    ( 58,  88, 128),
            "Silver":                        (198, 198, 198),
            "Copper Shimmer":                ( 78, 118, 198),
            "Glitter Gold":                  ( 58, 188, 218),
            "Warm Taupe":                    ( 98, 108, 128),
            "Shimmering Gold & Bronze":      ( 68, 158, 198),
            "Cool Taupe & Mauve":            (138, 118, 148),
            "Soft Brown & Champagne":        (148, 168, 198),
            "Rich Copper, Gold & Warm Earthy Brown": (48, 108, 158),
            "Cool Slate Gray, Soft Mauve & Silver":  (168, 148, 158),
            "Icy Pearl, Charcoal & High-Shine Metallic Silver": (178, 178, 188),
            # Foundations
            "Porcelain Warm / Warm Ivory":   (205, 225, 250),
            "Golden Beige / Honey":          (178, 203, 233),
            "Amber Caramel":                 (138, 168, 208),
            "Chestnut Bronze":               ( 93, 123, 163),
            "Rose Alabaster / Cool Ivory":   (208, 218, 248),
            "Neutral Sand":                  (183, 208, 238),
            "Rich Almond":                   (133, 163, 203),
            "Rich Espresso / Cocoa":         ( 83, 108, 148),
            "Porcelain":                     (208, 228, 248),
            "Neutral Ivory":                 (198, 218, 243),
            "Natural Beige":                 (183, 208, 236),
            "Honey Tan":                     (148, 178, 213),
            "Rich Cocoa":                    ( 88, 113, 153),
        }
        cleaned = name.strip()
        if cleaned in color_map:
            return color_map[cleaned]
        for key, val in color_map.items():
            if cleaned in key or key in cleaned:
                return val
        return (135, 108, 178)  # Default: muted mauve

    # ── Blending primitives ───────────────────────────────────────────────────

    def _blend_overlay(self, image: np.ndarray, mask: np.ndarray,
                       color: tuple[int, int, int], opacity: float) -> np.ndarray:
        """Simple linear alpha blend — used only for very subtle tints."""
        mask_norm = (mask.astype(np.float32) / 255.0) * opacity
        overlay = np.full_like(image, color, dtype=np.uint8)
        blended = (image.astype(np.float32) * (1.0 - mask_norm[:, :, np.newaxis])
                   + overlay.astype(np.float32) * mask_norm[:, :, np.newaxis])
        return np.clip(blended, 0, 255).astype(np.uint8)

    def _blend_color_lab(self, image: np.ndarray, mask: np.ndarray,
                         color: tuple[int, int, int], opacity: float,
                         l_opacity_scale: float = 0.25) -> np.ndarray:
        """
        Blends a cosmetic color in CIE LAB space.
        - A and B channels carry chrominance (the actual color shift).
        - L channel is blended only lightly to preserve skin/lip texture & depth.
        """
        img_lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB).astype(np.float32)
        c_lab   = cv2.cvtColor(np.uint8([[color]]), cv2.COLOR_BGR2LAB)[0][0].astype(np.float32)

        m = (mask.astype(np.float32) / 255.0) * opacity

        out = img_lab.copy()
        out[:, :, 1] = (1 - m) * img_lab[:, :, 1] + m * c_lab[1]   # A
        out[:, :, 2] = (1 - m) * img_lab[:, :, 2] + m * c_lab[2]   # B
        lm = m * l_opacity_scale
        out[:, :, 0] = (1 - lm) * img_lab[:, :, 0] + lm * c_lab[0]  # L (subtle)

        return cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)

    def _blend_multiply(self, image: np.ndarray, mask: np.ndarray,
                        color: tuple[int, int, int], opacity: float) -> np.ndarray:
        """
        Photographic multiply blend — darkens while preserving underlying texture.
        Ideal for eyeliner and eyebrows (shadows hair without adding hue).
        """
        m = (mask.astype(np.float32) / 255.0) * opacity
        m = m[:, :, np.newaxis]
        c = np.array(color, dtype=np.float32) / 255.0
        multiplied = image.astype(np.float32) * c
        blended = image.astype(np.float32) * (1.0 - m) + multiplied * m
        return np.clip(blended, 0, 255).astype(np.uint8)

    def _build_eye_gradient_mask(self, h: int, w: int,
                                  eyelid_pts: np.ndarray,
                                  eye_open_pts: np.ndarray,
                                  face_width: int) -> np.ndarray:
        """
        4-step eyeshadow pipeline:

        Step 1 — Eyelid segmentation
            Fills the eyelid polygon using cv2.fillPoly with the ORDERED landmark
            points directly.  No convexHull — convex hull over-fills areas outside
            the lid (toward brow bone, inner corner skin, etc.).

        Step 2 — Gradient mask
            Vectorised y-coordinate gradient: t = (y - y_min) / y_range.
            t = 0 at the brow / crease (y_min), t = 1 at the lash line (y_max).
            Power curve t^0.60 keeps the lid richly coloured without just a thin
            sliver at the lash.

        Step 3 — Gaussian blur
            Dynamic Gaussian blur relative to face width feathers every hard polygon
            edge so the shadow blends naturally into surrounding skin.

        Step 4 — Opacity 20–40 %
            Mask values in [0, 255] passed to _blend_color_lab at opacity=0.32
            (32 % — centred in the 20–40 % range requested).
        """
        if len(eyelid_pts) < 3:
            return np.zeros((h, w), dtype=np.uint8)

        # Step 1: Build eyelid+crease region via convex hull.
        # eyelid_pts contains BOTH lash line AND brow landmarks, so the hull
        # spans the full lid area (lash line at bottom, brow at top).
        hull = cv2.convexHull(eyelid_pts)
        seg  = np.zeros((h, w), dtype=np.uint8)
        cv2.fillPoly(seg, [hull], 255)

        ys = np.where(seg > 0)[0]
        if len(ys) == 0:
            return np.zeros((h, w), dtype=np.uint8)

        y_min   = int(ys.min())
        y_max   = int(ys.max())
        y_range = max(y_max - y_min, 1)

        # ── Step 2: Vectorised gradient mask ──────────────────────────────
        # t = 0 at crease (y_min), t = 1 at lash line (y_max)
        t_1d = np.clip((np.arange(h, dtype=np.float32) - y_min) / y_range, 0.0, 1.0)
        gradient_1d = np.power(t_1d, 0.60)                  # t^0.60 power curve
        gradient_2d = gradient_1d[:, np.newaxis] * np.ones((1, w), dtype=np.float32)
        gradient_2d *= (seg.astype(np.float32) / 255.0)     # apply eyelid mask

        grad_u8 = (gradient_2d * 255.0).clip(0, 255).astype(np.uint8)

        # Hollow out the actual eye-opening so colour never covers the iris/white
        if len(eye_open_pts) > 0:
            cv2.fillPoly(grad_u8, [eye_open_pts], 0)

        # ── Step 3: Gaussian blur ─────────────────────────────────────────
        # Dynamic kernel: large enough to feather polygon edges naturally
        blur_k = max(15, int(face_width * 0.08) | 1)
        return cv2.GaussianBlur(grad_u8, (blur_k, blur_k), 0)

    # ── Makeup application methods ─────────────────────────────────────────────

    def _apply_foundation(self, image: np.ndarray,
                          lm_dict: dict[int, FaceLandmark],
                          color_name: str,
                          is_bridal: bool = False) -> np.ndarray:
        """
        Applies a professional foundation overlay on the face:
        - Uses YCrCb + HSV semantic skin segmentation inside an expanded face region.
        - Extends the forehead up to the hairline based on face height.
        - Preserves hair, eyebrows, eyes, and lips by excluding non-skin color/intensity.
        - Feathers the mask boundaries with a wide face-relative Gaussian blur.
        - Brightens the L channel in LAB space uniformly.
        - Blends a translucent foundation color overlay.
        - Saves a 2x3 debug composite grid at generated/debug_foundation.jpg.
        """
        h, w = image.shape[:2]
        
        # Helper to convert landmark indices to coordinates
        def _pts(indices):
            return np.array([[lm_dict[i].x_px, lm_dict[i].y_px]
                              for i in indices if i in lm_dict], dtype=np.int32)

        # 1. Forensic face dimensions for hairline extension
        if 152 in lm_dict and 10 in lm_dict:
            y_152 = lm_dict[152].y_px
            y_10 = lm_dict[10].y_px
            face_height = abs(y_152 - y_10)
        else:
            face_height = h // 2
            
        dy = int(0.18 * face_height)

        # Whole-face outline indices to define the base face polygon
        face_outline_indices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
        
        # Shift upper forehead points upwards towards the hairline
        upper_indices = {10, 338, 297, 332, 284, 251, 127, 162, 21, 54, 103, 67, 109}
        pts_outline = []
        for idx in face_outline_indices:
            if idx in lm_dict:
                x = lm_dict[idx].x_px
                y = lm_dict[idx].y_px
                if idx in upper_indices:
                    y = max(0, y - dy)
                pts_outline.append([x, y])
        pts_outline = np.array(pts_outline, dtype=np.int32)

        # Bounding mask: face outline extended to hairline
        expanded_face_mask = np.zeros((h, w), dtype=np.uint8)
        if len(pts_outline) > 0:
            cv2.fillPoly(expanded_face_mask, [pts_outline], 255)

        # Define jawline to extend for neck mask (from left jaw corner to right jaw corner)
        jaw_indices = [172, 136, 150, 149, 176, 152, 400, 378, 379, 365, 397]
        jaw_pts = [_pts([idx])[0] for idx in jaw_indices if idx in lm_dict]
        
        if len(jaw_pts) > 1:
            face_width = 100
            if 234 in lm_dict and 454 in lm_dict:
                face_width = abs(lm_dict[454].x_px - lm_dict[234].x_px)
                
            H_neck = int(face_width * 0.40)
            
            # Build neck polygon
            neck_poly = list(jaw_pts)
            for pt in reversed(jaw_pts):
                neck_poly.append(np.array([pt[0], pt[1] + H_neck], dtype=np.int32))
            neck_poly = np.array(neck_poly, dtype=np.int32)
            
            neck_mask = np.zeros((h, w), dtype=np.float32)
            cv2.fillPoly(neck_mask, [neck_poly], 1.0)
            
            # Vectorized gradient calculation along y-axis
            y_indices = np.arange(h)[:, np.newaxis]
            
            jaw_xs = [pt[0] for pt in jaw_pts]
            jaw_ys = [pt[1] for pt in jaw_pts]
            sorted_pairs = sorted(zip(jaw_xs, jaw_ys))
            sorted_xs = [p[0] for p in sorted_pairs]
            sorted_ys = [p[1] for p in sorted_pairs]
            
            x_map_ys = np.interp(np.arange(w), sorted_xs, sorted_ys)
            y_jaw_2d = x_map_ys[np.newaxis, :]
            
            gradient_2d = np.clip(1.0 - (y_indices - y_jaw_2d) / H_neck, 0.0, 1.0)
            neck_gradient_mask = (neck_mask * gradient_2d * 255.0).astype(np.uint8)
            
            # Combine face mask and neck gradient mask
            expanded_face_mask = np.clip(expanded_face_mask.astype(np.int32) + neck_gradient_mask.astype(np.int32), 0, 255).astype(np.uint8)

        # 2. Semantic skin segmentation inside the expanded face region
        # Convert to YCrCb and HSV color spaces
        img_ycrcb = cv2.cvtColor(image, cv2.COLOR_BGR2YCrCb)
        img_hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # Skin color thresholds in YCrCb (extremely robust across global skin tones)
        lower_ycrcb = np.array([0, 133, 77], dtype=np.uint8)
        upper_ycrcb = np.array([255, 173, 127], dtype=np.uint8)
        mask_ycrcb = cv2.inRange(img_ycrcb, lower_ycrcb, upper_ycrcb)
        
        # Skin color thresholds in HSV (covers shadows and high brightness)
        lower_hsv1 = np.array([0, 15, 40], dtype=np.uint8)
        upper_hsv1 = np.array([17, 170, 255], dtype=np.uint8)
        mask_hsv1 = cv2.inRange(img_hsv, lower_hsv1, upper_hsv1)
        
        lower_hsv2 = np.array([165, 15, 40], dtype=np.uint8)
        upper_hsv2 = np.array([180, 170, 255], dtype=np.uint8)
        mask_hsv2 = cv2.inRange(img_hsv, lower_hsv2, upper_hsv2)
        mask_hsv = cv2.bitwise_or(mask_hsv1, mask_hsv2)
        
        # Combine filters
        skin_segmented_raw = cv2.bitwise_and(mask_ycrcb, mask_hsv)
        
        # Restrict to expanded face
        skin_segmented = cv2.bitwise_and(skin_segmented_raw, expanded_face_mask)

        # 3. Detect and build hair exclusion mask (non-skin pixels + dark pixels inside face area)
        hair_exclusion = cv2.bitwise_and(cv2.bitwise_not(skin_segmented), expanded_face_mask)
        # Explicitly class very dark pixels (hair, thick eyebrows) inside the face region as hair/non-skin
        dark_pixels_mask = cv2.bitwise_and((img_ycrcb[:, :, 0] < 50).astype(np.uint8) * 255, expanded_face_mask)
        hair_exclusion = cv2.bitwise_or(hair_exclusion, dark_pixels_mask)

        # Exclude eyeballs and lip coordinates explicitly to keep them clean
        excl_features_mask = np.zeros((h, w), dtype=np.uint8)
        for excl in [self.LEFT_EYE_OPEN, self.RIGHT_EYE_OPEN,
                     [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95]]:
            pts_excl = _pts(excl)
            if len(pts_excl) > 0:
                cv2.fillPoly(excl_features_mask, [cv2.convexHull(pts_excl)], 255)
        
        # Subtract exclusions from foundation mask
        foundation_mask = skin_segmented.copy()
        foundation_mask[hair_exclusion > 0] = 0
        foundation_mask[excl_features_mask > 0] = 0

        # 4. Feather boundaries using face-relative Gaussian blur
        face_width = 100
        if 234 in lm_dict and 454 in lm_dict:
            face_width = abs(lm_dict[454].x_px - lm_dict[234].x_px)
            
        blur_k_f = max(31, int(face_width * 0.15) | 1)
        final_blended_mask = cv2.GaussianBlur(foundation_mask, (blur_k_f, blur_k_f), 0)

        # 5. LAB Exposure/Brightening Correction uniformly across mask
        img_lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB).astype(np.float32)
        m_norm = final_blended_mask.astype(np.float32) / 255.0
        
        brighten_units = 9.5 if is_bridal else 6.5
        img_lab[:, :, 0] += m_norm * brighten_units
        img_lab[:, :, 0] = np.clip(img_lab[:, :, 0], 0, 255)
        brightened = cv2.cvtColor(img_lab.astype(np.uint8), cv2.COLOR_LAB2BGR)

        # 6. Translucent color tint overlay (12% opacity for bridal, 8% for normal)
        color = self._parse_color(color_name)
        overlay_opacity = 0.12 if is_bridal else 0.08
        simulated = self._blend_overlay(brightened, final_blended_mask, color, opacity=overlay_opacity)

        # 7. Debug Mode composite grid generation
        try:
            from pathlib import Path
            debug_dir = Path("generated")
            debug_dir.mkdir(parents=True, exist_ok=True)
            
            # Standardize sizes for grid cells (360h x 270w)
            dh, dw = 360, 270
            grid_orig = cv2.resize(image, (dw, dh))
            grid_skin = cv2.resize(cv2.merge([skin_segmented_raw, skin_segmented_raw, skin_segmented_raw]), (dw, dh))
            grid_found = cv2.resize(cv2.merge([foundation_mask, foundation_mask, foundation_mask]), (dw, dh))
            grid_hair = cv2.resize(cv2.merge([hair_exclusion, hair_exclusion, hair_exclusion]), (dw, dh))
            grid_final = cv2.resize(cv2.merge([final_blended_mask, final_blended_mask, final_blended_mask]), (dw, dh))
            grid_out = cv2.resize(simulated, (dw, dh))
            
            font = cv2.FONT_HERSHEY_SIMPLEX
            # Label masks in the grid
            cv2.putText(grid_orig, "1. Original", (10, 30), font, 0.55, (0, 255, 0), 2)
            cv2.putText(grid_skin, "2. Skin Segmentation", (10, 30), font, 0.55, (0, 255, 0), 2)
            cv2.putText(grid_hair, "3. Hair Exclusion", (10, 30), font, 0.55, (0, 255, 0), 2)
            cv2.putText(grid_found, "4. Foundation Mask", (10, 30), font, 0.55, (0, 255, 0), 2)
            cv2.putText(grid_final, "5. Final Blended Mask", (10, 30), font, 0.55, (0, 255, 0), 2)
            cv2.putText(grid_out, "6. Blended Output", (10, 30), font, 0.55, (0, 255, 0), 2)
            
            # Arrange in a 2x3 grid
            row1 = np.hstack([grid_orig, grid_skin, grid_hair])
            row2 = np.hstack([grid_found, grid_final, grid_out])
            grid = np.vstack([row1, row2])
            cv2.imwrite("generated/debug_foundation.jpg", grid)
        except Exception as e:
            # Silence debug grid generation errors to prevent try-on crashes
            pass

        return simulated

    def _apply_lipstick(self, image: np.ndarray,
                        lm_dict: dict[int, FaceLandmark],
                        color_name: str,
                        is_bridal: bool = False) -> np.ndarray:
        """
        Realistic lipstick with satin finish.
        For bridal looks, adds slight lip contour (darker lip liner edge)
        and vertical center dimensional highlights for a soft glossy 3D dimension.
        """
        h, w = image.shape[:2]
        color = self._parse_color(color_name)

        outer_pts = np.array([[lm_dict[i].x_px, lm_dict[i].y_px]
                               for i in self.OUTER_LIPS if i in lm_dict], dtype=np.int32)
        inner_pts = np.array([[lm_dict[i].x_px, lm_dict[i].y_px]
                               for i in self.INNER_LIPS if i in lm_dict], dtype=np.int32)

        if len(outer_pts) == 0:
            return image

        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillPoly(mask, [outer_pts], 255)
        if len(inner_pts) > 0:
            cv2.fillPoly(mask, [inner_pts], 0)

        # Base lips mask (eroded slightly for no bleed)
        base_mask = cv2.erode(mask, np.ones((3, 3), np.uint8), iterations=1)
        base_mask_blur = cv2.GaussianBlur(base_mask, (7, 7), 0)

        # Apply base lipstick
        result = self._blend_color_lab(image, base_mask_blur, color,
                                       opacity=0.75, l_opacity_scale=0.15)

        # Subtle contour and center dimensional highlight for bridal
        if is_bridal:
            # 1. Subtle lip contour (lip liner along the outer edge)
            border_mask = cv2.subtract(mask, base_mask)
            border_mask_blur = cv2.GaussianBlur(border_mask, (5, 5), 0)
            
            b, g, r = color
            liner_color = (max(0, int(b * 0.72)), max(0, int(g * 0.68)), max(0, int(r * 0.72)))
            result = self._blend_multiply(result, border_mask_blur, liner_color, opacity=0.35)

            # 2. Vertical center dimensional highlight (soft glossy reflection)
            cx = int(np.mean(outer_pts[:, 0]))
            cy = int(np.mean(outer_pts[:, 1]))
            
            xs = outer_pts[:, 0]
            ys = outer_pts[:, 1]
            lip_width = max(1, xs.max() - xs.min())
            lip_height = max(1, ys.max() - ys.min())
            
            hl_mask = np.zeros((h, w), dtype=np.uint8)
            cv2.ellipse(hl_mask, (cx, cy), (int(lip_width * 0.18), int(lip_height * 0.45)), 0, 0, 360, 255, -1)
            cv2.bitwise_and(hl_mask, base_mask, dst=hl_mask)
            
            hl_blur = cv2.GaussianBlur(hl_mask, (11, 11), 0)
            
            img_lab = cv2.cvtColor(result, cv2.COLOR_BGR2LAB).astype(np.float32)
            m_norm = hl_blur.astype(np.float32) / 255.0
            
            img_lab[:, :, 0] += m_norm * 18.0  # dewy/glossy highlight
            img_lab[:, :, 0] = np.clip(img_lab[:, :, 0], 0, 255)
            
            result = cv2.cvtColor(img_lab.astype(np.uint8), cv2.COLOR_LAB2BGR)
            
        return result

    def _apply_blush(self, image: np.ndarray,
                     lm_dict: dict[int, FaceLandmark],
                     color_name: str,
                     is_bridal: bool = False) -> np.ndarray:
        """
        Soft radial blush on the cheek apple (landmarks 205/425).
        Uses a large Gaussian blur to simulate the airbrushed falloff of real blush.
        """
        h, w = image.shape[:2]

        if self.LEFT_CHEEK not in lm_dict or self.RIGHT_CHEEK not in lm_dict:
            return image

        pt_l = lm_dict[self.LEFT_CHEEK]
        pt_r = lm_dict[self.RIGHT_CHEEK]

        face_width = 100
        if 234 in lm_dict and 454 in lm_dict:
            face_width = abs(lm_dict[454].x_px - lm_dict[234].x_px)

        radius = int(face_width * 0.14)
        axes   = (int(radius * 1.3), int(radius * 0.72))

        # Position center of blush. For bridal, shift upward to "upper cheeks"
        cx_l, cy_l = pt_l.x_px, pt_l.y_px
        cx_r, cy_r = pt_r.x_px, pt_r.y_px
        if is_bridal:
            y_offset = int(face_width * 0.045)
            cy_l -= y_offset
            cy_r -= y_offset

        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.ellipse(mask, (cx_l, cy_l), axes, -15, 0, 360, 255, -1)
        cv2.ellipse(mask, (cx_r, cy_r), axes,  15, 0, 360, 255, -1)

        blur_k = max(31, int(face_width * 0.42) | 1)  # force odd, at least 31
        mask_blurred = cv2.GaussianBlur(mask, (blur_k, blur_k), 0)

        color = self._parse_color(color_name)
        # Increase opacity to 24% for bridal for a seamless soft-focus flush
        blush_opacity = 0.24 if is_bridal else 0.26
        return self._blend_color_lab(image, mask_blurred, color,
                                     opacity=blush_opacity, l_opacity_scale=0.10)

    def _apply_eyeshadow(self, image: np.ndarray,
                         lm_dict: dict[int, FaceLandmark],
                         color_name: str,
                         is_bridal: bool = False) -> np.ndarray:
        """
        5-layer professional eyeshadow system with bridal override and gold center halo:
        Layer 1 - Lid base     : Main color, gradient lash->crease, 38% (76% for bridal)
        Layer 1.5 - Center lid : Warm gold shimmer, dewy halo lid center, 24% (48% for bridal)
        Layer 2 - Crease depth : Darker, Gaussian bell at fold,      22% (44% for bridal)
        Layer 3 - Outer V      : Darkest, outer-third contour,       20% (40% for bridal)
        Layer 4 - Brow bone    : Champagne highlight below brow,     18% (36% for bridal)
        Layer 5 - Inner corner : Shimmer dot at tear duct,           25% (50% for bridal)
        """
        h, w = image.shape[:2]
        color = self._parse_color(color_name)
        b, g, r = color
        
        # Bridal specific palette override
        if is_bridal or color_name == "Champagne Shimmer" or color_name == "Gold" or "Champagne" in color_name:
            color = (195, 210, 228)             # Champagne Base
            gold_center_color = (55, 175, 212)  # Warm Gold Center
            crease_color = (43, 90, 139)        # Soft Brown Crease
            outer_v_color = (22, 46, 74)        # Deep Brown Outer V
        else:
            gold_center_color = (max(0, int(b * 0.85)), max(0, int(g * 0.90)), max(0, int(r * 0.85)))
            crease_color  = (max(0, int(b * 0.65)), max(0, int(g * 0.60)), max(0, int(r * 0.65)))
            outer_v_color = (max(0, int(b * 0.45)), max(0, int(g * 0.40)), max(0, int(r * 0.45)))

        highlight_bgr = (218, 205, 228)
        result = image.copy()

        face_width = 100
        if 234 in lm_dict and 454 in lm_dict:
            face_width = abs(lm_dict[454].x_px - lm_dict[234].x_px)

        def _pts(indices):
            return np.array([[lm_dict[i].x_px, lm_dict[i].y_px]
                              for i in indices if i in lm_dict], dtype=np.int32)

        eye_configs = [
            (self.LEFT_EYELID,  self.LEFT_EYE_OPEN,
             [33, 246, 161, 163], self.LEFT_EYEBROW,  [133, 154, 155, 173]),
            (self.RIGHT_EYELID, self.RIGHT_EYE_OPEN,
             [263, 466, 388, 390], self.RIGHT_EYEBROW, [362, 381, 382, 398]),
        ]

        # Define opacities. Double them if is_bridal (2x opacity)
        if is_bridal:
            op_lid = 0.76
            l_op_lid = 0.36
            op_shimmer = 0.48
            l_op_shimmer = 0.36
            op_crease = 0.44
            l_op_crease = 0.10
            op_outer = 0.40
            l_op_outer = 0.10
            op_brow = 0.36
            l_op_brow = 0.33
            op_inner = 0.50
            l_op_inner = 0.42
        else:
            op_lid = 0.38
            l_op_lid = 0.18
            op_shimmer = 0.24
            l_op_shimmer = 0.18
            op_crease = 0.22
            l_op_crease = 0.05
            op_outer = 0.20
            l_op_outer = 0.05
            op_brow = 0.18
            l_op_brow = 0.22
            op_inner = 0.25
            l_op_inner = 0.28

        for eyelid_idx, eye_open_idx, outer_v_idx, brow_idx, inner_idx in eye_configs:
            eyelid_pts = _pts(eyelid_idx)
            eye_pts    = _pts(eye_open_idx)
            if len(eyelid_pts) < 3:
                continue
            
            # Segment eyelid area
            seg = np.zeros((h, w), dtype=np.uint8)
            cv2.fillPoly(seg, [cv2.convexHull(eyelid_pts)], 255)
            if len(eye_pts) > 0:
                cv2.fillPoly(seg, [eye_pts], 0)

            # Layer 1: Lid base
            lid_grad = self._build_eye_gradient_mask(h, w, eyelid_pts, eye_pts, face_width)
            result   = self._blend_color_lab(result, lid_grad, color,
                                             opacity=op_lid, l_opacity_scale=l_op_lid)
            
            # Layer 1.5: Gold center lid shimmer (for halo eye / bridal look)
            if len(eyelid_pts) > 0:
                cx = int(np.mean(eyelid_pts[:, 0]))
                cy = int(np.mean(eyelid_pts[:, 1]))
                
                center_mask = np.zeros((h, w), dtype=np.uint8)
                cv2.ellipse(center_mask, (cx, cy), (int(face_width * 0.032), int(face_width * 0.045)), 0, 0, 360, 255, -1)
                cv2.bitwise_and(center_mask, seg, dst=center_mask)
                
                # Soften the gold shimmer using a wider face-relative blur kernel and lower opacity
                blur_k_shimmer = max(21, int(face_width * 0.08) | 1)
                center_blur = cv2.GaussianBlur(center_mask, (blur_k_shimmer, blur_k_shimmer), 0)
                result = self._blend_color_lab(result, center_blur, gold_center_color,
                                               opacity=op_shimmer, l_opacity_scale=l_op_shimmer)

            # Layer 2: Crease depth - Gaussian bell at mid-lid
            ys = np.where(seg > 0)[0]
            if len(ys) > 0:
                y_min   = int(ys.min())
                y_max   = int(ys.max())
                y_range = max(y_max - y_min, 1)
                t_inv   = np.clip((y_max - np.arange(h, dtype=np.float32)) / y_range, 0.0, 1.0)
                crease_w  = np.exp(-((t_inv - 0.50) ** 2) / (2 * 0.15 ** 2))
                crease_2d = crease_w[:, np.newaxis] * (seg.astype(np.float32) / 255.0)
                crease_u8 = (crease_2d * 255).clip(0, 255).astype(np.uint8)
                blur_k_crease = max(9, int(face_width * 0.04) | 1)
                crease_blur = cv2.GaussianBlur(crease_u8, (blur_k_crease, blur_k_crease), 0)
                result = self._blend_color_lab(result, crease_blur, crease_color,
                                               opacity=op_crease, l_opacity_scale=l_op_crease)
            # Layer 3: Outer V
            outer_pts = _pts(outer_v_idx)
            if len(outer_pts) >= 3:
                outer_mask = np.zeros((h, w), dtype=np.uint8)
                cv2.fillPoly(outer_mask, [cv2.convexHull(outer_pts)], 255)
                if len(eye_pts) > 0:
                    cv2.fillPoly(outer_mask, [eye_pts], 0)
                blur_k_outer = max(11, int(face_width * 0.05) | 1)
                outer_blur = cv2.GaussianBlur(outer_mask, (blur_k_outer, blur_k_outer), 0)
                result = self._blend_color_lab(result, outer_blur, outer_v_color,
                                               opacity=op_outer, l_opacity_scale=l_op_outer)
            # Layer 4: Brow bone highlight
            brow_pts = _pts(brow_idx)
            if len(brow_pts) >= 3:
                brow_bone = brow_pts.copy()
                brow_bone[:, 1] += 4
                hl_mask = np.zeros((h, w), dtype=np.uint8)
                cv2.fillPoly(hl_mask, [cv2.convexHull(brow_bone)], 255)
                blur_k_hl = max(15, int(face_width * 0.06) | 1)
                hl_blur = cv2.GaussianBlur(hl_mask, (blur_k_hl, blur_k_hl), 0)
                result = self._blend_color_lab(result, hl_blur, highlight_bgr,
                                               opacity=op_brow, l_opacity_scale=l_op_brow)
            # Layer 5: Inner corner highlight
            inner_pts = _pts(inner_idx)
            if len(inner_pts) >= 2:
                cx = int(np.mean(inner_pts[:, 0]))
                cy = int(np.mean(inner_pts[:, 1]))
                ic_mask = np.zeros((h, w), dtype=np.uint8)
                cv2.circle(ic_mask, (cx, cy), 5, 255, -1)
                blur_k_ic = max(5, int(face_width * 0.02) | 1)
                ic_blur = cv2.GaussianBlur(ic_mask, (blur_k_ic, blur_k_ic), 0)
                result = self._blend_color_lab(result, ic_blur, highlight_bgr,
                                               opacity=op_inner, l_opacity_scale=l_op_inner)

        return result

        return result

    def _apply_eyeliner(self, image: np.ndarray,
                        lm_dict: dict[int, FaceLandmark]) -> np.ndarray:
        """
        Cat-eye eyeliner matching the reference photo:
        1. Upper lash line — thin precise stroke
        2. Cat-eye wing — triangular flick at outer corner (direction-vector math)
        3. Lower lash smudge — outer 1/3 only at reduced opacity for depth
        """
        h, w = image.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)

        face_width = 100
        if 234 in lm_dict and 454 in lm_dict:
            face_width = abs(lm_dict[454].x_px - lm_dict[234].x_px)

        thickness = max(1, int(face_width * 0.007))

        # ── 1. Upper lash lines ─────────────────────────────────────────────
        l_liner = np.array([[lm_dict[i].x_px, lm_dict[i].y_px]
                              for i in self.LEFT_EYELINER if i in lm_dict], dtype=np.int32)
        r_liner = np.array([[lm_dict[i].x_px, lm_dict[i].y_px]
                              for i in self.RIGHT_EYELINER if i in lm_dict], dtype=np.int32)

        if len(l_liner) > 0:
            cv2.polylines(mask, [l_liner], False, 255, thickness=thickness, lineType=cv2.LINE_AA)
        if len(r_liner) > 0:
            cv2.polylines(mask, [r_liner], False, 255, thickness=thickness, lineType=cv2.LINE_AA)

        # ── 2. Cat-eye wing (filled triangle at outer corner) ───────────────
        wing_len = int(face_width * 0.075)  # ~7.5% of face width for visible wing

        def _add_wing(outer_idx: int, prev_idx: int):
            """Draw a filled triangular wing flick at the outer eye corner."""
            if outer_idx not in lm_dict or prev_idx not in lm_dict:
                return
            corner = np.array([lm_dict[outer_idx].x_px, lm_dict[outer_idx].y_px], dtype=np.float32)
            prev   = np.array([lm_dict[prev_idx].x_px,  lm_dict[prev_idx].y_px],  dtype=np.float32)

            # Direction along the outer lash toward the outer corner
            d = corner - prev
            norm = np.linalg.norm(d)
            if norm == 0:
                return
            d = d / norm

            # Wing tilts upward (−y in image coords) at ~35°
            up = np.array([0.0, -1.0], dtype=np.float32)
            wing_dir = d * 0.82 + up * 0.57          # blend outward + upward
            wing_dir /= np.linalg.norm(wing_dir)

            tip      = (corner + wing_dir * wing_len).astype(np.int32)
            base_out = corner.astype(np.int32)        # outer corner
            # Step inward along the lash line direction (-d) to pull base inward and sit flush
            base_in  = (corner - d * (wing_len * 0.25)).astype(np.int32)

            # Filled triangle: corner → tip → base_in
            tri = np.array([base_out, tip, base_in], dtype=np.int32)
            cv2.fillPoly(mask, [tri], 255)
            # Outline for crispness
            cv2.polylines(mask, [tri], True, 255, thickness=1, lineType=cv2.LINE_AA)

        # Left eye: outer corner = 130, next inward = 246
        _add_wing(130, 246)
        # Right eye: outer corner = 263, next inward = 466
        _add_wing(263, 466)

        # ── 3. Lower lash line — outer third only, smudged ─────────────────
        # Only the outer 1/3 of the lower lid for depth (as in reference)
        lower_mask = np.zeros((h, w), dtype=np.uint8)
        # Left lower outer: 130→163→144→145 (outer corner inward)
        # Right lower outer: 263→390→373→374
        for pts_indices in [[130, 163, 144, 145], [263, 390, 373, 374]]:
            pts = np.array([[lm_dict[i].x_px, lm_dict[i].y_px]
                             for i in pts_indices if i in lm_dict], dtype=np.int32)
            if len(pts) > 1:
                cv2.polylines(lower_mask, [pts], False, 255,
                              thickness=max(1, thickness - 1), lineType=cv2.LINE_AA)

        lower_blur = cv2.GaussianBlur(lower_mask, (5, 5), 0)

        # Blend upper + lower masks (lower at 40% relative weight)
        combined_mask = np.clip(
            mask.astype(np.int32) + (lower_blur.astype(np.int32) * 40 // 100), 0, 255
        ).astype(np.uint8)
        final_blur = cv2.GaussianBlur(combined_mask, (3, 3), 0)

        return self._blend_multiply(image, final_blur, (8, 8, 12), opacity=0.78)

    def _apply_eyebrows(self, image: np.ndarray,
                        lm_dict: dict[int, FaceLandmark]) -> np.ndarray:
        """
        Keeps eyebrows exactly as they are in the original image to preserve realism.
        """
        return image

    def _render_eyebrow_strokes(self, image: np.ndarray, lm_dict: dict[int, FaceLandmark],
                                first_half: list[int], second_half: list[int],
                                color: tuple[int, int, int], opacity: float,
                                num_hairs: int = 140) -> np.ndarray:
        h, w = image.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)
        
        # 1. Extract 5 points for upper and lower boundaries (inner to outer)
        upper_pts = []
        for i in range(5):
            idx = first_half[4 - i]
            upper_pts.append(np.array([lm_dict[idx].x_px, lm_dict[idx].y_px], dtype=np.float32))
            
        lower_pts = []
        for i in range(5):
            idx = second_half[i]
            lower_pts.append(np.array([lm_dict[idx].x_px, lm_dict[idx].y_px], dtype=np.float32))
            
        def get_pt(pts_list, t_val):
            t_val = np.clip(t_val, 0.0, 1.0)
            segment = int(t_val * 4)
            if segment >= 4:
                segment = 3
            local_t = (t_val * 4) - segment
            return (1.0 - local_t) * pts_list[segment] + local_t * pts_list[segment + 1]
            
        # Draw individual hairs
        for i in range(num_hairs):
            t = i / float(num_hairs - 1)
            
            # Deterministic pseudo-random jitter via math.sin to avoid spacing patterns
            t_jitter = t + 0.01 * math.sin(i * 3.7)
            t_jitter = np.clip(t_jitter, 0.0, 1.0)
            
            p_up = get_pt(upper_pts, t_jitter)
            p_low = get_pt(lower_pts, t_jitter)
            
            height_vec = p_up - p_low
            height = np.linalg.norm(height_vec)
            if height == 0:
                continue
                
            V_up = height_vec / height
            
            # Longitudinal vector
            p_low_next = get_pt(lower_pts, min(t_jitter + 0.08, 1.0))
            p_low_prev = get_pt(lower_pts, max(t_jitter - 0.08, 0.0))
            V_along = p_low_next - p_low_prev
            valong_norm = np.linalg.norm(V_along)
            if valong_norm > 0:
                V_along = V_along / valong_norm
            else:
                V_along = np.array([1.0, 0.0], dtype=np.float32)
                
            # Deterministic pseudo-random vertical start position (u)
            u_jitter = 0.5 * (math.sin(i * 7.1) + 1.0)
            u = -0.08 + u_jitter * 1.0
            p_start = p_low + u * height_vec
            
            # Angle of hair growth relative to V_up
            angle_jitter = 6.0 * math.sin(i * 11.3)
            angle_deg = 12.0 + t_jitter * 73.0 + angle_jitter
            angle_rad = np.radians(angle_deg)
            
            # Combine vectors
            V_grow = np.cos(angle_rad) * V_up + np.sin(angle_rad) * V_along
            vgrow_norm = np.linalg.norm(V_grow)
            if vgrow_norm > 0:
                V_grow /= vgrow_norm
            else:
                V_grow = V_up
                
            # Stroke length
            len_jitter = 0.5 * (math.sin(i * 17.9) + 1.0)
            hair_len = height * (0.38 + len_jitter * 0.20)
            p_end = p_start + hair_len * V_grow
            
            # Bending control point
            p_mid = 0.5 * (p_start + p_end)
            p_ctrl = p_mid + 0.12 * hair_len * V_along
            
            self._draw_bezier_hair(mask, p_start, p_ctrl, p_end)
            
        mask_blurred = cv2.GaussianBlur(mask, (3, 3), 0)
        return self._blend_multiply(image, mask_blurred, color, opacity=opacity)

    def _draw_bezier_hair(self, mask: np.ndarray, p0: np.ndarray, p1: np.ndarray, p2: np.ndarray):
        steps = 8
        curve_pts = []
        for t_val in range(steps + 1):
            t = t_val / steps
            pt = (1 - t)**2 * p0 + 2 * (1 - t) * t * p1 + t**2 * p2
            curve_pts.append(pt.astype(np.int32))
            
        curve_pts = np.array(curve_pts, dtype=np.int32)
        cv2.polylines(mask, [curve_pts], False, 255, thickness=1, lineType=cv2.LINE_AA)

    def _apply_contour(self, image: np.ndarray,
                       lm_dict: dict[int, FaceLandmark],
                       intensity_str: str) -> np.ndarray:
        """
        Soft anatomical contouring targeting:
        1. Cheek hollows (lower cheekbone area)
        2. Jawline (shading along jaw boundary)
        3. Nose bridge sides (vertical structure definition)
        4. Forehead perimeter (soft framing shadow along the hairline)
        Uses a large Gaussian blur to blend smoothly.
        """
        h, w = image.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)

        face_width = 100
        if 234 in lm_dict and 454 in lm_dict:
            face_width = abs(lm_dict[454].x_px - lm_dict[234].x_px)

        def _pts(indices):
            return np.array([[lm_dict[i].x_px, lm_dict[i].y_px]
                              for i in indices if i in lm_dict], dtype=np.int32)

        # ── 1. Cheek Contour Hollows ─────────────────────────────────────────
        l_cheek = _pts([127, 234, 93, 137, 177, 215])
        r_cheek = _pts([356, 454, 323, 366, 401, 435])
        
        # ── 2. Jaw Contour ───────────────────────────────────────────────────
        l_jaw = _pts([172, 136, 150, 149, 176])
        r_jaw = _pts([397, 365, 379, 378, 400])

        # ── 3. Nose Contour Sides ────────────────────────────────────────────
        l_nose = _pts([189, 221, 220, 193])
        r_nose = _pts([413, 441, 440, 417])

        # ── 4. Forehead Perimeter Contour (framing the hairline) ───────────────
        # Shift forehead perimeter points upwards to the hairline to match the foundation extension
        if 152 in lm_dict and 10 in lm_dict:
            y_152 = lm_dict[152].y_px
            y_10 = lm_dict[10].y_px
            face_height = abs(y_152 - y_10)
        else:
            face_height = h // 2
        dy = int(0.18 * face_height)

        forehead_perimeter_indices = [127, 162, 21, 54, 103, 67, 109, 10, 338, 297, 332, 284, 251, 389, 356]
        upper_indices = {10, 338, 297, 332, 284, 251, 127, 162, 21, 54, 103, 67, 109}

        forehead_perimeter = []
        for idx in forehead_perimeter_indices:
            if idx in lm_dict:
                x = lm_dict[idx].x_px
                y = lm_dict[idx].y_px
                if idx in upper_indices:
                    y = max(0, y - dy)
                forehead_perimeter.append([x, y])
        forehead_perimeter = np.array(forehead_perimeter, dtype=np.int32)

        # Draw cheek contour lines as thick paths on mask
        thickness_cheek = max(4, int(face_width * 0.04))
        if len(l_cheek) > 1:
            cv2.polylines(mask, [l_cheek], False, 255, thickness=thickness_cheek, lineType=cv2.LINE_AA)
        if len(r_cheek) > 1:
            cv2.polylines(mask, [r_cheek], False, 255, thickness=thickness_cheek, lineType=cv2.LINE_AA)

        # Draw jaw contour paths
        thickness_jaw = max(4, int(face_width * 0.05))
        if len(l_jaw) > 1:
            cv2.polylines(mask, [l_jaw], False, 255, thickness=thickness_jaw, lineType=cv2.LINE_AA)
        if len(r_jaw) > 1:
            cv2.polylines(mask, [r_jaw], False, 255, thickness=thickness_jaw, lineType=cv2.LINE_AA)

        # Draw nose contour paths (thinner)
        thickness_nose = max(2, int(face_width * 0.015))
        if len(l_nose) > 1:
            cv2.polylines(mask, [l_nose], False, 255, thickness=thickness_nose, lineType=cv2.LINE_AA)
        if len(r_nose) > 1:
            cv2.polylines(mask, [r_nose], False, 255, thickness=thickness_nose, lineType=cv2.LINE_AA)

        # Draw forehead perimeter contour path
        thickness_forehead = max(4, int(face_width * 0.045))
        if len(forehead_perimeter) > 1:
            cv2.polylines(mask, [forehead_perimeter], False, 255, thickness=thickness_forehead, lineType=cv2.LINE_AA)

        # Feather contour mask with a very wide blur to simulate realistic airbrush shadow
        blur_k = max(25, int(face_width * 0.15) | 1)
        mask_blurred = cv2.GaussianBlur(mask, (blur_k, blur_k), 0)

        # Set opacity based on recommendation intensity (15-25% range requested by user)
        opacity = 0.17
        if "Medium" in intensity_str:
            opacity = 0.21
        elif "Deep" in intensity_str or "Heavy" in intensity_str:
            opacity = 0.25

        # Cool dark brown shadow tone: BGR (45, 55, 72)
        return self._blend_multiply(image, mask_blurred, (45, 55, 72), opacity=opacity)

    def _apply_highlighter(self, image: np.ndarray,
                           lm_dict: dict[int, FaceLandmark],
                           style_str: str,
                           is_bridal: bool = False) -> np.ndarray:
        """
        Luminous highlight glow in LAB space on:
        1. Cheekbones (high outer cheeks: landmark 117 left, 346 right)
        2. Nose bridge (vertical center: landmarks 168 -> 6 -> 197 -> 195)
        3. Cupid's bow (upper lip boundary center: landmark 0)
        4. Brow bone (outer under-brow arches: landmarks 53 left, 283 right)
        5. Nose tip (landmark 4)
        """
        h, w = image.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)

        face_width = 100
        if 234 in lm_dict and 454 in lm_dict:
            face_width = abs(lm_dict[454].x_px - lm_dict[234].x_px)

        # Helper to get coordinate tuple
        def _pt(idx):
            if idx in lm_dict:
                return (lm_dict[idx].x_px, lm_dict[idx].y_px)
            return None

        # ── 1. Cheekbone Highlights (ellipses tilted upwards) ────────────────
        radius = int(face_width * 0.07)
        axes = (int(radius * 1.2), int(radius * 0.45))
        
        pt_l = _pt(117)
        pt_r = _pt(346)
        if pt_l:
            cv2.ellipse(mask, pt_l, axes, -10, 0, 360, 255, -1)
        if pt_r:
            cv2.ellipse(mask, pt_r, axes, 10, 0, 360, 255, -1)

        # ── 2. Nose Bridge Highlight (thin strip - softer intensity) ────────
        nose_indices = [168, 6, 197, 195]
        nose_pts = np.array([[_pt(i)[0], _pt(i)[1]] for i in nose_indices if _pt(i) is not None], dtype=np.int32)
        if len(nose_pts) > 1:
            cv2.polylines(mask, [nose_pts], False, 100, thickness=max(2, int(face_width * 0.02)), lineType=cv2.LINE_AA)

        # ── 3. Cupid's Bow Highlight (small circle dot - softer intensity) ───
        pt_cb = _pt(0)
        if pt_cb:
            cv2.circle(mask, pt_cb, max(2, int(face_width * 0.015)), 60, -1)

        # ── 4. Brow Bone Highlights (small ellipses directly below brow arches) ──
        pt_bb_l = _pt(53)
        pt_bb_r = _pt(283)
        axes_bb = (int(radius * 0.6), int(radius * 0.2))
        if pt_bb_l:
            cv2.ellipse(mask, pt_bb_l, axes_bb, -5, 0, 360, 100, -1)
        if pt_bb_r:
            cv2.ellipse(mask, pt_bb_r, axes_bb, 5, 0, 360, 100, -1)

        # ── 5. Nose Tip Highlight (small circle dot - softer intensity) ──────
        pt_nt = _pt(4)
        if pt_nt:
            cv2.circle(mask, pt_nt, max(2, int(face_width * 0.015)), 60, -1)

        # Restrict highlight mask to the face outline to avoid bleed into hair/background
        face_outline_indices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
        pts_outline = np.array([[lm_dict[i].x_px, lm_dict[i].y_px]
                                for i in face_outline_indices if i in lm_dict], dtype=np.int32)
        if len(pts_outline) > 0:
            face_mask = np.zeros((h, w), dtype=np.uint8)
            cv2.fillPoly(face_mask, [pts_outline], 255)
            cv2.bitwise_and(mask, face_mask, dst=mask)

        # Smooth highlights widely to make them seamlessly luminous
        blur_k = max(31, int(face_width * 0.15) | 1)
        mask_blurred = cv2.GaussianBlur(mask, (blur_k, blur_k), 0)

        # Luminous LAB blend: convert to LAB and add lightness
        img_lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB).astype(np.float32)
        m_norm = mask_blurred.astype(np.float32) / 255.0

        # Lightness increase: gentle glow_val to prevent patchiness
        glow_val = 3.0
        if is_bridal:
            glow_val = 4.0
        elif "High" in style_str or "Dewy" in style_str:
            glow_val = 3.5

        img_lab[:, :, 0] += m_norm * glow_val
        img_lab[:, :, 0] = np.clip(img_lab[:, :, 0], 0, 255)

        # Slightly shift towards champagne/gold tone (B = positive yellow)
        img_lab[:, :, 2] += m_norm * 2.0  # slight gold warmth
        img_lab[:, :, 2] = np.clip(img_lab[:, :, 2], 0, 255)

        return cv2.cvtColor(img_lab.astype(np.uint8), cv2.COLOR_LAB2BGR)

    # ── Main simulate() entry point ────────────────────────────────────────────

    def simulate(self, image: np.ndarray, landmarks: list[FaceLandmark],
                 look: RecommendedLook, step: int = 3,
                 lash_intensity: float = 0.8, lash_style: str | None = None) -> np.ndarray:
        """
        Simulates makeup layers sequentially based on the step of the UI:
          Step 1 (Base)  : Foundation + Contour
          Step 2 (Eyes)  : Foundation + Contour + Eyeshadow + Eyeliner + Eyelashes + Eyebrows
          Step 3 (Final) : All of the above + Lipstick + Blush + Highlighter
        """
        lm_dict   = {lm.index: lm for lm in landmarks}
        simulated = image.copy()
        rec       = look.personalized_recommendations
        is_bridal = (look.category == "Bridal")

        # Step 1: Base foundation and contour
        simulated = self._apply_foundation(simulated, lm_dict, rec.foundation_shade, is_bridal=is_bridal)
        simulated = self._apply_contour(simulated, lm_dict, rec.contour_intensity)

        if step >= 2:
            # Eyes: eyeshadow → eyeliner
            simulated = self._apply_eyeshadow(simulated, lm_dict, rec.eyeshadow_color, is_bridal=is_bridal)
            simulated = self._apply_eyeliner(simulated, lm_dict)
            
            # Eyelashes rendering matching look category
            resolved_style = lash_style
            if not resolved_style:
                if look.category == "Bridal":
                    resolved_style = "Bridal"
                elif look.category == "Glam":
                    resolved_style = "Glam"
                else:
                    resolved_style = "Natural"
            simulated = self.lash_renderer.render(simulated, lm_dict, style=resolved_style, intensity=lash_intensity)

            # Eyebrows rendering with realistic hair strokes
            simulated = self._apply_eyebrows(simulated, lm_dict)

        if step >= 3:
            # Lips, cheeks, and highlighters
            simulated = self._apply_lipstick(simulated, lm_dict, rec.lipstick_color, is_bridal=is_bridal)
            blush_color_name = "Peach-Rose" if is_bridal else rec.blush_color
            simulated = self._apply_blush(simulated, lm_dict, blush_color_name, is_bridal=is_bridal)
            simulated = self._apply_highlighter(simulated, lm_dict, rec.highlight_style, is_bridal=is_bridal)

        return simulated


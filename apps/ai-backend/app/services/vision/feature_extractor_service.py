import cv2
import numpy as np
import mediapipe as mp
import logging
from typing import Dict, Any, Tuple

logger = logging.getLogger(__name__)


class FeatureExtractorService:
    """
    OpenCV + MediaPipe face mesh analyzer.
    Extracts cosmetic metrics, face shape, skin tone, undertones, lip, and eyeshadow features.
    """
    def __init__(self) -> None:
        self.mp_face_mesh = mp.solutions.face_mesh

    def extract_features(self, image_np: np.ndarray) -> dict:
        """
        Runs face mesh landmarks, parses specific color regions (lips, cheek, forehead),
        calculates ratios for face shape, and compiles cosmetic feature profiles.
        """
        if image_np is None or image_np.size == 0:
            return self._get_default_features()

        h, w = image_np.shape[:2]
        rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)

        # 1. Run MediaPipe Face Mesh
        with self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5
        ) as face_mesh:
            results = face_mesh.process(rgb)
            if not results.multi_face_landmarks:
                logger.warning("No face mesh landmarks detected during feature extraction. Using defaults.")
                return self._get_default_features()

            landmarks = results.multi_face_landmarks[0].landmark

        try:
            # 2. Extract Key Coordinates
            # Convert relative coordinates to absolute pixels
            def get_pixel(idx):
                lm = landmarks[idx]
                return int(lm.x * w), int(lm.y * h)

            # Left/right face contours for shape calculations
            forehead_left = get_pixel(21)
            forehead_right = get_pixel(251)
            jaw_left = get_pixel(172)
            jaw_right = get_pixel(397)
            chin_tip = get_pixel(152)
            forehead_top = get_pixel(10)
            
            # Widths & Height
            forehead_width = np.linalg.norm(np.array(forehead_left) - np.array(forehead_right))
            jaw_width = np.linalg.norm(np.array(jaw_left) - np.array(jaw_right))
            face_height = np.linalg.norm(np.array(forehead_top) - np.array(chin_tip))

            # 3. Calculate Face Shape
            ratio_w_h = jaw_width / face_height if face_height > 0 else 0.8
            ratio_f_j = forehead_width / jaw_width if jaw_width > 0 else 1.0

            face_shape = "Oval"
            if ratio_w_h > 0.85:
                face_shape = "Round" if ratio_f_j < 1.1 else "Square"
            elif ratio_w_h < 0.70:
                face_shape = "Oval"
            elif ratio_f_j > 1.2:
                face_shape = "Heart"

            # 4. Extract Skin Tone & Undertone
            # Sample forehead skin patch (Index 10 is center top forehead)
            fx, fy = get_pixel(10)
            # Sample cheek skin patch (Index 111 is left cheek center)
            cx, cy = get_pixel(111)
            
            # Extract color patches and calculate average BGR
            skin_pixels = []
            for px, py in [(fx, fy + 20), (cx, cy), (cx - 10, cy)]:
                if 0 <= px < w and 0 <= py < h:
                    skin_pixels.append(image_np[py, px])
                    
            if skin_pixels:
                avg_skin_bgr = np.mean(skin_pixels, axis=0)
            else:
                avg_skin_bgr = np.array([180, 200, 220]) # Default soft fair skin

            b, g, r = avg_skin_bgr
            
            # Simple skin tone thresholding
            skin_brightness = 0.299 * r + 0.587 * g + 0.114 * b
            skin_tone = "Medium"
            if skin_brightness > 190:
                skin_tone = "Fair"
            elif skin_brightness < 110:
                skin_tone = "Deep"

            # Undertone calculation: check cool (pinkish, r > b) vs warm (golden, r >> g)
            # Warm skin has higher Red and Green relative to Blue
            undertone = "Neutral"
            if r > g * 1.08 and g > b * 1.05:
                undertone = "Warm"
            elif b > g * 0.95:
                undertone = "Cool"

            # 5. Extract Lip Details
            # Lip indices: center lip index 13, outer lips 14
            lx, ly = get_pixel(13)
            # Sample a small crop around the lip center
            lip_pixels = []
            for dx in range(-5, 6):
                for dy in range(-2, 3):
                    px, py = lx + dx, ly + dy
                    if 0 <= px < w and 0 <= py < h:
                        lip_pixels.append(image_np[py, px])
            
            avg_lip_bgr = np.mean(lip_pixels, axis=0) if lip_pixels else np.array([50, 50, 150])
            lb, lg, lr = avg_lip_bgr
            lip_hex = f"#{int(lr):02x}{int(lg):02x}{int(lb):02x}"

            # Saturation / Brightness of lips
            lip_hsv = cv2.cvtColor(np.uint8([[avg_lip_bgr]]), cv2.COLOR_BGR2HSV)[0][0]
            lsat = lip_hsv[1]
            lval = lip_hsv[2]

            lip_saturation = "Medium"
            if lsat > 160:
                lip_saturation = "Bold"
            elif lsat < 80:
                lip_saturation = "Nude"

            lip_brightness = "Medium"
            if lval > 180:
                lip_brightness = "Bright"
            elif lval < 90:
                lip_brightness = "Dark"

            # 6. Eyeshadow area sampling (Above upper eyelids)
            # Eyelid top points: Left 223, Right 443
            lex, ley = get_pixel(223)
            rex, rey = get_pixel(443)
            
            eye_pixels = []
            for px, py in [(lex, ley - 10), (rex, rey - 10)]:
                if 0 <= px < w and 0 <= py < h:
                    eye_pixels.append(image_np[py, px])
            
            avg_eye_bgr = np.mean(eye_pixels, axis=0) if eye_pixels else np.array([120, 140, 160])
            eb, eg, er = avg_eye_bgr
            eyeshadow_hex = f"#{int(er):02x}{int(eg):02x}{int(eb):02x}"
            
            eye_hsv = cv2.cvtColor(np.uint8([[avg_eye_bgr]]), cv2.COLOR_BGR2HSV)[0][0]
            esat = eye_hsv[1]
            eyeshadow_intensity = "Medium"
            if esat > 120:
                eyeshadow_intensity = "Bold"
            elif esat < 40:
                eyeshadow_intensity = "Subtle"

            # Foundation finish estimation based on highlights specular reflections
            # High variance in skin forehead pixels indicates specular dewy finish
            finish = "Matte"
            forehead_patch = image_np[max(0, fy-15):min(h, fy+15), max(0, fx-15):min(w, fx+15)]
            if forehead_patch.size > 0:
                gray_forehead = cv2.cvtColor(forehead_patch, cv2.COLOR_BGR2GRAY)
                std_dev = np.std(gray_forehead)
                if std_dev > 15:
                    finish = "Dewy"
                elif std_dev > 8:
                    finish = "Satin"

            # Safe guesses for details we can't extract accurately via basic CV
            foundation_shade = "Natural Beige"
            if skin_tone == "Fair":
                foundation_shade = "Rose Alabaster / Cool Ivory" if undertone == "Cool" else "Porcelain Warm / Warm Ivory"
            elif skin_tone == "Deep":
                foundation_shade = "Rich Espresso / Cocoa" if undertone == "Cool" else "Rich Almond"

            # 7. Sampling average BGR color of the clothing region (bottom 25% of the image)
            clothing_region = image_np[int(h * 0.75):h, :]
            if clothing_region.size > 0:
                avg_clothing_bgr = np.mean(clothing_region, axis=(0, 1))
            else:
                avg_clothing_bgr = np.array([100, 100, 100])
            
            clothing_hex = f"#{int(avg_clothing_bgr[2]):02x}{int(avg_clothing_bgr[1]):02x}{int(avg_clothing_bgr[0]):02x}"

            return {
                "foundation_shade": foundation_shade,
                "foundation_finish": finish,
                "lip_color": lip_hex,
                "lip_saturation": lip_saturation,
                "lip_brightness": lip_brightness,
                "eyeshadow_color": eyeshadow_hex,
                "eyeshadow_intensity": eyeshadow_intensity,
                "blush": "Peach-Pink" if skin_tone == "Medium" else "Soft Pink",
                "contour": "Medium" if skin_tone == "Medium" else "Light",
                "highlight": "Dewy" if finish == "Dewy" else "Natural",
                "eyebrow_color": "Dark Brown",
                "skin_tone": skin_tone,
                "undertone": undertone,
                "face_shape": face_shape,
                "clothing_color": [float(avg_clothing_bgr[0]), float(avg_clothing_bgr[1]), float(avg_clothing_bgr[2])],
                "clothing_hex": clothing_hex
            }

        except Exception as e:
            logger.error(f"Error parsing face features: {str(e)}")
            return self._get_default_features()

    def _get_default_features(self) -> dict:
        return {
            "foundation_shade": "Natural Beige",
            "foundation_finish": "Matte",
            "lip_color": "#D33F5B",
            "lip_saturation": "Medium",
            "lip_brightness": "Medium",
            "eyeshadow_color": "#C59A40",
            "eyeshadow_intensity": "Medium",
            "blush": "Peach-Pink",
            "contour": "Medium",
            "highlight": "Natural",
            "eyebrow_color": "Dark Brown",
            "skin_tone": "Medium",
            "undertone": "Neutral",
            "face_shape": "Oval",
            "clothing_color": [100.0, 100.0, 100.0],
            "clothing_hex": "#646464"
        }

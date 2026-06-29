import math
import numpy as np
from app.schemas.face import FaceLandmark


class FaceShapeService:
    """Classifies face shape from MediaPipe Face Mesh landmarks using geometric ratios."""

    # ── Landmark indices ───────────────────────────────────────────────────────
    # Carefully chosen MediaPipe Face Mesh 468-point indices that map to
    # anatomically meaningful positions — not the extreme mesh edge.
    FOREHEAD_TOP    = 10    # Mid-hairline (vertical top of face)
    CHIN_BOTTOM     = 152   # Chin tip (vertical bottom)

    # Forehead width: outer hairline at same horizontal level
    LEFT_FOREHEAD   = 21    # Left outer temple at hairline
    RIGHT_FOREHEAD  = 251   # Right outer temple at hairline

    # Cheekbone width: true zygomatic prominence (cheek apple), NOT ear
    LEFT_CHEEKBONE  = 123   # Left zygomatic arch prominence
    RIGHT_CHEEKBONE = 352   # Right zygomatic arch prominence

    # Jaw width: lower jaw corner
    LEFT_JAW        = 172   # Left jaw angle (lower)
    RIGHT_JAW       = 397   # Right jaw angle (lower)

    def calculate_distance(self, p1: FaceLandmark, p2: FaceLandmark) -> float:
        """Calculate Euclidean distance between two landmarks in pixel coordinates."""
        return math.sqrt((p1.x_px - p2.x_px) ** 2 + (p1.y_px - p2.y_px) ** 2)

    def calculate_face_length(self, landmarks: list[FaceLandmark]) -> float:
        """Calculate the vertical length of the face (forehead top to chin bottom)."""
        lm = {l.index: l for l in landmarks}
        return self.calculate_distance(lm[self.FOREHEAD_TOP], lm[self.CHIN_BOTTOM])

    def calculate_forehead_width(self, landmarks: list[FaceLandmark]) -> float:
        """Calculate horizontal forehead width (left hairline to right hairline)."""
        lm = {l.index: l for l in landmarks}
        return self.calculate_distance(lm[self.LEFT_FOREHEAD], lm[self.RIGHT_FOREHEAD])

    def calculate_cheekbone_width(self, landmarks: list[FaceLandmark]) -> float:
        """Calculate horizontal cheekbone width (left zygomatic to right zygomatic)."""
        lm = {l.index: l for l in landmarks}
        return self.calculate_distance(lm[self.LEFT_CHEEKBONE], lm[self.RIGHT_CHEEKBONE])

    def calculate_jaw_width(self, landmarks: list[FaceLandmark]) -> float:
        """Calculate horizontal jaw width (left jaw corner to right jaw corner)."""
        lm = {l.index: l for l in landmarks}
        return self.calculate_distance(lm[self.LEFT_JAW], lm[self.RIGHT_JAW])

    def _gaussian_score(self, value: float, target: float, std_dev: float) -> float:
        """Similarity score [0,1] based on a Gaussian distribution."""
        return math.exp(-0.5 * ((value - target) / std_dev) ** 2)

    def calculate_chin_angle(self, landmarks: list[FaceLandmark]) -> float:
        """Calculate the chin angle in degrees using landmarks 175, 152, 396."""
        lm = {l.index: l for l in landmarks}
        if 152 not in lm or 175 not in lm or 396 not in lm:
            return 120.0

        p_chin  = lm[152]
        p_left  = lm[175]
        p_right = lm[396]

        v_left  = np.array([p_left.x_px  - p_chin.x_px, p_left.y_px  - p_chin.y_px], dtype=np.float32)
        v_right = np.array([p_right.x_px - p_chin.x_px, p_right.y_px - p_chin.y_px], dtype=np.float32)

        mag_l = np.linalg.norm(v_left)
        mag_r = np.linalg.norm(v_right)
        if mag_l == 0 or mag_r == 0:
            return 120.0

        cos_theta = np.clip(np.dot(v_left, v_right) / (mag_l * mag_r), -1.0, 1.0)
        return math.degrees(math.acos(cos_theta))

    def classify(self, landmarks: list[FaceLandmark]) -> tuple[str, float, dict[str, any]]:
        """
        Classifies the face shape using geometric ratios.

        Returns:
            (face_shape, confidence, measurements_dict)
        """
        lm_dict = {l.index: l for l in landmarks}
        required = [
            self.FOREHEAD_TOP, self.CHIN_BOTTOM,
            self.LEFT_FOREHEAD, self.RIGHT_FOREHEAD,
            self.LEFT_CHEEKBONE, self.RIGHT_CHEEKBONE,
            self.LEFT_JAW, self.RIGHT_JAW,
        ]
        for idx in required:
            if idx not in lm_dict:
                raise ValueError(f"Required landmark index {idx} is missing.")

        face_length     = self.calculate_face_length(landmarks)
        forehead_width  = self.calculate_forehead_width(landmarks)
        cheekbone_width = self.calculate_cheekbone_width(landmarks)
        jaw_width       = self.calculate_jaw_width(landmarks)
        chin_angle      = self.calculate_chin_angle(landmarks)

        if face_length == 0 or cheekbone_width == 0 or jaw_width == 0:
            raise ValueError("Calculated face dimensions must not be zero.")

        face_width_ratio            = cheekbone_width / face_length
        length_to_width_ratio       = face_length / cheekbone_width
        forehead_to_jaw_ratio       = forehead_width / jaw_width
        forehead_to_cheekbone_ratio = forehead_width / cheekbone_width
        jaw_to_cheekbone_ratio      = jaw_width / cheekbone_width

        # ── Shape profiles ─────────────────────────────────────────────────────
        # (target, std_dev, weight)
        # lw = face_length / cheekbone_width  — elongation
        # fj = forehead / jaw                 — narrow vs wide bottom
        # fc = forehead / cheekbone           — proportionality
        # jc = jaw / cheekbone                — jaw breadth relative to cheek
        # ca = chin angle (deg)               — pointed vs flat/square chin
        shape_profiles = {
            "Oval": {
                "lw": (1.38, 0.09, 2.5),   # Moderately elongated
                "fj": (1.10, 0.08, 1.5),   # Forehead slightly wider than jaw
                "fc": (0.87, 0.07, 1.0),
                "jc": (0.82, 0.06, 1.0),
                "ca": (118.0, 10.0, 2.0),  # Soft pointed chin
            },
            "Round": {
                "lw": (1.05, 0.07, 2.5),   # Width ≈ length
                "fj": (1.02, 0.07, 1.0),   # Forehead ≈ jaw
                "fc": (0.84, 0.07, 1.0),
                "jc": (0.83, 0.07, 1.0),
                "ca": (128.0, 9.0,  2.5),  # Rounded, soft chin
            },
            "Square": {
                "lw": (1.05, 0.07, 2.0),   # Width ≈ length (like Round)
                "fj": (1.00, 0.05, 1.0),
                "fc": (0.95, 0.05, 1.5),
                "jc": (0.95, 0.05, 2.5),   # Wide flat jaw — primary differentiator vs Round
                "ca": (138.0, 9.0,  2.5),  # Flat/angular chin
            },
            "Rectangle": {
                "lw": (1.50, 0.09, 2.5),   # Elongated like Oval
                "fj": (1.00, 0.05, 1.0),
                "fc": (0.95, 0.05, 1.5),
                "jc": (0.92, 0.05, 2.0),   # Wide jaw like Square
                "ca": (135.0, 9.0,  2.0),
            },
            "Heart": {
                "lw": (1.32, 0.09, 1.5),
                "fj": (1.28, 0.09, 2.5),   # Wide forehead, narrow jaw — primary signature
                "fc": (0.95, 0.07, 1.5),
                "jc": (0.73, 0.07, 2.0),   # Narrow jaw
                "ca": (105.0, 9.0,  2.0),  # Pointed chin
            },
            "Diamond": {
                "lw": (1.35, 0.09, 1.5),
                "fj": (1.02, 0.07, 1.0),
                "fc": (0.76, 0.06, 2.0),   # Narrow forehead relative to cheekbone
                "jc": (0.76, 0.07, 2.0),   # Narrow jaw relative to cheekbone
                "ca": (102.0, 9.0,  2.0),  # Very pointed chin
            },
        }

        scores = {}
        for shape, profile in shape_profiles.items():
            ratio_vals = {
                "lw": length_to_width_ratio,
                "fj": forehead_to_jaw_ratio,
                "fc": forehead_to_cheekbone_ratio,
                "jc": jaw_to_cheekbone_ratio,
                "ca": chin_angle,
            }
            weighted = sum(
                self._gaussian_score(ratio_vals[k], profile[k][0], profile[k][1]) * profile[k][2]
                for k in profile
            )
            total_weight = sum(profile[k][2] for k in profile)
            scores[shape] = weighted / total_weight

        sorted_shapes   = sorted(scores, key=lambda k: scores[k], reverse=True)
        primary_shape   = sorted_shapes[0]
        secondary_shape = sorted_shapes[1]
        confidence      = round(max(0.01, min(0.99, scores[primary_shape])), 2)

        measurements = {
            "face_length":           round(face_length, 2),
            "forehead_width":        round(forehead_width, 2),
            "cheekbone_width":       round(cheekbone_width, 2),
            "jaw_width":             round(jaw_width, 2),
            "face_width_ratio":      round(face_width_ratio, 4),
            "length_to_width_ratio": round(length_to_width_ratio, 4),
            "chin_angle":            round(chin_angle, 2),
            "face_width":            round(cheekbone_width, 2),
            "face_height":           round(face_length, 2),
            "secondary_shape":       secondary_shape,
            "all_scores":            {k: round(v, 4) for k, v in scores.items()},
        }

        return primary_shape, confidence, measurements

    def is_face_cropped(self, landmarks: list[FaceLandmark], image_width: int, image_height: int) -> bool:
        """Check if any key boundary landmarks are cut off at the image borders."""
        lm_dict = {l.index: l for l in landmarks}
        key_indices = [
            self.FOREHEAD_TOP, self.CHIN_BOTTOM,
            self.LEFT_FOREHEAD, self.RIGHT_FOREHEAD,
            self.LEFT_CHEEKBONE, self.RIGHT_CHEEKBONE,
            self.LEFT_JAW, self.RIGHT_JAW,
        ]
        for idx in key_indices:
            if idx not in lm_dict:
                return True
            lm = lm_dict[idx]
            if lm.x_px <= 2 or lm.x_px >= image_width - 3 or lm.y_px <= 2 or lm.y_px >= image_height - 3:
                return True
        return False

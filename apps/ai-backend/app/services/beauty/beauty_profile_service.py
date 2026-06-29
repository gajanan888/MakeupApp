from app.schemas.face import FaceLandmark
from app.schemas.face_shape import FaceMeasurements
from app.schemas.beauty_profile import BeautyProfile, BeautyFeatures


class BeautyProfileService:
    """Analyzes detailed facial structures and landmarks to build a comprehensive Beauty Profile."""

    def calculate_symmetry(
        self, landmarks: list[FaceLandmark], cheekbone_width: float
    ) -> str:
        """
        Calculates facial symmetry based on the horizontal deviation of key landmark midpoints
        relative to the vertical centerline of the face.
        """
        if not landmarks or cheekbone_width <= 0:
            return "High"

        lm_dict = {lm.index: lm for lm in landmarks}
        
        # Center points: Forehead Top (10) and Chin Bottom (152)
        if 10 not in lm_dict or 152 not in lm_dict:
            return "High"
            
        pt_top = lm_dict[10]
        pt_bot = lm_dict[152]
        
        dy = pt_bot.y_px - pt_top.y_px
        dx = pt_bot.x_px - pt_top.x_px
        
        # Key symmetric pairs:
        # Forehead hairline: 54 (L), 284 (R)
        # Eye outer corners: 33 (L), 263 (R)
        # Cheekbones: 234 (L), 454 (R)
        # Jaw corners: 58 (L), 288 (R)
        pairs = [(54, 284), (33, 263), (234, 454), (58, 288)]
        
        deviations = []
        for left_idx, right_idx in pairs:
            if left_idx not in lm_dict or right_idx not in lm_dict:
                continue
            
            p_left = lm_dict[left_idx]
            p_right = lm_dict[right_idx]
            
            # Midpoint of the pair
            mid_x = (p_left.x_px + p_right.x_px) / 2.0
            mid_y = (p_left.y_px + p_right.y_px) / 2.0
            
            # Interpolated center X at mid_y along the vertical face axis
            if dy != 0:
                t = (mid_y - pt_top.y_px) / dy
                center_x = pt_top.x_px + t * dx
            else:
                center_x = pt_top.x_px
                
            # Absolute horizontal deviation
            dev = abs(mid_x - center_x)
            # Normalize by cheekbone width
            norm_dev = dev / cheekbone_width
            deviations.append(norm_dev)
            
        if not deviations:
            return "High"
            
        avg_deviation = sum(deviations) / len(deviations)
        
        if avg_deviation < 0.025:
            return "High"
        elif avg_deviation < 0.050:
            return "Moderate"
        else:
            return "Low"

    def generate_profile(
        self,
        face_shape: str,
        skin_tone: str,
        undertone: str,
        measurements: FaceMeasurements,
        landmarks: list[FaceLandmark] | None = None,
    ) -> BeautyProfile:
        """
        Creates a beauty profile by assessing structural ratios and symmetry.
        """
        forehead_width = measurements.forehead_width
        cheekbone_width = measurements.cheekbone_width
        jaw_width = measurements.jaw_width
        face_length = measurements.face_length

        # 1. Forehead Width classification
        forehead_to_cheek_ratio = forehead_width / cheekbone_width if cheekbone_width != 0 else 1.0
        if forehead_to_cheek_ratio < 0.85:
            forehead_type = "Narrow"
        elif forehead_to_cheek_ratio > 0.95:
            forehead_type = "Wide"
        else:
            forehead_type = "Balanced"

        # 2. Cheekbones classification
        cheek_to_length_ratio = cheekbone_width / face_length if face_length != 0 else 1.0
        if face_shape.lower() == "diamond":
            cheekbones_type = "High & Defined"
        elif cheek_to_length_ratio > 0.85:
            cheekbones_type = "Prominent"
        else:
            cheekbones_type = "Defined"

        # 3. Jawline classification
        jaw_to_cheek_ratio = jaw_width / cheekbone_width if cheekbone_width != 0 else 1.0
        if jaw_to_cheek_ratio < 0.80:
            jawline_type = "Tapered"
        elif jaw_to_cheek_ratio > 0.92:
            jawline_type = "Strong & Square"
        else:
            jawline_type = "Soft & Rounded"

        # 4. Symmetry classification
        symmetry_type = "High"
        if landmarks:
            symmetry_type = self.calculate_symmetry(landmarks, cheekbone_width)

        features = BeautyFeatures(
            forehead=forehead_type,
            cheekbones=cheekbones_type,
            jawline=jawline_type,
            symmetry=symmetry_type,
        )

        return BeautyProfile(
            face_shape=face_shape,
            skin_tone=skin_tone,
            undertone=undertone,
            features=features,
        )

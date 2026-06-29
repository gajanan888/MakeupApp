import os
import math
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[3]
MPL_CACHE_DIR = BACKEND_ROOT / ".cache" / "matplotlib"
MPL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(MPL_CACHE_DIR))

import cv2
import mediapipe as mp
import numpy as np

from app.schemas.face import FaceLandmark, FaceLandmarkResponse, LandmarkRegion


REGION_INDICES: dict[str, list[int]] = {
    "jawline": [234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454],
    "left_eye": [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7],
    "right_eye": [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249],
    "left_eyebrow": [70, 63, 105, 66, 107],
    "right_eyebrow": [336, 296, 334, 293, 300],
    "outer_lips": [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95],
    "inner_lips": [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95],
    "nose": [1, 2, 98, 327, 168, 197, 5, 4],
    "left_cheek": [50, 101, 118, 117, 123, 147, 187, 205, 203, 36],
    "right_cheek": [280, 330, 347, 346, 352, 376, 411, 425, 423, 266],
    "forehead": [10, 338, 297, 332, 284, 251, 389, 356, 454, 234, 127, 162, 21, 54, 103, 67, 109],
}


class LandmarkService:
    """Extracts facial landmarks with MediaPipe Face Mesh."""

    MODEL_POINTS = np.array([
        (0.0, 0.0, 0.0),             # Nose tip
        (0.0, -330.0, -65.0),        # Chin
        (-225.0, 170.0, -135.0),     # Right eye outer corner (visual left)
        (225.0, 170.0, -135.0),      # Left eye outer corner (visual right)
        (-150.0, -150.0, -125.0),    # Right mouth corner (visual left)
        (150.0, -150.0, -125.0)      # Left mouth corner (visual right)
    ], dtype=np.float32)

    def __init__(
        self,
        static_image_mode: bool = True,
        max_num_faces: int = 3,
        refine_landmarks: bool = True,
        min_detection_confidence: float = 0.5,
    ) -> None:
        self.static_image_mode = static_image_mode
        self.max_num_faces = max_num_faces
        self.refine_landmarks = refine_landmarks
        self.min_detection_confidence = min_detection_confidence
        self._face_mesh = mp.solutions.face_mesh

    def estimate_head_pose(
        self, landmarks: list[FaceLandmark], image_width: int, image_height: int
    ) -> tuple[float, float, float, float]:
        """
        Estimates the 3D head pose (pitch, yaw, roll) using cv2.solvePnP.
        Returns pitch, yaw, roll (in radians) and camera distance scale.
        """
        lm_dict = {lm.index: lm for lm in landmarks}
        
        # Verify required key points exist
        required_indices = [1, 152, 33, 263, 61, 291]
        for idx in required_indices:
            if idx not in lm_dict:
                return 0.0, 0.0, 0.0, 1000.0
                
        # 2D points on image
        image_points = np.array([
            [lm_dict[1].x_px, lm_dict[1].y_px],      # Nose tip
            [lm_dict[152].x_px, lm_dict[152].y_px],  # Chin
            [lm_dict[33].x_px, lm_dict[33].y_px],    # Right eye outer corner (visual left)
            [lm_dict[263].x_px, lm_dict[263].y_px],  # Left eye outer corner (visual right)
            [lm_dict[61].x_px, lm_dict[61].y_px],    # Right mouth corner (visual left)
            [lm_dict[291].x_px, lm_dict[291].y_px]   # Left mouth corner (visual right)
        ], dtype=np.float32)
        
        # Camera intrinsic matrix (estimated)
        focal_length = image_width
        center = (image_width / 2.0, image_height / 2.0)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float32)
        
        dist_coeffs = np.zeros((4, 1), dtype=np.float32)
        
        success, rvec, tvec = cv2.solvePnP(
            self.MODEL_POINTS, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
        )
        
        if not success:
            return 0.0, 0.0, 0.0, 1000.0
            
        R, _ = cv2.Rodrigues(rvec)
        
        # Euler angles from rotation matrix
        sy = math.sqrt(R[0,0]*R[0,0] + R[1,0]*R[1,0])
        singular = sy < 1e-6
        if not singular:
            pitch = math.atan2(R[2,1], R[2,2])
            yaw = math.atan2(-R[2,0], sy)
            roll = math.atan2(R[1,0], R[0,0])
        else:
            pitch = math.atan2(-R[1,2], R[1,1])
            yaw = math.atan2(-R[2,0], sy)
            roll = 0.0
            
        scale = float(tvec[2])
        return pitch, yaw, roll, scale

    def normalize_landmarks(
        self, landmarks: list[FaceLandmark], image_width: int, image_height: int
    ) -> list[FaceLandmark]:
        """
        Rotates and scales landmarks to a normalized front-facing canonical view.
        Normalizes for head rotation, tilt, and camera distance.
        """
        lm_dict = {lm.index: lm for lm in landmarks}
        if 1 not in lm_dict or 234 not in lm_dict or 454 not in lm_dict:
            return landmarks
            
        # 1. Estimate head pose
        pitch, yaw, roll, scale = self.estimate_head_pose(landmarks, image_width, image_height)
        
        # 2. Build rotation matrices to invert rotation (rotation back to front-facing)
        # Roll rotation (Z-axis)
        R_z = np.array([
            [math.cos(-roll), -math.sin(-roll), 0],
            [math.sin(-roll), math.cos(-roll), 0],
            [0, 0, 1]
        ], dtype=np.float32)
        
        # Pitch rotation (X-axis)
        R_x = np.array([
            [1, 0, 0],
            [0, math.cos(-pitch), -math.sin(-pitch)],
            [0, math.sin(-pitch), math.cos(-pitch)]
        ], dtype=np.float32)
        
        # Combined rotation matrix (Pitch then Roll, yaw is corrected separately if needed, or all combined)
        # Yaw rotation (Y-axis)
        R_y = np.array([
            [math.cos(-yaw), 0, math.sin(-yaw)],
            [0, 1, 0],
            [-math.sin(-yaw), 0, math.cos(-yaw)]
        ], dtype=np.float32)
        
        R_inv = R_z @ R_x @ R_y
        
        # 3. Translate to origin (center on nose tip, index 1)
        nose = lm_dict[1]
        face_width_px = abs(lm_dict[454].x_px - lm_dict[234].x_px)
        if face_width_px == 0:
            face_width_px = 1.0
            
        rotated_list = []
        for lm in landmarks:
            z_px = lm.z * face_width_px
            
            x_trans = lm.x_px - nose.x_px
            y_trans = lm.y_px - nose.y_px
            z_trans = z_px - (nose.z * face_width_px)
            
            # Rotate
            rotated = R_inv @ np.array([x_trans, y_trans, z_trans], dtype=np.float32)
            
            rotated_list.append(
                FaceLandmark(
                    index=lm.index,
                    x=float(lm.x),
                    y=float(lm.y),
                    z=float(lm.z),
                    x_px=int(round(rotated[0])),
                    y_px=int(round(rotated[1])),
                )
            )
            
        # 4. Scale to standard face width (canonical cheekbone width = 200 pixels)
        lm_rot_dict = {lm.index: lm for lm in rotated_list}
        norm_left = lm_rot_dict[234]
        norm_right = lm_rot_dict[454]
        norm_width = abs(norm_right.x_px - norm_left.x_px)
        if norm_width == 0:
            norm_width = 1.0
            
        scale_factor = 200.0 / norm_width
        
        final_normalized = []
        for lm in rotated_list:
            final_normalized.append(
                FaceLandmark(
                    index=lm.index,
                    x=lm.x,
                    y=lm.y,
                    z=lm.z,
                    x_px=int(round(lm.x_px * scale_factor)),
                    y_px=int(round(lm.y_px * scale_factor)),
                )
            )
            
        return final_normalized

    def extract(
        self,
        image: np.ndarray,
        saved_image_path: str | None = None,
    ) -> FaceLandmarkResponse:
        image_height, image_width = image.shape[:2]
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        with self._face_mesh.FaceMesh(
            static_image_mode=self.static_image_mode,
            max_num_faces=self.max_num_faces,
            refine_landmarks=self.refine_landmarks,
            min_detection_confidence=self.min_detection_confidence,
        ) as mesh:
            results = mesh.process(rgb_image)

        all_faces = [
            self._to_landmarks(face.landmark, image_width, image_height)
            for face in results.multi_face_landmarks or []
        ]

        # Filter out faces that are partially cut off at the boundaries
        valid_faces = [
            face for face in all_faces
            if not self._is_face_cropped(face, image_width, image_height)
        ]

        pitch, yaw, roll, scale = 0.0, 0.0, 0.0, 1000.0
        normalized_faces = []
        if valid_faces:
            pitch, yaw, roll, scale = self.estimate_head_pose(valid_faces[0], image_width, image_height)
            normalized_faces = [self.normalize_landmarks(face, image_width, image_height) for face in valid_faces]

        regions = self._build_regions(valid_faces[0]) if valid_faces else []

        return FaceLandmarkResponse(
            face_detected=bool(valid_faces),
            face_count=len(valid_faces),
            image_width=image_width,
            image_height=image_height,
            landmarks=valid_faces,
            regions=regions,
            saved_image_path=saved_image_path,
            pitch=pitch,
            yaw=yaw,
            roll=roll,
            scale=scale,
            normalized_landmarks=normalized_faces if normalized_faces else None,
        )

    def _is_face_cropped(
        self,
        landmarks: list[FaceLandmark],
        image_width: int,
        image_height: int,
    ) -> bool:
        """
        Check if any key boundary landmarks are cut off at the image borders.
        """
        landmarks_dict = {lm.index: lm for lm in landmarks}
        key_indices = [10, 152, 54, 284, 234, 454, 58, 288]

        for idx in key_indices:
            if idx not in landmarks_dict:
                return True
            lm = landmarks_dict[idx]
            # Check if landmark is within 2 pixels of the image edge
            if lm.x_px <= 2 or lm.x_px >= image_width - 3 or lm.y_px <= 2 or lm.y_px >= image_height - 3:
                return True
        return False

    def _to_landmarks(
        self,
        landmarks: object,
        image_width: int,
        image_height: int,
    ) -> list[FaceLandmark]:
        points: list[FaceLandmark] = []

        for index, point in enumerate(landmarks):
            x_px = min(image_width - 1, max(0, int(point.x * image_width)))
            y_px = min(image_height - 1, max(0, int(point.y * image_height)))
            points.append(
                FaceLandmark(
                    index=index,
                    x=float(point.x),
                    y=float(point.y),
                    z=float(point.z),
                    x_px=x_px,
                    y_px=y_px,
                )
            )

        return points

    def _build_regions(self, landmarks: list[FaceLandmark]) -> list[LandmarkRegion]:
        by_index = {point.index: point for point in landmarks}

        return [
            LandmarkRegion(
                name=name,
                indices=indices,
                points=[by_index[index] for index in indices if index in by_index],
            )
            for name, indices in REGION_INDICES.items()
        ]

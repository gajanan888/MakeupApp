import cv2
import mediapipe as mp
import numpy as np

class FacePresenceDetector:
    """Detects if a face is present in a numpy image using MediaPipe."""
    
    def __init__(self, min_detection_confidence: float = 0.5):
        self.mp_face_detection = mp.solutions.face_detection
        self.min_confidence = min_detection_confidence

    def has_face(self, image: np.ndarray) -> bool:
        """
        Returns True if a face is detected in the input BGR image, False otherwise.
        """
        if image is None or image.size == 0:
            return False
            
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        with self.mp_face_detection.FaceDetection(
            min_detection_confidence=self.min_confidence,
            model_selection=1 # 1 is best for full-range/distant selfies, 0 is short range
        ) as face_detection:
            results = face_detection.process(rgb_image)
            return bool(results.detections)

    def detect_and_crop_face(self, image: np.ndarray) -> tuple[np.ndarray, dict | None]:
        """
        Detects a face. If found, crops the facial region with a padding margin and returns it.
        If not found, returns the original image.
        """
        if image is None or image.size == 0:
            return image, None
            
        h, w, _ = image.shape
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        with self.mp_face_detection.FaceDetection(
            min_detection_confidence=self.min_confidence,
            model_selection=1
        ) as face_detection:
            results = face_detection.process(rgb_image)
            if results.detections:
                # Use the first/most prominent face detection
                detection = results.detections[0]
                bbox = detection.location_data.relative_bounding_box
                
                # Convert normalized relative coordinates to absolute pixels
                xmin = int(bbox.xmin * w)
                ymin = int(bbox.ymin * h)
                box_w = int(bbox.width * w)
                box_h = int(bbox.height * h)
                
                # Add 10% margin padding to ensure makeup contours are included
                pad_x = int(box_w * 0.1)
                pad_y = int(box_h * 0.1)
                
                x1 = max(0, xmin - pad_x)
                y1 = max(0, ymin - pad_y)
                x2 = min(w, xmin + box_w + pad_x)
                y2 = min(h, ymin + box_h + pad_y)
                
                cropped_image = image[y1:y2, x1:x2]
                bbox_info = {
                    "xmin": float(x1),
                    "ymin": float(y1),
                    "width": float(x2 - x1),
                    "height": float(y2 - y1)
                }
                return cropped_image, bbox_info
                
        return image, None

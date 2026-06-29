import cv2

from app.services.vision.face_detection_service import FaceDetectionService


def detect_face(image_path):
    image = cv2.imread(image_path)
    if image is None:
        return {
            "faceDetected": False,
            "faceCount": 0,
        }

    result = FaceDetectionService().detect(image=image, saved_image_path=image_path)
    return {
        "faceDetected": result.face_detected,
        "faceCount": result.face_count,
        "detections": [item.model_dump() for item in result.detections],
    }

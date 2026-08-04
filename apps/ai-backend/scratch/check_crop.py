import cv2
from app.vision.face_detector import FacePresenceDetector

def check():
    detector = FacePresenceDetector()
    img = cv2.imread("test_face_warm.png")
    if img is None:
        print("Image test_face_warm.png not found!")
        return
    h, w, _ = img.shape
    print(f"Original image shape: {img.shape}")
    cropped, bbox = detector.detect_and_crop_face(img)
    print(f"Face BBox relative/absolute: {bbox}")
    print(f"Cropped shape: {cropped.shape}")

if __name__ == "__main__":
    check()

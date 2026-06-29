import sys
import os
import cv2
from app.services.vision.landmark_service import LandmarkService
from app.services.beauty.face_shape_service import FaceShapeService
from app.services.beauty.skin_tone_service import SkinToneService

def main():
    if len(sys.argv) < 2:
        print("Usage: python test_single_image.py <path_to_image_file>")
        sys.exit(1)
        
    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(f"Error: File '{image_path}' does not exist.")
        sys.exit(1)
        
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Could not read image '{image_path}' using OpenCV.")
        sys.exit(1)
        
    print(f"Analyzing image: {image_path}")
    landmark_service = LandmarkService()
    face_shape_service = FaceShapeService()
    skin_tone_service = SkinToneService()
    
    landmark_result = landmark_service.extract(image)
    if not landmark_result.face_detected or not landmark_result.landmarks:
        print("Result: No face detected in the image.")
        return
        
    first_face = landmark_result.landmarks[0]
    
    # Face shape analysis
    if face_shape_service.is_face_cropped(first_face, landmark_result.image_width, landmark_result.image_height):
        print("\n--- FACE SHAPE ---")
        print("Result: Face is cropped/cut off at borders (unable to accurately classify face shape).")
    else:
        face_shape, face_shape_conf, measurements = face_shape_service.classify(first_face)
        print("\n--- FACE SHAPE ---")
        print(f"Predicted Face Shape: {face_shape} (Confidence: {face_shape_conf:.2f})")
        print("Measurements:")
        for k, v in measurements.items():
            print(f"  {k}: {v}")
            
    # Skin tone analysis
    try:
        skin_result = skin_tone_service.analyze(image, first_face)
        print("\n--- SKIN TONE & UNDERTONE ---")
        print(f"Skin Tone: {skin_result['skin_tone']} (Confidence: {skin_result['skin_tone_confidence']:.2f})")
        print(f"Undertone: {skin_result['undertone']} (Confidence: {skin_result['undertone_confidence']:.2f})")
        print(f"Average RGB: {skin_result['average_rgb']}")
        print(f"Average LAB: {skin_result['average_lab']}")
    except ValueError as e:
        print(f"\nSkin Tone Analysis Error: {str(e)}")

if __name__ == "__main__":
    main()

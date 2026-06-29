import sys
import os
import cv2
from app.services.vision.landmark_service import LandmarkService
from app.services.beauty.face_shape_service import FaceShapeService
from app.services.beauty.skin_tone_service import SkinToneService
from app.services.beauty.makeup_recommendation_service import MakeupRecommendationService
from app.services.beauty.makeup_simulation_service import MakeupSimulationService

def main():
    if len(sys.argv) < 3:
        print("Usage: python test_single_simulation.py <path_to_image_file> <look_id> [step: 1, 2, 3]")
        print("Example: python test_single_simulation.py test_dataset/oval/img_no_201.jpg natural_glow 3")
        sys.exit(1)
        
    image_path = sys.argv[1]
    look_id = sys.argv[2]
    step = int(sys.argv[3]) if len(sys.argv) > 3 else 3
    
    if not os.path.exists(image_path):
        print(f"Error: File '{image_path}' does not exist.")
        sys.exit(1)
        
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Could not read image '{image_path}'.")
        sys.exit(1)
        
    print("Loading services...")
    landmark_service = LandmarkService()
    face_shape_service = FaceShapeService()
    skin_tone_service = SkinToneService()
    recommendation_service = MakeupRecommendationService()
    simulation_service = MakeupSimulationService()
    
    print("Extracting face landmarks...")
    landmark_result = landmark_service.extract(image)
    if not landmark_result.face_detected or not landmark_result.landmarks:
        print("Error: No face detected in the image.")
        sys.exit(1)
        
    first_face = landmark_result.landmarks[0]
    
    print("Analyzing face shape and skin tone...")
    face_shape, _, _ = face_shape_service.classify(first_face)
    try:
        skin_result = skin_tone_service.analyze(image, first_face)
    except ValueError as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
        
    print(f"Detected Profile: Face Shape = {face_shape}, Skin Tone = {skin_result['skin_tone']}, Undertone = {skin_result['undertone']}")
    
    looks = recommendation_service.get_recommendations(
        face_shape=face_shape,
        skin_tone=skin_result["skin_tone"],
        undertone=skin_result["undertone"]
    )
    
    look = next((l for l in looks if l.id == look_id), None)
    if not look:
        print(f"Error: Look '{look_id}' is not suitable or not found for this profile.")
        sys.exit(1)
        
    print(f"Simulating look '{look_id}' (Step {step}/3)...")
    simulated_image = simulation_service.simulate(image, first_face, look, step)
    
    output_path = "simulated_output.jpg"
    cv2.imwrite(output_path, simulated_image)
    print(f"\nSuccess! Simulated image saved to: {os.path.abspath(output_path)}")

if __name__ == "__main__":
    main()

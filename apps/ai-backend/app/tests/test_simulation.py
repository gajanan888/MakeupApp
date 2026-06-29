import os
from unittest.mock import MagicMock, patch

import cv2
import numpy as np
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import get_db
from app.schemas.face import FaceLandmark
from app.services.beauty.makeup_simulation_service import MakeupSimulationService
from app.services.beauty.makeup_recommendation_service import MakeupRecommendationService
from app.tests.test_face_shape import create_mock_landmarks

# Override database dependency in FastAPI tests
app.dependency_overrides[get_db] = lambda: None

client = TestClient(app)


def test_makeup_simulation_logic():
    """Verify that the simulation service runs successfully without errors on mock inputs."""
    service = MakeupSimulationService()
    
    # Create mock 500x500 base BGR image
    image = np.zeros((500, 500, 3), dtype=np.uint8)
    image[:, :] = [180, 200, 240]  # Soft background skin color
    
    landmarks = create_mock_landmarks()
    
    # Get a recommended look structure to pass into simulation
    rec_service = MakeupRecommendationService()
    looks = rec_service.get_recommendations(
        face_shape="Oval",
        skin_tone="Medium",
        undertone="Warm"
    )
    assert len(looks) > 0
    natural_glow_look = looks[0]
    
    # Simulate final complete look (Step 3)
    result = service.simulate(image, landmarks, natural_glow_look, step=3)
    
    # Should maintain image dimensions
    assert result.shape == (500, 500, 3)
    # Check that pixels are modified (drawing occurred)
    assert not np.array_equal(result, image)

    # Simulate final look with custom lash style and intensity
    result_lash = service.simulate(image, landmarks, natural_glow_look, step=3, lash_intensity=0.9, lash_style="Cat-Eye")
    assert result_lash.shape == (500, 500, 3)
    assert not np.array_equal(result_lash, image)
    
    # Simulate base only (Step 1)
    result_base = service.simulate(image, landmarks, natural_glow_look, step=1)
    assert result_base.shape == (500, 500, 3)
    assert not np.array_equal(result_base, image)


@patch("app.api.v1.endpoints.simulation.read_upload_as_image")
@patch("app.api.v1.endpoints.simulation.LandmarkService")
@patch("app.api.v1.endpoints.simulation.SkinToneService")
def test_simulation_endpoint(mock_skin_tone_class, mock_landmark_class, mock_read_image):
    """Test POST /api/v1/simulation/makeup endpoint renders overlays and returns generated file URL."""
    # Set up mock image loader returning 500x500 canvas
    mock_read_image.return_value = (np.zeros((500, 500, 3), dtype=np.uint8), b"")

    # Set up mock landmark service output
    mock_landmark_inst = MagicMock()
    mock_landmark_class.return_value = mock_landmark_inst
    mock_landmarks = create_mock_landmarks()
    
    # Add missing blush and eyebrow indices to mock landmarks list
    for idx in [117, 346, 50, 101, 118, 123, 147, 187, 205, 203, 36, 280, 330, 347, 352, 376, 411, 425, 423, 266, 338, 297, 332, 251, 389, 356, 127, 162, 21, 103, 67, 109, 30, 29, 27, 28, 56, 190, 243, 112, 26, 22, 23, 24, 110, 157, 158, 159, 160, 161, 246, 466, 388, 387, 386, 385, 384, 398, 362, 463, 341, 256, 252, 253, 254, 339, 251, 389, 173, 133, 70, 63, 105, 66, 107, 55, 300, 293, 334, 296, 336, 285]:
        if not any(lm.index == idx for lm in mock_landmarks):
            mock_landmarks.append(FaceLandmark(index=idx, x=0.5, y=0.5, z=0.0, x_px=250, y_px=250))

    mock_landmark_inst.extract.return_value = MagicMock(
        face_detected=True,
        image_width=500,
        image_height=500,
        landmarks=[mock_landmarks]
    )
    
    # Set up mock skin tone service output
    mock_skin_tone_inst = MagicMock()
    mock_skin_tone_class.return_value = mock_skin_tone_inst
    mock_skin_tone_inst.analyze.return_value = {
        "skin_tone": "Medium",
        "skin_tone_confidence": 0.99,
        "undertone": "Warm",
        "undertone_confidence": 0.99,
        "average_rgb": [120, 100, 80],
        "average_lab": [60, 10, 12]
    }
    
    # Call simulate endpoint
    files = {"file": ("test.jpg", b"fake-image-bytes", "image/jpeg")}
    response = client.post("/api/v1/simulation/makeup?look_id=natural_glow&step=3", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert "simulated_image_url" in data
    assert data["simulated_image_url"].startswith("/generated/")
    
    # Verify the generated file was actually written to disk
    filename = data["simulated_image_url"].split("/generated/")[1]
    assert os.path.exists(os.path.join("generated", filename))
    
    # Cleanup generated file
    try:
        os.remove(os.path.join("generated", filename))
    except OSError:
        pass

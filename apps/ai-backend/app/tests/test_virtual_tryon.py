import base64
from unittest.mock import patch
import cv2
import numpy as np
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def get_test_image_base64() -> str:
    """Helper to generate a base64 encoded string of a solid white 100x100 BGR image."""
    img = np.ones((100, 100, 3), dtype=np.uint8) * 255
    _, buffer = cv2.imencode(".jpg", img)
    return base64.b64encode(buffer).decode("utf-8")


@patch("app.api.v1.endpoints.tryon.face_presence_detector.has_face")
@patch("app.api.v1.endpoints.tryon.landmarks_processor.get_landmarks")
def test_virtual_tryon_all_makeup_layers(mock_get_landmarks, mock_has_face):
    """
    Integration test verifying that the POST /api/v1/virtual-tryon endpoint executes
    cleanly with all makeup layers enabled.
    """
    # 1. Mock face detection & landmarks
    mock_has_face.return_value = True
    
    # Return 500 mock landmark coordinate pairs
    mock_landmarks = []
    for i in range(500):
        # Set simple coordinates based on landmark indices to avoid empty or overlapping shapes
        mock_landmarks.append((100 + (i % 20) * 10, 100 + (i // 20) * 10))
    mock_get_landmarks.return_value = mock_landmarks

    # 2. Prepare payload
    test_base64 = get_test_image_base64()
    payload = {
        "image": test_base64,
        "foundation": True,
        "foundationShade": "Warm Beige",
        "lipstick": True,
        "lipstickColor": "Red",
        "lipstickStyle": "Matte",
        "blush": True,
        "blushColor": "Pink",
        "blushStyle": "Medium",
        "eyeshadow": True,
        "eyeshadowColor": "Pink",
        "eyeshadowStyle": "Matte",
        "eyeliner": True,
        "eyelinerColor": "Black",
        "eyelinerStyle": "Medium",
        "contour": True,
        "contourIntensity": 60,
        "highlighter": True,
        "eyebrow": True,
        "eyebrowColor": "Brown",
        "eyelashes": True,
        "eyelashesStyle": "Natural",
        "intensity": 80
    }

    # 3. Call endpoint
    response = client.post("/api/v1/virtual-tryon", json=payload)
    
    # 4. Verify output
    assert response.status_code == 200, f"Request failed: {response.text}"
    data = response.json()
    assert data["success"] is True
    assert "processedImage" in data
    assert data["processedImage"] is not None
    
    # Verify we can decode the returned base64 string
    decoded_bytes = base64.b64decode(data["processedImage"])
    nparr = np.frombuffer(decoded_bytes, np.uint8)
    decoded_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    assert decoded_img is not None
    assert decoded_img.shape[0] > 0
    assert decoded_img.shape[1] > 0


@patch("app.api.v1.endpoints.tryon.face_presence_detector.has_face")
def test_virtual_tryon_no_face_detected(mock_has_face):
    """
    Verifies that the /api/v1/virtual-tryon endpoint returns success=False
    and the correct message when no face is found in the photo.
    """
    mock_has_face.return_value = False
    
    test_base64 = get_test_image_base64()
    payload = {
        "image": test_base64,
        "lipstick": True,
        "intensity": 50
    }
    
    response = client.post("/api/v1/virtual-tryon", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "No face detected" in data["message"]
    assert data["processedImage"] is None

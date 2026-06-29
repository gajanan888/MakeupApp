import io
import cv2
import numpy as np
from fastapi.testclient import TestClient
from app.main import app


def test_skin_tone_no_face() -> None:
    """Test that uploading an image with no face returns face_detected=False and a clear message."""
    client = TestClient(app)

    # Create a blank black image (no face landmarks)
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    _, img_encoded = cv2.imencode(".jpg", img)
    img_bytes = img_encoded.tobytes()

    response = client.post(
        "/vision/skin-tone",
        files={"file": ("test.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["face_detected"] is False
    assert data["message"] == "No face detected"
    assert data["skin_tone"] is None
    assert data["undertone"] is None


def test_skin_tone_missing_file() -> None:
    """Test that a request missing the file parameter returns 422 Unprocessable Entity."""
    client = TestClient(app)
    response = client.post("/vision/skin-tone")
    assert response.status_code == 422


if __name__ == "__main__":
    print("Running skin tone API integration tests...")
    test_skin_tone_no_face()
    test_skin_tone_missing_file()
    print("All skin tone API integration tests passed successfully!")

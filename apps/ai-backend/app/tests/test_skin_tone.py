import cv2
import numpy as np
from app.schemas.face import FaceLandmark
from app.services.beauty.skin_tone_service import SkinToneService


def create_dummy_landmarks() -> list[FaceLandmark]:
    """
    Creates a list of mock FaceLandmark coordinates defining polygons
    large enough to exceed the 100-pixel threshold in masking.
    """
    landmarks = []

    # Left cheek: map to polygon vertices to span at least 100 pixels
    left_coords = [
        (20, 40), (30, 40), (40, 40), (40, 50),
        (40, 60), (30, 60), (20, 60), (20, 50),
        (22, 45), (38, 55)
    ]
    for i, idx in enumerate(SkinToneService.LEFT_CHEEK_INDICES):
        x_px, y_px = left_coords[i % len(left_coords)]
        landmarks.append(
            FaceLandmark(index=idx, x=x_px / 100.0, y=y_px / 100.0, z=0.0, x_px=x_px, y_px=y_px)
        )

    # Right cheek: map to (60, 40) - (80, 60)
    right_coords = [
        (60, 40), (70, 40), (80, 40), (80, 50),
        (80, 60), (70, 60), (60, 60), (60, 50),
        (62, 45), (78, 55)
    ]
    for i, idx in enumerate(SkinToneService.RIGHT_CHEEK_INDICES):
        x_px, y_px = right_coords[i % len(right_coords)]
        landmarks.append(
            FaceLandmark(index=idx, x=x_px / 100.0, y=y_px / 100.0, z=0.0, x_px=x_px, y_px=y_px)
        )

    # Forehead: map to (30, 10) - (70, 30)
    forehead_coords = [
        (30, 10), (40, 10), (50, 10), (60, 10), (70, 10),
        (70, 20), (70, 30), (60, 30), (50, 30), (40, 30),
        (30, 30), (30, 20), (35, 15), (45, 15), (55, 15),
        (65, 15), (50, 25)
    ]
    for i, idx in enumerate(SkinToneService.FOREHEAD_INDICES):
        x_px, y_px = forehead_coords[i % len(forehead_coords)]
        landmarks.append(
            FaceLandmark(index=idx, x=x_px / 100.0, y=y_px / 100.0, z=0.0, x_px=x_px, y_px=y_px)
        )

    return landmarks


def test_remove_outliers() -> None:
    """Test that outlier pixel values are correctly removed using IQR on L channel."""
    service = SkinToneService()
    lab = np.array(
        [
            [50, 10, 10],
            [51, 10, 10],
            [52, 10, 10],
            [95, 10, 10],  # Outlier (very light)
            [5, 10, 10],   # Outlier (very dark)
        ],
        dtype=np.float32,
    )
    rgb = np.zeros((5, 3), dtype=np.uint8)
    hsv = np.zeros((5, 3), dtype=np.float32)

    lab_f, rgb_f, hsv_f = service.remove_outliers(lab, rgb, hsv)
    assert len(lab_f) == 3
    L_values = lab_f[:, 0]
    assert 95 not in L_values
    assert 5 not in L_values


def test_skin_tone_classification() -> None:
    """Test classification matching adjusted boundaries of skin tones."""
    service = SkinToneService()

    # Fair (target ~ 80, >= 78)
    tone, conf = service.classify_skin_tone(np.array([80.0, 10.0, 10.0]))
    assert tone == "Fair"
    assert conf > 0.5

    # Light (target ~ 72, >= 68)
    tone, conf = service.classify_skin_tone(np.array([72.0, 10.0, 10.0]))
    assert tone == "Light"
    assert conf > 0.8

    # Medium (target ~ 63, >= 59)
    tone, conf = service.classify_skin_tone(np.array([63.0, 10.0, 10.0]))
    assert tone == "Medium"
    assert conf > 0.8

    # Tan (target ~ 54, >= 50)
    tone, conf = service.classify_skin_tone(np.array([54.0, 10.0, 10.0]))
    assert tone == "Tan"
    assert conf > 0.8

    # Deep (target ~ 40, < 50)
    tone, conf = service.classify_skin_tone(np.array([40.0, 10.0, 10.0]))
    assert tone == "Deep"
    assert conf > 0.5



def test_undertone_classification() -> None:
    """Test Gaussian classification of undertones based on ratio and hue."""
    service = SkinToneService()

    # Warm (high b/a ratio, high hue angle)
    # L=60, a=15, b=22 -> ratio ~ 1.46, hue = 32.0 degrees
    tone, conf = service.classify_undertone(
        mean_lab=np.array([60.0, 15.0, 22.0]),
        mean_hsv=np.array([32.0, 100.0, 100.0])
    )
    assert tone == "Warm"
    assert conf > 0.8

    # Cool (low b/a ratio, low hue angle)
    # L=60, a=20, b=16 -> ratio ~ 0.80, hue = 15.0 degrees
    tone, conf = service.classify_undertone(
        mean_lab=np.array([60.0, 20.0, 16.0]),
        mean_hsv=np.array([15.0, 100.0, 100.0])
    )
    assert tone == "Cool"
    assert conf > 0.8

    # Neutral (b* in neutral zone 7-14, intermediate ratio and hue)
    # L=60, a=14, b=10 -> ratio ~ 0.71, hue = 19.0 degrees
    tone, conf = service.classify_undertone(
        mean_lab=np.array([60.0, 14.0, 10.0]),
        mean_hsv=np.array([19.0, 100.0, 100.0])
    )
    assert tone == "Neutral"
    assert conf > 0.5


def test_pipeline_analysis() -> None:
    """Test the full analysis pipeline using mock landmarks and a uniform image."""
    service = SkinToneService()
    landmarks = create_dummy_landmarks()

    # Create dummy 100x100 BGR image
    # Color: B=150, G=170, R=220 (Light skin color)
    image = np.zeros((100, 100, 3), dtype=np.uint8)
    image[:, :] = [150, 170, 220]

    result = service.analyze(image, landmarks)

    assert "skin_tone" in result
    assert "undertone" in result
    assert "skin_tone_confidence" in result
    assert "undertone_confidence" in result
    assert "average_rgb" in result
    assert "average_lab" in result

    assert isinstance(result["average_rgb"], list)
    assert isinstance(result["average_lab"], list)
    assert len(result["average_rgb"]) == 3
    assert len(result["average_lab"]) == 3


def test_insufficient_pixels() -> None:
    """Test that ValueErrors are raised when pixel count is insufficient."""
    service = SkinToneService()
    # Mocking coordinates with empty lists or empty landmarks
    landmarks = []
    image = np.zeros((100, 100, 3), dtype=np.uint8)

    try:
        service.analyze(image, landmarks)
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "insufficient skin pixels" in str(e).lower()


if __name__ == "__main__":
    print("Running skin tone tests...")
    test_remove_outliers()
    test_skin_tone_classification()
    test_undertone_classification()
    test_pipeline_analysis()
    test_insufficient_pixels()
    print("All skin tone tests passed successfully!")

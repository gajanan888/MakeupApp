from app.schemas.face import FaceLandmark
from app.services.beauty.face_shape_service import FaceShapeService


def create_mock_landmarks(
    forehead_top: tuple[int, int] = (100, 100),
    chin_bottom: tuple[int, int] = (100, 420),  # face length = 320
    left_forehead: tuple[int, int] = (50, 150),
    right_forehead: tuple[int, int] = (230, 150),  # forehead width = 180
    left_cheekbone: tuple[int, int] = (35, 220),
    right_cheekbone: tuple[int, int] = (245, 220),  # cheekbone width = 210
    left_jaw: tuple[int, int] = (52, 330),
    right_jaw: tuple[int, int] = (228, 330),  # jaw width = 176
    chin_angle: float = 120.0,
) -> list[FaceLandmark]:
    """Helper to create a list of FaceLandmark objects from pixel coordinates."""
    import math
    half_angle_rad = math.radians(chin_angle / 2.0)
    dy = 20.0
    dx = dy * math.tan(half_angle_rad)
    
    left_chin = (int(round(chin_bottom[0] - dx)), int(round(chin_bottom[1] - dy)))
    right_chin = (int(round(chin_bottom[0] + dx)), int(round(chin_bottom[1] - dy)))

    mapping = {
        10:  forehead_top,
        152: chin_bottom,
        21:  left_forehead,   # LEFT_FOREHEAD (was 54)
        251: right_forehead,  # RIGHT_FOREHEAD (was 284)
        123: left_cheekbone,  # LEFT_CHEEKBONE (was 234)
        352: right_cheekbone, # RIGHT_CHEEKBONE (was 454)
        172: left_jaw,        # LEFT_JAW (was 58)
        397: right_jaw,       # RIGHT_JAW (was 288)
        175: left_chin,
        396: right_chin,
    }

    landmarks = []
    for idx, (x_px, y_px) in mapping.items():
        landmarks.append(
            FaceLandmark(
                index=idx,
                x=x_px / 500.0,
                y=y_px / 500.0,
                z=0.0,
                x_px=x_px,
                y_px=y_px,
            )
        )
    return landmarks


def test_oval_face() -> None:
    service = FaceShapeService()
    # Mocking coordinates for an Oval shape
    # length/width = 320 / 210 = 1.52 (ideal oval = 1.28)
    # forehead/jaw = 180 / 176 = 1.02 (ideal oval = 1.05)
    # jaw/cheekbone = 176 / 210 = 0.84 (ideal oval = 0.84)
    # forehead/cheekbone = 180 / 210 = 0.86 (ideal oval = 0.88)
    landmarks = create_mock_landmarks(chin_angle=120.0)
    shape, confidence, measurements = service.classify(landmarks)
    assert shape == "Oval"
    assert confidence > 0.5
    assert measurements["face_length"] == 320
    assert measurements["forehead_width"] == 180
    assert measurements["cheekbone_width"] == 210
    assert measurements["jaw_width"] == 176


def test_round_face() -> None:
    service = FaceShapeService()
    # Mocking coordinates for a Round shape
    # length/width = 200 / 200 = 1.0 (ideal round = 1.02)
    # forehead/jaw = 160 / 170 = 0.94 (ideal round = 1.0)
    # jaw/cheekbone = 170 / 200 = 0.85 (ideal round = 0.85)
    # forehead/cheekbone = 160 / 200 = 0.80 (ideal round = 0.85)
    landmarks = create_mock_landmarks(
        forehead_top=(100, 100),
        chin_bottom=(100, 300),
        left_forehead=(50, 130),
        right_forehead=(210, 130),
        left_cheekbone=(30, 200),
        right_cheekbone=(230, 200),
        left_jaw=(45, 260),
        right_jaw=(215, 260),
        chin_angle=125.0,
    )
    shape, confidence, measurements = service.classify(landmarks)
    assert shape == "Round"
    assert confidence > 0.5


def test_square_face() -> None:
    service = FaceShapeService()
    # Mocking coordinates for a Square shape
    # length/width = 200 / 200 = 1.0 (ideal square = 1.02)
    # forehead/jaw = 190 / 180 = 1.05 (ideal square = 1.0)
    # jaw/cheekbone = 180 / 200 = 0.90 (ideal square = 0.90)
    # forehead/cheekbone = 190 / 200 = 0.95 (ideal square = 0.92)
    landmarks = create_mock_landmarks(
        forehead_top=(100, 100),
        chin_bottom=(100, 300),
        left_forehead=(35, 130),
        right_forehead=(225, 130),
        left_cheekbone=(30, 200),
        right_cheekbone=(230, 200),
        left_jaw=(40, 270),
        right_jaw=(220, 270),
        chin_angle=138.0,
    )
    shape, confidence, measurements = service.classify(landmarks)
    assert shape == "Square"
    assert confidence > 0.5


def test_rectangle_face() -> None:
    service = FaceShapeService()
    # Mocking coordinates for a Rectangle shape
    # length/width = 300 / 200 = 1.5 (ideal rect = 1.30)
    # forehead/jaw = 190 / 180 = 1.05 (ideal rect = 1.0)
    # jaw/cheekbone = 180 / 200 = 0.90 (ideal rect = 0.90)
    # forehead/cheekbone = 190 / 200 = 0.95 (ideal rect = 0.92)
    landmarks = create_mock_landmarks(
        forehead_top=(100, 100),
        chin_bottom=(100, 400),
        left_forehead=(35, 130),
        right_forehead=(225, 130),
        left_cheekbone=(30, 220),
        right_cheekbone=(230, 220),
        left_jaw=(40, 340),
        right_jaw=(220, 340),
        chin_angle=135.0,
    )
    shape, confidence, measurements = service.classify(landmarks)
    assert shape == "Rectangle"
    assert confidence > 0.5


def test_heart_face() -> None:
    service = FaceShapeService()
    # Mocking coordinates for a Heart shape
    # forehead/jaw = 200 / 150 = 1.33 (ideal heart = 1.20)
    # jaw/cheekbone = 150 / 200 = 0.75 (ideal heart = 0.76)
    # forehead/cheekbone = 200 / 200 = 1.0 (ideal heart = 0.92)
    landmarks = create_mock_landmarks(
        forehead_top=(100, 100),
        chin_bottom=(100, 350),
        left_forehead=(30, 130),
        right_forehead=(230, 130),
        left_cheekbone=(30, 200),
        right_cheekbone=(230, 200),
        left_jaw=(55, 290),
        right_jaw=(205, 290),
        chin_angle=108.0,
    )
    shape, confidence, measurements = service.classify(landmarks)
    assert shape == "Heart"
    assert confidence > 0.5


def test_diamond_face() -> None:
    service = FaceShapeService()
    # Mocking coordinates for a Diamond shape
    # forehead/cheekbone = 160 / 220 = 0.73 (ideal diamond = 0.78)
    # jaw/cheekbone = 176 / 220 = 0.80 (ideal diamond = 0.80)
    # length/width = 250 / 220 = 1.136 (ideal diamond = 1.20)
    landmarks = create_mock_landmarks(
        forehead_top=(110, 100),
        chin_bottom=(110, 350),
        left_forehead=(60, 130),
        right_forehead=(220, 130),
        left_cheekbone=(30, 200),
        right_cheekbone=(250, 200),
        left_jaw=(52, 290),
        right_jaw=(228, 290),
        chin_angle=104.0,
    )
    shape, confidence, measurements = service.classify(landmarks)
    assert shape == "Diamond"
    assert confidence > 0.5


if __name__ == "__main__":
    print("Running tests...")
    test_oval_face()
    test_round_face()
    test_square_face()
    test_rectangle_face()
    test_heart_face()
    test_diamond_face()
    print("All tests passed successfully!")

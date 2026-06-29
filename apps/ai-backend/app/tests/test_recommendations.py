import numpy as np
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.db.session import get_db
from app.schemas.face import FaceLandmark
from app.schemas.face_shape import FaceMeasurements
from app.schemas.beauty_profile import BeautyProfileRequest, BeautyProfile
from app.services.beauty.beauty_profile_service import BeautyProfileService
from app.services.beauty.makeup_recommendation_service import MakeupRecommendationService
from app.services.beauty.artist_recommendation_service import ArtistRecommendationService
from app.tests.test_face_shape import create_mock_landmarks

# Override database dependency in FastAPI to avoid PostgreSQL connection hangs during unit testing
app.dependency_overrides[get_db] = lambda: None

client = TestClient(app)


def test_beauty_profile_generation():
    """Verify facial feature structure classification rules in BeautyProfileService."""
    service = BeautyProfileService()
    
    measurements = FaceMeasurements(
        face_length=300.0,
        forehead_width=180.0,      # ratio 180/200 = 0.90 -> Balanced
        cheekbone_width=200.0,
        jaw_width=170.0,           # ratio 170/200 = 0.85 -> Soft & Rounded
        face_width_ratio=0.66,
        length_to_width_ratio=1.5
    )
    
    landmarks = create_mock_landmarks()
    
    profile = service.generate_profile(
        face_shape="Oval",
        skin_tone="Medium",
        undertone="Warm",
        measurements=measurements,
        landmarks=landmarks
    )
    
    assert profile.face_shape == "Oval"
    assert profile.skin_tone == "Medium"
    assert profile.undertone == "Warm"
    assert profile.features.forehead == "Balanced"
    assert profile.features.cheekbones == "Defined"
    assert profile.features.jawline == "Soft & Rounded"
    assert profile.features.symmetry in ["High", "Moderate", "Low"]


def test_makeup_recommendations():
    """Verify that appropriate looks are matched and dynamic shades are personalized."""
    service = MakeupRecommendationService()
    
    looks = service.get_recommendations(
        face_shape="Oval",
        skin_tone="Medium",
        undertone="Warm"
    )
    
    assert len(looks) > 0
    
    natural_glow_look = next((l for l in looks if l.id == "natural_glow"), None)
    assert natural_glow_look is not None
    assert natural_glow_look.personalized_recommendations.foundation_shade == "Golden Beige / Honey"
    assert natural_glow_look.personalized_recommendations.lipstick_color == "Warm Caramel Nude"
    assert natural_glow_look.personalized_recommendations.blush_color == "Deep Peach"
    assert natural_glow_look.personalized_recommendations.eyebrow_shape == "Softly curved arch with natural thickness (balanced arch correction)"
    
    # Assert Simulation UI features are present
    assert natural_glow_look.personalized_recommendations.seasonal_profile == "Autumn (Warm & Rich)"
    assert "chekbones" in natural_glow_look.personalized_recommendations.contour_style or "cheekbone" in natural_glow_look.personalized_recommendations.contour_style
    assert natural_glow_look.time_estimate == "15-20 min"
    assert natural_glow_look.coverage == "Light Coverage"
    assert natural_glow_look.category == "Natural"
    assert natural_glow_look.steps is not None
    assert len(natural_glow_look.steps) == 3
    assert natural_glow_look.steps[0].title == "Hydrating Base"


def test_artist_recommendations():
    """Verify makeup artists are scored and ranked correctly based on skin tone and styling matching."""
    service = ArtistRecommendationService()
    
    profile = BeautyProfile(
        face_shape="Oval",
        skin_tone="Medium",
        undertone="Warm",
        features={
            "forehead": "Balanced",
            "cheekbones": "Defined",
            "jawline": "Soft & Rounded",
            "symmetry": "High"
        }
    )
    
    recommendations = service.get_recommendations(profile)
    assert len(recommendations) > 0
    
    # Check that UI fields are correctly populated
    assert recommendations[0].price > 0
    assert recommendations[0].reviews_count > 0
    assert recommendations[0].avatar_url is not None
    
    # Check sorting order: highest score first
    for i in range(len(recommendations) - 1):
        assert recommendations[i].match_score >= recommendations[i + 1].match_score


def test_beauty_profile_endpoint():
    """Test POST /api/v1/beauty/profile endpoint."""
    payload = {
        "face_shape": "Oval",
        "skin_tone": "Medium",
        "undertone": "Warm",
        "measurements": {
            "face_length": 300.0,
            "forehead_width": 180.0,
            "cheekbone_width": 200.0,
            "jaw_width": 170.0,
            "face_width_ratio": 0.66,
            "length_to_width_ratio": 1.5
        }
    }
    
    response = client.post("/api/v1/beauty/profile", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["face_shape"] == "Oval"
    assert data["features"]["forehead"] == "Balanced"


def test_recommend_artists_endpoint():
    """Test POST /api/v1/recommend/artists endpoint."""
    payload = {
        "face_shape": "Oval",
        "skin_tone": "Medium",
        "undertone": "Warm",
        "features": {
            "forehead": "Balanced",
            "cheekbones": "Defined",
            "jawline": "Soft",
            "symmetry": "High"
        }
    }
    
    response = client.post("/api/v1/recommend/artists", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "artist_id" in data[0]
    assert "match_score" in data[0]
    assert "price" in data[0]
    assert "reviews_count" in data[0]


@patch("app.api.v1.endpoints.recommend.read_upload_as_image")
@patch("app.api.v1.endpoints.recommend.LandmarkService")
@patch("app.api.v1.endpoints.recommend.SkinToneService")
def test_recommend_look_endpoint(mock_skin_tone_class, mock_landmark_class, mock_read_image):
    """Test POST /api/v1/recommend/look pipeline with mocked image analysis."""
    # Set up mock image loader
    mock_read_image.return_value = (np.zeros((100, 100, 3), dtype=np.uint8), b"")

    # Set up mock landmark service output
    mock_landmark_inst = MagicMock()
    mock_landmark_class.return_value = mock_landmark_inst
    
    mock_landmarks = create_mock_landmarks()
    
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
    
    # Prepare mock file
    files = {"file": ("test.jpg", b"fake-image-bytes", "image/jpeg")}
    
    response = client.post("/api/v1/recommend/look", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["face_detected"] is True
    assert data["beauty_profile"] is not None
    assert data["beauty_profile"]["face_shape"] == "Oval"
    assert data["beauty_profile"]["skin_tone"] == "Medium"
    assert len(data["recommended_looks"]) > 0

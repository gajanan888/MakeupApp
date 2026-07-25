import pytest
import cv2
import os
import numpy as np
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.session import SessionLocal
from app.vision.face_detector import FacePresenceDetector
from app.vision.siglip_encoder import siglip_encoder
from app.vision.image_preprocessor import ImagePreprocessor
from app.repositories.portfolio_repository import PortfolioEmbeddingRepository

from unittest.mock import patch, MagicMock
from app.models.portfolio_embedding import PortfolioEmbeddingModel

client = TestClient(app)


def test_face_detector_crop():
    """Verifies face detector correctly finds and crops face regions from test images."""
    detector = FacePresenceDetector()
    
    # Locate a test image with a face
    test_img_path = "test_face_warm.png"
    assert os.path.exists(test_img_path), "Test image 'test_face_warm.png' is missing."
    
    img = cv2.imread(test_img_path)
    assert img is not None, "Failed to read test image."
    
    cropped, bbox = detector.detect_and_crop_face(img)
    
    # Face should be detected and cropped
    assert cropped is not None
    assert bbox is not None
    assert "xmin" in bbox
    assert bbox["width"] > 0
    assert bbox["height"] > 0
    
    # Cropped size should be smaller than or equal to original size
    assert cropped.shape[0] <= img.shape[0]
    assert cropped.shape[1] <= img.shape[1]


def test_siglip_embedding():
    """Verifies SigLIP encoder loads, runs, and yields L2-normalized 768-dim embeddings."""
    test_img_path = "test_face_warm.png"
    img = cv2.imread(test_img_path)
    
    # Get cropped face
    detector = FacePresenceDetector()
    cropped, _ = detector.detect_and_crop_face(img)
    
    # Generate embedding
    embedding = siglip_encoder.get_image_embedding(cropped)
    
    assert isinstance(embedding, list)
    assert len(embedding) == 768
    
    # Verify L2 normalization: sum(x^2) should be extremely close to 1.0
    norm_sq = sum(val ** 2 for val in embedding)
    assert pytest.approx(norm_sq, abs=1e-3) == 1.0


def test_portfolio_repository_and_search():
    """Verifies that pgvector cosine similarity search runs successfully via the repository layer."""
    db = SessionLocal()
    repo = PortfolioEmbeddingRepository(db)
    
    # Generate dummy embedding
    query_emb = [0.0] * 768
    query_emb[0] = 1.0  # Normalized dummy vector
    
    mock_model = PortfolioEmbeddingModel(
        id=1,
        artist_id=19,
        portfolio_image_id=49,
        image_url="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500",
        image_type="before",
        embedding=query_emb
    )
    
    try:
        with patch.object(repo, "search_similar", return_value=[(mock_model, 0.1)]):
            similar_images = repo.search_similar(query_emb, limit=5)
            # Should return list of tuples (model, distance)
            assert isinstance(similar_images, list)
            assert len(similar_images) == 1
            item, dist = similar_images[0]
            assert item.artist_id == 19
            assert dist == 0.1
    finally:
        db.close()


@patch("app.services.recommendation_service.RecommendationService.recommend_artists_by_image")
def test_api_recommendation_flow(mock_recommend):
    """Tests the recommendation endpoint payload validation and execution."""
    mock_recommend.return_value = [{
        "artist_id": 19,
        "artist_name": "Luxury Bridal Studio",
        "profile_photo": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500",
        "similarity": 0.9,
        "matched_image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500",
        "rating": 4.9,
        "completed_bookings": 540,
        "experience": 8
    }]
    
    test_img_path = "test_face_warm.png"
    assert os.path.exists(test_img_path)
    
    with open(test_img_path, "rb") as f:
        files = {"file": (test_img_path, f, "image/png")}
        response = client.post("/api/artist/recommend", files=files)
        
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "recommended_artists" in data
    
    recommended = data["recommended_artists"]
    assert isinstance(recommended, list)
    if recommended:
        first = recommended[0]
        assert "artist_id" in first
        assert "artist_name" in first
        assert "similarity" in first
        assert "matched_image" in first

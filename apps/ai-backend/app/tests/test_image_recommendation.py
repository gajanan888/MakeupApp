import unittest
from unittest.mock import MagicMock, patch
import numpy as np
from pydantic import BaseModel

from app.models.beauty import ArtistModel, ArtistProfileModel, ArtistServiceModel
from app.models.portfolio_embedding import PortfolioEmbeddingModel
from app.services.vision.embedding_service import EmbeddingService
from app.services.recommendation.image_recommendation_service import (
    times_overlap,
    is_artist_available,
    ImageRecommendationService
)


class MockBBox(BaseModel):
    x: int
    y: int
    width: int
    height: int


class TestImageRecommendation(unittest.TestCase):
    """Unit tests for the AI-powered artist recommendation service."""

    def test_time_overlaps(self):
        """Test the robust time overlap calculation helper."""
        # Exact match
        self.assertTrue(times_overlap("10:00 AM", "10:00 AM"))
        # Overlapping ranges
        self.assertTrue(times_overlap("10:00 AM - 12:00 PM", "11:00 AM"))
        self.assertTrue(times_overlap("10:00 AM - 12:00 PM", "09:00 AM - 11:00 AM"))
        self.assertTrue(times_overlap("10:00 AM", "10:30 AM"))  # Single times default to 1 hour
        
        # Non-overlapping ranges
        self.assertFalse(times_overlap("10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM"))
        self.assertFalse(times_overlap("10:00 AM - 11:00 AM", "12:00 PM - 01:00 PM"))
        self.assertFalse(times_overlap("10:00 AM", "12:00 PM"))

    def test_face_cropping(self):
        """Test that face cropping adds the correct margin."""
        service = EmbeddingService(model_name="google/siglip-base-patch16-224")
        
        # Create a blank 100x100 BGR image
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        bbox = MockBBox(x=20, y=20, width=40, height=40)
        
        cropped = service.crop_face(img, bbox)
        
        # BBox is 40x40. 5% margin is 2 pixels on each side.
        # Cropped should be from x1=18 to x2=62, y1=18 to y2=62.
        # Height = 62 - 18 = 44, Width = 62 - 18 = 44.
        self.assertEqual(cropped.shape[0], 44)
        self.assertEqual(cropped.shape[1], 44)

    @patch("app.services.vision.embedding_service.EmbeddingService._load_model")
    def test_embedding_generation_mocked(self, mock_load):
        """Test embedding generation with a mocked model."""
        service = EmbeddingService(model_name="google/siglip-base-patch16-224")
        
        # Mock the processor and model
        mock_processor = MagicMock()
        mock_model = MagicMock()
        
        # Mock the tensor output
        mock_tensor = MagicMock()
        mock_norm = MagicMock()
        mock_tensor.norm.return_value = mock_norm
        
        mock_normalized = MagicMock()
        mock_tensor.__truediv__.return_value = mock_normalized
        
        # Mock features[0] (__getitem__) to return a mock tensor that returns our list
        mock_item = MagicMock()
        mock_normalized.__getitem__.return_value = mock_item
        mock_item.cpu.return_value.numpy.return_value.tolist.return_value = [0.1] * 768
        
        service._processor = mock_processor
        service._model = mock_model
        service._device = "cpu"
        
        # Mock the get_image_features method
        mock_model.get_image_features.return_value = mock_tensor
        
        # Run embedding
        img = np.zeros((50, 50, 3), dtype=np.uint8)
        embedding = service.get_embedding(img)
        
        self.assertEqual(len(embedding), 768)
        self.assertEqual(embedding[0], 0.1)

    @patch("app.services.recommendation.image_recommendation_service.FaceDetectionService")
    @patch("app.services.recommendation.image_recommendation_service.EmbeddingService")
    def test_recommendation_ranking_math(self, mock_embedding_class, mock_detection_class):
        """Test the hybrid ranking calculation and sorting."""
        # Setup mocks
        mock_detector = MagicMock()
        mock_detection_class.return_value = mock_detector
        mock_detector.detect.return_value = MagicMock(face_detected=False)
        
        mock_emb_service = MagicMock()
        mock_embedding_class.return_value = mock_emb_service
        mock_emb_service.get_embedding.return_value = [0.1] * 768
        
        service = ImageRecommendationService()
        
        # Mock database session
        db = MagicMock()
        
        # Mock portfolio match query results
        mock_embedding_1 = MagicMock(artist_id=1, portfolio_image_id=101, image_url="url1", image_type="before")
        mock_embedding_2 = MagicMock(artist_id=1, portfolio_image_id=102, image_url="url2", image_type="after")
        mock_embedding_3 = MagicMock(artist_id=2, portfolio_image_id=103, image_url="url3", image_type="after")
        
        # Mock Artist queries
        mock_artist_1 = MagicMock(id=1)
        mock_artist_1.name = "Artist One"
        mock_artist_2 = MagicMock(id=2)
        mock_artist_2.name = "Artist Two"

        # Define side effects for artist queries
        def db_query_filter_first(*args):
            model_class = args[0]
            mock_query = MagicMock()
            if model_class == PortfolioEmbeddingModel:
                mock_query.order_by.return_value.limit.return_value.all.return_value = [
                    (mock_embedding_1, 0.90),
                    (mock_embedding_2, 0.80),
                    (mock_embedding_3, 0.85),
                ]
            elif model_class == ArtistModel:
                def filter_artist(expr):
                    try:
                        val = expr.right.value
                    except Exception:
                        val = 1
                    return MagicMock(first=lambda: mock_artist_1 if val == 1 else mock_artist_2)
                mock_query.filter.side_effect = filter_artist
            elif model_class == ArtistProfileModel:
                def filter_profile(expr):
                    try:
                        val = expr.right.value
                    except Exception:
                        val = 1
                    profile1 = MagicMock(rating=5.0, reviewCount=10, location="Mumbai", profileImage="avatar1", bio="Bio1")
                    profile2 = MagicMock(rating=4.0, reviewCount=5, location="Delhi", profileImage="avatar2", bio="Bio2")
                    return MagicMock(first=lambda: profile1 if val == 1 else profile2)
                mock_query.filter.side_effect = filter_profile
            elif model_class == ArtistServiceModel:
                def filter_service(expr):
                    try:
                        val = expr.right.value
                    except Exception:
                        val = 1
                    service1 = MagicMock(specialization="Bridal", priceRange="3000")
                    service2 = MagicMock(specialization="Glam", priceRange="2000")
                    return MagicMock(all=lambda: [service1] if val == 1 else [service2])
                mock_query.filter.side_effect = filter_service
            return mock_query
            
        db.query.side_effect = db_query_filter_first
        
        # Run recommendations
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        recs = service.get_recommendations(db, img, ranking_strategy="max")
        
        # Verification:
        # Artist 1:
        # - Visual similarity (max) = 90.0%
        # - Rating = 5.0 -> Rating score = 100.0%
        # - Availability = 100.0%
        # - Match score = 0.7 * 90 + 0.2 * 100 + 0.1 * 100 = 63.0 + 20.0 + 10.0 = 93.0
        #
        # Artist 2:
        # - Visual similarity = 85.0%
        # - Rating = 4.0 -> Rating score = 80.0%
        # - Availability = 100.0%
        # - Match score = 0.7 * 85 + 0.2 * 80 + 0.1 * 100 = 59.5 + 16.0 + 10.0 = 85.5
        
        self.assertEqual(len(recs), 2)
        self.assertEqual(recs[0]["name"], "Artist One")
        self.assertEqual(recs[0]["match_score"], 93.0)
        self.assertEqual(recs[1]["name"], "Artist Two")
        self.assertEqual(recs[1]["match_score"], 85.5)


if __name__ == "__main__":
    unittest.main()

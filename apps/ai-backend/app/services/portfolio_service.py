import os
import uuid
import logging
from sqlalchemy.orm import Session
from fastapi import UploadFile
from app.repositories.portfolio_repository import PortfolioEmbeddingRepository
from app.services.vision.face_detection_service import FaceDetectionService
from app.services.vision.embedding_service import EmbeddingService
from app.services.vision.look_analyzer_service import LookAnalyzerService
from app.services.vision.feature_extractor_service import FeatureExtractorService
from app.vision.image_preprocessor import ImagePreprocessor
from app.storage.service import StorageService

logger = logging.getLogger(__name__)


class PortfolioService:
    """
    Handles uploads of artist portfolio images:
    validates file, detects face, analyzes complete look (Gemini), extracts facial feature colors (OpenCV),
    generates SigLIP embedding, and saves everything to PostgreSQL database.
    """
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = PortfolioEmbeddingRepository(db)
        self.face_detector = FaceDetectionService()
        self.embedding_service = EmbeddingService()
        self.look_analyzer = LookAnalyzerService()
        self.feature_extractor = FeatureExtractorService()
        self.storage = StorageService()

    async def upload_and_process_portfolio(
        self,
        artist_id: int,
        portfolio_image_id: int,
        image_type: str,
        file: UploadFile,
        file_bytes: bytes
    ):
        # 1. Prevent duplicate insertions
        existing = self.repo.get_by_portfolio_image_id(portfolio_image_id)
        if existing:
            return existing

        # 2. Preprocess file bytes into clean BGR image
        image_np = ImagePreprocessor.preprocess_upload(file, file_bytes)

        # 3. Detect and crop face (standard bounding box)
        face_response = self.face_detector.detect(image_np)
        face_img = image_np
        face_bbox = None
        
        if face_response.face_detected and face_response.detections:
            detection = face_response.detections[0]
            face_bbox = [
                detection.bounding_box.x,
                detection.bounding_box.y,
                detection.bounding_box.width,
                detection.bounding_box.height
            ]
            # No longer cropping face_img; we use the full image for aesthetic similarity

        # 4. Generate normalized SigLIP embedding
        embedding = self.embedding_service.get_embedding(image_np)

        # 5. Extract Complete Look Characteristics (multimodal Gemini)
        logger.info(f"Analyzing complete look occasion/style for artist {artist_id}...")
        look_data = await self.look_analyzer.analyze_image(image_np)

        # 6. Extract OpenCV cosmetic features (lip, skin tone, face shape)
        logger.info(f"Extracting OpenCV face details for artist {artist_id}...")
        features = self.feature_extractor.extract_features(image_np)

        # 7. Upload image file to storage
        ext = os.path.splitext(file.filename or "")[1] or ".jpg"
        unique_filename = f"portfolio_{artist_id}_{portfolio_image_id}_{uuid.uuid4().hex}{ext}"
        _, image_url = await self.storage.save_upload(file_bytes, unique_filename)

        # 8. Save fully-profiled record in DB
        return self.repo.create(
            artist_id=artist_id,
            portfolio_image_id=portfolio_image_id,
            image_url=image_url,
            image_type=image_type,
            embedding=embedding,
            face_bbox=face_bbox,
            occasion=look_data.get("occasion"),
            makeup_style=look_data.get("makeup_style"),
            hairstyle=look_data.get("hairstyle"),
            outfit=look_data.get("outfit"),
            jewelry=look_data.get("jewelry"),
            skin_tone=features.get("skin_tone"),
            undertone=features.get("undertone"),
            face_shape=features.get("face_shape"),
            feature_vector=features
        )

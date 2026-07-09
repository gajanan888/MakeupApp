import os
import sys
import logging
import httpx
import cv2
import numpy as np
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add app directory to path so we can import modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.config import get_settings
from app.models.beauty import Base, ArtistPortfolioModel
from app.models.portfolio_embedding import PortfolioEmbeddingModel
from app.services.vision.face_detection_service import FaceDetectionService
from app.services.vision.embedding_service import EmbeddingService

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def main():
    settings = get_settings()
    logger.info("Starting portfolio embeddings synchronization...")
    
    # 1. Initialize database connection
    engine = create_engine(settings.database_url)
    
    # 2. Enable pgvector extension and create tables
    with engine.begin() as conn:
        logger.info("Enabling pgvector extension if not exists...")
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        
    logger.info("Creating database tables if not exist...")
    Base.metadata.create_all(bind=engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # 3. Initialize AI services
        face_detector = FaceDetectionService()
        embedding_service = EmbeddingService()
        
        # 4. Query all portfolio images
        portfolio_items = db.query(ArtistPortfolioModel).all()
        logger.info(f"Found {len(portfolio_items)} portfolio items in database.")
        
        # Gather all tasks to process
        tasks = []
        for item in portfolio_items:
            if item.beforeImageUrl:
                tasks.append({
                    "artist_id": item.artistId,
                    "portfolio_image_id": item.id,
                    "image_url": item.beforeImageUrl,
                    "image_type": "before"
                })
            if item.afterImageUrl:
                tasks.append({
                    "artist_id": item.artistId,
                    "portfolio_image_id": item.id,
                    "image_url": item.afterImageUrl,
                    "image_type": "after"
                })
                
        logger.info(f"Total of {len(tasks)} images to process.")
        
        processed_count = 0
        skipped_count = 0
        failed_count = 0
        
        for i, task in enumerate(tasks):
            image_url = task["image_url"]
            artist_id = task["artist_id"]
            portfolio_image_id = task["portfolio_image_id"]
            image_type = task["image_type"]
            
            # Check if embedding already exists
            existing = db.query(PortfolioEmbeddingModel).filter(
                PortfolioEmbeddingModel.image_url == image_url
            ).first()
            
            if existing:
                # Make sure database references are up to date
                existing.artist_id = artist_id
                existing.portfolio_image_id = portfolio_image_id
                existing.image_type = image_type
                skipped_count += 1
                continue
                
            logger.info(f"[{i+1}/{len(tasks)}] Processing {image_type} image for artist {artist_id}...")
            
            # Download image
            try:
                with httpx.Client() as client:
                    response = client.get(image_url, timeout=15.0)
                    if response.status_code != 200:
                        logger.error(f"Failed to download image from {image_url}: HTTP {response.status_code}")
                        failed_count += 1
                        continue
                    arr = np.frombuffer(response.content, np.uint8)
                    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                    if img is None:
                        logger.error(f"Failed to decode image bytes from {image_url}")
                        failed_count += 1
                        continue
            except Exception as e:
                logger.error(f"Error downloading image {image_url}: {str(e)}")
                failed_count += 1
                continue
                
            # Run Face Detection and crop
            try:
                face_response = face_detector.detect(img)
                face_img = img
                face_bbox = None
                
                if face_response.face_detected and face_response.detections:
                    detection = face_response.detections[0]
                    face_bbox = [
                        detection.bounding_box.x,
                        detection.bounding_box.y,
                        detection.bounding_box.width,
                        detection.bounding_box.height
                    ]
                    face_img = embedding_service.crop_face(img, detection.bounding_box)
                else:
                    logger.warning(f"No face detected in {image_url}. Using full image.")
                    
                # Generate embedding
                embedding_vector = embedding_service.get_embedding(face_img)
                
                # Save to database
                new_embedding = PortfolioEmbeddingModel(
                    artist_id=artist_id,
                    portfolio_image_id=portfolio_image_id,
                    image_url=image_url,
                    image_type=image_type,
                    embedding=embedding_vector,
                    face_bbox=face_bbox
                )
                db.add(new_embedding)
                db.commit()
                
                processed_count += 1
            except Exception as e:
                db.rollback()
                logger.error(f"Error processing embedding for {image_url}: {str(e)}")
                failed_count += 1
                continue
                
        db.commit()
        logger.info(f"Sync complete. Processed: {processed_count}, Skipped (already existed): {skipped_count}, Failed: {failed_count}")
        
    finally:
        db.close()


if __name__ == "__main__":
    main()

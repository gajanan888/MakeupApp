import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import asyncio
import cv2
import numpy as np
import httpx
from sqlalchemy import text
from app.database.session import SessionLocal
from app.models.beauty import ArtistPortfolioModel
from app.repositories.portfolio_repository import PortfolioEmbeddingRepository
from app.services.vision.face_detection_service import FaceDetectionService
from app.services.vision.embedding_service import EmbeddingService
from app.services.vision.feature_extractor_service import FeatureExtractorService

def map_tag_to_look(tag: str) -> dict:
    """
    Parses original portfolio tags to assign occasion and style attributes.
    """
    tag_lower = (tag or "").lower()
    
    if "bridal" in tag_lower:
        return {
            "occasion": "Bridal",
            "makeup_style": ["Bridal", "Full Glam", "Traditional"],
            "outfit": "Lehenga",
            "jewelry": ["Bridal Jewelry", "Necklace", "Maang Tikka", "Nath"],
            "hairstyle": "Traditional Bridal Bun"
        }
    elif "reception" in tag_lower or "sangeet" in tag_lower or "shimmer" in tag_lower:
        return {
            "occasion": "Reception",
            "makeup_style": ["Soft Glam", "Glossy", "Modern"],
            "outfit": "Saree",
            "jewelry": ["Necklace", "Jhumka"],
            "hairstyle": "Bun"
        }
    elif "cocktail" in tag_lower or "glow" in tag_lower:
        return {
            "occasion": "Cocktail",
            "makeup_style": ["Full Glam", "Glossy"],
            "outfit": "Saree",
            "jewelry": ["Necklace"],
            "hairstyle": "Open Hair"
        }
    elif "airbrush" in tag_lower or "soft" in tag_lower:
        return {
            "occasion": "Party",
            "makeup_style": ["Soft Glam", "Matte"],
            "outfit": "Gown",
            "jewelry": [],
            "hairstyle": "Open Hair"
        }
    else:
        return {
            "occasion": "Natural",
            "makeup_style": ["Natural", "Matte"],
            "outfit": "Casual",
            "jewelry": [],
            "hairstyle": "Open Hair"
        }

async def rebuild_complete_look():
    db = SessionLocal()
    repo = PortfolioEmbeddingRepository(db)
    
    # 1. Truncate table
    try:
        print("Truncating existing artist_portfolio_embeddings...")
        db.execute(text("TRUNCATE TABLE artist_portfolio_embeddings RESTART IDENTITY;"))
        db.commit()
    except Exception as e:
        print("Truncate failed:", e)
        db.rollback()
        db.close()
        return

    # 2. Initialize services
    face_detector = FaceDetectionService()
    embedding_service = EmbeddingService()
    feature_extractor = FeatureExtractorService()

    # 3. Query all portfolio records to build the full dataset
    portfolios = db.query(ArtistPortfolioModel).all()
    print(f"Found {len(portfolios)} portfolio records to process.")

    tasks = []
    for item in portfolios:
        tag_look = map_tag_to_look(item.tag)
        
        # Parse beforeImageUrl / afterImageUrl
        if item.beforeImageUrl:
            tasks.append({
                "artist_id": item.artistId,
                "portfolio_image_id": item.id,
                "image_url": item.beforeImageUrl,
                "image_type": "before",
                "look_info": tag_look
            })
        if item.afterImageUrl:
            tasks.append({
                "artist_id": item.artistId,
                "portfolio_image_id": item.id,
                "image_url": item.afterImageUrl,
                "image_type": "after",
                "look_info": tag_look
            })
            
        # Parse images JSON list
        if item.images and isinstance(item.images, list):
            for idx, img_obj in enumerate(item.images):
                img_url = img_obj.get("url")
                if img_url:
                    tasks.append({
                        "artist_id": item.artistId,
                        "portfolio_image_id": item.id,
                        "image_url": img_url,
                        "image_type": f"portfolio_{idx}",
                        "look_info": tag_look
                    })

    print(f"Total of {len(tasks)} portfolio images compiled. Starting extraction loop...")

    success_count = 0
    for idx, task in enumerate(tasks):
        url = task["image_url"]
        artist_id = task["artist_id"]
        img_id = task["portfolio_image_id"]
        img_type = task["image_type"]
        look_data = task["look_info"]

        # Skip empty URLs
        if not url or url.lower() == "none" or url == "":
            continue

        print(f"\n[{idx+1}/{len(tasks)}] Processing: {url}")

        try:
            # Download image bytes
            async with httpx.AsyncClient() as client:
                res = await client.get(url, timeout=15.0)
            if res.status_code != 200:
                print(f"Failed to download image. Status: {res.status_code}")
                continue
                
            arr = np.frombuffer(res.content, np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is None:
                print("Failed to decode image.")
                continue

            # Run Face detection & crop
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

            # Generate SigLIP
            embedding = embedding_service.get_embedding(img)
            
            # Extract OpenCV features
            features = feature_extractor.extract_features(img)

            # Save to PostgreSQL
            repo.create(
                artist_id=artist_id,
                portfolio_image_id=img_id,
                image_url=url,
                image_type=img_type,
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
            print(f"Indexed successfully: TagOccasion={look_data.get('occasion')} | Outfit={look_data.get('outfit')}")
            success_count += 1

        except Exception as e:
            print(f"Failed to process task: {e}")
            db.rollback()

    print(f"\nProcessing complete! Successfully indexed {success_count} looks in PostgreSQL.")
    db.close()

if __name__ == "__main__":
    asyncio.run(rebuild_complete_look())

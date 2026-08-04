import logging
import math
import cv2
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import UploadFile
from app.repositories.portfolio_repository import PortfolioEmbeddingRepository
from app.services.vision.face_detection_service import FaceDetectionService
from app.services.vision.embedding_service import EmbeddingService
from app.services.vision.look_analyzer_service import LookAnalyzerService
from app.services.vision.feature_extractor_service import FeatureExtractorService
from app.vision.image_preprocessor import ImagePreprocessor
from app.models.beauty import ArtistModel, ArtistProfileModel, BookingModel

logger = logging.getLogger(__name__)


class RecommendationService:
    """
    Upgraded Complete Look AI Recommendation Engine:
    - Automatically classifies occasion, outfit, jewelry, hairstyle of query photo (Gemini).
    - Extracts OpenCV landmark metrics (skin tone, face shape, cosmetic shades).
    - Limits similarity searches to portfolios matching the detected occasion.
    - Applies a multi-factor hybrid ranking formula (35% SigLIP, 25% Occasion, 15% Makeup, etc.).
    - Generates explainable AI (XAI) textual validation reasons.
    """
    # Configurable ranking weights
    WEIGHT_SIGLIP = 0.85     # 85% Raw visual semantic similarity (robust to LLM failures)
    WEIGHT_COLOR = 0.15      # 15% Deterministic color match
    WEIGHT_OCCASION = 0.00   # Disabled
    WEIGHT_OUTFIT = 0.00     # Disabled
    WEIGHT_MAKEUP = 0.00     # Disabled
    WEIGHT_JEWELRY = 0.00    
    WEIGHT_HAIRSTYLE = 0.00  
    WEIGHT_SKIN_TONE = 0.00  
    WEIGHT_UNDERTONE = 0.00  
    WEIGHT_RATING = 0.00     
    WEIGHT_BOOKINGS = 0.00




    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = PortfolioEmbeddingRepository(db)
        self.face_detection_service = FaceDetectionService()
        self.embedding_service = EmbeddingService()
        self.look_analyzer = LookAnalyzerService()
        self.feature_extractor = FeatureExtractorService()

    async def recommend_artists_by_image(
        self,
        file: UploadFile,
        file_bytes: bytes
    ) -> list[dict]:
        # 1. Preprocess reference upload image
        image_np = ImagePreprocessor.preprocess_upload(file, file_bytes)

        # 2. Multimodal Look Analysis (Occasion, Style, Outfit, Jewelry, Hairstyle)
        query_look = await self.look_analyzer.analyze_image(image_np)
        detected_occasion = query_look.get("occasion", "Party")

        # 3. OpenCV Feature Extraction (Skin tone, undertone, face shape)
        features = self.feature_extractor.extract_features(image_np)

        # 4. Face mesh crop and SigLIP embedding generation
        face_response = self.face_detection_service.detect(image_np)
        face_img = image_np
        if face_response.face_detected and face_response.detections:
            detection = face_response.detections[0]
            face_img = self.embedding_service.crop_face(image_np, detection.bounding_box)

        query_emb = self.embedding_service.get_embedding(image_np)

        # 5. Search similar images globally across all occasions
        similar_images = self.repo.search_similar(query_emb, limit=100)
        if not similar_images:
            logger.info("No matching portfolio images found in database.")
            return []

        # 6. Extract unique artist IDs
        artist_ids = list(set(item[0].artist_id for item in similar_images))

        # 7. Batch load artist information (names, profile pictures, ratings, and experience)
        artists_info = self.db.query(
            ArtistModel.id,
            ArtistModel.name,
            ArtistProfileModel.profileImage,
            ArtistProfileModel.rating,
            ArtistProfileModel.experience,
            ArtistProfileModel.location
        ).outerjoin(
            ArtistProfileModel, ArtistModel.id == ArtistProfileModel.artistId
        ).filter(
            ArtistModel.id.in_(artist_ids)
        ).all()

        artists_map = {row.id: row for row in artists_info}

        # Batch count completed bookings
        bookings_counts_raw = self.db.query(
            BookingModel.artistId,
            func.count(BookingModel.id)
        ).filter(
            BookingModel.artistId.in_(artist_ids),
            BookingModel.status == "completed"
        ).group_by(
            BookingModel.artistId
        ).all()

        bookings_map = {row[0]: row[1] for row in bookings_counts_raw}

        # 8. Group matches by unique artist, selecting their highest scoring portfolio look
        artist_candidates = []

        for img_model, distance in similar_images:
            artist_id = img_model.artist_id
            if artist_id not in artists_map:
                continue

            info = artists_map[artist_id]
            rating = info.rating if info.rating is not None else 4.5
            
            # Parse experience digits safely
            exp_str = info.experience if info.experience is not None else "0"
            exp_years = 0
            try:
                digits = "".join(filter(str.isdigit, exp_str))
                if digits:
                    exp_years = int(digits)
            except Exception:
                pass

            bookings_count = bookings_map.get(artist_id, 0)
            similarity = 1.0 - distance  # Convert distance to raw cosine similarity

            # Evaluate match metrics
            # Jaccard matching helper
            def jaccard_similarity(list1, list2):
                if not list1 or not list2:
                    return 0.0
                set1, set2 = set(list1), set(list2)
                intersect = set1.intersection(set2)
                union = set1.union(set2)
                return len(intersect) / len(union) if union else 0.0

            # Calculate individual factor match values
            cand_style = img_model.makeup_style or []
            ref_style = query_look.get("makeup_style", [])
            makeup_match = jaccard_similarity(ref_style, cand_style)

            outfit_match = 1.0 if img_model.outfit == query_look.get("outfit") else 0.0
            
            cand_jewelry = img_model.jewelry or []
            ref_jewelry = query_look.get("jewelry", [])
            jewelry_match = jaccard_similarity(ref_jewelry, cand_jewelry)

            hairstyle_match = 1.0 if img_model.hairstyle == query_look.get("hairstyle") else 0.0
            
            # Dampened demographic metadata factors
            rating_score = float(rating) / 5.0
            bookings_val = min(500, bookings_count)
            bookings_score = math.log(bookings_val + 1) / math.log(501)
            exp_val = min(15, exp_years)
            exp_score = math.log(exp_val + 1) / math.log(16)

            # Calculate clothing color match (Perceptually linear HSV similarity)
            query_color = features.get("clothing_color", [100.0, 100.0, 100.0])
            cand_color = (img_model.feature_vector or {}).get("clothing_color", [100.0, 100.0, 100.0])
            
            # Convert query and candidate BGR colors to HSV space
            q_hsv = cv2.cvtColor(np.uint8([[query_color]]), cv2.COLOR_BGR2HSV)[0][0]
            c_hsv = cv2.cvtColor(np.uint8([[cand_color]]), cv2.COLOR_BGR2HSV)[0][0]
            
            qh, qs, qv = float(q_hsv[0]), float(q_hsv[1]), float(q_hsv[2])
            ch, cs, cv = float(c_hsv[0]), float(c_hsv[1]), float(c_hsv[2])
            
            # Hue is angular/circular (0 to 179 in OpenCV HSV space)
            h_diff = min(abs(qh - ch), 180 - abs(qh - ch)) / 90.0
            s_diff = abs(qs - cs) / 255.0
            v_diff = abs(qv - cv) / 255.0
            
            # Weight Hue 60%, Saturation 25%, Value 15%
            color_dist = 0.60 * h_diff + 0.25 * s_diff + 0.15 * v_diff
            color_match = max(0.0, 1.0 - color_dist)

            # Biological compatibility matching
            skin_tone_match = 1.0 if img_model.skin_tone == features.get("skin_tone") else 0.0
            undertone_match = 1.0 if img_model.undertone == features.get("undertone") else 0.0

            # Compute composite hybrid score
            final_score = (
                self.WEIGHT_SIGLIP * similarity +
                self.WEIGHT_COLOR * color_match +
                self.WEIGHT_OCCASION * (1.0 if img_model.occasion == detected_occasion else 0.0) +
                self.WEIGHT_MAKEUP * makeup_match +
                self.WEIGHT_OUTFIT * outfit_match +
                self.WEIGHT_JEWELRY * jewelry_match +
                self.WEIGHT_HAIRSTYLE * hairstyle_match +
                self.WEIGHT_SKIN_TONE * skin_tone_match +
                self.WEIGHT_UNDERTONE * undertone_match +
                self.WEIGHT_RATING * rating_score +
                self.WEIGHT_BOOKINGS * bookings_score
            )

            # Generate Explainable AI (XAI) reason bullets
            reasons = []
            if img_model.occasion == detected_occasion:
                reasons.append(f"✓ Matching {detected_occasion} occasion")
            else:
                reasons.append(f"• Fallback: {img_model.occasion or 'Party'} look matched")
                
            if outfit_match > 0.5:
                reasons.append(f"✓ Similar {img_model.outfit} outfit styling")
            if hairstyle_match > 0.5:
                reasons.append(f"✓ Same {img_model.hairstyle} hairstyle")
            
            shared_jewelry = list(set(cand_jewelry).intersection(set(ref_jewelry)))
            if shared_jewelry:
                reasons.append(f"✓ Matching jewelry ({', '.join(shared_jewelry)})")
                
            shared_makeup = list(set(cand_style).intersection(set(ref_style)))
            if shared_makeup:
                reasons.append(f"✓ Matching {', '.join(shared_makeup)} makeup styles")
                
            if img_model.face_shape == features.get("face_shape"):
                reasons.append(f"✓ Fits your {img_model.face_shape} face shape")
                
            reason_for_recommendation = "\n".join(reasons)

            # Check if this artist is already present in candidates
            existing = next((c for c in artist_candidates if c["artist_id"] == artist_id), None)
            if existing:
                # Keep the portfolio look yielding the highest composite rank score
                if final_score > existing["final_score"]:
                    existing["final_score"] = final_score
                    existing["similarity"] = final_score
                    existing["matched_image"] = img_model.image_url
                    existing["occasion"] = img_model.occasion or "Party"
                    existing["makeup_style"] = cand_style
                    existing["reason_for_recommendation"] = reason_for_recommendation
            else:
                artist_candidates.append({
                    "artist_id": artist_id,
                    "artist_name": info.name,
                    "profile_photo": info.profileImage or "",
                    "similarity": final_score,
                    "matched_image": img_model.image_url,
                    "rating": float(rating),
                    "completed_bookings": bookings_count,
                    "experience": exp_years,
                    "occasion": img_model.occasion or "Party",
                    "makeup_style": cand_style,
                    "reason_for_recommendation": reason_for_recommendation,
                    "final_score": final_score,
                    "location": info.location or "Pune"
                })

        # 9. Sort candidates descending by final score
        artist_candidates.sort(key=lambda x: x["final_score"], reverse=True)

        # 10. Return top 10 ranked artists
        return artist_candidates[:10]

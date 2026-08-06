import logging
from datetime import datetime
import numpy as np
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.beauty import ArtistModel, ArtistProfileModel, ArtistServiceModel, ArtistBlockModel, BookingModel
from app.models.portfolio_embedding import PortfolioEmbeddingModel
from app.services.vision.face_detection_service import FaceDetectionService
from app.services.vision.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


def parse_time_to_minutes(t_part: str) -> int:
    t_part = t_part.strip().upper()
    is_pm = "PM" in t_part
    is_am = "AM" in t_part
    cleaned = t_part.replace("AM", "").replace("PM", "").strip()
    try:
        if ":" in cleaned:
            h, m = map(int, cleaned.split(":"))
        else:
            h = int(cleaned)
            m = 0
        if is_pm and h < 12:
            h += 12
        elif is_am and h == 12:
            h = 0
        return h * 60 + m
    except Exception:
        return 0


def times_overlap(time1: str, time2: str) -> bool:
    """Checks if two time slots overlap. Handles '10:00 AM - 12:00 PM' or '10:00 AM' formats."""
    def parse_range(t_str: str):
        t_str = t_str.strip().upper()
        if "-" in t_str:
            parts = t_str.split("-")
            start = parse_time_to_minutes(parts[0])
            end = parse_time_to_minutes(parts[1])
            return start, end
        else:
            val = parse_time_to_minutes(t_str)
            return val, val + 60  # assume 1 hour slot for single time

    try:
        s1, e1 = parse_range(time1)
        s2, e2 = parse_range(time2)
        return not (e1 <= s2 or e2 <= s1)
    except Exception as e:
        logger.warning(f"Error parsing time overlap: {time1} vs {time2}: {str(e)}")
        return True  # Safe fallback: treat as overlapping on parse error


def is_artist_available(db: Session, artist_id: int, date_str: str, time_str: str) -> bool:
    """Checks if an artist is available on a specific date and time."""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception as e:
        logger.warning(f"Invalid date format for availability check: {date_str}: {str(e)}")
        return True

    # 1. Check Artist Blocks
    blocks = db.query(ArtistBlockModel).filter(
        ArtistBlockModel.artistId == artist_id,
        ArtistBlockModel.date == target_date
    ).all()
    for block in blocks:
        if times_overlap(block.time, time_str):
            return False

    # 2. Check Bookings (exclude cancelled ones)
    bookings = db.query(BookingModel).filter(
        BookingModel.artistId == artist_id,
        BookingModel.date == target_date,
        BookingModel.status != "cancelled"
    ).all()
    for booking in bookings:
        if times_overlap(booking.time, time_str):
            return False

    return True


class ImageRecommendationService:
    """Service to recommend makeup artists based on a customer's uploaded reference makeup image."""

    def __init__(self) -> None:
        self.face_detection_service = FaceDetectionService()
        self.embedding_service = EmbeddingService()

    def get_recommendations(
        self,
        db: Session,
        image: np.ndarray,
        max_price: int | None = None,
        location: str | None = None,
        availability_date: str | None = None,
        availability_time: str | None = None,
        service_type: str | None = None,
        min_rating: float | None = None,
        ranking_strategy: str = "max",  # "max" or "average"
        weight_visual: float = 0.70,
        weight_rating: float = 0.20,
        weight_availability: float = 0.10,
        top_k_artists: int = 10,
    ) -> list[dict]:
        """
        Runs the AI-powered recommendation pipeline:
        1. Detects and crops face.
        2. Generates face embedding.
        3. Performs pgvector cosine similarity search.
        4. Applies business filters.
        5. Computes hybrid ranking scores and returns the top matching artists.
        """
        # ── STEP 1: Face Detection & Cropping ──
        logger.info("Detecting face in reference image...")
        face_response = self.face_detection_service.detect(image)
        
        if face_response.face_detected and face_response.detections:
            logger.info("Face detected! Proceeding with full image analysis...")
        else:
            logger.warning("No face detected in reference image. Falling back to entire image.")

        # ── STEP 2: Generate Embedding ──
        logger.info("Generating embedding vector from full image...")
        query_vector = self.embedding_service.get_embedding(image)

        # ── STEP 3: Vector Similarity Search ──
        logger.info("Performing vector similarity search in database...")
        # pgvector cosine_distance is: 1 - cosine_similarity
        # similarity is: 1 - cosine_distance
        similarity_expr = (1.0 - PortfolioEmbeddingModel.embedding.cosine_distance(query_vector)).label("similarity")
        
        raw_matches = db.query(
            PortfolioEmbeddingModel,
            similarity_expr
        ).order_by(
            PortfolioEmbeddingModel.embedding.cosine_distance(query_vector)
        ).limit(200).all()

        if not raw_matches:
            logger.info("No portfolio image embeddings found in database.")
            return []

        # Group matches by artist_id
        artist_matches = {}
        for pe, similarity in raw_matches:
            artist_id = pe.artist_id
            # Clamp similarity percentage to [0, 100]
            sim_percentage = max(0.0, min(100.0, float(similarity) * 100.0))
            if artist_id not in artist_matches:
                artist_matches[artist_id] = []
            artist_matches[artist_id].append({
                "portfolio_image_id": pe.portfolio_image_id,
                "image_url": pe.image_url,
                "image_type": pe.image_type,
                "similarity": sim_percentage
            })

        # ── STEP 4: Fetch Artist Details & Apply Filters ──
        recommended_artists = []
        
        for artist_id, matches in artist_matches.items():
            # Query Artist and profile details
            artist = db.query(ArtistModel).filter(ArtistModel.id == artist_id).first()
            if not artist:
                continue

            profile = db.query(ArtistProfileModel).filter(ArtistProfileModel.artistId == artist_id).first()
            rating = profile.rating if profile else 4.5
            review_count = profile.reviewCount if profile else 0
            artist_location = profile.location if profile else ""
            avatar_url = profile.profileImage if profile else ""
            bio = profile.bio if profile else ""

            # Fetch Artist Services
            services = db.query(ArtistServiceModel).filter(ArtistServiceModel.artistId == artist_id).all()
            
            # Extract specialties and min price
            specialties = [s.specialization for s in services if s.specialization]
            prices = []
            for s in services:
                if s.priceRange:
                    try:
                        # Extract number, e.g. "2500" or "2000-3000"
                        price_str = s.priceRange.split("-")[0].strip()
                        prices.append(int(price_str))
                    except ValueError:
                        pass
            
            min_price = min(prices) if prices else 0

            # ── APPLY FILTERS ──
            
            # 1. Budget Filter
            if max_price is not None and min_price > max_price:
                continue

            # 2. Location Filter
            if location is not None and location.strip():
                if not artist_location or location.lower() not in artist_location.lower():
                    continue

            # 3. Rating Filter
            if min_rating is not None and rating < min_rating:
                continue

            # 4. Service Type Filter
            if service_type is not None and service_type.strip():
                matched_service = False
                for spec in specialties:
                    if service_type.lower() in spec.lower():
                        matched_service = True
                        break
                if not matched_service:
                    continue

            # 5. Availability Filter
            is_available = True
            if availability_date and availability_time:
                is_available = is_artist_available(db, artist_id, availability_date, availability_time)
                # If explicitly filtering by availability, exclude unavailable
                if not is_available:
                    continue

            # ── STEP 5: Calculate Hybrid Recommendation Score ──
            
            # Calculate Visual Similarity score based on strategy
            scores = [m["similarity"] for m in matches]
            if ranking_strategy == "average":
                # Average of top 3 matches
                top_scores = sorted(scores, reverse=True)[:3]
                visual_score = sum(top_scores) / len(top_scores)
            else:
                # Max score
                visual_score = max(scores)

            # Rating Score: Normalized from 0-5 stars to 0-100
            rating_score = (rating / 5.0) * 100.0

            # Availability Score: 100 if available, 0 if not
            availability_score = 100.0 if is_available else 0.0

            # Weighted final score
            final_score = (
                (weight_visual * visual_score) +
                (weight_rating * rating_score) +
                (weight_availability * availability_score)
            )

            recommended_artists.append({
                "artist_id": artist_id,
                "name": artist.name,
                "avatar_url": avatar_url,
                "bio": bio,
                "rating": rating,
                "review_count": review_count,
                "location": artist_location,
                "price": min_price,
                "specialty": specialties[0] if specialties else "Makeup Artist",
                "visual_similarity": round(visual_score, 1),
                "match_score": round(final_score, 1),
                "is_available": is_available,
                "best_matching_image": max(matches, key=lambda x: x["similarity"])
            })

        # Sort artists by final match_score descending
        recommended_artists.sort(key=lambda x: x["match_score"], reverse=True)

        return recommended_artists[:top_k_artists]

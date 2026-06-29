from sqlalchemy.orm import Session
from app.models.beauty import ArtistModel
from app.schemas.beauty_profile import BeautyProfile
from app.schemas.artist_recommendation import ArtistRecommendation
from app.services.beauty.makeup_recommendation_service import MakeupRecommendationService

# Seed dataset of professional makeup artists matching UI mockups (e.g. Priya Sharma, Neha Patil)
MOCK_ARTISTS = [
    {
        "id": 1,
        "name": "Priya Sharma",
        "specialty": "Bridal Makeup",
        "expertise_skin_tones": ["Fair", "Light", "Medium"],
        "expertise_looks": ["Bridal Radiance", "Natural Glow", "Engagement Makeup"],
        "rating": 4.8,
        "reviews_count": 120,
        "price": 2500,
        "experience_years": 8,
        "avatar_url": "/assets/artists/priya_sharma.jpg"
    },
    {
        "id": 2,
        "name": "Neha Patil",
        "specialty": "Glam Makeup",
        "expertise_skin_tones": ["Medium", "Tan", "Deep"],
        "expertise_looks": ["Full Glam", "Soft Glam", "Party Makeup"],
        "rating": 4.7,
        "reviews_count": 98,
        "price": 2200,
        "experience_years": 6,
        "avatar_url": "/assets/artists/neha_patil.jpg"
    },
    {
        "id": 3,
        "name": "Elena Rostova",
        "specialty": "Glam & Bridal Specialist",
        "expertise_skin_tones": ["Fair", "Light", "Medium", "Tan", "Deep"],
        "expertise_looks": ["Natural Glow", "Soft Glam", "Bridal Radiance"],
        "rating": 5.0,
        "reviews_count": 180,
        "price": 3000,
        "experience_years": 10,
        "avatar_url": "/assets/artists/elena_rostova.jpg"
    },
    {
        "id": 4,
        "name": "Zara Vance",
        "specialty": "Deep Skin Specialist",
        "expertise_skin_tones": ["Tan", "Deep"],
        "expertise_looks": ["Full Glam", "Bridal Radiance", "Party Makeup"],
        "rating": 4.7,
        "reviews_count": 75,
        "price": 2400,
        "experience_years": 5,
        "avatar_url": "/assets/artists/zara_vance.jpg"
    },
    {
        "id": 5,
        "name": "Yuki Tanaka",
        "specialty": "Minimalist Glow",
        "expertise_skin_tones": ["Fair", "Light"],
        "expertise_looks": ["Natural Glow", "Soft Glam"],
        "rating": 4.9,
        "reviews_count": 90,
        "price": 2000,
        "experience_years": 7,
        "avatar_url": "/assets/artists/yuki_tanaka.jpg"
    }
]


class ArtistRecommendationService:
    """Matches and ranks makeup artists based on suitability to a client's beauty profile."""

    def __init__(self):
        self.recommendation_service = MakeupRecommendationService()

    def get_recommendations(
        self, profile: BeautyProfile, db: Session = None
    ) -> list[ArtistRecommendation]:
        """
        Retrieves makeup artists (database or mock fallback), calculates match scores,
        and ranks them descending.
        """
        # Standardize user profile attributes
        skin_tone_std = profile.skin_tone.title()
        
        # Determine recommended looks for user
        recommended_looks = self.recommendation_service.get_recommendations(
            face_shape=profile.face_shape,
            skin_tone=profile.skin_tone,
            undertone=profile.undertone,
            db=db
        )
        rec_look_names = {look.name.title() for look in recommended_looks}

        # Database fetch with fallback
        artists_data = []
        if db is not None:
            try:
                db_artists = db.query(ArtistModel).all()
                if db_artists:
                    for a in db_artists:
                        artists_data.append({
                            "id": a.id,
                            "name": a.name,
                            "specialty": a.specialty,
                            "expertise_skin_tones": a.expertise_skin_tones,
                            "expertise_looks": a.expertise_looks,
                            "rating": a.rating,
                            "reviews_count": a.reviews_count,
                            "price": a.price,
                            "experience_years": a.experience_years,
                            "avatar_url": a.avatar_url
                        })
            except Exception:
                pass

        if not artists_data:
            artists_data = MOCK_ARTISTS

        recommendations = []
        for artist in artists_data:
            reasons = []
            score = 0

            # 1. Skin Tone Fit (Max 40 points)
            artist_tones = [t.title() for t in artist["expertise_skin_tones"]]
            if skin_tone_std in artist_tones:
                score += 40
                reasons.append(f"Expertise in {skin_tone_std} skin tone (+40 pts)")
            else:
                score += 15
                reasons.append(f"General skin tone compatibility (+15 pts)")

            # 2. Look Match (Max 30 points)
            artist_looks = {l.title() for l in artist["expertise_looks"]}
            matched_looks = artist_looks.intersection(rec_look_names)
            if len(matched_looks) >= 2:
                score += 30
                reasons.append(f"Strong match for recommended looks: {', '.join(matched_looks)} (+30 pts)")
            elif len(matched_looks) == 1:
                score += 20
                reasons.append(f"Match for recommended look: {list(matched_looks)[0]} (+20 pts)")
            else:
                score += 10
                reasons.append(f"Compatible style profile (+10 pts)")

            # 3. Rating score (Max 20 points)
            rating = artist["rating"]
            rating_contrib = int(round(rating * 4.0))  # 5.0 -> 20, 4.5 -> 18
            score += rating_contrib
            reasons.append(f"Top-rated artist with {rating} stars (+{rating_contrib} pts)")

            # 4. Experience score (Max 10 points)
            exp_years = artist["experience_years"]
            exp_contrib = min(10, exp_years)
            score += exp_contrib
            reasons.append(f"{exp_years} years of professional experience (+{exp_contrib} pts)")

            # Ensure final score bounded in [0, 100]
            final_score = max(0, min(100, score))

            recommendations.append(
                ArtistRecommendation(
                    artist_id=artist["id"],
                    match_score=final_score,
                    specialty=artist["specialty"],
                    name=artist["name"],
                    reviews_count=artist.get("reviews_count", 0),
                    price=artist.get("price", 0),
                    experience_years=artist.get("experience_years", 1),
                    avatar_url=artist.get("avatar_url"),
                    matching_reasons=reasons
                )
            )

        # Sort descending by match_score, then rating, then experience
        recommendations.sort(key=lambda x: x.match_score, reverse=True)
        return recommendations

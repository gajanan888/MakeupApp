from pydantic import BaseModel
from typing import List, Optional


class RecommendedArtist(BaseModel):
    """Schema representing details of a recommended Makeup Artist with explainable AI fields."""
    artist_id: int
    artist_name: str
    profile_photo: Optional[str] = ""
    similarity: float
    matched_image: str
    rating: float
    completed_bookings: int
    experience: int
    occasion: Optional[str] = "Party"
    makeup_style: Optional[List[str]] = []
    reason_for_recommendation: Optional[str] = ""


class ArtistRecommendationResponse(BaseModel):
    """FastAPI output response validator for the recommendation endpoint."""
    success: bool
    recommended_artists: List[RecommendedArtist]

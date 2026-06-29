from pydantic import BaseModel, Field


class ArtistRecommendation(BaseModel):
    """Details of a recommended makeup artist, including their matching metrics and pricing."""
    artist_id: int = Field(..., description="Unique ID of the makeup artist.")
    match_score: int = Field(..., description="Match score from 0 to 100 based on client's profile alignment.")
    specialty: str = Field(..., description="Artist specialty (e.g. Bridal Makeup, Glam Makeup).")
    name: str | None = Field(default=None, description="Name of the artist.")
    reviews_count: int = Field(default=0, description="Total client reviews.")
    price: int = Field(default=0, description="Booking fee price in INR.")
    experience_years: int = Field(default=1, description="Years of experience.")
    avatar_url: str | None = Field(default=None, description="URL path to the artist avatar image.")
    matching_reasons: list[str] | None = Field(default=None, description="Detailed list of factors driving the match score.")

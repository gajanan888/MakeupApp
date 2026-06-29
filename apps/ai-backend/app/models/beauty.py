from sqlalchemy import Column, Integer, String, Float, JSON
from sqlalchemy.orm import declarative_base

# Declarative Base for project models
Base = declarative_base()


class LookModel(Base):
    """SQLAlchemy model representing a makeup look preset in the Look Library."""
    __tablename__ = "looks"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    time_estimate = Column(String, nullable=True)        # e.g., "30-45 min"
    coverage = Column(String, nullable=True)             # e.g., "Medium Coverage"
    long_description = Column(String, nullable=True)     # Detailed paragraph describing the look
    category = Column(String, nullable=True)             # e.g., "Natural", "Glam", "Bridal"
    suitable_face_shapes = Column(JSON, nullable=False)  # list of strings
    suitable_skin_tones = Column(JSON, nullable=False)   # list of strings
    suitable_undertones = Column(JSON, nullable=False)    # list of strings
    products = Column(JSON, nullable=False)              # dict containing lipstick, blush, eyeshadow lists
    steps = Column(JSON, nullable=True)                  # list of dicts: [{"step_number": 1, "title": "...", "instruction": "...", "products": [...]}]


class ArtistModel(Base):
    """SQLAlchemy model representing a registered Makeup Artist."""
    __tablename__ = "artists"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    specialty = Column(String, nullable=False)
    expertise_skin_tones = Column(JSON, nullable=False)  # list of strings
    expertise_looks = Column(JSON, nullable=False)       # list of strings
    rating = Column(Float, default=5.0)
    reviews_count = Column(Integer, default=0)           # e.g., 120 reviews
    price = Column(Integer, default=0)                   # booking fee in INR, e.g. 2500
    experience_years = Column(Integer, default=1)
    avatar_url = Column(String, nullable=True)

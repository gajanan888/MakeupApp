from sqlalchemy import Column, Integer, String, Float, JSON, Date, Boolean
from app.database.base import Base


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
    __tablename__ = "Artists"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)
    phone = Column(String, nullable=True)
    isVerified = Column(Boolean, default=False)


class ArtistPortfolioModel(Base):
    """SQLAlchemy model representing an Artist's Portfolio item."""
    __tablename__ = "ArtistPortfolios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    artistId = Column(Integer, nullable=False)
    beforeImageUrl = Column(String, nullable=True)
    afterImageUrl = Column(String, nullable=True)
    tag = Column(String, nullable=True)
    images = Column(JSON, nullable=True)
    description = Column(String, nullable=True)


class ArtistProfileModel(Base):
    """SQLAlchemy model representing an Artist's Profile."""
    __tablename__ = "ArtistProfiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    artistId = Column(Integer, nullable=False, unique=True)
    profileImage = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    location = Column(String, nullable=True)
    experience = Column(String, nullable=True)
    parlourName = Column(String, nullable=True)
    parlourAddress = Column(String, nullable=True)
    rating = Column(Float, nullable=False, default=4.5)
    reviewCount = Column(Integer, nullable=False, default=0)


class ArtistServiceModel(Base):
    """SQLAlchemy model representing a service offered by an Artist."""
    __tablename__ = "ArtistServices"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    artistId = Column(Integer, nullable=False)
    specialization = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    timeRange = Column(String, nullable=True)
    priceRange = Column(String, nullable=True)


class ArtistBlockModel(Base):
    """SQLAlchemy model representing blocked time slots for an Artist."""
    __tablename__ = "ArtistBlocks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    artistId = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    time = Column(String, nullable=False)
    reason = Column(String, nullable=False)


class BookingModel(Base):
    """SQLAlchemy model representing a Booking."""
    __tablename__ = "Bookings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customerId = Column(Integer, nullable=False)
    artistId = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    time = Column(String, nullable=False)
    category = Column(String, nullable=True)
    price = Column(Integer, nullable=True, default=0)
    status = Column(String, nullable=False, default="pending")
    location = Column(String, nullable=True)
    addOns = Column(JSON, nullable=True)
    totalPaid = Column(Integer, nullable=True, default=0)
    rejectionReason = Column(String, nullable=True)
    advanceAmount = Column(Integer, nullable=True, default=0)
    advancePaid = Column(Boolean, nullable=False, default=False)


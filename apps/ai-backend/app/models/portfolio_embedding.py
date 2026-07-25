from sqlalchemy import Column, Integer, String, DateTime, func, JSON
from pgvector.sqlalchemy import Vector
from app.models.beauty import Base


class PortfolioEmbeddingModel(Base):
    """SQLAlchemy model for storing artist portfolio image embeddings."""
    __tablename__ = "artist_portfolio_embeddings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    artist_id = Column(Integer, nullable=False, index=True)
    portfolio_image_id = Column(Integer, nullable=False, index=True)
    image_url = Column(String, nullable=False, index=True)
    image_type = Column(String, nullable=False)  # 'before' or 'after'
    embedding = Column(Vector(768), nullable=False)  # 768 is the dimension of SigLIP base
    face_bbox = Column(JSON, nullable=True)  # stores [x, y, w, h] of face bounding box
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Extended attributes for complete look matching
    occasion = Column(String, nullable=True, index=True)
    makeup_style = Column(JSON, nullable=True)
    hairstyle = Column(String, nullable=True, index=True)
    outfit = Column(String, nullable=True, index=True)
    jewelry = Column(JSON, nullable=True)
    skin_tone = Column(String, nullable=True)
    undertone = Column(String, nullable=True)
    face_shape = Column(String, nullable=True)
    feature_vector = Column(JSON, nullable=True)

import logging
from sqlalchemy.orm import Session
from app.models.portfolio_embedding import PortfolioEmbeddingModel
from typing import List, Tuple, Optional

logger = logging.getLogger(__name__)


class PortfolioEmbeddingRepository:
    """
    Abstractions for PostgreSQL CRUD queries on the artist_portfolio_embeddings table.
    Integrates cosine similarity searches via pgvector, supporting filtering by look attributes.
    """
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, embedding_id: int) -> Optional[PortfolioEmbeddingModel]:
        """Retrieves an embedding entry by primary ID."""
        return self.db.query(PortfolioEmbeddingModel).filter(PortfolioEmbeddingModel.id == embedding_id).first()

    def get_by_portfolio_image_id(self, portfolio_image_id: int) -> Optional[PortfolioEmbeddingModel]:
        """Retrieves an embedding entry by its artist portfolio image reference ID."""
        return self.db.query(PortfolioEmbeddingModel).filter(
            PortfolioEmbeddingModel.portfolio_image_id == portfolio_image_id
        ).first()

    def create(
        self,
        artist_id: int,
        portfolio_image_id: int,
        image_url: str,
        image_type: str,
        embedding: List[float],
        face_bbox: Optional[dict],
        occasion: Optional[str] = None,
        makeup_style: Optional[List[str]] = None,
        hairstyle: Optional[str] = None,
        outfit: Optional[str] = None,
        jewelry: Optional[List[str]] = None,
        skin_tone: Optional[str] = None,
        undertone: Optional[str] = None,
        face_shape: Optional[str] = None,
        feature_vector: Optional[dict] = None
    ) -> PortfolioEmbeddingModel:
        """Saves a new artist portfolio embedding with complete look metadata to the database."""
        db_model = PortfolioEmbeddingModel(
            artist_id=artist_id,
            portfolio_image_id=portfolio_image_id,
            image_url=image_url,
            image_type=image_type,
            embedding=embedding,
            face_bbox=face_bbox,
            occasion=occasion,
            makeup_style=makeup_style,
            hairstyle=hairstyle,
            outfit=outfit,
            jewelry=jewelry,
            skin_tone=skin_tone,
            undertone=undertone,
            face_shape=face_shape,
            feature_vector=feature_vector
        )
        self.db.add(db_model)
        self.db.commit()
        self.db.refresh(db_model)
        return db_model

    def search_similar(
        self,
        query_embedding: List[float],
        limit: int = 20
    ) -> List[Tuple[PortfolioEmbeddingModel, float]]:
        """
        Executes a baseline pgvector cosine similarity search across all records.
        """
        distance_expression = PortfolioEmbeddingModel.embedding.cosine_distance(query_embedding)
        results = self.db.query(
            PortfolioEmbeddingModel,
            distance_expression.label("distance")
        ).order_by(distance_expression).limit(limit).all()
        
        return [(row[0], float(row[1])) for row in results]

    def search_similar_by_occasion(
        self,
        query_embedding: List[float],
        occasion: str,
        limit: int = 100
    ) -> List[Tuple[PortfolioEmbeddingModel, float]]:
        """
        Executes a pgvector cosine similarity search filtered strictly by the look's occasion.
        Falls back to global search if no portfolios match the target occasion.
        """
        distance_expression = PortfolioEmbeddingModel.embedding.cosine_distance(query_embedding)
        
        # 1. Query with strict occasion filter
        results = self.db.query(
            PortfolioEmbeddingModel,
            distance_expression.label("distance")
        ).filter(
            PortfolioEmbeddingModel.occasion == occasion
        ).order_by(distance_expression).limit(limit).all()
        
        # 2. Heuristic fallback: if no entries exist for this occasion, query globally
        if not results:
            logger.warning(f"No database portfolio items found matching occasion '{occasion}'. Falling back to global search.")
            results = self.db.query(
                PortfolioEmbeddingModel,
                distance_expression.label("distance")
            ).order_by(distance_expression).limit(limit).all()
            
        return [(row[0], float(row[1])) for row in results]

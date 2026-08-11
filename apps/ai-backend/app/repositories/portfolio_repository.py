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

    def _python_cosine_dist(self, vec1: List[float], vec2: List[float]) -> float:
        import numpy as np
        if not vec1 or not vec2:
            return 1.0
        v1, v2 = np.array(vec1, dtype=np.float32), np.array(vec2, dtype=np.float32)
        norm1, norm2 = np.linalg.norm(v1), np.linalg.norm(v2)
        if norm1 == 0 or norm2 == 0:
            return 1.0
        return float(1.0 - (np.dot(v1, v2) / (norm1 * norm2)))

    def search_similar(
        self,
        query_embedding: List[float],
        limit: int = 20
    ) -> List[Tuple[PortfolioEmbeddingModel, float]]:
        """
        Executes a baseline pgvector cosine similarity search across all records with SQLite fallback.
        """
        try:
            distance_expression = PortfolioEmbeddingModel.embedding.cosine_distance(query_embedding)
            results = self.db.query(
                PortfolioEmbeddingModel,
                distance_expression.label("distance")
            ).order_by(distance_expression).limit(limit).all()
            return [(row[0], float(row[1])) for row in results]
        except Exception as e:
            logger.warning(f"Native pgvector search unavailable ({e}). Computing cosine similarity in Python.")
            all_records = self.db.query(PortfolioEmbeddingModel).all()
            if not all_records:
                return []
            scored = [(r, self._python_cosine_dist(query_embedding, r.embedding)) for r in all_records]
            scored.sort(key=lambda x: x[1])
            return scored[:limit]

    def search_similar_by_occasion(
        self,
        query_embedding: List[float],
        occasion: str,
        limit: int = 100
    ) -> List[Tuple[PortfolioEmbeddingModel, float]]:
        """
        Executes a pgvector cosine similarity search filtered strictly by the look's occasion with SQLite fallback.
        """
        try:
            distance_expression = PortfolioEmbeddingModel.embedding.cosine_distance(query_embedding)
            results = self.db.query(
                PortfolioEmbeddingModel,
                distance_expression.label("distance")
            ).filter(
                PortfolioEmbeddingModel.occasion == occasion
            ).order_by(distance_expression).limit(limit).all()
            
            if not results:
                results = self.db.query(
                    PortfolioEmbeddingModel,
                    distance_expression.label("distance")
                ).order_by(distance_expression).limit(limit).all()
                
            return [(row[0], float(row[1])) for row in results]
        except Exception as e:
            logger.warning(f"Native pgvector search unavailable ({e}). Computing occasion similarity in Python.")
            all_records = self.db.query(PortfolioEmbeddingModel).all()
            if not all_records:
                return []
            
            occ_records = [r for r in all_records if (r.occasion or "").lower() == (occasion or "").lower()]
            if not occ_records:
                occ_records = all_records
                
            scored = [(r, self._python_cosine_dist(query_embedding, r.embedding)) for r in occ_records]
            scored.sort(key=lambda x: x[1])
            return scored[:limit]

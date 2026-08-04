import logging
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_preview_db
from app.services.portfolio_service import PortfolioService
from app.services.recommendation_service import RecommendationService
from app.schemas.artist import ArtistRecommendationResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/artist", tags=["Artist Recommendation"])


@router.post("/upload-portfolio", status_code=status.HTTP_201_CREATED)
async def upload_portfolio(
    artist_id: int = Form(...),
    portfolio_image_id: int = Form(...),
    image_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_preview_db)
):
    """
    Saves an artist's portfolio image, crops the face region (if detected),
    extracts the SigLIP embedding, and commits the records.
    """
    if image_type not in ("before", "after"):
        logger.warning(f"Invalid image_type uploaded: {image_type}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="image_type must be either 'before' or 'after'."
        )

    file_bytes = await file.read()
    portfolio_service = PortfolioService(db)

    try:
        record = await portfolio_service.upload_and_process_portfolio(
            artist_id=artist_id,
            portfolio_image_id=portfolio_image_id,
            image_type=image_type,
            file=file,
            file_bytes=file_bytes
        )
        return {
            "success": True,
            "message": "Portfolio image processed and embedding stored.",
            "id": record.id,
            "image_url": record.image_url
        }
    except Exception as e:
        logger.error(f"Failed to process portfolio upload: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process portfolio image: {str(e)}"
        )


from pydantic import BaseModel
import httpx
import tempfile
import os

class PortfolioUrlRequest(BaseModel):
    artist_id: int
    portfolio_image_id: int
    image_type: str
    image_url: str

@router.post("/upload-portfolio-url", status_code=status.HTTP_201_CREATED)
async def upload_portfolio_url(
    req: PortfolioUrlRequest,
    db: Session = Depends(get_preview_db)
):
    """
    Downloads an image from a given URL and processes it for the artist's portfolio.
    """
    if req.image_type not in ("before", "after"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="image_type must be either 'before' or 'after'."
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(req.image_url, timeout=15.0)
            if response.status_code != 200:
                raise Exception(f"Failed to download image, HTTP {response.status_code}")
            file_bytes = response.content

        # Create a dummy UploadFile-like object since the service expects one
        # The service actually just needs the filename for the extension
        ext = os.path.splitext(req.image_url)[1] or ".jpg"
        if "?" in ext:
            ext = ext.split("?")[0]
            
        class DummyFile:
            filename = f"downloaded{ext}"

        portfolio_service = PortfolioService(db)
        record = await portfolio_service.upload_and_process_portfolio(
            artist_id=req.artist_id,
            portfolio_image_id=req.portfolio_image_id,
            image_type=req.image_type,
            file=DummyFile(),
            file_bytes=file_bytes
        )
        return {
            "success": True,
            "message": "Portfolio image downloaded and embedding stored.",
            "id": record.id,
            "image_url": record.image_url
        }
    except Exception as e:
        logger.error(f"Failed to process portfolio url upload: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process portfolio image url: {str(e)}"
        )


@router.post("/recommend", response_model=ArtistRecommendationResponse)
async def recommend_artists(
    file: UploadFile = File(...),
    db: Session = Depends(get_preview_db)
):
    """
    Takes an inspiration reference image, crops the face region (if detected),
    runs the SigLIP feature extractor, and queries pgvector for similarity recommendations.
    """
    file_bytes = await file.read()
    recommendation_service = RecommendationService(db)

    try:
        recommended = await recommendation_service.recommend_artists_by_image(file, file_bytes)
        return {
            "success": True,
            "recommended_artists": recommended
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Artist recommendation pipeline failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendation query failed: {str(e)}"
        )

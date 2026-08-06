from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.api.v1.router import api_router
from app.core.config import get_settings


from app.database.base import Base
from app.database.session import engine
# Ensure models are imported for metadata registration
from app.models import virtual_preview, beauty, portfolio_embedding

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm the heavy AI models so the first request is instant
    import asyncio
    from app.services.vision.embedding_service import EmbeddingService
    
    print("Pre-warming PyTorch AI models (this may take 10-15 seconds)...")
    await asyncio.to_thread(EmbeddingService()._load_model)
    print("AI Models pre-warmed successfully!")
    yield

def create_app() -> FastAPI:
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as err:
        print(f"[AI Backend] Notice: Database auto-migration skipped ({err})")
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
        description=(
            "AI backend for makeup artist booking and personalized beauty "
            "recommendations. Phase 1 implements MediaPipe face detection."
        ),
    )

    application.include_router(api_router, prefix=settings.api_v1_prefix)
    application.include_router(api_router)

    # Register Artist Recommendation router
    from app.api.artist import router as artist_router
    application.include_router(artist_router)

    from fastapi.staticfiles import StaticFiles
    application.mount("/generated", StaticFiles(directory=str(settings.generated_dir)), name="generated")
    application.mount("/uploads", StaticFiles(directory=str(settings.upload_dir)), name="uploads")
    return application


app = create_app()

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
    # Pre-load Google's SigLIP model into memory on startup
    from app.vision.siglip_encoder import siglip_encoder
    siglip_encoder.load_model()
    yield

def create_app() -> FastAPI:
    Base.metadata.create_all(bind=engine)
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
    return application


app = create_app()

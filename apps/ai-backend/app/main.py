from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import get_settings


from app.database.base import Base
from app.database.session import engine
# Ensure models are imported for metadata registration
from app.models import virtual_preview, beauty

def create_app() -> FastAPI:
    Base.metadata.create_all(bind=engine)
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description=(
            "AI backend for makeup artist booking and personalized beauty "
            "recommendations. Phase 1 implements MediaPipe face detection."
        ),
    )

    application.include_router(api_router, prefix=settings.api_v1_prefix)
    application.include_router(api_router)

    from fastapi.staticfiles import StaticFiles
    application.mount("/generated", StaticFiles(directory=str(settings.generated_dir)), name="generated")
    return application


app = create_app()

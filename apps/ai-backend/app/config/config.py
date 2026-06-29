from functools import lru_cache
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class PreviewSettings(BaseSettings):
    """Configuration settings for the Virtual Makeup Preview system."""
    app_name: str = "AI Virtual Makeup Preview API"
    api_v1_prefix: str = "/api/v1"
    
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/makeup_app"
    gemini_api_key: str = ""
    hf_api_token: str = ""
    hf_image_model: str = "runwayml/stable-diffusion-v1-5"
    
    # Cloudinary configuration
    cloudinary_url: str = ""
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    
    # Local storage fallbacks
    upload_dir: Path = Field(default=Path("uploads"))
    generated_dir: Path = Field(default=Path("generated"))
    masks_dir: Path = Field(default=Path("generated/masks"))
    
    max_upload_size_mb: int = 8
    allowed_image_types: set[str] = {"image/jpeg", "image/png", "image/webp"}

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_preview_settings() -> PreviewSettings:
    settings = PreviewSettings()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.generated_dir.mkdir(parents=True, exist_ok=True)
    settings.masks_dir.mkdir(parents=True, exist_ok=True)
    return settings

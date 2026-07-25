from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the AI backend."""

    app_name: str = "AI Beauty Recommendation API"
    api_v1_prefix: str = "/api/v1"
    upload_dir: Path = Field(default=Path("uploads"))
    generated_dir: Path = Field(default=Path("generated"))
    max_upload_size_mb: int = 8
    allowed_image_types: set[str] = {"image/jpeg", "image/png", "image/webp"}
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/makeup_app"
    embedding_model_name: str = "google/siglip-base-patch16-224"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.generated_dir.mkdir(parents=True, exist_ok=True)
    return settings

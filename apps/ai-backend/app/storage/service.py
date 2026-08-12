import logging
import os
from pathlib import Path
import httpx
from app.config.config import get_preview_settings

logger = logging.getLogger(__name__)


class StorageService:
    """
    Service for managing file storage (Supabase Storage and local file storage).
    """

    def __init__(self):
        self.settings = get_preview_settings()
        self.supabase_url = os.getenv("SUPABASE_URL", "https://otrhmajpdsfzcxbmxgle.supabase.co")
        self.supabase_key = (
            os.getenv("SUPABASE_SECRET_KEY")
            or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            or os.getenv("SUPABASE_PUBLISHABLE_KEY")
            or os.getenv("SUPABASE_ANON_KEY")
        )
        self.supabase_configured = bool(self.supabase_url and self.supabase_key)
        self.bucket_name = os.getenv("SUPABASE_STORAGE_BUCKET", "Makeupapp")

    async def save_upload(self, file_bytes: bytes, filename: str) -> tuple[str, str]:
        """
        Saves an uploaded file. If Supabase Storage is configured, uploads there.
        Otherwise, saves to the local uploads directory.
        Returns:
        - file_path: Local filesystem path.
        - image_url: Access URL (Supabase Storage URL or local static URL).
        """
        # Always save locally first as a backup/reference
        local_path = self.settings.upload_dir / filename
        with open(local_path, "wb") as f:
            f.write(file_bytes)
            
        local_path_str = str(local_path.resolve())
        image_url = f"/uploads/{filename}"  # Default local URL
        
        if self.supabase_configured:
            try:
                # Upload to Supabase Storage via REST API
                upload_endpoint = f"{self.supabase_url.rstrip('/')}/storage/v1/object/{self.bucket_name}/{filename}"
                headers = {
                    "Authorization": f"Bearer {self.supabase_key}",
                    "apikey": self.supabase_key,
                    "x-upsert": "true",
                }
                async with httpx.AsyncClient() as client:
                    res = await client.post(upload_endpoint, content=file_bytes, headers=headers, timeout=10.0)
                    if res.status_code in (200, 201):
                        image_url = f"{self.supabase_url.rstrip('/')}/storage/v1/object/public/{self.bucket_name}/{filename}"
                        logger.info(f"Successfully uploaded {filename} to Supabase Storage: {image_url}")
                    else:
                        logger.warning(f"Supabase Storage upload returned status {res.status_code}: {res.text}")
            except Exception as e:
                logger.error(f"Supabase Storage upload failed: {str(e)}. Using local path URL.")
                
        return local_path_str, image_url


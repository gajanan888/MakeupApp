import logging
import os
from pathlib import Path
from app.config.config import get_preview_settings

logger = logging.getLogger(__name__)


class StorageService:
    """
    Service for managing file storage (Cloudinary and local file storage).
    """

    def __init__(self):
        self.settings = get_preview_settings()
        self.cloudinary_configured = False
        
        # Check if Cloudinary credentials are set in settings
        if (self.settings.cloudinary_url or 
            (self.settings.cloudinary_cloud_name and self.settings.cloudinary_api_key and self.settings.cloudinary_api_secret)):
            try:
                import cloudinary
                import cloudinary.uploader
                
                if self.settings.cloudinary_url:
                    cloudinary.config(cloudinary_url=self.settings.cloudinary_url)
                else:
                    cloudinary.config(
                        cloud_name=self.settings.cloudinary_cloud_name,
                        api_key=self.settings.cloudinary_api_key,
                        api_secret=self.settings.cloudinary_api_secret
                    )
                self.cloudinary_configured = True
                logger.info("Cloudinary storage service initialized successfully.")
            except ImportError:
                logger.warning("Cloudinary package not installed. Falling back to local storage.")
            except Exception as e:
                logger.error(f"Failed to configure Cloudinary: {str(e)}. Falling back to local storage.")

    async def save_upload(self, file_bytes: bytes, filename: str) -> tuple[str, str]:
        """
        Saves an uploaded file. If Cloudinary is configured, uploads there.
        Otherwise, saves to the local uploads directory.
        Returns:
        - file_path: Local filesystem path.
        - image_url: Access URL (Cloudinary URL or local static URL).
        """
        # Always save locally first as a backup/reference
        local_path = self.settings.upload_dir / filename
        with open(local_path, "wb") as f:
            f.write(file_bytes)
            
        local_path_str = str(local_path.resolve())
        image_url = f"/uploads/{filename}"  # Default local URL
        
        if self.cloudinary_configured:
            try:
                import cloudinary.uploader
                response = cloudinary.uploader.upload(
                    local_path_str,
                    folder="makeup_previews/selfies",
                    overwrite=True
                )
                image_url = response.get("secure_url", image_url)
                logger.info(f"Successfully uploaded {filename} to Cloudinary: {image_url}")
            except Exception as e:
                logger.error(f"Cloudinary upload failed: {str(e)}. Using local path URL.")
                
        return local_path_str, image_url

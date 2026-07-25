import io
import os
import logging
import numpy as np
from fastapi import UploadFile, HTTPException, status
from PIL import Image

logger = logging.getLogger(__name__)


class ImagePreprocessor:
    """
    Validates and cleans user-uploaded images before running computer vision pipelines.
    """
    @staticmethod
    def preprocess_upload(file: UploadFile, file_bytes: bytes) -> np.ndarray:
        """
        Validates file size (max 10MB) and format (jpg, jpeg, png, webp),
        removes transparency layers, and converts to an OpenCV-compatible BGR numpy array.
        """
        # 1. Size Validation (10 MB maximum)
        MAX_SIZE = 10 * 1024 * 1024  # 10MB
        if len(file_bytes) > MAX_SIZE:
            logger.warning(f"File size {len(file_bytes)} bytes exceeds limit.")
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Image file size exceeds the 10MB limit."
            )
            
        # 2. Format / Mimetype check
        allowed_types = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
        if file.content_type not in allowed_types:
            ext = os.path.splitext(file.filename or "")[1].lower()
            if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
                logger.warning(f"Unsupported file format: {file.content_type} ({ext})")
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail="Unsupported format. Only JPG, JPEG, PNG, and WEBP images are allowed."
                )

        try:
            # 3. Read image using Pillow & verify it is not corrupted
            image_stream = io.BytesIO(file_bytes)
            pil_img = Image.open(image_stream)
            pil_img.verify()
            
            # Re-open stream since verify() ruins the object reference
            image_stream.seek(0)
            pil_img = Image.open(image_stream)
            
            # 4. Remove alpha channels and normalize to RGB
            if pil_img.mode in ("RGBA", "LA") or (pil_img.mode == "P" and "transparency" in pil_img.info):
                # Paint transparent pixels onto a white background
                background = Image.new("RGB", pil_img.size, (255, 255, 255))
                background.paste(pil_img, mask=pil_img.split()[-1]) # Use alpha channel as mask
                pil_img = background
            elif pil_img.mode != "RGB":
                pil_img = pil_img.convert("RGB")
                
            # 5. Convert to BGR OpenCV Numpy Array
            open_cv_image = np.array(pil_img)
            # RGB to BGR
            open_cv_image = open_cv_image[:, :, ::-1].copy()
            
            return open_cv_image
            
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Image preprocessing failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or corrupted image file."
            )

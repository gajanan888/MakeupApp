from pathlib import Path
from uuid import uuid4

import cv2
import numpy as np
from fastapi import UploadFile

from app.core.config import Settings
from app.core.errors import ImageTooLargeError, InvalidImageError, UnsupportedImageTypeError


async def read_upload_as_image(file: UploadFile, settings: Settings) -> tuple[np.ndarray, bytes]:
    if file.content_type not in settings.allowed_image_types:
        raise UnsupportedImageTypeError(
            f"Unsupported image type '{file.content_type}'. Upload JPEG, PNG, or WEBP."
        )

    content = await file.read()
    if len(content) > settings.max_upload_size_bytes:
        raise ImageTooLargeError(
            f"Image exceeds {settings.max_upload_size_mb} MB upload limit."
        )

    image_array = np.frombuffer(content, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if image is None:
        raise InvalidImageError("Uploaded file could not be decoded as an image.")

    return image, content


def save_upload(content: bytes, original_filename: str | None, upload_dir: Path) -> Path:
    suffix = Path(original_filename or "upload.jpg").suffix.lower() or ".jpg"
    file_path = upload_dir / f"{uuid4().hex}{suffix}"
    file_path.write_bytes(content)
    return file_path

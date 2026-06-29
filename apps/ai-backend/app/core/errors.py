from fastapi import HTTPException, status


class AIServiceError(Exception):
    """Base error raised by AI services."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class InvalidImageError(AIServiceError):
    """Raised when an uploaded file cannot be decoded as an image."""


class UnsupportedImageTypeError(AIServiceError):
    """Raised when an uploaded file is not an allowed image type."""


class ImageTooLargeError(AIServiceError):
    """Raised when an uploaded file exceeds the configured size limit."""


def to_http_exception(error: AIServiceError) -> HTTPException:
    if isinstance(error, UnsupportedImageTypeError):
        return HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=error.message,
        )

    if isinstance(error, ImageTooLargeError):
        return HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=error.message,
        )

    if isinstance(error, InvalidImageError):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error.message,
        )

    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=error.message,
    )

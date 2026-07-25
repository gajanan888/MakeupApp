import base64
import logging
import cv2
import numpy as np
from fastapi import APIRouter, HTTPException, status, File, Form, UploadFile, Depends

from app.core.config import Settings, get_settings
from app.schemas.tryon import VirtualTryonRequest, VirtualTryonResponse
from app.vision.face_detector import FacePresenceDetector
from app.vision.landmarks import LandmarksProcessor
from app.vision.segmentation import FaceSegmentation
from app.vision.foundation import FoundationProcessor
from app.vision.lipstick import LipstickProcessor
from app.vision.blush import BlushProcessor
from app.vision.eyeshadow import EyeshadowProcessor
from app.vision.eyeliner import EyelinerProcessor
from app.vision.contour import ContourProcessor
from app.vision.highlighter import HighlighterProcessor
from app.vision.eyebrow import EyebrowProcessor
from app.vision.eyelashes import EyelashesProcessor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/virtual-tryon", tags=["Virtual Try-On"])

# Initialize processors
face_presence_detector = FacePresenceDetector()
landmarks_processor = LandmarksProcessor()
segmentation_service = FaceSegmentation()
foundation_processor = FoundationProcessor()
lipstick_processor = LipstickProcessor()
blush_processor = BlushProcessor()
eyeshadow_processor = EyeshadowProcessor()
eyeliner_processor = EyelinerProcessor()
eyelashes_processor = EyelashesProcessor()
contour_processor = ContourProcessor()
highlighter_processor = HighlighterProcessor()
eyebrow_processor = EyebrowProcessor()


def decode_base64_image(base64_str: str) -> np.ndarray:
    """Decodes a base64 string into an OpenCV image."""
    try:
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        
        img_data = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        logger.error(f"Failed to decode base64 image: {str(e)}")
        raise ValueError("Invalid base64 image encoding.")


def encode_image_to_base64(image: np.ndarray) -> str:
    """Encodes an OpenCV image into a JPEG base64 string."""
    _, buffer = cv2.imencode(".jpg", image, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    return base64.b64encode(buffer).decode("utf-8")


def resize_to_max_limit(image: np.ndarray, max_dim: int = 2560) -> np.ndarray:
    """Resizes the image to keep dimensions within a high-res limit, preserving aspect ratio."""
    h, w = image.shape[:2]
    if h <= max_dim and w <= max_dim:
        return image
    
    if h > w:
        new_h = max_dim
        new_w = int(w * (max_dim / h))
    else:
        new_w = max_dim
        new_h = int(h * (max_dim / w))
        
    return cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)


def process_tryon_pipeline(
    img: np.ndarray,
    lipstick: bool,
    lipstickColor: str,
    lipstickStyle: str,
    foundation: bool,
    foundationShade: str,
    blush: bool,
    blushColor: str,
    blushStyle: str,
    eyeshadow: bool,
    eyeshadowColor: str,
    eyeshadowStyle: str,
    eyeliner: bool,
    eyelinerColor: str,
    eyelinerStyle: str,
    eyelashes: bool,
    eyelashesStyle: str,
    contour: bool,
    contourIntensity: float,
    highlighter: bool,
    eyebrow: bool,
    eyebrowColor: str,
    intensity: float,
) -> VirtualTryonResponse:
    """Core cosmetics rendering pipeline."""
    if img is None or img.size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image. Decoded image is empty.",
        )

    # 1. Resize preserving high aspect ratio (optimizes landmarks precision)
    img = resize_to_max_limit(img, max_dim=2560)
    h, w = img.shape[:2]

    # 2. Detect if face exists
    if not face_presence_detector.has_face(img):
        return VirtualTryonResponse(
            success=False,
            message="No face detected",
            processedImage=None
        )

    # 3. Extract landmarks
    landmarks = landmarks_processor.get_landmarks(img)
    if not landmarks:
        return VirtualTryonResponse(
            success=False,
            message="No face landmarks could be extracted.",
            processedImage=None
        )

    # 4. Segment face masks
    masks = segmentation_service.get_masks(landmarks, (h, w))

    # 5. Apply makeup layers sequentially
    processed_img = img.copy()
    global_opacity = float(intensity) / 100.0

    # Foundation
    if foundation and foundationShade:
        processed_img = foundation_processor.apply(
            processed_img, foundationShade, masks["skin"], global_opacity
        )

    # Lipstick
    if lipstick and lipstickColor and lipstickStyle:
        processed_img = lipstick_processor.apply(
            processed_img, lipstickColor, lipstickStyle, masks["lips"], global_opacity
        )

    # Blush
    if blush and blushColor and blushStyle:
        processed_img = blush_processor.apply(
            processed_img, blushStyle, masks["left_cheek"], masks["right_cheek"], global_opacity
        )

    # Eyeshadow
    if eyeshadow and eyeshadowColor and eyeshadowStyle:
        processed_img = eyeshadow_processor.apply(
            processed_img, landmarks, eyeshadowColor, eyeshadowStyle, global_opacity
        )

    # Eyeliner
    if eyeliner and eyelinerColor and eyelinerStyle:
        processed_img = eyeliner_processor.apply(
            processed_img, landmarks, eyelinerStyle, global_opacity
        )

    # Eyelashes
    if eyelashes and eyelashesStyle:
        processed_img = eyelashes_processor.apply(
            processed_img, landmarks, eyelashesStyle, global_opacity
        )

    # Contour
    if contour:
        contour_int = (float(contourIntensity or 50) / 100.0) * global_opacity
        processed_img = contour_processor.apply(processed_img, landmarks, contour_int)

    # Highlighter
    if highlighter:
        processed_img = highlighter_processor.apply(processed_img, landmarks, global_opacity)

    # Eyebrow Tint
    if eyebrow and eyebrowColor:
        processed_img = eyebrow_processor.apply(
            processed_img, eyebrowColor, masks["eyebrows"], global_opacity
        )

    # 6. Convert output back to base64
    processed_base64 = encode_image_to_base64(processed_img)

    return VirtualTryonResponse(
        success=True,
        message="Makeup applied successfully.",
        processedImage=processed_base64
    )


@router.post(
    "",
    response_model=VirtualTryonResponse,
    status_code=status.HTTP_200_OK,
    summary="Apply digital makeup try-on to user photo (Base64)",
)
async def apply_virtual_tryon(request: VirtualTryonRequest) -> VirtualTryonResponse:
    """Accepts a selfie in base64 format, processes makeup overlays, and returns base64 output."""
    try:
        try:
            img = decode_base64_image(request.image)
        except ValueError as err:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
            
        return process_tryon_pipeline(
            img=img,
            lipstick=request.lipstick,
            lipstickColor=request.lipstickColor,
            lipstickStyle=request.lipstickStyle,
            foundation=request.foundation,
            foundationShade=request.foundationShade,
            blush=request.blush,
            blushColor=request.blushColor,
            blushStyle=request.blushStyle,
            eyeshadow=request.eyeshadow,
            eyeshadowColor=request.eyeshadowColor,
            eyeshadowStyle=request.eyeshadowStyle,
            eyeliner=request.eyeliner,
            eyelinerColor=request.eyelinerColor,
            eyelinerStyle=request.eyelinerStyle,
            eyelashes=request.eyelashes,
            eyelashesStyle=request.eyelashesStyle,
            contour=request.contour,
            contourIntensity=request.contourIntensity or 50,
            highlighter=request.highlighter,
            eyebrow=request.eyebrow,
            eyebrowColor=request.eyebrowColor,
            intensity=request.intensity,
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Try-On base64 processing failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Try-On processing failed: {str(e)}"
        )


@router.post(
    "/upload",
    response_model=VirtualTryonResponse,
    status_code=status.HTTP_200_OK,
    summary="Apply digital makeup try-on using high-res file upload",
)
async def apply_virtual_tryon_file(
    file: UploadFile = File(...),
    lipstick: str = Form("false"),
    lipstickColor: str = Form("Red"),
    lipstickStyle: str = Form("Matte"),
    foundation: str = Form("false"),
    foundationShade: str = Form("Warm Beige"),
    blush: str = Form("false"),
    blushColor: str = Form("Pink"),
    blushStyle: str = Form("Medium"),
    eyeshadow: str = Form("false"),
    eyeshadowColor: str = Form("Pink"),
    eyeshadowStyle: str = Form("Matte"),
    eyeliner: str = Form("false"),
    eyelinerColor: str = Form("Black"),
    eyelinerStyle: str = Form("Medium"),
    eyelashes: str = Form("false"),
    eyelashesStyle: str = Form("Natural"),
    contour: str = Form("false"),
    contourIntensity: str = Form("50"),
    highlighter: str = Form("false"),
    eyebrow: str = Form("false"),
    eyebrowColor: str = Form("Dark Brown"),
    intensity: str = Form("80"),
) -> VirtualTryonResponse:
    """Accepts a high-res image upload, processes makeup, and returns base64 output."""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Helper parser for string Booleans
        to_bool = lambda s: s.lower() == "true"

        return process_tryon_pipeline(
            img=img,
            lipstick=to_bool(lipstick),
            lipstickColor=lipstickColor,
            lipstickStyle=lipstickStyle,
            foundation=to_bool(foundation),
            foundationShade=foundationShade,
            blush=to_bool(blush),
            blushColor=blushColor,
            blushStyle=blushStyle,
            eyeshadow=to_bool(eyeshadow),
            eyeshadowColor=eyeshadowColor,
            eyeshadowStyle=eyeshadowStyle,
            eyeliner=to_bool(eyeliner),
            eyelinerColor=eyelinerColor,
            eyelinerStyle=eyelinerStyle,
            eyelashes=to_bool(eyelashes),
            eyelashesStyle=eyelashesStyle,
            contour=to_bool(contour),
            contourIntensity=float(contourIntensity),
            highlighter=to_bool(highlighter),
            eyebrow=to_bool(eyebrow),
            eyebrowColor=eyebrowColor,
            intensity=float(intensity),
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Try-On upload processing failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Try-On upload processing failed: {str(e)}"
        )

import cv2
from typing import Tuple
import numpy as np

class BlendingUtils:
    """Core image blending utilities using alpha blending, Gaussian blurring, and LAB/HSV adjustments."""

    @staticmethod
    def feather_mask(mask: np.ndarray, blur_size: int = 15) -> np.ndarray:
        """
        Applies a Gaussian blur to a binary uint8 mask to create a smooth, feathered mask.
        Returns a float32 mask normalized between 0.0 and 1.0.
        """
        if blur_size % 2 == 0:
            blur_size += 1
            
        blurred = cv2.GaussianBlur(mask, (blur_size, blur_size), 0)
        return blurred.astype(np.float32) / 255.0

    @staticmethod
    def overlay_color(image: np.ndarray, color_bgr: Tuple[int, int, int], mask: np.ndarray, opacity: float) -> np.ndarray:
        """
        Overlays a solid BGR color onto the image inside the given mask using alpha blending.
        mask should be a uint8 mask (0 to 255).
        """
        feathered = BlendingUtils.feather_mask(mask, blur_size=11)
        mask_3d = np.expand_dims(feathered * opacity, axis=2)
        
        color_layer = np.full(image.shape, color_bgr, dtype=np.uint8)
        
        # Output = Original * (1 - Alpha) + ColorLayer * Alpha
        blended = image * (1.0 - mask_3d) + color_layer * mask_3d
        return np.clip(blended, 0, 255).astype(np.uint8)

    @staticmethod
    def blend_lab_skin(image: np.ndarray, color_bgr: Tuple[int, int, int], mask: np.ndarray, opacity: float) -> np.ndarray:
        """
        Blends skin tones (like foundation) in the LAB color space.
        Keeps the L (Lightness) channel intact to preserve skin texture, pores, and shadows,
        while blending A and B color channels for a highly realistic look.
        """
        # Convert image to LAB
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        
        # Convert target color to LAB
        color_img = np.full(image.shape, color_bgr, dtype=np.uint8)
        color_lab = cv2.cvtColor(color_img, cv2.COLOR_BGR2LAB)
        _, target_a, target_b = cv2.split(color_lab)
        
        # Feather the mask
        feathered = BlendingUtils.feather_mask(mask, blur_size=21)
        mask_2d = feathered * opacity
        
        # Blend A and B channels
        new_a = a_channel * (1.0 - mask_2d) + target_a * mask_2d
        new_b = b_channel * (1.0 - mask_2d) + target_b * mask_2d
        
        # Merge back with original L channel
        merged_lab = cv2.merge([l_channel, new_a.astype(np.uint8), new_b.astype(np.uint8)])
        return cv2.cvtColor(merged_lab, cv2.COLOR_LAB2BGR)
        
    @staticmethod
    def blend_hsv_tint(image: np.ndarray, color_bgr: Tuple[int, int, int], mask: np.ndarray, opacity: float) -> np.ndarray:
        """
        Tints an image (like hair or eyes) by blending in the HSV color space.
        Blends Hue and Saturation, preserving original Value (brightness).
        """
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        h_channel, s_channel, v_channel = cv2.split(hsv)
        
        color_img = np.full(image.shape, color_bgr, dtype=np.uint8)
        color_hsv = cv2.cvtColor(color_img, cv2.COLOR_BGR2HSV)
        target_h, target_s, _ = cv2.split(color_hsv)
        
        feathered = BlendingUtils.feather_mask(mask, blur_size=15)
        mask_2d = feathered * opacity
        
        new_h = h_channel * (1.0 - mask_2d) + target_h * mask_2d
        new_s = s_channel * (1.0 - mask_2d) + target_s * mask_2d
        
        merged_hsv = cv2.merge([new_h.astype(np.uint8), new_s.astype(np.uint8), v_channel])
        return cv2.cvtColor(merged_hsv, cv2.COLOR_HSV2BGR)

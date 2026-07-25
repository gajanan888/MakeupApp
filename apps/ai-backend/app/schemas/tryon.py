from pydantic import BaseModel, Field
from typing import Optional

class VirtualTryonRequest(BaseModel):
    """Schema representing a virtual try-on processing request."""
    image: str = Field(..., description="Base64 encoded string of the selfie image.")
    
    # Makeup toggles & settings
    foundation: bool = Field(default=False, description="Apply foundation layer.")
    foundationShade: Optional[str] = Field(default="Warm Beige", description="Foundation shade name.")
    
    lipstick: bool = Field(default=False, description="Apply lipstick layer.")
    lipstickColor: Optional[str] = Field(default="Red", description="Lipstick color name.")
    lipstickStyle: Optional[str] = Field(default="Matte", description="Lipstick style: Matte, Gloss, or Cream.")
    
    blush: bool = Field(default=False, description="Apply blush layer.")
    blushColor: Optional[str] = Field(default="Pink", description="Blush color name.")
    blushStyle: Optional[str] = Field(default="Medium", description="Blush density style: Soft, Medium, or Heavy.")
    
    eyeshadow: bool = Field(default=False, description="Apply eyeshadow layer.")
    eyeshadowColor: Optional[str] = Field(default="Pink", description="Eyeshadow color name.")
    eyeshadowStyle: Optional[str] = Field(default="Matte", description="Eyeshadow style: Matte, Shimmer, or Smokey.")
    
    eyeliner: bool = Field(default=False, description="Apply eyeliner layer.")
    eyelinerColor: Optional[str] = Field(default="Black", description="Eyeliner color name.")
    eyelinerStyle: Optional[str] = Field(default="Medium", description="Eyeliner style: Thin, Medium, or Winged.")
    
    eyelashes: bool = Field(default=False, description="Apply eyelashes layer.")
    eyelashesStyle: Optional[str] = Field(default="Natural", description="Eyelashes style: Natural, Volume, or Dramatic.")
    
    contour: bool = Field(default=False, description="Apply contour shading.")
    contourIntensity: Optional[int] = Field(default=50, ge=0, le=100, description="Contour intensity (0-100).")
    
    highlighter: bool = Field(default=False, description="Apply highlighter layer.")
    
    eyebrow: bool = Field(default=False, description="Apply eyebrow tinting.")
    eyebrowColor: Optional[str] = Field(default="Brown", description="Eyebrow tint color: Brown, Black, or Dark Brown.")
    
    intensity: int = Field(default=75, ge=0, le=100, description="Global opacity/intensity scaling factor (0-100).")


class VirtualTryonResponse(BaseModel):
    """Schema representing the virtual try-on response."""
    success: bool = Field(..., description="Success flag.")
    message: str = Field(..., description="Response status description.")
    processedImage: Optional[str] = Field(default=None, description="Base64 encoded processed image output.")

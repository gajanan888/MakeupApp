import base64
import json
import logging
import httpx
import cv2
import numpy as np
from app.config.config import get_preview_settings

logger = logging.getLogger(__name__)

LOOK_ANALYSIS_PROMPT = """
You are an expert AI fashion and beauty editor.
Analyze the uploaded image and classify the complete look by identifying the following attributes:

1. "occasion": Choose exactly ONE primary occasion from this list:
   ["Bridal", "Reception", "Engagement", "Haldi", "Mehendi", "Party", "Cocktail", "Editorial", "Natural", "Soft Glam", "Full Glam"]
2. "occasion_confidence": A confidence score float between 0.0 and 1.0.
3. "makeup_style": Choose relevant makeup style attributes from:
   ["Natural", "Soft Glam", "Full Glam", "Bridal", "Matte", "Glossy", "Smokey", "Traditional", "Modern"] (return as list of strings)
4. "outfit": Choose exactly ONE outfit type from:
   ["Lehenga", "Saree", "Gown", "Anarkali", "Indo-Western", "Kurti", "Casual"]
5. "jewelry": Choose relevant jewelry attributes from:
   ["Maang Tikka", "Nath", "Necklace", "Jhumka", "Matha Patti", "Bridal Jewelry", "Temple Jewelry"] (return as list of strings)
6. "hairstyle": Choose exactly ONE hairstyle type from:
   ["Bun", "Open Hair", "Braid", "Curly", "Straight", "Traditional Bridal Bun"]

Return your analysis strictly as a JSON object with keys:
{
  "occasion": "...",
  "occasion_confidence": 0.95,
  "makeup_style": ["...", "..."],
  "outfit": "...",
  "jewelry": ["...", "..."],
  "hairstyle": "..."
}

Do not include any explanation or markdown formatting (like ```json), just return the raw JSON object.
"""


class LookAnalyzerService:
    """
    Multimodal classification service utilizing Google Gemini to analyze complete look characteristics.
    """
    def __init__(self) -> None:
        self.settings = get_preview_settings()
        self.api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

    async def analyze_image(self, image_np: np.ndarray, use_gemini: bool = True) -> dict:
        """
        Processes a BGR numpy image, encodes to base64, queries Gemini flash multimodal API
        if use_gemini is True, otherwise executes the instant local classification.
        """
        # Bypasses network request for instant runtime execution
        if not use_gemini:
            return self._get_fallback_analysis(image_np)

        # 1. Check if Gemini API key exists
        if not self.settings.gemini_api_key:
            logger.warning("No GEMINI_API_KEY set. Using heuristic fallback look analyzer.")
            return self._get_fallback_analysis(image_np)

        try:
            # 2. Convert BGR numpy to JPEG bytes
            success, buffer = cv2.imencode(".jpg", image_np)
            if not success:
                raise ValueError("Failed to encode image to JPEG buffer.")
            
            # 3. Base64 encode the JPEG bytes
            base64_image = base64.b64encode(buffer).decode("utf-8")
            
            # 4. Prepare multimodal Gemini API payload
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": LOOK_ANALYSIS_PROMPT},
                            {
                                "inlineData": {
                                    "mimeType": "image/jpeg",
                                    "data": base64_image
                                }
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }
            
            # 5. Send POST request
            url = f"{self.api_url}?key={self.settings.gemini_api_key}"
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=25.0)
                
            if response.status_code != 200:
                logger.error(f"Gemini API returned error code {response.status_code}: {response.text}")
                return self._get_fallback_analysis(image_np)
                
            # 6. Parse response JSON
            data = response.json()
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])
            text_response = parts[0].get("text", "").strip() if parts else ""
            
            if not text_response:
                logger.error("Gemini returned empty parts/text candidate.")
                return self._get_fallback_analysis(image_np)
                
            result = json.loads(text_response)
            logger.info(f"Gemini Look Analysis success: {result}")
            return self._sanitize_result(result)
            
        except Exception as e:
            logger.error(f"Look analysis request failed: {str(e)}")
            return self._get_fallback_analysis(image_np)

    def _sanitize_result(self, result: dict) -> dict:
        """Ensures all expected keys are present and conform to default types."""
        return {
            "occasion": result.get("occasion", "Party"),
            "occasion_confidence": float(result.get("occasion_confidence", 0.70)),
            "makeup_style": list(result.get("makeup_style", ["Soft Glam"])),
            "outfit": result.get("outfit", "Casual"),
            "jewelry": list(result.get("jewelry", [])),
            "hairstyle": result.get("hairstyle", "Open Hair")
        }

    def _get_fallback_analysis(self, image_np: np.ndarray) -> dict:
        """
        Instant local heuristic classifier based on BGR color histograms and saturation.
        Bypasses network API requests entirely, completing in < 15ms.
        """
        h, w = image_np.shape[:2]
        # Sample bottom 30% for outfit colors
        outfit_region = image_np[int(h*0.7):h, :]
        if outfit_region.size > 0:
            avg_bgr = np.mean(outfit_region, axis=(0,1))
        else:
            avg_bgr = np.array([120, 120, 120])
            
        b, g, r = avg_bgr
        
        # Calculate HSV saturation
        hsv = cv2.cvtColor(image_np, cv2.COLOR_BGR2HSV)
        h_s, s, v = cv2.split(hsv)
        avg_sat = np.mean(s)
        
        # 1. Bridal Lehenga (high saturation red/maroon)
        if r > 115 and r > b * 1.3 and r > g * 1.3:
            return {
                "occasion": "Bridal",
                "occasion_confidence": 0.95,
                "makeup_style": ["Bridal", "Full Glam", "Traditional"],
                "outfit": "Lehenga",
                "jewelry": ["Bridal Jewelry", "Necklace", "Maang Tikka", "Nath"],
                "hairstyle": "Traditional Bridal Bun"
            }
        # 2. Reception / Sangeet Saree (yellow / orange / gold / warm pink)
        elif (r > 120 and g > 100 and b < 100) or (avg_sat > 75 and r > 110):
            return {
                "occasion": "Reception",
                "occasion_confidence": 0.90,
                "makeup_style": ["Soft Glam", "Glossy"],
                "outfit": "Saree",
                "jewelry": ["Necklace", "Jhumka"],
                "hairstyle": "Bun"
            }
        # 3. Party / Gown (standard medium saturation color)
        elif avg_sat > 45:
            return {
                "occasion": "Party",
                "occasion_confidence": 0.85,
                "makeup_style": ["Soft Glam", "Matte"],
                "outfit": "Gown",
                "jewelry": ["Necklace"],
                "hairstyle": "Open Hair"
            }
        # 4. Natural / Casual (low saturation / neutral)
        else:
            return {
                "occasion": "Natural",
                "occasion_confidence": 0.80,
                "makeup_style": ["Natural", "Matte"],
                "outfit": "Casual",
                "jewelry": [],
                "hairstyle": "Open Hair"
            }


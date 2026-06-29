import base64
import httpx
import logging
import uuid
from typing import Tuple, Dict, Any
from app.config.config import get_preview_settings
from app.models.virtual_preview import SelfieModel

logger = logging.getLogger(__name__)


class ImageGenerationService:
    """
    Service for applying makeup edits via generative AI.
    Uses Gemini (gemini-2.5-flash-image) for image-to-image makeup generation.
    """

    async def generate_makeup_preview(
        self, selfie: SelfieModel, prompt: str, masks: dict, preferences: Dict[str, Any]
    ) -> Tuple[str, float]:
        """
        Edits the selfie image to apply makeup using Hugging Face (Stable Diffusion).
        """
        settings = get_preview_settings()

        if not settings.hf_api_token:
            raise ValueError("HF_API_TOKEN is not configured in the environment. Please add it to your .env file.")

        try:
            # 1. Read and base64-encode the original selfie image
            with open(selfie.file_path, "rb") as image_file:
                encoded_image = base64.b64encode(image_file.read()).decode("utf-8")

            # 2. Call Hugging Face for image-to-image makeup generation
            url = f"https://api-inference.huggingface.co/models/{settings.hf_image_model}"
            
            # Construct a clear prompt directing the model to edit only the makeup
            full_prompt = (
                f"Apply the following makeup style to the person in the image. "
                f"Makeup Details: {prompt}. "
                f"High quality, photorealistic, professional makeup artist finish, beauty portrait."
            )

            payload = {
                "inputs": encoded_image,
                "parameters": {
                    "prompt": full_prompt,
                    "negative_prompt": "blurry, low quality, distorted, altered face structure, changed identity, background change, disfigured, extra limbs",
                    "strength": 0.45,  # 0.0 = no change, 1.0 = completely new image. 0.45 is the sweet spot for makeup.
                    "guidance_scale": 7.5
                },
                "options": {
                    "wait_for_model": True  # Block and wait if the model is currently loading on Hugging Face
                }
            }

            headers = {
                "Authorization": f"Bearer {settings.hf_api_token}",
                "Content-Type": "application/json"
            }

            logger.info(f"Calling Hugging Face Image-to-Image API ({settings.hf_image_model}) with prompt: {prompt}")
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=90.0)

            if response.status_code == 200:
                filename = f"preview_{uuid.uuid4()}.jpg"
                save_path = settings.generated_dir / filename
                
                with open(save_path, "wb") as f:
                    f.write(response.content)
                    
                generated_url = f"/generated/{filename}"
                logger.info(f"Hugging Face-generated makeup preview saved to: {generated_url}")
                return generated_url, 0.95
            else:
                logger.error(f"Hugging Face API failed (Status {response.status_code}): {response.text}")
                raise ValueError(f"Hugging Face API failed: {response.text}")

        except Exception as e:
            logger.error(f"Failed calling Hugging Face API: {str(e)}")
            raise e

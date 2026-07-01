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
        Edits the selfie image to apply makeup using Gemini (gemini-2.5-flash-image)
        or falls back to local OpenCV simulation.
        """
        settings = get_preview_settings()
        try:
            # 1. Try Gemini Image generation if API key is present
            if settings.gemini_api_key:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key={settings.gemini_api_key}"
                
                with open(selfie.file_path, "rb") as image_file:
                    encoded_image = base64.b64encode(image_file.read()).decode("utf-8")
                
                full_prompt = (
                    f"A close-up beauty portrait of the person in the image with this makeup applied. "
                    f"Makeup Details: {prompt}. "
                    f"Photorealistic, high quality professional cosmetic finish, clean details, keep same person identity."
                )
                
                payload = {
                    "contents": [
                        {
                            "parts": [
                                {"text": full_prompt},
                                {"inlineData": {"mimeType": "image/jpeg", "data": encoded_image}}
                            ]
                        }
                    ],
                    "generationConfig": {
                        "responseModalities": ["IMAGE"]
                    }
                }
                
                logger.info(f"Calling Gemini Image Generation API with prompt: {prompt}")
                async with httpx.AsyncClient() as client:
                    response = await client.post(url, json=payload, timeout=60.0)
                
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        img_part = None
                        for p in parts:
                            if "inlineData" in p:
                                img_part = p["inlineData"]
                                break
                        
                        if img_part:
                            b64_data = img_part.get("data")
                            filename = f"preview_gemini_{uuid.uuid4().hex}.jpg"
                            save_path = settings.generated_dir / filename
                            
                            with open(save_path, "wb") as f:
                                f.write(base64.b64decode(b64_data))
                                
                            generated_url = f"/generated/{filename}"
                            logger.info(f"Gemini-generated makeup preview saved to: {generated_url}")
                            return generated_url, 0.95
                    
                    logger.warning(f"Gemini API returned 200 but did not contain image data: {response.text}")
                else:
                    logger.warning(f"Gemini Image API failed (Status {response.status_code}): {response.text}")

            # 2. Try Hugging Face Inference if token is present
            if settings.hf_api_token:
                url = f"https://router.huggingface.co/hf-inference/models/{settings.hf_image_model}"
                
                with open(selfie.file_path, "rb") as image_file:
                    encoded_image = base64.b64encode(image_file.read()).decode("utf-8")
                
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
                        "strength": 0.45,
                        "guidance_scale": 7.5
                    },
                    "options": {
                        "wait_for_model": True
                    }
                }
                
                headers = {
                    "Authorization": f"Bearer {settings.hf_api_token}",
                    "Content-Type": "application/json"
                }
                
                logger.info(f"Calling Hugging Face Image-to-Image API ({settings.hf_image_model})")
                async with httpx.AsyncClient() as client:
                    response = await client.post(url, json=payload, headers=headers, timeout=90.0)
                
                if response.status_code == 200:
                    filename = f"preview_hf_{uuid.uuid4().hex}.jpg"
                    save_path = settings.generated_dir / filename
                    
                    with open(save_path, "wb") as f:
                        f.write(response.content)
                        
                    generated_url = f"/generated/{filename}"
                    logger.info(f"Hugging Face-generated makeup preview saved to: {generated_url}")
                    return generated_url, 0.92

            # If no API keys are present or all APIs failed, raise error to trigger local fallback
            raise ValueError("All external image generation APIs failed or are unconfigured.")

        except Exception as e:
            logger.warning(f"Hugging Face API failed: {str(e)}. Falling back to local OpenCV makeup simulation...")
            
            # --- LOCAL FALLBACK RENDERER ---
            try:
                import cv2
                from app.database.session import SessionLocal
                from app.models.virtual_preview import FaceAnalysisModel
                from app.services.beauty.makeup_simulation_service import MakeupSimulationService
                from app.schemas.makeup_recommendation import RecommendedLook
                
                # 1. Fetch landmarks from DB
                db = SessionLocal()
                try:
                    analysis = db.query(FaceAnalysisModel).filter(FaceAnalysisModel.selfie_id == selfie.id).first()
                    raw_landmarks = analysis.landmarks if analysis else None
                finally:
                    db.close()
                
                if not raw_landmarks:
                    logger.warning("No face landmarks found in DB for local simulation. Using original image.")
                    return selfie.image_url, 0.5
                
                # Convert list of dicts to list of FaceLandmark schemas
                from app.schemas.face import FaceLandmark
                landmarks = [FaceLandmark(**lm) for lm in raw_landmarks]
                
                # 2. Construct a RecommendedLook schema mapping chat preferences to simulation options
                from app.schemas.makeup_recommendation import RecommendedLook, PersonalizedRecommendations, RecommendedFor, ProductRecommendations
                
                style = preferences.get("style", "Surprise Me")
                look_style = "natural_glow"
                if "glam" in style.lower():
                    look_style = "soft_glam" if "soft" in style.lower() else "full_glam"
                elif "bridal" in style.lower():
                    look_style = "bridal_radiance"
                
                pers_rec = PersonalizedRecommendations(
                    foundation_shade=preferences.get("foundation", "Natural Beige") or "Natural Beige",
                    lipstick_color=preferences.get("lipstick", "Dusty Rose") or "Dusty Rose",
                    blush_color=preferences.get("blush", "Peach Pink") or "Peach Pink",
                    eyeshadow_color=preferences.get("eye_makeup", "Gold & Bronze") or "Gold & Bronze",
                    contour_intensity=preferences.get("contour", "Medium") or "Medium",
                    highlight_style=preferences.get("highlight", "High Glow") or "High Glow",
                    eyebrow_shape=preferences.get("eyebrow", "Natural Curved Brows") or "Natural Curved Brows"
                )
                
                look = RecommendedLook(
                    id=look_style,
                    name=style,
                    description="AI generated makeup preview from chat preferences",
                    category="Glam" if "glam" in style.lower() else "Natural",
                    recommended_for=RecommendedFor(face_shape=["Oval"], skin_tone=["Medium"], undertone=["Neutral"]),
                    products=ProductRecommendations(lipstick=[], blush=[], eyeshadow=[]),
                    personalized_recommendations=pers_rec
                )
                
                # 3. Apply overlays
                image = cv2.imread(selfie.file_path)
                simulation_service = MakeupSimulationService()
                simulated_image = simulation_service.simulate(
                    image=image,
                    landmarks=landmarks,
                    look=look,
                    step=3,  # Complete look
                    lash_intensity=0.8,
                    lash_style="Natural"
                )
                
                filename = f"preview_sim_{uuid.uuid4().hex}.jpg"
                save_path = settings.generated_dir / filename
                cv2.imwrite(str(save_path), simulated_image)
                
                generated_url = f"/generated/{filename}"
                logger.info(f"Local OpenCV makeup simulation preview saved to: {generated_url}")
                return generated_url, 0.85
                
            except Exception as render_err:
                import traceback
                logger.error(f"Local backup simulation failed: {str(render_err)}")
                logger.error(traceback.format_exc())
                # If everything fails, return the original selfie image so the app screen doesn't crash
                return selfie.image_url, 0.5

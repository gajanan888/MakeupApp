import logging
import json
import httpx
from typing import Tuple, Dict, Any, List, Optional
from app.models.virtual_preview import ChatSessionModel
from app.config.config import get_preview_settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are an AI Beauty Advisor. Based on the user's makeup preferences collected during a chat session, recommend the specific makeup product colors and styles.
You MUST choose the values from the following allowed lists of colors and styles.

Allowed Foundations:
- "Porcelain Warm / Warm Ivory"
- "Golden Beige / Honey"
- "Amber Caramel"
- "Chestnut Bronze"
- "Rose Alabaster / Cool Ivory"
- "Neutral Sand"
- "Rich Almond"
- "Rich Espresso / Cocoa"
- "Porcelain"
- "Neutral Ivory"
- "Natural Beige"
- "Honey Tan"
- "Rich Cocoa"

Allowed Lipsticks:
- "Peach Nude"
- "Dusty Rose"
- "Mauve"
- "Rosewood"
- "True Red"
- "Deep Plum"
- "Naked Brown"
- "Pink Nude"
- "Berry Mauve"
- "Warm Red"
- "Soft Rosewood"
- "Dusky Rose"
- "Coral Pink"
- "Plum Berry"
- "Naked Rose"
- "Warm Terracotta"
- "Warm Caramel Nude"
- "Vibrant Rosewood"
- "Soft Dusty Mauve"
- "Cool Pink Nude"
- "Berry Nude"
- "Berry Pink"
- "Vibrant Red"
- "Soft Plum"

Allowed Blushes:
- "Peach-Rose"
- "Coral"
- "Soft Pink"
- "Peach-Pink"
- "Terracotta"
- "Cool Berry"
- "Rose"
- "Dusty Mauve"
- "Warm Apricot"
- "Rose-Pink"
- "Soft Apricot"
- "Coral Pink"
- "Warm Peach / Coral"
- "Soft Cool Pink / Mauve"
- "Dusty Rose / Rose-Pink"
- "Terracotta / Deep Peach"
- "Plum Berry / Cool Rose"

Allowed Eyeshadows:
- "Gold"
- "Bronze"
- "Champagne"
- "Taupe"
- "Rose Gold"
- "Smokey Bronze"
- "Charcoal"
- "Champagne Shimmer"
- "Warm Brown"
- "Silver"
- "Copper Shimmer"
- "Glitter Gold"
- "Warm Taupe"
- "Shimmering Gold & Bronze"
- "Cool Taupe & Mauve"
- "Soft Brown & Champagne"
- "Rich Copper, Gold & Warm Earthy Brown"
- "Cool Slate Gray, Soft Mauve & Silver"
- "Icy Pearl, Charcoal & High-Shine Metallic Silver"

Allowed Contour Intensities:
- "Light"
- "Medium"
- "Deep"

Allowed Highlight Styles:
- "Natural"
- "Dewy"
- "High Glow"

Your response must be a JSON object with the following keys and values:
{
  "foundation": "...",
  "lipstick": "...",
  "blush": "...",
  "eye_makeup": "...",
  "contour": "...",
  "highlight": "..."
}
Do not include any markdown formatting (like ```json) or any other text, just the raw JSON object.
"""


class GeminiService:
    """
    Service for interacting with Gemini (Phase 5: Chat, Phase 6: Prompt Generator).
    """

    async def process_chat_turn(
        self, session: ChatSessionModel, user_message: str
    ) -> Tuple[str, bool, Optional[Dict[str, Any]]]:
        """
        Conducts the conversation turn using Gemini.
        """
        logger.info(f"Processing chat turn for session: {session.id}. Message: {user_message}")
        
        questions = [
            ("What is the occasion? (Wedding, Reception, Engagement, Party, Birthday, Office, College, Photoshoot, Festival, Date Night, Casual Outing, Other)", "event"),
            ("Where is the event? (Indoor, Outdoor, Both)", "location"),
            ("What time is the event? (Morning, Afternoon, Evening, Night)", "time"),
            ("What outfit will you wear? (Saree, Lehenga, Gown, Salwar Suit, Western Dress, Formal Wear, Casual Wear, Other)", "outfit"),
            ("What is the primary color of your outfit? (Red, Pink, Blue, Green, Gold, Black, White, Purple, Brown, Maroon, Orange, Peach)", "outfit_color"),
            ("Which overall look do you prefer? (Natural, Soft Glam, Glamorous, Luxury Bridal, Korean Glass Skin, Celebrity Inspired, Surprise Me)", "style"),
            ("How bold should your makeup be? (1 = Barely Visible, 2 = Light, 3 = Medium, 4 = Glam, 5 = Full Glam)", "boldness"),
            ("Do you want any accessories in the preview? (Hairstyle, Earrings, Necklace, Bindi, Dupatta, Veil, None)", "accessories")
        ]
        
        raw_history = session.history
        history: List[Dict[str, Any]] = list(raw_history) if raw_history else []  # type: ignore[arg-type]

        # 1. Identify what question the user is answering
        # Find the last model message in history to get its key
        last_model_key = None
        for msg in reversed(history):
            if msg.get("role") == "model" and msg.get("key"):
                last_model_key = msg.get("key")
                break

        # Append the user's message to history, tagged with the key of the question it answers
        user_msg_entry = {"role": "user", "content": user_message}
        if last_model_key:
            user_msg_entry["key"] = last_model_key
        history.append(user_msg_entry)

        # 2. Determine which questions have been answered
        answered_keys = {msg.get("key") for msg in history if msg.get("role") == "user" and msg.get("key")}

        # 3. Find the next unanswered question
        next_question = None
        next_key = None
        for q, key in questions:
            if key not in answered_keys:
                next_question = q
                next_key = key
                break

        is_complete = False
        preferences = None

        if next_question:
            reply = next_question
            # Append the model's question to history
            history.append({"role": "model", "content": reply, "key": next_key})
        else:
            # All questions answered!
            is_complete = True
            preferences = await self._compile_preferences(history)
            reply = "Thank you! I have gathered all your preferences. Generating your makeup preview now..."
            history.append({"role": "model", "content": reply})

        # Re-assign history to trigger SQLAlchemy dirty tracking
        session.history = history  # type: ignore[assignment]
        return reply, is_complete, preferences

    async def _compile_preferences(self, history: List[Dict[str, Any]]) -> Dict[str, Any]:
        # 1. First compile the high-level answers from the chat history
        prefs = {
            "event": "Party",
            "location": "Indoor",
            "time": "Evening",
            "outfit": "Western Dress",
            "outfit_color": "Black",
            "style": "Soft Glam",
            "boldness": "3 = Medium",
            "accessories": "None"
        }
        for msg in history:
            key = msg.get("key")
            if key is not None and isinstance(key, str) and msg.get("role") == "user":
                prefs[key] = str(msg.get("content", ""))

        # 2. Use Gemini to translate these high-level preferences into specific cosmetic colors/styles
        settings = get_preview_settings()
        if settings.gemini_api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.gemini_api_key}"
                
                prompt = (
                    f"Recommend the best makeup products for these preferences:\n"
                    f"- Occasion/Event: {prefs.get('event')}\n"
                    f"- Location: {prefs.get('location')}\n"
                    f"- Time: {prefs.get('time')}\n"
                    f"- Outfit: {prefs.get('outfit')}\n"
                    f"- Outfit Color: {prefs.get('outfit_color')}\n"
                    f"- Makeup Style: {prefs.get('style')}\n"
                    f"- Boldness: {prefs.get('boldness')}\n"
                    f"- Accessories: {prefs.get('accessories')}\n"
                )
                
                payload = {
                    "contents": [
                        {
                            "parts": [
                                {"text": SYSTEM_PROMPT},
                                {"text": prompt}
                            ]
                        }
                    ],
                    "generationConfig": {
                        "responseMimeType": "application/json"
                    }
                }
                
                async with httpx.AsyncClient() as client:
                    response = await client.post(url, json=payload, timeout=20.0)
                    
                if response.status_code == 200:
                    data = response.json()
                    text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    if text:
                        recommendations = json.loads(text.strip())
                        # Add the recommended colors to the preferences dict
                        prefs.update(recommendations)
                        logger.info(f"Gemini recommended makeup: {recommendations}")
            except Exception as e:
                logger.error(f"Failed to get Gemini recommendations, using defaults: {str(e)}")
                
        # Fallback/default colors if Gemini fails or is not configured
        if "lipstick" not in prefs:
            style_lower = prefs.get("style", "").lower()
            if "natural" in style_lower:
                prefs["lipstick"] = "Peach Nude"
                prefs["blush"] = "Soft Pink"
                prefs["eye_makeup"] = "Champagne"
                prefs["contour"] = "Light"
                prefs["highlight"] = "Natural"
            elif "glam" in style_lower:
                prefs["lipstick"] = "Dusty Rose"
                prefs["blush"] = "Peach-Pink"
                prefs["eye_makeup"] = "Rose Gold"
                prefs["contour"] = "Medium"
                prefs["highlight"] = "Dewy"
            elif "bridal" in style_lower:
                prefs["lipstick"] = "True Red"
                prefs["blush"] = "Peach-Rose"
                prefs["eye_makeup"] = "Gold"
                prefs["contour"] = "Deep"
                prefs["highlight"] = "High Glow"
            else:
                prefs["lipstick"] = "Dusty Rose"
                prefs["blush"] = "Peach-Pink"
                prefs["eye_makeup"] = "Champagne"
                prefs["contour"] = "Medium"
                prefs["highlight"] = "Natural"
                
        if "foundation" not in prefs:
            prefs["foundation"] = "Natural Beige"
            
        return prefs

    async def generate_prompt(self, preferences: Dict[str, Any]) -> str:
        """
        Converts JSON preferences into an optimized, highly structured image editing prompt.
        """
        logger.info(f"Generating prompt for preferences: {preferences}")
        
        event = preferences.get('event', 'Wedding')
        location = preferences.get('location', 'Indoor')
        time = preferences.get('time', 'Evening')
        outfit = preferences.get('outfit', 'Saree')
        outfit_color = preferences.get('outfit_color', 'Pink')
        style = preferences.get('style', 'Soft Glam')
        boldness = preferences.get('boldness', '3 = Medium')
        hair_type = preferences.get('hair_type', 'Wavy')
        hair_length = preferences.get('hair_length', 'Long')
        hairstyle = preferences.get('hairstyle', 'Keep Current Hairstyle')
        jewelry = preferences.get('jewelry', 'Minimal')
        accessories = preferences.get('accessories', 'None')

        # Translate preferences to MUA cosmetics
        fdn = preferences.get('foundation', 'Natural Beige')
        lip = preferences.get('lipstick', 'Peach Nude')
        blsh = preferences.get('blush', 'Soft Pink')
        eye = preferences.get('eye_makeup', 'Champagne')
        cntr = preferences.get('contour', 'Medium')
        hlgt = preferences.get('highlight', 'Natural')

        prompt_parts = []
        
        # 1. Base theme & style setting
        prompt_parts.append(
            f"A high-end fashion magazine editorial beauty portrait showcasing a professional {style} makeup style "
            f"for a {event} themed event."
        )
        
        # 2. Skin tone & foundation details
        prompt_parts.append(
            f"The skin is flawless, featuring a smooth, velvet airbrushed foundation in {fdn} that matches the "
            f"natural skin tone perfectly while retaining realistic skin pores, fine texture, and a soft healthy glow."
        )
        
        # 3. Contouring, blush and highlights
        prompt_parts.append(
            f"Structured cheekbones highlighted with a {hlgt} sheen on the high points, and a softly blended "
            f"{cntr} contour defining the jawline and temples. A natural flush of {blsh} blush seamlessly blends "
            f"into the cheeks."
        )
        
        # 4. Eyes & eyebrows
        prompt_parts.append(
            f"The eyes feature a stunning, professionally blended gradient of {eye} eyeshadow. Bold, clean eyeliner "
            f"and dense, long, realistically curled eyelashes frame the eyes with perfect definition. Eyebrows are "
            f"naturally groomed, filled, and styled."
        )
        
        # 5. Lips
        prompt_parts.append(
            f"The lips are beautifully defined with a clean, precise border, wearing a rich, highly pigmented {lip} lipstick."
        )
        
        # 6. Hair & Hairstyle styling
        if hairstyle.lower() != "keep current hairstyle":
            prompt_parts.append(
                f"The hair is styled in an elegant, professionally dressed {hairstyle}, accentuating the {hair_length} "
                f"{hair_type} hair locks."
            )
        else:
            prompt_parts.append(
                f"The hairstyle maintains the natural look, highlighting clean, healthy {hair_length} {hair_type} hair."
            )
            
        # 7. Jewelry & Accessories
        if jewelry.lower() != "none":
            prompt_parts.append(
                f"The look is elevated with delicate, realistic {jewelry} jewelry, including matching earrings and a necklace."
            )
            
        if accessories.lower() != "none" and accessories.strip() != "":
            prompt_parts.append(f"Matching accessories are present: {accessories}.")
            
        # 8. Outfit
        if outfit.lower() != "none" and outfit.strip() != "":
            prompt_parts.append(
                f"The person is elegantly dressed in a gorgeous {outfit_color} {outfit} that beautifully complements the overall style."
            )
            
        # 9. Photography, Lighting & Quality tags
        prompt_parts.append(
            f"Shot on 85mm lens, f/1.4, sharp focus on the facial features, catching light in the pupils. "
            f"Warm, balanced studio lighting, soft fill lights, elegant subtle shadows, depth of field with a clean "
            f"soft-focus background. Photorealistic, hyper-detailed, luxury cosmetics finish, gorgeous aesthetic."
        )
        
        prompt = "\n\n".join(prompt_parts)
        prompt += (
            "\n\nPreserve the exact facial features, identity, proportions, and expression of the person. "
            "Only change makeup, hair style, jewelry, and accessories as specified."
        )
        return prompt


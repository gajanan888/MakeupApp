import json
from pathlib import Path
from sqlalchemy.orm import Session
from app.models.beauty import LookModel
from app.services.beauty.look_library import SEED_LOOKS
from app.schemas.makeup_recommendation import (
    RecommendedLook,
    RecommendedFor,
    ProductRecommendations,
    PersonalizedRecommendations,
    LookStep,
)

RULES_PATH = Path(__file__).resolve().parents[2] / "core" / "recommendation_rules.json"


class MakeupRecommendationService:
    """
    Generates makeup recommendations using Seasonal Color Analysis and
    Face Shape Geometry Correction algorithms with rules loaded from JSON.
    """

    def __init__(self, rules_path: Path = RULES_PATH):
        try:
            with open(rules_path, "r") as f:
                self.rules = json.load(f)
        except Exception:
            self.rules = {}

    def _determine_seasonal_profile(self, skin_tone: str, undertone: str) -> str:
        """
        Classifies the client into a Color Season profile based on tone and undertone.
        """
        is_light = skin_tone in ["Fair", "Light"]
        profile_key = "light_profile" if is_light else "deep_profile"
        
        undertone_rules = self.rules.get("seasonal_profiles", {}).get(undertone)
        if not undertone_rules:
            # Fallback to Neutral if not found
            undertone_rules = self.rules.get("seasonal_profiles", {}).get("Neutral", {})
            
        return undertone_rules.get(profile_key, "Autumn (Warm & Rich)")

    def _get_foundation_shade(self, season: str, skin_tone: str) -> str:
        """
        Calculates the optimal foundation shade based on seasonal skin undertones.
        """
        season_key = "Neutral"
        for key in ["Spring", "Autumn", "Summer", "Winter"]:
            if key in season:
                season_key = key
                break
                
        shade_rules = self.rules.get("foundation_shades", {}).get(season_key, {})
        if isinstance(shade_rules, dict):
            return shade_rules.get(skin_tone, shade_rules.get("default", "Neutral Beige"))
        return shade_rules

    def _get_lipstick_color(self, season: str, look_id: str) -> str:
        """
        Selects a lipstick shade that harmonizes with the user's seasonal color profile.
        """
        is_glam = "glam" in look_id or "party" in look_id or "full" in look_id
        is_bridal = "bridal" in look_id or "engagement" in look_id
        type_key = "glam" if is_glam else ("bridal" if is_bridal else "default")

        season_key = "Neutral"
        for key in ["Spring", "Autumn", "Summer", "Winter"]:
            if key in season:
                season_key = key
                break
                
        lip_rules = self.rules.get("lipstick_colors", {}).get(season_key, {})
        return lip_rules.get(type_key, "Dusty Rose")

    def _get_blush_color(self, season: str, look_id: str) -> str:
        """
        Determines the optimal blush color following color theory harmony.
        """
        is_glam = "glam" in look_id or "party" in look_id or "full" in look_id
        is_bridal = "bridal" in look_id or "engagement" in look_id
        type_key = "glam" if is_glam else ("bridal" if is_bridal else "default")

        season_key = "default"
        for key in ["Spring", "Autumn", "Summer", "Winter"]:
            if key in season:
                season_key = key
                break
        
        blush_rules = self.rules.get("blush_colors", {}).get(season_key, {})
        if isinstance(blush_rules, dict):
            return blush_rules.get(type_key, "Dusty Rose")
        return blush_rules

    def _get_eyeshadow_palette(self, season: str, look_id: str) -> str:
        """
        Recommends the eyeshadow palette colors matching the seasonal profile.
        """
        is_glam = "glam" in look_id or "party" in look_id or "full" in look_id
        is_bridal = "bridal" in look_id or "engagement" in look_id
        type_key = "glam" if is_glam else ("bridal" if is_bridal else "default")

        season_key = "default"
        for key in ["Spring", "Autumn", "Summer", "Winter"]:
            if key in season:
                season_key = key
                break
        
        shadow_rules = self.rules.get("eyeshadow_palettes", {}).get(season_key, {})
        if isinstance(shadow_rules, dict):
            return shadow_rules.get(type_key, "Champagne Shimmer, Rose Gold & Taupe")
        return shadow_rules

    def _get_contour_placement(self, face_shape: str) -> str:
        """
        Face Shape Correction algorithm. Returns specific placement guidelines
        to visually reshape the face structure toward a balanced oval shape.
        """
        shape_title = face_shape.title()
        contour_rules = self.rules.get("contour_placements", {})
        return contour_rules.get(shape_title, contour_rules.get("default", "Subtle contouring under the cheekbones to define structure."))

    def _get_eyebrow_shape(self, face_shape: str) -> str:
        """
        Recommends the eyebrow structure that corrects and balances the face shape.
        """
        shape_title = face_shape.title()
        brow_rules = self.rules.get("eyebrow_shapes", {})
        return brow_rules.get(shape_title, brow_rules.get("default", "Softly curved arch with natural thickness"))

    def get_recommendations(
        self, face_shape: str, skin_tone: str, undertone: str, db: Session = None
    ) -> list[RecommendedLook]:
        """
        Filters looks from Look library (database or seed fallback), and applies
        Seasonal Color Analysis & Face Shape Correction algorithms.
        Falls back gracefully if no exact match found.
        """
        face_shape_std = face_shape.title()
        skin_tone_std  = skin_tone.title()
        undertone_std  = undertone.title()

        # Normalize "Rich Deep" → "Deep" for matching (library uses "Deep" for darkest tier)
        skin_tone_match = "Deep" if skin_tone_std == "Rich Deep" else skin_tone_std

        # Database fetch with fallback
        looks_data = []
        if db is not None:
            try:
                db_looks = db.query(LookModel).all()
                if db_looks:
                    for l in db_looks:
                        looks_data.append({
                            "id": l.id,
                            "name": l.name,
                            "description": l.description,
                            "time_estimate": l.time_estimate,
                            "coverage": l.coverage,
                            "long_description": l.long_description,
                            "category": l.category,
                            "suitable_face_shapes": l.suitable_face_shapes,
                            "suitable_skin_tones": l.suitable_skin_tones,
                            "suitable_undertones": l.suitable_undertones,
                            "products": l.products,
                            "steps": l.steps
                        })
            except Exception:
                pass

        if not looks_data:
            looks_data = SEED_LOOKS

        # 1. Run Seasonal Color Analysis
        seasonal_profile   = self._determine_seasonal_profile(skin_tone_std, undertone_std)
        contour_placement  = self._get_contour_placement(face_shape_std)
        eyebrow_shape      = self._get_eyebrow_shape(face_shape_std)

        def _build_look(look: dict) -> RecommendedLook:
            """Convert a look dict to a RecommendedLook with personalized shades."""
            personalized = PersonalizedRecommendations(
                foundation_shade=self._get_foundation_shade(seasonal_profile, skin_tone_std),
                lipstick_color=self._get_lipstick_color(seasonal_profile, look["id"]),
                blush_color=self._get_blush_color(seasonal_profile, look["id"]),
                eyeshadow_color=self._get_eyeshadow_palette(seasonal_profile, look["id"]),
                contour_intensity=(
                    "Soft/Light" if skin_tone_match in ["Fair", "Light"]
                    else "Deep/Rich" if skin_tone_match in ["Tan", "Deep"]
                    else "Medium/Subtle"
                ),
                highlight_style=(
                    "Champagne Glow" if undertone_std == "Warm"
                    else "Icy Pearl" if undertone_std == "Cool"
                    else "Rose Gold Glow"
                ),
                eyebrow_shape=eyebrow_shape,
                seasonal_profile=seasonal_profile,
                contour_style=contour_placement,
            )
            return RecommendedLook(
                id=look["id"],
                name=look["name"],
                description=look["description"],
                time_estimate=look.get("time_estimate"),
                coverage=look.get("coverage"),
                long_description=look.get("long_description"),
                category=look.get("category"),
                recommended_for=RecommendedFor(
                    face_shape=look["suitable_face_shapes"],
                    skin_tone=look["suitable_skin_tones"],
                    undertone=look["suitable_undertones"],
                ),
                products=ProductRecommendations(
                    lipstick=look["products"].get("lipstick", []),
                    blush=look["products"].get("blush", []),
                    eyeshadow=look["products"].get("eyeshadow", []),
                ),
                personalized_recommendations=personalized,
                steps=[LookStep(**s) for s in look.get("steps", [])] if look.get("steps") else None,
            )

        def _matches(look: dict, check_tone: bool, check_undertone: bool) -> bool:
            shapes     = [s.title() for s in look["suitable_face_shapes"]]
            tones      = [t.title() for t in look["suitable_skin_tones"]]
            undertones = [u.title() for u in look["suitable_undertones"]]
            if face_shape_std not in shapes:
                return False
            if check_tone and skin_tone_match not in tones:
                return False
            if check_undertone and undertone_std not in undertones:
                return False
            return True

        # Tier 1 — exact match: face_shape + skin_tone + undertone
        results = [_build_look(l) for l in looks_data if _matches(l, True, True)]

        # Tier 2 — relax undertone: face_shape + skin_tone only
        if not results:
            results = [_build_look(l) for l in looks_data if _matches(l, True, False)]

        # Tier 3 — relax skin_tone + undertone: face_shape only
        if not results:
            results = [_build_look(l) for l in looks_data if _matches(l, False, False)]

        return results


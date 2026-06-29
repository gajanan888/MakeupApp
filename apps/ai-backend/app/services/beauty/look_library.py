from sqlalchemy.orm import Session
from app.models.beauty import LookModel

# Seed dataset of professional looks aligned with UI screens
SEED_LOOKS = [
    {
        "id": "natural_glow",
        "name": "Natural Glow",
        "description": "Perfect for everyday look with a dewy, glowing finish.",
        "time_estimate": "15-20 min",
        "coverage": "Light Coverage",
        "long_description": "A fresh-faced look that enhances your features with a dewy, glowing finish. Ideal for daily wear and professional settings.",
        "category": "Natural",
        "suitable_face_shapes": ["Oval", "Heart", "Round", "Square", "Rectangle", "Diamond"],
        "suitable_skin_tones": ["Fair", "Light", "Medium", "Tan", "Deep"],
        "suitable_undertones": ["Warm", "Cool", "Neutral", "Olive"],
        "products": {
            "lipstick": ["Peach Nude", "Dusty Rose"],
            "blush": ["Coral", "Soft Pink"],
            "eyeshadow": ["Soft Brown", "Champagne"]
        },
        "steps": [
            {
                "step_number": 1,
                "title": "Hydrating Base",
                "instruction": "Apply a lightweight skin tint or CC cream to even out your skin tone while maintaining a fresh glow.",
                "products": ["Hydrating CC Cream", "Beauty Blender"]
            },
            {
                "step_number": 2,
                "title": "Cheek Flush",
                "instruction": "Dab coral or peach cream blush onto the apples of your cheeks and blend upwards.",
                "products": ["Cream Blush (Coral)"]
            },
            {
                "step_number": 3,
                "title": "Glossy Lips",
                "instruction": "Finish with a swipe of peach nude tinted lip balm or gloss.",
                "products": ["Tinted Lip Balm (Peach Nude)"]
            }
        ]
    },
    {
        "id": "soft_glam",
        "name": "Soft Glam",
        "description": "Sophisticated look for day-to-night transitions, enhancing natural features.",
        "time_estimate": "30-45 min",
        "coverage": "Medium Coverage",
        "long_description": "This look is perfect for parties and special occasions. It ensures your natural beauty is enhanced with warm metallic lids and soft arches.",
        "category": "Glam",
        "suitable_face_shapes": ["Oval", "Heart", "Round", "Square", "Rectangle", "Diamond"],
        "suitable_skin_tones": ["Fair", "Light", "Medium", "Tan", "Deep"],
        "suitable_undertones": ["Warm", "Cool", "Neutral", "Olive"],
        "products": {
            "lipstick": ["Mauve", "Rosewood"],
            "blush": ["Peach-Pink", "Mauve"],
            "eyeshadow": ["Taupe", "Rose Gold"]
        },
        "steps": [
            {
                "step_number": 1,
                "title": "Satin Base Setup",
                "instruction": "Apply medium coverage foundation and blend well for a smooth satin finish.",
                "products": ["Satin Foundation", "Foundation Brush"]
            },
            {
                "step_number": 2,
                "title": "Soft Defined Eyes",
                "instruction": "Sweep warm taupe shadow in the crease, rose gold on the lids, and draw a thin gel liner.",
                "products": ["Eyeshadow Palette (Taupe/Rose Gold)", "Gel Eyeliner"]
            },
            {
                "step_number": 3,
                "title": "Sultry Lip Contour",
                "instruction": "Define your lips using a mauve liner and fill in with matching rosewood lipstick.",
                "products": ["Mauve Lip Liner", "Rosewood Lipstick"]
            }
        ]
    },
    {
        "id": "full_glam",
        "name": "Full Glam",
        "description": "Vibrant and dramatic look for evening events with high-contrast elements.",
        "time_estimate": "45-60 min",
        "coverage": "Full Coverage",
        "long_description": "A bold, dramatic look featuring high-definition contouring, intense smokey eyes, and long-wearing matte lips.",
        "category": "Glam",
        "suitable_face_shapes": ["Oval", "Round", "Square", "Diamond"],
        "suitable_skin_tones": ["Light", "Medium", "Tan", "Deep"],
        "suitable_undertones": ["Warm", "Cool", "Neutral", "Olive"],
        "products": {
            "lipstick": ["True Red", "Deep Plum", "Naked Brown"],
            "blush": ["Terracotta", "Cool Berry"],
            "eyeshadow": ["Gold", "Smokey Bronze", "Charcoal"]
        },
        "steps": [
            {
                "step_number": 1,
                "title": "Chiseled Contour",
                "instruction": "Apply contour cream under cheekbones, jawline, and forehead, blending it out to define structure.",
                "products": ["Contour Cream Palette", "Contour Brush"]
            },
            {
                "step_number": 2,
                "title": "Smokey Gold Eyes",
                "instruction": "Pack gold shimmer on the center of the lid, blending dark charcoal in the outer crease.",
                "products": ["Eyeshadow Palette (Gold/Charcoal)", "Blending Brush"]
            },
            {
                "step_number": 3,
                "title": "Matte Lip Boldness",
                "instruction": "Line lips precisely and apply a highly pigmented true red or deep plum matte lipstick.",
                "products": ["Matte Lipstick (True Red)"]
            }
        ]
    },
    {
        "id": "bridal_radiance",
        "name": "Bridal Radiance",
        "description": "Timeless elegance with soft warm tones for weddings and ceremonies.",
        "time_estimate": "60-90 min",
        "coverage": "Full Coverage",
        "long_description": "A classic, flawless, long-lasting look with warm metallic lids, soft blush, and a beautiful nude-pink lip.",
        "category": "Bridal",
        "suitable_face_shapes": ["Oval", "Heart", "Round", "Square", "Rectangle", "Diamond"],
        "suitable_skin_tones": ["Fair", "Light", "Medium", "Tan", "Deep"],
        "suitable_undertones": ["Warm", "Cool", "Neutral", "Olive"],
        "products": {
            "lipstick": ["Pink Nude", "Berry Mauve", "Warm Red"],
            "blush": ["Rose", "Coral Pink"],
            "eyeshadow": ["Champagne Shimmer", "Warm Brown", "Gold"]
        },
        "steps": [
            {
                "step_number": 1,
                "title": "Flawless HD Base",
                "instruction": "Create a seamless base using full-coverage HD foundation and set with translucent powder.",
                "products": ["HD Liquid Foundation", "Translucent Setting Powder"]
            },
            {
                "step_number": 2,
                "title": "Shimmering Bridal Eyes",
                "instruction": "Apply champagne shimmer all over the eyelid and blend a warm brown into the crease.",
                "products": ["Champagne Shimmer Eyeshadow", "Blending Brush"]
            },
            {
                "step_number": 3,
                "title": "Longwear Lips & Setting",
                "instruction": "Apply a berry mauve long-lasting lip shade and mist the face with setting spray.",
                "products": ["Longwear Lipstick (Berry Mauve)", "Lock-in Setting Spray"]
            }
        ]
    },
    {
        "id": "party_makeup",
        "name": "Party Makeup",
        "description": "Fun, high-energy look with shimmering elements and high-shine highlights.",
        "time_estimate": "45-60 min",
        "coverage": "Medium Coverage",
        "long_description": "A fun and sparkling look with glittery lids, bold pink lip, and bright rose highlights.",
        "category": "Glam",
        "suitable_face_shapes": ["Oval", "Round", "Diamond", "Heart"],
        "suitable_skin_tones": ["Fair", "Light", "Medium", "Tan", "Deep"],
        "suitable_undertones": ["Warm", "Cool", "Neutral", "Olive"],
        "products": {
            "lipstick": ["Berry Pink", "Coral Pink", "Vibrant Red"],
            "blush": ["Dusty Mauve", "Warm Apricot"],
            "eyeshadow": ["Silver", "Copper Shimmer", "Glitter Gold"]
        },
        "steps": [
            {
                "step_number": 1,
                "title": "Glowy Base Prep",
                "instruction": "Prep skin with a hydrating primer and apply a luminous foundation.",
                "products": ["Luminous Foundation", "Hydrating Primer"]
            },
            {
                "step_number": 2,
                "title": "Gold Glitter Eyes",
                "instruction": "Pack gold glitter or copper shimmer on the center of the eyelids for a sparkling look.",
                "products": ["Glitter Eyeshadow (Gold)", "Flat Shader Brush"]
            },
            {
                "step_number": 3,
                "title": "High Shine Highlights",
                "instruction": "Apply pressed highlight powder generously to high points of cheekbones and a swipe of berry pink lip.",
                "products": ["Pressed Highlighter (Rose Gold)", "Berry Pink Lipstick"]
            }
        ]
    },
    {
        "id": "engagement_makeup",
        "name": "Engagement Makeup",
        "description": "Modern look combining romantic rose gold and soft pink flushes.",
        "time_estimate": "45-60 min",
        "coverage": "Medium Coverage",
        "long_description": "A balanced, romantic look combining soft rose gold shadows, a natural pink flush, and clean brow arches.",
        "category": "Bridal",
        "suitable_face_shapes": ["Oval", "Heart", "Rectangle", "Square", "Diamond", "Round"],
        "suitable_skin_tones": ["Fair", "Light", "Medium", "Tan", "Deep"],
        "suitable_undertones": ["Warm", "Cool", "Neutral", "Olive"],
        "products": {
            "lipstick": ["Dusty Rose", "Peach Nude", "Soft Plum"],
            "blush": ["Rose-Pink", "Soft Apricot"],
            "eyeshadow": ["Rose Gold", "Warm Taupe", "Bronze"]
        },
        "steps": [
            {
                "step_number": 1,
                "title": "Satin Skin Setup",
                "instruction": "Apply a skin-perfecting primer and hydrating foundation for a satin finish.",
                "products": ["Hydrating Foundation", "Sponge Blender"]
            },
            {
                "step_number": 2,
                "title": "Rose Gold Eyes",
                "instruction": "Blend rose gold shadow on the lid with a warm taupe crease to add depth.",
                "products": ["Rose Gold Eyeshadow", "Warm Taupe Eyeshadow"]
            },
            {
                "step_number": 3,
                "title": "Satin Pink Blush & Lip",
                "instruction": "Blend a dusty pink blush on the cheeks and swipe a comfortable dusty rose liquid lip.",
                "products": ["Rose-Pink Blush", "Dusty Rose Liquid Lipstick"]
            }
        ]
    }
]


def seed_looks(db: Session) -> None:
    """Seeds the look library into the SQL database if they do not exist."""
    for item in SEED_LOOKS:
        existing = db.query(LookModel).filter(LookModel.id == item["id"]).first()
        if not existing:
            db_look = LookModel(
                id=item["id"],
                name=item["name"],
                description=item["description"],
                time_estimate=item["time_estimate"],
                coverage=item["coverage"],
                long_description=item["long_description"],
                category=item["category"],
                suitable_face_shapes=item["suitable_face_shapes"],
                suitable_skin_tones=item["suitable_skin_tones"],
                suitable_undertones=item["suitable_undertones"],
                products=item["products"],
                steps=item["steps"]
            )
            db.add(db_look)
    db.commit()

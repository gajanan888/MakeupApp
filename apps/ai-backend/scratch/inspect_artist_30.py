import sys
import os
import math
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal
from app.models.portfolio_embedding import PortfolioEmbeddingModel
from sqlalchemy import text

def inspect():
    db = SessionLocal()
    try:
        # Let's check all embeddings of Artist 30
        res = db.query(PortfolioEmbeddingModel).filter(PortfolioEmbeddingModel.artist_id == 30).all()
        print(f"Total embeddings for Artist 30: {len(res)}")
        for item in res:
            print("-" * 60)
            print(f"ID: {item.id} | Occasion: {item.occasion} | Outfit: {item.outfit}")
            print(f"Image URL: {item.image_url}")
            print(f"Makeup Style: {item.makeup_style}")
            print(f"Jewelry: {item.jewelry}")
            print(f"Hairstyle: {item.hairstyle}")
            print(f"Feature Vector Keys: {list(item.feature_vector.keys()) if item.feature_vector else 'None'}")
            if item.feature_vector:
                print(f"Clothing Hex: {item.feature_vector.get('clothing_hex')}")
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    inspect()

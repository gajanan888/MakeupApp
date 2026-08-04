import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal
from app.models.beauty import ArtistPortfolioModel

def test():
    db = SessionLocal()
    try:
        p = db.query(ArtistPortfolioModel).first()
        print("Model object attributes:")
        print("ID:", p.id)
        print("artistId:", p.artistId)
        print("beforeImageUrl:", getattr(p, "beforeImageUrl", "Attribute missing"))
        print("afterImageUrl:", getattr(p, "afterImageUrl", "Attribute missing"))
        print("tag:", p.tag)
        
        # Print dictionary mapping
        print("Dict:", p.__dict__)
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    test()

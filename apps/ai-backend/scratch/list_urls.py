import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal
from app.models.beauty import ArtistPortfolioModel

def check():
    db = SessionLocal()
    items = db.query(ArtistPortfolioModel).limit(15).all()
    for i, item in enumerate(items):
        print(f"Index {i} | ID: {item.id} | Before: {item.beforeImageUrl} | After: {item.afterImageUrl}")
    db.close()

if __name__ == "__main__":
    check()

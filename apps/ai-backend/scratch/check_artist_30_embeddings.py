import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal
from sqlalchemy import text

def check():
    db = SessionLocal()
    try:
        res = db.execute(text('SELECT id, occasion, outfit, image_url FROM artist_portfolio_embeddings WHERE artist_id = 30;')).fetchall()
        print("Embeddings for Artist 30:")
        for r in res:
            print(f"ID: {r[0]} | Occasion: {r[1]} | Outfit: {r[2]} | URL: {r[3]}")
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    check()

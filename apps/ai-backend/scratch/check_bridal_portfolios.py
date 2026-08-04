import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal
from sqlalchemy import text

def check():
    db = SessionLocal()
    try:
        res = db.execute(text('SELECT id, artist_id, portfolio_image_id, occasion, image_url FROM artist_portfolio_embeddings WHERE occasion = \'Bridal\';')).fetchall()
        print("Bridal Portfolios in Database:")
        for r in res:
            print(f"ID: {r[0]} | Artist ID: {r[1]} | Portfolio ID: {r[2]} | Occasion: {r[3]} | URL: {r[4]}")
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    check()

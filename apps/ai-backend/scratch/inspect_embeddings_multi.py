import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal
from sqlalchemy import text

def check():
    db = SessionLocal()
    try:
        res = db.execute(text("SELECT id, artist_id, portfolio_image_id, image_url, face_bbox FROM artist_portfolio_embeddings LIMIT 5;")).fetchall()
        for row in res:
            print(f"ID: {row[0]} | Artist: {row[1]} | PortfolioImgID: {row[2]} | Face BBox: {row[4]} | URL: {row[3]}")
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    check()

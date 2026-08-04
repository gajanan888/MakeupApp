import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal
from sqlalchemy import text

def check():
    db = SessionLocal()
    try:
        res = db.execute(text("SELECT id, artist_id, portfolio_image_id, image_url, image_type, face_bbox, created_at FROM artist_portfolio_embeddings LIMIT 1;")).fetchone()
        print("Sample Record:")
        if res:
            print("ID:", res[0])
            print("Artist ID:", res[1])
            print("Portfolio Image ID:", res[2])
            print("Image URL:", res[3])
            print("Image Type:", res[4])
            print("Face BBox:", res[5])
            print("Created At:", res[6])
        else:
            print("No records found!")
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    check()

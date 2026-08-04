import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal
from sqlalchemy import text

def check():
    db = SessionLocal()
    try:
        res = db.execute(text('SELECT id, tag, description, "afterImageUrl" FROM "ArtistPortfolios" LIMIT 25;')).fetchall()
        for row in res:
            print(f"ID: {row[0]} | Tag: {row[1]} | Desc: {row[2]} | Image: {row[3]}")
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    check()

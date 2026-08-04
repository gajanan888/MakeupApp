import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal
from sqlalchemy import text

def check():
    db = SessionLocal()
    try:
        res = db.execute(text('SELECT id, tag, "artistId" FROM "ArtistPortfolios" WHERE id = 652;')).fetchone()
        if res:
            print(f"Portfolio ID: {res[0]} | Tag: {res[1]} | Artist ID: {res[2]}")
        else:
            print("Portfolio ID 652 not found!")
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    check()

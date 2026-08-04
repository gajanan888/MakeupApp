import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal
from sqlalchemy import text

def check():
    db = SessionLocal()
    try:
        res = db.execute(text('SELECT "artistId", COUNT(*) FROM "ArtistPortfolios" GROUP BY "artistId";')).fetchall()
        print("Unique Artists and Portfolio Counts:")
        for r in res:
            print(f"Artist ID: {r[0]} | Portfolio Count: {r[1]}")
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    check()

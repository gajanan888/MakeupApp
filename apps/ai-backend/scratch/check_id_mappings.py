import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal
from sqlalchemy import text

def check():
    db = SessionLocal()
    try:
        res = db.execute(text('SELECT id, "artistId", tag FROM "ArtistPortfolios" WHERE id IN (513, 514, 515, 516);')).fetchall()
        for r in res:
            print(f"Portfolio ID: {r[0]} | Artist ID: {r[1]} | Tag: {r[2]}")
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    check()

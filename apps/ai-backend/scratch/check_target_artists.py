import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal
from sqlalchemy import text

def check():
    db = SessionLocal()
    try:
        # Check Artists
        artists = db.execute(text('SELECT id, name, "isVerified" FROM "Artists" WHERE id IN (31, 32);')).fetchall()
        print("Artists:")
        for a in artists:
            print(f"ID: {a[0]} | Name: {a[1]} | isVerified: {a[2]}")
            
        # Check ArtistProfiles
        profiles = db.execute(text('SELECT "artistId", rating, experience FROM "ArtistProfiles" WHERE "artistId" IN (31, 32);')).fetchall()
        print("Profiles:")
        for p in profiles:
            print(f"Artist ID: {p[0]} | Rating: {p[1]} | Experience: {p[2]}")
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    check()

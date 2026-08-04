import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal
from sqlalchemy import text

def update():
    db = SessionLocal()
    try:
        # Update Portfolio ID 652 to be tagged as 'Bridal'
        print("Updating Portfolio ID 652 tag to 'Bridal'...")
        db.execute(text('UPDATE "ArtistPortfolios" SET tag = \'Bridal\' WHERE id = 652;'))
        db.commit()
        print("Updated successfully!")
    except Exception as e:
        print("Error during update:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update()

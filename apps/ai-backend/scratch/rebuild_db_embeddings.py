import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal
from sqlalchemy import text
from app.scripts.sync_portfolio_embeddings import main as sync_main

def rebuild():
    db = SessionLocal()
    try:
        print("Truncating existing records in artist_portfolio_embeddings...")
        db.execute(text("TRUNCATE TABLE artist_portfolio_embeddings RESTART IDENTITY;"))
        db.commit()
        print("Truncation successful! Starting synchronization...")
    except Exception as e:
        print("Error truncating table:", e)
        db.rollback()
    finally:
        db.close()
        
    # Run the main sync script
    sync_main()

if __name__ == "__main__":
    rebuild()

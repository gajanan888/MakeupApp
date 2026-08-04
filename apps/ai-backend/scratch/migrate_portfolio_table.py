import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.database.session import SessionLocal

def migrate():
    db = SessionLocal()
    try:
        print("Executing migration statements on PostgreSQL...")
        
        # Add new columns to artist_portfolio_embeddings if they do not exist
        db.execute(text("ALTER TABLE artist_portfolio_embeddings ADD COLUMN IF NOT EXISTS occasion VARCHAR;"))
        db.execute(text("ALTER TABLE artist_portfolio_embeddings ADD COLUMN IF NOT EXISTS makeup_style JSONB;"))
        db.execute(text("ALTER TABLE artist_portfolio_embeddings ADD COLUMN IF NOT EXISTS hairstyle VARCHAR;"))
        db.execute(text("ALTER TABLE artist_portfolio_embeddings ADD COLUMN IF NOT EXISTS outfit VARCHAR;"))
        db.execute(text("ALTER TABLE artist_portfolio_embeddings ADD COLUMN IF NOT EXISTS jewelry JSONB;"))
        db.execute(text("ALTER TABLE artist_portfolio_embeddings ADD COLUMN IF NOT EXISTS skin_tone VARCHAR;"))
        db.execute(text("ALTER TABLE artist_portfolio_embeddings ADD COLUMN IF NOT EXISTS undertone VARCHAR;"))
        db.execute(text("ALTER TABLE artist_portfolio_embeddings ADD COLUMN IF NOT EXISTS face_shape VARCHAR;"))
        db.execute(text("ALTER TABLE artist_portfolio_embeddings ADD COLUMN IF NOT EXISTS feature_vector JSONB;"))
        
        db.commit()
        print("Migration executed successfully!")
        
    except Exception as e:
        print("Migration failed:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()

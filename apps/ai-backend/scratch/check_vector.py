import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.database.session import SessionLocal

def check():
    db = SessionLocal()
    try:
        # Enable vector extension
        db.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        db.commit()
        print("pgvector extension checked/enabled successfully!")
        
        # Check current tables
        result = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public';"))
        tables = [row[0] for row in result.fetchall()]
        print("Existing tables in public schema:", tables)
    except Exception as e:
        print("Error checking DB:", e)
    finally:
        db.close()

if __name__ == "__main__":
    check()

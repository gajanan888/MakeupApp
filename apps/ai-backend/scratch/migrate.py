from sqlalchemy import create_engine, text
from app.config.config import get_preview_settings

def migrate():
    settings = get_preview_settings()
    db_url = settings.database_url
    print("Connecting to database...")
    engine = create_engine(db_url)
    with engine.connect() as conn:
        print("Altering makeup_previews.prompt column to TEXT...")
        conn.execute(text("ALTER TABLE makeup_previews ALTER COLUMN prompt TYPE TEXT;"))
        conn.commit()
    print("Migration successful!")

if __name__ == "__main__":
    migrate()

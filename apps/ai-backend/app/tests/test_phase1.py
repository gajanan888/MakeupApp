import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.session import get_preview_db
from app.database.base import Base
from app.models.virtual_preview import ChatSessionModel
from app.vision.service import FaceVisionService
from app.parsing.service import FaceParsingService

# Setup SQLite in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Override the database dependency
def override_get_preview_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


# Mock FaceVisionService to avoid MediaPipe dependency in tests
class MockFaceVisionService:
    async def detect_landmarks(self, selfie):
        return {
            "face_detected": True,
            "landmark_count": 468,
            "landmarks": [{"index": i, "x": 0.5, "y": 0.5, "z": 0.0, "x_px": 100, "y_px": 100} for i in range(468)]
        }


# Mock FaceParsingService to avoid BiSeNet dependency in tests
class MockFaceParsingService:
    async def generate_masks(self, selfie, landmarks):
        return {
            "lip": "generated/masks/lip_stub.png",
            "eye": "generated/masks/eye_stub.png",
            "eyebrow": "generated/masks/eyebrow_stub.png",
            "hair": "generated/masks/hair_stub.png",
            "skin": "generated/masks/skin_stub.png",
            "cheek": "generated/masks/cheek_stub.png",
            "forehead": "generated/masks/forehead_stub.png",
            "jawline": "generated/masks/jawline_stub.png",
        }


app.dependency_overrides[get_preview_db] = override_get_preview_db
app.dependency_overrides[FaceVisionService] = MockFaceVisionService
app.dependency_overrides[FaceParsingService] = MockFaceParsingService

# Create the tables in the test database
Base.metadata.create_all(bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    # Recreate tables for each test to ensure isolation
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def test_upload_selfie() -> None:
    client = TestClient(app)
    
    # Create a mock image file
    file_data = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc`0\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
    
    response = client.post(
        "/api/v1/virtual-preview/upload",
        files={"file": ("test_selfie.png", io.BytesIO(file_data), "image/png")}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["filename"] == "test_selfie.png"
    assert "image_url" in data


def test_validate_image() -> None:
    client = TestClient(app)
    
    # 1. Upload
    file_data = b"fake_image_bytes"
    upload_resp = client.post(
        "/api/v1/virtual-preview/upload",
        files={"file": ("test_selfie.jpg", io.BytesIO(file_data), "image/jpeg")}
    )
    selfie_id = upload_resp.json()["id"]
    
    # 2. Validate
    response = client.post(
        "/api/v1/virtual-preview/validate-image",
        json={"selfie_id": selfie_id}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["selfie_id"] == selfie_id
    assert data["is_valid"] is True
    assert data["checks_passed"]["exactly_one_face"] is True


def test_analyze_face() -> None:
    client = TestClient(app)
    
    # 1. Upload
    file_data = b"fake_image_bytes"
    upload_resp = client.post(
        "/api/v1/virtual-preview/upload",
        files={"file": ("test_selfie.jpg", io.BytesIO(file_data), "image/jpeg")}
    )
    selfie_id = upload_resp.json()["id"]
    
    # 2. Validate (so it is marked as valid)
    client.post(
        "/api/v1/virtual-preview/validate-image",
        json={"selfie_id": selfie_id}
    )
    
    # 3. Analyze
    response = client.post(
        "/api/v1/virtual-preview/analyze-face",
        json={"selfie_id": selfie_id}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["selfie_id"] == selfie_id
    assert "landmarks" in data
    assert "masks" in data
    assert data["masks"]["lip"] is not None


def test_chat_flow() -> None:
    client = TestClient(app)
    
    # 1. Upload
    file_data = b"fake_image_bytes"
    upload_resp = client.post(
        "/api/v1/virtual-preview/upload",
        files={"file": ("test_selfie.jpg", io.BytesIO(file_data), "image/jpeg")}
    )
    selfie_id = upload_resp.json()["id"]
    
    # 2. Start chat
    response = client.post(
        "/api/v1/virtual-preview/chat",
        json={"selfie_id": selfie_id, "message": "Hello"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "chat_session_id" in data
    assert "reply" in data
    assert data["is_complete"] is False
    
    chat_session_id = data["chat_session_id"]
    
    # 3. Next turn
    response2 = client.post(
        "/api/v1/virtual-preview/chat",
        json={"chat_session_id": chat_session_id, "message": "Wedding"}
    )
    assert response2.status_code == 200
    assert response2.json()["chat_session_id"] == chat_session_id


def test_generate_prompt_pre_complete() -> None:
    client = TestClient(app)
    
    # 1. Upload
    file_data = b"fake_image_bytes"
    upload_resp = client.post(
        "/api/v1/virtual-preview/upload",
        files={"file": ("test_selfie.jpg", io.BytesIO(file_data), "image/jpeg")}
    )
    selfie_id = upload_resp.json()["id"]
    
    # 2. Start chat
    chat_resp = client.post(
        "/api/v1/virtual-preview/chat",
        json={"selfie_id": selfie_id, "message": "Hello"}
    )
    chat_session_id = chat_resp.json()["chat_session_id"]
    
    # 3. Attempt prompt generation (should fail since session not complete)
    response = client.post(
        "/api/v1/virtual-preview/generate-prompt",
        json={"chat_session_id": chat_session_id}
    )
    assert response.status_code == 400
    assert "not complete" in response.json()["detail"]


def test_generate_prompt_completed() -> None:
    # Set up session in DB as completed
    db = next(override_get_preview_db())
    
    # 1. Create selfie
    client = TestClient(app)
    file_data = b"fake_image_bytes"
    upload_resp = client.post(
        "/api/v1/virtual-preview/upload",
        files={"file": ("test_selfie.jpg", io.BytesIO(file_data), "image/jpeg")}
    )
    selfie_id = upload_resp.json()["id"]
    
    # 2. Create completed session in DB
    session = ChatSessionModel(
        selfie_id=selfie_id,
        is_complete=True,
        preferences={
            "event": "Wedding",
            "style": "Bridal",
            "eye_makeup": "Gold Shimmer",
            "lipstick": "Red",
            "foundation": "Dewy",
            "blush": "Pink",
            "contour": "Light",
            "highlight": "Gold",
            "hairstyle": "High Bun",
            "jewellery": "Heavy Bridal"
        }
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # 3. Call endpoint
    response = client.post(
        "/api/v1/virtual-preview/generate-prompt",
        json={"chat_session_id": session.id}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["chat_session_id"] == session.id
    assert "prompt" in data
    assert "Bridal" in data["prompt"]


def test_generate_preview_and_get() -> None:
    client = TestClient(app)
    
    # 1. Upload
    file_data = b"fake_image_bytes"
    upload_resp = client.post(
        "/api/v1/virtual-preview/upload",
        files={"file": ("test_selfie.jpg", io.BytesIO(file_data), "image/jpeg")}
    )
    selfie_id = upload_resp.json()["id"]
    
    # 2. Validate
    client.post(
        "/api/v1/virtual-preview/validate-image",
        json={"selfie_id": selfie_id}
    )
    
    # 3. Analyze
    client.post(
        "/api/v1/virtual-preview/analyze-face",
        json={"selfie_id": selfie_id}
    )
    
    # 4. Generate preview (using a mock prompt)
    response = client.post(
        "/api/v1/virtual-preview/generate-preview",
        json={
            "selfie_id": selfie_id,
            "prompt": "Apply soft pink lipstick and natural foundation.",
        }
    )
    
    assert response.status_code == 201
    preview_data = response.json()
    assert "id" in preview_data
    assert preview_data["selfie_id"] == selfie_id
    assert "edited_image_url" in preview_data
    
    preview_id = preview_data["id"]
    
    # 5. Get preview
    get_resp = client.get(f"/api/v1/virtual-preview/preview/{preview_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == preview_id

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base


class SelfieModel(Base):
    __tablename__ = "selfies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    image_url = Column(String(512), nullable=True)
    is_valid = Column(Boolean, nullable=True)
    validation_error = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    face_analysis = relationship("FaceAnalysisModel", uselist=False, back_populates="selfie", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSessionModel", back_populates="selfie", cascade="all, delete-orphan")
    previews = relationship("MakeupPreviewModel", back_populates="selfie", cascade="all, delete-orphan")


class FaceAnalysisModel(Base):
    __tablename__ = "face_analyses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    selfie_id = Column(String(36), ForeignKey("selfies.id", ondelete="CASCADE"), nullable=False, unique=True)
    landmarks = Column(JSON, nullable=True)  # Stores facial landmarks coordinate map
    
    # Paths or URLs to separated masks
    lip_mask_path = Column(String(512), nullable=True)
    eye_mask_path = Column(String(512), nullable=True)
    eyebrow_mask_path = Column(String(512), nullable=True)
    hair_mask_path = Column(String(512), nullable=True)
    skin_mask_path = Column(String(512), nullable=True)
    cheek_mask_path = Column(String(512), nullable=True)
    forehead_mask_path = Column(String(512), nullable=True)
    jawline_mask_path = Column(String(512), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    selfie = relationship("SelfieModel", back_populates="face_analysis")


class ChatSessionModel(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    selfie_id = Column(String(36), ForeignKey("selfies.id", ondelete="CASCADE"), nullable=False)
    history = Column(JSON, default=list, nullable=False)  # List of message dicts: [{"role": "user"/"model", "content": "..."}]
    preferences = Column(JSON, nullable=True)  # Final structured preferences JSON
    is_complete = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    selfie = relationship("SelfieModel", back_populates="chat_sessions")
    previews = relationship("MakeupPreviewModel", back_populates="chat_session", cascade="all, delete-orphan")


class MakeupPreviewModel(Base):
    __tablename__ = "makeup_previews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    selfie_id = Column(String(36), ForeignKey("selfies.id", ondelete="CASCADE"), nullable=False)
    chat_session_id = Column(String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=True)
    prompt = Column(String(1024), nullable=True)
    edited_image_url = Column(String(512), nullable=True)
    quality_score = Column(Float, nullable=True)
    is_approved = Column(Boolean, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    selfie = relationship("SelfieModel", back_populates="previews")
    chat_session = relationship("ChatSessionModel", back_populates="previews")

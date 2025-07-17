from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from ..database import Base

class ChatMode:
    SOLUTION_GUIDE = "solution_guide"
    FREE_WHEELIN = "free_wheelin"
    ASKBILL_DIRECT = "askbill_direct"

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(255), default="New conversation")
    mode = Column(String(50), default=ChatMode.SOLUTION_GUIDE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="chat_session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("chat_sessions.id"))
    role = Column(String(50))  # 'user' or 'assistant'
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    sources = Column(JSON, nullable=True)  # For storing source documents/references
    is_error = Column(Boolean, default=False)

    # Relationships
    chat_session = relationship("ChatSession", back_populates="messages") 
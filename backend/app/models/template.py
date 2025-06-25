from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base

class TemplateType(str, enum.Enum):
    FORMAT = "format"      # Template with instructions for AI to generate content
    KNOWLEDGE = "knowledge"  # Template with embedded product knowledge

class Template(Base):
    __tablename__ = "templates"
    
    id = Column(String, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    template_type = Column(Enum(TemplateType), default=TemplateType.FORMAT, nullable=False)
    tags = Column(Text, nullable=True)  # JSON string for tags array
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_modified = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to user
    user = relationship("User", back_populates="templates")
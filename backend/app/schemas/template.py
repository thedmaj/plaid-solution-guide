from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

class TemplateType(str, Enum):
    FORMAT = "format"
    KNOWLEDGE = "knowledge"

class TemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    content: str
    template_type: Optional[TemplateType] = TemplateType.FORMAT
    tags: Optional[List[str]] = []

class TemplateCreate(TemplateBase):
    pass

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    template_type: Optional[TemplateType] = None
    tags: Optional[List[str]] = None

class Template(TemplateBase):
    id: str
    user_id: int
    created_at: datetime
    last_modified: datetime
    
    class Config:
        from_attributes = True

class TemplateResponse(BaseModel):
    templates: List[Template]
    total: int
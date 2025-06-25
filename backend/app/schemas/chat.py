from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from ..models.chat import ChatMode

class ChatSessionBase(BaseModel):
    title: Optional[str] = None
    mode: str = ChatMode.SOLUTION_GUIDE

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSessionResponse(ChatSessionBase):
    id: str
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatMessageBase(BaseModel):
    id: Optional[str] = None
    role: str
    content: str
    timestamp: datetime
    sources: Optional[List[Dict[str, Any]]] = None
    is_error: bool = False

class ChatMessageCreate(BaseModel):
    session_id: str
    message: str
    previous_messages: Optional[List[Dict[str, Any]]] = None

class ChatMessageResponse(ChatMessageBase):
    id: str
    session_id: str

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    messages: List[Dict[str, Any]] 
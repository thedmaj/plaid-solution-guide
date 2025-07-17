from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
import logging
import json
import os
import asyncio

from ..database import get_db
from ..models.chat import ChatSession, ChatMessage, ChatMode
from ..models.user import User
from ..auth import get_current_user
from ..schemas.chat import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatResponse
)
from ..utils.claude import query_claude
from ..utils.title_generator import generate_session_title

# Import models from main.py for the stream endpoint
from pydantic import BaseModel
from typing import Dict, Any

class Message(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str
    sender: Optional[str] = None
    sources: Optional[List[Dict[str, Any]]] = None

class ChatRequest(BaseModel):
    session_id: str
    message: str
    previous_messages: List[Message] = []
    mode: Optional[str] = "solution_guide"
    selected_template: Optional[Dict[str, Any]] = None  # Template information from frontend

# Import AskBill client
try:
    from bill_client import AskBillClient
    ask_bill_client = AskBillClient()
    logger = logging.getLogger(__name__)
    logger.info("Successfully initialized AskBill client in chat router")
except Exception as e:
    logger = logging.getLogger(__name__)
    logger.warning(f"Failed to initialize AskBill client in chat router: {e}")
    ask_bill_client = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/chat",
    tags=["chat"]
)

def _detect_knowledge_template_usage(message: str) -> bool:
    """
    Detect if a message was processed by a Knowledge Template
    Knowledge Templates include this marker text in the processed message
    """
    knowledge_markers = [
        "IMPORTANT: Use the following expert knowledge as your PRIMARY source",
        "Expert Knowledge Template:",
        "AI Instructions for customizable sections:"
    ]
    
    return any(marker in message for marker in knowledge_markers)

async def query_mcp_server(question: str):
    """Query the AskBill MCP server for documentation."""
    logger.info(f"🔍 DEBUG: query_mcp_server called with question: {question}")
    logger.info(f"🔍 DEBUG: ask_bill_client in query_mcp_server is None? {ask_bill_client is None}")
    
    if ask_bill_client is None:
        logger.warning("AskBill client not available in query_mcp_server")
        return {
            "answer": "Documentation service is currently unavailable.",
            "sources": []
        }
        
    try:
        logger.info(f"🔍 DEBUG: About to call ask_bill_client.ask_question")
        logger.info(f"Querying MCP server with question: {question}")
        response = await ask_bill_client.ask_question(question)
        logger.info(f"🔍 DEBUG: Received response from MCP server: {response}")
        
        # Log the raw response from AskBill before any processing
        logger.info("🔍 QUERY_MCP_SERVER: RAW ASKBILL RESPONSE:")
        logger.info(f"Answer length: {len(response.get('answer', ''))}")
        logger.info(f"Sources count: {len(response.get('sources', []))}")
        logger.info(f"Raw answer: {response.get('answer', '')[:500]}...")  # First 500 chars
        
        # Enhanced URL validation using Plaid API index
        if response and response.get("answer"):
            try:
                from enhanced_url_validator import enhance_askbill_response_with_api_index
                
                enhanced_answer, enhanced_stats = await enhance_askbill_response_with_api_index(
                    response["answer"]
                )
                
                if enhanced_stats["enhanced_urls"] > 0 or enhanced_stats["field_specific_urls"] > 0:
                    logger.info(f"🔗 Enhanced URL validation completed: {enhanced_stats}")
                    response["answer"] = enhanced_answer
                    response["url_validation"] = enhanced_stats
                
            except Exception as e:
                logger.warning(f"Enhanced URL validation failed, falling back to basic validation: {e}")
                # Fall back to basic URL validation
                try:
                    from url_validator import process_askbill_response
                    import anthropic
                    
                    anthropic_client = None
                    api_key = os.getenv("ANTHROPIC_API_KEY")
                    if api_key:
                        anthropic_client = anthropic.Anthropic(api_key=api_key)
                    
                    corrected_answer, url_stats = await process_askbill_response(
                        response["answer"], 
                        anthropic_client
                    )
                    
                    if url_stats["corrected_urls"] > 0:
                        logger.info(f"🔗 Basic URL validation completed: {url_stats}")
                        response["answer"] = corrected_answer
                        response["url_validation"] = url_stats
                    
                except Exception as e2:
                    logger.warning(f"Both enhanced and basic URL validation failed: {e2}")
        
        return response
    except Exception as e:
        logger.error(f"Error querying MCP server: {e}", exc_info=True)
        return {
            "answer": "Error accessing documentation service.",
            "sources": []
        }

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all chat sessions for the current user."""
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.updated_at.desc()).all()
    return sessions

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chat session for the current user with the specified mode."""
    # Validate mode
    valid_modes = [ChatMode.SOLUTION_GUIDE, ChatMode.FREE_WHEELIN, ChatMode.ASKBILL_DIRECT]
    if session_data.mode not in valid_modes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid mode. Must be one of: {valid_modes}"
        )

    session = ChatSession(
        user_id=current_user.id,
        title="New conversation",
        mode=session_data.mode,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions/{session_id}", response_model=List[ChatMessageResponse])
async def get_chat_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all messages for a specific chat session."""
    logger.info(f"📨 Getting messages for session: {session_id}, user: {current_user.id}")
    
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        logger.warning(f"📨 Session not found: {session_id} for user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.timestamp.asc()).all()
    
    logger.info(f"📨 Found {len(messages)} messages for session {session_id}")
    for i, msg in enumerate(messages):
        logger.info(f"📨 Message {i+1}: {msg.role} - {msg.content[:50]}... at {msg.timestamp}")
    
    return messages

@router.put("/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_chat_session(
    session_id: str,
    title: Optional[str] = None,
    mode: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a chat session's title and/or mode."""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    # Update title if provided
    if title is not None:
        session.title = title
    
    # Update mode if provided
    if mode is not None:
        valid_modes = [ChatMode.SOLUTION_GUIDE, ChatMode.FREE_WHEELIN, ChatMode.ASKBILL_DIRECT]
        if mode not in valid_modes:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid mode. Must be one of: {valid_modes}"
            )
        session.mode = mode
    
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session

@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a chat session and all its messages."""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    db.delete(session)
    db.commit()
    return {"status": "success", "message": "Chat session deleted"}

@router.post("", response_model=ChatResponse)
async def send_message(
    message: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message and get a response from the assistant."""
    logger.info(f"Received chat message request for session {message.session_id}")
    logger.info(f"Message content: {message.message}")
    logger.info(f"Previous messages count: {len(message.previous_messages) if message.previous_messages else 0}")
    
    # Verify session exists and belongs to user
    session = db.query(ChatSession).filter(
        ChatSession.id == message.session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        logger.error(f"Chat session {message.session_id} not found for user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    logger.info(f"Found chat session {session.id} with title: {session.title}")
    
    # Create user message
    user_message = ChatMessage(
        session_id=message.session_id,
        role="user",
        content=message.message,
        timestamp=datetime.utcnow()
    )
    db.add(user_message)
    logger.info(f"Created user message with content: {message.message[:100]}...")
    
    # Get assistant response
    try:
        # Log previous messages for debugging
        if message.previous_messages:
            logger.info("Previous messages context:")
            for idx, msg in enumerate(message.previous_messages):
                logger.info(f"Message {idx + 1}: Role={msg.get('role')}, Content={msg.get('content', '')[:100]}...")
        else:
            logger.info("No previous messages found")
        
        # Prepare the conversation history for Claude
        conversation_history = []
        if message.previous_messages:
            conversation_history = [
                {
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", ""),
                    "timestamp": msg.get("timestamp", datetime.utcnow().isoformat())
                }
                for msg in message.previous_messages
            ]
        
        # Add the current message to the history
        conversation_history.append({
            "role": "user",
            "content": message.message,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        logger.info(f"Prepared conversation history with {len(conversation_history)} messages")
        
        # Load Claude configuration
        try:
            config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'claude_config.json')
            with open(config_path, 'r') as f:
                claude_config = json.load(f)
            system_prompt = claude_config.get("system_prompt")
        except Exception as e:
            logger.error(f"Error loading Claude config: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI service configuration error"
            )
        
        # Query Claude with the conversation history and system prompt
        claude_response = await query_claude(conversation_history, system_prompt)
        response_content = claude_response.get("completion", "")
        
        logger.info(f"Received Claude response: {response_content[:100]}...")
        
        assistant_message = ChatMessage(
            session_id=message.session_id,
            role="assistant",
            content=response_content,
            timestamp=datetime.utcnow()
        )
        db.add(assistant_message)
        logger.info("Created assistant response message")
        
        # Update session timestamp
        session.updated_at = datetime.utcnow()
        
        # Auto-generate intelligent title if this is the first exchange or session has default title
        if session.title == "New conversation" or len(conversation_history) <= 2:
            try:
                # Get all messages for this session for title generation
                session_messages = db.query(ChatMessage).filter(
                    ChatMessage.session_id == session.id
                ).order_by(ChatMessage.timestamp.asc()).all()
                
                # Convert to format expected by title generator
                messages_for_title = [
                    {"role": msg.role, "content": msg.content} 
                    for msg in session_messages
                ] + [
                    {"role": "user", "content": user_message.content},
                    {"role": "assistant", "content": assistant_message.content}
                ]
                
                new_title = generate_session_title(messages_for_title)
                logger.info(f"Generated title: '{new_title}' for session {session.id}")
                
                if new_title and new_title != "New Conversation":
                    session.title = new_title
                    logger.info(f"Updated session title to: {new_title}")
                
            except Exception as e:
                logger.error(f"Error generating session title: {e}")
                # Don't fail the request if title generation fails
        
        db.commit()
        db.refresh(user_message)
        db.refresh(assistant_message)
        logger.info("Successfully committed messages to database")
        
        # Refresh session to get updated title
        db.refresh(session)
        
        return {
            "messages": [
                {
                    "role": "user",
                    "content": user_message.content,
                    "timestamp": user_message.timestamp.isoformat()
                },
                {
                    "role": "assistant",
                    "content": assistant_message.content,
                    "timestamp": assistant_message.timestamp.isoformat(),
                    "sources": assistant_message.sources
                }
            ],
            "session": {
                "id": session.id,
                "title": session.title,
                "updated_at": session.updated_at.isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error processing chat message: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stream chat responses using AskBill + Claude enhancement or Knowledge Templates"""
    try:
        logger.info(f"Starting chat stream for session {request.session_id}")
        
        # Verify session exists and belongs to user
        session = db.query(ChatSession).filter(
            ChatSession.id == request.session_id,
            ChatSession.user_id == current_user.id
        ).first()
        
        if not session:
            logger.error(f"Chat session {request.session_id} not found for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        logger.info(f"Found chat session {session.id} with title: {session.title}")
        
        # Create user message
        user_message = ChatMessage(
            session_id=request.session_id,
            role="user",
            content=request.message,
            timestamp=datetime.utcnow()
        )
        db.add(user_message)
        logger.info(f"Created user message with content: {request.message[:100]}...")
        
        # Step 0: Check if Knowledge Template is selected (bypass AskBill)
        # NEW: Check selected template type directly from frontend
        is_knowledge_template = False
        if request.selected_template and request.selected_template.get("template_type") == "knowledge":
            is_knowledge_template = True
            logger.info(f"🧠 Knowledge Template selected: {request.selected_template.get('name')}")
        else:
            # Fallback: Check message content for processed template markers
            is_knowledge_template = _detect_knowledge_template_usage(request.message)
            if is_knowledge_template:
                logger.info(f"🧠 Knowledge Template detected via message content")
        
        logger.info(f"🧠 Final Knowledge Template decision: {is_knowledge_template}")
        if request.selected_template:
            logger.info(f"🧠 Selected template: {request.selected_template.get('name')} (type: {request.selected_template.get('template_type')})")
        else:
            logger.info(f"🧠 No template selected by user")
        
        # Step 1: Query AskBill for current Plaid documentation (unless Knowledge Template)
        askbill_response = ""
        askbill_used = False
        
        # Check if we're in ASKBILL_DIRECT mode
        is_askbill_direct = (request.mode == ChatMode.ASKBILL_DIRECT)
        
        # DEBUG: Log the current mode being used
        logger.info(f"🔍 DEBUG: Chat mode: {request.mode}")
        logger.info(f"🔍 DEBUG: is_askbill_direct: {is_askbill_direct}")
        logger.info(f"🔍 DEBUG: is_knowledge_template: {is_knowledge_template}")
        
        if not is_knowledge_template and ask_bill_client is not None:
            try:
                logger.info(f"🔍 Step 1: Querying AskBill with user message: {request.message}")
                logger.info(f"🔍 DEBUG: About to call query_mcp_server")
                
                askbill_result = await asyncio.wait_for(
                    query_mcp_server(request.message), 
                    timeout=45.0  # Increased from 15s to 45s for longer responses
                )
                
                logger.info(f"🔍 DEBUG: askbill_result = {askbill_result}")
                
                if askbill_result and askbill_result.get("answer"):
                    askbill_response = askbill_result["answer"]
                    askbill_used = True
                    
                    # Check if this is a partial response
                    if askbill_result.get("partial_response"):
                        logger.warning(f"⚠️ Step 1 Partial: Retrieved {len(askbill_response)} chars from AskBill (PARTIAL)")
                        logger.warning(f"⚠️ Timeout reason: {askbill_result.get('timeout_reason', 'Unknown')}")
                    else:
                        logger.info(f"✅ Step 1 Complete: Retrieved {len(askbill_response)} chars from AskBill")
                    
                    # DEBUG: Log the raw plaid_docs response for debugging
                    logger.info("=" * 80)
                    logger.info("🔍 DEBUG: RAW PLAID_DOCS RESPONSE FROM ASKBILL:")
                    logger.info("=" * 80)
                    logger.info(askbill_response)
                    logger.info("=" * 80)
                    logger.info("🔍 END RAW PLAID_DOCS RESPONSE")
                    logger.info("=" * 80)
                else:
                    logger.warning("⚠️ No response from AskBill")
                    
            except asyncio.TimeoutError:
                logger.warning("⏱️ AskBill query timed out")
            except Exception as e:
                logger.error(f"❌ Error querying AskBill: {e}", exc_info=True)
        elif is_knowledge_template:
            logger.info("🧠 Bypassing AskBill: Knowledge Template detected")
        else:
            logger.warning("⚠️ AskBill client not available")
        
        # Step 2: Prepare enhanced message for Claude
        messages = []
        if hasattr(request, 'previous_messages') and request.previous_messages:
            messages.extend([{
                "role": msg.role,
                "content": msg.content
            } for msg in request.previous_messages])
        
        # Create enhanced message based on template type
        if is_askbill_direct:
            # For ASKBILL_DIRECT mode, pass the user message directly with AskBill response
            if askbill_response:
                enhanced_message = askbill_response
                logger.info("🎯 Using ASKBILL_DIRECT mode: Passing AskBill response directly")
            else:
                enhanced_message = request.message
                logger.info("🎯 Using ASKBILL_DIRECT mode: No AskBill response, using user message")
        elif is_knowledge_template:
            # For Knowledge Templates, use the message as-is (already processed by frontend)
            enhanced_message = request.message
            logger.info("🧠 Using Knowledge Template: Message used as-is")
        elif askbill_response:
            # Standard AskBill + Claude flow
            enhanced_message = f"""USER REQUEST: {request.message}

PLAID DOCUMENTATION CONTEXT (from AskBill):
{askbill_response}

TASK: Using the above Plaid documentation, create a comprehensive solution guide that addresses the user's request. Format it properly with headers, code examples, API details, and implementation steps."""
        else:
            # Fallback when no AskBill response
            enhanced_message = f"""USER REQUEST: {request.message}

TASK: Create a comprehensive solution guide for the above request using your knowledge of Plaid APIs and best practices."""
        
        messages.append({
            "role": "user", 
            "content": enhanced_message
        })
        
        # DEBUG: Log the enhanced message that gets sent to Claude
        logger.info("=" * 80)
        logger.info("🔍 DEBUG: ENHANCED MESSAGE SENT TO CLAUDE:")
        logger.info("=" * 80)
        logger.info(enhanced_message)
        logger.info("=" * 80)
        logger.info("🔍 END ENHANCED MESSAGE")
        logger.info("=" * 80)
        
        # Additional logging for AskBill Direct mode
        if is_askbill_direct:
            logger.info("🎯 ASKBILL_DIRECT MODE: Comparison of data flow:")
            logger.info(f"  - AskBill response length: {len(askbill_response)} chars")
            logger.info(f"  - Enhanced message length: {len(enhanced_message)} chars")
            logger.info(f"  - Are they the same? {askbill_response == enhanced_message}")
            if askbill_response != enhanced_message:
                logger.warning("⚠️ AskBill response differs from enhanced message!")
        
        # Step 3: Get complete response from Claude 
        logger.info("🔄 Querying Claude with enhanced message")
        
        # Load and customize system prompt based on template type
        try:
            config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'claude_config.json')
            with open(config_path, 'r') as f:
                claude_config = json.load(f)
            base_system_prompt = claude_config.get("system_prompt")
        except Exception as e:
            logger.error(f"Error loading Claude config: {str(e)}")
            base_system_prompt = None

        if is_askbill_direct:
            # For ASKBILL_DIRECT mode, use the direct wrapper system prompt
            system_prompt = """You are a thin wrapper around the plaid_docs MCP tool. Your ONLY job is to:

1. Take the EXACT response from plaid_docs
2. Format it in Markdown only - make NO other modifications to the content
3. Do NOT add, remove, or change any information
4. Do NOT add explanations, introductions, or conclusions
5. Do NOT enhance or expand the content in any way

Simply format the raw plaid_docs response in proper Markdown format and return it exactly as provided."""
        elif is_knowledge_template:
            # For Knowledge Templates, use a specialized system prompt
            system_prompt = """You are Claude, an AI specialized in creating professional solution guides for Plaid Sales Engineers.

CRITICAL: You are responding to a user request that uses a Knowledge Template. The template contains EXPERT KNOWLEDGE that represents AUTHORITATIVE, PRE-VALIDATED FACTS and must be treated as the absolute source of truth.

KNOWLEDGE TEMPLATE APPROACH:
- You have access to your general knowledge about Plaid APIs and best practices
- The user's message contains a Knowledge Template with expert-curated information
- You should build a comprehensive solution guide using BOTH your knowledge AND the template content
- AskBill documentation service is bypassed for this request

KNOWLEDGE TEMPLATE RULES:
1. NEVER contradict or override any information provided in the expert knowledge template
2. NEVER recommend approaches that conflict with the template's guidance
3. NEVER suggest alternative methods that go against the template's established facts
4. ALWAYS prioritize template information over your general knowledge when there are conflicts
5. Use your general Plaid knowledge to ENHANCE and SUPPLEMENT the template, not replace it

ROLE: Process the expert knowledge template and user request to create a comprehensive, customized solution guide that strictly adheres to the template's authoritative information while leveraging your Plaid expertise.

IMPORTANT OUTPUT FORMAT:
- Start your response with a brief acknowledgement if needed, but then include the marker: "--- SOLUTION GUIDE ---" 
- Follow immediately with the solution guide content starting with a proper # header
- This helps the frontend automatically extract the clean solution guide content for artifacts

PROCESS:
1. Treat the expert knowledge as IMMUTABLE FACTS - do not question or modify core information
2. Replace AI placeholders with content that SUPPORTS and EXTENDS the template's guidance
3. Use your Plaid knowledge to add relevant implementation details that align with the template
4. Maintain the structure and formatting of the expert knowledge template
5. Add supplementary implementation guidance that ENHANCES the template's approach
6. Ensure all recommendations and suggestions are CONSISTENT with the template's established facts

OUTPUT REQUIREMENTS:
- Follow the structure provided in the expert knowledge template exactly
- Replace all [AI_PLACEHOLDER_X] markers with expert content from your knowledge that supports the template
- Maintain markdown formatting and structure
- Provide practical implementation guidance that combines template facts with your Plaid expertise
- Include real, working code examples that follow the template's methodology
- Add relevant API details, error handling, and best practices from your knowledge
- Format for Sales Engineer presentation to customers
- NEVER include disclaimers or alternative approaches that contradict the template

REMEMBER: You are enhancing expert knowledge with your Plaid expertise, not replacing documentation lookup. Build comprehensive guides that leverage both the authoritative template and your training knowledge."""
        else:
            # Use standard system prompt for AskBill-based responses
            if base_system_prompt:
                # Enhance base system prompt with marker instructions
                system_prompt = f"""{base_system_prompt}

IMPORTANT OUTPUT FORMAT:
- Start your response with a brief acknowledgement if needed, but then include the marker: "--- SOLUTION GUIDE ---"
- Follow immediately with the solution guide content starting with a proper # header
- This helps the frontend automatically extract the clean solution guide content for artifacts"""
            else:
                system_prompt = """You are Claude, an AI specialized in creating professional solution guides for Plaid Sales Engineers.

ROLE: You receive current Plaid documentation from AskBill service and transform it into comprehensive, well-formatted solution guides.

IMPORTANT OUTPUT FORMAT:
- Start your response with a brief acknowledgement if needed, but then include the marker: "--- SOLUTION GUIDE ---"
- Follow immediately with the solution guide content starting with a proper # header
- This helps the frontend automatically extract the clean solution guide content for artifacts

PROCESS:
1. You will receive USER REQUEST + PLAID DOCUMENTATION CONTEXT from AskBill
2. Transform the raw documentation into a professional solution guide format
3. Add implementation guidance, code examples, and best practices

OUTPUT REQUIREMENTS:
- Create structured markdown with clear headers and sections
- Include complete API endpoints and request/response examples  
- Add step-by-step implementation instructions
- Generate Mermaid sequence diagrams showing API call flows
- Provide error handling guidance and best practices
- Include real, working code examples
- Format for Sales Engineer presentation to customers

Do NOT just reformat the documentation - enhance it with practical implementation guidance."""
        
        # DEBUG: Log the system prompt being used
        logger.info("=" * 80)
        logger.info("🔍 DEBUG: SYSTEM PROMPT SENT TO CLAUDE:")
        logger.info("=" * 80)
        logger.info(system_prompt)
        logger.info("=" * 80)
        logger.info("🔍 END SYSTEM PROMPT")
        logger.info("=" * 80)
        
        claude_response = await query_claude(messages, system_prompt)
        
        if claude_response.get("error"):
            logger.error(f"❌ Claude API error: {claude_response['error']}")
            raise HTTPException(status_code=500, detail=f"Claude API error: {claude_response['error']}")
        
        full_response = claude_response.get("completion", "")
        logger.info(f"✅ Received complete response: {len(full_response)} characters")
        
        # DEBUG: Log Claude's response
        logger.info("=" * 80)
        logger.info("🔍 DEBUG: CLAUDE'S RESPONSE:")
        logger.info("=" * 80)
        logger.info(full_response)
        logger.info("=" * 80)
        logger.info("🔍 END CLAUDE'S RESPONSE")
        logger.info("=" * 80)
        
        # Create assistant message
        assistant_message = ChatMessage(
            session_id=request.session_id,
            role="assistant",
            content=full_response,
            timestamp=datetime.utcnow()
        )
        db.add(assistant_message)
        logger.info("Created assistant response message")
        
        # Update session timestamp
        session.updated_at = datetime.utcnow()
        
        # Auto-generate intelligent title if this is the first exchange or session has default title
        if session.title == "New conversation" or len(request.previous_messages) <= 2:
            try:
                # Get all messages for this session for title generation
                session_messages = db.query(ChatMessage).filter(
                    ChatMessage.session_id == session.id
                ).order_by(ChatMessage.timestamp.asc()).all()
                
                # Convert to format expected by title generator
                messages_for_title = [
                    {"role": msg.role, "content": msg.content} 
                    for msg in session_messages
                ] + [
                    {"role": "user", "content": user_message.content},
                    {"role": "assistant", "content": assistant_message.content}
                ]
                
                new_title = generate_session_title(messages_for_title)
                logger.info(f"Generated title: '{new_title}' for session {session.id}")
                
                if new_title and new_title != "New Conversation":
                    session.title = new_title
                    logger.info(f"Updated session title to: {new_title}")
                
            except Exception as e:
                logger.error(f"Error generating session title: {e}")
                # Don't fail the request if title generation fails
        
        # Commit all changes to database
        db.commit()
        db.refresh(user_message)
        db.refresh(assistant_message)
        db.refresh(session)
        logger.info("Successfully committed messages to database")
        
        # Return the response with processing info
        return {
            "response": full_response,
            "askbill_used": askbill_used,
            "askbill_length": len(askbill_response) if askbill_response else 0,
            "knowledge_template_used": is_knowledge_template,
            "session": {
                "id": session.id,
                "title": session.title,
                "updated_at": session.updated_at.isoformat()
            },
            "debug_info": {
                "chat_mode": request.mode,
                "is_askbill_direct": is_askbill_direct,
                "is_knowledge_template": is_knowledge_template,
                "raw_askbill_response": askbill_response if askbill_response else None,
                "enhanced_message": enhanced_message,
                "system_prompt": system_prompt,
                "askbill_used": askbill_used,
                "user_message": request.message
            }
        }
        
    except Exception as e:
        logger.error(f"Error setting up chat stream: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/url-validation-stats")
async def get_url_validation_stats(
    hours: int = 24,
    current_user: User = Depends(get_current_user)
):
    """Get enhanced URL validation statistics for monitoring"""
    try:
        # Try enhanced analytics first
        try:
            from enhanced_url_validator import EnhancedPlaidURLValidator
            
            # Mock some stats for demonstration - in production, you'd store these
            enhanced_stats = {
                "enhanced_validation": {
                    "api_index_corrections": 0,
                    "field_specific_urls_added": 0,
                    "endpoint_specific_urls_added": 0,
                    "intelligent_suggestions_made": 0
                },
                "plaid_api_coverage": {
                    "products_referenced": [],
                    "endpoints_validated": [],
                    "fields_validated": []
                }
            }
            
            # Also get basic stats if available
            basic_stats = None
            try:
                from url_analytics import URLValidationAnalytics
                analytics = URLValidationAnalytics()
                basic_stats = analytics.get_stats(hours=hours)
            except:
                pass
            
            return {
                "enhanced_stats": enhanced_stats,
                "basic_stats": basic_stats,
                "validation_type": "enhanced_with_api_index",
                "period_hours": hours
            }
            
        except ImportError:
            # Fall back to basic analytics
            from url_analytics import URLValidationAnalytics
            
            analytics = URLValidationAnalytics()
            stats = analytics.get_stats(hours=hours)
            health_report = analytics.export_report(hours=hours)
            problem_urls = analytics.get_problem_urls(limit=5)
            
            return {
                "stats": stats,
                "problem_urls": problem_urls,
                "health_report": health_report,
                "validation_type": "basic",
                "period_hours": hours
            }
        
    except Exception as e:
        logger.error(f"Error getting URL validation stats: {e}")
        return {
            "error": "URL validation analytics not available",
            "stats": None,
            "validation_type": "none"
        }
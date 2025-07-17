from fastapi import FastAPI, WebSocket, HTTPException, Depends, BackgroundTasks, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import os
import uuid
import asyncio
import logging
from datetime import datetime, timedelta
import markdown
import pypandoc
from dotenv import load_dotenv
from contextlib import asynccontextmanager
import anthropic
from app.auth import (
    verify_password, 
    create_access_token, 
    get_current_user, 
    get_current_active_user,
    get_admin_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    oauth2_scheme,
    get_password_hash,
    JWT_SECRET_KEY,
    ALGORITHM
)
from app.database import get_db, Base, engine, SessionLocal, init_db
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.chat import ChatSession, ChatMode
import jwt
from jose import JWTError

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("plaid-guide-app")

# Initialize MCP clients
from bill_client import AskBillClient
try:
    ask_bill_client = AskBillClient()
    logger.info("Successfully initialized AskBill client")
except Exception as e:
    logger.warning(f"Failed to initialize AskBill client: {e}")
    ask_bill_client = None

# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database
    init_db()
    logger.info("Database initialized")
    
    # Create default admin user if it doesn't exist
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin_user:
            hashed_password = get_password_hash("admin123")
            admin_user = User(
                email="admin@example.com",
                password_hash=hashed_password,
                name="Admin User",
                role=UserRole.ADMIN,
                created_at=datetime.utcnow()
            )
            db.add(admin_user)
            db.commit()
            logger.info("Default admin user created")
    except Exception as e:
        logger.error(f"Error creating default admin user: {e}")
    finally:
        db.close()
    
    # Startup: ensure directories exist
    directories = [
        "data",
        "data/sessions",
        "data/artifacts",
        "data/users",
        "temp"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        logger.info(f"Ensured directory exists: {directory}")
    
    # Load Claude configuration
    try:
        with open("claude_config.json", "r") as f:
            app.state.claude_config = json.load(f)
    except FileNotFoundError:
        logger.warning("claude_config.json not found, using default configuration")
        app.state.claude_config = {
            "system_prompt": "You are Claude, an AI assistant specialized in Plaid documentation.",
            "temperature": 0.3
        }
    
    # Initialize Anthropic client
    try:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            logger.error("ANTHROPIC_API_KEY environment variable not set")
            raise ValueError("ANTHROPIC_API_KEY is required")
        
        app.state.anthropic_client = anthropic.Anthropic(api_key=api_key)
        logger.info("Anthropic client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Anthropic client: {e}")
        # Create a dummy client for development
        app.state.anthropic_client = None
    
    logger.info("Application startup complete")
    yield
    logger.info("Application shutdown")

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates for HTML rendering
templates = Jinja2Templates(directory="templates")

# Import and mount routers
from app.routers import chat, templates
app.include_router(chat.router)
app.include_router(templates.router, prefix="/api")

# Pydantic models
class UserResponse(BaseModel):
    id: str
    name: str
    email: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    is_admin: bool = False

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

class ArtifactCreate(BaseModel):
    title: str
    content: str
    type: str = "markdown"
    metadata: Optional[dict] = None

class ArtifactUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None
    metadata: Optional[dict] = None

class DownloadRequest(BaseModel):
    format: str = "markdown"  # markdown, docx, pdf

class ChatSessionResponse(BaseModel):
    id: str
    title: str
    mode: str
    timestamp: str

class ChatSessionListItem(BaseModel):
    id: str
    title: str
    mode: str
    preview: str
    timestamp: str
    message_count: int

class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None
    mode: Optional[str] = None

class ChatSessionCreate(BaseModel):
    mode: Optional[str] = "solution_guide"

class AIMergeRequest(BaseModel):
    existing_content: str
    new_content: str
    modification_scope: Optional[dict] = None
    merge_instructions: Optional[str] = None

class AITextStripRequest(BaseModel):
    raw_content: str
    strip_instructions: Optional[str] = None

# Helper functions
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

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
        return response
    except Exception as e:
        logger.error(f"Error querying MCP server: {e}", exc_info=True)
        return {
            "answer": "Error accessing documentation service.",
            "sources": []
        }

async def query_claude(messages: List[Dict[str, Any]], system_prompt: str = None):
    """Query Claude API with the provided messages."""
    try:
        logger.info("Querying Claude API")
        
        if system_prompt is None:
            system_prompt = app.state.claude_config.get(
                "system_prompt", 
                "You are Claude, an AI assistant specialized in Plaid documentation."
            )
        
        # Define the model name here
        model_name = "claude-3-7-sonnet-20250219"  # or another available model
        
        # Check if client is available
        if not app.state.anthropic_client:
            logger.error("Anthropic client not available")
            return {"error": "Claude API not available"}
        
        # Query Claude API with new messages format
        logger.info(f"Sending request to Claude with model: {model_name}, system_prompt: {system_prompt}, messages: {messages}")
        response = app.state.anthropic_client.messages.create(
            model=model_name,
            system=system_prompt,
            messages=[{
                "role": "user" if (hasattr(msg, 'role') and msg.role == "user") or (isinstance(msg, dict) and msg.get("role") == "user") else "assistant",
                "content": msg.content if hasattr(msg, 'content') else msg.get("content", "")
            } for msg in messages],
            temperature=app.state.claude_config.get("temperature", 0.3),
            max_tokens=4000
        )
        
        logger.info(f"Received response from Claude: {response}")
        
        # response is a Message object from Claude
        full_text = "".join([block.text for block in response.content if block.type == "text"])
        
        # Return only the full markdown text to the frontend
        return {"completion": full_text}
    except Exception as e:
        logger.error(f"Claude API error: {e}", exc_info=True)
        raise

async def query_claude_stream(messages: List[Dict[str, Any]], system_prompt: str = None):
    """Stream responses from Claude API."""
    try:
        logger.info("Starting Claude API stream")
        
        if system_prompt is None:
            system_prompt = app.state.claude_config.get(
                "system_prompt", 
                "You are Claude, an AI assistant specialized in Plaid documentation."
            )
        
        model_name = "claude-3-7-sonnet-20250219"
        
        # Check if client is available
        if not app.state.anthropic_client:
            logger.error("Anthropic client not available")
            yield {"error": "Claude API not available"}
            return
        
        # Create streaming request to Claude
        logger.info(f"Starting Claude stream with model: {model_name}")
        
        # Format messages properly for the API
        formatted_messages = []
        for msg in messages:
            # Handle both dict and object types safely
            if hasattr(msg, 'role'):
                # Object with attributes
                role = getattr(msg, 'role', 'user')
                content = str(getattr(msg, 'content', ''))
            elif isinstance(msg, dict):
                # Dictionary
                role = msg.get("role", "user")
                content = str(msg.get("content", ""))
            else:
                # Fallback - convert to string and treat as user message
                logger.warning(f"Unexpected message type: {type(msg)}")
                role = "user"
                content = str(msg)
            
            formatted_messages.append({
                "role": "user" if role == "user" else "assistant",
                "content": content
            })
        
        logger.info(f"Formatted {len(formatted_messages)} messages for streaming")
        
        try:
            logger.info("🚀 Starting Claude streaming request")
            chunk_count = 0
            total_content = ""
            
            with app.state.anthropic_client.messages.stream(
                model=model_name,
                system=system_prompt,
                messages=formatted_messages,
                temperature=app.state.claude_config.get("temperature", 0.3),
                max_tokens=4000
            ) as stream:
                logger.info("✅ Claude stream connection established")
                for text in stream.text_stream:
                    if text:  # Only yield non-empty text
                        chunk_count += 1
                        total_content += text
                        logger.debug(f"📝 Chunk {chunk_count}: {repr(text[:50])}")
                        yield {"content": text}
                        
            logger.info(f"🏁 Claude streaming completed. Total chunks: {chunk_count}, Total length: {len(total_content)}")
            
        except Exception as streaming_error:
            logger.error(f"❌ Error in Claude streaming loop: {streaming_error}", exc_info=True)
            yield {"error": f"Streaming error: {str(streaming_error)}"}
                
    except Exception as e:
        logger.error(f"Claude streaming API error: {e}", exc_info=True)
        yield {"error": str(e)}

# API endpoints
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/auth/session")
async def get_session(current_user: User = Depends(get_current_user)):
    return {"user": {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role.value  # Convert enum to string value
    }}

@app.post("/api/chat")
async def chat(request: ChatRequest, background_tasks: BackgroundTasks, user: User = Depends(get_current_user)):
    try:
        # Create user message
        user_message = {
            "role": "user",
            "content": request.message,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Get assistant response
        assistant_message = {
            "role": "assistant",
            "content": "This is a placeholder response. AI integration pending.",
            "timestamp": datetime.utcnow().isoformat(),
            "sources": []
        }
        
        return {
            "messages": [user_message, assistant_message]
        }
    except Exception as e:
        logger.error(f"Error processing chat request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    """Stream chat responses using Server-Sent Events"""
    try:
        logger.info(f"Starting chat stream")
        
        # Step 1: Query AskBill for current Plaid documentation
        askbill_response = ""
        logger.info(f"🔍 DEBUG: ask_bill_client is None? {ask_bill_client is None}")
        logger.info(f"🔍 DEBUG: ask_bill_client type: {type(ask_bill_client)}")
        
        if ask_bill_client is not None:
            try:
                logger.info(f"🔍 Step 1: Querying AskBill with user message: {request.message}")
                logger.info(f"🔍 DEBUG: About to call query_mcp_server")
                
                askbill_result = await asyncio.wait_for(
                    query_mcp_server(request.message), 
                    timeout=15.0
                )
                
                logger.info(f"🔍 DEBUG: askbill_result = {askbill_result}")
                
                if askbill_result and askbill_result.get("answer"):
                    askbill_response = askbill_result["answer"]
                    logger.info(f"✅ Step 1 Complete: Retrieved {len(askbill_response)} chars from AskBill")
                else:
                    logger.warning("⚠️ No response from AskBill")
                    
            except asyncio.TimeoutError:
                logger.warning("⏱️ AskBill query timed out")
            except Exception as e:
                logger.error(f"❌ Error querying AskBill: {e}", exc_info=True)
        else:
            logger.warning("⚠️ AskBill client not available")
        
        # Step 2: Prepare enhanced message for Claude
        messages = []
        if hasattr(request, 'previous_messages') and request.previous_messages:
            messages.extend(request.previous_messages)
        
        # Create enhanced message combining user request + AskBill documentation
        if askbill_response:
            enhanced_message = f"""USER REQUEST: {request.message}

PLAID DOCUMENTATION CONTEXT (from AskBill):
{askbill_response}

TASK: Using the above Plaid documentation, create a comprehensive solution guide that addresses the user's request. Format it properly with headers, code examples, API details, and implementation steps."""
        else:
            enhanced_message = f"""USER REQUEST: {request.message}

TASK: Create a comprehensive solution guide for the above request using your knowledge of Plaid APIs and best practices."""
        
        messages.append({
            "role": "user", 
            "content": enhanced_message
        })
        
        # Get system prompt based on mode
        system_prompt = None
        if hasattr(request, 'mode'):
            if request.mode == "solution_guide":
                # System prompt for enhancing AskBill responses into solution guides
                system_prompt = """You are Claude, an AI specialized in creating professional solution guides for Plaid Sales Engineers.

ROLE: You receive current Plaid documentation from AskBill service and transform it into comprehensive, well-formatted solution guides.

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

Do NOT just reformat the documentation - enhance it with practical implementation guidance.

GUIDELINES:

1. SOLUTION GUIDE CREATION:
   - Generate clear, structured markdown documents
   - Always insert a blank line before and after markdown tables to ensure correct rendering
   - Include sample API requests using CURL syntax unless instructed otherwise
   - Include relevant hyperlinks for each API call to https://plaid.com/docs/
   - Format guides with clear sections, headers, and bullet points
   - Always address specific use cases and include implementation steps
   - Create a Mermaid sequence diagram showing the flow of API calls and user interactions
   - For sequence diagrams, include:
     * User interactions (e.g., Plaid Link flow)
     * API calls between your server and Plaid
     * Data flow and transformations
     * Error handling paths
     * Success paths

2. API DOCUMENTATION FORMAT:
   - List APIs in a simple format: 'API Name: /endpoint/url'
   - Group related APIs together
   - Include brief description of each API's purpose

3. GETTING STARTED GUIDE:
   - Always include a 'Getting Started' section with:
     * Steps to create a free Plaid Developer Dashboard account
     * Link to download the official Postman collection
     * Links to quick start apps on GitHub
     * Other essential resources

4. TECHNICAL ACCURACY:
   - Be precise with API endpoints, parameters, and response formats
   - Reference current Plaid API practices
   - Use realistic examples and sample data

5. AUDIENCE AWARENESS:
   - Your primary audience is Sales Engineers at Plaid
   - They will use your guidance to help customers implement Plaid products
   - Secondary audiences include developers and technical decision-makers

Remember: Create complete, comprehensive solution guides based on your knowledge of Plaid's APIs and best practices."""
                
        # Step 3: Get complete response from Claude (no streaming)
        logger.info("🔄 Querying Claude with enhanced message")
        
        claude_response = await query_claude(messages, system_prompt)
        
        if claude_response.get("error"):
            logger.error(f"❌ Claude API error: {claude_response['error']}")
            raise HTTPException(status_code=500, detail=f"Claude API error: {claude_response['error']}")
        
        full_response = claude_response.get("completion", "")
        logger.info(f"✅ Received complete response: {len(full_response)} characters")
        
        return {
            "response": full_response,
            "askbill_used": bool(askbill_response),
            "askbill_length": len(askbill_response) if askbill_response else 0
        }
        
    except Exception as e:
        logger.error(f"Error setting up chat stream: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/artifacts")
async def create_artifact(
    artifact: ArtifactCreate, 
    user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Creating artifact for user: {user.email}")
        logger.info(f"Artifact data: {artifact.dict()}")
        
        # Get the full user object from the database
        db_user = db.query(User).filter(User.email == user.email).first()
        logger.info(f"Found user in database: {db_user.id if db_user else 'None'}")
        
        if not db_user:
            logger.error(f"User not found in database: {user.email}")
            raise HTTPException(status_code=404, detail="User not found")

        artifact_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        artifact_data = {
            "id": artifact_id,
            "title": artifact.title,
            "content": artifact.content,
            "type": artifact.type,
            "metadata": artifact.metadata or {},
            "user_id": db_user.id,
            "created_at": now,
            "updated_at": now
        }
        
        logger.info(f"Prepared artifact data: {artifact_data}")
        
        # Ensure the artifacts directory exists
        os.makedirs("data/artifacts", exist_ok=True)
        
        # Save artifact to file system
        artifact_path = f"data/artifacts/{artifact_id}.json"
        logger.info(f"Saving artifact to {artifact_path}")
        
        with open(artifact_path, "w") as f:
            json.dump(artifact_data, f, indent=2)
        
        logger.info(f"Successfully created artifact with ID: {artifact_id}")
        return artifact_data
    except Exception as e:
        logger.error(f"Error creating artifact: {str(e)}", exc_info=True)
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error details: {e.__dict__ if hasattr(e, '__dict__') else 'No details available'}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/artifacts")
async def list_artifacts(user: UserResponse = Depends(get_current_user)):
    try:
        artifacts = []
        
        # In a real app, you would query a database
        # Here we'll just read from the file system
        artifact_files = os.listdir("data/artifacts")
        
        for filename in artifact_files:
            if filename.endswith(".json"):
                with open(f"data/artifacts/{filename}", "r") as f:
                    artifact = json.load(f)
                    
                    # Only return artifacts for the current user
                    if artifact.get("user_id") == user.id:
                        artifacts.append(artifact)
        
        # Sort by updated_at (newest first)
        artifacts.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        
        return artifacts
    except Exception as e:
        logger.error(f"Error listing artifacts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/artifacts/{artifact_id}")
async def get_artifact(artifact_id: str, user: UserResponse = Depends(get_current_user)):
    try:
        # In a real app, you would query a database
        artifact_path = f"data/artifacts/{artifact_id}.json"
        
        if not os.path.exists(artifact_path):
            raise HTTPException(status_code=404, detail="Artifact not found")
            
        with open(artifact_path, "r") as f:
            artifact = json.load(f)
            
        # Check if the artifact belongs to the current user
        if artifact.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="You do not have permission to access this artifact")
            
        return artifact
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting artifact: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/artifacts/{artifact_id}")
async def update_artifact(
    artifact_id: str, 
    update: ArtifactUpdate, 
    user: UserResponse = Depends(get_current_user)
):
    try:
        artifact_path = f"data/artifacts/{artifact_id}.json"
        
        if not os.path.exists(artifact_path):
            raise HTTPException(status_code=404, detail="Artifact not found")
            
        with open(artifact_path, "r") as f:
            artifact = json.load(f)
            
        # Check if the artifact belongs to the current user
        if artifact.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="You do not have permission to update this artifact")
        
        # Update fields
        if update.title is not None:
            artifact["title"] = update.title
        if update.content is not None:
            artifact["content"] = update.content
        if update.type is not None:
            artifact["type"] = update.type
        if update.metadata is not None:
            artifact["metadata"] = update.metadata
            
        artifact["updated_at"] = datetime.now().isoformat()
        
        # Save updated artifact
        with open(artifact_path, "w") as f:
            json.dump(artifact, f, indent=2)
            
        return artifact
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating artifact: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/artifacts/{artifact_id}")
async def delete_artifact(artifact_id: str, user: UserResponse = Depends(get_current_user)):
    try:
        artifact_path = f"data/artifacts/{artifact_id}.json"
        
        if not os.path.exists(artifact_path):
            raise HTTPException(status_code=404, detail="Artifact not found")
            
        with open(artifact_path, "r") as f:
            artifact = json.load(f)
            
        # Check if the artifact belongs to the current user
        if artifact.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="You do not have permission to delete this artifact")
            
        # Delete the artifact
        os.remove(artifact_path)
        
        return {"status": "success", "message": "Artifact deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting artifact: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/artifacts/{artifact_id}/download")
async def download_artifact(artifact_id: str, user: UserResponse = Depends(get_current_user)):
    try:
        # Ensure temp directory exists
        os.makedirs("temp", exist_ok=True)
        
        # Get artifact
        artifact_path = f"data/artifacts/{artifact_id}.json"
        if not os.path.exists(artifact_path):
            logger.error(f"Artifact not found at {artifact_path}")
            raise HTTPException(status_code=404, detail="Artifact not found")
            
        with open(artifact_path, "r") as f:
            artifact = json.load(f)
            
        # Check if the artifact belongs to the current user
        if artifact.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="You do not have permission to download this artifact")
            
        # Create a safe filename
        safe_title = "".join(c for c in artifact["title"] if c.isalnum() or c in (' ', '-', '_')).strip()
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        filename = f"{safe_title}_{timestamp}"
        
        temp_path = f"temp/{filename}.md"
        logger.info(f"Creating markdown file at {temp_path}")
        
        with open(temp_path, "w") as f:
            f.write(artifact["content"])
            
        return FileResponse(
            temp_path,
            media_type="text/markdown",
            filename=f"{filename}.md"
        )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading artifact: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Helper function to save messages
async def save_message(session_id: str, message: Dict[str, Any], user_id: str):
    try:
        session_path = f"data/sessions/{user_id}/{session_id}"
        os.makedirs(session_path, exist_ok=True)
        
        message_id = message.get("id", str(uuid.uuid4()))
        
        with open(f"{session_path}/{message_id}.json", "w") as f:
            json.dump(message, f, indent=2)
            
        logger.info(f"Saved message {message_id} for session {session_id}")
    except Exception as e:
        logger.error(f"Error saving message: {e}")

# Add token endpoint
@app.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    logger.info(f"Login attempt for email: {form_data.username}")
    
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        logger.warning(f"Login failed: User not found for email {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    logger.info(f"Found user: {user.email} (ID: {user.id})")
    logger.info(f"Verifying password for user {user.email}")
    
    if not verify_password(form_data.password, user.password_hash):
        logger.warning(f"Login failed: Invalid password for user {user.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    logger.info(f"Password verified successfully for user {user.email}")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    logger.info(f"Login successful for user {user.email}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.value  # Convert enum to string value
        }
    }

# Admin User Management Endpoints
@app.get("/api/admin/users")
async def list_users(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """List all users - admin only"""
    try:
        users = db.query(User).all()
        return [
            {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role.value,
                "created_at": user.created_at.isoformat(),
                "last_login": user.last_login.isoformat() if user.last_login else None
            }
            for user in users
        ]
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/users")
async def create_user_admin(
    user_data: dict,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new user - admin only"""
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        new_user = User(
            email=user_data["email"],
            password_hash=get_password_hash(user_data["password"]),
            name=user_data["name"],
            role=UserRole.ADMIN if user_data.get("role") in ["ADMIN", "admin"] else UserRole.USER
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role.value,
            "created_at": new_user.created_at.isoformat(),
            "last_login": None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/users/{user_id}")
async def update_user_admin(
    user_id: int,
    user_data: dict,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update a user - admin only"""
    try:
        # Get the user to update
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if email is being changed and if it conflicts
        if user_data.get("email") and user_data["email"] != user.email:
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            user.email = user_data["email"]
        
        # Update fields
        if user_data.get("name"):
            user.name = user_data["name"]
        
        if user_data.get("password"):
            user.password_hash = get_password_hash(user_data["password"])
        
        if user_data.get("role"):
            user.role = UserRole.ADMIN if user_data["role"] in ["ADMIN", "admin"] else UserRole.USER
        
        db.commit()
        db.refresh(user)
        
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.value,
            "created_at": user.created_at.isoformat(),
            "last_login": user.last_login.isoformat() if user.last_login else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/users/{user_id}")
async def delete_user_admin(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a user - admin only"""
    try:
        # Prevent admin from deleting themselves
        if user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        # Get the user to delete
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Delete the user (cascade will handle related data)
        db.delete(user)
        db.commit()
        
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users/")
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        new_user = User(
            email=user.email,
            password_hash=get_password_hash(user.password),
            name=user.username,
            role=UserRole.ADMIN if user.is_admin else UserRole.USER
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "id": str(new_user.id),
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role.value
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/sessions", response_model=List[ChatSessionListItem])
async def list_chat_sessions(user: User = Depends(get_current_user)):
    try:
        sessions_path = f"data/sessions/{user.id}"
        if not os.path.exists(sessions_path):
            return []
            
        sessions = []
        for session_id in os.listdir(sessions_path):
            session_path = os.path.join(sessions_path, session_id)
            if os.path.isdir(session_path):
                # Try to read metadata first
                metadata_path = os.path.join(session_path, "metadata.json")
                session_data = {
                    'id': session_id,
                    'title': 'New conversation',
                    'mode': 'solution_guide',
                    'timestamp': '',
                    'preview': '',
                    'message_count': 0
                }
                
                if os.path.exists(metadata_path):
                    try:
                        with open(metadata_path, 'r') as f:
                            metadata = json.load(f)
                            session_data.update(metadata)
                    except Exception as e:
                        logger.warning(f"Failed to read metadata for session {session_id}: {e}")
                
                # Get messages for preview and count
                messages = []
                for msg_file in os.listdir(session_path):
                    if msg_file.endswith('.json') and msg_file != 'metadata.json':
                        try:
                            with open(os.path.join(session_path, msg_file), 'r') as f:
                                messages.append(json.load(f))
                        except Exception as e:
                            logger.warning(f"Failed to read message file {msg_file}: {e}")
                
                if messages:
                    # Sort messages by timestamp
                    messages.sort(key=lambda x: x.get('timestamp', ''))
                    first_message = messages[0]
                    session_data.update({
                        'preview': first_message.get('content', '')[:100],
                        'timestamp': first_message.get('timestamp', session_data['timestamp']),
                        'message_count': len(messages)
                    })
                
                sessions.append(session_data)
        
        # Sort sessions by timestamp (newest first)
        sessions.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return sessions
    except Exception as e:
        logger.error(f"Error listing chat sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/sessions/{session_id}")
async def get_chat_session(session_id: str, user: User = Depends(get_current_user)):
    try:
        session_path = f"data/sessions/{user.id}/{session_id}"
        if not os.path.exists(session_path):
            raise HTTPException(status_code=404, detail="Chat session not found")
            
        messages = []
        for msg_file in os.listdir(session_path):
            if msg_file.endswith('.json'):
                with open(os.path.join(session_path, msg_file), 'r') as f:
                    messages.append(json.load(f))
        
        # Sort messages by timestamp
        messages.sort(key=lambda x: x.get('timestamp', ''))
        return messages
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    request: ChatSessionCreate = ChatSessionCreate(),
    user: User = Depends(get_current_user)
):
    try:
        session_id = str(uuid.uuid4())
        session_path = f"data/sessions/{user.id}/{session_id}"
        os.makedirs(session_path, exist_ok=True)
        
        # Get mode from request, default to solution_guide
        mode = request.mode
        
        # Save session metadata
        session_metadata = {
            "id": session_id,
            "title": "New conversation",
            "mode": mode,
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user.id
        }
        
        with open(f"{session_path}/metadata.json", "w") as f:
            json.dump(session_metadata, f)
        
        return session_metadata
    except Exception as e:
        logger.error(f"Error creating chat session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/chat/sessions/{session_id}")
async def delete_chat_session(session_id: str, user: User = Depends(get_current_user)):
    try:
        session_path = f"data/sessions/{user.id}/{session_id}"
        if not os.path.exists(session_path):
            raise HTTPException(status_code=404, detail="Chat session not found")
            
        # Delete all messages in the session
        for msg_file in os.listdir(session_path):
            os.remove(os.path.join(session_path, msg_file))
            
        # Remove the session directory
        os.rmdir(session_path)
        
        return {"status": "success", "message": "Chat session deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chat session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/chat/sessions/{session_id}")
async def update_chat_session(
    session_id: str,
    update: ChatSessionUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Updating chat session {session_id} with data: {update}")
    
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user.id
    ).first()
    
    if not session:
        logger.error(f"Chat session {session_id} not found for user {user.id}")
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    if update.title is not None:
        logger.info(f"Updating title to: {update.title}")
        session.title = update.title
    if update.mode is not None:
        # Validate mode
        valid_modes = [ChatMode.SOLUTION_GUIDE, ChatMode.FREE_WHEELIN]
        logger.info(f"Validating mode: {update.mode} against valid modes: {valid_modes}")
        if update.mode not in valid_modes:
            logger.error(f"Invalid mode: {update.mode}")
            raise HTTPException(
                status_code=422,
                detail=f"Invalid mode. Must be one of: {valid_modes}"
            )
        logger.info(f"Updating mode to: {update.mode}")
        session.mode = update.mode
    
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    logger.info(f"Session updated successfully: {session}")
    
    return session

@app.post("/api/ai/merge")
async def ai_merge_content(
    request: AIMergeRequest,
    user: UserResponse = Depends(get_current_user)
):
    """Use AI to intelligently merge existing content with new content."""
    try:
        logger.info(f"AI merge request for user: {user.email}")
        
        # Prepare the system prompt for content merging
        system_prompt = """You are an expert content merger. Your task is to intelligently merge existing content with new content.

CRITICAL REQUIREMENTS:
- Return ONLY the complete merged document 
- Do NOT include any explanations, descriptions, or meta-commentary
- Do NOT say things like "I'll merge", "Here's the merged content", or "The content should be"
- Start directly with the actual merged content
- Include the full document, not summaries or partial content
- Preserve exact formatting, headers, tables, and code blocks

ANTI-TRUNCATION RULES:
- NEVER truncate any content in a merge
- NEVER use phrases like "[Previous content remains unchanged through X section]"
- NEVER use phrases like "[Remaining content remains unchanged from Y through Z section]"
- NEVER reference previous sections with "as mentioned above" or "in the previous section"
- ALWAYS include complete sections in their entirety
- If you need to reference unchanged sections, include them fully in the output
- The merged document must be completely standalone and self-contained

Guidelines:
1. Preserve the structure and style of the existing content
2. Integrate new information seamlessly without duplication  
3. Update sections that have new information
4. Add new sections where appropriate
5. Maintain markdown formatting and code blocks
6. Remove any conversational or instructional text from the new content
7. If the new content describes where something should be placed, actually place it there
8. Include ALL sections completely - never use truncation references

RETURN FORMAT: Start immediately with the merged document content. No preamble. Include the complete document."""
        
        # Prepare the user message
        user_message = f"""EXISTING CONTENT:
{request.existing_content}

NEW CONTENT TO MERGE:
{request.new_content}

{f'MERGE INSTRUCTIONS: {request.merge_instructions}' if request.merge_instructions else ''}

TASK: Merge the new content into the existing content following the system requirements. Return the complete merged document immediately without any explanations."""
        
        # Query Claude for intelligent merge
        from app.utils.claude import query_claude
        messages = [{"role": "user", "content": user_message}]
        
        response = await query_claude(messages, system_prompt)
        merged_content = response.get("completion", "")
        
        return {
            "merged_content": merged_content,
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error in AI merge: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/strip-text")
async def ai_strip_text(
    request: AITextStripRequest,
    user: UserResponse = Depends(get_current_user)
):
    """Use AI to strip conversational and placeholder text from content."""
    try:
        logger.info(f"AI text strip request for user: {user.email}")
        
        # Prepare the system prompt for text stripping
        system_prompt = """You are an expert content cleaner. Your task is to remove conversational elements and placeholder text from content while preserving all substantive information.

Remove:
- Conversational phrases ("Here's", "I'll", "Let me", "You can", etc.)
- Instructional text ("Note that", "Remember to", etc.)
- Placeholder text like "[Rest of the guide remains the same...]" or "[Previous content unchanged]"
- Meta-commentary about the content itself
- Explanatory text that doesn't add substantive value

Preserve:
- All technical content, code examples, and documentation
- Headers, lists, tables, and formatting
- Substantive explanations and implementation details
- API references and code samples

Return only the clean content without any conversational wrapper."""
        
        # Prepare the user message
        user_message = f"""Please clean this content by removing conversational elements and placeholder text:

{request.raw_content}

{f'ADDITIONAL INSTRUCTIONS: {request.strip_instructions}' if request.strip_instructions else ''}

Return only the clean, substantive content."""
        
        # Query Claude for text stripping
        from app.utils.claude import query_claude
        messages = [{"role": "user", "content": user_message}]
        
        response = await query_claude(messages, system_prompt)
        clean_content = response.get("completion", "")
        
        return {
            "clean_content": clean_content,
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error in AI text strip: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/askbill/status")
async def get_askbill_status_endpoint(user: User = Depends(get_current_user)):
    """Get AskBill connection status and statistics for debugging."""
    try:
        if ask_bill_client is None:
            logger.warning("🚫 ASKBILL STATUS: Client not initialized")
            return {
                "status": "unavailable",
                "error": "AskBill client not initialized",
                "connection_stats": None,
                "icon": "🚫"
            }
        
        status = ask_bill_client.get_connection_status()
        # Reduced logging to avoid spam - only log on status changes
        # logger.info(f"📊 ASKBILL STATUS: Retrieved status: {status['current_status']}")
        
        # Determine icon based on status
        status_icon = "🔗"
        if status["current_status"] == "completed":
            status_icon = "✅"
        elif status["current_status"] in ["timeout", "connection_closed", "handshake_failed", "websocket_error", "unknown_error"]:
            status_icon = "❌"
        elif status["current_status"] in ["connecting", "waiting_response"]:
            status_icon = "⏳"
        elif status["current_status"] == "connected":
            status_icon = "🔗"
        
        return {
            "status": "available",
            "connection_stats": status,
            "client_info": {
                "uri": ask_bill_client.uri,
                "anonymous_id": ask_bill_client.anonymous_id[:8] + "...",
                "user_id": ask_bill_client.user_id[:8] + "..."
            },
            "icon": status_icon
        }
    except Exception as e:
        logger.error(f"💥 ASKBILL STATUS: Error getting status: {e}", exc_info=True)
        return {
            "status": "error",
            "error": str(e),
            "connection_stats": None,
            "icon": "💥"
        }

# Run the server
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True,
        log_level="info"
    )

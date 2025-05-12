from fastapi import FastAPI, WebSocket, HTTPException, Depends, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import os
import uuid
import asyncio
import logging
import anthropic
from datetime import datetime
import markdown
import pypandoc
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("plaid-guide-app")

# Initialize Claude client
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Initialize MCP clients
from bill_client import AskBillClient
ask_bill_client = AskBillClient()

# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure directories exist
    os.makedirs("data/sessions", exist_ok=True)
    os.makedirs("data/artifacts", exist_ok=True)
    os.makedirs("data/users", exist_ok=True)
    
    # Load Claude configuration
    with open("claude_config.json", "r") as f:
        app.state.claude_config = json.load(f)
    
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

# Pydantic models
class User(BaseModel):
    id: str
    name: str
    email: str

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

class ArtifactUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None

class DownloadRequest(BaseModel):
    format: str = "markdown"  # markdown, docx, pdf

# Helper functions
def get_current_user():
    # This is a placeholder. In a real app, you would validate a JWT token
    # or session cookie to get the current user
    return User(
        id="user123",
        name="Plaid Sales Engineer",
        email="sales.engineer@plaid.com"
    )

async def query_mcp_server(question: str):
    """Query the AskBill MCP server for documentation."""
    try:
        logger.info(f"Querying MCP server with question: {question}")
        response = await ask_bill_client.ask_question(question)
        logger.info("Received response from MCP server")
        return response
    except Exception as e:
        logger.error(f"Error querying MCP server: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
        
        # Query Claude API with new messages format
        logger.info(f"Sending request to Claude with model: {model_name}, system_prompt: {system_prompt}, messages: {messages}")
        response = client.messages.create(
            model=model_name,
            system=system_prompt,
            messages=[{
                "role": "user" if msg["role"] == "user" else "assistant",
                "content": msg["content"]
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

# API endpoints
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/auth/session")
async def get_session():
    user = get_current_user()
    return {"user": user}

@app.post("/api/chat")
async def chat(request: ChatRequest, background_tasks: BackgroundTasks, user: User = Depends(get_current_user)):
    try:
        logger.info(f"Received chat request for session {request.session_id}")
        
        # Format messages for Claude
        claude_messages = [
            {"role": "user" if msg.role == "user" else "assistant", "content": msg.content}
            for msg in request.previous_messages
        ]
        
        # Add the new message
        claude_messages.append({"role": "user", "content": request.message})
        
        # Query the MCP server if the question is about Plaid
        mcp_response = None
        if any(keyword in request.message.lower() for keyword in ["plaid", "link", "api", "bank", "financial", "ach", "webhook"]):
            try:
                mcp_response = await query_mcp_server(request.message)
                
                # If we got a response from MCP, add it as context to Claude
                if mcp_response and mcp_response.get("answer"):
                    context_message = (
                        f"I searched the Plaid documentation for information related to your question. "
                        f"Here's what I found:\n\n{mcp_response['answer']}"
                    )
                    claude_messages.append({"role": "user", "content": context_message})
            except Exception as e:
                logger.error(f"Error in MCP query, continuing without it: {e}")
        
        # Query Claude
        claude_response = await query_claude(claude_messages)
        
        # Create response message
        assistant_message = {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": claude_response["completion"],
            "timestamp": datetime.now().isoformat(),
            "sources": mcp_response.get("sources", []) if mcp_response else []
        }
        
        # Save the message in the background
        background_tasks.add_task(
            save_message, 
            request.session_id, 
            assistant_message
        )
        
        return assistant_message
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/artifacts")
async def create_artifact(artifact: ArtifactCreate, user: User = Depends(get_current_user)):
    try:
        artifact_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        artifact_data = {
            "id": artifact_id,
            "title": artifact.title,
            "content": artifact.content,
            "type": artifact.type,
            "user_id": user.id,
            "created_at": now,
            "updated_at": now
        }
        
        # Save artifact to file system
        with open(f"data/artifacts/{artifact_id}.json", "w") as f:
            json.dump(artifact_data, f, indent=2)
        
        return artifact_data
    except Exception as e:
        logger.error(f"Error creating artifact: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/artifacts")
async def list_artifacts(user: User = Depends(get_current_user)):
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
async def get_artifact(artifact_id: str, user: User = Depends(get_current_user)):
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
    user: User = Depends(get_current_user)
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
async def delete_artifact(artifact_id: str, user: User = Depends(get_current_user)):
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
async def download_artifact(
    artifact_id: str, 
    request: DownloadRequest, 
    user: User = Depends(get_current_user)
):
    try:
        artifact_path = f"data/artifacts/{artifact_id}.json"
        
        if not os.path.exists(artifact_path):
            raise HTTPException(status_code=404, detail="Artifact not found")
            
        with open(artifact_path, "r") as f:
            artifact = json.load(f)
            
        # Check if the artifact belongs to the current user
        if artifact.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="You do not have permission to download this artifact")
            
        # Get content and title
        content = artifact.get("content", "")
        title = artifact.get("title", "Untitled")
        filename_base = title.replace(" ", "_")
        
        # Create temporary files directory if it doesn't exist
        os.makedirs("temp", exist_ok=True)
        
        # Handle different formats
        if request.format == "markdown":
            # Markdown - just return the content directly
            temp_path = f"temp/{filename_base}.md"
            with open(temp_path, "w") as f:
                f.write(content)
                
            return FileResponse(
                path=temp_path,
                filename=f"{filename_base}.md",
                media_type="text/markdown"
            )
        elif request.format == "docx":
            # Convert to DOCX using pypandoc
            temp_path = f"temp/{filename_base}.docx"
            pypandoc.convert_text(
                content,
                'docx',
                format='md',
                outputfile=temp_path
            )
            
            return FileResponse(
                path=temp_path,
                filename=f"{filename_base}.docx",
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
        elif request.format == "pdf":
            # Convert to PDF using pypandoc
            temp_path = f"temp/{filename_base}.pdf"
            pypandoc.convert_text(
                content,
                'pdf',
                format='md',
                outputfile=temp_path
            )
            
            return FileResponse(
                path=temp_path,
                filename=f"{filename_base}.pdf",
                media_type="application/pdf"
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {request.format}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading artifact: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper function to save messages
async def save_message(session_id: str, message: Dict[str, Any]):
    try:
        session_path = f"data/sessions/{session_id}"
        os.makedirs(session_path, exist_ok=True)
        
        message_id = message.get("id", str(uuid.uuid4()))
        
        with open(f"{session_path}/{message_id}.json", "w") as f:
            json.dump(message, f, indent=2)
            
        logger.info(f"Saved message {message_id} for session {session_id}")
    except Exception as e:
        logger.error(f"Error saving message: {e}")

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

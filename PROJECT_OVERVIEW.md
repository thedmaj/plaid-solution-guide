# Plaid Solution Guide Project Overview

## Project Description

The Plaid Solution Guide is an AI-assisted documentation and solution generation tool that helps financial technical professionals create implementation guides for Plaid API integration. The application combines a chat interface powered by Claude AI with the ability to create, edit, and export technical artifacts in various formats.

## Architecture Overview

The project follows a full-stack architecture with:

1. **Frontend**: React-based web application
2. **Backend**: Python FastAPI server
3. **AI Integration**: Claude AI for generating content
4. **Documentation Source**: AskBill MCP server for Plaid documentation

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│  FastAPI Backend│────▶│   Claude AI     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                        │
         │                      │                        │
         │                      ▼                        │
         │              ┌─────────────────┐              │
         │              │                 │              │
         └────────────▶│  AskBill MCP    │◀─────────────┘
                        │  (Plaid Docs)   │
                        │                 │
                        └─────────────────┘
```

## Frontend Technologies

- **Framework**: React (with React Hooks)
- **Styling**: TailwindCSS
- **UI Components**: Custom components with Lucide React icons
- **Markdown Rendering**: ReactMarkdown with syntax highlighting
- **Diagram Support**: Mermaid.js for sequence and flow diagrams
- **HTTP Client**: Axios for API requests

### Key Frontend Components

1. `App.jsx`: Main application component with state management
2. `ChatWindow.jsx`: Handles chat interactions with Claude AI
3. `ArtifactPanel.jsx`: Manages artifact creation, editing, and downloading
4. `Sidebar.jsx`: Navigation between chat sessions and artifacts
5. `Header.jsx`: Application header with controls for chat and artifact panels
6. `Message.jsx`: Renders individual chat messages with Markdown support

### Frontend Hooks

- `useAuth.js`: Authentication management
- `useChatSession.js`: Chat session state and interactions
- `useArtifacts.js`: Artifact CRUD operations and document conversion

## Backend Technologies

- **Framework**: FastAPI (Python)
- **Authentication**: JWT-based authentication
- **API Integration**: Claude AI and AskBill MCP server
- **Document Conversion**: Pandoc/pypandoc for DOCX and PDF generation
- **URL Validation**: For validating external links in documentation

### Key Backend Components

1. `main.py`: FastAPI application entry point
2. `routes/`: API endpoint definitions
3. `services/`: Business logic implementation
4. `models/`: Data model definitions
5. `utils/`: Utility functions for various operations
6. `templates/`: Templates for document generation

## Features

1. **Chat Interface**:
   - Interact with Claude AI for Plaid integration guidance
   - Save chat sessions for later reference
   - Create artifacts from chat responses

2. **Artifact Management**:
   - Create technical guides from chat responses
   - Edit artifacts with real-time preview
   - Support for Markdown with Mermaid diagrams
   - Download artifacts in Markdown, DOCX, and PDF formats

3. **UI Experience**:
   - Collapsible chat panel for focused artifact editing
   - Split-view editing with live preview
   - Automatic activation of preview mode when editing

4. **Document Quality**:
   - Properly formatted technical documentation
   - Support for diagrams and code blocks
   - Consistent styling across different output formats

## Implementation Details

### Authentication Flow

The application uses JWT-based authentication:
1. User signs in via the login page
2. Backend validates credentials and returns a JWT token
3. Frontend stores the token and includes it in subsequent requests
4. Protected routes verify the token before processing requests

### Chat Flow

1. User sends a message to Claude AI via the chat interface
2. If the message relates to Plaid, the backend queries the AskBill MCP server
3. The backend enhances Claude's response with Plaid documentation
4. The enhanced response is returned to the frontend and displayed to the user

### Artifact Creation Flow

1. User selects a message to convert to an artifact
2. Backend creates an artifact with the message content
3. User can edit the artifact in the ArtifactPanel
4. When editing, the chat panel automatically collapses and preview mode activates
5. User can download the artifact in different formats (MD, DOCX, PDF)

### Document Conversion

The backend uses:
1. Pandoc/pypandoc for high-quality document conversion
2. Custom templates for consistent styling
3. Fallback mechanisms if primary conversion methods fail

## Development Workflow

This project uses a monorepo approach for easier development with AI coding tools:
1. Both frontend and backend code are in a single GitHub repository
2. This provides better context for AI coding assistants like Cursor
3. The structure allows for easier end-to-end testing and development

## Getting Started

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # Unix/macOS
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Set up document conversion tools
sudo ./setup_doc_conversion.sh

# Run the server
uvicorn main:app --reload
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## Key Files Overview

### Frontend

- `src/App.jsx`: Main application component
- `src/components/ChatWindow.jsx`: Chat interface
- `src/components/ArtifactPanel.jsx`: Artifact editor and preview
- `src/components/Sidebar.jsx`: Navigation sidebar
- `src/components/Header.jsx`: Application header
- `src/hooks/useArtifacts.js`: Artifact management hook
- `src/hooks/useChatSession.js`: Chat session management hook

### Backend

- `main.py`: Application entry point
- `routes/`: API endpoints
- `services/claude_service.py`: Claude AI integration
- `services/askbill_service.py`: AskBill MCP server integration
- `utils/document_converter.py`: Document format conversion
- `utils/url_validator.py`: URL validation for documentation links

## Future Enhancements

1. **Enhanced Document Templates**: Custom cover pages and branding
2. **Collaborative Editing**: Real-time collaboration on artifacts
3. **Version History**: Track changes to artifacts over time
4. **Enhanced Diagram Support**: More diagram types and styling options
5. **Integration with Version Control**: Direct publishing to Git repositories

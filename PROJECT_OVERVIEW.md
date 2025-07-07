# Plaid Solution Guide - Technical Architecture

## System Architecture

The application follows a modern full-stack architecture with AI integration and external service dependencies.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│  FastAPI Backend│────▶│   Claude AI     │
│                 │     │                 │     │   (Anthropic)   │
│  - Vite         │     │  - Python 3.11+ │     │                 │
│  - TailwindCSS  │     │  - JWT Auth      │     └─────────────────┘
│  - React 18     │     │  - Async/Await   │              │
└─────────────────┘     └─────────────────┘              │
         │                      │                        │
         │                      ▼                        │
         │              ┌─────────────────┐              │
         │              │  AskBill MCP    │◀─────────────┘
         └────────────▶│  Server         │
                        │  (Plaid Docs)   │
                        └─────────────────┘
```

## Technical Stack

### Frontend
- **Runtime**: Node.js 18+
- **Build Tool**: Vite 4.x
- **Framework**: React 18.2+ with Hooks API
- **Styling**: TailwindCSS 3.x with custom color palette
- **State Management**: React Context + useState/useReducer patterns
- **HTTP Client**: Axios with interceptors for auth
- **Markdown**: ReactMarkdown + remark/rehype plugins
- **Diagrams**: Mermaid.js integration
- **Icons**: Lucide React
- **Document Export**: Client-side PDF generation via backend APIs

### Backend
- **Runtime**: Python 3.11+
- **Framework**: FastAPI 0.104+ with async/await
- **Authentication**: JWT with HS256 algorithm
- **Document Processing**: Pandoc + pypandoc for format conversion
- **AI Integration**: Anthropic Claude API (Claude-3.5-Sonnet)
- **MCP Integration**: WebSocket connection to AskBill server
- **Process Management**: Uvicorn ASGI server
- **Dependencies**: Pydantic for data validation, aiofiles for async file operations

## Data Flow Architecture

### Authentication Flow
```
Frontend → POST /auth/login → Backend → JWT Token → Local Storage
Frontend → Authorization Header → Protected Routes → JWT Validation
```

### Chat Message Flow
```
User Input → ChatWindow Component → POST /chat → Backend
↓
Backend → AskBill MCP Query (if Plaid-related)
↓
Backend → Claude AI API → Enhanced Response
↓
Frontend → Message Rendering → Artifact Creation Option
```

### Artifact Management Flow
```
Chat Message → Create Artifact → Backend Storage → Frontend State Update
↓
Edit Mode → Real-time Preview → Auto-save → Version Management
↓
Export Request → Backend Conversion → File Download
```

## Component Architecture

### Frontend Component Hierarchy
```
App.jsx (Root State Management)
├── Header.jsx (Global Controls)
├── WorkspaceSidebar.jsx (Navigation)
│   ├── Chat Sessions List
│   ├── Artifact Groups
│   └── Admin Controls
├── ChatWindow.jsx (AI Interaction)
│   ├── Message.jsx (Individual Messages)
│   ├── TemplateSelector.jsx (Template System)
│   └── Response Mode Toggle
└── ArtifactPanel.jsx (Document Editor)
    ├── ArtifactEditor.jsx (Markdown Editor)
    ├── ArtifactPreview.jsx (Live Preview)
    └── Export Controls
```

### Backend Module Structure
```
main.py (FastAPI App)
├── routes/
│   ├── auth.py (JWT Authentication)
│   ├── chat.py (Claude AI Integration)
│   ├── artifacts.py (CRUD Operations)
│   └── admin.py (User Management)
├── services/
│   ├── claude_service.py (AI API Client)
│   ├── askbill_service.py (MCP WebSocket Client)
│   └── auth_service.py (JWT Operations)
├── utils/
│   ├── document_converter.py (Pandoc Integration)
│   ├── url_validator.py (Link Validation)
│   └── plaid_field_index.py (API Reference)
└── models/
    ├── user.py (User Schema)
    ├── chat.py (Message/Session Schema)
    └── artifact.py (Document Schema)
```

## State Management

### Frontend State Architecture
- **Global State**: React Context for user authentication, current session
- **Component State**: Local useState for UI interactions, form data
- **Persistent State**: localStorage for user preferences, session data
- **Server State**: Custom hooks with axios for API state management

### Backend State Management
- **In-Memory**: Active chat sessions, user sessions
- **File System**: Artifact storage, user data persistence
- **Process State**: MCP connection management, AI request queuing

## API Design

### REST Endpoints
```
POST   /auth/login                    # User authentication
GET    /auth/me                       # Current user info
POST   /chat                          # Send chat message
GET    /chat/sessions                 # List user sessions
POST   /artifacts                     # Create artifact
PUT    /artifacts/{id}                # Update artifact
GET    /artifacts/{id}/export/{format} # Export artifact
DELETE /artifacts/{id}               # Delete artifact
GET    /admin/users                   # List users (admin)
POST   /admin/users                   # Create user (admin)
```

### WebSocket Connections
- **MCP Server**: Persistent connection for Plaid documentation queries
- **Future**: Real-time collaboration on artifacts

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: HS256 algorithm with configurable expiration
- **Role-based Access**: USER, ADMIN roles with permission checks
- **Route Protection**: Frontend route guards + backend middleware
- **Secret Management**: Environment variables for sensitive data

### Data Validation
- **Frontend**: Form validation with React Hook Form patterns
- **Backend**: Pydantic models for request/response validation
- **Sanitization**: Markdown content sanitization for XSS prevention

## Performance Considerations

### Frontend Optimizations
- **Code Splitting**: Lazy loading of non-critical components
- **Memoization**: React.memo for expensive renders
- **Virtual Scrolling**: For large chat histories and artifact lists
- **Debounced API Calls**: For real-time search and auto-save

### Backend Optimizations
- **Async Operations**: All I/O operations use async/await
- **Connection Pooling**: Reuse HTTP connections to external APIs
- **Caching Strategy**: Response caching for frequently accessed data
- **Process Management**: Efficient handling of document conversion

## Integration Points

### External Services
- **Anthropic Claude API**: Rate-limited AI text generation
- **AskBill MCP Server**: WebSocket connection for Plaid docs
- **Pandoc**: System dependency for document conversion

### File System Dependencies
- **Document Storage**: Local file system for artifact persistence
- **Template Storage**: Pandoc templates for document formatting
- **User Data**: JSON files for user and session storage

## Development Architecture

### Build Process
- **Frontend**: Vite build with TypeScript checking disabled
- **Backend**: Direct Python execution with hot reload
- **Development**: Concurrent frontend/backend servers
- **Production**: Static frontend serving + FastAPI backend

### Environment Management
- **Configuration**: Environment variables for API keys, secrets
- **Development**: Local .env files with development defaults
- **Production**: Environment-specific configuration injection

## Deployment Architecture

### Development Environment
- **Frontend**: Vite dev server (http://localhost:3000)
- **Backend**: Uvicorn dev server (http://localhost:8000)
- **MCP Server**: External service connection

### Production Considerations
- **Frontend**: Static file serving (Nginx/Apache)
- **Backend**: ASGI server (Uvicorn + Gunicorn)
- **Process Management**: Supervisor or systemd for service management
- **Document Conversion**: Pandoc system installation required

## Scalability Considerations

### Current Limitations
- **Single User Session**: No concurrent user support in current design
- **File System Storage**: Local storage limits horizontal scaling
- **Synchronous Document Conversion**: Blocking operations for large documents

### Future Scaling Options
- **Database Integration**: PostgreSQL/MongoDB for persistent storage
- **Message Queues**: Redis/RabbitMQ for async document processing
- **Container Deployment**: Docker containerization for easy scaling
- **Load Balancing**: Multiple backend instances with shared storage
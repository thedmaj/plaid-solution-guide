# Plaid Solution Guide Assistant

A modern application that integrates Claude AI with Plaid documentation to help Sales Engineers create custom solution guides.

## Features

- 🤖 AI-powered solution guide creation using Claude AI
- 📚 Access to Plaid documentation via AskBill MCP Server
- 📝 Generate, edit, and download artifacts in multiple formats (Markdown, DOCX, PDF)
- 💬 Conversational interface with chat memory
- 🔄 Seamless integration between Claude AI and AskBill

## Architecture

The application consists of the following components:

1. **Frontend**: React application with modern UI using Tailwind CSS
2. **Backend**: FastAPI server that handles:
   - Communication with Claude API
   - Connection to AskBill MCP server
   - Artifact generation and conversion
   - Session management
3. **AskBill Client**: WebSocket client for connecting to Plaid's documentation service

## Prerequisites

- Python 3.10+
- Node.js 18+
- Plaid VPN access (required for AskBill service)
- Anthropic API key (for Claude AI)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy the example .env file and update with your Anthropic API key:
   ```bash
   cp .env.example .env
   # Edit .env to add your Anthropic API key
   ```

5. Run the backend server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Deploying to Heroku

### Backend Deployment

1. Create a new Heroku app:
   ```bash
   heroku create plaid-solution-guide
   ```

2. Set environment variables:
   ```bash
   heroku config:set ANTHROPIC_API_KEY=your_api_key
   heroku config:set ASKBILL_URL=wss://hello-finn.herokuapp.com/
   ```

3. Deploy the backend:
   ```bash
   git subtree push --prefix backend heroku main
   ```

### Frontend Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Copy the build files to the backend static directory:
   ```bash
   cp -r build/* ../backend/static/app/
   ```

3. Deploy the combined application:
   ```bash
   cd ../backend
   git add .
   git commit -m "Add frontend build"
   git push heroku main
   ```

## Usage

1. Sign in to the application
2. Start a new chat or continue an existing one
3. Ask questions about Plaid's APIs or request solution guides
4. Save important responses as artifacts
5. Edit artifacts as needed
6. Download artifacts in your preferred format (Markdown, DOCX, PDF)

## Customizing Claude's Behavior

The `claude_config.json` file contains system prompts and parameters that control how Claude responds to user queries. You can customize this to better suit your specific use case.

Key configuration options:
- `system_prompt`: The instructions given to Claude
- `temperature`: Controls the randomness of Claude's responses (0.0 = deterministic, 1.0 = creative)
- `mcpTools`: Defines which MCP tools are available to Claude

## Future Enhancements

- Add authentication with Plaid SSO
- Implement collaborative editing of artifacts
- Add support for more document formats
- Enhance the UI with more customization options
- Add analytics to track usage patterns

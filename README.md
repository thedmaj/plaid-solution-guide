# Plaid Solution Guide Generator

**AI-Powered Solution Guide Creation for Sales Engineers**

A sophisticated application that combines the power of AskBill MCP service, Knowledge Templates, and Claude AI to generate comprehensive, accurate solution guides for Plaid's customers. Designed specifically for Sales Engineers to quickly create professional documentation and implementation guides.

## 🚀 Overview

The Plaid Solution Guide Generator is an intelligent assistant that helps Sales Engineers create detailed, accurate solution guides by leveraging three key technologies:

- **AskBill MCP Service**: Real-time access to current Plaid documentation
- **Knowledge Templates**: Expert-curated, authoritative content for specific use cases
- **Claude AI**: Intelligent content generation and enhancement

## 🎯 Key Features

### ✨ **Intelligent Content Generation**
- **Auto-Generated Solution Guides**: Creates comprehensive guides based on customer requirements
- **Smart Title Generation**: Automatically generates descriptive titles like "Identity Verification" or "Plaid Link + Auth Integration"
- **Real-time Documentation**: Always uses the latest Plaid API documentation via AskBill

### 📝 **Template System**
- **Knowledge Templates**: Pre-validated expert content for complex implementations
- **Format Templates**: Standardized structures for consistent documentation
- **Custom Templates**: Create and save your own reusable templates

### 🔄 **Response Modes**
- **Chat Only Mode**: Standard conversational responses
- **Merge Response Mode**: Automatically merges responses into living documents
- **Artifact Creation**: Generates standalone documents that can be exported

### 🎨 **Advanced Features**
- **Session Workspaces**: Organize related artifacts and conversations
- **Version Control**: Track changes and updates to solution guides
- **Smart Merging**: Intelligently combine new information with existing content
- **Export Capabilities**: Download guides in multiple formats

## 🧠 How It Works

### The AI Trinity: AskBill + Knowledge Templates + Claude

```mermaid
graph TD
    A[User Request] --> B{Template Selected?}
    B -->|Knowledge Template| C[Use Expert Knowledge]
    B -->|No Template| D[Query AskBill MCP]
    D --> E[Get Latest Plaid Docs]
    E --> F[Send to Claude AI]
    C --> G[Send to Claude AI]
    F --> H[Generate Solution Guide]
    G --> H
    H --> I[Create/Update Artifact]
    I --> J[Display in Interface]
```

### **1. AskBill MCP Service Integration**
- **Real-time Documentation Access**: Connects to Plaid's internal documentation system
- **URL Validation**: Ensures all links and references are current and accurate
- **API Coverage**: Comprehensive access to all Plaid APIs and endpoints
- **Always Current**: Never uses outdated information

### **2. Knowledge Templates**
- **Expert-Curated Content**: Pre-validated by Plaid experts for accuracy
- **Complex Use Cases**: Perfect for intricate implementations requiring specific guidance
- **Authoritative Source**: Takes precedence over general AI knowledge when conflicts arise
- **Structured Approach**: Ensures consistent, professional output

### **3. Claude AI Enhancement**
- **Intelligent Processing**: Transforms raw documentation into polished guides
- **Context Understanding**: Grasps complex technical requirements and customer needs
- **Professional Formatting**: Creates well-structured, readable documentation
- **Adaptive Responses**: Tailors content based on technical level and requirements

## 📋 Template Selection Guide

### **Knowledge Templates** 🧠
*Use when you need expert-validated, authoritative guidance*

**When to Use:**
- Complex implementations requiring specific technical approaches
- Regulatory compliance scenarios (KYC, AML, etc.)
- Multi-product integrations with specific architectural patterns
- Critical customer implementations where accuracy is paramount

**Examples:**
- "CRA Base Report Implementation"
- "Identity + Income Verification Workflow"
- "Multi-tenant Plaid Link Architecture"

**Benefits:**
- ✅ Expert-validated content
- ✅ Authoritative and accurate
- ✅ Handles complex scenarios
- ✅ Consistent methodology

### **Format Templates** 📝
*Use for standardized document structures*

**When to Use:**
- Quick solution guides with consistent formatting
- Standard implementation patterns
- Documentation that follows company templates
- Repetitive use cases with similar structures

**Examples:**
- "Solution Guide Template"
- "Integration Checklist Format"
- "API Reference Template"

**Benefits:**
- ✅ Consistent formatting
- ✅ Quick generation
- ✅ Professional appearance
- ✅ Reusable structures

### **No Template** 🎯
*Use for custom, flexible responses*

**When to Use:**
- Unique customer requirements
- Exploratory conversations
- Custom implementations
- When you need maximum flexibility

**Benefits:**
- ✅ Maximum flexibility
- ✅ Current documentation via AskBill
- ✅ Adaptive to any request
- ✅ Real-time information

## ⚙️ Response Modes

### **Chat Only Mode** 💬
- Standard conversational interface
- Responses appear only in chat
- No automatic document creation
- Best for: Quick questions, clarifications, brainstorming

### **Merge Response Mode** 🔄
- Automatically creates and updates solution guide documents
- Builds comprehensive guides over multiple exchanges
- Each response enhances the living document
- Best for: Building comprehensive solution guides, iterative development

**Pro Tip**: Start in Merge Mode when you want to build a comprehensive guide that will evolve throughout your conversation.

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- Git
- **Anthropic API Key** (required for Claude AI)
- **Plaid VPN Access** (required for AskBill MCP service)

### 🔑 Environment Setup (Required First!)

**Before installation, you need to obtain required API keys:**

#### **1. Get Anthropic API Key**
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Create a new API key
5. Copy the key (starts with `sk-ant-api03-`)

#### **2. Verify Plaid VPN Access**
- Ensure you're connected to Plaid VPN
- AskBill MCP service requires internal network access
- Test connectivity to internal documentation service

### 🚀 Quick Install Script

The installation script is included in the repository. To run it:

```bash
# Make the script executable (if needed)
chmod +x install-plaid-guide.sh

# Run the installation script
./install-plaid-guide.sh
```

The script will automatically install all dependencies including:

**Backend Dependencies:**
- **SQLAlchemy** - Database operations and ORM
- **FastAPI & Uvicorn** - Modern web framework and ASGI server
- **python-jose & cryptography** - JWT authentication and security
- **passlib & bcrypt** - Password hashing and verification
- **anthropic** - Claude AI client library
- **httpx & aiohttp** - HTTP clients for API calls
- **python-dotenv** - Environment variable management
- **pydantic** - Data validation and settings management
- **python-multipart** - File upload support
- **markdown** - For processing markdown content
- **PyJWT** - For JWT token handling
- **websockets** - For WebSocket communication
- **jinja2** - For HTML templating

**Frontend Dependencies:**
- **React 18+** - Modern UI framework
- **React Query** - Server state management
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons

### Installation Script Example:

```bash
#!/bin/bash

echo "🚀 Installing Plaid Solution Guide Generator..."
echo "================================================"

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Please install Node.js 16+ first."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Please install Python 3.8+ first."
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "❌ Git is required. Please install Git first."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Clone repository
echo "📥 Cloning repository..."
git clone https://github.com/your-org/plaid-solution-guide.git
cd plaid-solution-guide

# Setup backend
echo "🔧 Setting up backend..."
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py

echo "✅ Backend setup complete!"

# Setup frontend
echo "🎨 Setting up frontend..."
cd ../frontend

# Install Node dependencies
npm install

echo "✅ Frontend setup complete!"

# Create launch script
echo "🚀 Creating launch script..."
cd ..

cat > launch.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Plaid Solution Guide Generator..."
echo "============================================="

# Start backend
echo "🔧 Starting backend server..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to initialize
sleep 3

# Start frontend
echo "🎨 Starting frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "🎉 Application is starting up!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8000"
echo ""
echo "⏳ Please wait a moment for both services to fully load..."
echo "🌐 Your browser should open automatically to http://localhost:3000"
echo ""
echo "To stop the application, press Ctrl+C"

# Store PIDs for cleanup
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# Wait for interrupt
trap 'echo "🛑 Stopping application..."; kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait
EOF

chmod +x launch.sh

echo ""
echo "🎉 Installation Complete!"
echo "=========================="
echo ""
echo "🚀 To start the application, run:"
echo "   ./launch.sh"
echo ""
echo "📖 The application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo ""
echo "🔐 Default login credentials:"
echo "   Email: admin@example.com"
echo "   Password: admin123"
echo ""
echo "📚 See README.md for detailed usage instructions"
```

### Manual Installation (Alternative)

If you prefer manual installation:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/plaid-solution-guide.git
   cd plaid-solution-guide
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Configure environment
   cp .env.sample .env
   # Edit .env with your API keys (see configuration section below)
   
   python init_db.py
   ```

3. **Setup Frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

### 🎮 Easy Launch

After installation, use the generated launch script:

```bash
./launch.sh
```

This single command will:
- Start the backend server on port 8000
- Start the frontend development server on port 3000
- Open your browser automatically
- Handle graceful shutdown with Ctrl+C

## 🎯 Getting Started

### 1. **Login**
- **Default Credentials:**
  - Email: `admin@example.com`
  - Password: `admin123`

### 2. **Choose Your Workflow**

#### **For Quick Questions:**
- Set Response Mode to **"Chat Only"**
- Don't select a template
- Ask questions directly

#### **For Building Solution Guides:**
- Set Response Mode to **"Merge Response"**
- Select appropriate template (Knowledge or Format)
- Start with your requirements

### 3. **Template Selection Strategy**

| Scenario | Template Type | Example |
|----------|---------------|---------|
| Complex regulatory implementation | Knowledge Template | "CRA Base Report Implementation" |
| Standard integration | Format Template | "Solution Guide Template" |
| Custom/unique requirement | No Template | Direct conversation |
| Multi-product workflow | Knowledge Template | "Identity + Income Verification" |

### 4. **Best Practices**

#### **For Maximum Accuracy:**
- Use Knowledge Templates for well-defined use cases
- Provide specific customer requirements upfront
- Mention compliance requirements early

#### **For Speed:**
- Use Format Templates for standard implementations
- Start in Merge Mode to build comprehensive guides
- Leverage auto-generated titles

#### **For Flexibility:**
- Use No Template for exploratory conversations
- Switch between modes as needed
- Iterate and refine through conversation

## 🏗️ Architecture

### Frontend (React)
- **Modern UI**: Clean, professional interface designed for Sales Engineers
- **Real-time Updates**: Live session title updates, immediate artifact creation
- **Template Management**: Easy template selection and management
- **Workspace Organization**: Session-based artifact organization

### Backend (FastAPI)
- **Claude AI Integration**: Direct integration with Anthropic's Claude API
- **AskBill MCP Client**: Real-time connection to Plaid documentation
- **Smart Merging**: AI-powered content merging with anti-truncation rules
- **Database Management**: SQLite for session and user management

### Key Integration Points
1. **AskBill → Claude**: Documentation context enhancement
2. **Knowledge Templates → Claude**: Expert content integration
3. **Claude → Artifacts**: Intelligent document generation
4. **React Query**: Real-time UI updates and caching

## 🔧 Configuration

### 🔑 Environment Variables Setup

After installation, you **must** configure the environment variables:

#### **Step 1: Copy Sample Environment File**
```bash
cd backend
cp .env.sample .env
```

#### **Step 2: Edit .env File**
Open `backend/.env` and configure the required variables:

```bash
# REQUIRED: Your Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-api03-your_actual_key_here

# REQUIRED: AskBill MCP Service URL
ASKBILL_URL=wss://hello-finn.herokuapp.com/

# REQUIRED: JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET_KEY=your_secure_random_key_here

# Optional: Other settings (defaults usually work)
CLAUDE_MODEL=claude-3-5-sonnet-20241022
PORT=8000
DATABASE_URL=sqlite:///./plaid_guide.db
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

#### **Step 3: Generate Secure JWT Secret**
```bash
# Generate a secure JWT secret key
openssl rand -hex 32

# Or use this Python command
python3 -c "import secrets; print(secrets.token_hex(32))"
```

#### **Critical Configuration Notes:**
- ❌ **Application will NOT work without ANTHROPIC_API_KEY**
- ❌ **Documentation features require ASKBILL_URL and VPN access**
- ⚠️ **Never commit .env file to version control**
- 🔒 **Use strong JWT_SECRET_KEY in production**

### Verification

Test your configuration:
```bash
# Test API key (should return model info)
curl -H "x-api-key: $ANTHROPIC_API_KEY" https://api.anthropic.com/v1/models

# Test backend startup
cd backend && source venv/bin/activate && python main.py
```

**Claude Configuration (claude_config.json):**
```json
{
  "system_prompt": "You are Claude, an AI specialized in creating professional solution guides for Plaid Sales Engineers...",
  "temperature": 0.1,
  "max_tokens": 4000
}
```

## 🎨 User Interface Guide

### **Sidebar Navigation**
- **Chats Tab**: Browse conversation history with auto-generated titles
- **Artifacts Tab**: Access all created documents and guides
- **Session Workspaces**: Organized view of related artifacts

### **Chat Interface**
- **Template Selector**: Choose Knowledge, Format, or No Template
- **Response Mode Toggle**: Switch between Chat Only and Merge Response
- **Message Actions**: Copy responses, view artifact icons

### **Artifact Panel**
- **Live Document View**: See your solution guide build in real-time
- **Version Control**: Track changes and updates
- **Export Options**: Download in multiple formats

## 🔄 Workflow Examples

### **Example 1: Identity Verification Guide**
1. Select **Knowledge Template**: "Identity Verification Workflow"
2. Set **Response Mode**: "Merge Response"
3. Ask: "Create a guide for implementing identity verification for a fintech customer"
4. Watch as a comprehensive guide builds automatically
5. Add specific requirements: "Include KYC compliance requirements"
6. Export the final guide

### **Example 2: Quick API Question**
1. Select **No Template**
2. Set **Response Mode**: "Chat Only"
3. Ask: "What's the difference between /accounts/get and /accounts/balance/get?"
4. Get immediate, current documentation via AskBill

### **Example 3: Custom Integration**
1. Select **Format Template**: "Solution Guide Template"
2. Set **Response Mode**: "Merge Response"
3. Describe unique customer requirements
4. Iterate and refine through conversation
5. Build a tailored solution guide

## 🚨 Troubleshooting

### Common Issues

**❌ Application won't start or shows errors:**
- **Missing API Key**: Check `ANTHROPIC_API_KEY` in `backend/.env`
- **Invalid JWT Secret**: Ensure `JWT_SECRET_KEY` is set and secure
- **Environment File**: Verify `backend/.env` exists and is properly configured
- **API Key Format**: Anthropic keys start with `sk-ant-api03-`

**❌ Backend won't start:**
- Check Python version (3.8+ required)
- Verify virtual environment activation: `source backend/venv/bin/activate`
- Check if port 8000 is available: `lsof -i :8000`
- Verify `.env` file exists in `backend/` directory
- Check backend logs for specific error messages

**❌ Frontend won't start:**
- Check Node.js version (16+ required)
- Try deleting `node_modules` and running `npm install` again
- Check if port 3000 is available: `lsof -i :3000`
- Clear npm cache: `npm cache clean --force`

**❌ AskBill connection issues:**
- Verify Plaid VPN connection is active
- Check `ASKBILL_URL` configuration in `.env`
- Test WebSocket connectivity to the MCP server
- Ensure you have access to internal Plaid services

**❌ Authentication issues:**
- Use default credentials: `admin@example.com` / `admin123`
- Clear browser cache and cookies
- Check backend logs for authentication errors
- Verify `JWT_SECRET_KEY` is properly configured

**❌ Claude AI not responding:**
- Verify `ANTHROPIC_API_KEY` is correct and active
- Check your Anthropic account has available credits
- Test API key: `curl -H "x-api-key: YOUR_KEY" https://api.anthropic.com/v1/models`

### Setup Verification

Run the verification script to check your installation:
```bash
./verify-setup.sh
```

This will check:
- ✅ Prerequisites (Node.js, Python, Git)
- ✅ Backend setup (virtual environment, .env configuration)
- ✅ Frontend setup (dependencies)
- ✅ API key configuration
- ✅ Port availability

### Getting Help

1. **Run verification**: Use `./verify-setup.sh` to diagnose issues
2. **Check the logs**: Both frontend and backend provide detailed logging
3. **Verify configuration**: Ensure all environment variables are set
4. **Test connectivity**: Verify AskBill and Claude API access
5. **Restart services**: Use `./launch.sh` to restart both services

## 📞 Support

For technical support or questions:
- Check the troubleshooting section above
- Review backend logs for error details
- Verify all prerequisites are installed
- Ensure proper API keys and configurations

---

**Happy Solution Guide Generation! 🎉**

*This application is designed to make Sales Engineers more productive by leveraging the combined power of AI and authoritative documentation.*
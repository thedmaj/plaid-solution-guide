# Plaid Solution Guide Generator

**AI-Powered Solution Guide Creation for Sales Engineers**

An application that combines the power of AskBill MCP service, Knowledge Templates, and Claude AI to rapidly generate comprehensive solution guides. Designed specifically for Sales Engineers to quickly create bespoke PreSales assets and documentation.

## 🚀 Overview

The Plaid Solution Guide Generator is an intelligent assistant that helps Sales Engineers create solution guides by leveraging three key technologies:

- **AskBill MCP Service**: Real-time access to current Plaid documentation
- **Knowledge Templates**: Expert-curated, authoritative content for specific use cases that override the AskBill MCP Service when used
- **Format Templates**: Override the system prompt default format and create your own templates for AI instructions for each section
- **Claude AI**: Intelligent content generation and enhancement

## 🚀 Quickstart

Get up and running in minutes with these simple steps:

### **Prerequisites**
- Node.js 16+ and npm
- Python 3.8+
- Git
- **Anthropic API Key** (required for Claude AI)
- **Plaid VPN Access** (required for AskBill MCP service)

### **Step 1: Open Terminal**
**On Mac:**
- Press `Cmd + Space` and type "Terminal"
- Or go to Applications → Utilities → Terminal

**On Windows:**
- Press `Win + R`, type `cmd`, and press Enter
- Or search for "Command Prompt" in Start menu

**On Linux:**
- Press `Ctrl + Alt + T`
- Or search for "Terminal" in your applications

### **Step 2: Clone the Repository**
```bash
git clone https://github.com/thedmaj/plaid-solution-guide.git
cd plaid-solution-guide
```

### **Step 3: Get Your API Key**
1. **Login to Anthropic console through Okta homepage and generate an API key** or obtain an API key from a team member
2. If generating yourself: Navigate to **API Keys** section in [Anthropic Console](https://console.anthropic.com/)
3. Create a new API key
4. Copy the key (starts with `sk-ant-api03-`)
5. **Keep this key safe** - you'll need it in Step 6

### **Step 4: Run Installation Script**
```bash
chmod +x install-plaid-guide.sh
./install-plaid-guide.sh
```

### **Step 5: Configure Environment**
```bash
# Copy the sample environment file
cp backend/.env.sample backend/.env

# Generate a secure JWT secret key
openssl rand -hex 32
```

### **Step 6: Edit Configuration**
1. **Find .env file**: `backend/.env` (use `Cmd + Shift + .` on Mac to see hidden files)
2. **Edit the file** with your preferred text editor
3. **Add your API key**: Replace `your_anthropic_api_key_here` with your actual key
4. **Add JWT secret**: Replace `your_jwt_secret_key_here` with the generated key from Step 5
5. **Save the file**

### **Step 7: Launch the Application**
```bash
chmod +x launch.sh
./launch.sh
```

### **Step 8: Access the Application**
- **Frontend**: http://localhost:3000 (opens automatically)
- **Backend**: http://localhost:8000
- **Default Login**: admin@example.com / admin123

🎉 **You're ready to go!** The application will start both frontend and backend servers automatically.

---

## 🎯 Key Features


### 🔄 **Response Modes**
- **Chat Only Mode**: Standard conversational responses
- **Merge Response Mode**: Automatically merges responses into a session artifact in markdown format 
- **Artifact Creation**: Generates standalone documents that can be exported

### 🎨 **Advanced Features**
- **Session Workspaces**: Organize related artifacts and conversations
- **Version Control**: Track changes and updates to solution guides
- **Smart Merging**: Intelligently combine new information with existing content
- **Export Capabilities**: Download or copy/paste artifacts 

## 🧠 How It Works

### The AI Trinity: AskBill + Knowledge Templates + Claude

```mermaid
graph TD
    A[User Request] --> B{Template Selected?}
    B -->|Knowledge Template| C[Use Expert Knowledge]
    B -->|Format Template| K[Apply Format Structure]
    B -->|No Template| D[Query AskBill MCP]
    
    D --> E[Get Latest Plaid Docs]
    E --> F[Send to Claude AI]
    
    C --> G[Send to Claude AI]
    
    K --> O[Query AskBill for Content]
    O --> P[Send Formatted Content to Claude AI]
    
    F --> H[Generate Solution Guide]
    G --> H
    P --> H
    
    H --> I[Create/Update Artifact]
    I --> J[Display in Interface]
```

### AskBill Direct Mode - Detailed Sequence

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant AskBill
    participant Claude
    
    User->>Frontend: Submit question
    Frontend->>Backend: POST /api/chat/stream
    
    Note over Backend: Step 1: Query AskBill
    Backend->>AskBill: WebSocket connection
    AskBill-->>Backend: Documentation response
    
    Note over Backend: Step 2: Enhance with Claude
    Backend->>Claude: Enhanced prompt with AskBill context
    Claude-->>Backend: Generated solution guide
    
    Backend-->>Frontend: Complete response
    Frontend-->>User: Display solution guide
    
    Note over Frontend,Backend: Merge Response Mode
    Frontend->>Backend: POST /api/artifacts (if enabled)
    Backend-->>Frontend: Artifact created/updated
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
- Circumvent AskBill and use an authoritative source
- Where accuracy is paramount 


**Benefits:**
- ✅ Expert-validated content
- ✅ Authoritative and accurate
- ✅ Handles complex scenarios
- ✅ Consistent methodology

### **Format Templates** 📝
*Use for standardized document structures*

**When to Use:**
- When you want to create your own solution guide structure 



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

## 📝 Detailed Configuration Guide

### ⚠️ Important: Virtual Environment Required

**This application MUST be run in a Python virtual environment.** The setup process will automatically create and configure a virtual environment for you. Never install the Python dependencies globally - this can cause conflicts with other Python projects on your system.

### 🔑 Alternative JWT Key Generation Methods

If `openssl` is not available, you can generate a JWT secret key using these alternative methods:

**Option 1 - Python:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Option 2 - Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**The generated key** will be a 64-character string like:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

#### **Step B: Find and Open the .env File**

**📍 Where is the .env file?**
- **Full path**: `your-project-folder/backend/.env`
- **The file is HIDDEN** (starts with a dot)

**🔍 How to see hidden files on Mac:**
1. **Open Finder**
2. **Navigate to your project folder → backend**
3. **Press `Cmd + Shift + .` (period key)** to show hidden files
4. **You should now see `.env` file**

**📂 Alternative - Use Terminal:**
```bash
# Navigate to your project
cd /path/to/your/plaid-solution-guide/backend

# List files including hidden ones
ls -la

# Open .env with TextEdit
open -a TextEdit .env
```

#### **Step C: Edit the .env File**

**📝 How to edit:**
1. **Right-click** on `.env` file
2. **Select "Open With"** → **TextEdit** (or your preferred editor)
3. **Find these lines and replace the placeholder values:**

```bash
# Replace this line:
ANTHROPIC_API_KEY=your_anthropic_api_key_here
# With your actual key:
ANTHROPIC_API_KEY=sk-ant-api03-your_actual_key_here

# Replace this line:
JWT_SECRET_KEY=your_secure_random_key_here  
# With your generated key:
JWT_SECRET_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**💾 Save the file:** Press `Cmd + S`

#### **Step D: Verify Your Configuration**

Your `.env` file should look like this (with your actual keys):

```bash
# REQUIRED: Your Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-api03-HT8x9K2LmF3QrV7nY1dZ6wS4uE5tG8hJ9kM2pN3xR4qT6vW8yA1bC3dF5gH7j

# REQUIRED: AskBill MCP Service URL  
ASKBILL_URL=wss://hello-finn.herokuapp.com/

# REQUIRED: JWT Secret (your generated key)
JWT_SECRET_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456

# Optional: Other settings (leave these as-is)
CLAUDE_MODEL=claude-3-5-sonnet-20241022
PORT=8000
DATABASE_URL=sqlite:///./plaid_guide.db
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

**✅ Configuration Checklist:**
- [ ] ANTHROPIC_API_KEY starts with `sk-ant-api03-`
- [ ] JWT_SECRET_KEY is 64 characters long (letters and numbers only)
- [ ] No spaces around the `=` signs
- [ ] File saved in `backend/.env`

### 🚀 Quick Install Script (Recommended)

The installation script is included in the repository and **automatically handles virtual environment setup**. To run it:

```bash
# Make the script executable (if needed)
chmod +x install-plaid-guide.sh

# Run the installation script
./install-plaid-guide.sh
```

The script will automatically:
- ✅ Create a Python virtual environment
- ✅ Install all Python dependencies in the virtual environment
- ✅ Install all Node.js dependencies
- ✅ Initialize the database
- ✅ Create the launch script

The script installs all dependencies including:

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

If you prefer manual installation, **follow these steps exactly** to ensure proper virtual environment setup:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/plaid-solution-guide.git
   cd plaid-solution-guide
   ```

2. **Setup Backend with Virtual Environment:**
   ```bash
   cd backend
   
   # Create virtual environment (REQUIRED)
   python3 -m venv venv
   
   # Activate virtual environment (REQUIRED)
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install Python dependencies (in virtual environment)
   pip install -r requirements.txt
   
   # Configure environment
   cp .env.sample .env
   # Edit .env with your API keys (see configuration section below)
   
   # Initialize database
   python init_db.py
   ```

3. **Setup Frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

**⚠️ Critical Note:** You must activate the virtual environment (`source venv/bin/activate`) every time you work with the backend. The launch script handles this automatically.

### 🎮 Easy Launch

After installation, use the generated launch script:

```bash
./launch.sh
```

**📍 Launch Script Location:** `launch.sh` (in the project root directory)

This single command will:
- ✅ **Automatically activate the virtual environment** (no manual activation needed)
- ✅ Start the backend server on port 8000
- ✅ Start the frontend development server on port 3000
- ✅ Open your browser automatically
- ✅ Handle graceful shutdown with Ctrl+C

**The launch script handles all virtual environment management for you - just run it and go!**

## 📁 Important File Locations

After installation, you'll need to know where key files are located:

### **Essential Files:**
- **🚀 Launch Script**: `launch.sh` (project root) - Start the application
- **⚙️ Install Script**: `install-plaid-guide.sh` (project root) - Run initial setup
- **🔧 Environment Template**: `backend/.env.sample` - Copy this to create your config
- **🔑 Your Config File**: `backend/.env` - Edit this with your API keys
- **📋 Requirements**: `backend/requirements.txt` - Python dependencies

### **Directory Structure:**
```
plaid-solution-guide/
├── launch.sh                    # 🚀 Main launch script
├── install-plaid-guide.sh       # ⚙️ Setup script
├── backend/
│   ├── .env.sample             # 🔧 Configuration template
│   ├── .env                    # 🔑 Your config (create this)
│   ├── requirements.txt        # 📋 Python dependencies
│   └── main.py                 # Backend server
├── frontend/
│   ├── package.json           # Node.js dependencies
│   └── src/                   # React application
└── README.md                  # This file
```

### **Quick Setup Checklist:**
1. ✅ Copy: `backend/.env.sample` → `backend/.env`
2. ✅ Edit: `backend/.env` with your API keys
3. ✅ Run: `./launch.sh` (from project root)

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

**📍 File Locations:**
- **Sample file**: `backend/.env.sample` (provided template)
- **Your config file**: `backend/.env` (copy and edit this)
- **Launch script**: `launch.sh` (in project root directory)
- **Install script**: `install-plaid-guide.sh` (in project root directory)

#### **Step 2: Locate and Edit .env File**

**📍 File Location:**
The `.env` file is located at: `backend/.env` (inside the backend folder)

**💡 Mac Tip - Viewing Hidden Files:**
The `.env` file starts with a dot, making it hidden on Mac. To see hidden files:
- **In Finder**: Press `Cmd + Shift + .` (period) to toggle hidden files
- **Or use Terminal**: `open backend` then press `Cmd + Shift + .` in the opened folder

**✏️ Step-by-Step Editing:**

1. **Navigate to the backend folder** in your project
2. **Open the `.env` file** with any text editor:
   - **TextEdit**: Right-click → Open With → TextEdit
   - **VS Code**: `code backend/.env`
   - **Nano**: `nano backend/.env`

3. **Edit these required variables:**

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

**🔑 How to Add Your JWT Secret:**
1. **Generate the key** (see Step 3 below)
2. **Copy the generated key**
3. **Replace** `your_secure_random_key_here` with your actual key
4. **Save the file** (`Cmd + S` in most editors)

#### **Step 3: Generate Secure JWT Secret**

**Option 1: Using OpenSSL (Recommended)**
```bash
# Generate a secure JWT secret key
openssl rand -hex 32
```

**Option 2: Using Python**
```bash
# Generate using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Option 3: Using Node.js**
```bash
# Generate using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy the generated key** - it will look something like:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

#### **Step 4: Complete Your Configuration**

**📝 Example of a properly configured .env file:**
```bash
# REQUIRED: Your Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-api03-HT8x9K2LmF3QrV7nY1dZ6wS4uE5tG8hJ9kM2pN3xR4qT6vW8yA1bC3dF5gH7j

# REQUIRED: AskBill MCP Service URL
ASKBILL_URL=wss://hello-finn.herokuapp.com/

# REQUIRED: JWT Secret (your generated key)
JWT_SECRET_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456

# Optional: Other settings (defaults usually work)
CLAUDE_MODEL=claude-3-5-sonnet-20241022
PORT=8000
DATABASE_URL=sqlite:///./plaid_guide.db
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

#### **Critical Configuration Notes:**
- ❌ **Application will NOT work without ANTHROPIC_API_KEY**
- ❌ **Documentation features require ASKBILL_URL and VPN access**
- ⚠️ **Never commit .env file to version control**
- 🔒 **Use strong JWT_SECRET_KEY in production**
- 💾 **Always save the .env file after editing**

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
- **Can't find .env file**: Press `Cmd + Shift + .` in Finder to show hidden files
- **JWT key format**: Should be a 64-character hex string (no spaces or special characters)

**❌ Backend won't start:**
- Check Python version (3.8+ required)
- **Virtual environment issues:**
  - Verify virtual environment exists: `ls backend/venv`
  - If missing, run the install script again: `./install-plaid-guide.sh`
  - Never install dependencies globally - always use the virtual environment
- **Common virtual environment errors:**
  - `ModuleNotFoundError: No module named 'fastapi'` → Virtual environment not activated
  - `ModuleNotFoundError: No module named 'jwt'` → Missing PyJWT (run `pip install PyJWT` in activated venv)
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
- ✅ **Virtual environment setup and activation**
- ✅ **Python dependencies installed in virtual environment**
- ✅ Backend setup (.env configuration)
- ✅ Frontend setup (dependencies)
- ✅ API key configuration
- ✅ Port availability

**If verification fails, most issues are related to virtual environment setup. Re-run the install script to fix.**

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
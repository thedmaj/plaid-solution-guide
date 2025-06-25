#!/bin/bash

echo "🚀 Installing Plaid Solution Guide Generator..."
echo "================================================"

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Please install Node.js 16+ first."
    echo "🔗 Download from: https://nodejs.org/"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Please install Python 3.8+ first."
    echo "🔗 Download from: https://python.org/downloads/"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "❌ Git is required. Please install Git first."
    echo "🔗 Download from: https://git-scm.com/downloads"
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Get directory name from user or use default
read -p "📁 Enter installation directory name (default: plaid-solution-guide): " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-plaid-solution-guide}

# Clone repository (uncomment and update when actual repo is available)
# echo "📥 Cloning repository..."
# git clone https://github.com/your-org/plaid-solution-guide.git $INSTALL_DIR
# cd $INSTALL_DIR

# For now, assume we're already in the directory
if [ ! -f "package.json" ] && [ ! -f "backend/requirements.txt" ]; then
    echo "❌ This doesn't appear to be the Plaid Solution Guide directory."
    echo "Please run this script from the root of the project directory."
    exit 1
fi

echo "📂 Using current directory: $(pwd)"

# Setup backend
echo "🔧 Setting up backend..."
cd backend

# Check if virtual environment already exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "🔌 Activating virtual environment..."
source venv/bin/activate

echo "📥 Installing Python dependencies..."
echo "   Installing core dependencies..."
pip install -r requirements.txt

echo "✅ Dependencies Installed: Successfully installed all required Python packages:"
echo "   • SQLAlchemy (for database operations)"
echo "   • FastAPI & Uvicorn (web framework)"
echo "   • python-jose & cryptography (authentication)"
echo "   • passlib & bcrypt (password hashing)"
echo "   • anthropic (Claude AI client)"
echo "   • httpx & aiohttp (HTTP clients)"
echo "   • python-dotenv (environment configuration)"
echo "   • pydantic (data validation)"
echo "   • python-multipart (file upload support)"

# Setup environment file
echo "🔧 Setting up environment configuration..."
if [ ! -f ".env" ]; then
    if [ -f ".env.sample" ]; then
        cp .env.sample .env
        echo "📄 Created .env file from .env.sample"
    else
        echo "⚠️ No .env.sample found, creating basic .env file"
        cat > .env << 'EOF'
# Plaid Solution Guide Generator Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here
CLAUDE_MODEL=claude-3-5-sonnet-20241022
ASKBILL_URL=wss://hello-finn.herokuapp.com/
PORT=8000
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
JWT_SECRET_KEY=your_jwt_secret_key_here
DATABASE_URL=sqlite:///./plaid_guide.db
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=http://localhost:3000
API_V1_PREFIX=/api
EOF
    fi
else
    echo "✅ .env file already exists, skipping creation"
fi

# Check if critical environment variables are set
echo "🔍 Checking environment configuration..."
source .env 2>/dev/null || true

ENV_NEEDS_CONFIG=false

if [ "$ANTHROPIC_API_KEY" = "your_anthropic_api_key_here" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️ ANTHROPIC_API_KEY needs to be configured"
    ENV_NEEDS_CONFIG=true
fi

if [ "$JWT_SECRET_KEY" = "your_jwt_secret_key_here" ] || [ -z "$JWT_SECRET_KEY" ]; then
    echo "⚠️ JWT_SECRET_KEY needs to be configured"
    ENV_NEEDS_CONFIG=true
fi

# Initialize database if it doesn't exist
if [ ! -f "plaid_guide.db" ]; then
    echo "🗄️ Initializing database..."
    python init_db.py
else
    echo "✅ Database already exists, skipping initialization"
fi

echo "✅ Backend setup complete!"

# Setup frontend
echo "🎨 Setting up frontend..."
cd ../frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📥 Installing Node.js dependencies..."
    npm install
else
    echo "✅ Node modules already installed, skipping..."
fi

echo "✅ Frontend setup complete!"

# Create launch script
echo "🚀 Creating launch script..."
cd ..

cat > launch.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Plaid Solution Guide Generator..."
echo "============================================="

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping application..."
    if [ -f .backend.pid ]; then
        BACKEND_PID=$(cat .backend.pid)
        kill $BACKEND_PID 2>/dev/null
        rm .backend.pid
    fi
    if [ -f .frontend.pid ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        kill $FRONTEND_PID 2>/dev/null
        rm .frontend.pid
    fi
    echo "✅ Application stopped"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Check if ports are available
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port 8000 is already in use. Please stop the service using port 8000."
    exit 1
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port 3000 is already in use. Please stop the service using port 3000."
    exit 1
fi

# Start backend
echo "🔧 Starting backend server..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run install-plaid-guide.sh first."
    exit 1
fi

source venv/bin/activate
python main.py &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Store PID for cleanup
echo $BACKEND_PID > ../.backend.pid

# Wait for backend to initialize
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start. Check the logs above."
    exit 1
fi

# Test backend health
echo "🔍 Testing backend connection..."
if curl -s http://localhost:8000/health >/dev/null; then
    echo "✅ Backend is responding"
else
    echo "⚠️ Backend may still be starting up..."
fi

# Start frontend
echo "🎨 Starting frontend..."
cd ../frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ Node modules not found. Please run install-plaid-guide.sh first."
    cleanup
    exit 1
fi

npm start &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

# Store PID for cleanup
echo $FRONTEND_PID > ../.frontend.pid

echo ""
echo "🎉 Application is starting up!"
echo "============================================="
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8000"
echo ""
echo "🔐 Default login credentials:"
echo "   Email: admin@example.com"
echo "   Password: admin123"
echo ""
echo "⏳ Please wait a moment for both services to fully load..."
echo "🌐 Your browser should open automatically to http://localhost:3000"
echo ""
echo "💡 To stop the application, press Ctrl+C"
echo ""

# Wait for interrupt
wait
EOF

chmod +x launch.sh

# Create stop script
echo "🛑 Creating stop script..."
cat > stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Plaid Solution Guide Generator..."

# Kill backend
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "✅ Backend stopped"
    fi
    rm .backend.pid
fi

# Kill frontend
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "✅ Frontend stopped"
    fi
    rm .frontend.pid
fi

# Kill any remaining processes on these ports
pkill -f "python.*main.py" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true

echo "🎉 Application stopped successfully"
EOF

chmod +x stop.sh

# Create update script
echo "🔄 Creating update script..."
cat > update.sh << 'EOF'
#!/bin/bash

echo "🔄 Updating Plaid Solution Guide Generator..."
echo "============================================="

# Stop application if running
if [ -f .backend.pid ] || [ -f .frontend.pid ]; then
    echo "🛑 Stopping running application..."
    ./stop.sh
    sleep 2
fi

# Update repository (uncomment when actual repo is available)
# echo "📥 Pulling latest changes..."
# git pull origin main

# Update backend dependencies
echo "🔧 Updating backend dependencies..."
cd backend
source venv/bin/activate
pip install -r requirements.txt --upgrade

# Update frontend dependencies
echo "🎨 Updating frontend dependencies..."
cd ../frontend
npm update

echo "✅ Update complete!"
echo "🚀 Run ./launch.sh to start the updated application"
EOF

chmod +x update.sh

echo ""
echo "🎉 Installation Complete!"
echo "=========================="
echo ""
echo "📁 Installation directory: $(pwd)"
echo ""

# Show environment configuration status
if [ "$ENV_NEEDS_CONFIG" = true ]; then
    echo "🔧 IMPORTANT: Environment Configuration Required"
    echo "=============================================="
    echo ""
    echo "Before starting the application, you MUST configure:"
    echo ""
    if [ "$ANTHROPIC_API_KEY" = "your_anthropic_api_key_here" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
        echo "1. 🔑 ANTHROPIC_API_KEY in backend/.env"
        echo "   • Get your API key from: https://console.anthropic.com/"
        echo "   • Copy the key that starts with 'sk-ant-api03-'"
        echo ""
    fi
    if [ "$JWT_SECRET_KEY" = "your_jwt_secret_key_here" ] || [ -z "$JWT_SECRET_KEY" ]; then
        echo "2. 🔒 JWT_SECRET_KEY in backend/.env"
        echo "   • Generate with: openssl rand -hex 32"
        echo "   • Or use: python3 -c \"import secrets; print(secrets.token_hex(32))\""
        echo ""
    fi
    echo "📝 Edit the file: backend/.env"
    echo "💡 See backend/.env.sample for detailed instructions"
    echo ""
    echo "⚠️ The application will NOT work without these configurations!"
    echo ""
else
    echo "✅ Environment appears to be configured"
    echo ""
fi

echo "🚀 Available commands:"
echo "   ./launch.sh  - Start the application"
echo "   ./stop.sh    - Stop the application"
echo "   ./update.sh  - Update dependencies"
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
echo ""

if [ "$ENV_NEEDS_CONFIG" = true ]; then
    echo "⚠️ Configure backend/.env first, then run: ./launch.sh"
else
    echo "🚀 Ready to start! Run: ./launch.sh"
fi
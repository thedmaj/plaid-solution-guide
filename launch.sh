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

# Double-check we're in the right directory and venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found in backend directory."
    echo "💡 Please run: ./install-plaid-guide.sh"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run install-plaid-guide.sh first."
    echo "💡 Quick fix: Run the following commands:"
    echo "   cd backend"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Verify critical dependencies are installed
echo "🔍 Checking dependencies..."
if ! python -c "import fastapi" 2>/dev/null; then
    echo "❌ FastAPI not found. Installing dependencies..."
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies. Please check your virtual environment."
        exit 1
    fi
fi

if ! python -c "import jwt" 2>/dev/null; then
    echo "❌ PyJWT not found. Installing..."
    pip install PyJWT
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install PyJWT. Please check your virtual environment."
        exit 1
    fi
fi

echo "✅ Virtual environment activated and dependencies verified"
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

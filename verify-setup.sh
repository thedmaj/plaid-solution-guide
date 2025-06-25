#!/bin/bash

echo "🔍 Verifying Plaid Solution Guide Setup..."
echo "=========================================="

ISSUES_FOUND=false

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ This doesn't appear to be the Plaid Solution Guide directory"
    echo "   Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project directory structure looks correct"
echo ""

# Check prerequisites
echo "📋 Checking Prerequisites:"
echo "------------------------"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js not found - install from https://nodejs.org/"
    ISSUES_FOUND=true
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ Python: $PYTHON_VERSION"
else
    echo "❌ Python3 not found - install from https://python.org/"
    ISSUES_FOUND=true
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo "✅ Git: $GIT_VERSION"
else
    echo "❌ Git not found - install from https://git-scm.com/"
    ISSUES_FOUND=true
fi

echo ""

# Check backend setup
echo "🔧 Checking Backend Setup:"
echo "-------------------------"

cd backend

# Check virtual environment
if [ -d "venv" ]; then
    echo "✅ Python virtual environment exists"
else
    echo "❌ Virtual environment not found - run install script"
    ISSUES_FOUND=true
fi

# Check .env file
if [ -f ".env" ]; then
    echo "✅ Environment file (.env) exists"
    
    # Check critical environment variables
    source .env 2>/dev/null || true
    
    if [ -n "$ANTHROPIC_API_KEY" ] && [ "$ANTHROPIC_API_KEY" != "your_anthropic_api_key_here" ]; then
        if [[ $ANTHROPIC_API_KEY == sk-ant-api03-* ]]; then
            echo "✅ ANTHROPIC_API_KEY appears to be configured correctly"
        else
            echo "⚠️ ANTHROPIC_API_KEY format looks incorrect (should start with sk-ant-api03-)"
            ISSUES_FOUND=true
        fi
    else
        echo "❌ ANTHROPIC_API_KEY not configured in .env"
        ISSUES_FOUND=true
    fi
    
    if [ -n "$JWT_SECRET_KEY" ] && [ "$JWT_SECRET_KEY" != "your_jwt_secret_key_here" ]; then
        if [ ${#JWT_SECRET_KEY} -ge 32 ]; then
            echo "✅ JWT_SECRET_KEY appears to be configured"
        else
            echo "⚠️ JWT_SECRET_KEY should be longer (32+ characters recommended)"
        fi
    else
        echo "❌ JWT_SECRET_KEY not configured in .env"
        ISSUES_FOUND=true
    fi
    
    if [ -n "$ASKBILL_URL" ]; then
        echo "✅ ASKBILL_URL is configured"
    else
        echo "⚠️ ASKBILL_URL not configured - documentation features may not work"
    fi
    
else
    echo "❌ Environment file (.env) not found"
    if [ -f ".env.sample" ]; then
        echo "   Run: cp .env.sample .env"
        echo "   Then configure your API keys"
    else
        echo "   .env.sample also missing - run install script"
    fi
    ISSUES_FOUND=true
fi

# Check database
if [ -f "plaid_guide.db" ]; then
    echo "✅ Database file exists"
else
    echo "⚠️ Database not initialized - will be created on first run"
fi

# Check requirements
if [ -f "requirements.txt" ]; then
    echo "✅ Python requirements file exists"
else
    echo "❌ requirements.txt not found"
    ISSUES_FOUND=true
fi

cd ../frontend

echo ""
echo "🎨 Checking Frontend Setup:"
echo "-------------------------"

# Check package.json
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
else
    echo "❌ package.json not found"
    ISSUES_FOUND=true
fi

# Check node_modules
if [ -d "node_modules" ]; then
    echo "✅ Node.js dependencies installed"
else
    echo "❌ Node.js dependencies not installed - run 'npm install'"
    ISSUES_FOUND=true
fi

cd ..

echo ""
echo "🚀 Checking Launch Scripts:"
echo "-------------------------"

if [ -f "launch.sh" ]; then
    echo "✅ launch.sh exists"
    if [ -x "launch.sh" ]; then
        echo "✅ launch.sh is executable"
    else
        echo "⚠️ launch.sh exists but not executable - run 'chmod +x launch.sh'"
    fi
else
    echo "❌ launch.sh not found - run install script"
    ISSUES_FOUND=true
fi

if [ -f "stop.sh" ]; then
    echo "✅ stop.sh exists"
else
    echo "⚠️ stop.sh not found - run install script"
fi

echo ""
echo "🌐 Checking Port Availability:"
echo "-----------------------------"

# Check if ports are available
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️ Port 8000 is in use - backend may already be running"
else
    echo "✅ Port 8000 is available"
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️ Port 3000 is in use - frontend may already be running"
else
    echo "✅ Port 3000 is available"
fi

echo ""
echo "📊 Setup Verification Summary:"
echo "============================="

if [ "$ISSUES_FOUND" = true ]; then
    echo "❌ Issues found that need to be resolved"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Fix the issues listed above"
    echo "2. If you haven't run the install script, run: ./install-plaid-guide.sh"
    echo "3. Configure your API keys in backend/.env"
    echo "4. Run this verification script again"
    echo ""
    exit 1
else
    echo "🎉 Setup verification passed!"
    echo ""
    echo "🚀 You're ready to launch the application!"
    echo "   Run: ./launch.sh"
    echo ""
    echo "🔐 Default login credentials:"
    echo "   Email: admin@example.com"
    echo "   Password: admin123"
    echo ""
    echo "📖 The application will be available at:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:8000"
fi
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

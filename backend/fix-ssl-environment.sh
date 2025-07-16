  #!/bin/bash
  echo "🔧 Installing exact working versions to fix SSL issue..."

  # Check if we're in the right directory
  if [ ! -f "requirements.txt" ]; then
      echo "❌ Error: requirements.txt not found. Please run this script in the backend directory."
      exit 1
  fi

  # Check if virtual environment is activated
  if [ -z "$VIRTUAL_ENV" ]; then
      echo "⚠️  Virtual environment not detected. Activating..."
      source venv/bin/activate
  fi

  # Check if working-versions.txt exists
  if [ ! -f "working-versions.txt" ]; then
      echo "❌ Error: working-versions.txt not found. Please place it in the backend directory."
      exit 1
  fi

  # Backup current setup
  pip freeze > backup-before-fix.txt
  echo "✅ Backed up current versions to backup-before-fix.txt"

  # Clean install
  echo "🧹 Removing existing packages..."
  pip uninstall -r requirements.txt -y

  # Install exact working versions
  echo "📦 Installing exact working versions..."
  pip install -r working-versions.txt

  # Test SSL
  echo "🔍 Testing SSL connection..."
  python -c "
  import requests
  try:
      response = requests.get('https://httpbin.org/get', timeout=10)
      print('✅ SSL Test: SUCCESS (Status:', response.status_code, ')')
  except Exception as e:
      print('❌ SSL Test: FAILED -', str(e))
  "

  echo "🚀 Setup complete! Try running ./launch.sh now."
  EOF

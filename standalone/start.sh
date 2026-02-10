#!/bin/bash
# Leneda Dashboard — Standalone Launcher

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed."
    echo "Install from https://nodejs.org/ or via your package manager."
    exit 1
fi

# Check if frontend is built
if [ ! -f "../custom_components/leneda/frontend/index.html" ]; then
    echo "WARNING: Frontend not built yet. Building..."
    cd ../frontend-src
    npm install
    npm run build
    cd "$SCRIPT_DIR"
fi

echo ""
node server.js

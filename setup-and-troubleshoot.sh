#!/bin/bash

# Browser Tools MCP - Troubleshooting & Setup Script
# This script helps diagnose and fix common issues with the Browser Tools MCP setup

echo "🔧 Browser Tools MCP - Troubleshooting & Setup Script"
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

echo "📋 1. Checking Prerequisites..."

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js found: ${NODE_VERSION}${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js from https://nodejs.org/${NC}"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm found: ${NPM_VERSION}${NC}"
else
    echo -e "${RED}❌ npm not found. Please install npm${NC}"
    exit 1
fi

# Check TypeScript
if command_exists tsc; then
    TSC_VERSION=$(tsc --version)
    echo -e "${GREEN}✅ TypeScript found: ${TSC_VERSION}${NC}"
else
    echo -e "${YELLOW}⚠️  TypeScript not found globally. Installing locally...${NC}"
fi

echo ""
echo "📦 2. Checking Project Structure..."

# Check if we're in the right directory
if [ ! -d "browser-tools-mcp" ] || [ ! -d "browser-tools-server" ] || [ ! -d "chrome-extension" ]; then
    echo -e "${RED}❌ Not in the correct project directory. Please run this script from the browser-tools-mcp root directory.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project structure found${NC}"

echo ""
echo "🔨 3. Building Components..."

# Build MCP Server
echo "Building MCP Server..."
cd browser-tools-mcp
if [ ! -d "node_modules" ]; then
    echo "Installing MCP server dependencies..."
    npm install
fi

if npm run build; then
    echo -e "${GREEN}✅ MCP Server built successfully${NC}"
else
    echo -e "${RED}❌ MCP Server build failed${NC}"
    exit 1
fi

cd ..

# Build Browser Tools Server
echo "Building Browser Tools Server..."
cd browser-tools-server
if [ ! -d "node_modules" ]; then
    echo "Installing browser tools server dependencies..."
    npm install
fi

if npm run build; then
    echo -e "${GREEN}✅ Browser Tools Server built successfully${NC}"
else
    echo -e "${RED}❌ Browser Tools Server build failed${NC}"
    exit 1
fi

cd ..

echo ""
echo "🌐 4. Checking Port Availability..."

# Check default port 3025
if port_in_use 3025; then
    echo -e "${YELLOW}⚠️  Port 3025 is in use. Server will auto-select next available port.${NC}"
else
    echo -e "${GREEN}✅ Port 3025 is available${NC}"
fi

echo ""
echo "🚀 5. Starting Browser Tools Server..."

cd browser-tools-server
echo "Starting server in background..."
node dist/browser-connector.js > server.log 2>&1 &
SERVER_PID=$!
sleep 3

# Check if server started successfully
if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✅ Browser Tools Server started successfully (PID: $SERVER_PID)${NC}"
    
    # Extract the actual port from server log
    if [ -f "server.log" ]; then
        ACTUAL_PORT=$(grep -o "listening on.*:[0-9]*" server.log | grep -o "[0-9]*$" | head -1)
        if [ ! -z "$ACTUAL_PORT" ]; then
            echo -e "${BLUE}📡 Server running on port: $ACTUAL_PORT${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Failed to start Browser Tools Server${NC}"
    if [ -f "server.log" ]; then
        echo "Server log:"
        cat server.log
    fi
    exit 1
fi

cd ..

echo ""
echo "🔍 6. Testing Server Connection..."

# Test server identity endpoint
sleep 2
if curl -s "http://localhost:3026/.identity" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Server identity endpoint responding${NC}"
else
    # Try port 3025 if 3026 failed
    if curl -s "http://localhost:3025/.identity" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Server identity endpoint responding on port 3025${NC}"
    else
        echo -e "${RED}❌ Server not responding. Check server.log for errors${NC}"
    fi
fi

echo ""
echo "📱 7. Chrome Extension Setup Instructions..."

echo -e "${BLUE}To complete the setup:${NC}"
echo "1. Open Chrome and navigate to chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top-right)"
echo "3. Click 'Load unpacked' and select the 'chrome-extension' directory"
echo "4. Open Chrome DevTools on any webpage (F12)"
echo "5. Look for 'Browser Tools' tab in DevTools"
echo "6. Update server port in extension settings if needed"

echo ""
echo "📸 8. Screenshot Testing..."

echo -e "${YELLOW}Note: Screenshots can only be taken from regular webpages, not DevTools pages.${NC}"
echo -e "${YELLOW}If you see 'devtools://' errors, navigate to a normal website first.${NC}"

echo ""
echo "✨ Setup Complete!"
echo ""
echo -e "${GREEN}✅ All components built and server running${NC}"
echo -e "${BLUE}🔧 Server PID: $SERVER_PID (use 'kill $SERVER_PID' to stop)${NC}"
echo -e "${BLUE}📂 Server log: browser-tools-server/server.log${NC}"

echo ""
echo "🚨 Troubleshooting Tips:"
echo "• If screenshots fail, make sure you're on a regular webpage (not DevTools)"
echo "• Check extension settings for correct server port"
echo "• Restart Chrome completely if extension doesn't appear"
echo "• Check server.log for detailed error messages"

echo ""
echo "🎉 Happy coding with Browser Tools MCP!"

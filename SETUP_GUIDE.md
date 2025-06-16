### For Windsurf IDE (Recommended)
Configure these in **Windsurf Memories**:
1. **Authentication context setup** - How auth works in your project
2. **Page/module creation patterns** - Router integration and navigation structure  
3. **API data fetching patterns** - How API calls are structured and handled
4. **UI utilities context** - Toasts, modals, common components, etc.

### For Cursor IDE
Set up similar context in your **Rules file** (.cursorrules):
- Project structure and patterns
- Authentication flow
- API integration patterns  
- Component architecture

**💡Important:** Spend time setting up comprehensive project context in your AI IDE. This extension + proper context = autonomous frontend development magic!

## 🚀 Quick Setup Instructions

Follow these steps to set up the Browser MCP Extension with enhanced autonomous operation features:

### 1. Clone the Repository

```bash
git clone https://github.com/Winds-AI/Browser-MCP.git
cd Browser-MCP
```

### 2. For Chrome Extension

1. **Important**: Install dependencies first:
  ```bash
  cd chrome-extension
  npm install
  ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Toggle **"Developer mode"** on (top-right corner)
4. Click **"Load unpacked"** (top-left corner)  
5. Select the `chrome-extension` directory from the cloned repository

### 3. For MCP Client

1. Run the following commands:
```bash
cd browser-tools-mcp
npm install
npm run build
```

### 4. For MCP Server ( communication layer between chrome extension and MCP client + data processor)

1. Run the following commands:
```bash
cd ../browser-tools-server
npm install  
npm run build
npm start
```

After this repository setup, go to any chrome tab and open developer tools (F12) and navigate to the BrowserTools tab ( it will be where all the tabs like network, console etc are). You should see a connection status message. Just to make sure click on the test connection button and make sure that the port number is same as what server is running

**🎯 Enhanced Server Features:**
- ✅ **Auto-port detection** (starts on 3025, auto-selects 3026+ if needed)
- ✅ **Connection health monitoring** at `/connection-health`
- ✅ **Enhanced heartbeat system** (25s intervals, 60s timeout)
- ✅ **Fast recovery** (3-15 second reconnection)
- ✅ **Server identity validation** at `/.identity`

### 4. Configure Your AI Code Platform

1. Add this server to your MCP configuration file in your preferred AI code platform (Windsurf, Cursor, GitHub Copilot, etc.).
2. **Important**: After updating the MCP configuration, close and restart your AI coding platform for the changes to take effect.

#### 🎯 Enhanced Configuration Example for Windsurf:

```json
{
    "mcpServers": {
      "browser-tools-frontend-dev": {
       "command": "node", 
        "args": [
          "/absolute/path/to/browser-tools-mcp/dist/mcp-server.js"  // copy the path from where mcp-server.js is located in the repo
        ],
        "env": {
          // === For using searchApiDocs and discoverApiStructure tools ===
          "SWAGGER_URL": "https://api.example.com/docs/swagger.json", // OpenAPI/Swagger JSON URL

          // === For using analyzeImageFile tool ===
          "PROJECT_ROOT": "/root/path/to/your/project",       // Project root for file operations
          
          // === For using executeAuthenticatedApiCall tool ===
          "AUTH_ORIGIN": "http://localhost:5173",        // Your app's localhost URL
          "AUTH_STORAGE_TYPE": "localStorage",           // to get access token from cookie/localStorage/sessionStorage 
          "AUTH_TOKEN_KEY": "authToken",                 // Token key name in storage
          "API_BASE_URL": "https://api.example.com",     // base URL for calling API

          // === For using takeScreenshot tool ===
          "SCREENSHOT_STORAGE_PATH": "/path/to/screenshots", // Custom screenshot directory where screenshots will be saved in an organized directories



          // === Connection Stability (Optional Overrides) ===
          "BROWSER_TOOLS_HOST": "127.0.0.1",            // Server host override
          "BROWSER_TOOLS_PORT": "3025"                   // Server port override
        }
      }
    }
}
```

## 🔧 System Compatibility & Features

### Enhanced MCP Server Architecture
- **Protocol**: Model Context Protocol (MCP) over standard input/output (stdio)
- **Transport**: stdio for maximum compatibility across MCP clients
- **AI Editor Support**: Windsurf, Cursor, Cline, Zed, Claude Desktop, VS Code with MCP extensions

### 🚀 Autonomous Operation Features
- **Enhanced WebSocket Stability**: Intelligent heartbeat monitoring with 25s intervals
- **Fast Recovery**: 3-15 second reconnection from network issues
- **Connection Health Monitoring**: Real-time status at `/connection-health`
- **Individual Request Tracking**: Prevents callback conflicts during concurrent operations
- **Network Tolerance**: Exponential backoff with up to 10 retry attempts
- **Streamlined Discovery**: Essential IP scanning for faster server detection

### Browser Compatibility
- **Chrome Extensions API v3**: Full compatibility with latest Chrome extension standards
- **DevTools Integration**: Seamless integration with Chrome Developer Tools
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 🚨 Enhanced Troubleshooting Guide

### Connection Issues
1. **Server Auto-Discovery**: The system automatically discovers servers on ports 3025-3035
2. **Connection Health Check**: Visit `http://localhost:3026/connection-health` to verify server status
3. **Chrome Extension Status**: Check DevTools → BrowserTools tab for connection status

### Common Fixes
1. **Complete Chrome Restart**: Close all Chrome windows and restart (not just refresh)
2. **Server Restart**: Stop and restart the browser-tools-server
3. **Extension Reload**: Go to `chrome://extensions/` and click reload on BrowserTools MCP
4. **Port Conflicts**: Server auto-selects available ports (check console output for actual port)

### Debug Information
- **Server Logs**: Check console output for detailed connection and error information  
- **Chrome DevTools Console**: Look for WebSocket connection status and error messages
- **Extension Panel**: Connection status displayed in real-time in DevTools panel

### Performance Optimization
- **Long-Running Sessions**: System optimized for 2+ hour autonomous AI development sessions
- **Memory Management**: Enhanced callback cleanup prevents memory leaks
- **Network Tolerance**: Increased timeouts for unreliable network conditions

## 📊 Testing Your Setup

### 1. Verify Server Connection
```bash
# Check server identity (replace 3026 with your actual port)
curl http://localhost:3026/.identity

# Check connection health
curl http://localhost:3026/connection-health
```

## 🎯 Ready for Autonomous Development!

Once setup is complete, your Browser MCP Extension is optimized for:
- ✅ Extended AI development sessions (2+ hours)
- ✅ Automatic recovery from network issues  
- ✅ Concurrent screenshot and API operations
- ✅ Real-time connection health monitoring
- ✅ Minimal workflow disruption during connection drops

**Happy autonomous AI development! 🚀**

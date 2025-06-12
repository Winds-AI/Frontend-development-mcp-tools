# Browser MCP Extension - Setup Guide

**🚀 Version 1.2.0 - Enhanced for Autonomous AI Development**

> Browser MCP Extension enables AI tools to interact with your browser for enhanced development capabilities. **Now optimized for autonomous AI-powered frontend development workflows** with enhanced connection stability, fast recovery, and intelligent monitoring.

## 🎯 Perfect for Autonomous AI Workflows

The extension works exceptionally well with AI IDEs when project context is properly configured:

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

**💡 Pro Tip:** Spend time setting up comprehensive project context in your AI IDE. This extension + proper context = autonomous frontend development magic!

## 🚀 Quick Setup Instructions

Follow these steps to set up the Browser MCP Extension with enhanced autonomous operation features:

### 1. Clone the Repository

```bash
git clone https://github.com/Winds-AI/Browser-MCP.git
cd Browser-MCP
```

### 2. Install Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Toggle **"Developer mode"** on (top-right corner)
3. Click **"Load unpacked"** (top-left corner)  
4. **Important**: Install dependencies first:
   ```bash
   cd chrome-extension
   npm install
   cd ..
   ```
5. Select the `chrome-extension` directory from the cloned repository

### 3. Set Up MCP Server (Enhanced Build Process)

**Build the MCP Server:**
```bash
cd browser-tools-mcp
npm install
npm run build  # Using npm run build instead of npx tsc for consistency
```

**Build and Start the Browser Tools Server:**
```bash
cd ../browser-tools-server
npm install  
npm run build
node ./dist/browser-connector.js
```

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
          "/absolute/path/to/browser-tools-mcp/dist/mcp-server.js"
        ],
        "env": {
          // === API Testing & Authentication ===
          "AUTH_ORIGIN": "http://localhost:5173",        // Your app's origin URL
          "AUTH_STORAGE_TYPE": "localStorage",           // cookie/localStorage/sessionStorage  
          "AUTH_TOKEN_KEY": "authToken",                 // Token key name in storage
          "API_BASE_URL": "https://api.example.com",     // Your API base URL

          // === Document & API Discovery ===
          "SWAGGER_URL": "https://api.example.com/docs", // OpenAPI/Swagger JSON URL
          "PROJECT_ROOT": "/path/to/your/project",       // Project root for file operations

          // === Screenshot Management ===
          "SCREENSHOT_STORAGE_PATH": "/path/to/screenshots", // Custom screenshot directory

          // === Vector Database (Optional - for FRD documents) ===
          "GOOGLE_API_KEY": "your_google_api_key",       // For embedding generation
          "QDRANT_API_KEY": "your_qdrant_api_key",       // Qdrant Cloud API key
          "QDRANT_URL": "https://your-cluster.qdrant.io:6333", // Qdrant server URL

          // === Connection Stability (Optional Overrides) ===
          "BROWSER_TOOLS_HOST": "127.0.0.1",            // Server host override
          "BROWSER_TOOLS_PORT": "3025"                   // Server port override
        }
      }
    }
}
```

#### 🔧 Configuration for Cursor IDE:

```json
{
  "mcpServers": {
    "browser-tools-frontend-dev": {
      "command": "node",
      "args": ["/absolute/path/to/browser-tools-mcp/dist/mcp-server.js"],
      "env": {
        "AUTH_ORIGIN": "http://localhost:5173",
        "AUTH_STORAGE_TYPE": "localStorage", 
        "AUTH_TOKEN_KEY": "authToken",
        "API_BASE_URL": "https://api.example.com",
        "PROJECT_ROOT": "/path/to/your/project"
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

### 2. Test Chrome Extension
1. Open any webpage (not DevTools pages)
2. Open Chrome DevTools (F12)
3. Look for "BrowserTools" tab
4. Verify connection status shows "Connected"

### 3. Test MCP Tools
Use your AI editor to test tools like:
```json
// Example takeScreenshot call
{
  "tool": "takeScreenshot",
  "params": {
    "filename": "test-setup",
    "returnImageData": true
  }
}
```

## 🎯 Ready for Autonomous Development!

Once setup is complete, your Browser MCP Extension is optimized for:
- ✅ Extended AI development sessions (2+ hours)
- ✅ Automatic recovery from network issues  
- ✅ Concurrent screenshot and API operations
- ✅ Real-time connection health monitoring
- ✅ Minimal workflow disruption during connection drops

**Happy autonomous AI development! 🚀**

# Browser Tools MCP Server

**🚀 Version 1.2.0 - Enhanced for Autonomous AI Development**

A Model Context Protocol (MCP) server that provides AI-powered browser tools integration with enhanced connection stability and autonomous operation features. This server works in conjunction with the Browser Tools Server to provide reliable AI capabilities for extended frontend development workflows.

## ✨ Key Features

### Core Browser Integration
- **MCP protocol implementation** with enhanced discovery and retry logic
- **Browser console log access** with real-time streaming
- **Network request analysis** with filtering and timestamp support
- **Screenshot capture capabilities** with organized storage and base64 return
- **Element selection and inspection** via Chrome DevTools integration
- **Real-time browser state monitoring** with connection health tracking

### Enhanced for Autonomous Operation
- **Smart server discovery** with automatic port detection (3025-3035)
- **Enhanced retry logic** with 5 attempts and exponential backoff  
- **Connection stability monitoring** with detailed health reporting
- **Individual request tracking** to prevent callback conflicts
- **Network-tolerant timeouts** for unreliable connection environments
- **Comprehensive error handling** with detailed debugging information

### Advanced Capabilities
- **API documentation search** with OpenAPI/Swagger integration
- **Authenticated API testing** with automatic token retrieval from browser
- **Document ingestion** with vector database storage for context retrieval
- **Image analysis** for historical screenshot access and processing

## 🚀 Prerequisites

- **Node.js 16 or higher** (LTS recommended)
- **Browser Tools Server** running (automatically discovered on ports 3025-3035)  
- **Chrome or Chromium browser** installed with the Browser Tools Chrome Extension
- **MCP-compatible AI editor** (Windsurf, Cursor, Cline, etc.)

## 📦 Installation & Usage

### Quick Start
```bash
# Install dependencies
npm install

# Build the server
npm run build

# The server is designed to be used via MCP clients, not run standalone
# Add to your AI editor's MCP configuration (see SETUP_GUIDE.md)
```

### MCP Client Configuration
Add to your AI editor's MCP settings:

```json
{
  "mcpServers": {
    "browser-tools": {
      "command": "node",
      "args": ["/path/to/browser-tools-mcp/dist/mcp-server.js"],
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

## Usage

1. First, make sure the Browser Tools Server is running:

```bash
npx @agentdeskai/browser-tools-server
```

2. Then start the MCP server:

```bash
npx @agentdeskai/browser-tools-mcp
```

3. The MCP server will connect to the Browser Tools Server and provide the following capabilities:

- Console log retrieval
- Network request monitoring
- Screenshot capture
- Element selection
- Browser state analysis
- Accessibility and performance audits

## MCP Functions

The server provides the following MCP functions:

- `mcp_getConsoleLogs` - Retrieve browser console logs
- `mcp_getConsoleErrors` - Get browser console errors
- `mcp_getNetworkErrors` - Get network error logs
- `mcp_getNetworkSuccess` - Get successful network requests
- `mcp_getNetworkLogs` - Get all network logs
- `mcp_getSelectedElement` - Get the currently selected DOM element
- `mcp_runAccessibilityAudit` - Run a WCAG-compliant accessibility audit
- `mcp_runPerformanceAudit` - Run a performance audit
- `mcp_runSEOAudit` - Run an SEO audit
- `mcp_runBestPracticesAudit` - Run a best practices audit

## Integration

This server is designed to work with AI tools and platforms that support the Model Context Protocol (MCP). It provides a standardized interface for AI models to interact with browser state and debugging information.

## License

MIT

# Browser MCP Extension

> Browser MCP Extension enables AI tools to interact with your browser for enhanced development capabilities. Currently it is most compatible with Windsurf IDE and works crazy good if it has all the context of the project setup in windsurf memories accurately. The Memories should include these:
1. Authentication context is setup,
2. Creating new pages? modules and integration with router and navigation,
3. API data fetching and handling it for proper integartion with UI,
4. any utilities like toasts, modals, etc.

Trust me give some time in setting up memories or rules file for cursor and this using this setup along with it will make your work a lot easier.

## Setup Instructions

Follow these steps to set up the Browser MCP Extension:

### 1. Clone the Repository

Clone this repository to your local machine:

```bash
git clone https://github.com/Winds-AI/Browser-MCP.git
```

### 2. Install Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Toggle "Developer mode" on (located at the top-right corner)
3. Click on "Load Unpacked" (located at the top-left corner)
4. make sure you install all dependencis in chrome-extension first
5. Select the `chrome-extension` directory from the cloned repository

### 3. Set Up MCP Server

1. Navigate to the browser-tools-mcp directory:

   ```bash
   cd browser-tools-mcp
   npm install
   npx tsc
   ```
2. Navigate to the browser-tools-server directory:

   ```bash
   cd ../browser-tools-server
   npm install
   npm run build
   node ./dist/browser-connector.js
   ```

### 4. Configure Your AI Code Platform

1. Add this server to your MCP configuration file in your preferred AI code platform (Windsurf, Cursor, GitHub Copilot, etc.).
2. **Important**: After updating the MCP configuration, close and restart your AI coding platform for the changes to take effect.

#### Configuration Example for Windsurf:

```json
{
    "mcpServers": {
      "Frontend-development-tools": {
       "command": "node",
        "args": [
          "path_to_your_mcp_server_file_in_mcp_directory" // path to your mcp-server.js file from browser-tools-mcp directory
        ],
        "env": {
          "SWAGGER_URL": "your_swagger_json_url",   // set this if you want to use searchApiDocs tool else comment this line
          "PROJECT_ROOT": "your_project_root",      // set this if you want to use analyzeImageFile tool else comment this line
          "GOOGLE_API_KEY": "your_google_api_key",  // set this if you want to use ingestFrdDocument, getFrdIngestionStatus,  tool else comment this line
          "QDRANT_API_KEY": "your_qdrant_api_key",  // set this if you want to use ingestFrdDocument, getFrdIngestionStatus,  tool else comment this line
          "QDRANT_URL": "your_qdrant_url"           // set this if you want to use ingestFrdDocument, getFrdIngestionStatus,  tool else comment this line. (defaults to http://localhost:6333 for local running QDrant)
        }
      }
    }
}
```

#### MCP Server

- Implements the Model Context Protocol
- Provides standardized tools for AI clients
- Compatible with various MCP clients (Windsurf, Cursor, Cline, Zed, Claude Desktop, etc.)

## Compatibility

- **Server Type**: Uses standard input/output (stdio) for MCP server communication
- **Client Compatibility**: Works with any MCP-compatible client that supports stdio transport
- **Primary Integration**: Designed for Windsurf IDE with more integrations coming soon
- **AI Editor Support**: Compatible with other AI editors and MCP clients that support the MCP protocol over stdio

## Troubleshooting

If you encounter issues:

1. Restart Chrome completely (not just the window)
2. Restart the browser-tools-server
3. Ensure only one instance of Chrome DevTools panel is open
4. Check console logs for error messages

# BrowserTools MCP

> Make your AI tools 10x more aware and capable of interacting with your browser

This application is a powerful browser monitoring and interaction tool that enables AI-powered applications via Anthropic's Model Context Protocol (MCP) to capture and analyze browser data through a Chrome extension.

Read our [docs](https://browsertools.agentdesk.ai/) for the full installation, quickstart and contribution guides.

## Roadmap

Check out our project roadmap here: [Github Roadmap / Project Board](https://github.com/orgs/AgentDeskAI/projects/1/views/1)

## Updates

v1.2.0 is out! Here's a quick breakdown of the update:
- You can now enable "Allow Auto-Paste into Cursor" within the DevTools panel. Screenshots will be automatically pasted into Cursor (just make sure to focus/click into the Agent input field in Cursor, otherwise it won't work!)
- Integrated a suite of SEO, performance, accessibility, and best practice analysis tools via Lighthouse
- Implemented a NextJS specific prompt used to improve SEO for a NextJS application
- Added Debugger Mode as a tool which executes all debugging tools in a particular sequence, along with a prompt to improve reasoning
- Added Audit Mode as a tool to execute all auditing tools in a particular sequence
- Resolved Windows connectivity issues
- Improved networking between BrowserTools server, extension and MCP server with host/port auto-discovery, auto-reconnect, and graceful shutdown mechanisms
- Added ability to more easily exit out of the Browser Tools server with Ctrl+C

## Quickstart Guide

There are three components to run this MCP tool:

1. Install our chrome extension from here: [v1.2.0 BrowserToolsMCP Chrome Extension](https://github.com/AgentDeskAI/browser-tools-mcp/releases/download/v1.2.0/BrowserTools-1.2.0-extension.zip)
2. Install the MCP server from this command within your IDE: `npx @agentdeskai/browser-tools-mcp@latest`
3. Open a new terminal and run this command: `npx @agentdeskai/browser-tools-server@latest`

* Different IDEs have different configs but this command is generally a good starting point; please reference your IDEs docs for the proper config setup

IMPORTANT TIP - there are two servers you need to install. There's...
- browser-tools-server (local nodejs server that's a middleware for gathering logs)
and
- browser-tools-mcp (MCP server that you install into your IDE that communicates w/ the extension + browser-tools-server)

`npx @agentdeskai/browser-tools-mcp@latest` is what you put into your IDE
`npx @agentdeskai/browser-tools-server@latest` is what you run in a new terminal window

After those three steps, open up your chrome dev tools and then the BrowserToolsMCP panel.

If you're still having issues try these steps:
- Quit / close down your browser. Not just the window but all of Chrome itself. 
- Restart the local node server (browser-tools-server)
- Make sure you only have ONE instance of chrome dev tools panel open

After that, it should work but if it doesn't let me know and I can share some more steps to gather logs/info about the issue!

If you have any questions or issues, feel free to open an issue ticket! And if you have any ideas to make this better, feel free to reach out or open an issue ticket with an enhancement tag or reach out to me at [@tedx_ai on x](https://x.com/tedx_ai)

---

### Running from Local Source Code

If you have cloned this repository and want to run the servers directly from the source code (e.g., for development or testing local changes), follow these steps:

**1. Install Dependencies (Run once in each directory):**

*   In the `browser-tools-server` directory:
    ```bash
    cd browser-tools-server
    npm install
    cd ..
    ```
*   In the `browser-tools-mcp` directory (root of this project):
    ```bash
    # (Assuming you are in the root directory already)
    npm install 
    ```

**2. Build and Start the Browser Connector Server:**

*   Open a terminal window.
*   Navigate to the server directory:
    ```bash
    cd browser-tools-server
    ```
*   Build the TypeScript code (only needed after code changes):
    ```bash
    npm run build
    ```
*   Start the server (keep this terminal running):
    ```bash
    node ./dist/browser-connector.js
    ```
   You should see output confirming the server is running on port 3025 (by default).

**3. Start the MCP Server:**

*   Open a *second* terminal window.
*   Navigate to the MCP directory (root of this project):
    ```bash
    cd /path/to/browser-tools-mcp # Replace with your actual path
    ```
*   Start the MCP server (keep this terminal running):
    ```bash
    npx ts-node ./mcp-server.ts
    ```
   You should see output indicating that the MCP server has successfully discovered the browser connector server.

**4. Connect the Chrome Extension:**

*   Go to `chrome://extensions/` in your Chrome browser.
*   Enable Developer Mode (toggle in the top-right corner).
*   If installing for the first time:
    - Click "Load unpacked"
    - Navigate to the `chrome-extension` directory in this repository
    - Select the directory
*   If already installed, click the reload icon (🔄) to ensure it connects to the locally running servers.
*   Open Chrome DevTools (F12 or right-click > Inspect) and navigate to the "Browser Tools MCP" panel.
*   You should see "Connected to browser-tools-server" with the version and host information.

**5. Configure your IDE (for Windsurf/Codeium/Cursor users):**

*   If your IDE uses Windsurf for MCP integration, you may need to update the MCP configuration.
*   For Codeium/Windsurf, the config is typically at `~/.codeium/windsurf-next/mcp_config.json`.
*   Update the `browser-tools` section to point to your local MCP server:
    ```json
    "browser-tools": {
      "command": "npx",
      "args": [
        "ts-node",
        "/absolute/path/to/browser-tools-mcp/browser-tools-mcp/mcp-server.ts"
      ],
      "env": {},
      "disabled": false
    }
    ```
*   Restart your IDE or reload the MCP connections to apply the changes.

### Network Request Details Functionality

The Browser Tools MCP now includes a powerful feature to capture and query detailed network requests, including full request and response data.

**1. Capturing Network Requests:**

* The Chrome extension automatically captures all network requests made by the browser.
* Full request and response data is stored, including headers, bodies, and status codes.

**2. Querying Network Requests:**

* Use the `getNetworkRequestDetails` MCP tool to query captured network requests.
* Filter requests by URL substring and specify which details you want to retrieve.

**Example Usage:**

```javascript
// Example of using the getNetworkRequestDetails tool
// This retrieves the response body for any request containing "api/users"
mcp0_getNetworkRequestDetails({
  "urlFilter": "api/users",
  "details": ["responseBody"]
})
```

**Available Detail Fields:**

* `url` - The full URL of the request
* `method` - HTTP method (GET, POST, etc.)
* `status` - HTTP status code
* `requestHeaders` - Headers sent with the request
* `responseHeaders` - Headers received in the response
* `requestBody` - Body sent with the request (for POST, PUT, etc.)
* `responseBody` - Body received in the response

**Cache Limitations:**

* **Size Limit:** The cache stores a maximum of 500 network requests. When this limit is reached, the oldest requests are removed first (FIFO - First In, First Out).
* **Persistence:** The cache is stored in-memory and is cleared when:
  * The browser connector server is restarted
  * The browser page is refreshed or navigated
  * The `wipe-logs` endpoint is called
* **Content Size:** There is no explicit limit on the size of request/response bodies, but extremely large payloads may impact performance.

**Troubleshooting:**

* If no results are returned, ensure:
  1. The network request has occurred since the browser connector server was started
  2. The URL filter matches part of the request URL
  3. The Chrome extension is properly connected to the server
  4. The cache hasn't been cleared by a page refresh or server restart

---

## Full Update Notes:

Coding agents like Cursor can run these audits against the current page seamlessly. By leveraging Puppeteer and the Lighthouse npm library, BrowserTools MCP can now:

- Evaluate pages for WCAG compliance
- Identify performance bottlenecks
- Flag on-page SEO issues
- Check adherence to web development best practices
- Review NextJS specific issues with SEO

...all without leaving your IDE 🎉

---

## 🔑 Key Additions

| Audit Type         | Description                                                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Accessibility**  | WCAG-compliant checks for color contrast, missing alt text, keyboard navigation traps, ARIA attributes, and more.                        |
| **Performance**    | Lighthouse-driven analysis of render-blocking resources, excessive DOM size, unoptimized images, and other factors affecting page speed. |
| **SEO**            | Evaluates on-page SEO factors (like metadata, headings, and link structure) and suggests improvements for better search visibility.      |
| **Best Practices** | Checks for general best practices in web development.                                                                                    |
| **NextJS Audit**   | Injects a prompt used to perform a NextJS audit.                                                                                         |
| **Audit Mode**     | Runs all auditing tools in a sequence.                                                                                                   |
| **Debugger Mode**  | Runs all debugging tools in a sequence.                                                                                                  |

---

## 🛠️ Using Audit Tools

### ✅ **Before You Start**

Ensure you have:

- An **active tab** in your browser
- The **BrowserTools extension enabled**

### ▶️ **Running Audits**

**Headless Browser Automation**:  
 Puppeteer automates a headless Chrome instance to load the page and collect audit data, ensuring accurate results even for SPAs or content loaded via JavaScript.

The headless browser instance remains active for **60 seconds** after the last audit call to efficiently handle consecutive audit requests.

**Structured Results**:  
 Each audit returns results in a structured JSON format, including overall scores and detailed issue lists. This makes it easy for MCP-compatible clients to interpret the findings and present actionable insights.

The MCP server provides tools to run audits on the current page. Here are example queries you can use to trigger them:

#### Accessibility Audit (`runAccessibilityAudit`)

Ensures the page meets accessibility standards like WCAG.

> **Example Queries:**
>
> - "Are there any accessibility issues on this page?"
> - "Run an accessibility audit."
> - "Check if this page meets WCAG standards."

#### Performance Audit (`runPerformanceAudit`)

Identifies performance bottlenecks and loading issues.

> **Example Queries:**
>
> - "Why is this page loading so slowly?"
> - "Check the performance of this page."
> - "Run a performance audit."

#### SEO Audit (`runSEOAudit`)

Evaluates how well the page is optimized for search engines.

> **Example Queries:**
>
> - "How can I improve SEO for this page?"
> - "Run an SEO audit."
> - "Check SEO on this page."

#### Best Practices Audit (`runBestPracticesAudit`)

Checks for general best practices in web development.

> **Example Queries:**
>
> - "Run a best practices audit."
> - "Check best practices on this page."
> - "Are there any best practices issues on this page?"

#### Audit Mode (`runAuditMode`)

Runs all audits in a particular sequence. Will run a NextJS audit if the framework is detected.

> **Example Queries:**
>
> - "Run audit mode."
> - "Enter audit mode."

#### NextJS Audits (`runNextJSAudit`)

Checks for best practices and SEO improvements for NextJS applications

> **Example Queries:**
>
> - "Run a NextJS audit."
> - "Run a NextJS audit, I'm using app router."
> - "Run a NextJS audit, I'm using page router."

#### Debugger Mode (`runDebuggerMode`)

Runs all debugging tools in a particular sequence

> **Example Queries:**
>
> - "Enter debugger mode."

## Architecture

There are three core components all used to capture and analyze browser data:

1. **Chrome Extension**: A browser extension that captures screenshots, console logs, network activity and DOM elements.
2. **Node Server**: An intermediary server that facilitates communication between the Chrome extension and any instance of an MCP server.
3. **MCP Server**: A Model Context Protocol server that provides standardized tools for AI clients to interact with the browser.

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌─────────────┐
│  MCP Client │ ──► │  MCP Server  │ ──► │  Node Server  │ ──► │   Chrome    │
│  (e.g.      │ ◄── │  (Protocol   │ ◄── │ (Middleware)  │ ◄── │  Extension  │
│   Cursor)   │     │   Handler)   │     │               │     │             │
└─────────────┘     └──────────────┘     └───────────────┘     └─────────────┘
```

Model Context Protocol (MCP) is a capability supported by Anthropic AI models that
allow you to create custom tools for any compatible client. MCP clients like Claude
Desktop, Cursor, Cline or Zed can run an MCP server which "teaches" these clients
about a new tool that they can use.

These tools can call out to external APIs but in our case, **all logs are stored locally** on your machine and NEVER sent out to any third-party service or API. BrowserTools MCP runs a local instance of a NodeJS API server which communicates with the BrowserTools Chrome Extension.

All consumers of the BrowserTools MCP Server interface with the same NodeJS API and Chrome extension.

#### Chrome Extension

- Monitors XHR requests/responses and console logs
- Tracks selected DOM elements
- Sends all logs and current element to the BrowserTools Connector
- Connects to Websocket server to capture/send screenshots
- Allows user to configure token/truncation limits + screenshot folder path

#### Node Server

- Acts as middleware between the Chrome extension and MCP server
- Receives logs and currently selected element from Chrome extension
- Processes requests from MCP server to capture logs, screenshot or current element
- Sends Websocket command to the Chrome extension for capturing a screenshot
- Intelligently truncates strings and # of duplicate objects in logs to avoid token limits
- Removes cookies and sensitive headers to avoid sending to LLMs in MCP clients

#### MCP Server

- Implements the Model Context Protocol
- Provides standardized tools for AI clients
- Compatible with various MCP clients (Cursor, Cline, Zed, Claude Desktop, etc.)

## Installation

Installation steps can be found in our documentation:

- [BrowserTools MCP Docs](https://browsertools.agentdesk.ai/)

## Usage

Once installed and configured, the system allows any compatible MCP client to:

- Monitor browser console output
- Capture network traffic
- Take screenshots
- Analyze selected elements
- Wipe logs stored in our MCP server
- Run accessibility, performance, SEO, and best practices audits

## Compatibility

- Works with any MCP-compatible client
- Primarily designed for Cursor IDE integration
- Supports other AI editors and MCP clients

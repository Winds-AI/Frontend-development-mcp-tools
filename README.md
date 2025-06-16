# Frontend Development MCP Tools

**🚀 Optimized for Autonomous AI-Powered Frontend Development Workflows**

Browser Tools MCP Extension enables AI tools to interact with your browser for enhanced development capabilities. This document provides an overview of the available tools within the MCP server.

- For setup instructions, please refer to `SETUP_GUIDE.md`.
- For how to use these tools, please refer to `HOW_TO_USE.md`.
- For a peek on future updates, please refer to `FUTURE_PLANS.md`.
- For getting an overview of the project, please refer to `PROJECT_OVERVIEW.md`.

## Motivation

At this point in time, I think the models are capable of doing a lot of things, but they are not able to do it in a way that is helpful to the user because of a lack of context.

We humans can do tasks accurately because we have a lot of context about the task we are doing, and we can use that context to make decisions.

Too much context also makes it hard for LLMs to make decisions. So, giving the right context at the right time is very important, and this will be the key to making LLMs more helpful to the user. MCP servers are one of the ways to provide context to LLMs at the right time.

One day, I came across AgentDeskAI's repo ([https://github.com/AgentDeskAI/browser-tools-mcp](https://github.com/AgentDeskAI/browser-tools-mcp)). This repo consisted of a Chrome extension and an MCP server. It had tools like get browser logs, get network status, etc. This inspired me, and I started using these tools in my development workflow. I came to the realization that when I am writing code, I am juggling a lot of things and managing this context so I know what to write. So, what if we can provide this context to LLMs at the right time? AgentDeskAI was a huge inspiration and starting point for this project, and that is why you will see that this is a fork of that repository. Though at this moment, I am not using most of the tools they had in their repo except the `getSelectedElement` tool, they do have many interesting tools, and I am planning to use some again depending on how this setup works.

I am a Frontend Developer and Applied AI enthusiast, and I am working on this project to make already good AI coding IDEs better by creating a custom workflow on top of these tools. This workflow allows me to automate my work of frontend development and delegate the tasks to these AI IDEs, and they can autonomously work. This allows me to focus on important tasks like future-proof project setup. Oh yeah, one important thing to note is that currently, this workflow only works if the project is already set up and has basic things like auth context, API calling structure, routing, and how those routes are exposed, etc. All of this context should be set up in AI IDEs. I use Windsurf's Memories to store this context, which allows the agent to retrieve the important memories based on my prompt. You can use Cursor's Rule file also, but I don't know how well this will work because I haven't tried it.

Now, to make Frontend development autonomous, we have to understand what a frontend developer uses to code and how he/she thinks.

A frontend developer uses API documentation, browser, browser logs, browser errors, the ability to make API calls, functional requirement documents, developer tools, and his/her visual capability to see the UI and make decisions. Considering these aspects of frontend development, we can create an MCP server that can provide context to AI IDEs at the right time. So, I made tools that can access all these aspects of frontend development and provide context to AI IDEs at the right time. These tools include: `analyzeApiCalls`, `takeScreenshot`, `getSelectedElement`, `analyzeImageFile`, `ingestFrdDocument`, `getFrdIngestionStatus`, `searchApiDocs`... and more coming soon.

I plan to make such workflows for backend and QA testers also, but primarily I am a frontend guy, so I chose this first. If you are interested in this project, please let me know, and I will be happy to help you. We can create something big and awesome.

---

## Frontend Development MCP Tools - A Project by [Winds AI](https://github.com/Winds-AI)

---
## Available Tools

The following tools are available through the Browser Tools MCP server:

1. **`analyzeApiCalls`**

   * **Description**: Analyzes API interactions between the frontend and backend by retrieving filtered network request details. This tool is useful for inspecting API calls to specific endpoints, debugging network errors and status codes, examining request/response payloads, investigating authentication headers, or monitoring AJAX requests. Results include timestamps to help distinguish between identical API calls made at different times.
   * **Parameters**:
     * `urlFilter` (string, required): A substring or pattern to filter request URLs.
     * `details` (array of strings, required): Specific details to retrieve for each request. Possible values include: `"url"`, `"method"`, `"status"`, `"timestamp"`, `"requestHeaders"`, `"responseHeaders"`, `"requestBody"`, `"responseBody"`.
     * `timeStart` (number, optional): A Unix timestamp (in milliseconds) to filter requests that occurred after this time.
     * `timeEnd` (number, optional): A Unix timestamp (in milliseconds) to filter requests that occurred before this time.
     * `orderBy` (string, optional, default: `"timestamp"`): The field to order results by. Possible values: `"timestamp"`, `"url"`.
     * `orderDirection` (string, optional, default: `"desc"`): The direction for ordering. Possible values: `"asc"` (oldest first), `"desc"` (newest first).
     * `limit` (number, optional, default: `20`): The maximum number of results to return.
   * **Functionality**: This tool constructs a query based on the provided parameters and fetches network request details from the `browser-connector` server (typically at `http://<host>:<port>/network-request-details`). It then returns the filtered and ordered list of network interactions.
2. **`takeScreenshot`** ⭐ **ENHANCED**

   * **Description**: Take a screenshot of the current browser tab and return the image data for immediate analysis. The screenshot is automatically organized by project and URL structure in a centralized directory system.
   * **Parameters**:
     * `filename` (string, optional): Optional custom filename for the screenshot (without extension). If not provided, uses timestamp-based naming.
     * `returnImageData` (boolean, optional, default: true): Whether to return the base64 image data in the response for immediate analysis.
     * `projectName` (string, optional): Optional project name to override automatic project detection. Screenshots will be organized under this project folder.
   * **Functionality**: Captures a screenshot via the Chrome extension with enhanced connection stability. Features 15-second timeout for autonomous operation reliability and organized storage system. Returns both file confirmation and base64 image data (if requested) for immediate analysis workflows.
3. **`getSelectedElement`**

   * **Description**: Retrieves information about the HTML element currently selected by the user in the browser's DevTools (if any).
   * **Parameters**: None.
   * **Functionality**: This tool queries the `browser-connector` server (at `http://<host>:<port>/selected-element`) to get details of the element last inspected or selected by the user in the Chrome DevTools. It returns a JSON string containing information about the selected element.
4. **`analyzeImageFile`**

   * **Description**: Load and analyze previously saved images or existing image files. Use this to access historical screenshots taken with takeScreenshot or any other image files in your project.
   * **Parameters**:
     * `imagePath` (string, required): The path to the image file. This can be an absolute path or a path relative to the project root.
     * `projectRoot` (string, optional): An optional path to override the default project root directory. If not provided, it uses the `PROJECT_ROOT` environment variable or the directory of the MCP server.
   * **Functionality**: The tool resolves the absolute path to the image, reads the file, converts its content to a base64 string, and determines its MIME type. It returns an object containing the `fileName`, `mimeType`, `size` (in bytes), and the `base64Data` of the image.
5. **`searchApiDocs`**

   * **Description**: Searches through an OpenAPI (Swagger) specification to find API endpoints that match a given pattern. This helps in understanding API structures, parameters, and responses.
   * **Parameters**:
     * `swaggerSource` (string, required): The source of the Swagger/OpenAPI specification. This can be a URL, a local file path, or a JSON string containing the specification. Defaults to the `SWAGGER_URL` environment variable if not provided.
     * `apiPattern` (string, required): A regular expression pattern to match against API paths or `operationId`s.
     * `includeSchemas` (boolean, optional, default: `true`): If true, the tool will attempt to resolve and include the full schema definitions for parameters, request bodies, and responses referenced via `$ref`.
   * **Functionality**:
     * Loads the OpenAPI specification from the `swaggerSource`.
     * Iterates through all defined paths and operations in the specification.
     * Matches the `apiPattern` against the endpoint path and its `operationId`.
     * For matching endpoints, it extracts details like the HTTP method, summary, description, parameters, request body, and responses.
     * If `includeSchemas` is true, it resolves and embeds any referenced JSON schemas directly into the output for the matching endpoints.
6. **`executeAuthenticatedApiCall`** *(NEW - Unified API Testing Tool)*

   * **Description**: Automatically retrieves authentication tokens from browser session and executes authenticated API calls. This eliminates token retrieval hallucination and ensures consistent API testing with real authentication.
   * **Parameters**:
     * `endpoint` (string, required): The API endpoint path (e.g., '/api/users', '/auth/profile'). Combined with API_BASE_URL from environment.
     * `method` (enum, optional, default: "GET"): HTTP method for the API call (GET, POST, PUT, PATCH, DELETE).
     * `requestBody` (any, optional): Request body for POST/PUT/PATCH requests (automatically JSON stringified).
     * `queryParams` (object, optional): Query parameters as key-value pairs.
     * `additionalHeaders` (object, optional): Additional headers to include in the request.
     * `includeResponseDetails` (boolean, optional, default: true): Whether to include detailed response analysis (status, headers, timing).
   * **Environment Variables Required**:
     * `AUTH_ORIGIN`: The origin where your app is running (e.g., "http://localhost:5173")
     * `AUTH_STORAGE_TYPE`: Where the auth token is stored ("cookie", "localStorage", or "sessionStorage")
     * `AUTH_TOKEN_KEY`: The key name for the auth token (e.g., "authToken", "accessToken")
     * `API_BASE_URL`: Your API base URL (e.g., "https://api.example.com")
   * **Functionality**:
     * Automatically retrieves auth token from browser session using predefined environment configuration
     * Constructs full API URL and adds query parameters if provided
     * Makes authenticated API request with proper Authorization header
     * Returns structured response with actual API data and optional detailed metrics
     * Eliminates manual token handling and curl command execution

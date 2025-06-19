#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { z } from "zod";

// Helper constants for ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the MCP server
const server = new McpServer({
  name: "Frontend-development-tools",
  version: "1.2.0",
});

// Track the discovered server connection - enhanced for autonomous operation
let discoveredHost = "127.0.0.1";
let discoveredPort = 3025;
let serverDiscovered = false;

// Function to get the default port from environment variable or default
function getDefaultServerPort(): number {
  // Check environment variable first
  if (process.env.BROWSER_TOOLS_PORT) {
    const envPort = parseInt(process.env.BROWSER_TOOLS_PORT, 10);
    if (!isNaN(envPort) && envPort > 0) {
      return envPort;
    }
  }

  // Try to read from .port file
  try {
    const portFilePath = path.join(__dirname, ".port");
    if (fs.existsSync(portFilePath)) {
      const port = parseInt(fs.readFileSync(portFilePath, "utf8").trim(), 10);
      if (!isNaN(port) && port > 0) {
        return port;
      }
    }
  } catch (err) {
    console.error("Error reading port file:", err);
  }

  // Default port if no configuration found
  return 3025;
}

// Function to get default server host from environment variable or default
function getDefaultServerHost(): string {
  // Check environment variable first
  if (process.env.BROWSER_TOOLS_HOST) {
    return process.env.BROWSER_TOOLS_HOST;
  }

  // Default to localhost
  return "127.0.0.1";
}

// Server discovery function - similar to what you have in the Chrome extension
async function discoverServer(): Promise<boolean> {
  console.log("Starting server discovery process");

  // Common hosts to try
  const hosts = [getDefaultServerHost(), "127.0.0.1", "localhost"];

  // Ports to try (start with default, then try others)
  const defaultPort = getDefaultServerPort();
  const ports = [defaultPort];

  // Add additional ports (fallback range)
  for (let p = 3025; p <= 3035; p++) {
    if (p !== defaultPort) {
      ports.push(p);
    }
  }

  console.log(`Will try hosts: ${hosts.join(", ")}`);
  console.log(`Will try ports: ${ports.join(", ")}`);

  // Try to find the server
  for (const host of hosts) {
    for (const port of ports) {
      try {
        console.log(`Checking ${host}:${port}...`);

        // Use the identity endpoint for validation
        const response = await fetch(`http://${host}:${port}/.identity`, {
          signal: AbortSignal.timeout(1000), // 1 second timeout
        });

        if (response.ok) {
          const identity = await response.json();

          // Verify this is actually our server by checking the signature
          if (identity.signature === "mcp-browser-connector-24x7") {
            console.log(`Successfully found server at ${host}:${port}`);

            // Save the discovered connection
            discoveredHost = host;
            discoveredPort = port;
            serverDiscovered = true;

            return true;
          }
        }
      } catch (error: any) {
        // Ignore connection errors during discovery
        console.error(`Error checking ${host}:${port}: ${error.message}`);
      }
    }
  }

  console.error("No server found during discovery");
  return false;
}

// Wrapper function to ensure server connection before making requests
async function withServerConnection<T>(
  apiCall: () => Promise<T>
): Promise<T | any> {
  // Attempt to discover server if not already discovered
  if (!serverDiscovered) {
    const discovered = await discoverServer();
    if (!discovered) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to discover browser connector server. Please ensure it's running.",
          },
        ],
        isError: true,
      };
    }
  }

  // Now make the actual API call with discovered host/port
  try {
    return await apiCall();
  } catch (error: any) {
    // If the request fails, try rediscovering the server once
    console.error(
      `API call failed: ${error.message}. Attempting rediscovery...`
    );
    serverDiscovered = false;

    if (await discoverServer()) {
      console.error("Rediscovery successful. Retrying API call...");
      try {
        // Retry the API call with the newly discovered connection
        return await apiCall();
      } catch (retryError: any) {
        console.error(`Retry failed: ${retryError.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error after reconnection attempt: ${retryError.message}`,
            },
          ],
        };
      }
    } else {
      console.error("Rediscovery failed. Could not reconnect to server.");
      return {
        content: [
          {
            type: "text",
            text: `Failed to reconnect to server: ${error.message}`,
          },
        ],      };
    }
  }
}

// Function to generate search suggestions for API call analysis
function generateSearchSuggestions(searchTerm: string): string[] {
  const suggestions: string[] = [];
  const term = searchTerm.toLowerCase();
  
  // Provide alternate search strategies
  suggestions.push("🔍 **Search Strategy Suggestions:**");
  
  // Singular/plural variations
  if (term.endsWith('s')) {
    const singular = term.slice(0, -1);
    suggestions.push(`   • Try singular form: "${singular}"`);
  } else {
    suggestions.push(`   • Try plural form: "${term}s"`);
  }
  
  // Partial matches
  suggestions.push(`   • Try partial match: "${term.slice(0, Math.max(3, term.length - 2))}"`);
  
  // // Common patterns
  // const patterns = [
  //   { pattern: 'activity', alternates: ['activities', 'action', 'event', 'task'] },
  //   { pattern: 'user', alternates: ['users', 'account', 'profile', 'auth'] },
  //   { pattern: 'order', alternates: ['orders', 'purchase', 'transaction'] },
  //   { pattern: 'product', alternates: ['products', 'item', 'catalog'] },
  //   { pattern: 'admin', alternates: ['administration', 'manage', 'dashboard'] }
  // ];
  
  // const matchingPattern = patterns.find(p => 
  //   term.includes(p.pattern) || p.alternates.some(alt => term.includes(alt))
  // );
  
  // if (matchingPattern) {
  //   suggestions.push(`   • Related terms: ${matchingPattern.alternates.map(alt => `"${alt}"`).join(', ')}`);
  // }
  
  // Generic suggestions
  suggestions.push("");
  suggestions.push("💡 **Common API Patterns:**");
  suggestions.push(`   • "api" - Find all API calls`);
  suggestions.push(`   • "get-" - Find getter endpoints`);
  suggestions.push(`   • "list" - Find list/collection endpoints`);
  suggestions.push(`   • "auth" - Find authentication calls`);
  suggestions.push(`   • you can use tags for filtering api's`);
  
  return suggestions;
}

server.tool(
  "analyzeApiCalls",
  "Analyze network requests made by the browser to debug API interactions. Use this to inspect request/response details, check authentication headers, or debug network errors. **Search Strategy**: Try both singular and plural forms (e.g., 'activity' AND 'activities'), partial matches work better than exact matches.",
  { // <--- START with a plain object brace {
    urlFilter: z.string().describe("Substring or regex pattern to filter request URLs. **Tips**: Use partial matches (e.g., 'activity' finds both 'get-activity-list' and 'activity-categories'). Try both singular/plural forms if first search returns empty results."),    details: z
      .array(
        z.enum([
          "url",
          "method", 
          "status",
          "timestamp",
          "requestHeaders",
          "responseHeaders",
          "requestBody",
          "responseBody",
        ])
      )
      .min(1)
      .describe("Specific details to retrieve for matching requests. Note: 'timestamp' is always included by default for chronological ordering."),
    timeStart: z.number().optional().describe("Optional Unix timestamp (in milliseconds) to filter requests that occurred after this time"),
    timeEnd: z.number().optional().describe("Optional Unix timestamp (in milliseconds) to filter requests that occurred before this time"),
    orderBy: z.enum(["timestamp", "url"]).optional().default("timestamp").describe("Order results by this field"),
    orderDirection: z.enum(["asc", "desc"]).optional().default("desc").describe("Order direction, newest first (desc) or oldest first (asc)"),
    limit: z.number().optional().default(20).describe("Maximum number of results to return"),
  },
  async (params) => {
    const { urlFilter, details, timeStart, timeEnd, orderBy, orderDirection, limit } = params;

    // Build query parameters with includeTimestamp=true to always include timestamps but only for filtered results
    const queryString = `?urlFilter=${encodeURIComponent(
      urlFilter
    )}&details=${details.join(",")}&includeTimestamp=true${timeStart ? `&timeStart=${timeStart}` : ''}${timeEnd ? `&timeEnd=${timeEnd}` : ''}&orderBy=${orderBy || "timestamp"}&orderDirection=${orderDirection || "desc"}&limit=${limit || 20}`;
    const targetUrl = `http://${discoveredHost}:${discoveredPort}/network-request-details${queryString}`;

    console.log(`MCP Tool: Fetching network details from ${targetUrl}`);

    return await withServerConnection(async () => {
      try {
        const response = await fetch(targetUrl);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Server returned ${response.status}: ${errorText || response.statusText}`
          );
        }

        const json = await response.json();        // Expecting an array of results from the server
        const results = json;
        
        // If no results found, provide search suggestions
        if (Array.isArray(results) && results.length === 0) {
          const suggestions = generateSearchSuggestions(urlFilter);
          return {
            content: [
              {
                type: "text",
                text: `No API calls found matching '${urlFilter}'. Try these search strategies:\n\n${suggestions.join('\n')}`
              }
            ]
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("Error fetching network request details:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to get network request details: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }
);

server.tool(
  "takeScreenshot",
  "Take a screenshot of the current browser tab and return the image data for immediate analysis. The screenshot is automatically organized by project and URL structure in a centralized directory system.",
  {
    filename: z.string().optional().describe("Optional custom filename for the screenshot (without extension). If not provided, uses timestamp-based naming."),
    returnImageData: z.boolean().optional().default(true).describe("Whether to return the base64 image data in the response for immediate analysis"),
    projectName: z.string().optional().describe("Optional project name to override automatic project detection. Screenshots will be organized under this project folder.")
  },
  async (params) => {
    return await withServerConnection(async () => {
      try {
        const { filename, returnImageData = true, projectName } = params || {};
        
        const targetUrl = `http://${discoveredHost}:${discoveredPort}/capture-screenshot`;
        const requestPayload = {
          filename: filename,
          returnImageData: returnImageData,
          projectName: projectName
        };
        
        const response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestPayload)
        });

        const result = await response.json();

        if (response.ok) {
          const responseContent: any[] = [
            {
              type: "text",
              text: `✅ Screenshot captured successfully!\n📁 Project: ${result.projectDirectory || 'default-project'}\n📂 Category: ${result.urlCategory || 'general'}\n💾 Saved to: ${result.filePath || 'browser extension panel'}`
            }
          ];

          // Include image data if requested and available
          if (returnImageData && result.imageData) {
            responseContent.push({
              type: "image",
              data: result.imageData,
              mimeType: "image/png"
            });
          }

          return {
            content: responseContent
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Error taking screenshot: ${result.error}`
              }
            ],
            isError: true
          };
        }
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to take screenshot: ${errorMessage}`
            }
          ],
          isError: true
        };
      }
    });
  }
);

server.tool(
  "getSelectedElement",
  "Get details about the currently selected element in the browser",
  async () => {
    return await withServerConnection(async () => {
      const response = await fetch(
        `http://${discoveredHost}:${discoveredPort}/selected-element`
      );
      const json = await response.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(json, null, 2),
          },
        ],
      };
    });
  }
);

server.tool(
  "executeAuthenticatedApiCall",
  "Execute authenticated API calls and get real response data. Use this to test API endpoints with actual authentication and understand the real response structure for accurate TypeScript interfaces. Call this after using searchApiDocs to validate endpoints with live data.",
  {
    endpoint: z.string().describe("The API endpoint path (e.g., '/api/users', '/auth/profile'). Will be combined with API_BASE_URL from environment."),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional().default("GET").describe("HTTP method for the API call"),
    requestBody: z.any().optional().describe("Request body for POST/PUT/PATCH requests (will be JSON stringified)"),
    queryParams: z.record(z.string()).optional().describe("Query parameters as key-value pairs"),
    additionalHeaders: z.record(z.string()).optional().describe("Additional headers to include in the request"),
    includeResponseDetails: z.boolean().optional().default(true).describe("Whether to include detailed response analysis (status, headers, timing)")
  },
  async (params) => {
    return await withServerConnection(async () => {
      try {
        const { endpoint, method = "GET", requestBody, queryParams, additionalHeaders, includeResponseDetails } = params;
        
        // Check required environment variables
        const authOrigin = process.env.AUTH_ORIGIN;
        const authStorageType = process.env.AUTH_STORAGE_TYPE;
        const authTokenKey = process.env.AUTH_TOKEN_KEY;
        const apiBaseUrl = process.env.API_BASE_URL;
        
        if (!authOrigin || !authStorageType || !authTokenKey || !apiBaseUrl) {
          return {
            content: [
              {
                type: "text",
                text: "Missing required environment variables. Please set: AUTH_ORIGIN, AUTH_STORAGE_TYPE, AUTH_TOKEN_KEY, and API_BASE_URL"
              }
            ],
            isError: true
          };
        }

        const targetUrl = `http://${discoveredHost}:${discoveredPort}/authenticated-api-call`;
        const requestPayload = {
          // Auth configuration from environment
          authConfig: {
            origin: authOrigin,
            storageType: authStorageType,
            tokenKey: authTokenKey
          },
          // API call configuration
          apiCall: {
            baseUrl: apiBaseUrl,
            endpoint: endpoint,
            method: method,
            requestBody: requestBody,
            queryParams: queryParams,
            additionalHeaders: additionalHeaders || {}
          },
          options: {
            includeResponseDetails: includeResponseDetails
          }
        };
        
        console.log(`[DEBUG] executeAuthenticatedApiCall - Making request to: ${endpoint}`);
        console.log(`[DEBUG] executeAuthenticatedApiCall - Method: ${method}`);
        console.log(`[DEBUG] executeAuthenticatedApiCall - Auth origin: ${authOrigin}`);
        
        const response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestPayload)
        });

        const result = await response.json();
        
        if (!response.ok) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to execute authenticated API call: ${result.error || "Unknown error"}`
              }
            ],
            isError: true
          };
        }

        // Structure the response for better readability
        const responseContent: any[] = [
          {
            type: "text",
            text: `✅ API Call Successful: ${method} ${apiBaseUrl}${endpoint}`
          }
        ];

        if (includeResponseDetails && result.details) {
          responseContent.push({
            type: "text",
            text: `📊 Response Details:\n${JSON.stringify({
              status: result.details.status,
              statusText: result.details.statusText,
              headers: result.details.headers,
              timing: result.details.timing
            }, null, 2)}`
          });
        }

        responseContent.push({
          type: "text",
          text: `📄 Response Data:\n${JSON.stringify(result.data, null, 2)}`
        });

        return {
          content: responseContent
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing authenticated API call: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    });
  }
);

// server.tool(
//   "getAccessToken",
//   "⚠️ DEPRECATED: Use executeAuthenticatedApiCall instead. This tool is kept for backward compatibility but the new unified tool is recommended for better reliability and automatic token handling.",
//   {
//     origin: z.string().describe("The origin URL (e.g., http://localhost:5173) to retrieve the token from."),
//     storageType: z.enum(["cookie", "localStorage", "sessionStorage"]).describe("Where to look for the token: in cookies, localStorage, or sessionStorage."),
//     tokenKey: z.string().describe("The name of the cookie or the localStorage/sessionStorage key that contains the auth token.")
//   },  async (params) => {
//     return await withServerConnection(async () => {
//       try {        const targetUrl = `http://${discoveredHost}:${discoveredPort}/auth-token-proxy`;
//         const requestBody = {
//           origin: params.origin,
//           storageType: params.storageType,
//           tokenKey: params.tokenKey
//         };
        
//         console.error(`[DEBUG] getAccessToken (DEPRECATED) - Target URL: ${targetUrl}`);
//         console.error(`[DEBUG] getAccessToken (DEPRECATED) - Request body: ${JSON.stringify(requestBody)}`);
//         console.error(`[DEBUG] getAccessToken (DEPRECATED) - Discovered host: ${discoveredHost}, port: ${discoveredPort}`);
        
//         const response = await fetch(targetUrl, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json"
//           },
//           body: JSON.stringify(requestBody)
//         });

//         const result = await response.json();
        
//         if (!response.ok) {
//           return {
//             content: [
//               {
//                 type: "text",
//                 text: `Failed to retrieve auth token: ${result.error || "Unknown error"}`
//               }
//             ],
//             isError: true
//           };
//         }

//         return {
//           content: [
//             {
//               type: "text",
//               text: `⚠️ Note: Consider using 'executeAuthenticatedApiCall' for better reliability.`
//             },
//             {
//               type: "text",
//               text: `Authentication token retrieved successfully from ${params.storageType}:`
//             },
//             {
//               type: "text",
//               text: result.token
//             }
//           ]
//         };
//       } catch (error) {
//         return {
//           content: [
//             {
//               type: "text",
//               text: `Error retrieving auth token: ${error instanceof Error ? error.message : String(error)}`
//             }
//           ],
//           isError: true
//         };
//       }
//     });
//   }
// );

// Add imageToBase64 tool: convert image file to Base64 string

server.tool(
  "analyzeImageFile",
  "Load and analyze previously saved images or existing image files. Use this to access historical screenshots taken with takeScreenshot or any other image files in your project.",
  {
    imagePath: z.string().describe("Path to the image file, project-relative or absolute"),
    projectRoot: z.string().optional().describe("Optional override for project root; defaults to PROJECT_ROOT env or one level up from MCP server")
  },
  async ({ imagePath, projectRoot: overrideRoot }) => {
    try {
      // Determine rootDir like searchApiDocs default pattern
      const rootDir = overrideRoot || process.env.PROJECT_ROOT || path.resolve(__dirname, "..");

      // If provided path is absolute, use it directly
      if (path.isAbsolute(imagePath)) {
        if (!fs.existsSync(imagePath)) {
          return {
            content: [{ type: "text", text: `File not found: ${imagePath}` }],
            isError: true,
          };
        }
        const buffer = fs.readFileSync(imagePath);
        const ext = path.extname(imagePath).toLowerCase();
        let mimeType = "image/png";
        if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
        else if (ext === ".gif") mimeType = "image/gif";
        else if (ext === ".webp") mimeType = "image/webp";
        else if (ext === ".svg") mimeType = "image/svg+xml";
        else if (ext === ".bmp") mimeType = "image/bmp";
        else if (ext === ".ico") mimeType = "image/x-icon";
        
        return { 
          content: [{ 
            type: "image",
            data: buffer.toString('base64'),
            mimeType
          }]
        };
      }

      // Resolve relative paths against current CWD and rootDir
      const possiblePaths = [
        path.resolve(process.cwd(), imagePath),
        path.resolve(rootDir, imagePath)
      ];
      // Try direct resolution first
      let absolutePath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];
      // Fallback: recursive search by filename if not found
      if (!fs.existsSync(absolutePath)) {
        const fileName = path.basename(imagePath);
        function findFileInDir(dir: string, name: string): string | null {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const entryPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              if (["node_modules", "dist"].includes(entry.name) || entry.name.startsWith(".")) continue;
              const found = findFileInDir(entryPath, name);
              if (found) return found;
            } else if (entry.name === name) {
              return entryPath;
            }
          }
          return null;
        }
        const found = findFileInDir(rootDir, fileName);
        if (found) absolutePath = found;
      }
      if (!fs.existsSync(absolutePath)) {
        return {
          content: [{ type: "text", text: `File not found: ${imagePath}` }],
          isError: true,
        };
      }
      
      const buffer = fs.readFileSync(absolutePath);
      const ext = path.extname(absolutePath).toLowerCase();
      let mimeType = "image/png";
      if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
      else if (ext === ".gif") mimeType = "image/gif";
      else if (ext === ".webp") mimeType = "image/webp";
      else if (ext === ".svg") mimeType = "image/svg+xml";
      else if (ext === ".bmp") mimeType = "image/bmp";
      else if (ext === ".ico") mimeType = "image/x-icon";
      
      return { 
        content: [{ 
          type: "image",
          data: buffer.toString('base64'),
          mimeType
        }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error processing image: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// // In-memory store for FRD ingestion tasks
// interface IngestionTask {
//   status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
//   message: string;
//   startTime: number;
//   endTime?: number;
//   documentPath?: string;
//   collectionName?: string;
// }
// const ingestionTasks: Record<string, IngestionTask> = {};

// server.tool(
//   "ingestFrdDocument",
//   "Process and index documents (PDF, TXT, MD, CSV) into a vector database for AI retrieval. Returns a task ID to track processing status.",
//   {
//     documentPath: z.string().describe("Path to the FRD document file (txt, md, csv, pdf)."),
//     projectRoot: z.string().optional().describe("Optional override for project root; defaults to PROJECT_ROOT env or one level up from MCP server."),
//     collectionName: z.string().optional().default("frd_documents").describe("Qdrant collection name (default: frd_documents)."),
//     qdrantUrl: z.string().optional().default(process.env.QDRANT_URL || "http://localhost:6333").describe("Qdrant server URL (default: local Qdrant instance on port 6333, override with QDRANT_URL env var)."),
//     qdrantApiKey: z.string().optional().describe("Qdrant API Key (optional, will try to use QDRANT_API_KEY env var if not provided)."),
//     vectorSize: z.number().optional().default(768).describe("Vector size for embeddings (default: 768 for Gemini text-embedding-004).")
//   },
//   async (params) => {
//     const { documentPath, projectRoot: overrideRoot, collectionName, qdrantUrl, qdrantApiKey, vectorSize } = params;
//     const taskId = uuidv4();

//     // Resolve document path
//     const rootDir = overrideRoot || process.env.PROJECT_ROOT || path.resolve(__dirname, "..");
//     let absoluteDocumentPath = "";
//     if (path.isAbsolute(documentPath)) {
//       absoluteDocumentPath = documentPath;
//     } else {
//       const possiblePaths = [
//         path.resolve(process.cwd(), documentPath),
//         path.resolve(rootDir, documentPath)
//       ];
//       absoluteDocumentPath = possiblePaths.find(p => fs.existsSync(p)) || "";
//     }

//     if (!absoluteDocumentPath || !fs.existsSync(absoluteDocumentPath)) {
//       return {
//         content: [{ type: "text", text: `Error: Document not found at path: ${documentPath}` }],
//         isError: true,
//       };
//     }

//     // Initialize task tracking
//     ingestionTasks[taskId] = {
//       status: "PENDING",
//       message: "Document ingestion initiated.",
//       startTime: Date.now(),
//       documentPath: absoluteDocumentPath,
//       collectionName,
//     };

//     // Perform ingestion asynchronously using an IIFE
//     (async () => {
//       try {
//         // Ensure GOOGLE_API_KEY is available for LlamaIndex operations (embeddings, LLM)
//         if (!GOOGLE_API_KEY_GLOBAL) { // Check the globally stored key status
//           throw new Error("GOOGLE_API_KEY environment variable not set. LlamaIndex cannot function.");
//         }

//         ingestionTasks[taskId].message = "Preparing for document processing...";
//         console.log(`Task ${taskId}: Preparing to process ${absoluteDocumentPath}`);

//         let loadedDocuments: Document[];
//         const fileExt = path.extname(absoluteDocumentPath).toLowerCase();

//         ingestionTasks[taskId].message = `Reading ${fileExt} file...`;
//         console.log(`Task ${taskId}: Reading ${fileExt} file: ${absoluteDocumentPath}`);

//         if (fileExt === ".pdf") {
//           const LLAMA_CLOUD_API_KEY_LOCAL = process.env.LLAMA_CLOUD_API_KEY;
//           if (!LLAMA_CLOUD_API_KEY_LOCAL) {
//             throw new Error("LLAMA_CLOUD_API_KEY environment variable not set. Required for PDF processing with LlamaParse.");
//           }
//           const llamaParseReader = new LlamaParseReader({
//             apiKey: LLAMA_CLOUD_API_KEY_LOCAL,
//             resultType: "json", // Changed for image extraction
//             // parsingInstruction: "...", // parsingInstruction might need adjustment or removal for JSON mode
//             // For now, let's see the default JSON output structure.
//           });
//           const rawJsonResponse = await llamaParseReader.loadData(absoluteDocumentPath);
//           console.log(`Task ${taskId}: LlamaParse JSON response structure:`, JSON.stringify(rawJsonResponse, null, 2));

//           loadedDocuments = []; // Initialize for Document and ImageNode objects
//           // Placeholder loop - to be refined based on actual JSON structure
//           if (Array.isArray(rawJsonResponse)) {
//             for (const item of rawJsonResponse) {
//               // TODO: Inspect 'item' structure and create Document or ImageNode
//               // For now, assuming items might be simple Document-like objects or need transformation
//               if (item && typeof item.text === 'string') { // Basic check for text content
//                 loadedDocuments.push(new Document({ text: item.text, id_: item.id_ || uuidv4() }));
//               } else {
//                 // Potentially an image object or other structure
//                 console.log(`Task ${taskId}: Unhandled item type in LlamaParse JSON:`, item);
//                 // loadedDocuments.push(new ImageNode({ image: item.imageUrl, id_: item.id_ || uuidv4() })); // Example if item has imageUrl
//               }
//             }
//           } else if (rawJsonResponse && typeof (rawJsonResponse as any).text === 'string'){
//             // Handle if the entire response is a single document object
//             loadedDocuments.push(new Document({ text: (rawJsonResponse as any).text, id_: (rawJsonResponse as any).id_ || uuidv4() }));
//           } else {
//             console.error(`Task ${taskId}: Unexpected LlamaParse JSON response format.`);
//             // loadedDocuments = []; // Ensure it's an empty array if parsing fails
//           }
          
//           // If no documents were effectively processed, it's an issue.
//           if (loadedDocuments.length === 0 && Array.isArray(rawJsonResponse) && rawJsonResponse.length > 0) {
//              console.warn(`Task ${taskId}: LlamaParse returned data, but it was not processed into Document/ImageNode objects. Check JSON structure.`);
//           }

//         // USER: The following CSV and MD blocks are temporarily commented out.
//         // } else if (fileExt === ".csv") {
//         //   const csvReader = new PapaCSVReader(); // Ensure PapaCSVReader is correctly imported
//         //   loadedDocuments = await csvReader.loadData(absoluteDocumentPath);
//         // } else if (fileExt === ".md") {
//         //   const mdReader = new MarkdownReader(); // Ensure MarkdownReader is correctly imported
//         //   loadedDocuments = await mdReader.loadData(absoluteDocumentPath);
//         } else if (fileExt === ".txt") {
//           const fileContent = fs.readFileSync(absoluteDocumentPath, "utf-8");
//           loadedDocuments = [new Document({ text: fileContent, id_: absoluteDocumentPath })];
//         } else {
//           throw new Error(`Unsupported file type: ${fileExt}`);
//         }

//         if (!loadedDocuments || loadedDocuments.length === 0) {
//           throw new Error("No documents were extracted from the file.");
//         }
//         ingestionTasks[taskId].message = `${loadedDocuments.length} document(s) extracted. Connecting to Qdrant...`;
//         console.log(`Task ${taskId}: ${loadedDocuments.length} document(s) extracted.`);

//         const qdrantClient = new QdrantClient({ url: qdrantUrl, apiKey: qdrantApiKey });

//         ingestionTasks[taskId].message = "Verifying Qdrant collection...";
//         console.log(`Task ${taskId}: Verifying Qdrant collection '${collectionName}' at ${qdrantUrl}`);
//         const collectionsList = await qdrantClient.getCollections();
//         const collectionExists = collectionsList.collections.some(c => c.name === collectionName);

//         if (!collectionExists) {
//           ingestionTasks[taskId].message = `Collection '${collectionName}' not found. Creating...`;
//           console.log(`Task ${taskId}: Qdrant collection '${collectionName}' not found. Creating with vector size ${vectorSize}.`);
//           await qdrantClient.createCollection(collectionName, { vectors: { size: vectorSize, distance: "Cosine" } });
//         } else {
//           console.log(`Task ${taskId}: Qdrant collection '${collectionName}' already exists.`);
//         }

//         const llamaQdrantStore = new LlamaIndexQdrantStore({
//           client: qdrantClient,
//           collectionName: collectionName,
//         });

//         ingestionTasks[taskId].message = "Indexing documents into Qdrant...";
//         console.log(`Task ${taskId}: Indexing ${loadedDocuments.length} documents...`);
        
//         // Using global Settings which includes embedModel and llm
//         await VectorStoreIndex.fromDocuments(loadedDocuments, {
//           storageContext: {
//             vectorStores: {
//               [ObjectType.TEXT]: llamaQdrantStore,
//               [ObjectType.IMAGE]: llamaQdrantStore, // Added for image embeddings (can use same store or a different one)
//             }, // Qdrant store for vectors
//             docStore: new SimpleDocumentStore(),     // In-memory document store
//             indexStore: new SimpleIndexStore(),    // In-memory index store
//           }
//           // serviceContext: Settings, // Removed: Global Settings will be used by default
//         });

//         ingestionTasks[taskId] = { ...ingestionTasks[taskId], status: "COMPLETED", message: "Ingestion completed successfully.", endTime: Date.now() };
//         console.log(`Task ${taskId}: Ingestion completed successfully for ${absoluteDocumentPath} into ${collectionName}.`);

//       } catch (error: any) {
//         console.error(`Task ${taskId}: Error during ingestion for ${absoluteDocumentPath}:`, error);
//         const errorMessage = error.message || "An unknown error occurred during ingestion.";
//         ingestionTasks[taskId] = { ...ingestionTasks[taskId], status: "FAILED", message: errorMessage, endTime: Date.now() };
//       }
//     })(); // End of IIFE

//     // Synchronous return for the tool call
//     return {
//       content: [{
//         type: "text",
//         text: `Ingestion task ${taskId} started. Status: PENDING. Document: ${absoluteDocumentPath}, Collection: ${collectionName}. Use getIngestionTaskStatus with taskId to check progress.`
//       }],
//       _meta: { taskId } 
//     };
//   }
// );

// server.tool(
//   "getFrdIngestionStatus",
//   "Check the status of a document ingestion task using the task ID returned from ingestFrdDocument.",
//   {
//     taskId: z.string().describe("The ID of the ingestion task."),
//   },
//   async ({ taskId }) => {
//     const task = ingestionTasks[taskId];
//     if (!task) {
//       return {
//         content: [{ type: "text", text: `No task found with ID: ${taskId}` }],
//         isError: true,
//       };
//     }
//     return {
//       content: [
//         {
//           type: "text",
//           text: JSON.stringify(task, null, 2),
//         },
//       ],
//     };
//   }
// );

// Function to load Swagger documentation (either from URL or file)
async function loadSwaggerDoc(swaggerSource: string): Promise<any> {
  try {
    // Check if it's a URL
    if (swaggerSource.startsWith('http://') || swaggerSource.startsWith('https://')) {
      const response = await fetch(swaggerSource);
      if (!response.ok) {
        throw new Error(`Failed to fetch Swagger doc: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    }
    
    // Otherwise, try to parse it as a JSON string
    try {
      return JSON.parse(swaggerSource);
    } catch {
      // If not valid JSON, try to read it as a file path
      const content = fs.readFileSync(swaggerSource, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error loading Swagger documentation: ${error}`);
    throw error;
  }
}

// Enhanced function to search for API endpoints with multiple filtering options
function findMatchingEndpoints(swagger: any, filters: {
  apiPattern?: string;
  tag?: string;
  method?: string;
  includeAuth?: boolean;
  hasParameters?: boolean;
  maxResults?: number;
}): any[] {
  const matches: any[] = [];
  const { apiPattern, tag, method, includeAuth, hasParameters, maxResults = 20 } = filters;
  
  // Create regex if pattern is provided
  const regex = apiPattern ? new RegExp(apiPattern, 'i') : null;
  
  // Handle OpenAPI v3 and Swagger v2
  if (swagger.paths) {
    for (const [path, pathItem] of Object.entries(swagger.paths)) {
      for (const [httpMethod, operation] of Object.entries(pathItem as object)) {
        if (httpMethod === 'parameters') continue; // Skip path parameters

        const op = operation as any;
        const fullPath = path;
        const operationId = op.operationId || `${httpMethod} ${path}`;
        
        // Apply filters
        let shouldInclude = true;
        
        // Pattern matching
        if (regex && shouldInclude) {
          shouldInclude = regex.test(path) || regex.test(operationId) || 
                         (op.summary && regex.test(op.summary)) ||
                         (op.description && regex.test(op.description));
        }
        
        // Tag filtering
        if (tag && shouldInclude) {
          const tags = op.tags || [];
          shouldInclude = tags.some((t: string) => t.toLowerCase().includes(tag.toLowerCase()));
        }
        
        // HTTP method filtering
        if (method && shouldInclude) {
          shouldInclude = httpMethod.toUpperCase() === method.toUpperCase();
        }
        
        // Authentication filtering
        if (includeAuth && shouldInclude) {
          const hasSecurity = op.security && op.security.length > 0;
          shouldInclude = hasSecurity;
        }
        
        // Parameters filtering
        if (hasParameters && shouldInclude) {
          const hasParams = (op.parameters && op.parameters.length > 0) || 
                           op.requestBody || 
                           path.includes('{');
          shouldInclude = hasParams;
        }
        
        if (shouldInclude) {
          const endpoint: any = {
            path: fullPath,
            method: httpMethod.toUpperCase(),
            operationId,
            summary: op.summary || '',
            description: op.description || '',
            tags: op.tags || [],
            parameters: op.parameters || [],
            requestBody: op.requestBody || null,
            responses: op.responses || {},
            security: op.security || [],
            servers: op.servers || swagger.servers || [],
            // Additional metadata for better understanding
            hasAuth: !!(op.security && op.security.length > 0),
            hasParams: !!(op.parameters && op.parameters.length > 0) || !!op.requestBody || path.includes('{'),
            parameterCount: (op.parameters || []).length,
            responseCount: Object.keys(op.responses || {}).length
          };
          
          // Add Swagger v2 specific fields
          if (swagger.swagger && swagger.swagger.startsWith('2.')) {
            endpoint.consumes = op.consumes || swagger.consumes || [];
            endpoint.produces = op.produces || swagger.produces || [];
            endpoint.schemes = op.schemes || swagger.schemes || [];
            endpoint.host = swagger.host;
            endpoint.basePath = swagger.basePath || '';
          }
          
          matches.push(endpoint);
          
          // Respect maxResults limit
          if (matches.length >= maxResults) {
            break;
          }
        }
      }
      
      if (matches.length >= maxResults) {
        break;
      }
    }
  }
  
  return matches;
}

// Function to extract available tags from swagger documentation
function getAvailableTags(swagger: any): string[] {
  const tags = new Set<string>();
  
  // Get tags from the global tags definition
  if (swagger.tags && Array.isArray(swagger.tags)) {
    swagger.tags.forEach((tag: any) => {
      if (tag.name) tags.add(tag.name);
    });
  }
  
  // Get tags from individual operations
  if (swagger.paths) {
    for (const pathItem of Object.values(swagger.paths)) {
      for (const [method, operation] of Object.entries(pathItem as object)) {
        if (method === 'parameters') continue;
        const op = operation as any;
        if (op.tags && Array.isArray(op.tags)) {
          op.tags.forEach((tag: string) => tags.add(tag));
        }
      }
    }
  }
  
  return Array.from(tags).sort();
}

// Function to generate suggested API patterns when no endpoints are found
function generateApiSuggestions(apiPattern: string, swagger: any): string[] {
  const suggestions: string[] = [];
  const pattern = apiPattern.toLowerCase();
  
  // Common API patterns and their variations
  const commonPatterns = [
    // CRUD operations
    { pattern: 'get', suggestions: ['GET /{resource}', 'GET /{resource}/{id}', 'GET /{resource}/list'] },
    { pattern: 'post', suggestions: ['POST /{resource}', 'POST /{resource}/create'] },
    { pattern: 'put', suggestions: ['PUT /{resource}/{id}', 'PUT /{resource}/update'] },
    { pattern: 'patch', suggestions: ['PATCH /{resource}/{id}'] },
    { pattern: 'delete', suggestions: ['DELETE /{resource}/{id}'] },
    
    // Common resource patterns
    { pattern: 'user', suggestions: ['/api/users', '/users/{id}', '/auth/users', '/user/profile'] },
    { pattern: 'auth', suggestions: ['/auth/login', '/auth/logout', '/auth/register', '/auth/token', '/oauth/token'] },
    { pattern: 'login', suggestions: ['/auth/login', '/login', '/api/auth/login'] },
    { pattern: 'token', suggestions: ['/auth/token', '/oauth/token', '/api/token/refresh'] },
    { pattern: 'profile', suggestions: ['/user/profile', '/api/profile', '/users/me'] },
    
    // Data operations
    { pattern: 'list', suggestions: ['/api/{resource}/list', '/{resource}', '/api/{resource}'] },
    { pattern: 'search', suggestions: ['/api/search', '/{resource}/search', '/search/{resource}'] },
    { pattern: 'filter', suggestions: ['/{resource}?filter=', '/api/{resource}/filter'] },
    { pattern: 'page', suggestions: ['/{resource}?page=', '/{resource}?offset=', '/{resource}?limit='] },
    
    // File operations
    { pattern: 'upload', suggestions: ['/api/files/upload', '/upload', '/media/upload'] },
    { pattern: 'download', suggestions: ['/api/files/download', '/download/{id}', '/media/{id}'] },
    { pattern: 'file', suggestions: ['/api/files', '/files/{id}', '/media/files'] },
    
    // Common business operations
    { pattern: 'order', suggestions: ['/api/orders', '/orders/{id}', '/orders/create'] },
    { pattern: 'payment', suggestions: ['/api/payments', '/payments/process', '/billing/payments'] },
    { pattern: 'product', suggestions: ['/api/products', '/products/{id}', '/catalog/products'] },
    { pattern: 'category', suggestions: ['/api/categories', '/categories/{id}', '/products/categories'] },
    
    // Admin and management
    { pattern: 'admin', suggestions: ['/admin/api', '/api/admin', '/admin/{resource}'] },
    { pattern: 'config', suggestions: ['/api/config', '/admin/config', '/settings/config'] },
    { pattern: 'setting', suggestions: ['/api/settings', '/user/settings', '/admin/settings'] },
    
    // Analytics and reporting
    { pattern: 'analytics', suggestions: ['/api/analytics', '/analytics/events', '/analytics/reports'] },
    { pattern: 'report', suggestions: ['/api/reports', '/reports/{type}', '/analytics/reports'] },
    { pattern: 'metric', suggestions: ['/api/metrics', '/analytics/metrics', '/monitoring/metrics'] },
    
    // Health and status
    { pattern: 'health', suggestions: ['/health', '/api/health', '/status/health'] },
    { pattern: 'status', suggestions: ['/status', '/api/status', '/health/status'] },
    { pattern: 'ping', suggestions: ['/ping', '/api/ping', '/health/ping'] }
  ];
  
  // Find matching patterns
  const matchingPatterns = commonPatterns.filter(p => 
    pattern.includes(p.pattern) || p.pattern.includes(pattern)
  );
  
  // Add suggestions from matching patterns
  matchingPatterns.forEach(p => {
    suggestions.push(...p.suggestions);
  });
  
  // If no specific patterns match, provide general suggestions based on the pattern
  if (suggestions.length === 0) {
    // Try to extract potential resource names from the pattern
    const resourceGuess = pattern.replace(/[^a-z0-9]/g, '');
    if (resourceGuess) {
      suggestions.push(
        `/api/${resourceGuess}`,
        `/api/${resourceGuess}/{id}`,
        `/${resourceGuess}`,
        `/${resourceGuess}/list`,
        `/api/${resourceGuess}/create`,
        `/api/${resourceGuess}/search`
      );
    }
    
    // Generic API patterns
    suggestions.push(
      '/api/v1/{resource}',
      '/api/v2/{resource}',
      '/{resource}',
      '/rest/{resource}',
      '/graphql'
    );
  }
  
  // Extract actual paths from the swagger doc to provide context-aware suggestions
  if (swagger.paths) {
    const allPaths = Object.keys(swagger.paths);
    
    // Find paths that contain parts of the search pattern
    const similarPaths = allPaths.filter(path => {
      const pathLower = path.toLowerCase();
      const words = pattern.split(/[^a-z0-9]/);
      return words.some(word => word.length > 2 && pathLower.includes(word));
    });
    
    if (similarPaths.length > 0) {
      suggestions.push('');
      suggestions.push('Similar paths found in your API:');
      suggestions.push(...similarPaths.slice(0, 10)); // Limit to first 10
    }
    
    // Suggest based on common path segments
    const pathSegments = allPaths.flatMap(path => 
      path.split('/').filter(segment => segment && !segment.startsWith('{'))
    );
    const uniqueSegments = [...new Set(pathSegments)];
    
    const relatedSegments = uniqueSegments.filter(segment => 
      segment.toLowerCase().includes(pattern) || pattern.includes(segment.toLowerCase())
    );
    
    if (relatedSegments.length > 0) {
      suggestions.push('');
      suggestions.push('Related API segments in your documentation:');
      relatedSegments.slice(0, 8).forEach(segment => {
        suggestions.push(`/api/${segment}`, `/${segment}`);
      });
    }
  }
  
  // Remove duplicates and empty strings, keep original order
  return [...new Set(suggestions.filter(s => s.trim() !== ''))];
}

// Add the searchApiDocs tool definition
server.tool(
  "searchApiDocs",
  "Search API documentation to find endpoints, parameters, and response schemas. Use this to discover available API endpoints for the features you're implementing. **Workflow**: Use searchApiDocs first to find correct endpoint names, then analyzeApiCalls to see actual network requests, then executeAuthenticatedApiCall to test with real data.",
  {
    apiPattern: z.string().optional().describe("Regex pattern to match against API paths or operationIds (optional if using other filters)"),
    tag: z.string().optional().describe("Filter by OpenAPI tag (e.g., 'Admin', 'Customer', 'Vendor Auth', 'Activity')"),
    method: z.string().optional().describe("Filter by HTTP method (GET, POST, PUT, PATCH, DELETE)"),
    includeSchemas: z.boolean().optional().default(true).describe("Whether to include full schema definitions in the response"),
    searchType: z.enum(["pattern", "tag", "method", "auth", "parameters", "comprehensive"]).optional().default("comprehensive").describe("Type of search: 'pattern' for regex matching, 'tag' for tag-based, 'method' for HTTP method, 'auth' for auth-required endpoints, 'parameters' for endpoints with query/path params, 'comprehensive' for all matches"),
    includeAuth: z.boolean().optional().default(false).describe("Only return endpoints that require authentication"),
    hasParameters: z.boolean().optional().default(false).describe("Only return endpoints that have parameters (query, path, or body)"),
    maxResults: z.number().optional().default(20).describe("Maximum number of results to return"),
  },
  async (params) => {
    try {
      const { apiPattern, tag, method, includeAuth, hasParameters, maxResults, includeSchemas } = params;
      const swaggerSource = process.env.SWAGGER_URL;
      
      if (!swaggerSource) {
        throw new Error("SWAGGER_URL environment variable is not set");
      }
      
      console.log(`Searching for API endpoints with filters:`, { apiPattern, tag, method, includeAuth, hasParameters });
      
      // Load the Swagger documentation
      const swaggerDoc = await loadSwaggerDoc(swaggerSource);
      
      // Find matching endpoints using enhanced filtering
      const matchingEndpoints = findMatchingEndpoints(swaggerDoc, {
        apiPattern,
        tag,
        method,
        includeAuth,
        hasParameters,
        maxResults
      });
      
      // If includeSchemas is true, include relevant schema definitions
      if (includeSchemas && matchingEndpoints.length > 0) {
        // Add schemas from components (OpenAPI v3) or definitions (Swagger v2)
        const schemas = swaggerDoc.components?.schemas || swaggerDoc.definitions || {};
        
        // Add schemas to the response
        matchingEndpoints.forEach(endpoint => {
          endpoint.schemas = {};
          
          // Extract schema references from parameters
          if (endpoint.parameters) {
            endpoint.parameters.forEach((param: any) => {
              if (param.schema && param.schema.$ref) {
                const schemaName = param.schema.$ref.split('/').pop();
                if (schemas[schemaName]) {
                  endpoint.schemas[schemaName] = schemas[schemaName];
                }
              }
            });
          }
          
          // Extract schema references from requestBody (OpenAPI v3)
          if (endpoint.requestBody && endpoint.requestBody.content) {
            for (const contentType in endpoint.requestBody.content) {
              const content = endpoint.requestBody.content[contentType];
              if (content.schema && content.schema.$ref) {
                const schemaName = content.schema.$ref.split('/').pop();
                if (schemas[schemaName]) {
                  endpoint.schemas[schemaName] = schemas[schemaName];
                }
              }
            }
          }
          
          // Extract schema references from responses
          if (endpoint.responses) {
            for (const statusCode in endpoint.responses) {
              const response = endpoint.responses[statusCode];
              // OpenAPI v3
              if (response.content) {
                for (const contentType in response.content) {
                  const content = response.content[contentType];
                  if (content.schema && content.schema.$ref) {
                    const schemaName = content.schema.$ref.split('/').pop();
                    if (schemas[schemaName]) {
                      endpoint.schemas[schemaName] = schemas[schemaName];
                    }
                  }
                }
              }
              // Swagger v2
              else if (response.schema && response.schema.$ref) {
                const schemaName = response.schema.$ref.split('/').pop();
                if (schemas[schemaName]) {
                  endpoint.schemas[schemaName] = schemas[schemaName];
                }
              }
            }
          }
        });
      }
      
      if (matchingEndpoints.length === 0) {
        // Generate suggestions when no endpoints are found
        const searchTerm = apiPattern || tag || method || "api";
        const suggestions = generateApiSuggestions(searchTerm, swaggerDoc);
        
        return {
          content: [
            {
              type: "text",
              text: `No API endpoints found matching filters: ${JSON.stringify({ apiPattern, tag, method, includeAuth, hasParameters })}`,
            },
            {
              type: "text", 
              text: "\n--- Suggested API Patterns ---\n" + suggestions.join('\n'),
            },
          ],
        };
      }
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(matchingEndpoints, null, 2),
          },
        ],
      };
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error in searchApiDocs tool: ${errorMessage}`);
      return {
        content: [
          {
            type: "text",
            text: `Failed to search API documentation: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// server.tool(
//   "discoverApiStructure",
//   "Get an overview of the API structure including available tags, endpoints, and authentication schemes. Use this first when working with a new API to understand what's available before searching for specific endpoints.",
//   {},
//   async () => {
//     try {
//       const swaggerSource = process.env.SWAGGER_URL;
      
//       if (!swaggerSource) {
//         throw new Error("SWAGGER_URL environment variable is not set");
//       }
      
//       console.log(`Discovering API structure from ${swaggerSource}`);
      
//       // Load the Swagger documentation
//       const swaggerDoc = await loadSwaggerDoc(swaggerSource);
      
//       // Extract API information
//       const structure = {
//         info: {
//           title: swaggerDoc.info?.title || 'Unknown API',
//           version: swaggerDoc.info?.version || 'Unknown',
//           description: swaggerDoc.info?.description || 'No description available'
//         },
//         servers: swaggerDoc.servers || [],
//         tags: getAvailableTags(swaggerDoc),
//         totalEndpoints: 0,
//         endpointsByMethod: {} as { [key: string]: number },
//         endpointsByTag: {} as { [key: string]: number },
//         authenticationSchemes: {},
//         hasParameters: 0,
//         hasAuthentication: 0
//       };
      
//       // Extract authentication schemes
//       if (swaggerDoc.components?.securitySchemes) {
//         structure.authenticationSchemes = swaggerDoc.components.securitySchemes;
//       } else if (swaggerDoc.securityDefinitions) {
//         structure.authenticationSchemes = swaggerDoc.securityDefinitions;
//       }
      
//       // Count endpoints and analyze structure
//       if (swaggerDoc.paths) {
//         for (const [path, pathItem] of Object.entries(swaggerDoc.paths)) {
//           for (const [method, operation] of Object.entries(pathItem as object)) {
//             if (method === 'parameters') continue;
            
//             const op = operation as any;
//             structure.totalEndpoints++;
            
//             // Count by HTTP method
//             const httpMethod = method.toUpperCase();
//             structure.endpointsByMethod[httpMethod] = (structure.endpointsByMethod[httpMethod] || 0) + 1;
            
//             // Count by tags
//             if (op.tags && Array.isArray(op.tags)) {
//               op.tags.forEach((tag: string) => {
//                 structure.endpointsByTag[tag] = (structure.endpointsByTag[tag] || 0) + 1;
//               });
//             }
            
//             // Count endpoints with parameters
//             if ((op.parameters && op.parameters.length > 0) || op.requestBody || path.includes('{')) {
//               structure.hasParameters++;
//             }
            
//             // Count endpoints with authentication
//             if (op.security && op.security.length > 0) {
//               structure.hasAuthentication++;
//             }
//           }
//         }
//       }
      
//       return {
//         content: [
//           {
//             type: "text",
//             text: JSON.stringify(structure, null, 2),
//           },
//         ],
//       };
//     } catch (error: any) {
//       const errorMessage = error instanceof Error ? error.message : String(error);
//       console.error(`Error in discoverApiStructure tool: ${errorMessage}`);
//       return {
//         content: [
//           {
//             type: "text",
//             text: `Failed to discover API structure: ${errorMessage}`,
//           },
//         ],
//         isError: true,
//       };
//     }
//   }
// );


// Start receiving messages on stdio
(async () => {
  try {
    // Attempt initial server discovery
    console.error("Attempting initial server discovery on startup...");
    await discoverServer();
    if (serverDiscovered) {
      console.error(
        `Successfully discovered server at ${discoveredHost}:${discoveredPort}`
      );
    } else {
      console.error(
        "Initial server discovery failed. Will try again when tools are used."
      );
    }

    const transport = new StdioServerTransport();

    // Ensure stdout is only used for JSON messages
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk: any, encoding?: any, callback?: any) => {
      // Only allow JSON messages to pass through
      if (typeof chunk === "string" && !chunk.startsWith("{")) {
        return true; // Silently skip non-JSON messages
      }
      return originalStdoutWrite(chunk, encoding, callback);
    };

    await server.connect(transport);
  } catch (error) {
    console.error("Failed to initialize MCP server:", error);
    process.exit(1);
  }
})();

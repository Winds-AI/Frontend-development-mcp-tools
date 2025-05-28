#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { z } from "zod";
import { QdrantClient } from "@qdrant/qdrant-js"; // Corrected Qdrant client import
import { QdrantVectorStore as LlamaIndexQdrantStore } from "@llamaindex/qdrant";
import { LlamaParseReader } from "llamaindex";
// import { PapaCSVReader, MarkdownReader } from "llamaindex/readers/file"; // Temporarily commented out - USER: Please verify correct import for your LlamaIndex version
import { Document, VectorStoreIndex, Settings, SimpleDocumentStore, SimpleIndexStore, ObjectType, ImageNode } from "llamaindex";
import { Gemini, GeminiEmbedding, GEMINI_EMBEDDING_MODEL } from "@llamaindex/google"; // Gemini Embedding, LLM & Model Enum
import { v4 as uuidv4 } from 'uuid';


// Helper constants for ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Global LlamaIndex Settings Configuration ---
const GOOGLE_API_KEY_GLOBAL = process.env.GOOGLE_API_KEY;
if (GOOGLE_API_KEY_GLOBAL) {
  Settings.llm = new Gemini({ apiKey: GOOGLE_API_KEY_GLOBAL });
  Settings.embedModel = new GeminiEmbedding({ model: GEMINI_EMBEDDING_MODEL.TEXT_EMBEDDING_004 });
  console.log("Global LlamaIndex Gemini LLM and Embedding Model configured.");
} else {
  console.warn("GOOGLE_API_KEY not found in environment variables. Global LlamaIndex models will not be configured. Some functionalities may fail.");
}

// Create the MCP server
const server = new McpServer({
  name: "Browser Tools MCP",
  version: "1.2.0",
});

// Track the discovered server connection
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
        ],
      };
    }
  }
}

server.tool(
  "analyzeApiCalls",
  "Analyze API interactions between frontend and backend by retrieving filtered network request details. Use this tool when you need to: 1) Inspect API calls to specific endpoints, 2) Debug network errors and status codes, 3) Examine request/response payloads, 4) Investigate authentication headers, or 5) Monitor AJAX requests. Filter by URL patterns and select which specific details to retrieve (url, method, status, headers, body). Results include timestamps to help distinguish between identical API calls made at different times.",
  { // <--- START with a plain object brace {
    urlFilter: z.string().describe("Substring or pattern to filter request URLs."),
    details: z
      .array(
        z.enum([
          "url",
          "method", 
          "status",
          "requestHeaders",
          "responseHeaders",
          "requestBody",
          "responseBody",
        ])
      )
      .min(1)
      .describe("Specific details to retrieve for matching requests."),
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

        const json = await response.json();

        // Expecting an array of results from the server
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(json, null, 2),
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
  "Take a screenshot of the current browser tab then analyze it to understand the current UI state",
  async () => {
    return await withServerConnection(async () => {
      try {
        const response = await fetch(
          `http://${discoveredHost}:${discoveredPort}/capture-screenshot`,
          {
            method: "POST",
          }
        );

        const result = await response.json();

        if (response.ok) {
          return {
            content: [
              {
                type: "text",
                text: "Successfully saved screenshot",
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Error taking screenshot: ${result.error}`,
              },
            ],
          };
        }
      } catch (error: any) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to take screenshot: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }
);

server.tool(
  "getSelectedElement",
  "Get the selected element from the browser",
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
  "getAccessToken",
  "Retrieves authentication token from a specified origin (e.g., localhost:5173) either from cookies, localStorage, or sessionStorage. This helps when making authenticated API requests.",
  {
    origin: z.string().describe("The origin URL (e.g., http://localhost:5173) to retrieve the token from."),
    storageType: z.enum(["cookie", "localStorage", "sessionStorage"]).describe("Where to look for the token: in cookies, localStorage, or sessionStorage."),
    tokenKey: z.string().describe("The name of the cookie or the localStorage/sessionStorage key that contains the auth token.")
  },  async (params) => {
    return await withServerConnection(async () => {
      try {
        const targetUrl = `http://${discoveredHost}:${discoveredPort}/get-auth-token`;
        const requestBody = {
          origin: params.origin,
          storageType: params.storageType,
          tokenKey: params.tokenKey
        };
        
        console.error(`[DEBUG] getAccessToken - Target URL: ${targetUrl}`);
        console.error(`[DEBUG] getAccessToken - Request body: ${JSON.stringify(requestBody)}`);
        console.error(`[DEBUG] getAccessToken - Discovered host: ${discoveredHost}, port: ${discoveredPort}`);
        
        const response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)        });

        console.error(`[DEBUG] getAccessToken - Response status: ${response.status}`);
        console.error(`[DEBUG] getAccessToken - Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
        
        const responseText = await response.text();
        console.error(`[DEBUG] getAccessToken - Raw response: ${responseText.substring(0, 200)}...`);
        
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (parseError: any) {
          console.error(`[DEBUG] getAccessToken - JSON parse error: ${parseError.message}`);
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
        }
        
        if (!response.ok) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to retrieve auth token: ${result.error || "Unknown error"}`
              }
            ],
            isError: true
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Authentication token retrieved successfully from ${params.storageType}:`
            },
            {
              type: "text",
              text: result.token
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving auth token: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    });
  }
);

// Add imageToBase64 tool: convert image file to Base64 string
server.tool(
  "analyzeImageFile",
  "Given an image path, returns the image file (base64-encoded) and metadata for on-the-fly UI analysis in frontend development.",
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

// In-memory store for FRD ingestion tasks
interface IngestionTask {
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  message: string;
  startTime: number;
  endTime?: number;
  documentPath?: string;
  collectionName?: string;
}
const ingestionTasks: Record<string, IngestionTask> = {};

server.tool(
  "ingestFrdDocument",
  "Takes a path to an FRD document (TXT, MD, CSV, PDF), starts an asynchronous ingestion process into QdrantDB using LlamaIndex, and returns a task ID. Requires GOOGLE_API_KEY env var for Gemini embeddings. For Qdrant Cloud, also requires QDRANT_API_KEY env var or qdrantApiKey parameter.",
  {
    documentPath: z.string().describe("Path to the FRD document file (txt, md, csv, pdf)."),
    projectRoot: z.string().optional().describe("Optional override for project root; defaults to PROJECT_ROOT env or one level up from MCP server."),
    collectionName: z.string().optional().default("frd_documents").describe("Qdrant collection name (default: frd_documents)."),
    qdrantUrl: z.string().optional().default(process.env.QDRANT_URL || "http://localhost:6333").describe("Qdrant server URL (default: local Qdrant instance on port 6333, override with QDRANT_URL env var)."),
    qdrantApiKey: z.string().optional().describe("Qdrant API Key (optional, will try to use QDRANT_API_KEY env var if not provided)."),
    vectorSize: z.number().optional().default(768).describe("Vector size for embeddings (default: 768 for Gemini text-embedding-004).")
  },
  async (params) => {
    const { documentPath, projectRoot: overrideRoot, collectionName, qdrantUrl, qdrantApiKey, vectorSize } = params;
    const taskId = uuidv4();

    // Resolve document path
    const rootDir = overrideRoot || process.env.PROJECT_ROOT || path.resolve(__dirname, "..");
    let absoluteDocumentPath = "";
    if (path.isAbsolute(documentPath)) {
      absoluteDocumentPath = documentPath;
    } else {
      const possiblePaths = [
        path.resolve(process.cwd(), documentPath),
        path.resolve(rootDir, documentPath)
      ];
      absoluteDocumentPath = possiblePaths.find(p => fs.existsSync(p)) || "";
    }

    if (!absoluteDocumentPath || !fs.existsSync(absoluteDocumentPath)) {
      return {
        content: [{ type: "text", text: `Error: Document not found at path: ${documentPath}` }],
        isError: true,
      };
    }

    // Initialize task tracking
    ingestionTasks[taskId] = {
      status: "PENDING",
      message: "Document ingestion initiated.",
      startTime: Date.now(),
      documentPath: absoluteDocumentPath,
      collectionName,
    };

    // Perform ingestion asynchronously using an IIFE
    (async () => {
      try {
        // Ensure GOOGLE_API_KEY is available for LlamaIndex operations (embeddings, LLM)
        if (!GOOGLE_API_KEY_GLOBAL) { // Check the globally stored key status
          throw new Error("GOOGLE_API_KEY environment variable not set. LlamaIndex cannot function.");
        }

        ingestionTasks[taskId].message = "Preparing for document processing...";
        console.log(`Task ${taskId}: Preparing to process ${absoluteDocumentPath}`);

        let loadedDocuments: Document[];
        const fileExt = path.extname(absoluteDocumentPath).toLowerCase();

        ingestionTasks[taskId].message = `Reading ${fileExt} file...`;
        console.log(`Task ${taskId}: Reading ${fileExt} file: ${absoluteDocumentPath}`);

        if (fileExt === ".pdf") {
          const LLAMA_CLOUD_API_KEY_LOCAL = process.env.LLAMA_CLOUD_API_KEY;
          if (!LLAMA_CLOUD_API_KEY_LOCAL) {
            throw new Error("LLAMA_CLOUD_API_KEY environment variable not set. Required for PDF processing with LlamaParse.");
          }
          const llamaParseReader = new LlamaParseReader({
            apiKey: LLAMA_CLOUD_API_KEY_LOCAL,
            resultType: "json", // Changed for image extraction
            // parsingInstruction: "...", // parsingInstruction might need adjustment or removal for JSON mode
            // For now, let's see the default JSON output structure.
          });
          const rawJsonResponse = await llamaParseReader.loadData(absoluteDocumentPath);
          console.log(`Task ${taskId}: LlamaParse JSON response structure:`, JSON.stringify(rawJsonResponse, null, 2));

          loadedDocuments = []; // Initialize for Document and ImageNode objects
          // Placeholder loop - to be refined based on actual JSON structure
          if (Array.isArray(rawJsonResponse)) {
            for (const item of rawJsonResponse) {
              // TODO: Inspect 'item' structure and create Document or ImageNode
              // For now, assuming items might be simple Document-like objects or need transformation
              if (item && typeof item.text === 'string') { // Basic check for text content
                loadedDocuments.push(new Document({ text: item.text, id_: item.id_ || uuidv4() }));
              } else {
                // Potentially an image object or other structure
                console.log(`Task ${taskId}: Unhandled item type in LlamaParse JSON:`, item);
                // loadedDocuments.push(new ImageNode({ image: item.imageUrl, id_: item.id_ || uuidv4() })); // Example if item has imageUrl
              }
            }
          } else if (rawJsonResponse && typeof (rawJsonResponse as any).text === 'string'){
            // Handle if the entire response is a single document object
            loadedDocuments.push(new Document({ text: (rawJsonResponse as any).text, id_: (rawJsonResponse as any).id_ || uuidv4() }));
          } else {
            console.error(`Task ${taskId}: Unexpected LlamaParse JSON response format.`);
            // loadedDocuments = []; // Ensure it's an empty array if parsing fails
          }
          
          // If no documents were effectively processed, it's an issue.
          if (loadedDocuments.length === 0 && Array.isArray(rawJsonResponse) && rawJsonResponse.length > 0) {
             console.warn(`Task ${taskId}: LlamaParse returned data, but it was not processed into Document/ImageNode objects. Check JSON structure.`);
          }

        // USER: The following CSV and MD blocks are temporarily commented out.
        // } else if (fileExt === ".csv") {
        //   const csvReader = new PapaCSVReader(); // Ensure PapaCSVReader is correctly imported
        //   loadedDocuments = await csvReader.loadData(absoluteDocumentPath);
        // } else if (fileExt === ".md") {
        //   const mdReader = new MarkdownReader(); // Ensure MarkdownReader is correctly imported
        //   loadedDocuments = await mdReader.loadData(absoluteDocumentPath);
        } else if (fileExt === ".txt") {
          const fileContent = fs.readFileSync(absoluteDocumentPath, "utf-8");
          loadedDocuments = [new Document({ text: fileContent, id_: absoluteDocumentPath })];
        } else {
          throw new Error(`Unsupported file type: ${fileExt}`);
        }

        if (!loadedDocuments || loadedDocuments.length === 0) {
          throw new Error("No documents were extracted from the file.");
        }
        ingestionTasks[taskId].message = `${loadedDocuments.length} document(s) extracted. Connecting to Qdrant...`;
        console.log(`Task ${taskId}: ${loadedDocuments.length} document(s) extracted.`);

        const qdrantClient = new QdrantClient({ url: qdrantUrl, apiKey: qdrantApiKey });

        ingestionTasks[taskId].message = "Verifying Qdrant collection...";
        console.log(`Task ${taskId}: Verifying Qdrant collection '${collectionName}' at ${qdrantUrl}`);
        const collectionsList = await qdrantClient.getCollections();
        const collectionExists = collectionsList.collections.some(c => c.name === collectionName);

        if (!collectionExists) {
          ingestionTasks[taskId].message = `Collection '${collectionName}' not found. Creating...`;
          console.log(`Task ${taskId}: Qdrant collection '${collectionName}' not found. Creating with vector size ${vectorSize}.`);
          await qdrantClient.createCollection(collectionName, { vectors: { size: vectorSize, distance: "Cosine" } });
        } else {
          console.log(`Task ${taskId}: Qdrant collection '${collectionName}' already exists.`);
        }

        const llamaQdrantStore = new LlamaIndexQdrantStore({
          client: qdrantClient,
          collectionName: collectionName,
        });

        ingestionTasks[taskId].message = "Indexing documents into Qdrant...";
        console.log(`Task ${taskId}: Indexing ${loadedDocuments.length} documents...`);
        
        // Using global Settings which includes embedModel and llm
        await VectorStoreIndex.fromDocuments(loadedDocuments, {
          storageContext: {
            vectorStores: {
              [ObjectType.TEXT]: llamaQdrantStore,
              [ObjectType.IMAGE]: llamaQdrantStore, // Added for image embeddings (can use same store or a different one)
            }, // Qdrant store for vectors
            docStore: new SimpleDocumentStore(),     // In-memory document store
            indexStore: new SimpleIndexStore(),    // In-memory index store
          }
          // serviceContext: Settings, // Removed: Global Settings will be used by default
        });

        ingestionTasks[taskId] = { ...ingestionTasks[taskId], status: "COMPLETED", message: "Ingestion completed successfully.", endTime: Date.now() };
        console.log(`Task ${taskId}: Ingestion completed successfully for ${absoluteDocumentPath} into ${collectionName}.`);

      } catch (error: any) {
        console.error(`Task ${taskId}: Error during ingestion for ${absoluteDocumentPath}:`, error);
        const errorMessage = error.message || "An unknown error occurred during ingestion.";
        ingestionTasks[taskId] = { ...ingestionTasks[taskId], status: "FAILED", message: errorMessage, endTime: Date.now() };
      }
    })(); // End of IIFE

    // Synchronous return for the tool call
    return {
      content: [{
        type: "text",
        text: `Ingestion task ${taskId} started. Status: PENDING. Document: ${absoluteDocumentPath}, Collection: ${collectionName}. Use getIngestionTaskStatus with taskId to check progress.`
      }],
      _meta: { taskId } 
    };
  }
);

server.tool(
  "getFrdIngestionStatus",
  "Retrieves the status of an FRD document ingestion task.",
  {
    taskId: z.string().describe("The ID of the ingestion task."),
  },
  async ({ taskId }) => {
    const task = ingestionTasks[taskId];
    if (!task) {
      return {
        content: [{ type: "text", text: `No task found with ID: ${taskId}` }],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(task, null, 2),
        },
      ],
    };
  }
);

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

// Function to search for API endpoints matching the pattern
function findMatchingEndpoints(swagger: any, apiPattern: string): any[] {
  const matches: any[] = [];
  const regex = new RegExp(apiPattern, 'i');
  
  // Handle OpenAPI v3
  if (swagger.paths) {
    for (const [path, pathItem] of Object.entries(swagger.paths)) {
      for (const [method, operation] of Object.entries(pathItem as object)) {
        if (method === 'parameters') continue; // Skip path parameters

        const op = operation as any;
        const fullPath = path;
        const operationId = op.operationId || `${method} ${path}`;
        
        // Check if path or operationId matches the pattern
        if (regex.test(path) || regex.test(operationId)) {
          matches.push({
            path: fullPath,
            method: method.toUpperCase(),
            operationId,
            summary: op.summary || '',
            description: op.description || '',
            parameters: op.parameters || [],
            requestBody: op.requestBody || null,
            responses: op.responses || {},
            servers: op.servers || swagger.servers || []
          });
        }
      }
    }
  }
  
  // Handle Swagger v2
  if (swagger.swagger && swagger.swagger.startsWith('2.') && swagger.paths) {
    for (const [path, pathItem] of Object.entries(swagger.paths)) {
      for (const [method, operation] of Object.entries(pathItem as object)) {
        if (method === 'parameters') continue;

        const op = operation as any;
        const fullPath = path;
        const operationId = op.operationId || `${method} ${path}`;
        
        if (regex.test(path) || regex.test(operationId)) {
          matches.push({
            path: fullPath,
            method: method.toUpperCase(),
            operationId,
            summary: op.summary || '',
            description: op.description || '',
            parameters: op.parameters || [],
            consumes: op.consumes || swagger.consumes || [],
            responses: op.responses || {},
            schemes: op.schemes || swagger.schemes || [],
            host: swagger.host,
            basePath: swagger.basePath || ''
          });
        }
      }
    }
  }
  return matches;
}

// Add the searchApiDocs tool definition
server.tool(
  "searchApiDocs",
  "Search API documentation to understand endpoints, parameters, and responses. Provide a pattern to match against API paths or operationIds to find specific endpoints. Use this tool when you need to understand how to construct proper API requests with the correct parameters for pagination, filtering, or other operations as defined in the Swagger/OpenAPI documentation. The tool uses the SWAGGER_URL environment variable to locate the API documentation.",
  {
    apiPattern: z.string().describe("Regex pattern to match against API paths or operationIds"),
    includeSchemas: z.boolean().optional().default(true).describe("Whether to include full schema definitions in the response"),
  },
  async (params) => {
    try {
      const { apiPattern, includeSchemas } = params;
      const swaggerSource = process.env.SWAGGER_URL;
      
      if (!swaggerSource) {
        throw new Error("SWAGGER_URL environment variable is not set");
      }
      
      console.log(`Searching for API endpoints matching pattern: ${apiPattern}`);
      
      // Load the Swagger documentation
      const swaggerDoc = await loadSwaggerDoc(swaggerSource);
      
      // Find matching endpoints
      const matchingEndpoints = findMatchingEndpoints(swaggerDoc, apiPattern);
      
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
        return {
          content: [
            {
              type: "text",
              text: `No API endpoints found matching pattern: ${apiPattern}`,
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

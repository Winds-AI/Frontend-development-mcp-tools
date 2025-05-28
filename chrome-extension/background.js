// Listen for messages from the devtools panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle auth token retrieval
  if (message.type === "RETRIEVE_AUTH_TOKEN") {
    retrieveAuthToken(message, sender, sendResponse);
    return true; // Required to use sendResponse asynchronously
  }
  
  if (message.type === "GET_CURRENT_URL" && message.tabId) {
    getCurrentTabUrl(message.tabId)
      .then((url) => {
        sendResponse({ success: true, url: url });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required to use sendResponse asynchronously
  }

  // Handle explicit request to update the server with the URL
  if (message.type === "UPDATE_SERVER_URL" && message.tabId && message.url) {
    console.log(
      `Background: Received request to update server with URL for tab ${message.tabId}: ${message.url}`
    );
    updateServerWithUrl(
      message.tabId,
      message.url,
      message.source || "explicit_update"
    )
      .then(() => {
        if (sendResponse) sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Background: Error updating server with URL:", error);
        if (sendResponse)
          sendResponse({ success: false, error: error.message });
      });
    return true; // Required to use sendResponse asynchronously
  }

  if (message.type === "CAPTURE_SCREENSHOT" && message.tabId) {
    // First get the server settings
    chrome.storage.local.get(["browserConnectorSettings"], (result) => {
      const settings = result.browserConnectorSettings || {
        serverHost: "localhost",
        serverPort: 3025,
      };

      // Validate server identity first
      validateServerIdentity(settings.serverHost, settings.serverPort)
        .then((isValid) => {
          if (!isValid) {
            console.error(
              "Cannot capture screenshot: Not connected to a valid browser tools server"
            );
            sendResponse({
              success: false,
              error:
                "Not connected to a valid browser tools server. Please check your connection settings.",
            });
            return;
          }

          // Continue with screenshot capture
          captureAndSendScreenshot(message, settings, sendResponse);
        })
        .catch((error) => {
          console.error("Error validating server:", error);
          sendResponse({
            success: false,
            error: "Failed to validate server identity: " + error.message,
          });
        });
    });
    return true; // Required to use sendResponse asynchronously
  }
});

// Validate server identity
async function validateServerIdentity(host, port) {
  try {
    const response = await fetch(`http://${host}:${port}/.identity`, {
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });

    if (!response.ok) {
      console.error(`Invalid server response: ${response.status}`);
      return false;
    }

    const identity = await response.json();

    // Validate the server signature
    if (identity.signature !== "mcp-browser-connector-24x7") {
      console.error("Invalid server signature - not the browser tools server");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating server identity:", error);
    return false;
  }
}

// Helper function to process the tab and run the audit
function processTabForAudit(tab, tabId) {
  const url = tab.url;

  if (!url) {
    console.error(`No URL available for tab ${tabId}`);
    return;
  }

  // Update our cache and the server with this URL
  tabUrls.set(tabId, url);
  updateServerWithUrl(tabId, url);
}

// Track URLs for each tab
const tabUrls = new Map();

// Function to get the current URL for a tab
async function getCurrentTabUrl(tabId) {
  try {
    console.log("Background: Getting URL for tab", tabId);

    // First check if we have it cached
    if (tabUrls.has(tabId)) {
      const cachedUrl = tabUrls.get(tabId);
      console.log("Background: Found cached URL:", cachedUrl);
      return cachedUrl;
    }

    // Otherwise get it from the tab
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab && tab.url) {
        // Cache the URL
        tabUrls.set(tabId, tab.url);
        console.log("Background: Got URL from tab:", tab.url);
        return tab.url;
      } else {
        console.log("Background: Tab exists but no URL found");
      }
    } catch (tabError) {
      console.error("Background: Error getting tab:", tabError);
    }

    // If we can't get the tab directly, try querying for active tabs
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs && tabs.length > 0 && tabs[0].url) {
        const activeUrl = tabs[0].url;
        console.log("Background: Got URL from active tab:", activeUrl);
        // Cache this URL as well
        tabUrls.set(tabId, activeUrl);
        return activeUrl;
      }
    } catch (queryError) {
      console.error("Background: Error querying tabs:", queryError);
    }

    console.log("Background: Could not find URL for tab", tabId);
    return null;
  } catch (error) {
    console.error("Background: Error getting tab URL:", error);
    return null;
  }
}

// Listen for tab updates to detect page refreshes and URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Track URL changes
  if (changeInfo.url) {
    console.log(`URL changed in tab ${tabId} to ${changeInfo.url}`);
    tabUrls.set(tabId, changeInfo.url);

    // Send URL update to server if possible
    updateServerWithUrl(tabId, changeInfo.url, "tab_url_change");
  }

  // Check if this is a page refresh (status becoming "complete")
  if (changeInfo.status === "complete") {
    // Update URL in our cache
    if (tab.url) {
      tabUrls.set(tabId, tab.url);
      // Send URL update to server if possible
      updateServerWithUrl(tabId, tab.url, "page_complete");
    }

    retestConnectionOnRefresh(tabId);
  }
});

// Listen for tab activation (switching between tabs)
chrome.tabs.onActivated.addListener((activeInfo) => {
  const tabId = activeInfo.tabId;
  console.log(`Tab activated: ${tabId}`);

  // Get the URL of the newly activated tab
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.error("Error getting tab info:", chrome.runtime.lastError);
      return;
    }

    if (tab && tab.url) {
      console.log(`Active tab changed to ${tab.url}`);

      // Update our cache
      tabUrls.set(tabId, tab.url);

      // Send URL update to server
      updateServerWithUrl(tabId, tab.url, "tab_activated");
    }
  });
});

// Function to update the server with the current URL
async function updateServerWithUrl(tabId, url, source = "background_update") {
  if (!url) {
    console.error("Cannot update server with empty URL");
    return;
  }

  console.log(`Updating server with URL for tab ${tabId}: ${url}`);

  // Get the saved settings
  chrome.storage.local.get(["browserConnectorSettings"], async (result) => {
    const settings = result.browserConnectorSettings || {
      serverHost: "localhost",
      serverPort: 3025,
    };

    // Maximum number of retry attempts
    const maxRetries = 3;
    let retryCount = 0;
    let success = false;

    while (retryCount < maxRetries && !success) {
      try {
        // Send the URL to the server
        const serverUrl = `http://${settings.serverHost}:${settings.serverPort}/current-url`;
        console.log(
          `Attempt ${
            retryCount + 1
          }/${maxRetries} to update server with URL: ${url}`
        );

        const response = await fetch(serverUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: url,
            tabId: tabId,
            timestamp: Date.now(),
            source: source,
          }),
          // Add a timeout to prevent hanging requests
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const responseData = await response.json();
          console.log(
            `Successfully updated server with URL: ${url}`,
            responseData
          );
          success = true;
        } else {
          console.error(
            `Server returned error: ${response.status} ${response.statusText}`
          );
          retryCount++;
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Error updating server with URL: ${error.message}`);
        retryCount++;
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    if (!success) {
      console.error(
        `Failed to update server with URL after ${maxRetries} attempts`
      );
    }
  });
}

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabUrls.delete(tabId);
});

// Function to retest connection when a page is refreshed
async function retestConnectionOnRefresh(tabId) {
  console.log(`Page refreshed in tab ${tabId}, retesting connection...`);

  // Get the saved settings
  chrome.storage.local.get(["browserConnectorSettings"], async (result) => {
    const settings = result.browserConnectorSettings || {
      serverHost: "localhost",
      serverPort: 3025,
    };

    // Test the connection with the last known host and port
    const isConnected = await validateServerIdentity(
      settings.serverHost,
      settings.serverPort
    );

    // Notify all devtools instances about the connection status
    chrome.runtime.sendMessage({
      type: "CONNECTION_STATUS_UPDATE",
      isConnected: isConnected,
      tabId: tabId,
    });

    // Always notify for page refresh, whether connected or not
    // This ensures any ongoing discovery is cancelled and restarted
    try {
      console.log(
        `Background: Attempting to send INITIATE_AUTO_DISCOVERY (reason: page_refresh, tabId: ${tabId})`
      );
      chrome.runtime.sendMessage({
        type: "INITIATE_AUTO_DISCOVERY",
        reason: "page_refresh",
        tabId: tabId,
        forceRestart: true, // Add a flag to indicate this should force restart any ongoing processes
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Receiving end does not exist")
      ) {
        console.log(
          `Background: Suppressed 'Receiving end does not exist' for INITIATE_AUTO_DISCOVERY (devtools likely not ready yet)`
        );
      } else {
        // Re-throw other unexpected errors
        console.error(
          "Background: Unexpected error sending INITIATE_AUTO_DISCOVERY:",
          error
        );
      }
    }

    if (!isConnected) {
      console.log(
        "Connection test failed after page refresh, initiating auto-discovery..."
      );
    } else {
      console.log("Connection test successful after page refresh");
    }
  });
}

// Function to retrieve auth token from a tab
async function retrieveAuthToken(request, sender, sendResponse) {
  const { origin, storageType, tokenKey } = request;
  
  try {
    let authToken = null;
    
    // Find a tab that matches the requested origin
    const tabs = await chrome.tabs.query({ url: `${origin}/*` });
    
    if (tabs.length === 0) {
      sendResponse({ error: `No tabs found for origin: ${origin}` });
      return;
    }
    
    const tabId = tabs[0].id;
    
    if (storageType === 'cookie') {
      try {
        // Check if chrome.cookies is available
        if (!chrome.cookies) {
          throw new Error("Chrome cookies API not available. Please check extension permissions.");
        }
        
        // Get all cookies for the origin
        const cookies = await chrome.cookies.getAll({ url: origin });
        console.log(`Found ${cookies.length} cookies for origin ${origin}:`, cookies.map(c => c.name));
        
        const authCookie = cookies.find(cookie => cookie.name === tokenKey);
        
        if (authCookie) {
          authToken = authCookie.value;
          console.log(`Found cookie '${tokenKey}' with value:`, authToken);
        } else {
          console.log(`Cookie '${tokenKey}' not found. Available cookies:`, cookies.map(c => c.name));
        }
      } catch (cookieError) {
        console.error("Error accessing cookies:", cookieError);
        sendResponse({ error: `Error accessing cookies: ${cookieError.message}` });
        return;
      }
    } else if (storageType === 'localStorage') {
      try {
        // Execute script in the tab to access localStorage
        const result = await chrome.scripting.executeScript({
          target: { tabId },
          func: (key) => window.localStorage.getItem(key),
          args: [tokenKey]
        });
        
        if (result && result[0] && result[0].result) {
          authToken = result[0].result;
        }
      } catch (scriptError) {
        console.error("Error accessing localStorage:", scriptError);
        sendResponse({ error: `Error accessing localStorage: ${scriptError.message}` });
        return;
      }
    } else if (storageType === 'sessionStorage') {
      try {
        // Execute script in the tab to access sessionStorage
        const result = await chrome.scripting.executeScript({
          target: { tabId },
          func: (key) => window.sessionStorage.getItem(key),
          args: [tokenKey]
        });
        
        if (result && result[0] && result[0].result) {
          authToken = result[0].result;
        }
      } catch (scriptError) {
        console.error("Error accessing sessionStorage:", scriptError);
        sendResponse({ error: `Error accessing sessionStorage: ${scriptError.message}` });
        return;
      }
    }
    
    if (authToken) {
      sendResponse({ token: authToken });
    } else {
      sendResponse({ error: `Token with key '${tokenKey}' not found in ${storageType}` });
    }
  } catch (error) {
    console.error("Error retrieving auth token:", error);
    sendResponse({ error: `Error retrieving auth token: ${error.message}` });
  }
}

// Function to capture and send screenshot
function captureAndSendScreenshot(message, settings, sendResponse) {
  // Get the inspected window's tab
  chrome.tabs.get(message.tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.error("Error getting tab:", chrome.runtime.lastError);
      sendResponse({
        success: false,
        error: chrome.runtime.lastError.message,
      });
      return;
    }

    // Get all windows to find the one containing our tab
    chrome.windows.getAll({ populate: true }, (windows) => {
      const targetWindow = windows.find((w) =>
        w.tabs.some((t) => t.id === message.tabId)
      );

      if (!targetWindow) {
        console.error("Could not find window containing the inspected tab");
        sendResponse({
          success: false,
          error: "Could not find window containing the inspected tab",
        });
        return;
      }

      // Capture screenshot of the window containing our tab
      chrome.tabs.captureVisibleTab(
        targetWindow.id,
        { format: "png" },
        (dataUrl) => {
          // Ignore DevTools panel capture error if it occurs
          if (
            chrome.runtime.lastError &&
            !chrome.runtime.lastError.message.includes("devtools://")
          ) {
            console.error(
              "Error capturing screenshot:",
              chrome.runtime.lastError
            );
            sendResponse({
              success: false,
              error: chrome.runtime.lastError.message,
            });
            return;
          }

          // Send screenshot data to browser connector using configured settings
          const serverUrl = `http://${settings.serverHost}:${settings.serverPort}/screenshot`;
          console.log(`Sending screenshot to ${serverUrl}`);

          fetch(serverUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              data: dataUrl,
              path: message.screenshotPath,
              url: tab.url // Added tab.url for filename generation
            }),
          })
            .then((response) => response.json())
            .then((result) => {
              if (result.error) {
                console.error("Error from server:", result.error);
                sendResponse({ success: false, error: result.error });
              } else {
                console.log("Screenshot saved successfully:", result.path);
                // Send success response even if DevTools capture failed
                sendResponse({
                  success: true,
                  path: result.path,
                  title: tab.title || "Current Tab",
                });
              }
            })
            .catch((error) => {
              console.error("Error sending screenshot data:", error);
              sendResponse({
                success: false,
                error: error.message || "Failed to save screenshot",
              });
            });
        }
      );
    });
  });
}

// Add WebSocket connection for browser connector communication
let wsConnection = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let reconnectTimeout = null;

// Function to connect to browser connector WebSocket
function connectToBrowserConnector() {
  // Clear any existing reconnect timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  try {
    // Try different ports in case the server switched ports
    const ports = [3026, 3025, 3027]; // Put 3026 first since that's what the server is using
    let currentPortIndex = 0;

    function tryConnection() {
      if (currentPortIndex >= ports.length) {
        console.log('Failed to connect to any available port, retrying in 5 seconds...');
        scheduleReconnect();
        return;
      }

      const port = ports[currentPortIndex];
      console.log(`Attempting to connect to browser connector on port ${port}...`);
      
      // First validate the server is actually running on this port
      fetch(`http://localhost:${port}/.identity`)
        .then(response => response.json())
        .then(identity => {
          if (identity.signature === "mcp-browser-connector-24x7") {
            console.log(`Verified server identity on port ${port}, connecting WebSocket...`);
            
            wsConnection = new WebSocket(`ws://localhost:${port}/extension-ws`);
            
            wsConnection.onopen = function() {
              console.log(`Successfully connected to browser connector WebSocket on port ${port}`);
              reconnectAttempts = 0; // Reset reconnect attempts on successful connection
              
              // Save the working port to extension storage
              chrome.storage.local.set({
                browserConnectorSettings: {
                  serverHost: "localhost",
                  serverPort: port
                }
              }, () => {
                console.log(`Saved working server port ${port} to extension storage`);
              });
            };
            
            wsConnection.onmessage = function(event) {
              try {
                const data = JSON.parse(event.data);
                console.log('Received WebSocket message from browser connector:', data);
                
                // Handle auth token retrieval request from browser connector
                if (data.type === "RETRIEVE_AUTH_TOKEN") {
                  console.log('Processing auth token request from browser connector');
                  
                  // Create a mock request object for the existing retrieveAuthToken function
                  const mockRequest = {
                    type: "RETRIEVE_AUTH_TOKEN",
                    origin: data.origin,
                    storageType: data.storageType,
                    tokenKey: data.tokenKey
                  };
                  
                  // Call the existing function and send response back via WebSocket
                  retrieveAuthToken(mockRequest, null, function(response) {
                    console.log('Sending auth token response back to browser connector:', response);
                    
                    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
                      wsConnection.send(JSON.stringify({
                        type: "RETRIEVE_AUTH_TOKEN_RESPONSE",
                        token: response.token,
                        error: response.error
                      }));
                    } else {
                      console.error('WebSocket connection not available when trying to send auth token response');
                    }
                  });
                }
              } catch (error) {
                console.error('Error processing WebSocket message:', error);
              }
            };
            
            wsConnection.onclose = function(event) {
              console.log(`WebSocket connection closed (code: ${event.code}, reason: ${event.reason})`);
              wsConnection = null;
              scheduleReconnect();
            };
            
            wsConnection.onerror = function(error) {
              console.error(`WebSocket error on port ${port}:`, error);
              wsConnection = null;
              // Try next port
              currentPortIndex++;
              setTimeout(tryConnection, 1000);
            };
          } else {
            console.log(`Invalid server signature on port ${port}, trying next port...`);
            currentPortIndex++;
            setTimeout(tryConnection, 1000);
          }
        })
        .catch(error => {
          console.log(`Server not found on port ${port}:`, error.message);
          currentPortIndex++;
          setTimeout(tryConnection, 1000);
        });
    }

    tryConnection();
    
  } catch (error) {
    console.error('Error setting up WebSocket connection:', error);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.log(`Max reconnection attempts (${maxReconnectAttempts}) reached. Stopping reconnection attempts.`);
    return;
  }
  
  reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30 seconds
  
  console.log(`Scheduling reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms`);
  reconnectTimeout = setTimeout(connectToBrowserConnector, delay);
}

// Initialize WebSocket connection when the extension loads
connectToBrowserConnector();

// Add network request interception for background monitoring
let pendingRequests = new Map(); // Track pending requests to match with responses

// Listen for request start
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Only track XHR and fetch requests
    if (details.type === 'xmlhttprequest' || details.type === 'fetch') {
      console.log('Background: Network request started:', details.url);
      
      // Store request details
      pendingRequests.set(details.requestId, {
        url: details.url,
        method: details.method,
        timestamp: Date.now(),
        tabId: details.tabId,
        requestBody: details.requestBody ? JSON.stringify(details.requestBody) : '',
        type: details.type
      });
    }
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

// Listen for request headers
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (pendingRequests.has(details.requestId)) {
      const request = pendingRequests.get(details.requestId);
      request.requestHeaders = details.requestHeaders || [];
    }
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);

// Listen for response headers
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (pendingRequests.has(details.requestId)) {
      const request = pendingRequests.get(details.requestId);
      request.status = details.statusCode;
      request.responseHeaders = details.responseHeaders || [];
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Listen for request completion
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (pendingRequests.has(details.requestId)) {
      const request = pendingRequests.get(details.requestId);
      request.status = details.statusCode;
      
      console.log('Background: Network request completed:', request.url, 'Status:', request.status);
      
      // Send to browser connector
      sendNetworkRequestToBrowserConnector(request);
      
      // Clean up
      pendingRequests.delete(details.requestId);
    }
  },
  { urls: ["<all_urls>"] }
);

// Listen for request errors
chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    if (pendingRequests.has(details.requestId)) {
      const request = pendingRequests.get(details.requestId);
      request.status = 0; // Indicate error
      request.error = details.error;
      
      console.log('Background: Network request error:', request.url, 'Error:', request.error);
      
      // Send to browser connector
      sendNetworkRequestToBrowserConnector(request);
      
      // Clean up
      pendingRequests.delete(details.requestId);
    }
  },
  { urls: ["<all_urls>"] }
);

// Function to send network request data to browser connector
async function sendNetworkRequestToBrowserConnector(requestData) {
  try {
    // Get server settings
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(["browserConnectorSettings"], resolve);
    });
    
    const settings = result.browserConnectorSettings || {
      serverHost: "localhost",
      serverPort: 3025,
    };

    // Prepare network request data for sending
    const networkLogData = {
      type: "network-request",
      url: requestData.url,
      method: requestData.method,
      status: requestData.status || 0,
      timestamp: requestData.timestamp,
      requestHeaders: requestData.requestHeaders || [],
      responseHeaders: requestData.responseHeaders || [],
      requestBody: requestData.requestBody || '',
      responseBody: '', // We can't easily get response body in background script
      tabId: requestData.tabId,
      error: requestData.error
    };

    console.log('Background: Sending network request to browser connector:', {
      url: networkLogData.url,
      method: networkLogData.method,
      status: networkLogData.status
    });

    // Send to server
    const serverUrl = `http://${settings.serverHost}:${settings.serverPort}/extension-log`;
    
    const response = await fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: networkLogData,
        settings: {
          logLimit: 50,
          queryLimit: 30000,
          showRequestHeaders: true,
          showResponseHeaders: true,
        },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      console.log('Background: Successfully sent network request to browser connector');
    } else {
      console.error('Background: Error sending network request to browser connector:', response.status);
    }
  } catch (error) {
    console.error('Background: Error sending network request to browser connector:', error);
  }
}
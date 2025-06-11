# How to Use Browser Tools MCP

To use these tools at their 100% potential you need to understand how all of these fit in the flow and how to explain that to LLM until I perfect the description and names of all tools and make it self-explanatory for most LLMs.

## Updated Workflow with Unified API Testing

### **Step 1: API Discovery & Documentation**
Use `searchApiDocs` tool to get the expected payload and request types, then start writing code based on the memory you have setup. It can make new pages/modules/sub-modules etc if that is how you have structured your project.

### **Step 2: Real API Testing (NEW Improved Workflow)**
Instead of manual token handling, use the new `executeAuthenticatedApiCall` tool:

**OLD PROBLEMATIC APPROACH:**
1. ~~Use `getAccessToken` (agent often hallucinates storage location)~~
2. ~~Agent manually constructs curl commands (inconsistent execution)~~
3. ~~Manual error-prone token handling~~

**NEW UNIFIED APPROACH:**
1. **Environment Setup**: Configure these once in your MCP settings:
   ```json
   "AUTH_ORIGIN": "http://localhost:5173",
   "AUTH_STORAGE_TYPE": "localStorage", 
   "AUTH_TOKEN_KEY": "authToken",
   "API_BASE_URL": "https://api.example.com"
   ```

2. **Automatic API Testing**: Use `executeAuthenticatedApiCall` with just the endpoint:
   ```
   Tool: executeAuthenticatedApiCall
   - endpoint: "/api/users"
   - method: "GET"
   ```
   
   The tool automatically:
   - Retrieves auth token from browser session
   - Makes authenticated API call
   - Returns structured response data
   - Provides detailed response analysis

### **Step 3: Development & Integration**
Based on real API responses from Step 2, the agent can:
- Define accurate TypeScript interfaces
- Use helper functions and custom hooks based on your setup
- Create components with proper data handling
- I have seen 80-90% accuracy in JS projects and 60-70% in TypeScript projects

### **Step 4: UI Development & Debugging**
- Use context7 for component library integration
- Use `takeScreenshot` and `analyzeImageFile` for UI analysis with Google's 2.5 pro model
- Use `getSelectedElement` for CSS debugging
- Use `analyzeApiCalls` for debugging network issues and response changes

## Key Benefits of New Unified Approach
✅ **No more token hallucination** - Environment-based configuration
✅ **Consistent API execution** - Automated backend handling  
✅ **Better accuracy** - Real response structures for TypeScript interfaces
✅ **Streamlined workflow** - One tool instead of multiple manual steps
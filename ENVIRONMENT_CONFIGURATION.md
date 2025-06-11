# Environment Configuration for Unified Screenshot System

## Overview

This document provides comprehensive configuration instructions for the Browser Tools MCP server, with special focus on the newly unified screenshot system that automatically organizes screenshots by project and URL structure.

## Core Environment Variables

### Screenshot Management (New Unified System)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `SCREENSHOT_STORAGE_PATH` | Base directory for all screenshot storage | `~/Downloads/Windsurf_Screenshots` | `/home/user/custom-screenshots` |
| `PROJECT_NAME` | Override automatic project detection | Auto-detected from git/directory | `bandar-admin-panel` |

### Project Detection Hierarchy

The system uses this priority order for project detection:
1. **Tool Parameter**: `projectName` in MCP tool call (highest priority)
2. **Environment Variable**: `PROJECT_NAME` 
3. **Git Repository**: Extracted from `git remote origin url`
4. **Current Directory**: Working directory name (excluding generic names)
5. **Fallback**: `default-project` (lowest priority)

### API Testing & Authentication

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `AUTH_ORIGIN` | Origin where your app runs | - | `http://localhost:5173` |
| `AUTH_STORAGE_TYPE` | Token storage location | - | `localStorage`, `sessionStorage`, `cookie` |
| `AUTH_TOKEN_KEY` | Token key name | - | `authToken`, `accessToken` |
| `API_BASE_URL` | Your API base URL | - | `https://api.example.com` |

### Document & API Discovery

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `SWAGGER_URL` | Swagger/OpenAPI JSON URL | - | `https://api.example.com/swagger.json` |
| `PROJECT_ROOT` | Project root directory for file operations | Current working directory | `/path/to/your/project` |

### Vector Database (FRD Document Ingestion)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `GOOGLE_API_KEY` | Google API key for embeddings | - | `your_google_api_key_here` |
| `QDRANT_API_KEY` | Qdrant vector database API key | - | `your_qdrant_api_key_here` |
| `QDRANT_URL` | Qdrant server URL | `http://localhost:6333` | `https://your-qdrant-instance.com` |

## Configuration Examples

### 1. Basic MCP Configuration

**File**: `.mcp/settings.json` or environment configuration

```json
{
  "mcpServers": {
    "browser-tools": {
      "command": "node",
      "args": ["path/to/your/mcp-server.js"],
      "env": {
        "PROJECT_NAME": "bandar-admin-panel",
        "SCREENSHOT_STORAGE_PATH": "/home/user/Screenshots/Projects"
      }
    }
  }
}
```

**Result**: Screenshots saved to:
```
/home/user/Screenshots/Projects/bandar-admin-panel/
├── dashboard/
├── login/
└── users/
```

### 2. Multi-Project Development

**Terminal 1** (Admin Panel):
```bash
export PROJECT_NAME="bandar-admin-panel"
export SCREENSHOT_STORAGE_PATH="/home/user/Projects/Screenshots"
# Start MCP server
```

**Terminal 2** (Customer Website):
```bash
export PROJECT_NAME="bandar-customer-website"
export SCREENSHOT_STORAGE_PATH="/home/user/Projects/Screenshots"
# Start MCP server
```

**Result**: Automatic project separation:
```
/home/user/Projects/Screenshots/
├── bandar-admin-panel/
│   ├── dashboard/
│   └── login/
└── bandar-customer-website/
    ├── home/
    └── products/
```

### 3. Development with Authentication

```json
{
  "mcpServers": {
    "browser-tools": {
      "command": "node",
      "args": ["path/to/your/mcp-server.js"],
      "env": {
        "PROJECT_NAME": "my-app",
        "SCREENSHOT_STORAGE_PATH": "/custom/screenshots",
        "AUTH_ORIGIN": "http://localhost:5173",
        "AUTH_STORAGE_TYPE": "localStorage",
        "AUTH_TOKEN_KEY": "authToken",
        "API_BASE_URL": "https://api.myapp.com",
        "SWAGGER_URL": "https://api.myapp.com/swagger.json"
      }
    }
  }
}
```

### 4. Production Environment

```json
{
  "mcpServers": {
    "browser-tools": {
      "command": "node",
      "args": ["path/to/your/mcp-server.js"],
      "env": {
        "PROJECT_NAME": "production-app",
        "SCREENSHOT_STORAGE_PATH": "/shared/screenshots",
        "AUTH_ORIGIN": "https://app.example.com",
        "AUTH_STORAGE_TYPE": "cookie",
        "AUTH_TOKEN_KEY": "session_token",
        "API_BASE_URL": "https://api.example.com",
        "GOOGLE_API_KEY": "your_production_google_key",
        "QDRANT_URL": "https://qdrant.example.com",
        "QDRANT_API_KEY": "your_production_qdrant_key"
      }
    }
  }
}
```

## Screenshot Organization Examples

### URL-Based Categorization

The unified system automatically organizes screenshots based on URLs:

| URL | Project | Category | Full Path |
|-----|---------|----------|-----------|
| `http://localhost:3000/dashboard` | `my-project` | `dashboard` | `~/Downloads/Windsurf_Screenshots/my-project/dashboard/` |
| `http://localhost:3000/users/profile` | `my-project` | `users` | `~/Downloads/Windsurf_Screenshots/my-project/users/` |
| `https://staging.example.com/products` | `my-project` | `staging/products` | `~/Downloads/Windsurf_Screenshots/my-project/staging/products/` |
| `https://app.example.com/settings` | `my-project` | `production/settings` | `~/Downloads/Windsurf_Screenshots/my-project/production/settings/` |

### Filename Generation

Screenshots are automatically named with timestamps and context:

```
2025-06-11_14-30-15_dashboard-overview.png
2025-06-11_14-32-20_user-management.png
2025-06-11_14-35-45_before-login.png
```

## Advanced Configuration

### 1. Custom Base Directory

```bash
# Use custom base directory
export SCREENSHOT_STORAGE_PATH="/mnt/shared/team-screenshots"
```

**Result**:
```
/mnt/shared/team-screenshots/
├── project-a/
├── project-b/
└── project-c/
```

### 2. Git-Based Project Detection

If no `PROJECT_NAME` is set, the system automatically detects from git:

```bash
# In a git repository
git remote -v
# origin  https://github.com/company/bandar-admin-panel.git (fetch)

# Project name auto-detected as: "bandar-admin-panel"
```

### 3. Directory Fallback Chain

```bash
# Current directory: /home/user/projects/my-awesome-app
# No PROJECT_NAME set
# No git repository

# Project name detected as: "my-awesome-app"
```

## Migration from Old System

The unified system is **fully backward compatible**:

### Existing Chrome Extension
- ✅ Works unchanged
- ✅ Respects extension path settings
- ✅ Maintains auto-paste functionality

### Existing Environment Variables
- ✅ `SCREENSHOT_STORAGE_PATH` still works
- ✅ Enhanced with project organization
- ✅ No breaking changes

### Enhanced Features
- 🆕 Automatic project detection
- 🆕 URL-based categorization
- 🆕 Intelligent filename generation
- 🆕 Multi-project support

## Troubleshooting

### Common Issues

1. **Screenshots not saving in expected location**
   ```bash
   # Check environment variable
   echo $SCREENSHOT_STORAGE_PATH
   
   # Verify permissions
   ls -la ~/Downloads/
   ```

2. **Project not detected correctly**
   ```bash
   # Set explicit project name
   export PROJECT_NAME="my-project"
   
   # Or use tool parameter
   await takeScreenshot({ projectName: "my-project" })
   ```

3. **Git detection not working**
   ```bash
   # Check git remote
   git remote -v
   
   # Set explicit project if needed
   export PROJECT_NAME="explicit-project-name"
   ```

### Validation

Test your configuration:

```bash
# Run the test script
cd browser-tools-server
node test-screenshot-system.js

# Check output structure
ls -la ~/Downloads/Windsurf_Screenshots/
```

## Best Practices

### 1. Team Consistency
```bash
# Share project names across team
export PROJECT_NAME="shared-project-name"
```

### 2. Environment Separation
```bash
# Development
export PROJECT_NAME="myapp-dev"

# Staging
export PROJECT_NAME="myapp-staging"

# Production
export PROJECT_NAME="myapp-prod"
```

### 3. Organized Storage
```bash
# Use meaningful base paths
export SCREENSHOT_STORAGE_PATH="/team/screenshots"
```

### 4. Tool Usage
```javascript
// Use descriptive filenames
await takeScreenshot({
  filename: "before-form-submission",
  projectName: "user-onboarding"
});

// Leverage immediate image data
const result = await takeScreenshot({
  filename: "current-state",
  returnImageData: true
});
// Analyze result.imageData immediately
```

## Summary

The unified screenshot system provides:

- 🎯 **Automatic Organization**: No manual folder management
- 🔄 **Multi-Project Support**: Perfect for agencies/consultants
- 🌐 **URL Intelligence**: Smart categorization
- 🔧 **Flexible Configuration**: Environment variables + tool parameters
- 📈 **Backward Compatibility**: No migration required
- 🚀 **Enhanced Workflow**: Better integration with agents

Set your `PROJECT_NAME` and start taking organized screenshots immediately!

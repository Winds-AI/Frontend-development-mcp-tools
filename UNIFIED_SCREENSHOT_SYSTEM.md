# Unified Screenshot System Documentation

## Overview

The Browser Tools MCP server now features a **Unified Screenshot System** that automatically organizes screenshots by project and URL structure. This system eliminates the duplicate screenshot logic and provides intelligent organization for multi-project workflows.

## Key Features

### 🗂️ **Automatic Project Organization**
Screenshots are automatically organized in a structured directory hierarchy:

```
~/Downloads/Windsurf_Screenshots/
├── bandar-admin-panel/
│   ├── dashboard/
│   │   ├── 2025-06-11_14-30-15_dashboard-overview.png
│   │   └── 2025-06-11_14-32-20_user-management.png
│   └── login/
│       └── 2025-06-11_14-25-10_login-form.png
├── bandar-customer-website/
│   ├── home/
│   │   └── 2025-06-11_15-10-30_landing-page.png
│   └── products/
│       └── 2025-06-11_15-15-45_product-catalog.png
└── other-project/
    └── ...
```

### 🎯 **Smart Project Detection**
The system automatically detects project names using multiple methods:
1. **Manual Override**: `projectName` parameter in tool call
2. **Environment Variable**: `PROJECT_NAME` 
3. **Git Repository**: Extracts name from `git remote origin url`
4. **Current Directory**: Uses current working directory name
5. **Fallback**: Uses "default-project"

### 📁 **URL-Based Categorization**
Screenshots are categorized into subfolders based on the current URL:
- **localhost**: `home`, `dashboard`, `products`, etc.
- **staging**: `staging/feature-name`
- **production**: `production/feature-name`
- **path-based**: Extracted from URL path segments

### ⚡ **Unified Implementation**
- Eliminates duplicate screenshot saving logic
- Single service handles all screenshot operations
- Consistent behavior across MCP tool and extension panel
- Enhanced error handling and logging

## Configuration

### Environment Variables

```json
{
  "env": {
    "SCREENSHOT_STORAGE_PATH": "/custom/base/directory",
    "PROJECT_NAME": "my-awesome-project"
  }
}
```

### Tool Parameters

```javascript
await takeScreenshot({
  filename: "custom-filename",     // Optional: Custom filename
  returnImageData: true,           // Optional: Return base64 data (default: true)
  projectName: "override-project"  // Optional: Override project detection
});
```

## Directory Structure Logic

### Base Directory Resolution
1. **Extension Panel Path**: Screenshot path from Chrome extension settings
2. **Environment Variable**: `SCREENSHOT_STORAGE_PATH`
3. **Default**: `~/Downloads/Windsurf_Screenshots`

### Project Directory Resolution
1. **Tool Parameter**: `projectName` parameter
2. **Environment Variable**: `PROJECT_NAME`
3. **Git Repository**: Extracted from remote origin
4. **Current Directory**: Working directory name (excluding generic names)
5. **Fallback**: `default-project`

### URL Category Resolution
1. **localhost URLs**: Extract first path segment (e.g., `/dashboard` → `dashboard`)
2. **Staging URLs**: Prefix with `staging/` + path segment
3. **Production URLs**: Prefix with `production/` + path segment
4. **No URL**: Use `general` category

### Filename Generation
1. **Custom Filename**: `YYYY-MM-DDTHH-mm-ss-sss_custom-filename.png`
2. **URL-Based**: `YYYY-MM-DDTHH-mm-ss-sss_page-name.png`
3. **Timestamp Only**: `YYYY-MM-DDTHH-mm-ss-sss_screenshot.png`

## Examples

### Basic Usage
```javascript
// Simple screenshot with automatic organization
await takeScreenshot();
// Result: ~/Downloads/Windsurf_Screenshots/my-project/dashboard/2025-06-11_14-30-15_screenshot.png
```

### Custom Project and Filename
```javascript
// Override project name and provide custom filename
await takeScreenshot({
  projectName: "special-project",
  filename: "before-login"
});
// Result: ~/Downloads/Windsurf_Screenshots/special-project/login/2025-06-11_14-30-15_before-login.png
```

### Multi-Project Workflow
```bash
# Set project via environment
export PROJECT_NAME="bandar-admin-panel"

# In another terminal for different project
export PROJECT_NAME="bandar-customer-website"
```

### URL-Based Organization Examples
- `http://localhost:3000/dashboard` → `my-project/dashboard/`
- `http://localhost:3000/users/profile` → `my-project/users/`
- `https://staging.example.com/products` → `my-project/staging/products/`
- `https://app.example.com/settings` → `my-project/production/settings/`

## Response Format

The enhanced response includes organization details:

```json
{
  "content": [
    {
      "type": "text",
      "text": "✅ Screenshot captured successfully!\n📁 Project: bandar-admin-panel\n📂 Category: dashboard\n💾 Saved to: /home/user/Downloads/Windsurf_Screenshots/bandar-admin-panel/dashboard/2025-06-11_14-30-15_user-management.png"
    },
    {
      "type": "image",
      "data": "base64-encoded-image-data",
      "mimeType": "image/png"
    }
  ]
}
```

## Migration from Old System

The unified system is **backward compatible**:
- Existing Chrome extension functionality unchanged
- Environment variables still work (`SCREENSHOT_STORAGE_PATH`)
- Response format enhanced but maintains core structure
- All existing workflows continue to function

## Benefits

### For Multi-Project Workflows
- **Automatic Separation**: Projects are automatically separated
- **Consistent Organization**: Same structure across all projects
- **Easy Navigation**: Logical folder hierarchy

### For Team Collaboration
- **Standardized Structure**: Everyone uses the same organization
- **Searchable History**: Easy to find specific screenshots
- **Context Preservation**: URL and timestamp information retained

### For Development Workflow
- **Feature-Based Grouping**: Screenshots grouped by feature/page
- **Environment Separation**: Staging vs production screenshots
- **Timeline Tracking**: Chronological naming for debugging

## Technical Implementation

### Core Components
- **ScreenshotService**: Singleton service handling all screenshot operations
- **Path Resolution**: Intelligent directory and filename generation
- **URL Categorization**: Smart URL-to-folder mapping
- **Project Detection**: Multiple fallback methods for project identification

### File Safety
- **Filesystem Sanitization**: All names are sanitized for cross-platform compatibility
- **Length Limits**: Prevents excessively long filenames
- **Character Replacement**: Invalid characters replaced with safe alternatives
- **Recursive Directory Creation**: Automatically creates necessary directories

This unified system provides a robust, scalable solution for screenshot organization that grows with your project needs while maintaining simplicity and automation.

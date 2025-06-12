# Browser Tools Server

**🚀 Version 1.2.0 - Enhanced Connection Stability for Autonomous Operation**

A powerful browser tools server optimized for autonomous AI-powered frontend development workflows. This server provides enhanced WebSocket stability, intelligent connection monitoring, and seamless integration with the Browser Tools Chrome Extension for comprehensive browser debugging capabilities.

## ✨ Enhanced Features for Autonomous AI Development

### Core Browser Tools
- **Console log capture** with real-time streaming and configurable limits
- **Network request monitoring** with detailed filtering and timestamp support
- **Screenshot capture** with organized project-based storage system
- **Element selection tracking** via Chrome DevTools integration
- **WebSocket real-time communication** with enhanced stability features

### 🚀 Autonomous Operation Enhancements
- **Enhanced heartbeat system** with 25-second intervals and 60-second timeouts
- **Intelligent connection monitoring** with unique connection ID tracking
- **Fast recovery mechanisms** supporting 3-15 second reconnection times
- **Individual callback management** preventing conflicts during concurrent operations
- **Connection health API** providing real-time status monitoring
- **Auto-port detection** with fallback to available ports (3025-3035)
- **Exponential backoff retry logic** with up to 10 connection attempts

### Advanced Capabilities
- **Lighthouse-powered audits** for accessibility, performance, SEO, and best practices
- **Authenticated API proxy** for seamless token-based API testing
- **Organized screenshot system** with project/URL-based directory structure
- **Enhanced error handling** with detailed connection state reporting

## 📦 Installation & Quick Start

### Local Development Setup
```bash
# Install dependencies
npm install

# Build the server
npm run build

# Start the server
node dist/browser-connector.js
```

### Production Installation
```bash
# Install globally for system-wide access
npm install -g @agentdeskai/browser-tools-server

# Start from anywhere
browser-tools-server
```

## 🚀 Server Startup & Auto-Configuration

The server automatically:
- **Detects available ports** starting from 3025
- **Provides connection endpoints** for Chrome extension discovery
- **Enables health monitoring** at `/connection-health`
- **Configures WebSocket stability** with enhanced heartbeat system

```bash
=== Browser Tools Server Started ===
Aggregator listening on http://0.0.0.0:3026
NOTE: Using fallback port 3026 instead of requested port 3025

Available on the following network addresses:
  - http://192.168.1.100:3026

For local access use: http://localhost:3026
```

## 🔗 Enhanced API Endpoints

### Core Data Endpoints
- `GET /console-logs` - Recent console logs with configurable limits
- `GET /console-errors` - Console errors with timestamp filtering  
- `GET /network-errors` - Network error logs with detailed analysis
- `GET /network-success` - Successful network requests with response data
- `GET /all-xhr` - All network requests with filtering and sorting
- `GET /selected-element` - Currently selected DOM element details

### 🚀 Enhanced Connection & Health Endpoints
- `GET /.identity` - Server identity validation for Chrome extension
- `GET /.port` - Current server port information
- `GET /connection-health` - **NEW** Real-time connection health monitoring
- `POST /wipelogs` - Clear all captured logs and reset state

### Screenshot & Media Endpoints  
- `POST /screenshot` - Enhanced screenshot capture with organized storage
- `POST /capture-screenshot` - Programmatic screenshot with custom options

### Authentication & API Testing
- `POST /auth-token-proxy` - Retrieve authentication tokens from browser session
- `POST /authenticated-api-call` - **NEW** Unified authenticated API testing

### Audit & Performance Endpoints
- `POST /accessibility-audit` - Lighthouse accessibility analysis
- `POST /performance-audit` - Performance metrics and optimization insights
- `POST /seo-audit` - SEO analysis and recommendations  
- `POST /best-practices-audit` - Code quality and best practices review

## 📊 Connection Health Monitoring

### Real-Time Health Status
Access detailed connection information at `/connection-health`:

```json
{
  "connected": true,
  "healthy": true,
  "connectionId": "conn_1735814017588_abc123def",
  "lastHeartbeat": 1735814017588,
  "timeSinceLastHeartbeat": 15000,
  "heartbeatTimeout": 60000,
  "heartbeatInterval": 25000,
  "pendingScreenshots": 0,
  "uptime": 1800.45,
  "timestamp": "2025-06-12T10:33:37.588Z"
}
```

### Connection Status Indicators
- `connected`: WebSocket connection established
- `healthy`: Connection is responsive (heartbeat < timeout)
- `connectionId`: Unique identifier for debugging sessions
- `pendingScreenshots`: Number of screenshot requests in queue
- `uptime`: Server uptime in seconds
- `POST /wipelogs` - Clear all stored logs
- `POST /accessibility-audit` - Run a WCAG-compliant accessibility audit on the current page
- `POST /performance-audit` - Run a performance audit on the current page
- `POST /seo-audit` - Run a SEO audit on the current page

# Audit Functionality

The server provides Lighthouse-powered audit capabilities through four AI-optimized endpoints. These audits have been specifically tailored for AI consumption, with structured data, clear categorization, and smart prioritization.

## Smart Limit Implementation

All audit tools implement a "smart limit" approach to provide the most relevant information based on impact severity:

- **Critical issues**: No limit (all issues are shown)
- **Serious issues**: Up to 15 items per issue
- **Moderate issues**: Up to 10 items per issue
- **Minor issues**: Up to 3 items per issue

This ensures that the most important issues are always included in the response, while less important ones are limited to maintain a manageable response size for AI processing.

## Common Audit Response Structure

All audit responses follow a similar structure:

```json
{
  "metadata": {
    "url": "https://example.com",
    "timestamp": "2025-03-06T16:28:30.930Z",
    "device": "desktop",
    "lighthouseVersion": "11.7.1"
  },
  "report": {
    "score": 88,
    "audit_counts": {
      "failed": 2,
      "passed": 17,
      "manual": 10,
      "informative": 0,
      "not_applicable": 42
    }
    // Audit-specific content
    // ...
  }
}
```

## Accessibility Audit (`/accessibility-audit`)

The accessibility audit evaluates web pages against WCAG standards, identifying issues that affect users with disabilities.

### Response Format

```json
{
  "metadata": {
    "url": "https://example.com",
    "timestamp": "2025-03-06T16:28:30.930Z",
    "device": "desktop",
    "lighthouseVersion": "11.7.1"
  },
  "report": {
    "score": 88,
    "audit_counts": {
      "failed": 2,
      "passed": 17,
      "manual": 10,
      "informative": 0,
      "not_applicable": 42
    },
    "issues": [
      {
        "id": "meta-viewport",
        "title": "`[user-scalable=\"no\"]` is used in the `<meta name=\"viewport\">` element or the `[maximum-scale]` attribute is less than 5.",
        "impact": "critical",
        "category": "a11y-best-practices",
        "elements": [
          {
            "selector": "head > meta",
            "snippet": "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=0\">",
            "label": "head > meta",
            "issue_description": "Fix any of the following: user-scalable on <meta> tag disables zooming on mobile devices"
          }
        ],
        "score": 0
      }
    ],
    "categories": {
      "a11y-navigation": { "score": 0, "issues_count": 0 },
      "a11y-aria": { "score": 0, "issues_count": 1 },
      "a11y-best-practices": { "score": 0, "issues_count": 1 }
    },
    "critical_elements": [
      {
        "selector": "head > meta",
        "snippet": "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=0\">",
        "label": "head > meta",
        "issue_description": "Fix any of the following: user-scalable on <meta> tag disables zooming on mobile devices"
      }
    ],
    "prioritized_recommendations": [
      "Fix ARIA attributes and roles",
      "Fix 1 issues in a11y-best-practices"
    ]
  }
}
```

### Key Features

- **Issues Categorized by Impact**: Critical, serious, moderate, and minor
- **Element-Specific Information**: Selectors, snippets, and labels for affected elements
- **Issue Categories**: ARIA, navigation, color contrast, forms, keyboard access, etc.
- **Critical Elements List**: Quick access to the most serious issues
- **Prioritized Recommendations**: Actionable advice in order of importance

## Performance Audit (`/performance-audit`)

The performance audit analyzes page load speed, Core Web Vitals, and optimization opportunities.

### Response Format

```json
{
  "metadata": {
    "url": "https://example.com",
    "timestamp": "2025-03-06T16:27:44.900Z",
    "device": "desktop",
    "lighthouseVersion": "11.7.1"
  },
  "report": {
    "score": 60,
    "audit_counts": {
      "failed": 11,
      "passed": 21,
      "manual": 0,
      "informative": 20,
      "not_applicable": 8
    },
    "metrics": [
      {
        "id": "lcp",
        "score": 0,
        "value_ms": 14149,
        "passes_core_web_vital": false,
        "element_selector": "div.heading > span",
        "element_type": "text",
        "element_content": "Welcome to Example"
      },
      {
        "id": "fcp",
        "score": 0.53,
        "value_ms": 1542,
        "passes_core_web_vital": false
      },
      {
        "id": "si",
        "score": 0,
        "value_ms": 6883
      },
      {
        "id": "tti",
        "score": 0,
        "value_ms": 14746
      },
      {
        "id": "cls",
        "score": 1,
        "value_ms": 0.001,
        "passes_core_web_vital": true
      },
      {
        "id": "tbt",
        "score": 1,
        "value_ms": 43,
        "passes_core_web_vital": true
      }
    ],
    "opportunities": [
      {
        "id": "render_blocking_resources",
        "savings_ms": 1270,
        "severity": "serious",
        "resources": [
          {
            "url": "styles.css",
            "savings_ms": 781
          }
        ]
      }
    ],
    "page_stats": {
      "total_size_kb": 2190,
      "total_requests": 108,
      "resource_counts": {
        "js": 86,
        "css": 1,
        "img": 3,
        "font": 3,
        "other": 15
      },
      "third_party_size_kb": 2110,
      "main_thread_blocking_time_ms": 693
    },
    "prioritized_recommendations": ["Improve Largest Contentful Paint (LCP)"]
  }
}
```

### Key Features

- **Core Web Vitals Analysis**: LCP, FCP, CLS, TBT with pass/fail status
- **Element Information for LCP**: Identifies what's causing the largest contentful paint
- **Optimization Opportunities**: Specific actions to improve performance with estimated time savings
- **Resource Breakdown**: By type, size, and origin (first vs. third party)
- **Main Thread Analysis**: Blocking time metrics to identify JavaScript performance issues
- **Resource-Specific Recommendations**: For each optimization opportunity

## SEO Audit (`/seo-audit`)

The SEO audit checks search engine optimization best practices and identifies issues that could affect search ranking.

### Response Format

```json
{
  "metadata": {
    "url": "https://example.com",
    "timestamp": "2025-03-06T16:29:12.455Z",
    "device": "desktop",
    "lighthouseVersion": "11.7.1"
  },
  "report": {
    "score": 91,
    "audit_counts": {
      "failed": 1,
      "passed": 10,
      "manual": 1,
      "informative": 0,
      "not_applicable": 3
    },
    "issues": [
      {
        "id": "is-crawlable",
        "title": "Page is blocked from indexing",
        "impact": "critical",
        "category": "crawlability",
        "score": 0
      }
    ],
    "categories": {
      "content": { "score": 0, "issues_count": 0 },
      "mobile": { "score": 0, "issues_count": 0 },
      "crawlability": { "score": 0, "issues_count": 1 },
      "other": { "score": 0, "issues_count": 0 }
    },
    "prioritized_recommendations": [
      "Fix crawlability issues (1 issues): robots.txt, sitemaps, and redirects"
    ]
  }
}
```

### Key Features

- **Issues Categorized by Impact**: Critical, serious, moderate, and minor
- **SEO Categories**: Content, mobile friendliness, crawlability
- **Issue Details**: Information about what's causing each SEO problem
- **Prioritized Recommendations**: Actionable advice in order of importance

## Best Practices Audit (`/best-practices-audit`)

The best practices audit evaluates adherence to web development best practices related to security, trust, user experience, and browser compatibility.

### Response Format

```json
{
  "metadata": {
    "url": "https://example.com",
    "timestamp": "2025-03-06T17:01:38.029Z",
    "device": "desktop",
    "lighthouseVersion": "11.7.1"
  },
  "report": {
    "score": 74,
    "audit_counts": {
      "failed": 4,
      "passed": 10,
      "manual": 0,
      "informative": 2,
      "not_applicable": 1
    },
    "issues": [
      {
        "id": "deprecations",
        "title": "Uses deprecated APIs",
        "impact": "critical",
        "category": "security",
        "score": 0,
        "details": [
          {
            "value": "UnloadHandler"
          }
        ]
      },
      {
        "id": "errors-in-console",
        "title": "Browser errors were logged to the console",
        "impact": "serious",
        "category": "user-experience",
        "score": 0,
        "details": [
          {
            "source": "console.error",
            "description": "ReferenceError: variable is not defined"
          }
        ]
      }
    ],
    "categories": {
      "security": { "score": 75, "issues_count": 1 },
      "trust": { "score": 100, "issues_count": 0 },
      "user-experience": { "score": 50, "issues_count": 1 },
      "browser-compat": { "score": 100, "issues_count": 0 },
      "other": { "score": 75, "issues_count": 2 }
    },
    "prioritized_recommendations": [
      "Address 1 security issues: vulnerabilities, CSP, deprecations",
      "Improve 1 user experience issues: console errors, user interactions"
    ]
  }
}
```

### Key Features

- **Issues Categorized by Impact**: Critical, serious, moderate, and minor
- **Best Practice Categories**: Security, trust, user experience, browser compatibility
- **Detailed Issue Information**: Specific problems affecting best practices compliance
- **Security Focus**: Special attention to security vulnerabilities and deprecated APIs
- **Prioritized Recommendations**: Actionable advice in order of importance

## License

MIT

# Puppeteer Service

A comprehensive browser automation service built on Puppeteer to provide reliable cross-platform browser control capabilities.

## Features

- **Cross-Platform Browser Support**:

  - Windows, macOS, and Linux support
  - Chrome, Edge, Brave, and Firefox detection
  - Fallback strategy for finding browser executables

- **Smart Browser Management**:

  - Singleton browser instance with automatic cleanup
  - Connection retry mechanisms
  - Temporary user data directories with cleanup

- **Rich Configuration Options**:
  - Custom browser paths
  - Network condition emulation
  - Device emulation (mobile, tablet, desktop)
  - Resource blocking
  - Cookies and headers customization
  - Locale and timezone emulation

## ⚙️ Configuration & Environment Variables

### Server Configuration
```bash
# Environment variables for enhanced operation
export PORT=3025                    # Preferred server port (auto-fallback enabled)
export SERVER_HOST=0.0.0.0         # Server host binding (0.0.0.0 for all interfaces)
export SCREENSHOT_STORAGE_PATH=/path/to/screenshots  # Custom screenshot directory
```

### Screenshot Storage Configuration
The server supports automatic screenshot organization:
- **Project-based folders**: Screenshots organized by project name
- **URL-based subfolders**: Automatic categorization by page type (login, dashboard, etc.)
- **Timestamp naming**: Collision-free file naming with datetime stamps
- **Custom paths**: Override storage location via environment variable

### Connection Stability Settings
```javascript
// Built-in optimizations (no configuration needed)
HEARTBEAT_INTERVAL = 25000;    // 25 seconds
HEARTBEAT_TIMEOUT = 60000;     // 60 seconds  
MAX_RECONNECT_ATTEMPTS = 10;   // Chrome extension retry limit
SCREENSHOT_TIMEOUT = 15000;    // 15 seconds for autonomous operation
```

## 🚨 Enhanced Troubleshooting Guide

### Connection Issues

#### Problem: Chrome Extension Can't Connect
**Symptoms**: "Chrome extension not connected" errors, screenshot failures

**Solutions**:
1. **Check Server Status**:
   ```bash
   curl http://localhost:3026/.identity
   # Expected: {"port":3026,"name":"browser-tools-server","version":"1.2.0"}
   ```

2. **Verify Connection Health**:
   ```bash
   curl http://localhost:3026/connection-health
   # Check "connected" and "healthy" status
   ```

3. **Chrome Extension Reset**:
   - Go to `chrome://extensions/`
   - Find "BrowserTools MCP" extension
   - Click "Reload" button
   - Open DevTools → BrowserTools tab
   - Verify connection status

#### Problem: Server Port Conflicts
**Symptoms**: "Port already in use" or connection on unexpected port

**Solutions**:
- Server automatically selects available ports (3025-3035)
- Check console output for actual port: `"Aggregator listening on http://0.0.0.0:3026"`
- Update Chrome extension settings to match actual port
- Use environment variable: `export PORT=3030` for specific port preference

#### Problem: Screenshot Failures
**Symptoms**: Timeout errors, "no response from Chrome extension"

**Solutions**:
1. **Verify Tab Context**: Screenshots only work on regular webpages (not DevTools pages)
2. **Check Connection Health**: Ensure WebSocket is connected and healthy
3. **Test Simple Screenshot**: Try basic screenshot without custom parameters
4. **Review Timeout Settings**: 15-second timeout should handle most network conditions

### Performance Optimization

#### Long-Running Autonomous Sessions
- **Memory Management**: Server automatically cleans up stale callbacks
- **Connection Monitoring**: Health endpoint provides real-time metrics
- **Log Rotation**: Configurable log limits prevent memory bloat
- **WebSocket Stability**: Enhanced heartbeat prevents connection drops

#### Network Tolerance  
- **Exponential Backoff**: Smart retry logic with increasing delays
- **Connection Validation**: Server identity verification before operations
- **Timeout Handling**: Increased timeouts for unreliable networks
- **Fallback Mechanisms**: Multiple discovery methods for server detection

### Debug Information Access

#### Server Logs
```bash
# Start server with detailed logging
DEBUG=* node dist/browser-connector.js

# Monitor connection events
tail -f server.log | grep -E "(WebSocket|connection|heartbeat)"
```

#### Chrome Extension Debug
1. Open `chrome://extensions/`
2. Find "BrowserTools MCP" → click "Details"
3. Click "Inspect views: DevTools"
4. Check Console tab for WebSocket messages
5. Monitor Network tab for server communication

#### Connection Health Monitoring
```bash
# Real-time health monitoring
watch -n 5 'curl -s http://localhost:3026/connection-health | jq .'

# Check for specific issues
curl -s http://localhost:3026/connection-health | jq '.healthy, .timeSinceLastHeartbeat, .pendingScreenshots'
```

## 🎯 Performance Metrics

### Autonomous Operation Benchmarks
- **Connection Recovery**: 3-15 seconds from network drop
- **Screenshot Capture**: < 5 seconds under normal conditions  
- **Heartbeat Frequency**: Every 25 seconds (optimized for stability vs. overhead)
- **Memory Usage**: Stable during 2+ hour sessions with log rotation
- **Network Tolerance**: Handles 95%+ of residential/office network conditions

### Recommended System Resources
- **RAM**: 512MB minimum, 1GB recommended for extended sessions
- **CPU**: Any modern processor (connection monitoring is lightweight)
- **Network**: 10Mbps for reliable screenshot transmission
- **Disk**: 100MB for logs + screenshot storage space

---

## 🏆 Success Indicators

### Healthy Operation Signs
✅ Server starts and displays available network addresses  
✅ Chrome extension shows "Connected" status in DevTools  
✅ `/connection-health` returns `"healthy": true`  
✅ Screenshots capture and save within 5 seconds  
✅ WebSocket heartbeat messages every 25 seconds  
✅ Automatic recovery from network interruptions  

### Ready for Autonomous AI Development!
When all indicators are green, your Browser Tools Server is optimized for extended autonomous AI development workflows with minimal interruption and maximum reliability.

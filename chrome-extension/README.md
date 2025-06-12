# Browser Tools Chrome Extension

**🚀 Version 1.2.0 - Enhanced Connection Stability for Autonomous AI Development**

A Chrome extension optimized for autonomous AI-powered frontend development workflows. This extension provides seamless browser state capture, real-time log streaming, and enhanced WebSocket stability for extended AI development sessions.

## ✨ Key Features for Autonomous Operation

### Enhanced Browser Integration
- **Real-time console log capture** with automatic streaming to MCP server
- **Network request monitoring** with detailed request/response analysis
- **Element selection tracking** via Chrome DevTools integration
- **Screenshot capture** with organized project-based storage
- **Page navigation detection** with automatic context updates

### 🚀 Connection Stability Enhancements
- **Fast reconnection** with 3-second delays (reduced from 5s)
- **Exponential backoff** with up to 10 retry attempts for autonomous reliability
- **Enhanced background retry logic** with server validation before connection attempts
- **Streamlined server discovery** with essential IP scanning (300ms timeouts)
- **Intelligent heartbeat responses** with connection metadata for debugging

### Autonomous Workflow Optimizations
- **Extended timeouts** (10 seconds) for network tolerance during autonomous operation
- **Enhanced error logging** with detailed connection state for debugging
- **Automatic server validation** before URL updates and screenshot requests
- **Background task resilience** with 5 retry attempts and exponential backoff
- **Connection health reporting** to support autonomous operation monitoring

## 📦 Installation & Setup

### Prerequisites
- **Chrome Browser** (Version 88 or higher)
- **Browser Tools Server** running (automatically discovered)
- **Developer Mode** enabled in Chrome Extensions

### Installation Steps

1. **Enable Developer Mode**:
   ```bash
   # Navigate to chrome://extensions/
   # Toggle "Developer mode" ON (top-right corner)
   ```

2. **Install Dependencies**:
   ```bash
   cd chrome-extension
   npm install
   ```

3. **Load Extension**:
   - Click "Load unpacked" in Chrome Extensions page
   - Select the `chrome-extension` directory
   - Extension will appear as "BrowserTools MCP" in your extensions list

4. **Verify Installation**:
   - Open any webpage (not DevTools pages)
   - Press F12 to open DevTools  
   - Look for "BrowserTools" tab in DevTools panel
   - Check connection status (should show "Searching for server..." then "Connected")

## 🔧 Configuration & Settings

### Automatic Server Discovery
The extension automatically discovers the Browser Tools Server:
- **Scans ports**: 3025-3035 on localhost and common development IPs
- **Fast discovery**: 300ms timeout per connection attempt
- **Server validation**: Verifies server identity before connecting
- **Auto-reconnection**: 15-second intervals with exponential backoff

### Manual Configuration (if needed)
Access extension settings in the DevTools BrowserTools panel:

```javascript
// Default settings (auto-configured)
{
  serverHost: "localhost",        // Server host
  serverPort: 3025,              // Server port (auto-detected)
  logLimit: 50,                  // Console log limit
  queryLimit: 30000,             // Query size limit
  screenshotPath: "",            // Custom screenshot path
  allowAutoPaste: false          // Auto-paste screenshot feature
}
```

## 🚀 DevTools Panel Interface

### Connection Status Banner
- **Green indicator**: Connected to Browser Tools Server
- **Red indicator**: Connection issues or server not found
- **Reconnect button**: Manual reconnection trigger when needed
- **Server info**: Shows connected server version and port

### Settings Panel (Advanced)
- **Log Management**: Configure console log limits and filtering
- **Network Monitoring**: Toggle request/response header visibility
- **Screenshot Options**: Custom paths and auto-paste settings
- **Connection Settings**: Manual server host/port configuration

### Action Buttons
- **Capture Screenshot**: Instant screenshot with organized storage
- **Wipe Logs**: Clear all captured logs and reset session state
- **Discover Server**: Manual server discovery and connection

## 📊 Connection Health & Monitoring

### Real-Time Status Indicators
The extension provides detailed connection information:

```javascript
// Connection health data
{
  connected: true,
  heartbeatActive: true,
  lastHeartbeat: 1735814017588,
  reconnectAttempts: 0,
  serverPort: 3026,
  connectionId: "conn_1735814017588_abc123"
}
```

### Automatic Recovery Features
- **Network drop detection**: Immediate reconnection attempts
- **Server restart handling**: Automatic discovery of new server instances
- **Page refresh resilience**: Maintains connection across navigation
- **Background tab handling**: Maintains connection when tab not active

## 🔍 Troubleshooting Guide

### Common Issues & Solutions

#### Issue: Extension Not Appearing in DevTools
**Symptoms**: No "BrowserTools" tab in Chrome DevTools

**Solutions**:
1. **Complete Chrome restart**: Close all Chrome windows and restart
2. **Reload extension**: Go to `chrome://extensions/` → Find "BrowserTools MCP" → Click "Reload"
3. **Check installation**: Ensure extension shows as "Enabled" in extensions page
4. **Try different webpage**: Some pages block DevTools extensions

#### Issue: "Searching for server..." Never Connects
**Symptoms**: Connection status stuck on searching, no server found

**Solutions**:
1. **Verify server is running**:
   ```bash
   curl http://localhost:3026/.identity
   # Should return server identity JSON
   ```

2. **Check server logs**: Look for startup messages and port information

3. **Manual connection**: Use "Discover Server" button in DevTools panel

4. **Port conflicts**: Server may be on different port (check console output)

#### Issue: Screenshots Fail with Timeout
**Symptoms**: "Screenshot capture timed out" errors

**Solutions**:
1. **Check webpage type**: Screenshots don't work on DevTools pages or chrome:// URLs
2. **Verify connection**: Ensure "Connected" status in DevTools panel
3. **Try different page**: Test on a simple webpage like google.com
4. **Check network**: Poor connection may cause timeouts

#### Issue: Connection Keeps Dropping
**Symptoms**: Frequent reconnections, unstable connection status

**Solutions**:
1. **Check server stability**: Monitor server console for errors
2. **Network diagnosis**: Test connection quality and stability
3. **Firewall/antivirus**: Check if software is blocking WebSocket connections
4. **Chrome permissions**: Ensure extension has necessary permissions

### Debug Information Access

#### Extension Console Logs
1. Go to `chrome://extensions/`
2. Find "BrowserTools MCP" → Click "Details"
3. Click "Inspect views: background page"
4. Check Console tab for detailed logs

#### Network Debugging
- Open DevTools → Network tab
- Filter for WebSocket connections
- Monitor connection events and errors
- Check for failed HTTP requests to server

#### Connection State Monitoring
```javascript
// Access in extension DevTools console
chrome.storage.local.get(['browserConnectorSettings'], (result) => {
  console.log('Extension settings:', result);
});
```

## 🎯 Performance & Optimization

### Autonomous Operation Metrics
- **Connection establishment**: < 5 seconds under normal conditions
- **Reconnection time**: 3-15 seconds after network drop
- **Screenshot capture**: < 5 seconds for standard web pages
- **Memory usage**: < 50MB for typical development sessions
- **Network overhead**: Minimal (heartbeat every 25 seconds)

### Resource Management
- **Automatic cleanup**: Clears stale data and callbacks
- **Memory optimization**: Configurable log limits prevent bloat
- **Network efficiency**: Compressed WebSocket messages
- **Background resilience**: Maintains operation when tab not active

## 🏆 Success Indicators for Autonomous Development

### Green Status Indicators
✅ Extension appears in Chrome Extensions page as "Enabled"  
✅ "BrowserTools" tab visible in Chrome DevTools  
✅ Connection status shows "Connected" with server info  
✅ Screenshots capture successfully and save to organized folders  
✅ Console logs and network requests stream in real-time  
✅ Automatic reconnection after network interruptions  

### Ready for Extended AI Sessions!
When all indicators are green, your Chrome extension is optimized for autonomous AI development workflows with minimal interruption and maximum reliability.

---

## 📚 Related Documentation

- **Main Setup Guide**: `../SETUP_GUIDE.md`
- **Server Documentation**: `../browser-tools-server/README.md`
- **MCP Server Guide**: `../browser-tools-mcp/README.md`
- **Testing Report**: `../AUTONOMOUS_OPERATION_TESTING_REPORT.md`

## 🤝 Support & Contributing

For issues, feature requests, or contributions, please refer to the main project repository documentation and testing reports.

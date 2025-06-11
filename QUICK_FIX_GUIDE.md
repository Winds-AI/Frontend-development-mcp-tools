# Quick Fix Guide for Screenshot Issues

## Current Problem
The Chrome extension is not connected to the browser-tools-server, causing screenshot capture to fail.

## Step-by-Step Fix

### 1. Verify Server is Running
```bash
cd /home/meet/Desktop/MCP/browser-tools-mcp/browser-tools-server
node dist/browser-connector.js
```
Look for output like: "Aggregator listening on http://0.0.0.0:3025" or similar port.

### 2. Reload Chrome Extension
1. Go to `chrome://extensions/`
2. Find "BrowserTools MCP" extension
3. Click the **Reload** button (🔄)
4. This is important after manifest.json changes!

### 3. Open DevTools Panel
1. Navigate to any regular webpage (NOT DevTools pages)
2. Open Chrome DevTools (F12)
3. Click on "BrowserTools" tab
4. Check connection status at the top

### 4. Configure Extension Settings
In the BrowserTools DevTools panel:
1. Set **Server Host**: `localhost`
2. Set **Server Port**: `3025` (or whatever port the server is using)
3. Click **Discover Server** button
4. Look for "Connected" status

### 5. Test Screenshot
1. Make sure you're on a regular webpage (not DevTools)
2. Click **Capture Screenshot** in the DevTools panel
3. Should see success message

## Common Port Issues

If server shows different port (like 3026), update extension settings:
1. In DevTools panel, change port to match server
2. Click "Discover Server" again
3. Should show "Connected"

## DevTools Screenshot Limitation

**Cannot take screenshots of DevTools pages!**
- Navigate to any regular webpage first
- Examples: `http://localhost:3000`, `https://google.com`, etc.
- Then take screenshot

## Verification
When working properly, you should see:
1. Server console: "WebSocket connection established"
2. Extension panel: "Connected" status
3. Screenshot success: "Screenshot saved successfully"

## Project Organization
Screenshots will be saved to:
```
~/Downloads/Windsurf_Screenshots/Bandar-Admin-Frontend/
├── dashboard/
├── login/
└── [other-pages]/
```

## If Still Not Working
1. Restart Chrome completely
2. Restart browser-tools-server
3. Reload extension
4. Try on a fresh webpage tab

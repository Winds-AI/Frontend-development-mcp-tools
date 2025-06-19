#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}${colors.blue}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logInfo(message) {
  log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

function runCommand(command, args, cwd = rootDir) {
  return new Promise((resolve, reject) => {
    log(`${colors.cyan}Running: ${command} ${args.join(' ')}${colors.reset}`);
    
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function checkNodeVersion() {
  logStep('1', 'Checking Node.js version...');
  
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    logError(`Node.js version ${nodeVersion} is not supported. Please upgrade to Node.js 18 or higher.`);
    process.exit(1);
  }
  
  logSuccess(`Node.js version ${nodeVersion} is supported`);
}

async function installDependencies() {
  logStep('2', 'Installing root dependencies...');
  
  try {
    await runCommand('npm', ['install']);
    logSuccess('Root dependencies installed');
  } catch (error) {
    logError(`Failed to install root dependencies: ${error.message}`);
    process.exit(1);
  }

  logStep('3', 'Installing dependencies for browser-tools-mcp...');
  
  const mcpDir = join(rootDir, 'browser-tools-mcp');
  if (!existsSync(mcpDir)) {
    logError('browser-tools-mcp directory not found');
    process.exit(1);
  }
  
  try {
    await runCommand('npm', ['install'], mcpDir);
    logSuccess('browser-tools-mcp dependencies installed');
  } catch (error) {
    logError(`Failed to install browser-tools-mcp dependencies: ${error.message}`);
    process.exit(1);
  }

  logStep('4', 'Installing dependencies for browser-tools-server...');
  
  const serverDir = join(rootDir, 'browser-tools-server');
  if (!existsSync(serverDir)) {
    logError('browser-tools-server directory not found');
    process.exit(1);
  }
  
  try {
    await runCommand('npm', ['install'], serverDir);
    logSuccess('browser-tools-server dependencies installed');
  } catch (error) {
    logError(`Failed to install browser-tools-server dependencies: ${error.message}`);
    process.exit(1);
  }
}

async function buildProjects() {
  logStep('5', 'Building browser-tools-mcp...');
  
  const mcpDir = join(rootDir, 'browser-tools-mcp');
  try {
    await runCommand('npm', ['run', 'build'], mcpDir);
    logSuccess('browser-tools-mcp built successfully');
  } catch (error) {
    logError(`Failed to build browser-tools-mcp: ${error.message}`);
    process.exit(1);
  }

  logStep('6', 'Building browser-tools-server...');
  
  const serverDir = join(rootDir, 'browser-tools-server');
  try {
    await runCommand('npm', ['run', 'build'], serverDir);
    logSuccess('browser-tools-server built successfully');
  } catch (error) {
    logError(`Failed to build browser-tools-server: ${error.message}`);
    process.exit(1);
  }
}

async function createDirectories() {
  logStep('7', 'Creating necessary directories...');
  
  const dirs = [
    join(rootDir, 'logs'),
    join(rootDir, 'screenshots')
  ];
  
  dirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      logSuccess(`Created directory: ${dir}`);
    }
  });
}

async function startServer() {
  logStep('8', 'Starting the server...');
  
  try {
    // Generate MCP configuration JSON in the format expected by AI IDEs
    const mcpServerPath = join(rootDir, 'browser-tools-mcp', 'dist', 'mcp-server.js');
    const mcpConfig = {
      "mcpServers": {
        "browser-tools-frontend-dev": {
          "command": "node",
          "args": [
            mcpServerPath  // Path to the MCP server script
          ],
          "env": {
            // === For using searchApiDocs and discoverApiStructure tools ===
            "SWAGGER_URL": "https://api.example.com/docs/swagger.json", // OpenAPI/Swagger JSON URL

            // === For using analyzeImageFile tool ===
            "PROJECT_ROOT": process.cwd(),       // Project root for file operations
            
            // === For using executeAuthenticatedApiCall tool ===
            "AUTH_ORIGIN": "http://localhost:5173",        // Your app's localhost URL
            "AUTH_STORAGE_TYPE": "localStorage",           // to get access token from cookie/localStorage/sessionStorage 
            "AUTH_TOKEN_KEY": "authToken",                 // Token key name in storage
            "API_BASE_URL": "https://api.example.com",     // base URL for calling API

            // === For using takeScreenshot tool ===
            "SCREENSHOT_STORAGE_PATH": join(process.env.HOME || process.env.USERPROFILE, 'windsurf_screenshots'), // Custom screenshot directory

            // === Connection Stability (Optional Overrides) ===
            "BROWSER_TOOLS_HOST": "127.0.0.1",            // Server host override
            "BROWSER_TOOLS_PORT": "3025"                   // Server port override
          }
        }
      }
    };
    
    log(`\n${colors.bright}${colors.green}AI IDE Configuration:${colors.reset}`);
    log(`${colors.cyan}• Copy and paste this configuration into your AI IDE:${colors.reset}`);
    log(`${colors.yellow}${JSON.stringify(mcpConfig, null, 2)}${colors.reset}`);
    
    // Display explanations for environment variables
    log(`\n${colors.bright}${colors.green}Environment Variables Explained:${colors.reset}`);
    log(`${colors.cyan}• SWAGGER_URL:${colors.reset} URL to your OpenAPI/Swagger JSON for API documentation tools`);
    log(`${colors.cyan}• PROJECT_ROOT:${colors.reset} Root directory path for file operations and image analysis`);
    log(`${colors.cyan}• AUTH_ORIGIN:${colors.reset} Your app's localhost URL for authentication (e.g., http://localhost:5173)`);
    log(`${colors.cyan}• AUTH_STORAGE_TYPE:${colors.reset} Where auth tokens are stored (localStorage, sessionStorage, or cookie)`);
    log(`${colors.cyan}• AUTH_TOKEN_KEY:${colors.reset} Key name for the auth token in storage (e.g., authToken, accessToken)`);
    log(`${colors.cyan}• API_BASE_URL:${colors.reset} Base URL for making API calls (e.g., https://api.example.com)`);
    log(`${colors.cyan}• SCREENSHOT_STORAGE_PATH:${colors.reset} Directory to save screenshots captured by the tools`);
    log(`${colors.cyan}• BROWSER_TOOLS_HOST:${colors.reset} Host for the browser tools server (default: 127.0.0.1)`);
    log(`${colors.cyan}• BROWSER_TOOLS_PORT:${colors.reset} Port for the browser tools server (default: 3025)`);
    log(`\n${colors.yellow}Customize these values in the configuration based on your project needs${colors.reset}`);

    log(`\n${colors.bright}Chrome Extension:${colors.reset}`);
    log(`${colors.cyan}• Extension Directory:${colors.reset} ${join(rootDir, 'chrome-extension')}`);
    log(`${colors.cyan}• Open Chrome and go to chrome://extensions/${colors.reset}`);
    log(`${colors.cyan}• Enable "Developer mode"${colors.reset}`);
    log(`${colors.cyan}• Click "Load unpacked" and select the chrome-extension directory${colors.reset}`);
    
    log(`\n${colors.yellow}Press Ctrl+C to stop the server${colors.reset}\n`);
    
    // Start the browser tools server
    logInfo('Starting browser tools server...');
    
    const serverDir = join(rootDir, 'browser-tools-server');
    const serverProcess = spawn('npm', ['start'], {
      cwd: serverDir,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    
    // Handle server process events
    serverProcess.on('error', (error) => {
      logError(`Server error: ${error.message}`);
      process.exit(1);
    });
    
    // Forward SIGINT (Ctrl+C) to the server process
    process.on('SIGINT', () => {
      serverProcess.kill('SIGINT');
      log(`\n${colors.yellow}Shutting down...${colors.reset}`);
      process.exit(0);
    });
    
    // Keep the main process running
    return new Promise((resolve) => {
      serverProcess.on('close', (code) => {
        if (code !== 0) {
          logError(`Server process exited with code ${code}`);
          process.exit(code);
        }
        resolve();
      });
    });
  } catch (error) {
    logError(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  try {
    log(`${colors.bright}${colors.magenta}🚀 Frontend Development MCP Tools Setup and Run${colors.reset}\n`);
    
    await checkNodeVersion();
    await installDependencies();
    await buildProjects();
    await createDirectories();
    await startServer();
    
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Error in main execution:', error);
  process.exit(1);
});

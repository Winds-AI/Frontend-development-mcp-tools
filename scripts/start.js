#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
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

function logError(message) {
  log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logInfo(message) {
  log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

function checkSetup() {
  const mcpDistPath = join(rootDir, 'browser-tools-mcp', 'dist', 'mcp-server.js');
  const serverDistPath = join(rootDir, 'browser-tools-server', 'dist', 'browser-connector.js');
  
  if (!existsSync(mcpDistPath)) {
    logError('MCP server not built. Please run setup first:');
    log(`${colors.yellow}npm run setup${colors.reset} or ${colors.yellow}frontend-dev-mcp-setup${colors.reset}`);
    process.exit(1);
  }
  
  if (!existsSync(serverDistPath)) {
    logError('Browser tools server not built. Please run setup first:');
    log(`${colors.yellow}npm run setup${colors.reset} or ${colors.yellow}frontend-dev-mcp-setup${colors.reset}`);
    process.exit(1);
  }
  
  logSuccess('Setup verification passed');
}

function startServer() {
  return new Promise((resolve, reject) => {
    const serverDir = join(rootDir, 'browser-tools-server');
    
    logInfo('Starting browser tools server...');
    
    const serverProcess = spawn('npm', ['start'], {
      cwd: serverDir,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    serverProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Server process exited with code ${code}`));
      }
    });

    serverProcess.on('error', (error) => {
      reject(error);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log(`\n${colors.yellow}Shutting down server...${colors.reset}`);
      serverProcess.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      log(`\n${colors.yellow}Shutting down server...${colors.reset}`);
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });
  });
}

function displayStartupMessage() {
  log(`\n${colors.bright}${colors.magenta}🚀 Frontend Development MCP Tools${colors.reset}\n`);
  
  log(`${colors.bright}Server Information:${colors.reset}`);
  log(`${colors.cyan}• Browser Tools Server:${colors.reset} Starting on port 3025+ (auto-detected)`);
  log(`${colors.cyan}• MCP Server Path:${colors.reset} ${join(rootDir, 'browser-tools-mcp', 'dist', 'mcp-server.js')}`);
  
  log(`\n${colors.bright}Chrome Extension:${colors.reset}`);
  log(`${colors.cyan}• Extension Directory:${colors.reset} ${join(rootDir, 'chrome-extension')}`);
  log(`${colors.cyan}• Load in Chrome:${colors.reset} chrome://extensions/ → Load unpacked`);
  
  log(`\n${colors.bright}AI IDE Configuration:${colors.reset}`);
  log(`${colors.cyan}• Add MCP server to your AI IDE configuration`);
  log(`${colors.cyan}• See SETUP_GUIDE.md for detailed configuration examples`);
  
  log(`\n${colors.yellow}Press Ctrl+C to stop the server${colors.reset}\n`);
}

async function main() {
  try {
    displayStartupMessage();
    checkSetup();
    await startServer();
  } catch (error) {
    logError(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log(`${colors.bright}Frontend Development MCP Tools${colors.reset}\n`);
  log(`${colors.cyan}Usage:${colors.reset}`);
  log(`  frontend-dev-mcp              Start the browser tools server`);
  log(`  frontend-dev-mcp-setup        Run the setup process`);
  log(`  frontend-dev-mcp --help       Show this help message`);
  log(`\n${colors.cyan}NPM Scripts:${colors.reset}`);
  log(`  npm start                     Start the server`);
  log(`  npm run setup                 Run setup`);
  log(`  npm run build                 Build both projects`);
  log(`  npm run dev                   Start both server and MCP in development mode`);
  process.exit(0);
}

// Run start if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;

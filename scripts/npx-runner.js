#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

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

// Detect if running via npx
function isRunningViaNpx() {
  // Check if we're in a temporary npm cache directory
  const isInNpmCache = rootDir.includes('.npm/_npx') || 
                       rootDir.includes('npm-cache/_npx') ||
                       rootDir.includes('_npx') ||
                       process.env.npm_command === 'exec';
  
  // Check if npm_execpath contains npx
  const isNpxExec = process.env.npm_execpath && process.env.npm_execpath.includes('npx');
  
  return isInNpmCache || isNpxExec;
}

// Get a persistent directory for npx usage
function getNpxDataDir() {
  const homeDir = os.homedir();
  const dataDir = join(homeDir, '.frontend-dev-mcp-tools');
  
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  
  return dataDir;
}

// Check if setup has been completed before
function isSetupComplete() {
  if (!isRunningViaNpx()) {
    // For regular installation, check if dist directories exist
    const mcpDistPath = join(rootDir, 'browser-tools-mcp', 'dist', 'mcp-server.js');
    const serverDistPath = join(rootDir, 'browser-tools-server', 'dist', 'browser-connector.js');
    return existsSync(mcpDistPath) && existsSync(serverDistPath);
  } else {
    // For npx, check if setup was completed in this session
    const dataDir = getNpxDataDir();
    const setupMarker = join(dataDir, 'setup-complete');
    return existsSync(setupMarker);
  }
}

function markSetupComplete() {
  if (isRunningViaNpx()) {
    const dataDir = getNpxDataDir();
    const setupMarker = join(dataDir, 'setup-complete');
    writeFileSync(setupMarker, new Date().toISOString());
  }
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

async function runSetup() {
  logStep('2', 'Installing dependencies for browser-tools-mcp...');
  
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

  logStep('3', 'Installing dependencies for browser-tools-server...');
  
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

  logStep('4', 'Building browser-tools-mcp...');
  try {
    await runCommand('npm', ['run', 'build'], mcpDir);
    logSuccess('browser-tools-mcp built successfully');
  } catch (error) {
    logError(`Failed to build browser-tools-mcp: ${error.message}`);
    process.exit(1);
  }

  logStep('5', 'Building browser-tools-server...');
  try {
    await runCommand('npm', ['run', 'build'], serverDir);
    logSuccess('browser-tools-server built successfully');
  } catch (error) {
    logError(`Failed to build browser-tools-server: ${error.message}`);
    process.exit(1);
  }

  logStep('6', 'Creating necessary directories...');
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

  markSetupComplete();
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
  
  if (isRunningViaNpx()) {
    log(`${colors.bright}${colors.green}Running via npx - No installation required!${colors.reset}\n`);
  }
  
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
    await checkNodeVersion();
    
    if (!isSetupComplete()) {
      log(`${colors.bright}${colors.yellow}First-time setup required...${colors.reset}\n`);
      await runSetup();
      log(`\n${colors.bright}${colors.green}🎉 Setup completed successfully!${colors.reset}\n`);
    } else {
      logSuccess('Setup already complete, starting server...');
    }
    
    await startServer();
  } catch (error) {
    logError(`Failed to start: ${error.message}`);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log(`${colors.bright}Frontend Development MCP Tools${colors.reset}\n`);
  log(`${colors.cyan}Usage:${colors.reset}`);
  log(`  npx @winds-ai/frontend-development-mcp-tools    Run with npx (recommended)`);
  log(`  frontend-dev-mcp                               Run if installed globally`);
  log(`  frontend-dev-mcp --help                        Show this help message`);
  log(`\n${colors.cyan}Features:${colors.reset}`);
  log(`  • Automatic setup on first run`);
  log(`  • No global installation required with npx`);
  log(`  • Cross-platform support`);
  log(`  • Automatic dependency management`);
  process.exit(0);
}

// Always run main when this file is loaded, whether through direct execution or as a module
// This ensures it works with npx which might not satisfy the import.meta.url condition
main().catch(error => {
  console.error('Error in main execution:', error);
  process.exit(1);
});

export default main;

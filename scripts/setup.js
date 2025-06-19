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

function logWarning(message) {
  log(`${colors.yellow}⚠ ${message}${colors.reset}`);
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
}

async function buildProjects() {
  logStep('4', 'Building browser-tools-mcp...');
  
  const mcpDir = join(rootDir, 'browser-tools-mcp');
  try {
    await runCommand('npm', ['run', 'build'], mcpDir);
    logSuccess('browser-tools-mcp built successfully');
  } catch (error) {
    logError(`Failed to build browser-tools-mcp: ${error.message}`);
    process.exit(1);
  }

  logStep('5', 'Building browser-tools-server...');
  
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
}

async function displayCompletionMessage() {
  log(`\n${colors.bright}${colors.green}🎉 Setup completed successfully!${colors.reset}\n`);
  
  log(`${colors.bright}Next steps:${colors.reset}`);
  log(`${colors.cyan}1. Load the Chrome extension:${colors.reset}`);
  log(`   - Open Chrome and go to chrome://extensions/`);
  log(`   - Enable "Developer mode"`);
  log(`   - Click "Load unpacked" and select the chrome-extension directory`);
  
  log(`\n${colors.cyan}2. Start the server:${colors.reset}`);
  log(`   ${colors.yellow}npm start${colors.reset} or ${colors.yellow}frontend-dev-mcp${colors.reset}`);
  
  log(`\n${colors.cyan}3. Configure your AI IDE:${colors.reset}`);
  log(`   Add the MCP server configuration to your AI IDE (Windsurf, Cursor, etc.)`);
  log(`   MCP server path: ${join(rootDir, 'browser-tools-mcp', 'dist', 'mcp-server.js')}`);
  
  log(`\n${colors.bright}For detailed configuration instructions, see SETUP_GUIDE.md${colors.reset}`);
}

async function main() {
  try {
    log(`${colors.bright}${colors.magenta}🚀 Frontend Development MCP Tools Setup${colors.reset}\n`);
    
    await checkNodeVersion();
    await installDependencies();
    await buildProjects();
    await createDirectories();
    await displayCompletionMessage();
    
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;

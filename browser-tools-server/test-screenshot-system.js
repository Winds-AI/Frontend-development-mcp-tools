#!/usr/bin/env node

/**
 * Test script for the Unified Screenshot System
 * This script validates the core functionality without requiring a browser connection
 */

import ScreenshotService from './dist/screenshot-service.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

async function runTests() {
  console.log('🧪 Testing Unified Screenshot System...\n');
  
  const screenshotService = ScreenshotService.getInstance();
  
  // Test data - a simple base64 encoded 1x1 pixel PNG
  const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  console.log('📁 Test 1: Basic screenshot saving...');
  try {
    const result1 = await screenshotService.saveScreenshot(
      testBase64,
      'http://localhost:3000/dashboard',
      { filename: 'test-basic', returnImageData: true }
    );
    
    console.log('✅ Success!');
    console.log(`   📍 File: ${result1.filePath}`);
    console.log(`   📁 Project: ${result1.projectDirectory}`);
    console.log(`   📂 Category: ${result1.urlCategory}`);
    console.log(`   🆔 Filename: ${result1.filename}`);
    console.log(`   💾 Has image data: ${!!result1.imageData}\n`);
    
    // Verify file exists
    if (fs.existsSync(result1.filePath)) {
      console.log('✅ File successfully created on disk\n');
    } else {
      console.log('❌ File was not created on disk\n');
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }
  
  console.log('📁 Test 2: Project name override...');
  try {
    const result2 = await screenshotService.saveScreenshot(
      testBase64,
      'https://staging.example.com/products/view',
      { 
        projectName: 'my-custom-project',
        filename: 'staging-products',
        returnImageData: false 
      }
    );
    
    console.log('✅ Success!');
    console.log(`   📍 File: ${result2.filePath}`);
    console.log(`   📁 Project: ${result2.projectDirectory}`);
    console.log(`   📂 Category: ${result2.urlCategory}`);
    console.log(`   🆔 Filename: ${result2.filename}`);
    console.log(`   💾 Has image data: ${!!result2.imageData}\n`);
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }
  
  console.log('📁 Test 3: Environment variable detection...');
  try {
    // Set a temporary environment variable
    process.env.PROJECT_NAME = 'env-detected-project';
    
    const result3 = await screenshotService.saveScreenshot(
      testBase64,
      'http://localhost:8080/api/users',
      { filename: 'api-test' }
    );
    
    console.log('✅ Success!');
    console.log(`   📍 File: ${result3.filePath}`);
    console.log(`   📁 Project: ${result3.projectDirectory}`);
    console.log(`   📂 Category: ${result3.urlCategory}`);
    console.log(`   🆔 Filename: ${result3.filename}\n`);
    
    // Clean up environment variable
    delete process.env.PROJECT_NAME;
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }
  
  console.log('📁 Test 4: URL categorization tests...');
  const testUrls = [
    'http://localhost:3000/',
    'http://localhost:3000/dashboard',
    'http://localhost:3000/users/profile',
    'https://staging.example.com/admin',
    'https://app.example.com/settings',
    'about:blank',
    ''
  ];
  
  for (const testUrl of testUrls) {
    try {
      const result = await screenshotService.saveScreenshot(
        testBase64,
        testUrl,
        { filename: `url-test-${testUrls.indexOf(testUrl)}` }
      );
      
      console.log(`   URL: ${testUrl || '(empty)'}`);
      console.log(`   ➜ Category: ${result.urlCategory}`);
      console.log(`   ➜ Project: ${result.projectDirectory}\n`);
    } catch (error) {
      console.error(`   ❌ Failed for URL: ${testUrl}`, error);
    }
  }
  
  console.log('🎉 Testing completed!');
  console.log('\n📂 Check your Downloads/Windsurf_Screenshots folder to see the organized structure.');
}

// Run tests
runTests().catch(console.error);

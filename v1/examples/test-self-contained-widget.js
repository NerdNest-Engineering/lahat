#!/usr/bin/env node

/**
 * Test Minimal Mode
 * 
 * This script tests the minimal mode functionality by generating an app in both
 * minimal and full modes, and comparing the results.
 * 
 * Usage:
 *   node test-minimal-mode.js
 * 
 * Environment variables:
 *   CLAUDE_API_KEY - Your Claude API key
 */

import { generateMiniApp, updateMiniApp } from '../components/app-creation/main/services/mini-app-service.js';
import { DEFAULT_WIDGET_PROMPT } from '../components/app-creation/widget-system-prompts.js';
import ClaudeClient from '../claudeClient.js';
import fs from 'fs/promises';
import path from 'path';

// Mock event object for testing
const mockEvent = {
  sender: {
    send: (channel, data) => {
      console.log(`[${channel}]`, data);
    }
  }
};

// Test prompt
const testPrompt = `
  Create a simple counter widget that:
  1. Displays a number (starting at 0)
  2. Has increment and decrement buttons
  3. Has a reset button
`;

/**
 * Generate an app in the specified mode
 * @param {ClaudeClient} claudeClient - Claude client
 * @param {boolean} minimal - Whether to use minimal mode
 * @returns {Promise<Object>} - Result of app generation
 */
async function generateTestApp(claudeClient, minimal) {
  const modeName = minimal ? 'minimal' : 'full';
  console.log(`Generating app in ${modeName} mode...`);
  
  const result = await generateMiniApp(claudeClient, mockEvent, {
    prompt: testPrompt,
    appName: `TestCounter${minimal ? 'Minimal' : 'Full'}`,
    systemPrompt: DEFAULT_WIDGET_PROMPT,
    minimal
  });
  
  console.log(`App generated in ${modeName} mode:`, {
    appId: result.appId,
    filePath: result.filePath
  });
  
  return result;
}

/**
 * List all files in a directory recursively
 * @param {string} dir - Directory to list
 * @returns {Promise<string[]>} - Array of file paths
 */
async function listFilesRecursively(dir) {
  const files = [];
  
  async function traverse(currentDir, relativePath = '') {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry.name);
      const entryRelativePath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        await traverse(entryPath, entryRelativePath);
      } else {
        files.push(entryRelativePath);
      }
    }
  }
  
  await traverse(dir);
  return files;
}

/**
 * Run the test
 */
async function runTest() {
  try {
    const apiKey = process.env.CLAUDE_API_KEY;
    
    if (!apiKey) {
      console.error('Please set the CLAUDE_API_KEY environment variable');
      process.exit(1);
    }
    
    const claudeClient = new ClaudeClient(apiKey);
    
    // Generate apps in both modes
    const minimalApp = await generateTestApp(claudeClient, true);
    const fullApp = await generateTestApp(claudeClient, false);
    
    // List files in both app directories
    console.log('\nComparing file structures:');
    
    const minimalFiles = await listFilesRecursively(minimalApp.folderPath);
    const fullFiles = await listFilesRecursively(fullApp.folderPath);
    
    console.log('\nMinimal mode files:');
    minimalFiles.forEach(file => console.log(`  - ${file}`));
    
    console.log('\nFull mode files:');
    fullFiles.forEach(file => console.log(`  - ${file}`));
    
    // Compare file counts
    console.log('\nFile count comparison:');
    console.log(`  - Minimal mode: ${minimalFiles.length} files`);
    console.log(`  - Full mode: ${fullFiles.length} files`);
    console.log(`  - Difference: ${fullFiles.length - minimalFiles.length} additional files in full mode`);
    
    // Test updating the minimal app
    console.log('\nTesting update of minimal app...');
    
    const updateResult = await updateMiniApp(claudeClient, mockEvent, {
      appId: minimalApp.appId,
      prompt: `${testPrompt}\nAdd a "double" button that multiplies the current count by 2.`,
      systemPrompt: DEFAULT_WIDGET_PROMPT,
      minimal: true
    });
    
    console.log('Update successful:', {
      appId: updateResult.appId,
      filePath: updateResult.filePath,
      isMinimal: updateResult.isMinimal
    });
    
    // List files after update
    const updatedFiles = await listFilesRecursively(minimalApp.folderPath);
    
    console.log('\nMinimal mode files after update:');
    updatedFiles.forEach(file => console.log(`  - ${file}`));
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (process.argv[1] === import.meta.url.substring(7)) {
  runTest();
}

export { runTest };

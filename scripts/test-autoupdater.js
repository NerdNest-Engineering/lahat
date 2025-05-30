#!/usr/bin/env node

/**
 * Autoupdater Testing Script
 * 
 * This script helps test the autoupdater functionality by:
 * 1. Creating test releases
 * 2. Monitoring update checks
 * 3. Validating the update process
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REPO_OWNER = 'NerdNest-Engineering';
const REPO_NAME = 'lahat';

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return packageJson.version;
}

function incrementVersion(version, type = 'patch') {
  // Handle versions with suffixes like "0.0.0-test2"
  const versionParts = version.split('-');
  const baseVersion = versionParts[0];
  const suffix = versionParts.length > 1 ? `-${versionParts.slice(1).join('-')}` : '';
  
  const [major, minor, patch] = baseVersion.split('.').map(Number);
  
  let newVersion;
  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
    default:
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }
  
  // Keep the suffix for test versions
  return newVersion + suffix;
}

function createTestRelease(versionType = 'patch') {
  const currentVersion = getCurrentVersion();
  const newVersion = incrementVersion(currentVersion, versionType);
  const tagName = `v${newVersion}`;
  
  console.log(`🚀 Creating test release: ${tagName}`);
  console.log(`Current version: ${currentVersion} → New version: ${newVersion}`);
  
  try {
    // Create and push the tag
    console.log('📝 Creating git tag...');
    execSync(`git tag ${tagName}`, { stdio: 'inherit' });
    
    console.log('📤 Pushing tag to trigger GitHub Actions...');
    execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
    
    console.log(`✅ Test release ${tagName} created successfully!`);
    console.log(`🔗 Monitor the build at: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions`);
    console.log(`📦 Release will be available at: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${tagName}`);
    
    return { tagName, newVersion };
  } catch (error) {
    console.error('❌ Failed to create test release:', error.message);
    process.exit(1);
  }
}

function buildLocalVersion() {
  console.log('🔨 Building local version for testing...');
  
  try {
    execSync('npm run dist-mac-alpha', { stdio: 'inherit' });
    console.log('✅ Local build completed!');
    console.log('📁 Built app is in: dist/mac-arm64/Lahat.app');
    console.log('💡 Install this version, then test the autoupdater');
  } catch (error) {
    console.error('❌ Failed to build local version:', error.message);
    process.exit(1);
  }
}

function testUpdateCheck() {
  console.log('🔍 Testing update check...');
  console.log('💡 Run your app in production mode to test:');
  console.log('   NODE_ENV=production npm start');
  console.log('');
  console.log('🔍 Look for these console messages:');
  console.log('   🔍 Checking for update...');
  console.log('   ✅ Update available: {...}');
  console.log('   📥 Download progress: X%');
  console.log('   💬 Update dialog appears');
}

function showUsage() {
  console.log(`
🧪 Autoupdater Testing Script

Usage:
  node scripts/test-autoupdater.js <command>

Commands:
  release [patch|minor|major]  Create a test release (default: patch)
  build                        Build local version for testing
  test                         Show testing instructions
  help                         Show this help message

Examples:
  node scripts/test-autoupdater.js release patch    # Create v0.0.1 → v0.0.2
  node scripts/test-autoupdater.js release minor    # Create v0.0.1 → v0.1.0
  node scripts/test-autoupdater.js build            # Build local test version
  node scripts/test-autoupdater.js test             # Show testing steps
`);
}

// Main execution
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'release':
    createTestRelease(arg || 'patch');
    break;
  case 'build':
    buildLocalVersion();
    break;
  case 'test':
    testUpdateCheck();
    break;
  case 'help':
  default:
    showUsage();
    break;
}

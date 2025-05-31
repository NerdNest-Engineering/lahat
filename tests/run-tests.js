#!/usr/bin/env node

/**
 * Test runner for Lahat integration tests
 * Provides test discovery, execution, and reporting
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(color, text) {
  if (process.env.NO_COLOR) return text;
  return `${colors[color]}${text}${colors.reset}`;
}

async function findTestFiles(directory = 'integration') {
  const testDir = path.join(__dirname, directory);
  
  try {
    const files = await fs.readdir(testDir);
    return files
      .filter(file => file.endsWith('.test.js'))
      .map(file => path.join(testDir, file));
  } catch (error) {
    console.error(`Failed to read test directory ${testDir}:`, error.message);
    return [];
  }
}

async function runTestFile(testFile) {
  return new Promise((resolve) => {
    console.log(colorize('blue', `\n📋 Running ${path.basename(testFile)}...`));
    
    const startTime = Date.now();
    const child = spawn('node', ['--test', testFile], {
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      const result = {
        file: testFile,
        filename: path.basename(testFile),
        code,
        stdout,
        stderr,
        duration,
        success: code === 0
      };
      
      resolve(result);
    });
  });
}

function parseTestOutput(output) {
  const lines = output.split('\n');
  let tests = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const line of lines) {
    if (line.includes('# pass ')) {
      const match = line.match(/# pass (\d+)/);
      if (match) passed += parseInt(match[1]);
    }
    if (line.includes('# fail ')) {
      const match = line.match(/# fail (\d+)/);
      if (match) failed += parseInt(match[1]);
    }
    if (line.includes('# skip ')) {
      const match = line.match(/# skip (\d+)/);
      if (match) skipped += parseInt(match[1]);
    }
    if (line.includes('# tests ')) {
      const match = line.match(/# tests (\d+)/);
      if (match) tests = parseInt(match[1]);
    }
  }
  
  return { tests, passed, failed, skipped };
}

function generateReport(results) {
  console.log(colorize('bold', '\n📊 Test Results Summary'));
  console.log('═'.repeat(50));
  
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalDuration = 0;
  
  for (const result of results) {
    const stats = parseTestOutput(result.stdout);
    totalTests += stats.tests;
    totalPassed += stats.passed;
    totalFailed += stats.failed;
    totalSkipped += stats.skipped;
    totalDuration += result.duration;
    
    const status = result.success ? 
      colorize('green', '✅ PASS') : 
      colorize('red', '❌ FAIL');
    
    console.log(`${status} ${result.filename} (${result.duration}ms)`);
    
    if (stats.tests > 0) {
      console.log(`     Tests: ${stats.tests}, Passed: ${stats.passed}, Failed: ${stats.failed}, Skipped: ${stats.skipped}`);
    }
    
    if (!result.success && result.stderr) {
      console.log(colorize('red', '     Error output:'));
      result.stderr.split('\n').slice(0, 5).forEach(line => {
        if (line.trim()) console.log(`     ${line}`);
      });
    }
  }
  
  console.log('═'.repeat(50));
  console.log(`${colorize('bold', 'Total:')} ${totalTests} tests`);
  console.log(`${colorize('green', 'Passed:')} ${totalPassed}`);
  if (totalFailed > 0) {
    console.log(`${colorize('red', 'Failed:')} ${totalFailed}`);
  }
  if (totalSkipped > 0) {
    console.log(`${colorize('yellow', 'Skipped:')} ${totalSkipped}`);
  }
  console.log(`${colorize('blue', 'Duration:')} ${totalDuration}ms`);
  
  const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
  console.log(`${colorize('bold', 'Success Rate:')} ${successRate}%`);
  
  return {
    totalTests,
    totalPassed,
    totalFailed,
    totalSkipped,
    totalDuration,
    successRate: parseFloat(successRate),
    allPassed: totalFailed === 0
  };
}

async function main() {
  const args = process.argv.slice(2);
  const testPattern = args[0] || 'integration';
  
  console.log(colorize('bold', '🧪 Lahat Integration Test Runner'));
  console.log(`Test pattern: ${testPattern}`);
  
  let testFiles;
  
  if (testPattern.endsWith('.test.js')) {
    // Single test file
    testFiles = [path.resolve(testPattern)];
  } else {
    // Directory or pattern
    testFiles = await findTestFiles(testPattern);
  }
  
  if (testFiles.length === 0) {
    console.log(colorize('yellow', '⚠️  No test files found'));
    process.exit(0);
  }
  
  console.log(`Found ${testFiles.length} test file(s)`);
  
  const results = [];
  
  for (const testFile of testFiles) {
    try {
      const result = await runTestFile(testFile);
      results.push(result);
    } catch (error) {
      console.error(`Failed to run ${testFile}:`, error.message);
      results.push({
        file: testFile,
        filename: path.basename(testFile),
        success: false,
        error: error.message,
        duration: 0
      });
    }
  }
  
  const summary = generateReport(results);
  
  // Exit with error code if any tests failed
  if (!summary.allPassed) {
    console.log(colorize('red', '\n💥 Some tests failed'));
    process.exit(1);
  } else {
    console.log(colorize('green', '\n🎉 All tests passed!'));
    process.exit(0);
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log(colorize('yellow', '\n⚠️  Test run interrupted'));
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log(colorize('yellow', '\n⚠️  Test run terminated'));
  process.exit(143);
});

main().catch((error) => {
  console.error(colorize('red', '💥 Test runner failed:'), error.message);
  process.exit(1);
});
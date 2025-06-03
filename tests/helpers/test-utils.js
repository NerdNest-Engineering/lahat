/**
 * Test utilities for integration testing
 * Provides common helpers for managing test environments
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { strict as assert } from 'assert';

// Polyfill browser globals for Node.js test environment
if (typeof global !== 'undefined' && typeof global.CustomEvent === 'undefined') {
  // Simple CustomEvent polyfill for Node.js
  global.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type, options);
      this.detail = options.detail;
    }
  };

  // Simple Event polyfill for Node.js
  if (typeof global.Event === 'undefined') {
    global.Event = class Event {
      constructor(type, options = {}) {
        this.type = type;
        this.bubbles = options.bubbles || false;
        this.cancelable = options.cancelable || false;
      }
    };
  }

  // Simple EventTarget polyfill for Node.js
  if (typeof global.EventTarget === 'undefined') {
    global.EventTarget = class EventTarget {
      constructor() {
        this._listeners = {};
      }

      addEventListener(type, listener) {
        if (!this._listeners[type]) {
          this._listeners[type] = [];
        }
        this._listeners[type].push(listener);
      }

      removeEventListener(type, listener) {
        if (this._listeners[type]) {
          const index = this._listeners[type].indexOf(listener);
          if (index !== -1) {
            this._listeners[type].splice(index, 1);
          }
        }
      }

      dispatchEvent(event) {
        if (this._listeners[event.type]) {
          this._listeners[event.type].forEach(listener => {
            if (typeof listener === 'function') {
              listener(event);
            } else if (listener && typeof listener.handleEvent === 'function') {
              listener.handleEvent(event);
            }
          });
        }
        return true;
      }
    };
  }
}

/**
 * Create a temporary test directory
 * @param {string} prefix - Directory prefix
 * @returns {Promise<string>} Path to temporary directory
 */
export async function createTempDir(prefix = 'lahat-test') {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `${prefix}-`));
  return tempDir;
}

/**
 * Clean up a temporary directory
 * @param {string} dirPath - Directory to clean up
 * @returns {Promise<void>}
 */
export async function cleanupTempDir(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to cleanup temp dir ${dirPath}:`, error);
  }
}

/**
 * Wait for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for a condition to be true
 * @param {Function} condition - Function that returns boolean
 * @param {number} timeout - Timeout in milliseconds
 * @param {number} interval - Check interval in milliseconds
 * @returns {Promise<void>}
 */
export async function waitFor(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await wait(interval);
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Assert that a file exists
 * @param {string} filePath - Path to file
 * @param {string} message - Error message
 * @returns {Promise<void>}
 */
export async function assertFileExists(filePath, message) {
  try {
    await fs.access(filePath);
  } catch (error) {
    assert.fail(message || `File does not exist: ${filePath}`);
  }
}

/**
 * Assert that a directory contains specific files
 * @param {string} dirPath - Directory path
 * @param {Array<string>} expectedFiles - Expected file names
 * @returns {Promise<void>}
 */
export async function assertDirectoryContains(dirPath, expectedFiles) {
  const files = await fs.readdir(dirPath);
  
  for (const expectedFile of expectedFiles) {
    assert(
      files.includes(expectedFile),
      `Directory ${dirPath} does not contain ${expectedFile}. Found: ${files.join(', ')}`
    );
  }
}

/**
 * Assert that a file contains specific content
 * @param {string} filePath - File path
 * @param {string|RegExp} expectedContent - Expected content (string or regex)
 * @returns {Promise<void>}
 */
export async function assertFileContains(filePath, expectedContent) {
  const content = await fs.readFile(filePath, 'utf8');
  
  if (typeof expectedContent === 'string') {
    assert(
      content.includes(expectedContent),
      `File ${filePath} does not contain expected string: ${expectedContent}`
    );
  } else if (expectedContent instanceof RegExp) {
    assert(
      expectedContent.test(content),
      `File ${filePath} does not match expected pattern: ${expectedContent}`
    );
  }
}

/**
 * Create a mock file structure
 * @param {string} baseDir - Base directory
 * @param {Object} structure - File structure object
 * @returns {Promise<void>}
 */
export async function createMockFileStructure(baseDir, structure) {
  for (const [filePath, content] of Object.entries(structure)) {
    const fullPath = path.join(baseDir, filePath);
    const dirPath = path.dirname(fullPath);
    
    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });
    
    // Write file content
    if (typeof content === 'string') {
      await fs.writeFile(fullPath, content);
    } else if (content === null) {
      // Create directory
      await fs.mkdir(fullPath, { recursive: true });
    }
  }
}

/**
 * Count files matching a pattern in a directory
 * @param {string} dirPath - Directory path
 * @param {RegExp} pattern - File name pattern
 * @returns {Promise<number>} Number of matching files
 */
export async function countFiles(dirPath, pattern) {
  try {
    const files = await fs.readdir(dirPath, { recursive: true });
    return files.filter(file => pattern.test(file)).length;
  } catch (error) {
    return 0;
  }
}

/**
 * Test event emitter helper
 */
export class TestEventCollector {
  constructor() {
    this.events = [];
    this.eventMap = new Map();
  }

  /**
   * Add an event listener that collects events
   * @param {EventEmitter} emitter - Event emitter
   * @param {string} eventName - Event name
   */
  collect(emitter, eventName) {
    const handler = (data) => {
      const event = { name: eventName, data, timestamp: Date.now() };
      this.events.push(event);
      
      if (!this.eventMap.has(eventName)) {
        this.eventMap.set(eventName, []);
      }
      this.eventMap.get(eventName).push(event);
    };
    
    emitter.on(eventName, handler);
    return handler;
  }

  /**
   * Get all collected events
   * @returns {Array<Object>} Events
   */
  getAllEvents() {
    return [...this.events];
  }

  /**
   * Get events by name
   * @param {string} eventName - Event name
   * @returns {Array<Object>} Events
   */
  getEvents(eventName) {
    return this.eventMap.get(eventName) || [];
  }

  /**
   * Assert that an event was emitted
   * @param {string} eventName - Event name
   * @param {number} expectedCount - Expected count (optional)
   */
  assertEventEmitted(eventName, expectedCount) {
    const events = this.getEvents(eventName);
    
    if (expectedCount !== undefined) {
      assert.equal(
        events.length,
        expectedCount,
        `Expected ${expectedCount} ${eventName} events, got ${events.length}`
      );
    } else {
      assert(
        events.length > 0,
        `Expected ${eventName} event to be emitted, but it wasn't`
      );
    }
  }

  /**
   * Clear all collected events
   */
  clear() {
    this.events = [];
    this.eventMap.clear();
  }
}

/**
 * Create a mock Electron API for testing
 * @param {Object} overrides - Method overrides
 * @returns {Object} Mock Electron API
 */
export function createMockElectronAPI(overrides = {}) {
  return {
    loadCredentials: async () => ({ success: true, credentials: [] }),
    generateTitleAndDescription: async () => ({ success: true, title: 'Test App', description: 'Test Description' }),
    createAppFolder: async () => ({ success: true, folderPath: '/test/path', conversationId: 'test-123' }),
    generateApp: async () => ({ success: true, appId: 'test-app', files: [] }),
    checkOpenAIApiKey: async () => ({ hasOpenAIKey: false }),
    onTitleDescriptionChunk: (handler) => {},
    onGenerationStatus: (handler) => {},
    removeAllListeners: (event) => {},
    openWindow: async (window) => {},
    closeWindow: () => {},
    notifyAppCreated: (data) => {},
    ...overrides
  };
}

/**
 * Simulate user interaction in tests
 * @param {HTMLElement} element - Target element
 * @param {string} action - Action type ('click', 'input', etc.)
 * @param {*} value - Action value
 */
export function simulateUserInteraction(element, action, value) {
  switch (action) {
    case 'click':
      element.click();
      break;
    case 'input':
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      break;
    case 'change':
      element.value = value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

/**
 * Integration test wrapper that provides cleanup
 * @param {string} testName - Test name
 * @param {Function} testFn - Test function
 * @returns {Function} Wrapped test function
 */
export function integrationTest(testName, testFn) {
  return async (t) => {
    const tempDirs = [];
    const cleanup = [];
    
    // Create simple functions that don't capture complex closures
    const createTestDir = async (prefix) => {
      const dir = await createTempDir(prefix);
      tempDirs.push(dir);
      return dir;
    };
    
    const addCleanup = (fn) => cleanup.push(fn);
    
    // Create a simple helper object without complex references
    const helpers = {
      createTestDir: createTestDir,
      addCleanup: addCleanup
    };
    
    try {
      // Run the test with helpers
      await testFn(t, helpers);
    } finally {
      // Cleanup temp directories
      for (const dir of tempDirs) {
        await cleanupTempDir(dir);
      }
      
      // Run custom cleanup functions
      for (const cleanupFn of cleanup) {
        try {
          await cleanupFn();
        } catch (error) {
          console.warn('Cleanup function failed:', error);
        }
      }
    }
  };
}
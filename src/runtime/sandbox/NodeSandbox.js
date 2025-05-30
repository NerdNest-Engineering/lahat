/**
 * Node.js Sandbox - Secure execution environment for mini apps
 * Provides isolated execution with controlled access to system resources
 */

import { Worker } from 'worker_threads';
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs/promises';

export class NodeSandbox {
  constructor(options = {}) {
    this.options = {
      sandboxed: true,
      timeout: 30000, // 30 second default timeout
      maxMemory: 128 * 1024 * 1024, // 128MB default memory limit
      ...options
    };
    
    this.contexts = new Map();
    this.workers = new Map();
  }

  /**
   * Create a new execution context for an app
   * @param {Object} config - Context configuration
   * @returns {Promise<Object>} Context object
   */
  async createContext(config) {
    const contextId = this._generateContextId();
    
    const context = {
      id: contextId,
      appId: config.appId,
      permissions: config.permissions || [],
      apis: config.apis || {},
      createdAt: Date.now(),
      worker: null
    };
    
    // Create worker thread for sandboxed execution
    if (this.options.sandboxed) {
      context.worker = await this._createWorker(context);
      this.workers.set(contextId, context.worker);
    }
    
    this.contexts.set(contextId, context);
    
    return context;
  }

  /**
   * Execute code in a context
   * @param {Object} context - Execution context
   * @param {string} appPath - Path to the app's main file
   * @returns {Promise<any>} Execution result
   */
  async executeInContext(context, appPath) {
    try {
      if (this.options.sandboxed && context.worker) {
        return await this._executeInWorker(context, appPath);
      } else {
        return await this._executeInMainThread(context, appPath);
      }
    } catch (error) {
      throw new Error(`Execution failed: ${error.message}`);
    }
  }

  /**
   * Execute app in worker thread (sandboxed)
   * @param {Object} context - Execution context
   * @param {string} appPath - Path to the app's main file
   * @returns {Promise<any>} Execution result
   */
  async _executeInWorker(context, appPath) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Execution timeout'));
      }, this.options.timeout);

      context.worker.postMessage({
        type: 'execute',
        appPath,
        permissions: context.permissions,
        apis: this._serializeAPIs(context.apis)
      });

      context.worker.once('message', (result) => {
        clearTimeout(timeout);
        if (result.success) {
          resolve(result.data);
        } else {
          reject(new Error(result.error));
        }
      });

      context.worker.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Execute app in main thread (development mode)
   * @param {Object} context - Execution context
   * @param {string} appPath - Path to the app's main file
   * @returns {Promise<any>} Execution result
   */
  async _executeInMainThread(context, appPath) {
    // Create require function for the app
    const require = createRequire(appPath);
    
    // Provide APIs to the app
    global.lahat = context.apis.lahat;
    global.storage = context.apis.storage;
    
    try {
      // Dynamic import of the app module
      const appModule = await import(appPath);
      
      // Execute main function if available
      if (typeof appModule.main === 'function') {
        return await appModule.main();
      } else if (typeof appModule.default === 'function') {
        return await appModule.default();
      }
      
      return appModule;
    } finally {
      // Cleanup global APIs
      delete global.lahat;
      delete global.storage;
    }
  }

  /**
   * Create a worker thread for sandboxed execution
   * @param {Object} context - Context configuration
   * @returns {Promise<Worker>} Worker instance
   */
  async _createWorker(context) {
    const workerScript = this._generateWorkerScript();
    const worker = new Worker(workerScript, {
      eval: true,
      workerData: {
        appId: context.appId,
        permissions: context.permissions
      }
    });

    // Set memory limits
    if (this.options.maxMemory) {
      worker.resourceLimits = {
        maxOldGenerationSizeMb: Math.floor(this.options.maxMemory / (1024 * 1024))
      };
    }

    return worker;
  }

  /**
   * Generate worker script for sandboxed execution
   * @returns {string} Worker script code
   */
  _generateWorkerScript() {
    return `
      const { parentPort, workerData } = require('worker_threads');
      const { createRequire } = require('module');
      
      parentPort.on('message', async (message) => {
        try {
          if (message.type === 'execute') {
            const require = createRequire(message.appPath);
            
            // Set up APIs in worker context
            global.lahat = message.apis.lahat;
            global.storage = message.apis.storage;
            
            // Import and execute the app
            const appModule = await import(message.appPath);
            
            let result;
            if (typeof appModule.main === 'function') {
              result = await appModule.main();
            } else if (typeof appModule.default === 'function') {
              result = await appModule.default();
            } else {
              result = appModule;
            }
            
            parentPort.postMessage({ success: true, data: result });
          }
        } catch (error) {
          parentPort.postMessage({ 
            success: false, 
            error: error.message,
            stack: error.stack 
          });
        }
      });
    `;
  }

  /**
   * Serialize APIs for worker thread communication
   * @param {Object} apis - API objects to serialize
   * @returns {Object} Serialized APIs
   */
  _serializeAPIs(apis) {
    // For now, return empty object - APIs will need special handling
    // for worker thread communication (potentially using message passing)
    return {};
  }

  /**
   * Destroy a context and cleanup resources
   * @param {Object} context - Context to destroy
   */
  async destroyContext(context) {
    if (context.worker) {
      await context.worker.terminate();
      this.workers.delete(context.id);
    }
    
    this.contexts.delete(context.id);
  }

  /**
   * Cleanup all contexts and resources
   */
  async cleanup() {
    const contexts = Array.from(this.contexts.values());
    
    for (const context of contexts) {
      await this.destroyContext(context);
    }
  }

  /**
   * Generate unique context ID
   * @returns {string} Unique context ID
   */
  _generateContextId() {
    return `context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
/**
 * Lahat Runtime - Node.js execution environment for mini apps
 * Provides secure, isolated execution with access to Lahat APIs
 */

import { EventEmitter } from 'events';
import { NodeSandbox } from './sandbox/NodeSandbox.js';
import { PermissionManager } from './sandbox/PermissionManager.js';
import { LahatAPI } from './api/LahatAPI.js';
import { StorageAPI } from './api/StorageAPI.js';

export class LahatRuntime extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      mode: 'production', // 'development' | 'production' | 'test'
      sandboxed: true,
      mockMCP: false,
      ...options
    };
    
    this.sandbox = new NodeSandbox(this.options);
    this.permissions = new PermissionManager();
    this.runningApps = new Map();
    this.apis = this._initializeAPIs();
  }

  /**
   * Initialize available APIs for mini apps
   */
  _initializeAPIs() {
    return {
      lahat: new LahatAPI(this),
      storage: new StorageAPI('platform') // Use 'platform' as default appId
    };
  }

  /**
   * Execute a mini app in the runtime
   * @param {Object} appConfig - App configuration and metadata
   * @param {string} appPath - Path to the app's main file
   * @returns {Promise<Object>} Execution result
   */
  async executeApp(appConfig, appPath) {
    try {
      // Validate app configuration
      this._validateAppConfig(appConfig);
      
      // Check permissions
      await this.permissions.validateAppPermissions(appConfig);
      
      // Create execution context
      const context = await this.sandbox.createContext({
        appId: appConfig.id,
        permissions: appConfig.permissions || [],
        apis: this.apis
      });
      
      // Load and execute the app
      const result = await this.sandbox.executeInContext(context, appPath);
      
      // Track running app
      this.runningApps.set(appConfig.id, {
        config: appConfig,
        context,
        startTime: Date.now()
      });
      
      this.emit('app:started', { appId: appConfig.id, config: appConfig });
      
      return result;
      
    } catch (error) {
      this.emit('app:error', { appId: appConfig.id, error });
      throw error;
    }
  }

  /**
   * Stop a running app
   * @param {string} appId - ID of the app to stop
   */
  async stopApp(appId) {
    const app = this.runningApps.get(appId);
    if (!app) {
      throw new Error(`App ${appId} is not running`);
    }

    try {
      await this.sandbox.destroyContext(app.context);
      this.runningApps.delete(appId);
      this.emit('app:stopped', { appId });
    } catch (error) {
      this.emit('app:error', { appId, error });
      throw error;
    }
  }

  /**
   * Get information about running apps
   * @returns {Array<Object>} Running app information
   */
  getRunningApps() {
    return Array.from(this.runningApps.entries()).map(([appId, app]) => ({
      appId,
      name: app.config.name,
      startTime: app.startTime,
      uptime: Date.now() - app.startTime
    }));
  }

  /**
   * Validate app configuration
   * @param {Object} appConfig - App configuration to validate
   */
  _validateAppConfig(appConfig) {
    if (!appConfig.id) {
      throw new Error('App configuration must include an ID');
    }
    
    if (!appConfig.name) {
      throw new Error('App configuration must include a name');
    }
    
    if (!appConfig.entrypoint) {
      throw new Error('App configuration must specify an entrypoint');
    }
  }

  /**
   * Shutdown the runtime
   */
  async shutdown() {
    const runningAppIds = Array.from(this.runningApps.keys());
    
    // Stop all running apps
    for (const appId of runningAppIds) {
      try {
        await this.stopApp(appId);
      } catch (error) {
        console.error(`Error stopping app ${appId}:`, error);
      }
    }
    
    // Cleanup sandbox
    await this.sandbox.cleanup();
    
    this.emit('runtime:shutdown');
  }
}
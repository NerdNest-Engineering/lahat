/**
 * Lahat API - Core platform APIs available to mini apps
 * Provides access to platform features and services
 */

import { StorageAPI } from './StorageAPI.js';

export class LahatAPI {
  constructor(options = {}) {
    this.options = {
      name: 'Unnamed App',
      version: '1.0.0',
      permissions: ['lahat:storage'],
      mcpRequirements: [],
      ...options
    };
    
    this.appId = this._generateAppId();
    this.runtime = null; // Set by runtime when app is executed
    
    // Initialize storage with app-specific namespace
    this.storage = new StorageAPI(this.appId);
  }
  
  /**
   * Set runtime context (called by Lahat runtime)
   * @param {Object} runtime - Runtime instance
   */
  _setRuntime(runtime) {
    this.runtime = runtime;
  }

  /**
   * Get platform information
   * @returns {Object} Platform information
   */
  getPlatformInfo() {
    return {
      name: 'Lahat',
      version: '3.0.0',
      mode: this.runtime?.options?.mode || 'development',
      apis: ['storage', 'mcp', 'events', 'system'],
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };
  }

  /**
   * Emit an event to the platform
   * @param {string} eventName - Name of the event
   * @param {any} data - Event data
   */
  emit(eventName, data) {
    if (this.runtime) {
      this.runtime.emit(`app:${eventName}`, data);
    } else {
      console.log(`[${this.appId}] Event: ${eventName}`, data);
    }
  }

  /**
   * Listen for platform events
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} callback - Event callback
   */
  on(eventName, callback) {
    this.runtime.on(`platform:${eventName}`, callback);
  }

  /**
   * Remove event listener
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Event callback to remove
   */
  off(eventName, callback) {
    this.runtime.off(`platform:${eventName}`, callback);
  }

  /**
   * Get current app information
   * @returns {Object} Current app information
   */
  getCurrentApp() {
    return {
      id: this.appId,
      name: this.options.name,
      version: this.options.version,
      permissions: this.options.permissions,
      mcpRequirements: this.options.mcpRequirements
    };
  }

  /**
   * Get MCP interface for this app
   * @returns {Object} MCP interface
   */
  get mcp() {
    return {
      /**
       * Discover available MCP servers
       * @returns {Promise<Array>} Available MCP servers
       */
      discoverServers: async () => {
        // Mock implementation - will be connected to MCP registry
        return [
          { name: 'filesystem', capabilities: ['read_file', 'write_file', 'list_directory'] },
          { name: 'weather', capabilities: ['get_current_weather', 'get_forecast'] },
          { name: 'database', capabilities: ['query', 'list_tables', 'execute'] }
        ];
      },

      /**
       * Connect to an MCP server
       * @param {string} serverName - Name of the MCP server
       * @returns {Promise<boolean>} Connection success
       */
      connect: async (serverName) => {
        console.log(`[${this.appId}] Connecting to MCP server: ${serverName}`);
        // Mock implementation
        return true;
      },

      /**
       * Disconnect from an MCP server
       * @param {string} serverName - Name of the MCP server
       * @returns {Promise<boolean>} Disconnection success
       */
      disconnect: async (serverName) => {
        console.log(`[${this.appId}] Disconnecting from MCP server: ${serverName}`);
        return true;
      },

      /**
       * Call an MCP server capability
       * @param {string} serverName - Name of the MCP server
       * @param {string} method - Method to call
       * @param {Object} params - Parameters for the method
       * @returns {Promise<any>} Result from MCP server
       */
      call: async (serverName, method, params = {}) => {
        console.log(`[${this.appId}] MCP call: ${serverName}.${method}`, params);
        
        // Mock responses for demo
        if (serverName === 'filesystem' && method === 'list_directory') {
          return ['file1.txt', 'file2.js', 'folder1/'];
        }
        if (serverName === 'weather' && method === 'get_current_weather') {
          return { temperature: 72, condition: 'sunny', humidity: 45 };
        }
        
        throw new Error(`MCP server ${serverName} not available or method ${method} not found`);
      },

      /**
       * Find capabilities matching a pattern
       * @param {string} pattern - Pattern to match
       * @returns {Promise<Array>} Matching capabilities
       */
      findCapabilities: async (pattern) => {
        // Mock implementation
        const servers = await this.mcp.discoverServers();
        const matches = [];
        
        for (const server of servers) {
          for (const capability of server.capabilities) {
            if (capability.includes(pattern)) {
              matches.push({
                serverName: server.name,
                name: capability,
                description: `${capability} capability from ${server.name}`
              });
            }
          }
        }
        
        return matches;
      },

      /**
       * Listen for MCP events
       * @param {string} event - Event name
       * @param {Function} callback - Event handler
       */
      on: (event, callback) => {
        // Events: server_connected, server_disconnected, capability_available
        console.log(`[${this.appId}] Listening for MCP event: ${event}`);
      }
    };
  }

  /**
   * Get system interface for this app
   * @returns {Object} System interface
   */
  get system() {
    return {
      /**
       * Open URL in default browser
       * @param {string} url - URL to open
       * @returns {Promise<void>}
       */
      openURL: async (url) => {
        console.log(`[${this.appId}] Opening URL: ${url}`);
        // In real implementation, this would use Electron's shell.openExternal
      },

      /**
       * Show notification
       * @param {string} title - Notification title
       * @param {string} body - Notification body
       * @param {Object} options - Notification options
       * @returns {Promise<void>}
       */
      notify: async (title, body, options = {}) => {
        console.log(`[${this.appId}] Notification: ${title} - ${body}`, options);
      },

      /**
       * Get environment information
       * @returns {Object} Environment info
       */
      getEnvironment: () => ({
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        cwd: process.cwd(),
        env: process.env.NODE_ENV || 'development'
      }),

      /**
       * Exit the app
       * @param {number} code - Exit code
       */
      exit: (code = 0) => {
        console.log(`[${this.appId}] Exiting with code: ${code}`);
        process.exit(code);
      }
    };
  }

  /**
   * Access to other Lahat apps
   * @returns {Object} App interface
   */
  getApps() {
    return {
      /**
       * List installed apps
       * @returns {Promise<Array>} List of installed apps
       */
      list: async () => {
        // This will be implemented when distribution island is built
        return [];
      },

      /**
       * Launch another app
       * @param {string} appId - ID of the app to launch
       * @param {Object} params - Parameters to pass to the app
       * @returns {Promise<any>} Result from launched app
       */
      launch: async (appId, params) => {
        // This will be implemented when distribution island is built
        console.log(`App launch requested: ${appId}`, params);
        throw new Error('App launching not yet implemented');
      },

      /**
       * Send message to another running app
       * @param {string} appId - ID of the target app
       * @param {any} message - Message to send
       * @returns {Promise<any>} Response from target app
       */
      sendMessage: async (appId, message) => {
        // This will be implemented when distribution island is built
        console.log(`Message send requested to ${appId}:`, message);
        throw new Error('Inter-app messaging not yet implemented');
      }
    };
  }

  /**
   * Get logs for debugging
   * @returns {Object} Logging interface
   */
  getLogger() {
    return {
      debug: (message, ...args) => console.debug(`[${this.appId}]`, message, ...args),
      info: (message, ...args) => console.info(`[${this.appId}]`, message, ...args),
      warn: (message, ...args) => console.warn(`[${this.appId}]`, message, ...args),
      error: (message, ...args) => console.error(`[${this.appId}]`, message, ...args)
    };
  }

  /**
   * Get utilities for app development
   * @returns {Object} Utility functions
   */
  getUtils() {
    return {
      /**
       * Generate unique ID
       * @returns {string} Unique identifier
       */
      generateId: () => {
        return `id_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      },

      /**
       * Sleep for specified duration
       * @param {number} ms - Milliseconds to sleep
       * @returns {Promise<void>} Promise that resolves after delay
       */
      sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
      },

      /**
       * Debounce function calls
       * @param {Function} func - Function to debounce
       * @param {number} delay - Delay in milliseconds
       * @returns {Function} Debounced function
       */
      debounce: (func, delay) => {
        let timeoutId;
        return (...args) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
      }
    };
  }

  // Private helper methods
  
  /**
   * Generate unique app ID
   * @returns {string} Unique app ID
   */
  _generateAppId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const name = this.options.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${name}-${timestamp}-${random}`;
  }
}
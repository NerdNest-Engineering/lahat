/**
 * Lahat API - Core platform APIs available to mini apps
 * Provides access to platform features and services
 */

export class LahatAPI {
  constructor(runtime) {
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
      mode: this.runtime.options.mode,
      apis: ['storage', 'mcp', 'events']
    };
  }

  /**
   * Emit an event to the platform
   * @param {string} eventName - Name of the event
   * @param {any} data - Event data
   */
  emit(eventName, data) {
    this.runtime.emit(`app:${eventName}`, data);
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
    // This would be set in the execution context
    return {
      id: this._getCurrentAppId(),
      name: this._getCurrentAppName(),
      version: this._getCurrentAppVersion()
    };
  }

  /**
   * Access MCP (Model Context Protocol) servers
   * @returns {Object} MCP interface
   */
  getMCP() {
    return {
      /**
       * List available MCP servers
       * @returns {Promise<Array>} Available MCP servers
       */
      listServers: async () => {
        // This will be implemented when MCP island is built
        return [];
      },

      /**
       * Call an MCP server capability
       * @param {string} serverName - Name of the MCP server
       * @param {string} capability - Capability to call
       * @param {Object} params - Parameters for the capability
       * @returns {Promise<any>} Result from MCP server
       */
      call: async (serverName, capability, params) => {
        // This will be implemented when MCP island is built
        console.log(`MCP call requested: ${serverName}.${capability}`, params);
        throw new Error('MCP integration not yet implemented');
      },

      /**
       * Check if MCP server is available
       * @param {string} serverName - Name of the MCP server
       * @returns {Promise<boolean>} Whether server is available
       */
      isAvailable: async (serverName) => {
        // This will be implemented when MCP island is built
        console.log(`MCP availability check: ${serverName}`);
        return false;
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
      debug: (message, ...args) => console.debug(`[${this._getCurrentAppId()}]`, message, ...args),
      info: (message, ...args) => console.info(`[${this._getCurrentAppId()}]`, message, ...args),
      warn: (message, ...args) => console.warn(`[${this._getCurrentAppId()}]`, message, ...args),
      error: (message, ...args) => console.error(`[${this._getCurrentAppId()}]`, message, ...args)
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
  _getCurrentAppId() {
    // This would be set from the execution context
    return 'unknown';
  }

  _getCurrentAppName() {
    // This would be set from the execution context
    return 'Unknown App';
  }

  _getCurrentAppVersion() {
    // This would be set from the execution context
    return '1.0.0';
  }
}
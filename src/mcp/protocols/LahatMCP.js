/**
 * Lahat MCP - Lahat-specific MCP extensions
 * Extends standard MCP with Lahat platform-specific capabilities
 */

import { StandardMCP } from './StandardMCP.js';

export class LahatMCP extends StandardMCP {
  constructor(options = {}) {
    super({
      version: '1.0.0-lahat',
      capabilities: {
        ...options.capabilities,
        logging: true,
        sampling: true,
        tools: true,
        resources: true,
        prompts: true,
        // Lahat-specific capabilities
        lahat_apps: true,
        lahat_storage: true,
        lahat_security: true,
        lahat_runtime: true
      },
      ...options
    });
  }

  /**
   * Launch a Lahat app
   * @param {string} appId - App ID to launch
   * @param {Object} params - Launch parameters
   * @returns {Promise<Object>} Launch result
   */
  async launchApp(appId, params = {}) {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/app/launch',
      params: {
        appId,
        ...params
      }
    };

    const response = await this._sendMessage(message);
    return response.result;
  }

  /**
   * Stop a Lahat app
   * @param {string} appId - App ID to stop
   * @returns {Promise<Object>} Stop result
   */
  async stopApp(appId) {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/app/stop',
      params: {
        appId
      }
    };

    const response = await this._sendMessage(message);
    return response.result;
  }

  /**
   * List running Lahat apps
   * @returns {Promise<Array>} Running apps
   */
  async listRunningApps() {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/app/list',
      params: {}
    };

    const response = await this._sendMessage(message);
    return response.result.apps || [];
  }

  /**
   * Send message to a Lahat app
   * @param {string} appId - Target app ID
   * @param {any} message - Message to send
   * @returns {Promise<any>} App response
   */
  async sendAppMessage(appId, message) {
    this._ensureInitialized();
    
    const mcpMessage = {
      jsonrpc: '2.0',
      method: 'lahat/app/message',
      params: {
        appId,
        message
      }
    };

    const response = await this._sendMessage(mcpMessage);
    return response.result;
  }

  /**
   * Get app information
   * @param {string} appId - App ID
   * @returns {Promise<Object>} App information
   */
  async getAppInfo(appId) {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/app/info',
      params: {
        appId
      }
    };

    const response = await this._sendMessage(message);
    return response.result;
  }

  /**
   * Store data in Lahat storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {Object} options - Storage options
   * @returns {Promise<boolean>} Success status
   */
  async storeData(key, value, options = {}) {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/storage/set',
      params: {
        key,
        value,
        ...options
      }
    };

    const response = await this._sendMessage(message);
    return response.result.success;
  }

  /**
   * Retrieve data from Lahat storage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if key not found
   * @returns {Promise<any>} Stored value
   */
  async retrieveData(key, defaultValue = null) {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/storage/get',
      params: {
        key,
        defaultValue
      }
    };

    const response = await this._sendMessage(message);
    return response.result.value;
  }

  /**
   * Delete data from Lahat storage
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} Whether key was deleted
   */
  async deleteData(key) {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/storage/delete',
      params: {
        key
      }
    };

    const response = await this._sendMessage(message);
    return response.result.deleted;
  }

  /**
   * List storage keys
   * @param {string} prefix - Key prefix filter
   * @returns {Promise<Array>} Storage keys
   */
  async listStorageKeys(prefix = '') {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/storage/keys',
      params: {
        prefix
      }
    };

    const response = await this._sendMessage(message);
    return response.result.keys || [];
  }

  /**
   * Get credential from Lahat security system
   * @param {string} name - Credential name
   * @returns {Promise<string|null>} Credential value
   */
  async getCredential(name) {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/security/credential/get',
      params: {
        name
      }
    };

    const response = await this._sendMessage(message);
    return response.result.value;
  }

  /**
   * Check if credential exists
   * @param {string} name - Credential name
   * @returns {Promise<boolean>} Whether credential exists
   */
  async hasCredential(name) {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/security/credential/has',
      params: {
        name
      }
    };

    const response = await this._sendMessage(message);
    return response.result.exists;
  }

  /**
   * Encrypt data using Lahat security
   * @param {string} data - Data to encrypt
   * @param {string} context - Encryption context
   * @returns {Promise<string>} Encrypted data
   */
  async encryptData(data, context = '') {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/security/encrypt',
      params: {
        data,
        context
      }
    };

    const response = await this._sendMessage(message);
    return response.result.encrypted;
  }

  /**
   * Decrypt data using Lahat security
   * @param {string} encryptedData - Encrypted data
   * @param {string} context - Encryption context
   * @returns {Promise<string>} Decrypted data
   */
  async decryptData(encryptedData, context = '') {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/security/decrypt',
      params: {
        encryptedData,
        context
      }
    };

    const response = await this._sendMessage(message);
    return response.result.decrypted;
  }

  /**
   * Get Lahat runtime information
   * @returns {Promise<Object>} Runtime information
   */
  async getRuntimeInfo() {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/runtime/info',
      params: {}
    };

    const response = await this._sendMessage(message);
    return response.result;
  }

  /**
   * Get Lahat platform metrics
   * @returns {Promise<Object>} Platform metrics
   */
  async getPlatformMetrics() {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/runtime/metrics',
      params: {}
    };

    const response = await this._sendMessage(message);
    return response.result;
  }

  /**
   * Subscribe to app events
   * @param {string} appId - App ID (optional, for all apps if not specified)
   * @returns {Promise<void>}
   */
  async subscribeToAppEvents(appId = null) {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/app/subscribe',
      params: appId ? { appId } : {}
    };

    await this._sendMessage(message);
    this.emit('app:subscribed', { appId });
  }

  /**
   * Unsubscribe from app events
   * @param {string} appId - App ID (optional, for all apps if not specified)
   * @returns {Promise<void>}
   */
  async unsubscribeFromAppEvents(appId = null) {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/app/unsubscribe',
      params: appId ? { appId } : {}
    };

    await this._sendMessage(message);
    this.emit('app:unsubscribed', { appId });
  }

  /**
   * Generate new Lahat app project
   * @param {Object} config - App configuration
   * @returns {Promise<Object>} Generation result
   */
  async generateApp(config) {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/scaffolding/generate',
      params: {
        config
      }
    };

    const response = await this._sendMessage(message);
    return response.result;
  }

  /**
   * Get available app templates
   * @returns {Promise<Array>} Available templates
   */
  async getAppTemplates() {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'lahat/scaffolding/templates',
      params: {}
    };

    const response = await this._sendMessage(message);
    return response.result.templates || [];
  }

  /**
   * Handle Lahat-specific notifications
   * @param {Object} notification - Notification message
   */
  handleNotification(notification) {
    const { method, params } = notification;
    
    // Handle Lahat-specific notifications
    if (method.startsWith('lahat/')) {
      switch (method) {
        case 'lahat/app/started':
          this.emit('app:started', params);
          break;
          
        case 'lahat/app/stopped':
          this.emit('app:stopped', params);
          break;
          
        case 'lahat/app/crashed':
          this.emit('app:crashed', params);
          break;
          
        case 'lahat/app/message':
          this.emit('app:message', params);
          break;
          
        case 'lahat/storage/changed':
          this.emit('storage:changed', params);
          break;
          
        case 'lahat/security/credential/changed':
          this.emit('credential:changed', params);
          break;
          
        case 'lahat/runtime/status':
          this.emit('runtime:status', params);
          break;
          
        default:
          this.emit('lahat:notification', { method, params });
          break;
      }
    } else {
      // Delegate to parent class for standard MCP notifications
      super.handleNotification(notification);
    }
  }

  /**
   * Get Lahat-specific capabilities
   * @returns {Object} Lahat capabilities
   */
  getLahatCapabilities() {
    return {
      apps: this.options.capabilities.lahat_apps,
      storage: this.options.capabilities.lahat_storage,
      security: this.options.capabilities.lahat_security,
      runtime: this.options.capabilities.lahat_runtime
    };
  }

  /**
   * Send Lahat-specific message
   * @param {Object} message - Message to send
   * @returns {Promise<Object>} Response
   */
  async _sendMessage(message) {
    // Handle Lahat-specific methods
    if (message.method && message.method.startsWith('lahat/')) {
      return this._sendLahatMessage(message);
    }
    
    // Delegate to parent class for standard MCP methods
    return super._sendMessage(message);
  }

  /**
   * Send Lahat-specific message
   * @param {Object} message - Lahat message to send
   * @returns {Promise<Object>} Response
   */
  async _sendLahatMessage(message) {
    const method = message.method;
    const params = message.params || {};
    
    // Mock responses for Lahat-specific methods
    switch (method) {
      case 'lahat/app/launch':
        return {
          result: {
            success: true,
            appId: params.appId,
            pid: Math.floor(Math.random() * 10000),
            startTime: new Date().toISOString()
          }
        };
        
      case 'lahat/app/stop':
        return {
          result: {
            success: true,
            appId: params.appId,
            stopTime: new Date().toISOString()
          }
        };
        
      case 'lahat/app/list':
        return {
          result: {
            apps: [
              {
                id: 'example-app',
                name: 'Example App',
                status: 'running',
                startTime: new Date().toISOString(),
                pid: 12345
              }
            ]
          }
        };
        
      case 'lahat/storage/set':
        return {
          result: {
            success: true,
            key: params.key
          }
        };
        
      case 'lahat/storage/get':
        return {
          result: {
            value: params.defaultValue || 'mock value'
          }
        };
        
      case 'lahat/security/credential/get':
        return {
          result: {
            value: 'mock-credential-value'
          }
        };
        
      case 'lahat/runtime/info':
        return {
          result: {
            version: '3.0.0',
            platform: 'lahat',
            nodeVersion: process.version,
            uptime: Date.now(),
            capabilities: this.getLahatCapabilities()
          }
        };
        
      default:
        return {
          result: {
            success: true,
            message: `Mock response for Lahat method: ${method}`
          }
        };
    }
  }
}
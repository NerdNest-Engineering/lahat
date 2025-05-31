/**
 * Standard MCP - Standard MCP protocol implementation
 * Handles the core Model Context Protocol specification
 */

import { EventEmitter } from 'events';

export class StandardMCP extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      version: '1.0.0',
      capabilities: {
        logging: true,
        sampling: true,
        tools: true,
        resources: true,
        prompts: true
      },
      ...options
    };
    
    this.initialized = false;
    this.clientInfo = null;
    this.serverInfo = null;
  }

  /**
   * Initialize MCP session
   * @param {Object} clientInfo - Client information
   * @returns {Promise<Object>} Server information
   */
  async initialize(clientInfo) {
    try {
      this.clientInfo = clientInfo;
      
      // Perform initialization handshake
      const initMessage = {
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: this.options.version,
          capabilities: this.options.capabilities,
          clientInfo: clientInfo
        }
      };

      const response = await this._sendInitializeMessage(initMessage);
      
      this.serverInfo = response.result;
      this.initialized = true;
      
      this.emit('initialized', { clientInfo, serverInfo: this.serverInfo });
      
      return this.serverInfo;
    } catch (error) {
      this.emit('initialization:failed', { error: error.message });
      throw error;
    }
  }

  /**
   * List available tools
   * @returns {Promise<Array>} Available tools
   */
  async listTools() {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'tools/list',
      params: {}
    };

    const response = await this._sendMessage(message);
    return response.result.tools || [];
  }

  /**
   * Call a tool
   * @param {string} name - Tool name
   * @param {Object} arguments - Tool arguments
   * @returns {Promise<any>} Tool result
   */
  async callTool(name, args = {}) {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name,
        arguments: args
      }
    };

    const response = await this._sendMessage(message);
    return response.result;
  }

  /**
   * List available resources
   * @returns {Promise<Array>} Available resources
   */
  async listResources() {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'resources/list',
      params: {}
    };

    const response = await this._sendMessage(message);
    return response.result.resources || [];
  }

  /**
   * Read a resource
   * @param {string} uri - Resource URI
   * @returns {Promise<Object>} Resource content
   */
  async readResource(uri) {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'resources/read',
      params: {
        uri
      }
    };

    const response = await this._sendMessage(message);
    return response.result;
  }

  /**
   * List available prompts
   * @returns {Promise<Array>} Available prompts
   */
  async listPrompts() {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'prompts/list',
      params: {}
    };

    const response = await this._sendMessage(message);
    return response.result.prompts || [];
  }

  /**
   * Get a prompt
   * @param {string} name - Prompt name
   * @param {Object} arguments - Prompt arguments
   * @returns {Promise<Object>} Prompt content
   */
  async getPrompt(name, args = {}) {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'prompts/get',
      params: {
        name,
        arguments: args
      }
    };

    const response = await this._sendMessage(message);
    return response.result;
  }

  /**
   * Send a sampling request
   * @param {Object} request - Sampling request
   * @returns {Promise<Object>} Sampling result
   */
  async createSampling(request) {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'sampling/createMessage',
      params: request
    };

    const response = await this._sendMessage(message);
    return response.result;
  }

  /**
   * Send a log message
   * @param {string} level - Log level (debug, info, notice, warning, error, critical, alert, emergency)
   * @param {string} data - Log data
   * @param {Object} logger - Logger name
   * @returns {Promise<void>}
   */
  async sendLog(level, data, logger = null) {
    if (!this.options.capabilities.logging) {
      return;
    }

    const message = {
      jsonrpc: '2.0',
      method: 'notifications/message',
      params: {
        level,
        data,
        logger
      }
    };

    await this._sendNotification(message);
    this.emit('log:sent', { level, data, logger });
  }

  /**
   * Subscribe to resource changes
   * @param {string} uri - Resource URI
   * @returns {Promise<void>}
   */
  async subscribeToResource(uri) {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'resources/subscribe',
      params: {
        uri
      }
    };

    await this._sendMessage(message);
    this.emit('resource:subscribed', { uri });
  }

  /**
   * Unsubscribe from resource changes
   * @param {string} uri - Resource URI
   * @returns {Promise<void>}
   */
  async unsubscribeFromResource(uri) {
    this._ensureInitialized();
    
    const message = {
      jsonrpc: '2.0',
      method: 'resources/unsubscribe',
      params: {
        uri
      }
    };

    await this._sendMessage(message);
    this.emit('resource:unsubscribed', { uri });
  }

  /**
   * Handle incoming notifications
   * @param {Object} notification - Notification message
   */
  handleNotification(notification) {
    const { method, params } = notification;
    
    switch (method) {
      case 'notifications/cancelled':
        this.emit('request:cancelled', params);
        break;
        
      case 'notifications/progress':
        this.emit('progress', params);
        break;
        
      case 'notifications/resources/updated':
        this.emit('resource:updated', params);
        break;
        
      case 'notifications/resources/list_changed':
        this.emit('resources:changed', params);
        break;
        
      case 'notifications/tools/list_changed':
        this.emit('tools:changed', params);
        break;
        
      case 'notifications/prompts/list_changed':
        this.emit('prompts:changed', params);
        break;
        
      default:
        this.emit('notification', notification);
        break;
    }
  }

  /**
   * Create error response
   * @param {string} id - Request ID
   * @param {number} code - Error code
   * @param {string} message - Error message
   * @param {any} data - Additional error data
   * @returns {Object} Error response
   */
  createErrorResponse(id, code, message, data = null) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    };
  }

  /**
   * Create success response
   * @param {string} id - Request ID
   * @param {any} result - Response result
   * @returns {Object} Success response
   */
  createSuccessResponse(id, result) {
    return {
      jsonrpc: '2.0',
      id,
      result
    };
  }

  /**
   * Validate MCP message
   * @param {Object} message - Message to validate
   * @returns {boolean} Whether message is valid
   */
  validateMessage(message) {
    // Check required fields
    if (!message.jsonrpc || message.jsonrpc !== '2.0') {
      return false;
    }

    // Request must have method
    if (message.id !== undefined && !message.method) {
      return false;
    }

    // Response must have result or error
    if (message.id !== undefined && !message.method) {
      if (message.result === undefined && message.error === undefined) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get supported capabilities
   * @returns {Object} Supported capabilities
   */
  getSupportedCapabilities() {
    return { ...this.options.capabilities };
  }

  /**
   * Get protocol version
   * @returns {string} Protocol version
   */
  getProtocolVersion() {
    return this.options.version;
  }

  /**
   * Check if initialized
   * @returns {boolean} Whether protocol is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Close the MCP session
   * @returns {Promise<void>}
   */
  async close() {
    if (this.initialized) {
      this.initialized = false;
      this.clientInfo = null;
      this.serverInfo = null;
      this.emit('closed');
    }
  }

  /**
   * Ensure protocol is initialized
   */
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('MCP protocol not initialized. Call initialize() first.');
    }
  }

  /**
   * Send initialization message
   * @param {Object} message - Initialization message
   * @returns {Promise<Object>} Response
   */
  async _sendInitializeMessage(message) {
    // This would be implemented by the transport layer
    // For now, return a mock response
    return {
      result: {
        protocolVersion: this.options.version,
        capabilities: this.options.capabilities,
        serverInfo: {
          name: 'Mock MCP Server',
          version: '1.0.0'
        }
      }
    };
  }

  /**
   * Send message to server
   * @param {Object} message - Message to send
   * @returns {Promise<Object>} Response
   */
  async _sendMessage(message) {
    // This would be implemented by the transport layer
    // For now, return a mock response based on method
    const method = message.method;
    
    if (method === 'tools/list') {
      return {
        result: {
          tools: [
            {
              name: 'example_tool',
              description: 'An example tool',
              inputSchema: {
                type: 'object',
                properties: {
                  input: { type: 'string' }
                }
              }
            }
          ]
        }
      };
    }

    if (method === 'resources/list') {
      return {
        result: {
          resources: [
            {
              uri: 'file:///example.txt',
              name: 'Example File',
              description: 'An example resource',
              mimeType: 'text/plain'
            }
          ]
        }
      };
    }

    if (method === 'prompts/list') {
      return {
        result: {
          prompts: [
            {
              name: 'example_prompt',
              description: 'An example prompt',
              arguments: [
                {
                  name: 'topic',
                  description: 'The topic to discuss',
                  required: true
                }
              ]
            }
          ]
        }
      };
    }

    // Default response
    return {
      result: {
        success: true,
        message: `Mock response for ${method}`
      }
    };
  }

  /**
   * Send notification (no response expected)
   * @param {Object} notification - Notification to send
   * @returns {Promise<void>}
   */
  async _sendNotification(notification) {
    // This would be implemented by the transport layer
    // For now, just emit an event
    this.emit('notification:sent', notification);
  }
}
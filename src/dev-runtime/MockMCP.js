/**
 * Mock MCP - Mock MCP servers for testing and development
 * Provides simulated MCP server responses without external dependencies
 */

import { EventEmitter } from 'events';

export class MockMCP extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enabled: true,
      latency: 100, // Simulated network latency
      errorRate: 0, // Percentage of requests that should fail (0-100)
      ...options
    };
    
    this.servers = new Map();
    this._initializeMockServers();
  }

  /**
   * Initialize built-in mock servers
   */
  _initializeMockServers() {
    // AI Text Generation Server
    this.servers.set('ai-text-generation', {
      name: 'Mock AI Text Generation',
      capabilities: ['generate', 'complete', 'chat'],
      version: '1.0.0',
      handler: this._createAITextHandler()
    });

    // Vector Database Server
    this.servers.set('vector-database', {
      name: 'Mock Vector Database',
      capabilities: ['search', 'insert', 'delete', 'update'],
      version: '1.0.0',
      handler: this._createVectorDBHandler()
    });

    // Web Search Server
    this.servers.set('web-search', {
      name: 'Mock Web Search',
      capabilities: ['search', 'images', 'news'],
      version: '1.0.0',
      handler: this._createWebSearchHandler()
    });

    // File System Server
    this.servers.set('filesystem', {
      name: 'Mock File System',
      capabilities: ['read', 'write', 'list', 'exists'],
      version: '1.0.0',
      handler: this._createFileSystemHandler()
    });

    // Database Server
    this.servers.set('database', {
      name: 'Mock Database',
      capabilities: ['query', 'insert', 'update', 'delete'],
      version: '1.0.0',
      handler: this._createDatabaseHandler()
    });
  }

  /**
   * List available mock servers
   * @returns {Promise<Array>} List of available servers
   */
  async listServers() {
    if (!this.options.enabled) return [];

    await this._simulateLatency();

    return Array.from(this.servers.entries()).map(([id, server]) => ({
      id,
      name: server.name,
      capabilities: server.capabilities,
      version: server.version,
      mock: true
    }));
  }

  /**
   * Check if a server is available
   * @param {string} serverId - Server identifier
   * @returns {Promise<boolean>} Whether server is available
   */
  async isServerAvailable(serverId) {
    if (!this.options.enabled) return false;

    await this._simulateLatency();
    return this.servers.has(serverId);
  }

  /**
   * Call a capability on a mock server
   * @param {string} serverId - Server identifier
   * @param {string} capability - Capability to call
   * @param {Object} params - Parameters for the capability
   * @returns {Promise<any>} Response from mock server
   */
  async callCapability(serverId, capability, params = {}) {
    if (!this.options.enabled) {
      throw new Error('Mock MCP is disabled');
    }

    await this._simulateLatency();

    // Simulate random errors if error rate is set
    if (this._shouldSimulateError()) {
      throw new Error(`Mock error for ${serverId}:${capability}`);
    }

    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Mock server not found: ${serverId}`);
    }

    if (!server.capabilities.includes(capability)) {
      throw new Error(`Capability not supported: ${capability}`);
    }

    try {
      const result = await server.handler(capability, params);
      
      this.emit('call', {
        serverId,
        capability,
        params,
        result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      this.emit('error', {
        serverId,
        capability,
        params,
        error: error.message,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }

  /**
   * Add a custom mock server
   * @param {string} serverId - Server identifier
   * @param {Object} serverConfig - Server configuration
   */
  addMockServer(serverId, serverConfig) {
    this.servers.set(serverId, {
      name: serverConfig.name || `Mock ${serverId}`,
      capabilities: serverConfig.capabilities || [],
      version: serverConfig.version || '1.0.0',
      handler: serverConfig.handler || this._createDefaultHandler()
    });
  }

  /**
   * Remove a mock server
   * @param {string} serverId - Server identifier
   */
  removeMockServer(serverId) {
    this.servers.delete(serverId);
  }

  /**
   * Create AI text generation handler
   * @returns {Function} Handler function
   */
  _createAITextHandler() {
    return async (capability, params) => {
      switch (capability) {
        case 'generate':
          return {
            text: `Mock AI response to: "${params.prompt || 'no prompt'}"`,
            model: 'mock-gpt-3.5',
            tokens: Math.floor(Math.random() * 100) + 10,
            confidence: Math.random()
          };
          
        case 'complete':
          return {
            completion: `${params.text || ''} [mock completion]`,
            model: 'mock-completion',
            tokens: Math.floor(Math.random() * 50) + 5
          };
          
        case 'chat':
          return {
            response: `Mock chat response to: "${params.message || 'no message'}"`,
            conversationId: `mock-conv-${Date.now()}`,
            model: 'mock-chat'
          };
          
        default:
          throw new Error(`Unknown AI capability: ${capability}`);
      }
    };
  }

  /**
   * Create vector database handler
   * @returns {Function} Handler function
   */
  _createVectorDBHandler() {
    const mockData = new Map();
    
    return async (capability, params) => {
      switch (capability) {
        case 'search':
          return {
            results: [
              {
                id: 'mock-result-1',
                score: 0.95,
                metadata: { title: 'Mock Result 1' },
                content: 'Mock search result content 1'
              },
              {
                id: 'mock-result-2',
                score: 0.87,
                metadata: { title: 'Mock Result 2' },
                content: 'Mock search result content 2'
              }
            ],
            query: params.query || 'mock query'
          };
          
        case 'insert':
          const id = `mock-${Date.now()}`;
          mockData.set(id, params.data);
          return { id, inserted: true };
          
        case 'delete':
          const deleted = mockData.delete(params.id);
          return { deleted };
          
        case 'update':
          if (mockData.has(params.id)) {
            mockData.set(params.id, { ...mockData.get(params.id), ...params.data });
            return { updated: true };
          }
          return { updated: false };
          
        default:
          throw new Error(`Unknown vector DB capability: ${capability}`);
      }
    };
  }

  /**
   * Create web search handler
   * @returns {Function} Handler function
   */
  _createWebSearchHandler() {
    return async (capability, params) => {
      switch (capability) {
        case 'search':
          return {
            results: [
              {
                title: 'Mock Search Result 1',
                url: 'https://example.com/result1',
                snippet: 'This is a mock search result snippet for testing purposes.',
                rank: 1
              },
              {
                title: 'Mock Search Result 2',
                url: 'https://example.com/result2',
                snippet: 'Another mock search result with different content.',
                rank: 2
              }
            ],
            query: params.query || 'mock search',
            totalResults: 1234567
          };
          
        case 'images':
          return {
            images: [
              {
                url: 'https://example.com/image1.jpg',
                title: 'Mock Image 1',
                width: 800,
                height: 600
              },
              {
                url: 'https://example.com/image2.jpg',
                title: 'Mock Image 2',
                width: 1024,
                height: 768
              }
            ],
            query: params.query || 'mock image search'
          };
          
        default:
          throw new Error(`Unknown web search capability: ${capability}`);
      }
    };
  }

  /**
   * Create file system handler
   * @returns {Function} Handler function
   */
  _createFileSystemHandler() {
    const mockFiles = new Map([
      ['mock-file.txt', 'This is mock file content'],
      ['mock-data.json', '{"mock": true, "data": [1, 2, 3]}']
    ]);
    
    return async (capability, params) => {
      switch (capability) {
        case 'read':
          const content = mockFiles.get(params.path) || null;
          if (!content) {
            throw new Error(`Mock file not found: ${params.path}`);
          }
          return { content, path: params.path };
          
        case 'write':
          mockFiles.set(params.path, params.content);
          return { written: true, path: params.path };
          
        case 'list':
          return {
            files: Array.from(mockFiles.keys()),
            path: params.path || '/'
          };
          
        case 'exists':
          return {
            exists: mockFiles.has(params.path),
            path: params.path
          };
          
        default:
          throw new Error(`Unknown filesystem capability: ${capability}`);
      }
    };
  }

  /**
   * Create database handler
   * @returns {Function} Handler function
   */
  _createDatabaseHandler() {
    const mockDatabase = new Map([
      ['1', { id: 1, name: 'Mock Record 1', value: 100 }],
      ['2', { id: 2, name: 'Mock Record 2', value: 200 }]
    ]);
    
    return async (capability, params) => {
      switch (capability) {
        case 'query':
          const results = Array.from(mockDatabase.values());
          return {
            results: results.slice(0, params.limit || 10),
            total: results.length,
            query: params.query || 'SELECT * FROM mock'
          };
          
        case 'insert':
          const id = String(Date.now());
          const record = { id, ...params.data };
          mockDatabase.set(id, record);
          return { id, record };
          
        case 'update':
          if (mockDatabase.has(params.id)) {
            const existing = mockDatabase.get(params.id);
            const updated = { ...existing, ...params.data };
            mockDatabase.set(params.id, updated);
            return { updated: true, record: updated };
          }
          return { updated: false };
          
        case 'delete':
          const deleted = mockDatabase.delete(params.id);
          return { deleted };
          
        default:
          throw new Error(`Unknown database capability: ${capability}`);
      }
    };
  }

  /**
   * Create default handler for custom servers
   * @returns {Function} Handler function
   */
  _createDefaultHandler() {
    return async (capability, params) => {
      return {
        capability,
        params,
        response: 'Mock response from default handler',
        timestamp: Date.now()
      };
    };
  }

  /**
   * Simulate network latency
   * @returns {Promise<void>}
   */
  async _simulateLatency() {
    if (this.options.latency > 0) {
      const delay = Math.random() * this.options.latency;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Determine if error should be simulated
   * @returns {boolean} Whether to simulate error
   */
  _shouldSimulateError() {
    return Math.random() * 100 < this.options.errorRate;
  }

  /**
   * Enable mock MCP
   */
  enable() {
    this.options.enabled = true;
    this.emit('enabled');
  }

  /**
   * Disable mock MCP
   */
  disable() {
    this.options.enabled = false;
    this.emit('disabled');
  }

  /**
   * Get mock statistics
   * @returns {Object} Mock statistics
   */
  getStats() {
    return {
      enabled: this.options.enabled,
      serverCount: this.servers.size,
      latency: this.options.latency,
      errorRate: this.options.errorRate
    };
  }
}
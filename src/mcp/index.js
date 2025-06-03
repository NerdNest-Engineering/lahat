/**
 * MCP Island - Model Context Protocol integration
 * Exports all MCP-related functionality
 */

import { MCPRegistry } from './MCPRegistry.js';
import { ServerManager } from './ServerManager.js';
import { CapabilityMatcher } from './CapabilityMatcher.js';
import { ServerProxy } from './ServerProxy.js';

export { MCPRegistry } from './MCPRegistry.js';
export { ServerManager } from './ServerManager.js';
export { CapabilityMatcher } from './CapabilityMatcher.js';
export { ServerProxy } from './ServerProxy.js';
export { StandardMCP } from './protocols/StandardMCP.js';
export { LahatMCP } from './protocols/LahatMCP.js';

/**
 * MCP Manager - Coordinated MCP functionality
 */
export class MCPManager {
  constructor(options = {}) {
    this.options = {
      autoStart: true,
      discoveryEnabled: true,
      ...options
    };
    
    // Initialize components
    this.registry = new MCPRegistry();
    this.serverManager = new ServerManager();
    this.capabilityMatcher = new CapabilityMatcher(this.registry);
    this.serverProxy = new ServerProxy();
    
    // Set up dependencies
    this.serverProxy.setDependencies(this.serverManager, this.capabilityMatcher);
    
    this.isStarted = false;
    
    this._setupEventHandlers();
  }

  /**
   * Start the MCP manager
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isStarted) return;
    
    try {
      // Start registry (this will begin server discovery)
      if (this.options.discoveryEnabled) {
        await this.registry.start();
      }
      
      this.isStarted = true;
      
      // Auto-register built-in servers
      await this._registerBuiltInServers();
      
    } catch (error) {
      console.error('Failed to start MCP manager:', error);
      throw error;
    }
  }

  /**
   * Stop the MCP manager
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isStarted) return;
    
    try {
      // Stop all servers
      await this.serverManager.stopAllServers();
      
      // Stop registry
      await this.registry.stop();
      
      this.isStarted = false;
    } catch (error) {
      console.error('Failed to stop MCP manager:', error);
      throw error;
    }
  }

  /**
   * Execute a capability
   * @param {string} capability - Capability name
   * @param {Object} params - Parameters
   * @param {Object} options - Execution options
   * @returns {Promise<any>} Result
   */
  async executeCapability(capability, params = {}, options = {}) {
    if (!this.isStarted) {
      throw new Error('MCP manager not started');
    }
    
    return await this.serverProxy.executeCapability(capability, params, options);
  }

  /**
   * Check if capability is available
   * @param {string} capability - Capability name
   * @returns {Promise<boolean>} Whether capability is available
   */
  async isCapabilityAvailable(capability) {
    if (!this.isStarted) return false;
    
    return await this.capabilityMatcher.isCapabilityAvailable(capability);
  }

  /**
   * Get available capabilities
   * @returns {Array<string>} Available capabilities
   */
  getAvailableCapabilities() {
    return this.registry.getAvailableCapabilities();
  }

  /**
   * Register an external MCP server
   * @param {Object} serverConfig - Server configuration
   * @returns {Promise<string>} Server ID
   */
  async registerServer(serverConfig) {
    const serverId = await this.registry.registerServer(serverConfig);
    
    // Try to start the server if it's external
    if (serverConfig.type === 'external' && serverConfig.command) {
      try {
        await this.serverManager.startServer(serverId, serverConfig);
      } catch (error) {
        console.warn(`Failed to start registered server ${serverId}:`, error);
      }
    }
    
    return serverId;
  }

  /**
   * Unregister an MCP server
   * @param {string} serverId - Server ID
   * @returns {Promise<boolean>} Success status
   */
  async unregisterServer(serverId) {
    // Stop the server if running
    if (this.serverManager.isServerRunning(serverId)) {
      await this.serverManager.stopServer(serverId);
    }
    
    return await this.registry.unregisterServer(serverId);
  }

  /**
   * Get all servers
   * @param {Object} filter - Filter options
   * @returns {Array<Object>} Servers
   */
  getServers(filter = {}) {
    return this.registry.getServers(filter);
  }

  /**
   * Get servers for capability
   * @param {string} capability - Capability name
   * @returns {Array<Object>} Servers
   */
  getServersForCapability(capability) {
    return this.registry.getServersByCapability(capability);
  }

  /**
   * Get MCP manager statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      isStarted: this.isStarted,
      registry: this.registry.getStats(),
      proxy: this.serverProxy.getStats(),
      serverManager: {
        runningServers: this.serverManager.getAllServerStates({ status: 'running' }).length,
        totalServers: this.serverManager.getAllServerStates().length
      }
    };
  }

  /**
   * Register built-in servers
   * @returns {Promise<void>}
   */
  async _registerBuiltInServers() {
    const builtInServers = [
      {
        name: 'lahat-filesystem',
        type: 'builtin',
        capabilities: ['file-read', 'file-write', 'file-list', 'file-exists'],
        metadata: { 
          description: 'Lahat file system access',
          version: '1.0.0'
        }
      },
      {
        name: 'lahat-storage',
        type: 'builtin',
        capabilities: ['storage-get', 'storage-set', 'storage-delete', 'storage-list'],
        metadata: { 
          description: 'Lahat persistent storage',
          version: '1.0.0'
        }
      },
      {
        name: 'lahat-apps',
        type: 'builtin',
        capabilities: ['app-launch', 'app-stop', 'app-list', 'app-message'],
        metadata: { 
          description: 'Lahat app management',
          version: '1.0.0'
        }
      },
      {
        name: 'lahat-security',
        type: 'builtin',
        capabilities: ['credential-get', 'credential-has', 'encrypt', 'decrypt'],
        metadata: { 
          description: 'Lahat security services',
          version: '1.0.0'
        }
      }
    ];

    for (const serverConfig of builtInServers) {
      try {
        await this.registry.registerServer(serverConfig);
      } catch (error) {
        console.warn(`Failed to register built-in server ${serverConfig.name}:`, error);
      }
    }
  }

  /**
   * Set up event handlers
   */
  _setupEventHandlers() {
    // Registry events
    this.registry.on('server:registered', (data) => {
      console.log(`MCP server registered: ${data.serverId}`);
    });
    
    this.registry.on('server:discovered', (data) => {
      console.log(`MCP server discovered: ${data.serverId}`);
    });
    
    this.registry.on('server:connected', (data) => {
      console.log(`MCP server connected: ${data.serverId}`);
    });
    
    this.registry.on('server:disconnected', (data) => {
      console.log(`MCP server disconnected: ${data.serverId}`);
    });

    // Server manager events
    this.serverManager.on('server:started', (data) => {
      console.log(`MCP server started: ${data.serverId}`);
    });
    
    this.serverManager.on('server:stopped', (data) => {
      console.log(`MCP server stopped: ${data.serverId}`);
    });
    
    this.serverManager.on('server:restart:failed', (data) => {
      console.warn(`MCP server restart failed: ${data.serverId}`, data.error);
    });

    // Capability matcher events
    this.capabilityMatcher.on('capability:matched', (data) => {
      console.log(`Capability matched: ${data.capability} -> ${data.topServer?.id}`);
    });

    // Server proxy events
    this.serverProxy.on('request:failed', (data) => {
      console.warn(`MCP request failed: ${data.capability}`, data.error);
    });
    
    this.serverProxy.on('circuit-breaker:opened', (data) => {
      console.warn(`Circuit breaker opened for server: ${data.serverId}`);
    });
  }
}

// Create default MCP manager instance
export const mcp = new MCPManager();

export default mcp;
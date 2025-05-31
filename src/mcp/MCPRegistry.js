/**
 * MCP Registry - Server discovery & management
 * Handles registration, discovery, and lifecycle of MCP servers
 */

import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class MCPRegistry extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      discoveryInterval: 30000, // 30 seconds
      healthCheckInterval: 60000, // 1 minute
      timeout: 10000, // 10 seconds
      maxRetries: 3,
      ...options
    };
    
    this.servers = new Map();
    this.capabilities = new Map();
    this.discoveryTimer = null;
    this.healthCheckTimer = null;
    this.isRunning = false;
  }

  /**
   * Start the MCP registry
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Start periodic discovery
    this.discoveryTimer = setInterval(() => {
      this._performDiscovery();
    }, this.options.discoveryInterval);
    
    // Start health checks
    this.healthCheckTimer = setInterval(() => {
      this._performHealthChecks();
    }, this.options.healthCheckInterval);
    
    // Initial discovery
    await this._performDiscovery();
    
    this.emit('registry:started');
  }

  /**
   * Stop the MCP registry
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
      this.discoveryTimer = null;
    }
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    // Disconnect from all servers
    for (const [serverId, server] of this.servers) {
      try {
        if (server.status === 'connected') {
          await this._disconnectServer(serverId);
        }
      } catch (error) {
        console.warn(`Failed to disconnect from server ${serverId}:`, error);
      }
    }
    
    this.emit('registry:stopped');
  }

  /**
   * Register an MCP server manually
   * @param {Object} serverConfig - Server configuration
   * @returns {Promise<string>} Server ID
   */
  async registerServer(serverConfig) {
    const {
      name,
      type = 'external',
      transport = 'stdio',
      command,
      args = [],
      capabilities = [],
      metadata = {}
    } = serverConfig;

    if (!name) {
      throw new Error('Server name is required');
    }

    const serverId = this._generateServerId(name);
    
    const server = {
      id: serverId,
      name,
      type,
      transport,
      command,
      args,
      capabilities,
      metadata,
      status: 'registered',
      registeredAt: new Date().toISOString(),
      lastSeen: null,
      healthStatus: 'unknown',
      retryCount: 0,
      connection: null
    };

    this.servers.set(serverId, server);
    
    // Register capabilities
    this._registerCapabilities(serverId, capabilities);
    
    this.emit('server:registered', { serverId, server });
    
    // Try to connect immediately
    try {
      await this._connectServer(serverId);
    } catch (error) {
      console.warn(`Failed to connect to newly registered server ${serverId}:`, error);
    }
    
    return serverId;
  }

  /**
   * Unregister an MCP server
   * @param {string} serverId - Server ID
   * @returns {Promise<boolean>} Success status
   */
  async unregisterServer(serverId) {
    const server = this.servers.get(serverId);
    if (!server) return false;
    
    // Disconnect if connected
    if (server.status === 'connected') {
      await this._disconnectServer(serverId);
    }
    
    // Remove capabilities
    this._unregisterCapabilities(serverId);
    
    // Remove server
    this.servers.delete(serverId);
    
    this.emit('server:unregistered', { serverId });
    return true;
  }

  /**
   * Get all registered servers
   * @param {Object} filter - Filter options
   * @returns {Array<Object>} List of servers
   */
  getServers(filter = {}) {
    let servers = Array.from(this.servers.values());
    
    if (filter.status) {
      servers = servers.filter(server => server.status === filter.status);
    }
    
    if (filter.type) {
      servers = servers.filter(server => server.type === filter.type);
    }
    
    if (filter.capability) {
      servers = servers.filter(server => 
        server.capabilities.includes(filter.capability)
      );
    }
    
    return servers;
  }

  /**
   * Get server by ID
   * @param {string} serverId - Server ID
   * @returns {Object|null} Server configuration
   */
  getServer(serverId) {
    return this.servers.get(serverId) || null;
  }

  /**
   * Get servers that provide a specific capability
   * @param {string} capability - Capability name
   * @returns {Array<Object>} Servers with the capability
   */
  getServersByCapability(capability) {
    const serverIds = this.capabilities.get(capability) || [];
    return serverIds
      .map(serverId => this.servers.get(serverId))
      .filter(server => server && server.status === 'connected');
  }

  /**
   * Get all available capabilities
   * @returns {Array<string>} List of capabilities
   */
  getAvailableCapabilities() {
    return Array.from(this.capabilities.keys());
  }

  /**
   * Check if a capability is available
   * @param {string} capability - Capability name
   * @returns {boolean} Whether capability is available
   */
  hasCapability(capability) {
    const servers = this.getServersByCapability(capability);
    return servers.length > 0;
  }

  /**
   * Get registry statistics
   * @returns {Object} Registry statistics
   */
  getStats() {
    const servers = Array.from(this.servers.values());
    
    return {
      totalServers: servers.length,
      connectedServers: servers.filter(s => s.status === 'connected').length,
      disconnectedServers: servers.filter(s => s.status === 'disconnected').length,
      failedServers: servers.filter(s => s.status === 'failed').length,
      totalCapabilities: this.capabilities.size,
      isRunning: this.isRunning,
      uptime: this.isRunning ? Date.now() - this.startTime : 0
    };
  }

  /**
   * Perform server discovery
   * @returns {Promise<void>}
   */
  async _performDiscovery() {
    try {
      // Discover built-in servers
      await this._discoverBuiltInServers();
      
      // Discover system-installed MCP servers
      await this._discoverSystemServers();
      
      // Try to connect to discovered servers
      await this._connectDiscoveredServers();
      
      this.emit('discovery:completed', {
        timestamp: new Date().toISOString(),
        serversFound: this.servers.size
      });
    } catch (error) {
      this.emit('discovery:failed', { error: error.message });
    }
  }

  /**
   * Discover built-in MCP servers
   * @returns {Promise<void>}
   */
  async _discoverBuiltInServers() {
    // These are MCP servers that come with Lahat
    const builtInServers = [
      {
        name: 'lahat-filesystem',
        type: 'builtin',
        capabilities: ['file-read', 'file-write', 'file-list'],
        metadata: { description: 'Lahat file system access' }
      },
      {
        name: 'lahat-storage',
        type: 'builtin',
        capabilities: ['storage-get', 'storage-set', 'storage-list'],
        metadata: { description: 'Lahat persistent storage' }
      },
      {
        name: 'lahat-apps',
        type: 'builtin',
        capabilities: ['app-launch', 'app-list', 'app-message'],
        metadata: { description: 'Lahat app management' }
      }
    ];

    for (const serverConfig of builtInServers) {
      const serverId = this._generateServerId(serverConfig.name);
      
      if (!this.servers.has(serverId)) {
        const server = {
          id: serverId,
          ...serverConfig,
          status: 'discovered',
          registeredAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          healthStatus: 'healthy',
          retryCount: 0,
          connection: null
        };

        this.servers.set(serverId, server);
        this._registerCapabilities(serverId, serverConfig.capabilities);
        
        this.emit('server:discovered', { serverId, server });
      }
    }
  }

  /**
   * Discover system-installed MCP servers
   * @returns {Promise<void>}
   */
  async _discoverSystemServers() {
    // In a real implementation, this would scan for:
    // - MCP servers in PATH
    // - Configuration files
    // - Registry entries
    // - Docker containers
    // etc.
    
    // For now, we'll just emit that system discovery was attempted
    this.emit('discovery:system:attempted');
  }

  /**
   * Connect to discovered servers
   * @returns {Promise<void>}
   */
  async _connectDiscoveredServers() {
    const discoveredServers = this.getServers({ status: 'discovered' });
    
    for (const server of discoveredServers) {
      try {
        await this._connectServer(server.id);
      } catch (error) {
        console.warn(`Failed to connect to discovered server ${server.id}:`, error);
      }
    }
  }

  /**
   * Connect to a specific server
   * @param {string} serverId - Server ID
   * @returns {Promise<void>}
   */
  async _connectServer(serverId) {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    if (server.status === 'connected') {
      return; // Already connected
    }

    try {
      server.status = 'connecting';
      this.emit('server:connecting', { serverId });

      // Create connection based on server type
      let connection;
      if (server.type === 'builtin') {
        connection = await this._createBuiltInConnection(server);
      } else {
        connection = await this._createExternalConnection(server);
      }

      server.connection = connection;
      server.status = 'connected';
      server.lastSeen = new Date().toISOString();
      server.healthStatus = 'healthy';
      server.retryCount = 0;

      this.emit('server:connected', { serverId, server });
    } catch (error) {
      server.status = 'failed';
      server.retryCount++;
      
      this.emit('server:connection:failed', { 
        serverId, 
        error: error.message,
        retryCount: server.retryCount 
      });
      
      throw error;
    }
  }

  /**
   * Disconnect from a server
   * @param {string} serverId - Server ID
   * @returns {Promise<void>}
   */
  async _disconnectServer(serverId) {
    const server = this.servers.get(serverId);
    if (!server || server.status !== 'connected') {
      return;
    }

    try {
      if (server.connection && server.connection.close) {
        await server.connection.close();
      }
      
      server.connection = null;
      server.status = 'disconnected';
      
      this.emit('server:disconnected', { serverId });
    } catch (error) {
      this.emit('server:disconnection:failed', { serverId, error: error.message });
      throw error;
    }
  }

  /**
   * Create connection for built-in server
   * @param {Object} server - Server configuration
   * @returns {Promise<Object>} Connection object
   */
  async _createBuiltInConnection(server) {
    // Built-in servers are handled directly within Lahat
    return {
      type: 'builtin',
      serverId: server.id,
      close: async () => {
        // No cleanup needed for built-in servers
      }
    };
  }

  /**
   * Create connection for external server
   * @param {Object} server - Server configuration
   * @returns {Promise<Object>} Connection object
   */
  async _createExternalConnection(server) {
    // This would implement actual MCP protocol connection
    // For now, return a mock connection
    return {
      type: 'external',
      serverId: server.id,
      transport: server.transport,
      close: async () => {
        // Close connection
      },
      send: async (message) => {
        // Send message to server
        return { success: true, response: 'mock' };
      }
    };
  }

  /**
   * Perform health checks on connected servers
   * @returns {Promise<void>}
   */
  async _performHealthChecks() {
    const connectedServers = this.getServers({ status: 'connected' });
    
    for (const server of connectedServers) {
      try {
        await this._checkServerHealth(server.id);
      } catch (error) {
        console.warn(`Health check failed for server ${server.id}:`, error);
      }
    }
  }

  /**
   * Check health of a specific server
   * @param {string} serverId - Server ID
   * @returns {Promise<boolean>} Health status
   */
  async _checkServerHealth(serverId) {
    const server = this.servers.get(serverId);
    if (!server || server.status !== 'connected') {
      return false;
    }

    try {
      // For built-in servers, always healthy
      if (server.type === 'builtin') {
        server.healthStatus = 'healthy';
        server.lastSeen = new Date().toISOString();
        return true;
      }

      // For external servers, send ping
      // This would implement actual health check
      server.healthStatus = 'healthy';
      server.lastSeen = new Date().toISOString();
      
      this.emit('server:health:checked', { serverId, healthy: true });
      return true;
    } catch (error) {
      server.healthStatus = 'unhealthy';
      this.emit('server:health:failed', { serverId, error: error.message });
      return false;
    }
  }

  /**
   * Register capabilities for a server
   * @param {string} serverId - Server ID
   * @param {Array<string>} capabilities - Capabilities to register
   */
  _registerCapabilities(serverId, capabilities) {
    for (const capability of capabilities) {
      if (!this.capabilities.has(capability)) {
        this.capabilities.set(capability, []);
      }
      
      const servers = this.capabilities.get(capability);
      if (!servers.includes(serverId)) {
        servers.push(serverId);
      }
    }
  }

  /**
   * Unregister capabilities for a server
   * @param {string} serverId - Server ID
   */
  _unregisterCapabilities(serverId) {
    for (const [capability, servers] of this.capabilities) {
      const index = servers.indexOf(serverId);
      if (index !== -1) {
        servers.splice(index, 1);
        
        // Remove capability if no servers provide it
        if (servers.length === 0) {
          this.capabilities.delete(capability);
        }
      }
    }
  }

  /**
   * Generate unique server ID
   * @param {string} name - Server name
   * @returns {string} Server ID
   */
  _generateServerId(name) {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    return `mcp-${sanitized}`;
  }
}
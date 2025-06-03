/**
 * MCP Server Island - Lahat as MCP Server
 * Exposes Lahat platform capabilities as MCP server for external integration
 */

export { LahatMCPServer } from './LahatMCPServer.js';
export { AppLauncher } from './capabilities/AppLauncher.js';
export { AppInstaller } from './capabilities/AppInstaller.js';
export { ProjectOperations } from './capabilities/ProjectOperations.js';
export { ServiceAdvertiser } from './discovery/ServiceAdvertiser.js';

/**
 * MCP Server Manager - Coordinated MCP server functionality
 */
export class MCPServerManager {
  constructor(lahatRuntime, options = {}) {
    this.runtime = lahatRuntime;
    this.options = {
      autoStart: true,
      enableDiscovery: true,
      ...options
    };
    
    this.mcpServer = null;
    this.serviceAdvertiser = null;
    this.isRunning = false;
  }

  /**
   * Start the MCP server
   */
  async start() {
    try {
      // Create and start MCP server
      const { LahatMCPServer } = await import('./LahatMCPServer.js');
      this.mcpServer = new LahatMCPServer(this.runtime, this.options);
      
      await this.mcpServer.start();
      
      // Start service discovery if enabled
      if (this.options.enableDiscovery) {
        const { ServiceAdvertiser } = await import('./discovery/ServiceAdvertiser.js');
        this.serviceAdvertiser = new ServiceAdvertiser(this.mcpServer);
        await this.serviceAdvertiser.start();
      }
      
      this.isRunning = true;
      
      console.log('🚀 MCP Server Manager started successfully');
      return {
        success: true,
        mcpServer: this.mcpServer.getStatus(),
        discovery: this.serviceAdvertiser?.getStatus()
      };
    } catch (error) {
      console.error('Failed to start MCP Server Manager:', error);
      throw error;
    }
  }

  /**
   * Stop the MCP server
   */
  async stop() {
    try {
      if (this.serviceAdvertiser) {
        await this.serviceAdvertiser.stop();
        this.serviceAdvertiser = null;
      }
      
      if (this.mcpServer) {
        await this.mcpServer.stop();
        this.mcpServer = null;
      }
      
      this.isRunning = false;
      
      console.log('🛑 MCP Server Manager stopped');
      return { success: true };
    } catch (error) {
      console.error('Failed to stop MCP Server Manager:', error);
      throw error;
    }
  }

  /**
   * Get manager status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      mcpServer: this.mcpServer?.getStatus() || null,
      discovery: this.serviceAdvertiser?.getStatus() || null,
      capabilities: this.mcpServer ? Object.keys(this.mcpServer.capabilities) : []
    };
  }

  /**
   * Get MCP server instance
   */
  getMCPServer() {
    return this.mcpServer;
  }

  /**
   * Get service advertiser instance
   */
  getServiceAdvertiser() {
    return this.serviceAdvertiser;
  }
}
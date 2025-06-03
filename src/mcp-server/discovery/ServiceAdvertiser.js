/**
 * Service Advertiser - Advertises Lahat MCP capabilities to the network
 * Enables automatic discovery by external tools and clients
 */

import { EventEmitter } from 'events';
import os from 'os';

export class ServiceAdvertiser extends EventEmitter {
  constructor(mcpServer, options = {}) {
    super();
    
    this.mcpServer = mcpServer;
    this.options = {
      enableMDNS: true,
      enableHTTPDiscovery: true,
      discoveryPort: 8766,
      advertiseInterval: 30000, // 30 seconds
      ...options
    };
    
    this.isAdvertising = false;
    this.advertiseTimer = null;
    this.discoveryInfo = null;
  }

  /**
   * Start advertising services
   */
  async start() {
    try {
      this.discoveryInfo = await this._generateDiscoveryInfo();
      
      if (this.options.enableMDNS) {
        await this._startMDNSAdvertising();
      }
      
      if (this.options.enableHTTPDiscovery) {
        await this._startHTTPDiscovery();
      }
      
      // Start periodic advertising
      this.advertiseTimer = setInterval(() => {
        this._periodicAdvertise();
      }, this.options.advertiseInterval);
      
      this.isAdvertising = true;
      this.emit('advertising:started', this.discoveryInfo);
      
      console.log('🔊 Service advertising started');
    } catch (error) {
      this.emit('advertising:error', error);
      throw error;
    }
  }

  /**
   * Stop advertising services
   */
  async stop() {
    try {
      if (this.advertiseTimer) {
        clearInterval(this.advertiseTimer);
        this.advertiseTimer = null;
      }
      
      await this._stopMDNSAdvertising();
      await this._stopHTTPDiscovery();
      
      this.isAdvertising = false;
      this.emit('advertising:stopped');
      
      console.log('🔇 Service advertising stopped');
    } catch (error) {
      this.emit('advertising:error', error);
      throw error;
    }
  }

  /**
   * Generate discovery information
   * @private
   */
  async _generateDiscoveryInfo() {
    const networkInterfaces = os.networkInterfaces();
    const addresses = [];
    
    // Get all non-internal IP addresses
    for (const [name, interfaces] of Object.entries(networkInterfaces)) {
      for (const iface of interfaces || []) {
        if (!iface.internal && iface.family === 'IPv4') {
          addresses.push({
            interface: name,
            address: iface.address
          });
        }
      }
    }

    return {
      service: {
        name: this.mcpServer.options.name,
        version: this.mcpServer.options.version,
        description: this.mcpServer.options.description,
        type: 'lahat-mcp-server'
      },
      server: {
        host: this.mcpServer.options.host,
        port: this.mcpServer.options.port,
        protocol: 'mcp'
      },
      network: {
        addresses,
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch()
      },
      capabilities: await this._getServerCapabilities(),
      discovery: {
        mdns: this.options.enableMDNS,
        http: this.options.enableHTTPDiscovery,
        discoveryPort: this.options.discoveryPort,
        lastAdvertised: new Date().toISOString()
      }
    };
  }

  /**
   * Start mDNS advertising
   * @private
   */
  async _startMDNSAdvertising() {
    try {
      // In a real implementation, this would use a library like multicast-dns
      console.log('📡 mDNS advertising would start here');
      
      // Mock mDNS advertising
      this.emit('mdns:advertising', {
        serviceName: `${this.discoveryInfo.service.name}._lahat._tcp.local`,
        port: this.mcpServer.options.port,
        txt: {
          version: this.discoveryInfo.service.version,
          type: this.discoveryInfo.service.type,
          capabilities: JSON.stringify(this.discoveryInfo.capabilities)
        }
      });
    } catch (error) {
      console.warn('Failed to start mDNS advertising:', error.message);
      this.emit('mdns:error', error);
    }
  }

  /**
   * Stop mDNS advertising
   * @private
   */
  async _stopMDNSAdvertising() {
    try {
      console.log('📡 mDNS advertising would stop here');
      this.emit('mdns:stopped');
    } catch (error) {
      console.warn('Failed to stop mDNS advertising:', error.message);
    }
  }

  /**
   * Start HTTP discovery endpoint
   * @private
   */
  async _startHTTPDiscovery() {
    try {
      // In a real implementation, this would start an HTTP server
      console.log(`🌐 HTTP discovery would start on port ${this.options.discoveryPort}`);
      
      // Mock HTTP discovery server
      this.emit('http:discovery-started', {
        port: this.options.discoveryPort,
        endpoints: {
          info: `http://localhost:${this.options.discoveryPort}/lahat/info`,
          capabilities: `http://localhost:${this.options.discoveryPort}/lahat/capabilities`,
          status: `http://localhost:${this.options.discoveryPort}/lahat/status`
        }
      });
    } catch (error) {
      console.warn('Failed to start HTTP discovery:', error.message);
      this.emit('http:error', error);
    }
  }

  /**
   * Stop HTTP discovery endpoint
   * @private
   */
  async _stopHTTPDiscovery() {
    try {
      console.log('🌐 HTTP discovery would stop here');
      this.emit('http:discovery-stopped');
    } catch (error) {
      console.warn('Failed to stop HTTP discovery:', error.message);
    }
  }

  /**
   * Perform periodic advertising
   * @private
   */
  _periodicAdvertise() {
    try {
      // Update last advertised timestamp
      if (this.discoveryInfo) {
        this.discoveryInfo.discovery.lastAdvertised = new Date().toISOString();
      }
      
      this.emit('periodic:advertise', this.discoveryInfo);
    } catch (error) {
      this.emit('advertising:error', error);
    }
  }

  /**
   * Get server capabilities for advertising
   * @private
   */
  async _getServerCapabilities() {
    const capabilities = {
      tools: [],
      resources: [],
      prompts: []
    };

    try {
      // Get tools
      const tools = this.mcpServer._getAvailableTools();
      capabilities.tools = tools.map(tool => ({
        name: tool.name,
        description: tool.description
      }));

      // Get resources
      const resources = this.mcpServer._getAvailableResources();
      capabilities.resources = resources.map(resource => ({
        uri: resource.uri,
        name: resource.name,
        mimeType: resource.mimeType
      }));

      // Get prompts
      const prompts = this.mcpServer._getAvailablePrompts();
      capabilities.prompts = prompts.map(prompt => ({
        name: prompt.name,
        description: prompt.description
      }));
    } catch (error) {
      console.warn('Failed to get server capabilities:', error.message);
    }

    return capabilities;
  }

  /**
   * Manual announce (for immediate discovery)
   */
  async announce() {
    try {
      this.discoveryInfo = await this._generateDiscoveryInfo();
      this._periodicAdvertise();
      
      this.emit('manual:announce', this.discoveryInfo);
      
      return this.discoveryInfo;
    } catch (error) {
      this.emit('advertising:error', error);
      throw error;
    }
  }

  /**
   * Get current discovery information
   */
  getDiscoveryInfo() {
    return this.discoveryInfo;
  }

  /**
   * Check if advertising is active
   */
  isActive() {
    return this.isAdvertising;
  }

  /**
   * Get advertising status
   */
  getStatus() {
    return {
      isAdvertising: this.isAdvertising,
      enabledMethods: {
        mdns: this.options.enableMDNS,
        http: this.options.enableHTTPDiscovery
      },
      discoveryPort: this.options.discoveryPort,
      advertiseInterval: this.options.advertiseInterval,
      lastAdvertised: this.discoveryInfo?.discovery?.lastAdvertised,
      networkAddresses: this.discoveryInfo?.network?.addresses?.length || 0
    };
  }
}
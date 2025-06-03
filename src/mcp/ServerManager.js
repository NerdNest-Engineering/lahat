/**
 * Server Manager - MCP server lifecycle management
 * Handles starting, stopping, and monitoring MCP servers
 */

import { EventEmitter } from 'events';
import { spawn } from 'child_process';

export class ServerManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      startupTimeout: 30000, // 30 seconds
      shutdownTimeout: 10000, // 10 seconds
      restartDelay: 5000, // 5 seconds
      maxRestarts: 3,
      ...options
    };
    
    this.processes = new Map();
    this.serverStates = new Map();
  }

  /**
   * Start an MCP server
   * @param {string} serverId - Server ID
   * @param {Object} serverConfig - Server configuration
   * @returns {Promise<boolean>} Success status
   */
  async startServer(serverId, serverConfig) {
    if (this.isServerRunning(serverId)) {
      throw new Error(`Server ${serverId} is already running`);
    }

    const {
      command,
      args = [],
      env = {},
      cwd = process.cwd(),
      transport = 'stdio'
    } = serverConfig;

    if (!command) {
      throw new Error('Server command is required');
    }

    try {
      this.emit('server:starting', { serverId, serverConfig });

      // Initialize server state
      const serverState = {
        id: serverId,
        config: serverConfig,
        status: 'starting',
        startTime: Date.now(),
        restartCount: 0,
        lastRestart: null,
        process: null,
        transport: null
      };

      this.serverStates.set(serverId, serverState);

      // Start the server process
      const process = await this._startServerProcess(serverId, serverConfig);
      serverState.process = process;
      this.processes.set(serverId, process);

      // Set up transport communication
      const transport = await this._setupTransport(serverId, serverConfig, process);
      serverState.transport = transport;

      // Wait for server to be ready
      await this._waitForServerReady(serverId);

      serverState.status = 'running';
      this.emit('server:started', { serverId, serverState });

      return true;
    } catch (error) {
      this._updateServerState(serverId, { status: 'failed' });
      this.emit('server:start:failed', { serverId, error: error.message });
      throw error;
    }
  }

  /**
   * Stop an MCP server
   * @param {string} serverId - Server ID
   * @param {boolean} force - Force stop without graceful shutdown
   * @returns {Promise<boolean>} Success status
   */
  async stopServer(serverId, force = false) {
    const serverState = this.serverStates.get(serverId);
    if (!serverState || serverState.status === 'stopped') {
      return true;
    }

    try {
      this.emit('server:stopping', { serverId, force });
      
      this._updateServerState(serverId, { status: 'stopping' });

      // Close transport first
      if (serverState.transport) {
        await this._closeTransport(serverId);
      }

      // Stop the process
      await this._stopServerProcess(serverId, force);

      // Clean up
      this.processes.delete(serverId);
      this._updateServerState(serverId, { 
        status: 'stopped',
        process: null,
        transport: null
      });

      this.emit('server:stopped', { serverId });
      return true;
    } catch (error) {
      this.emit('server:stop:failed', { serverId, error: error.message });
      throw error;
    }
  }

  /**
   * Restart an MCP server
   * @param {string} serverId - Server ID
   * @returns {Promise<boolean>} Success status
   */
  async restartServer(serverId) {
    const serverState = this.serverStates.get(serverId);
    if (!serverState) {
      throw new Error(`Server ${serverId} not found`);
    }

    // Check restart limits
    if (serverState.restartCount >= this.options.maxRestarts) {
      throw new Error(`Server ${serverId} has exceeded maximum restart attempts`);
    }

    try {
      this.emit('server:restarting', { serverId });

      // Stop the server
      await this.stopServer(serverId);

      // Wait before restarting
      await new Promise(resolve => setTimeout(resolve, this.options.restartDelay));

      // Update restart count
      serverState.restartCount++;
      serverState.lastRestart = Date.now();

      // Start the server again
      await this.startServer(serverId, serverState.config);

      this.emit('server:restarted', { serverId, restartCount: serverState.restartCount });
      return true;
    } catch (error) {
      this.emit('server:restart:failed', { serverId, error: error.message });
      throw error;
    }
  }

  /**
   * Send message to an MCP server
   * @param {string} serverId - Server ID
   * @param {Object} message - Message to send
   * @returns {Promise<Object>} Server response
   */
  async sendMessage(serverId, message) {
    const serverState = this.serverStates.get(serverId);
    if (!serverState || serverState.status !== 'running') {
      throw new Error(`Server ${serverId} is not running`);
    }

    if (!serverState.transport) {
      throw new Error(`Server ${serverId} has no transport available`);
    }

    try {
      this.emit('message:sending', { serverId, message });
      
      const response = await serverState.transport.send(message);
      
      this.emit('message:received', { serverId, message, response });
      return response;
    } catch (error) {
      this.emit('message:failed', { serverId, message, error: error.message });
      throw error;
    }
  }

  /**
   * Get server state
   * @param {string} serverId - Server ID
   * @returns {Object|null} Server state
   */
  getServerState(serverId) {
    return this.serverStates.get(serverId) || null;
  }

  /**
   * Get all server states
   * @param {Object} filter - Filter options
   * @returns {Array<Object>} Server states
   */
  getAllServerStates(filter = {}) {
    let states = Array.from(this.serverStates.values());

    if (filter.status) {
      states = states.filter(state => state.status === filter.status);
    }

    return states;
  }

  /**
   * Check if server is running
   * @param {string} serverId - Server ID
   * @returns {boolean} Whether server is running
   */
  isServerRunning(serverId) {
    const state = this.serverStates.get(serverId);
    return state && state.status === 'running';
  }

  /**
   * Get server uptime
   * @param {string} serverId - Server ID
   * @returns {number} Uptime in milliseconds
   */
  getServerUptime(serverId) {
    const state = this.serverStates.get(serverId);
    if (!state || state.status !== 'running') {
      return 0;
    }
    return Date.now() - state.startTime;
  }

  /**
   * Stop all servers
   * @returns {Promise<void>}
   */
  async stopAllServers() {
    const runningServers = this.getAllServerStates({ status: 'running' });
    
    await Promise.all(
      runningServers.map(state => this.stopServer(state.id))
    );
  }

  /**
   * Start server process
   * @param {string} serverId - Server ID
   * @param {Object} serverConfig - Server configuration
   * @returns {Promise<ChildProcess>} Server process
   */
  async _startServerProcess(serverId, serverConfig) {
    const {
      command,
      args = [],
      env = {},
      cwd = process.cwd()
    } = serverConfig;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Server ${serverId} startup timeout`));
      }, this.options.startupTimeout);

      try {
        const process = spawn(command, args, {
          cwd,
          env: { ...process.env, ...env },
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // Handle process events
        process.on('spawn', () => {
          clearTimeout(timeout);
          this.emit('server:process:spawned', { serverId, pid: process.pid });
          resolve(process);
        });

        process.on('error', (error) => {
          clearTimeout(timeout);
          this.emit('server:process:error', { serverId, error: error.message });
          reject(error);
        });

        process.on('exit', (code, signal) => {
          this.emit('server:process:exited', { serverId, code, signal });
          this._handleProcessExit(serverId, code, signal);
        });

        // Set up stdio handling
        this._setupProcessStdio(serverId, process);

      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Stop server process
   * @param {string} serverId - Server ID
   * @param {boolean} force - Force kill the process
   * @returns {Promise<void>}
   */
  async _stopServerProcess(serverId, force = false) {
    const process = this.processes.get(serverId);
    if (!process) return;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!force) {
          // Force kill if graceful shutdown fails
          process.kill('SIGKILL');
        }
        reject(new Error(`Server ${serverId} shutdown timeout`));
      }, this.options.shutdownTimeout);

      process.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });

      // Try graceful shutdown first
      if (force) {
        process.kill('SIGKILL');
      } else {
        process.kill('SIGTERM');
      }
    });
  }

  /**
   * Setup transport communication
   * @param {string} serverId - Server ID
   * @param {Object} serverConfig - Server configuration
   * @param {ChildProcess} process - Server process
   * @returns {Promise<Object>} Transport object
   */
  async _setupTransport(serverId, serverConfig, process) {
    const { transport = 'stdio' } = serverConfig;

    switch (transport) {
      case 'stdio':
        return this._createStdioTransport(serverId, process);
      case 'tcp':
        return this._createTcpTransport(serverId, serverConfig);
      case 'websocket':
        return this._createWebSocketTransport(serverId, serverConfig);
      default:
        throw new Error(`Unsupported transport: ${transport}`);
    }
  }

  /**
   * Create stdio transport
   * @param {string} serverId - Server ID
   * @param {ChildProcess} process - Server process
   * @returns {Object} Transport object
   */
  _createStdioTransport(serverId, process) {
    return {
      type: 'stdio',
      send: async (message) => {
        return new Promise((resolve, reject) => {
          const jsonMessage = JSON.stringify(message) + '\n';
          
          process.stdin.write(jsonMessage, (error) => {
            if (error) {
              reject(error);
            } else {
              // For now, return a mock response
              // Real implementation would wait for actual response
              resolve({ success: true, result: 'mock response' });
            }
          });
        });
      },
      close: async () => {
        if (process.stdin) {
          process.stdin.end();
        }
      }
    };
  }

  /**
   * Create TCP transport
   * @param {string} serverId - Server ID
   * @param {Object} serverConfig - Server configuration
   * @returns {Promise<Object>} Transport object
   */
  async _createTcpTransport(serverId, serverConfig) {
    // TCP transport implementation would go here
    throw new Error('TCP transport not yet implemented');
  }

  /**
   * Create WebSocket transport
   * @param {string} serverId - Server ID
   * @param {Object} serverConfig - Server configuration
   * @returns {Promise<Object>} Transport object
   */
  async _createWebSocketTransport(serverId, serverConfig) {
    // WebSocket transport implementation would go here
    throw new Error('WebSocket transport not yet implemented');
  }

  /**
   * Close transport
   * @param {string} serverId - Server ID
   * @returns {Promise<void>}
   */
  async _closeTransport(serverId) {
    const serverState = this.serverStates.get(serverId);
    if (serverState && serverState.transport) {
      await serverState.transport.close();
      serverState.transport = null;
    }
  }

  /**
   * Wait for server to be ready
   * @param {string} serverId - Server ID
   * @returns {Promise<void>}
   */
  async _waitForServerReady(serverId) {
    // In a real implementation, this would send an initialization message
    // and wait for the server to respond that it's ready
    
    // For now, just wait a brief moment
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Setup process stdio handling
   * @param {string} serverId - Server ID
   * @param {ChildProcess} process - Server process
   */
  _setupProcessStdio(serverId, process) {
    // Handle stdout
    process.stdout.on('data', (data) => {
      this.emit('server:stdout', { serverId, data: data.toString() });
    });

    // Handle stderr
    process.stderr.on('data', (data) => {
      this.emit('server:stderr', { serverId, data: data.toString() });
    });
  }

  /**
   * Handle process exit
   * @param {string} serverId - Server ID
   * @param {number} code - Exit code
   * @param {string} signal - Exit signal
   */
  _handleProcessExit(serverId, code, signal) {
    const serverState = this.serverStates.get(serverId);
    if (!serverState) return;

    // Check if this was an unexpected exit
    if (serverState.status === 'running') {
      this.emit('server:unexpected:exit', { serverId, code, signal });
      
      // Attempt restart if configured
      if (serverState.restartCount < this.options.maxRestarts) {
        setTimeout(() => {
          this.restartServer(serverId).catch(error => {
            this.emit('server:restart:failed', { serverId, error: error.message });
          });
        }, this.options.restartDelay);
      } else {
        this._updateServerState(serverId, { status: 'failed' });
      }
    }

    // Clean up
    this.processes.delete(serverId);
  }

  /**
   * Update server state
   * @param {string} serverId - Server ID
   * @param {Object} updates - State updates
   */
  _updateServerState(serverId, updates) {
    const serverState = this.serverStates.get(serverId);
    if (serverState) {
      Object.assign(serverState, updates);
      this.emit('server:state:updated', { serverId, state: serverState });
    }
  }
}
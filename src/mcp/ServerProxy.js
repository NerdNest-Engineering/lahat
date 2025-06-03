/**
 * Server Proxy - Proxy requests to MCP servers
 * Handles request routing, load balancing, and error handling
 */

import { EventEmitter } from 'events';

export class ServerProxy extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000, // 1 minute
      ...options
    };
    
    this.requestCounter = 0;
    this.circuitBreakers = new Map();
    this.activeRequests = new Map();
    this.serverManager = null;
    this.capabilityMatcher = null;
  }

  /**
   * Set dependencies
   * @param {ServerManager} serverManager - Server manager instance
   * @param {CapabilityMatcher} capabilityMatcher - Capability matcher instance
   */
  setDependencies(serverManager, capabilityMatcher) {
    this.serverManager = serverManager;
    this.capabilityMatcher = capabilityMatcher;
  }

  /**
   * Execute a capability on the best available server
   * @param {string} capability - Capability name
   * @param {Object} params - Parameters for the capability
   * @param {Object} options - Execution options
   * @returns {Promise<any>} Result from server
   */
  async executeCapability(capability, params = {}, options = {}) {
    const requestId = this._generateRequestId();
    
    try {
      this.emit('request:start', { requestId, capability, params });
      
      // Find the best server for this capability
      const server = await this.capabilityMatcher.getBestServerForCapability(capability, options.requirements);
      
      if (!server) {
        throw new Error(`No server available for capability: ${capability}`);
      }

      // Check circuit breaker
      if (this._isCircuitBreakerOpen(server.id)) {
        throw new Error(`Circuit breaker is open for server: ${server.id}`);
      }

      // Execute the request
      const result = await this._executeOnServer(requestId, server, capability, params, options);
      
      // Update circuit breaker on success
      this._recordSuccess(server.id);
      
      this.emit('request:success', { requestId, capability, server: server.id, result });
      return result;
      
    } catch (error) {
      this.emit('request:failed', { requestId, capability, error: error.message });
      throw error;
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Execute capability on multiple servers (parallel execution)
   * @param {string} capability - Capability name
   * @param {Object} params - Parameters for the capability
   * @param {Object} options - Execution options
   * @returns {Promise<Array>} Results from all servers
   */
  async executeCapabilityParallel(capability, params = {}, options = {}) {
    const servers = await this.capabilityMatcher.findServersForCapability(capability, options.requirements);
    
    if (servers.length === 0) {
      throw new Error(`No servers available for capability: ${capability}`);
    }

    const maxServers = options.maxServers || servers.length;
    const selectedServers = servers.slice(0, maxServers);

    const promises = selectedServers.map(server => {
      const requestId = this._generateRequestId();
      return this._executeOnServer(requestId, server, capability, params, options)
        .then(result => ({ server: server.id, success: true, result }))
        .catch(error => ({ server: server.id, success: false, error: error.message }));
    });

    return await Promise.all(promises);
  }

  /**
   * Execute capability with automatic failover
   * @param {string} capability - Capability name
   * @param {Object} params - Parameters for the capability
   * @param {Object} options - Execution options
   * @returns {Promise<any>} Result from server
   */
  async executeCapabilityWithFailover(capability, params = {}, options = {}) {
    const servers = await this.capabilityMatcher.findServersForCapability(capability, options.requirements);
    
    if (servers.length === 0) {
      throw new Error(`No servers available for capability: ${capability}`);
    }

    let lastError;
    
    for (const server of servers) {
      // Skip if circuit breaker is open
      if (this._isCircuitBreakerOpen(server.id)) {
        continue;
      }

      try {
        const requestId = this._generateRequestId();
        const result = await this._executeOnServer(requestId, server, capability, params, options);
        
        this._recordSuccess(server.id);
        this.emit('failover:success', { capability, server: server.id });
        
        return result;
      } catch (error) {
        lastError = error;
        this._recordFailure(server.id);
        
        this.emit('failover:attempt:failed', { 
          capability, 
          server: server.id, 
          error: error.message 
        });
        
        // Continue to next server
        continue;
      }
    }

    throw new Error(`All servers failed for capability ${capability}. Last error: ${lastError?.message}`);
  }

  /**
   * Send raw message to a specific server
   * @param {string} serverId - Server ID
   * @param {Object} message - Message to send
   * @param {Object} options - Options
   * @returns {Promise<any>} Server response
   */
  async sendMessage(serverId, message, options = {}) {
    const requestId = this._generateRequestId();
    
    try {
      this.emit('message:start', { requestId, serverId, message });
      
      // Check if server is running
      if (!this.serverManager.isServerRunning(serverId)) {
        throw new Error(`Server ${serverId} is not running`);
      }

      // Check circuit breaker
      if (this._isCircuitBreakerOpen(serverId)) {
        throw new Error(`Circuit breaker is open for server: ${serverId}`);
      }

      // Send message with timeout
      const result = await this._sendMessageWithTimeout(requestId, serverId, message, options);
      
      this._recordSuccess(serverId);
      this.emit('message:success', { requestId, serverId, result });
      
      return result;
      
    } catch (error) {
      this._recordFailure(serverId);
      this.emit('message:failed', { requestId, serverId, error: error.message });
      throw error;
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Get active requests
   * @returns {Array<Object>} Active requests
   */
  getActiveRequests() {
    return Array.from(this.activeRequests.values());
  }

  /**
   * Cancel a request
   * @param {string} requestId - Request ID
   * @returns {boolean} Whether request was cancelled
   */
  cancelRequest(requestId) {
    const request = this.activeRequests.get(requestId);
    if (request && request.controller) {
      request.controller.abort();
      this.activeRequests.delete(requestId);
      this.emit('request:cancelled', { requestId });
      return true;
    }
    return false;
  }

  /**
   * Get circuit breaker status
   * @param {string} serverId - Server ID
   * @returns {Object} Circuit breaker status
   */
  getCircuitBreakerStatus(serverId) {
    const breaker = this.circuitBreakers.get(serverId);
    if (!breaker) {
      return { state: 'closed', failures: 0 };
    }

    return {
      state: breaker.state,
      failures: breaker.failures,
      lastFailure: breaker.lastFailure,
      nextRetry: breaker.nextRetry
    };
  }

  /**
   * Reset circuit breaker for a server
   * @param {string} serverId - Server ID
   */
  resetCircuitBreaker(serverId) {
    this.circuitBreakers.delete(serverId);
    this.emit('circuit-breaker:reset', { serverId });
  }

  /**
   * Get proxy statistics
   * @returns {Object} Proxy statistics
   */
  getStats() {
    const activeRequests = this.activeRequests.size;
    const openCircuitBreakers = Array.from(this.circuitBreakers.values())
      .filter(breaker => breaker.state === 'open').length;

    return {
      totalRequests: this.requestCounter,
      activeRequests,
      openCircuitBreakers,
      circuitBreakers: this.circuitBreakers.size
    };
  }

  /**
   * Execute on a specific server
   * @param {string} requestId - Request ID
   * @param {Object} server - Server object
   * @param {string} capability - Capability name
   * @param {Object} params - Parameters
   * @param {Object} options - Options
   * @returns {Promise<any>} Server response
   */
  async _executeOnServer(requestId, server, capability, params, options) {
    // Create MCP message
    const message = {
      jsonrpc: '2.0',
      id: requestId,
      method: `capability/${capability}`,
      params
    };

    // Track the request
    const controller = new AbortController();
    this.activeRequests.set(requestId, {
      id: requestId,
      serverId: server.id,
      capability,
      startTime: Date.now(),
      controller
    });

    try {
      // Send message with timeout and retry logic
      return await this._sendMessageWithRetry(requestId, server.id, message, options);
    } catch (error) {
      this._recordFailure(server.id);
      throw error;
    }
  }

  /**
   * Send message with timeout
   * @param {string} requestId - Request ID
   * @param {string} serverId - Server ID
   * @param {Object} message - Message to send
   * @param {Object} options - Options
   * @returns {Promise<any>} Server response
   */
  async _sendMessageWithTimeout(requestId, serverId, message, options) {
    const timeout = options.timeout || this.options.timeout;
    
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Request ${requestId} to server ${serverId} timed out`));
      }, timeout);

      try {
        const result = await this.serverManager.sendMessage(serverId, message);
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  /**
   * Send message with retry logic
   * @param {string} requestId - Request ID
   * @param {string} serverId - Server ID
   * @param {Object} message - Message to send
   * @param {Object} options - Options
   * @returns {Promise<any>} Server response
   */
  async _sendMessageWithRetry(requestId, serverId, message, options) {
    const maxAttempts = options.retryAttempts || this.options.retryAttempts;
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this._sendMessageWithTimeout(requestId, serverId, message, options);
      } catch (error) {
        lastError = error;
        
        this.emit('request:retry', { 
          requestId, 
          serverId, 
          attempt, 
          maxAttempts, 
          error: error.message 
        });

        // Don't retry on the last attempt
        if (attempt < maxAttempts) {
          const delay = (options.retryDelay || this.options.retryDelay) * attempt;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Check if circuit breaker is open
   * @param {string} serverId - Server ID
   * @returns {boolean} Whether circuit breaker is open
   */
  _isCircuitBreakerOpen(serverId) {
    const breaker = this.circuitBreakers.get(serverId);
    if (!breaker) return false;

    if (breaker.state === 'open') {
      // Check if we should transition to half-open
      if (Date.now() > breaker.nextRetry) {
        breaker.state = 'half-open';
        this.emit('circuit-breaker:half-open', { serverId });
      }
      return breaker.state === 'open';
    }

    return false;
  }

  /**
   * Record successful request
   * @param {string} serverId - Server ID
   */
  _recordSuccess(serverId) {
    const breaker = this.circuitBreakers.get(serverId);
    if (breaker) {
      if (breaker.state === 'half-open') {
        // Transition back to closed
        breaker.state = 'closed';
        breaker.failures = 0;
        this.emit('circuit-breaker:closed', { serverId });
      }
    }
  }

  /**
   * Record failed request
   * @param {string} serverId - Server ID
   */
  _recordFailure(serverId) {
    let breaker = this.circuitBreakers.get(serverId);
    if (!breaker) {
      breaker = {
        state: 'closed',
        failures: 0,
        lastFailure: null,
        nextRetry: null
      };
      this.circuitBreakers.set(serverId, breaker);
    }

    breaker.failures++;
    breaker.lastFailure = Date.now();

    // Check if we should open the circuit breaker
    if (breaker.failures >= this.options.circuitBreakerThreshold) {
      breaker.state = 'open';
      breaker.nextRetry = Date.now() + this.options.circuitBreakerTimeout;
      
      this.emit('circuit-breaker:opened', { 
        serverId, 
        failures: breaker.failures,
        nextRetry: breaker.nextRetry
      });
    }
  }

  /**
   * Generate unique request ID
   * @returns {string} Request ID
   */
  _generateRequestId() {
    return `req_${++this.requestCounter}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
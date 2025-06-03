/**
 * Development Runtime - Enhanced runtime for development
 * Provides debugging, profiling, and development-specific features
 */

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';

export class DevRuntime extends EventEmitter {
  constructor(runtime, options = {}) {
    super();
    
    this.runtime = runtime;
    this.options = {
      debugMode: false,
      profilingEnabled: false,
      mockingEnabled: true,
      isolationLevel: 'development',
      ...options
    };
    
    this.devSessions = new Map();
    this.debugSessions = new Map();
    this.mockRegistry = new Map();
    this.isStarted = false;
  }

  /**
   * Start the development runtime
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isStarted) return;
    
    try {
      // Initialize development environment
      await this._initializeDevEnvironment();
      
      this.isStarted = true;
      this.emit('dev-runtime:started');
    } catch (error) {
      this.emit('error', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop the development runtime
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isStarted) return;
    
    try {
      // Stop all development sessions
      for (const [sessionId] of this.devSessions) {
        await this.stopDevSession(sessionId);
      }
      
      this.isStarted = false;
      this.emit('dev-runtime:stopped');
    } catch (error) {
      this.emit('error', { error: error.message });
      throw error;
    }
  }

  /**
   * Execute app in development mode
   * @param {string} appPath - Path to the app directory
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async executeApp(appPath, options = {}) {
    if (!this.isStarted) {
      throw new Error('Development runtime not started');
    }

    const sessionId = this._generateSessionId(appPath);
    
    try {
      // Load app configuration
      const appConfig = await this._loadAppConfig(appPath);
      
      // Set up development session
      const session = await this._createDevSession(sessionId, appPath, appConfig, options);
      
      // Execute with development enhancements
      const result = await this._executeWithDevFeatures(session, options);
      
      this.emit('app:executed', { 
        sessionId, 
        appPath, 
        result,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      this.emit('app:execution:failed', { 
        sessionId, 
        appPath, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Start a development session
   * @param {string} appPath - Path to the app directory
   * @param {Object} options - Session options
   * @returns {Promise<string>} Session ID
   */
  async startDevSession(appPath, options = {}) {
    const sessionId = this._generateSessionId(appPath);
    
    if (this.devSessions.has(sessionId)) {
      return sessionId; // Session already exists
    }

    const appConfig = await this._loadAppConfig(appPath);
    const session = await this._createDevSession(sessionId, appPath, appConfig, options);
    
    this.devSessions.set(sessionId, session);
    
    this.emit('dev-session:started', { sessionId, appPath });
    return sessionId;
  }

  /**
   * Stop a development session
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} Success status
   */
  async stopDevSession(sessionId) {
    const session = this.devSessions.get(sessionId);
    if (!session) return false;
    
    try {
      // Clean up session resources
      if (session.debugSession) {
        await this._stopDebugSession(sessionId);
      }
      
      // Stop app if running
      if (session.appInstance) {
        await this._stopAppInstance(session);
      }
      
      this.devSessions.delete(sessionId);
      this.emit('dev-session:stopped', { sessionId });
      
      return true;
    } catch (error) {
      this.emit('dev-session:stop:failed', { sessionId, error: error.message });
      return false;
    }
  }

  /**
   * Enable debugging for a session
   * @param {string} sessionId - Session ID
   * @param {Object} debugOptions - Debug options
   * @returns {Promise<void>}
   */
  async enableDebugging(sessionId, debugOptions = {}) {
    const session = this.devSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const debugSession = {
      sessionId,
      breakpoints: new Set(),
      watchedVariables: new Map(),
      callStack: [],
      enabled: true,
      ...debugOptions
    };

    this.debugSessions.set(sessionId, debugSession);
    session.debugSession = debugSession;

    this.emit('debug:enabled', { sessionId });
  }

  /**
   * Disable debugging for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async disableDebugging(sessionId) {
    await this._stopDebugSession(sessionId);
    
    const session = this.devSessions.get(sessionId);
    if (session) {
      session.debugSession = null;
    }

    this.emit('debug:disabled', { sessionId });
  }

  /**
   * Add mock for development
   * @param {string} mockId - Mock identifier
   * @param {Object} mockConfig - Mock configuration
   * @returns {void}
   */
  addMock(mockId, mockConfig) {
    this.mockRegistry.set(mockId, {
      ...mockConfig,
      createdAt: new Date().toISOString()
    });
    
    this.emit('mock:added', { mockId, mockConfig });
  }

  /**
   * Remove mock
   * @param {string} mockId - Mock identifier
   * @returns {boolean} Success status
   */
  removeMock(mockId) {
    const removed = this.mockRegistry.delete(mockId);
    
    if (removed) {
      this.emit('mock:removed', { mockId });
    }
    
    return removed;
  }

  /**
   * Get development session info
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session info
   */
  getSessionInfo(sessionId) {
    const session = this.devSessions.get(sessionId);
    if (!session) return null;
    
    return {
      sessionId: session.sessionId,
      appPath: session.appPath,
      startedAt: session.startedAt,
      status: session.status,
      debugging: !!session.debugSession,
      options: session.options
    };
  }

  /**
   * Get all development sessions
   * @returns {Array<Object>} Session info list
   */
  getAllSessions() {
    return Array.from(this.devSessions.values()).map(session => 
      this.getSessionInfo(session.sessionId)
    );
  }

  /**
   * Get development statistics
   * @returns {Object} Development statistics
   */
  getStats() {
    return {
      isStarted: this.isStarted,
      activeSessions: this.devSessions.size,
      debugSessions: this.debugSessions.size,
      mocks: this.mockRegistry.size,
      options: this.options
    };
  }

  /**
   * Initialize development environment
   * @returns {Promise<void>}
   */
  async _initializeDevEnvironment() {
    // Set up development-specific configurations
    if (this.options.debugMode) {
      console.log('Development runtime started in debug mode');
    }
    
    // Initialize mock registry with common mocks
    if (this.options.mockingEnabled) {
      this._initializeCommonMocks();
    }
  }

  /**
   * Load app configuration
   * @param {string} appPath - Path to the app directory
   * @returns {Promise<Object>} App configuration
   */
  async _loadAppConfig(appPath) {
    try {
      const configPath = path.join(appPath, 'lahat.config.js');
      const { default: config } = await import(`file://${configPath}?t=${Date.now()}`);
      return config || {};
    } catch (error) {
      // Try package.json fallback
      try {
        const packagePath = path.join(appPath, 'package.json');
        const packageContent = await fs.readFile(packagePath, 'utf8');
        const packageJson = JSON.parse(packageContent);
        
        return {
          name: packageJson.name,
          version: packageJson.version,
          description: packageJson.description,
          permissions: ['lahat:storage'],
          mcpRequirements: []
        };
      } catch (fallbackError) {
        console.warn('No valid configuration found, using defaults');
        return {
          name: path.basename(appPath),
          version: '1.0.0',
          permissions: ['lahat:storage'],
          mcpRequirements: []
        };
      }
    }
  }

  /**
   * Create development session
   * @param {string} sessionId - Session ID
   * @param {string} appPath - App path
   * @param {Object} appConfig - App configuration
   * @param {Object} options - Session options
   * @returns {Promise<Object>} Session object
   */
  async _createDevSession(sessionId, appPath, appConfig, options) {
    const session = {
      sessionId,
      appPath,
      appConfig,
      options,
      startedAt: new Date().toISOString(),
      status: 'created',
      debugSession: null,
      appInstance: null,
      profiling: this.options.profilingEnabled ? {
        startTime: Date.now(),
        metrics: {}
      } : null
    };

    return session;
  }

  /**
   * Execute app with development features
   * @param {Object} session - Development session
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async _executeWithDevFeatures(session, options) {
    session.status = 'executing';
    
    try {
      // Apply development-specific configurations
      const devOptions = {
        ...options,
        devMode: true,
        isolation: this.options.isolationLevel,
        debugging: !!session.debugSession,
        mocking: this.options.mockingEnabled
      };

      // Add development APIs
      if (devOptions.mocking) {
        devOptions.mockRegistry = this.mockRegistry;
      }

      // Execute through the main runtime with dev enhancements
      const result = await this.runtime.executeApp(session.appConfig, session.appPath, devOptions);
      
      session.status = 'completed';
      session.appInstance = result.instance;

      return result;
    } catch (error) {
      session.status = 'failed';
      throw error;
    }
  }

  /**
   * Stop debug session
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async _stopDebugSession(sessionId) {
    const debugSession = this.debugSessions.get(sessionId);
    if (!debugSession) return;
    
    // Clean up debug resources
    debugSession.breakpoints.clear();
    debugSession.watchedVariables.clear();
    debugSession.callStack = [];
    
    this.debugSessions.delete(sessionId);
  }

  /**
   * Stop app instance
   * @param {Object} session - Session object
   * @returns {Promise<void>}
   */
  async _stopAppInstance(session) {
    if (session.appInstance && typeof session.appInstance.stop === 'function') {
      await session.appInstance.stop();
    }
    session.appInstance = null;
  }

  /**
   * Initialize common mocks
   */
  _initializeCommonMocks() {
    // Add common development mocks
    this.addMock('http-delay', {
      type: 'network',
      delay: 1000,
      description: 'Add 1s delay to HTTP requests'
    });

    this.addMock('storage-memory', {
      type: 'storage',
      backend: 'memory',
      description: 'Use in-memory storage instead of persistent'
    });

    this.addMock('mcp-offline', {
      type: 'mcp',
      mode: 'offline',
      description: 'Mock MCP servers for offline development'
    });
  }

  /**
   * Generate session ID
   * @param {string} appPath - App path
   * @returns {string} Session ID
   */
  _generateSessionId(appPath) {
    const basename = path.basename(appPath);
    const timestamp = Date.now();
    return `dev-${basename}-${timestamp}`;
  }
}
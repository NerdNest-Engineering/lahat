/**
 * Dev Runtime Island - Development tools and hot reload
 * Exports all development runtime functionality
 */

export { DevRuntime } from './DevRuntime.js';
export { HotReload } from './HotReload.js';
export { FileWatcher } from './FileWatcher.js';
export { IDEIntegration } from './IDEIntegration.js';

/**
 * Development Manager - Coordinated development functionality
 */
export class DevManager {
  constructor(runtime, options = {}) {
    this.runtime = runtime;
    this.options = {
      hotReloadEnabled: true,
      ideIntegrationEnabled: true,
      debugMode: false,
      ...options
    };
    
    // Initialize components
    this.devRuntime = new DevRuntime(runtime, this.options);
    this.hotReload = new HotReload(runtime, this.options);
    this.ideIntegration = new IDEIntegration(this.options);
    
    this.isStarted = false;
    this.watchingSessions = new Map();
    
    this._setupEventHandlers();
  }

  /**
   * Start the development manager
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isStarted) return;
    
    try {
      await this.devRuntime.start();
      
      if (this.options.ideIntegrationEnabled) {
        await this.ideIntegration.start();
      }
      
      this.isStarted = true;
      console.log('Development manager started');
    } catch (error) {
      console.error('Failed to start development manager:', error);
      throw error;
    }
  }

  /**
   * Stop the development manager
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isStarted) return;
    
    try {
      // Stop all hot reload sessions
      await this.hotReload.stopAll();
      
      // Stop dev runtime
      await this.devRuntime.stop();
      
      // Stop IDE integration
      if (this.options.ideIntegrationEnabled) {
        await this.ideIntegration.stop();
      }
      
      this.isStarted = false;
      console.log('Development manager stopped');
    } catch (error) {
      console.error('Failed to stop development manager:', error);
      throw error;
    }
  }

  /**
   * Start development session for an app
   * @param {string} appId - App identifier
   * @param {string} appPath - Path to the app directory
   * @param {Object} appConfig - App configuration
   * @returns {Promise<void>}
   */
  async startDevSession(appId, appPath, appConfig) {
    if (!this.isStarted) {
      throw new Error('Development manager not started');
    }

    // Start hot reload if enabled
    if (this.options.hotReloadEnabled) {
      await this.hotReload.startWatching(appId, appPath, appConfig);
    }

    // Register session
    this.watchingSessions.set(appId, {
      appId,
      appPath,
      appConfig,
      startedAt: new Date().toISOString()
    });

    console.log(`Development session started for app: ${appId}`);
  }

  /**
   * Stop development session for an app
   * @param {string} appId - App identifier
   * @returns {Promise<void>}
   */
  async stopDevSession(appId) {
    if (!this.watchingSessions.has(appId)) {
      return;
    }

    // Stop hot reload
    await this.hotReload.stopWatching(appId);
    
    // Remove session
    this.watchingSessions.delete(appId);

    console.log(`Development session stopped for app: ${appId}`);
  }

  /**
   * Open app in IDE
   * @param {string} appPath - Path to the app directory
   * @param {Object} options - IDE options
   * @returns {Promise<void>}
   */
  async openInIDE(appPath, options = {}) {
    if (!this.options.ideIntegrationEnabled) {
      throw new Error('IDE integration is disabled');
    }

    return await this.ideIntegration.openProject(appPath, options);
  }

  /**
   * Execute app in development mode
   * @param {string} appPath - Path to the app directory
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async executeInDevMode(appPath, options = {}) {
    return await this.devRuntime.executeApp(appPath, {
      ...options,
      devMode: true,
      hotReload: this.options.hotReloadEnabled
    });
  }

  /**
   * Get development statistics
   * @returns {Object} Development statistics
   */
  getDevStats() {
    return {
      isStarted: this.isStarted,
      activeSessions: this.watchingSessions.size,
      sessions: Array.from(this.watchingSessions.values()),
      hotReloadStatus: this.hotReload.getWatchingStatus(),
      ideIntegration: {
        enabled: this.options.ideIntegrationEnabled,
        available: this.ideIntegration.isAvailable()
      }
    };
  }

  /**
   * Enable hot reload for an app
   * @param {string} appId - App identifier
   * @returns {Promise<void>}
   */
  async enableHotReload(appId) {
    this.hotReload.enable();
    
    const session = this.watchingSessions.get(appId);
    if (session) {
      await this.hotReload.startWatching(appId, session.appPath, session.appConfig);
    }
  }

  /**
   * Disable hot reload for an app
   * @param {string} appId - App identifier
   * @returns {Promise<void>}
   */
  async disableHotReload(appId) {
    await this.hotReload.stopWatching(appId);
  }

  /**
   * Set up event handlers
   */
  _setupEventHandlers() {
    // Hot reload events
    this.hotReload.on('watching:started', (data) => {
      console.log(`Hot reload started for app: ${data.appId}`);
    });

    this.hotReload.on('watching:stopped', (data) => {
      console.log(`Hot reload stopped for app: ${data.appId}`);
    });

    this.hotReload.on('files:changed', (data) => {
      if (this.options.debugMode) {
        console.log(`Files changed in app ${data.appId}:`, data.changes);
      }
    });

    this.hotReload.on('reload:starting', (data) => {
      console.log(`Reloading app ${data.appId}...`);
    });

    this.hotReload.on('reload:completed', (data) => {
      console.log(`App ${data.appId} reloaded successfully (${data.strategy})`);
    });

    this.hotReload.on('reload:failed', (data) => {
      console.error(`Hot reload failed for app ${data.appId}:`, data.error);
    });

    // Dev runtime events
    this.devRuntime.on('app:executed', (data) => {
      if (this.options.debugMode) {
        console.log(`App executed in dev mode: ${data.appPath}`);
      }
    });

    this.devRuntime.on('error', (data) => {
      console.error('Dev runtime error:', data.error);
    });

    // IDE integration events
    this.ideIntegration.on('project:opened', (data) => {
      console.log(`Project opened in IDE: ${data.path}`);
    });

    this.ideIntegration.on('ide:error', (data) => {
      console.warn('IDE integration error:', data.error);
    });
  }
}

// Create default development manager instance (will be initialized when runtime is available)
export let devManager = null;

/**
 * Initialize development manager with runtime
 * @param {Object} runtime - Runtime instance
 * @param {Object} options - Options
 * @returns {DevManager} Development manager instance
 */
export function initializeDevManager(runtime, options = {}) {
  devManager = new DevManager(runtime, options);
  return devManager;
}

export default DevManager;
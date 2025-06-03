/**
 * Hot Reload - Live updates during development
 * Watches for file changes and reloads mini apps automatically
 */

import { EventEmitter } from 'events';
import { FileWatcher } from './FileWatcher.js';

export class HotReload extends EventEmitter {
  constructor(runtime, options = {}) {
    super();
    
    this.runtime = runtime;
    this.options = {
      enabled: true,
      debounceDelay: 300,
      watchPatterns: ['**/*.js', '**/*.html', '**/*.css', '**/*.json'],
      ignorePatterns: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      ...options
    };
    
    this.watchers = new Map();
    this.reloadTimers = new Map();
    this.appContexts = new Map();
  }

  /**
   * Start hot reload for an app
   * @param {string} appId - App identifier
   * @param {string} appPath - Path to the app directory
   * @param {Object} appConfig - App configuration
   * @returns {Promise<void>}
   */
  async startWatching(appId, appPath, appConfig) {
    if (!this.options.enabled) {
      return;
    }

    // Stop existing watcher if any
    await this.stopWatching(appId);

    const watcher = new FileWatcher({
      watchPaths: [appPath],
      patterns: this.options.watchPatterns,
      ignore: this.options.ignorePatterns,
      debounceDelay: this.options.debounceDelay
    });

    // Store app context
    this.appContexts.set(appId, {
      appPath,
      appConfig,
      lastReload: Date.now()
    });

    // Set up file change handler
    watcher.on('change', (changes) => {
      this._handleFileChanges(appId, changes);
    });

    watcher.on('error', (error) => {
      this.emit('error', { appId, error });
    });

    // Start watching
    await watcher.start();
    this.watchers.set(appId, watcher);

    this.emit('watching:started', { appId, appPath });
  }

  /**
   * Stop hot reload for an app
   * @param {string} appId - App identifier
   * @returns {Promise<void>}
   */
  async stopWatching(appId) {
    const watcher = this.watchers.get(appId);
    if (watcher) {
      await watcher.stop();
      this.watchers.delete(appId);
    }

    // Clear any pending reload timers
    const timer = this.reloadTimers.get(appId);
    if (timer) {
      clearTimeout(timer);
      this.reloadTimers.delete(timer);
    }

    this.appContexts.delete(appId);
    this.emit('watching:stopped', { appId });
  }

  /**
   * Handle file changes for an app
   * @param {string} appId - App identifier
   * @param {Array<Object>} changes - File changes
   */
  _handleFileChanges(appId, changes) {
    const context = this.appContexts.get(appId);
    if (!context) return;

    // Categorize changes
    const changeTypes = this._categorizeChanges(changes);
    
    // Emit change event
    this.emit('files:changed', { 
      appId, 
      changes: changeTypes,
      timestamp: Date.now()
    });

    // Clear existing reload timer
    const existingTimer = this.reloadTimers.get(appId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new reload timer with debouncing
    const timer = setTimeout(() => {
      this._performReload(appId, changeTypes);
      this.reloadTimers.delete(appId);
    }, this.options.debounceDelay);

    this.reloadTimers.set(appId, timer);
  }

  /**
   * Categorize file changes by type
   * @param {Array<Object>} changes - File changes
   * @returns {Object} Categorized changes
   */
  _categorizeChanges(changes) {
    const categories = {
      javascript: [],
      html: [],
      css: [],
      config: [],
      assets: [],
      other: []
    };

    for (const change of changes) {
      const extension = change.path.split('.').pop().toLowerCase();
      
      switch (extension) {
        case 'js':
        case 'mjs':
        case 'jsx':
          categories.javascript.push(change);
          break;
        case 'html':
        case 'htm':
          categories.html.push(change);
          break;
        case 'css':
        case 'scss':
        case 'sass':
        case 'less':
          categories.css.push(change);
          break;
        case 'json':
        case 'config':
          if (change.path.includes('lahat.config') || 
              change.path.includes('package.json')) {
            categories.config.push(change);
          } else {
            categories.other.push(change);
          }
          break;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
        case 'webp':
          categories.assets.push(change);
          break;
        default:
          categories.other.push(change);
      }
    }

    return categories;
  }

  /**
   * Perform hot reload for an app
   * @param {string} appId - App identifier
   * @param {Object} changeTypes - Categorized changes
   */
  async _performReload(appId, changeTypes) {
    const context = this.appContexts.get(appId);
    if (!context) return;

    try {
      this.emit('reload:starting', { appId, changeTypes });

      // Determine reload strategy based on changes
      const strategy = this._determineReloadStrategy(changeTypes);
      
      switch (strategy) {
        case 'full':
          await this._performFullReload(appId, context);
          break;
        case 'partial':
          await this._performPartialReload(appId, context, changeTypes);
          break;
        case 'assets':
          await this._performAssetReload(appId, context, changeTypes);
          break;
        default:
          console.warn(`Unknown reload strategy: ${strategy}`);
      }

      context.lastReload = Date.now();
      this.emit('reload:completed', { appId, strategy, timestamp: context.lastReload });

    } catch (error) {
      this.emit('reload:failed', { appId, error });
      console.error(`Hot reload failed for app ${appId}:`, error);
    }
  }

  /**
   * Determine the appropriate reload strategy
   * @param {Object} changeTypes - Categorized changes
   * @returns {string} Reload strategy
   */
  _determineReloadStrategy(changeTypes) {
    // Full reload needed for config changes or JavaScript changes
    if (changeTypes.config.length > 0 || changeTypes.javascript.length > 0) {
      return 'full';
    }

    // Partial reload for HTML/CSS changes
    if (changeTypes.html.length > 0 || changeTypes.css.length > 0) {
      return 'partial';
    }

    // Asset reload for images and other assets
    if (changeTypes.assets.length > 0) {
      return 'assets';
    }

    // Default to full reload
    return 'full';
  }

  /**
   * Perform full app reload
   * @param {string} appId - App identifier
   * @param {Object} context - App context
   */
  async _performFullReload(appId, context) {
    // Stop the app if it's running
    if (this.runtime.runningApps.has(appId)) {
      await this.runtime.stopApp(appId);
    }

    // Reload app configuration
    const appConfig = await this._reloadAppConfig(context.appPath);
    context.appConfig = appConfig;

    // Clear module cache for the app
    this._clearModuleCache(context.appPath);

    // Restart the app
    await this.runtime.executeApp(appConfig, context.appPath);
  }

  /**
   * Perform partial reload (UI only)
   * @param {string} appId - App identifier
   * @param {Object} context - App context
   * @param {Object} changeTypes - Categorized changes
   */
  async _performPartialReload(appId, context, changeTypes) {
    // For now, treat partial reload same as full reload
    // In the future, this could reload only UI components
    await this._performFullReload(appId, context);
  }

  /**
   * Perform asset reload
   * @param {string} appId - App identifier
   * @param {Object} context - App context
   * @param {Object} changeTypes - Categorized changes
   */
  async _performAssetReload(appId, context, changeTypes) {
    // For assets, we might just need to notify the app
    // that assets have changed, without full reload
    this.emit('assets:updated', { 
      appId, 
      assets: changeTypes.assets.map(change => change.path)
    });
  }

  /**
   * Reload app configuration from disk
   * @param {string} appPath - Path to the app directory
   * @returns {Promise<Object>} App configuration
   */
  async _reloadAppConfig(appPath) {
    try {
      // Re-import the config with cache busting
      const configPath = `file://${appPath}/lahat.config.js?t=${Date.now()}`;
      const { default: config } = await import(configPath);
      return config;
    } catch (error) {
      console.warn('Failed to reload app config:', error);
      return {};
    }
  }

  /**
   * Clear Node.js module cache for app files
   * @param {string} appPath - Path to the app directory
   */
  _clearModuleCache(appPath) {
    // In ES modules, we can't directly clear cache like with CommonJS
    // The cache busting in import URLs handles this
    console.log(`Module cache clearing simulated for: ${appPath}`);
  }

  /**
   * Get watching status for all apps
   * @returns {Object} Watching status
   */
  getWatchingStatus() {
    const status = {};
    
    for (const [appId, context] of this.appContexts) {
      status[appId] = {
        watching: this.watchers.has(appId),
        appPath: context.appPath,
        lastReload: context.lastReload,
        uptime: Date.now() - context.lastReload
      };
    }
    
    return status;
  }

  /**
   * Enable hot reload
   */
  enable() {
    this.options.enabled = true;
    this.emit('hotreload:enabled');
  }

  /**
   * Disable hot reload
   */
  disable() {
    this.options.enabled = false;
    this.emit('hotreload:disabled');
  }

  /**
   * Stop watching all apps
   */
  async stopAll() {
    const appIds = Array.from(this.watchers.keys());
    
    await Promise.all(
      appIds.map(appId => this.stopWatching(appId))
    );
  }
}
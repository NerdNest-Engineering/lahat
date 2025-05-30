/**
 * Development API - Development-specific APIs for mini apps
 * Provides debugging, logging, and development utilities
 */

export class DevAPI {
  constructor(runtime, hotReload) {
    this.runtime = runtime;
    this.hotReload = hotReload;
    this.devMode = runtime.options.mode === 'development';
  }

  /**
   * Get development utilities for apps
   * @param {string} appId - App identifier
   * @returns {Object} Development utilities
   */
  createDevInterface(appId) {
    return {
      /**
       * Enhanced logging with timestamps and app context
       */
      log: this._createLogger(appId),

      /**
       * Hot reload controls
       */
      hotReload: {
        isEnabled: () => this.hotReload.options.enabled,
        enable: () => this.hotReload.enable(),
        disable: () => this.hotReload.disable(),
        trigger: () => this._triggerManualReload(appId),
        getStatus: () => this.hotReload.getWatchingStatus()[appId]
      },

      /**
       * Development performance monitoring
       */
      perf: {
        mark: (name) => this._performanceMark(appId, name),
        measure: (name, startMark, endMark) => this._performanceMeasure(appId, name, startMark, endMark),
        getMetrics: () => this._getPerformanceMetrics(appId),
        clearMetrics: () => this._clearPerformanceMetrics(appId)
      },

      /**
       * Memory monitoring
       */
      memory: {
        getUsage: () => this._getMemoryUsage(appId),
        gc: () => this._triggerGarbageCollection(),
        getHeapSnapshot: () => this._getHeapSnapshot(appId)
      },

      /**
       * Development debugging tools
       */
      debug: {
        inspect: (obj, options) => this._inspectObject(obj, options),
        trace: (label) => this._trace(appId, label),
        assert: (condition, message) => this._assert(appId, condition, message),
        breakpoint: () => this._debugBreakpoint(appId)
      },

      /**
       * File system utilities for development
       */
      fs: {
        watch: (path, callback) => this._watchFile(appId, path, callback),
        unwatch: (path) => this._unwatchFile(appId, path),
        readConfig: () => this._readAppConfig(appId),
        writeConfig: (config) => this._writeAppConfig(appId, config)
      },

      /**
       * Development server utilities
       */
      server: {
        start: (port, options) => this._startDevServer(appId, port, options),
        stop: () => this._stopDevServer(appId),
        getPort: () => this._getDevServerPort(appId),
        isRunning: () => this._isDevServerRunning(appId)
      }
    };
  }

  /**
   * Create enhanced logger for development
   * @param {string} appId - App identifier
   * @returns {Object} Logger interface
   */
  _createLogger(appId) {
    const createLogMethod = (level) => {
      return (...args) => {
        if (!this.devMode) return;

        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${appId}] [${level.toUpperCase()}]`;
        
        console[level](prefix, ...args);
        
        // Store log for debugging
        this._storeLog(appId, level, args, timestamp);
      };
    };

    return {
      debug: createLogMethod('debug'),
      info: createLogMethod('info'),
      warn: createLogMethod('warn'),
      error: createLogMethod('error'),
      trace: createLogMethod('trace'),
      
      // Get stored logs
      getLogs: (filter) => this._getStoredLogs(appId, filter),
      clearLogs: () => this._clearStoredLogs(appId)
    };
  }

  /**
   * Store log entry for debugging
   * @param {string} appId - App identifier
   * @param {string} level - Log level
   * @param {Array} args - Log arguments
   * @param {string} timestamp - Log timestamp
   */
  _storeLog(appId, level, args, timestamp) {
    if (!this.logStorage) {
      this.logStorage = new Map();
    }

    if (!this.logStorage.has(appId)) {
      this.logStorage.set(appId, []);
    }

    const logs = this.logStorage.get(appId);
    logs.push({
      level,
      args,
      timestamp,
      message: args.join(' ')
    });

    // Keep only last 1000 logs per app
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }
  }

  /**
   * Get stored logs for an app
   * @param {string} appId - App identifier
   * @param {Object} filter - Log filter options
   * @returns {Array} Filtered logs
   */
  _getStoredLogs(appId, filter = {}) {
    if (!this.logStorage || !this.logStorage.has(appId)) {
      return [];
    }

    let logs = this.logStorage.get(appId);

    if (filter.level) {
      logs = logs.filter(log => log.level === filter.level);
    }

    if (filter.since) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(filter.since));
    }

    if (filter.limit) {
      logs = logs.slice(-filter.limit);
    }

    return logs;
  }

  /**
   * Clear stored logs for an app
   * @param {string} appId - App identifier
   */
  _clearStoredLogs(appId) {
    if (this.logStorage) {
      this.logStorage.delete(appId);
    }
  }

  /**
   * Trigger manual hot reload
   * @param {string} appId - App identifier
   */
  async _triggerManualReload(appId) {
    if (!this.devMode) return;

    try {
      const context = this.hotReload.appContexts.get(appId);
      if (context) {
        await this.hotReload._performFullReload(appId, context);
      }
    } catch (error) {
      console.error(`Manual reload failed for ${appId}:`, error);
    }
  }

  /**
   * Create performance mark
   * @param {string} appId - App identifier
   * @param {string} name - Mark name
   */
  _performanceMark(appId, name) {
    if (!this.devMode) return;

    const fullName = `${appId}:${name}`;
    performance.mark(fullName);
  }

  /**
   * Create performance measure
   * @param {string} appId - App identifier
   * @param {string} name - Measure name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   */
  _performanceMeasure(appId, name, startMark, endMark) {
    if (!this.devMode) return;

    const fullName = `${appId}:${name}`;
    const fullStartMark = startMark ? `${appId}:${startMark}` : undefined;
    const fullEndMark = endMark ? `${appId}:${endMark}` : undefined;

    try {
      performance.measure(fullName, fullStartMark, fullEndMark);
    } catch (error) {
      console.warn('Performance measure failed:', error);
    }
  }

  /**
   * Get performance metrics for an app
   * @param {string} appId - App identifier
   * @returns {Array} Performance metrics
   */
  _getPerformanceMetrics(appId) {
    if (!this.devMode) return [];

    const entries = performance.getEntriesByType('measure');
    return entries.filter(entry => entry.name.startsWith(`${appId}:`));
  }

  /**
   * Clear performance metrics for an app
   * @param {string} appId - App identifier
   */
  _clearPerformanceMetrics(appId) {
    if (!this.devMode) return;

    const entries = performance.getEntriesByType('measure');
    const appEntries = entries.filter(entry => entry.name.startsWith(`${appId}:`));
    
    appEntries.forEach(entry => {
      performance.clearMeasures(entry.name);
    });

    const marks = performance.getEntriesByType('mark');
    const appMarks = marks.filter(mark => mark.name.startsWith(`${appId}:`));
    
    appMarks.forEach(mark => {
      performance.clearMarks(mark.name);
    });
  }

  /**
   * Get memory usage for an app
   * @param {string} appId - App identifier
   * @returns {Object} Memory usage information
   */
  _getMemoryUsage(appId) {
    if (!this.devMode) return {};

    const memUsage = process.memoryUsage();
    return {
      appId,
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers
    };
  }

  /**
   * Trigger garbage collection (if available)
   */
  _triggerGarbageCollection() {
    if (!this.devMode) return;

    if (global.gc) {
      global.gc();
    } else {
      console.warn('Garbage collection not available. Run with --expose-gc flag.');
    }
  }

  /**
   * Inspect object for debugging
   * @param {any} obj - Object to inspect
   * @param {Object} options - Inspection options
   * @returns {string} Inspected object string
   */
  _inspectObject(obj, options = {}) {
    if (!this.devMode) return '';

    const util = require('util');
    return util.inspect(obj, {
      depth: 3,
      colors: true,
      showHidden: false,
      ...options
    });
  }

  /**
   * Create stack trace
   * @param {string} appId - App identifier
   * @param {string} label - Trace label
   */
  _trace(appId, label = 'Trace') {
    if (!this.devMode) return;

    console.trace(`[${appId}] ${label}`);
  }

  /**
   * Development assertion
   * @param {string} appId - App identifier
   * @param {boolean} condition - Condition to assert
   * @param {string} message - Assertion message
   */
  _assert(appId, condition, message) {
    if (!this.devMode) return;

    if (!condition) {
      const error = new Error(`[${appId}] Assertion failed: ${message}`);
      console.error(error);
      throw error;
    }
  }

  /**
   * Create debug breakpoint
   * @param {string} appId - App identifier
   */
  _debugBreakpoint(appId) {
    if (!this.devMode) return;

    console.log(`[${appId}] Debug breakpoint hit`);
    debugger; // This will break if debugger is attached
  }

  /**
   * Check if development mode is enabled
   * @returns {boolean} Whether in development mode
   */
  isDevMode() {
    return this.devMode;
  }
}
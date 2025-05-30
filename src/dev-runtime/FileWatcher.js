/**
 * File Watcher - Watches for file changes with glob pattern support
 * Provides efficient file system monitoring with configurable patterns
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { watch } from 'chokidar';

export class FileWatcher extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      watchPaths: ['.'],
      patterns: ['**/*'],
      ignore: ['**/node_modules/**', '**/.git/**'],
      debounceDelay: 100,
      persistent: true,
      ...options
    };
    
    this.watcher = null;
    this.changeBuffer = new Map();
    this.debounceTimer = null;
  }

  /**
   * Start watching for file changes
   * @returns {Promise<void>}
   */
  async start() {
    if (this.watcher) {
      await this.stop();
    }

    try {
      this.watcher = watch(this.options.watchPaths, {
        ignored: this.options.ignore,
        persistent: this.options.persistent,
        ignoreInitial: true,
        followSymlinks: false,
        depth: 99,
        atomic: true,
        usePolling: false,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 100
        }
      });

      this._setupEventHandlers();
      
      await new Promise((resolve, reject) => {
        this.watcher.on('ready', resolve);
        this.watcher.on('error', reject);
      });

      this.emit('started');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop watching for file changes
   * @returns {Promise<void>}
   */
  async stop() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.changeBuffer.clear();
    this.emit('stopped');
  }

  /**
   * Setup event handlers for the file watcher
   */
  _setupEventHandlers() {
    this.watcher.on('add', (filePath) => {
      this._handleFileChange('add', filePath);
    });

    this.watcher.on('change', (filePath) => {
      this._handleFileChange('change', filePath);
    });

    this.watcher.on('unlink', (filePath) => {
      this._handleFileChange('unlink', filePath);
    });

    this.watcher.on('addDir', (dirPath) => {
      this._handleFileChange('addDir', dirPath);
    });

    this.watcher.on('unlinkDir', (dirPath) => {
      this._handleFileChange('unlinkDir', dirPath);
    });

    this.watcher.on('error', (error) => {
      this.emit('error', error);
    });
  }

  /**
   * Handle individual file change events
   * @param {string} eventType - Type of change event
   * @param {string} filePath - Path to the changed file
   */
  _handleFileChange(eventType, filePath) {
    // Check if file matches our patterns
    if (!this._matchesPatterns(filePath)) {
      return;
    }

    // Add to change buffer
    this.changeBuffer.set(filePath, {
      type: eventType,
      path: filePath,
      timestamp: Date.now()
    });

    // Debounce change events
    this._debounceChanges();
  }

  /**
   * Check if file path matches watch patterns
   * @param {string} filePath - File path to check
   * @returns {boolean} Whether file matches patterns
   */
  _matchesPatterns(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Check ignore patterns first
    for (const ignorePattern of this.options.ignore) {
      if (this._matchesGlob(relativePath, ignorePattern)) {
        return false;
      }
    }

    // Check include patterns
    for (const pattern of this.options.patterns) {
      if (this._matchesGlob(relativePath, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Simple glob pattern matching
   * @param {string} filePath - File path to check
   * @param {string} pattern - Glob pattern
   * @returns {boolean} Whether path matches pattern
   */
  _matchesGlob(filePath, pattern) {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]')
      .replace(/\//g, '\\/');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  /**
   * Debounce file change events
   */
  _debounceChanges() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this._flushChanges();
      this.debounceTimer = null;
    }, this.options.debounceDelay);
  }

  /**
   * Flush accumulated changes and emit change event
   */
  _flushChanges() {
    if (this.changeBuffer.size === 0) {
      return;
    }

    const changes = Array.from(this.changeBuffer.values());
    this.changeBuffer.clear();

    // Group changes by type for easier processing
    const groupedChanges = this._groupChangesByType(changes);

    this.emit('change', changes, groupedChanges);
  }

  /**
   * Group changes by event type
   * @param {Array<Object>} changes - Array of change objects
   * @returns {Object} Changes grouped by type
   */
  _groupChangesByType(changes) {
    const grouped = {
      added: [],
      changed: [],
      removed: [],
      addedDir: [],
      removedDir: []
    };

    for (const change of changes) {
      switch (change.type) {
        case 'add':
          grouped.added.push(change);
          break;
        case 'change':
          grouped.changed.push(change);
          break;
        case 'unlink':
          grouped.removed.push(change);
          break;
        case 'addDir':
          grouped.addedDir.push(change);
          break;
        case 'unlinkDir':
          grouped.removedDir.push(change);
          break;
      }
    }

    return grouped;
  }

  /**
   * Get current watch status
   * @returns {Object} Watch status information
   */
  getStatus() {
    return {
      watching: !!this.watcher,
      watchPaths: this.options.watchPaths,
      patterns: this.options.patterns,
      ignore: this.options.ignore,
      pendingChanges: this.changeBuffer.size
    };
  }

  /**
   * Add watch path
   * @param {string} watchPath - Path to add to watch list
   */
  addPath(watchPath) {
    if (this.watcher) {
      this.watcher.add(watchPath);
    }
    
    if (!this.options.watchPaths.includes(watchPath)) {
      this.options.watchPaths.push(watchPath);
    }
  }

  /**
   * Remove watch path
   * @param {string} watchPath - Path to remove from watch list
   */
  removePath(watchPath) {
    if (this.watcher) {
      this.watcher.unwatch(watchPath);
    }
    
    const index = this.options.watchPaths.indexOf(watchPath);
    if (index !== -1) {
      this.options.watchPaths.splice(index, 1);
    }
  }

  /**
   * Update watch patterns
   * @param {Array<string>} patterns - New patterns to watch
   */
  updatePatterns(patterns) {
    this.options.patterns = patterns;
  }

  /**
   * Update ignore patterns
   * @param {Array<string>} ignorePatterns - New patterns to ignore
   */
  updateIgnorePatterns(ignorePatterns) {
    this.options.ignore = ignorePatterns;
  }
}
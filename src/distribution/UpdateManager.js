/**
 * Update Manager - Handle app updates
 * Manages checking for, downloading, and applying app updates
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class UpdateManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      checkInterval: 24 * 60 * 60 * 1000, // 24 hours
      autoUpdate: false,
      updateSource: 'registry', // 'registry', 'p2p', 'manual'
      maxConcurrentUpdates: 3,
      retryAttempts: 3,
      ...options
    };
    
    this.updateQueue = [];
    this.activeUpdates = new Map();
    this.updateHistory = new Map();
    this.updateTimer = null;
    this.projectManager = null;
  }

  /**
   * Set project manager dependency
   * @param {ProjectManager} projectManager - Project manager instance
   */
  setProjectManager(projectManager) {
    this.projectManager = projectManager;
  }

  /**
   * Start the update manager
   * @returns {Promise<void>}
   */
  async start() {
    if (this.updateTimer) return;
    
    // Start periodic update checks
    this.updateTimer = setInterval(() => {
      this._performUpdateCheck();
    }, this.options.checkInterval);
    
    // Initial check
    await this._performUpdateCheck();
    
    this.emit('update_manager:started');
  }

  /**
   * Stop the update manager
   */
  stop() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    // Cancel all active updates
    for (const [appId] of this.activeUpdates) {
      this.cancelUpdate(appId);
    }
    
    this.emit('update_manager:stopped');
  }

  /**
   * Check for updates for all installed apps
   * @returns {Promise<Array>} Available updates
   */
  async checkForUpdates() {
    if (!this.projectManager) {
      throw new Error('Project manager not available');
    }

    const apps = this.projectManager.getApps();
    const availableUpdates = [];

    for (const app of apps) {
      try {
        const updateInfo = await this._checkAppForUpdates(app);
        if (updateInfo) {
          availableUpdates.push(updateInfo);
        }
      } catch (error) {
        this.emit('update_check:failed', { 
          appId: app.id, 
          error: error.message 
        });
      }
    }

    this.emit('updates:checked', { 
      totalApps: apps.length, 
      updatesAvailable: availableUpdates.length,
      updates: availableUpdates
    });

    return availableUpdates;
  }

  /**
   * Check for updates for a specific app
   * @param {string} appId - App ID to check
   * @returns {Promise<Object|null>} Update information or null
   */
  async checkAppForUpdates(appId) {
    if (!this.projectManager) {
      throw new Error('Project manager not available');
    }

    const app = this.projectManager.getApp(appId);
    if (!app) {
      throw new Error(`App ${appId} not found`);
    }

    return await this._checkAppForUpdates(app);
  }

  /**
   * Queue an app for update
   * @param {string} appId - App ID to update
   * @param {Object} updateInfo - Update information
   * @param {Object} options - Update options
   * @returns {Promise<void>}
   */
  async queueUpdate(appId, updateInfo, options = {}) {
    // Check if already queued or updating
    if (this.updateQueue.some(item => item.appId === appId) || 
        this.activeUpdates.has(appId)) {
      throw new Error(`Update already queued or in progress for app ${appId}`);
    }

    const updateItem = {
      appId,
      updateInfo,
      options,
      queuedAt: Date.now(),
      retryCount: 0
    };

    this.updateQueue.push(updateItem);
    this.emit('update:queued', updateItem);

    // Process queue
    this._processUpdateQueue();
  }

  /**
   * Cancel a queued or active update
   * @param {string} appId - App ID
   * @returns {boolean} Whether update was cancelled
   */
  cancelUpdate(appId) {
    // Remove from queue
    const queueIndex = this.updateQueue.findIndex(item => item.appId === appId);
    if (queueIndex !== -1) {
      const cancelledItem = this.updateQueue.splice(queueIndex, 1)[0];
      this.emit('update:cancelled', { appId, reason: 'user_cancelled' });
      return true;
    }

    // Cancel active update
    if (this.activeUpdates.has(appId)) {
      const updateInfo = this.activeUpdates.get(appId);
      updateInfo.cancelled = true;
      this.activeUpdates.delete(appId);
      this.emit('update:cancelled', { appId, reason: 'user_cancelled' });
      return true;
    }

    return false;
  }

  /**
   * Update an app immediately
   * @param {string} appId - App ID to update
   * @param {Object} updateInfo - Update information
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Update result
   */
  async updateApp(appId, updateInfo, options = {}) {
    if (this.activeUpdates.has(appId)) {
      throw new Error(`Update already in progress for app ${appId}`);
    }

    try {
      this.activeUpdates.set(appId, {
        startTime: Date.now(),
        updateInfo,
        options,
        cancelled: false
      });

      this.emit('update:started', { appId, updateInfo });

      // Download update package
      const packagePath = await this._downloadUpdate(appId, updateInfo);

      // Verify package integrity
      await this._verifyUpdatePackage(packagePath, updateInfo);

      // Apply the update
      const result = await this.projectManager.updateApp(appId, packagePath, options);

      // Record update history
      this._recordUpdateHistory(appId, updateInfo, result);

      // Clean up downloaded package
      await this._cleanupUpdatePackage(packagePath);

      this.activeUpdates.delete(appId);
      this.emit('update:completed', { appId, result });

      return result;
    } catch (error) {
      this.activeUpdates.delete(appId);
      this.emit('update:failed', { appId, error: error.message });
      throw error;
    }
  }

  /**
   * Get update status for an app
   * @param {string} appId - App ID
   * @returns {Object|null} Update status
   */
  getUpdateStatus(appId) {
    // Check if actively updating
    if (this.activeUpdates.has(appId)) {
      return {
        status: 'updating',
        ...this.activeUpdates.get(appId)
      };
    }

    // Check if queued
    const queuedItem = this.updateQueue.find(item => item.appId === appId);
    if (queuedItem) {
      return {
        status: 'queued',
        position: this.updateQueue.indexOf(queuedItem) + 1,
        ...queuedItem
      };
    }

    return null;
  }

  /**
   * Get update history for an app
   * @param {string} appId - App ID
   * @returns {Array} Update history
   */
  getUpdateHistory(appId) {
    return this.updateHistory.get(appId) || [];
  }

  /**
   * Get all queued updates
   * @returns {Array} Queued updates
   */
  getQueuedUpdates() {
    return [...this.updateQueue];
  }

  /**
   * Get all active updates
   * @returns {Array} Active updates
   */
  getActiveUpdates() {
    return Array.from(this.activeUpdates.entries()).map(([appId, info]) => ({
      appId,
      ...info
    }));
  }

  /**
   * Get update manager statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      queuedUpdates: this.updateQueue.length,
      activeUpdates: this.activeUpdates.size,
      totalUpdatesProcessed: Array.from(this.updateHistory.values())
        .reduce((sum, history) => sum + history.length, 0),
      autoUpdateEnabled: this.options.autoUpdate,
      lastCheckTime: this.lastCheckTime || null
    };
  }

  /**
   * Perform periodic update check
   * @returns {Promise<void>}
   */
  async _performUpdateCheck() {
    try {
      this.lastCheckTime = Date.now();
      const updates = await this.checkForUpdates();

      // Auto-update if enabled
      if (this.options.autoUpdate && updates.length > 0) {
        for (const update of updates) {
          try {
            await this.queueUpdate(update.appId, update);
          } catch (error) {
            console.warn(`Failed to queue auto-update for ${update.appId}:`, error);
          }
        }
      }
    } catch (error) {
      this.emit('update_check:failed', { error: error.message });
    }
  }

  /**
   * Check app for updates
   * @param {Object} app - App information
   * @returns {Promise<Object|null>} Update information or null
   */
  async _checkAppForUpdates(app) {
    try {
      // Mock update check - in real implementation this would:
      // - Check registry/repository for newer versions
      // - Compare semantic versions
      // - Get download information
      
      const currentVersion = app.manifest.app.version;
      const availableVersion = await this._getLatestVersion(app);
      
      if (availableVersion && this._isNewerVersion(availableVersion, currentVersion)) {
        return {
          appId: app.id,
          appName: app.manifest.app.name,
          currentVersion,
          availableVersion,
          updateSize: Math.floor(Math.random() * 10 * 1024 * 1024), // Mock size
          releaseNotes: `Update to version ${availableVersion}`,
          downloadUrl: `https://updates.example.com/${app.id}/${availableVersion}.lahat`,
          checksum: crypto.createHash('sha256').update(availableVersion).digest('hex'),
          critical: false,
          checkedAt: Date.now()
        };
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to check updates for ${app.id}: ${error.message}`);
    }
  }

  /**
   * Get latest version for an app
   * @param {Object} app - App information
   * @returns {Promise<string|null>} Latest version or null
   */
  async _getLatestVersion(app) {
    // Mock implementation - in reality this would query a registry
    const currentVersion = app.manifest.app.version;
    const versionParts = currentVersion.split('.').map(Number);
    
    // Randomly decide if there's an update (for demo purposes)
    if (Math.random() > 0.7) { // 30% chance of update
      versionParts[2]++; // Increment patch version
      return versionParts.join('.');
    }
    
    return null;
  }

  /**
   * Check if version is newer
   * @param {string} newVersion - New version
   * @param {string} currentVersion - Current version
   * @returns {boolean} Whether new version is newer
   */
  _isNewerVersion(newVersion, currentVersion) {
    const parseVersion = (v) => v.split('.').map(Number);
    const newParts = parseVersion(newVersion);
    const currentParts = parseVersion(currentVersion);
    
    for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
      const newPart = newParts[i] || 0;
      const currentPart = currentParts[i] || 0;
      
      if (newPart > currentPart) return true;
      if (newPart < currentPart) return false;
    }
    
    return false;
  }

  /**
   * Process update queue
   */
  async _processUpdateQueue() {
    // Respect concurrent update limit
    if (this.activeUpdates.size >= this.options.maxConcurrentUpdates) {
      return;
    }

    if (this.updateQueue.length === 0) {
      return;
    }

    const updateItem = this.updateQueue.shift();
    
    try {
      await this.updateApp(updateItem.appId, updateItem.updateInfo, updateItem.options);
    } catch (error) {
      // Handle retry logic
      if (updateItem.retryCount < this.options.retryAttempts) {
        updateItem.retryCount++;
        this.updateQueue.push(updateItem);
        this.emit('update:retry', { 
          appId: updateItem.appId, 
          retryCount: updateItem.retryCount 
        });
      } else {
        this.emit('update:failed', { 
          appId: updateItem.appId, 
          error: error.message,
          finalAttempt: true
        });
      }
    }

    // Continue processing queue
    setTimeout(() => this._processUpdateQueue(), 1000);
  }

  /**
   * Download update package
   * @param {string} appId - App ID
   * @param {Object} updateInfo - Update information
   * @returns {Promise<string>} Downloaded package path
   */
  async _downloadUpdate(appId, updateInfo) {
    this.emit('download:started', { appId, updateInfo });

    // Mock download - in reality this would download from updateInfo.downloadUrl
    const tempDir = '/tmp/lahat-updates';
    await fs.mkdir(tempDir, { recursive: true });
    
    const packagePath = path.join(tempDir, `${appId}-${updateInfo.availableVersion}.lahat`);
    
    // Simulate download progress
    for (let i = 0; i <= 100; i += 10) {
      this.emit('download:progress', { appId, progress: i });
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Create mock package file
    await fs.writeFile(packagePath, 'mock package content');

    this.emit('download:completed', { appId, packagePath });
    
    return packagePath;
  }

  /**
   * Verify update package integrity
   * @param {string} packagePath - Package path
   * @param {Object} updateInfo - Update information
   * @returns {Promise<void>}
   */
  async _verifyUpdatePackage(packagePath, updateInfo) {
    try {
      // In reality, this would verify checksums, signatures, etc.
      const content = await fs.readFile(packagePath);
      const actualChecksum = crypto.createHash('sha256').update(content).digest('hex');
      
      // For demo, we'll skip actual verification
      // if (actualChecksum !== updateInfo.checksum) {
      //   throw new Error('Package checksum verification failed');
      // }

      this.emit('verification:completed', { packagePath });
    } catch (error) {
      this.emit('verification:failed', { packagePath, error: error.message });
      throw error;
    }
  }

  /**
   * Record update history
   * @param {string} appId - App ID
   * @param {Object} updateInfo - Update information
   * @param {Object} result - Update result
   */
  _recordUpdateHistory(appId, updateInfo, result) {
    if (!this.updateHistory.has(appId)) {
      this.updateHistory.set(appId, []);
    }

    const history = this.updateHistory.get(appId);
    history.push({
      fromVersion: updateInfo.currentVersion,
      toVersion: updateInfo.availableVersion,
      updatedAt: Date.now(),
      success: true,
      updateSize: updateInfo.updateSize,
      result
    });

    // Keep only last 10 updates
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
  }

  /**
   * Clean up downloaded update package
   * @param {string} packagePath - Package path
   * @returns {Promise<void>}
   */
  async _cleanupUpdatePackage(packagePath) {
    try {
      await fs.unlink(packagePath);
    } catch (error) {
      // Ignore cleanup errors
      console.warn(`Failed to cleanup update package ${packagePath}:`, error);
    }
  }
}
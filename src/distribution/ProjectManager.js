/**
 * Project Manager - Manage installed apps
 * Provides high-level management of installed Lahat apps
 */

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';

export class ProjectManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      autoCleanup: true,
      cleanupThreshold: 30, // days
      maxApps: 100,
      ...options
    };
    
    this.installer = null;
    this.packager = null;
    this.runningApps = new Map();
  }

  /**
   * Set dependencies
   * @param {AppInstaller} installer - App installer instance
   * @param {LahatPackager} packager - App packager instance
   */
  setDependencies(installer, packager) {
    this.installer = installer;
    this.packager = packager;
  }

  /**
   * Install app from package
   * @param {string} packagePath - Path to .lahat package
   * @param {Object} options - Installation options
   * @returns {Promise<Object>} Installation result
   */
  async installApp(packagePath, options = {}) {
    if (!this.installer) {
      throw new Error('App installer not available');
    }

    // Check app limits
    if (this.options.maxApps > 0) {
      const installedApps = this.installer.getInstalledApps();
      if (installedApps.length >= this.options.maxApps) {
        throw new Error(`Maximum number of apps (${this.options.maxApps}) reached`);
      }
    }

    const result = await this.installer.installApp(packagePath, options);
    
    this.emit('app:installed', result);
    
    // Auto-cleanup if enabled
    if (this.options.autoCleanup) {
      this._scheduleCleanup();
    }
    
    return result;
  }

  /**
   * Uninstall app
   * @param {string} appId - App ID to uninstall
   * @param {Object} options - Uninstallation options
   * @returns {Promise<boolean>} Success status
   */
  async uninstallApp(appId, options = {}) {
    if (!this.installer) {
      throw new Error('App installer not available');
    }

    // Stop app if running
    if (this.runningApps.has(appId)) {
      await this.stopApp(appId);
    }

    const result = await this.installer.uninstallApp(appId, options);
    
    this.emit('app:uninstalled', { appId });
    
    return result;
  }

  /**
   * Update app to newer version
   * @param {string} appId - App ID to update
   * @param {string} packagePath - Path to new package
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Update result
   */
  async updateApp(appId, packagePath, options = {}) {
    if (!this.installer) {
      throw new Error('App installer not available');
    }

    // Stop app if running
    const wasRunning = this.runningApps.has(appId);
    if (wasRunning) {
      await this.stopApp(appId);
    }

    const result = await this.installer.updateApp(appId, packagePath, options);
    
    // Restart app if it was running
    if (wasRunning && options.restartAfterUpdate !== false) {
      try {
        await this.startApp(appId);
      } catch (error) {
        console.warn(`Failed to restart app ${appId} after update:`, error);
      }
    }
    
    this.emit('app:updated', result);
    
    return result;
  }

  /**
   * Start an installed app
   * @param {string} appId - App ID to start
   * @param {Object} options - Start options
   * @returns {Promise<Object>} App process info
   */
  async startApp(appId, options = {}) {
    if (!this.installer) {
      throw new Error('App installer not available');
    }

    if (this.runningApps.has(appId)) {
      throw new Error(`App ${appId} is already running`);
    }

    const appInfo = this.installer.getAppInfo(appId);
    if (!appInfo) {
      throw new Error(`App ${appId} is not installed`);
    }

    try {
      // Create app process info
      const processInfo = {
        appId,
        pid: Math.floor(Math.random() * 10000), // Mock PID
        startTime: Date.now(),
        status: 'running',
        installPath: appInfo.installPath,
        manifest: appInfo.manifest
      };

      this.runningApps.set(appId, processInfo);
      
      this.emit('app:started', processInfo);
      
      return processInfo;
    } catch (error) {
      this.emit('app:start:failed', { appId, error: error.message });
      throw error;
    }
  }

  /**
   * Stop a running app
   * @param {string} appId - App ID to stop
   * @returns {Promise<boolean>} Success status
   */
  async stopApp(appId) {
    const processInfo = this.runningApps.get(appId);
    if (!processInfo) {
      return false; // App not running
    }

    try {
      // Mock stopping the app
      this.runningApps.delete(appId);
      
      this.emit('app:stopped', { appId, stopTime: Date.now() });
      
      return true;
    } catch (error) {
      this.emit('app:stop:failed', { appId, error: error.message });
      throw error;
    }
  }

  /**
   * Restart a running app
   * @param {string} appId - App ID to restart
   * @returns {Promise<Object>} New process info
   */
  async restartApp(appId) {
    await this.stopApp(appId);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
    return await this.startApp(appId);
  }

  /**
   * Get all installed apps with their status
   * @param {Object} filter - Filter options
   * @returns {Promise<Array<Object>>} Apps with status
   */
  async getApps(filter = {}) {
    if (!this.installer) {
      return [];
    }

    const installedApps = await this.installer.getInstalledApps(filter);
    
    return installedApps.map(app => ({
      ...app,
      isRunning: this.runningApps.has(app.id),
      processInfo: this.runningApps.get(app.id) || null
    }));
  }

  /**
   * Get running apps
   * @returns {Array<Object>} Running apps
   */
  getRunningApps() {
    return Array.from(this.runningApps.values());
  }

  /**
   * Get app by ID with status
   * @param {string} appId - App ID
   * @returns {Object|null} App with status
   */
  getApp(appId) {
    if (!this.installer) {
      return null;
    }

    const appInfo = this.installer.getAppInfo(appId);
    if (!appInfo) {
      return null;
    }

    return {
      ...appInfo,
      isRunning: this.runningApps.has(appId),
      processInfo: this.runningApps.get(appId) || null
    };
  }

  /**
   * Search apps by various criteria
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array<Object>} Matching apps
   */
  searchApps(query, options = {}) {
    const apps = this.getApps();
    const searchQuery = query.toLowerCase();
    
    return apps.filter(app => {
      const manifest = app.manifest;
      
      // Search in name
      if (manifest.app.name.toLowerCase().includes(searchQuery)) {
        return true;
      }
      
      // Search in description
      if (manifest.app.description && 
          manifest.app.description.toLowerCase().includes(searchQuery)) {
        return true;
      }
      
      // Search in author
      if (manifest.app.author && 
          manifest.app.author.toLowerCase().includes(searchQuery)) {
        return true;
      }
      
      // Search in keywords
      if (manifest.app.keywords && 
          manifest.app.keywords.some(keyword => 
            keyword.toLowerCase().includes(searchQuery))) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Package an installed app
   * @param {string} appId - App ID to package
   * @param {string} outputPath - Output path for package
   * @param {Object} options - Packaging options
   * @returns {Promise<Object>} Package info
   */
  async packageApp(appId, outputPath, options = {}) {
    if (!this.packager || !this.installer) {
      throw new Error('Packager or installer not available');
    }

    const appInfo = this.installer.getAppInfo(appId);
    if (!appInfo) {
      throw new Error(`App ${appId} is not installed`);
    }

    return await this.packager.packageApp(appInfo.installPath, outputPath, options);
  }

  /**
   * Backup app data
   * @param {string} appId - App ID to backup
   * @param {string} backupPath - Backup destination
   * @returns {Promise<Object>} Backup info
   */
  async backupApp(appId, backupPath) {
    const appInfo = this.getApp(appId);
    if (!appInfo) {
      throw new Error(`App ${appId} not found`);
    }

    try {
      // Create backup directory
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      
      // Copy app directory
      await fs.cp(appInfo.installPath, backupPath, { recursive: true });
      
      const backupInfo = {
        appId,
        appName: appInfo.manifest.app.name,
        version: appInfo.manifest.app.version,
        backupPath,
        backupTime: new Date().toISOString(),
        originalSize: appInfo.installSize
      };
      
      this.emit('app:backed_up', backupInfo);
      
      return backupInfo;
    } catch (error) {
      this.emit('app:backup:failed', { appId, error: error.message });
      throw error;
    }
  }

  /**
   * Restore app from backup
   * @param {string} appId - App ID to restore
   * @param {string} backupPath - Backup source
   * @returns {Promise<boolean>} Success status
   */
  async restoreApp(appId, backupPath) {
    try {
      // Stop app if running
      if (this.runningApps.has(appId)) {
        await this.stopApp(appId);
      }

      const appInfo = this.installer.getAppInfo(appId);
      if (appInfo) {
        // Remove current installation
        await fs.rm(appInfo.installPath, { recursive: true, force: true });
        
        // Restore from backup
        await fs.cp(backupPath, appInfo.installPath, { recursive: true });
        
        this.emit('app:restored', { appId, backupPath });
        
        return true;
      }
      
      return false;
    } catch (error) {
      this.emit('app:restore:failed', { appId, error: error.message });
      throw error;
    }
  }

  /**
   * Clean up old or unused apps
   * @param {Object} options - Cleanup options
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupApps(options = {}) {
    const {
      removeOldApps = true,
      dayThreshold = this.options.cleanupThreshold,
      removeUnusedApps = false,
      dryRun = false
    } = options;

    const cleanupResult = {
      appsRemoved: [],
      spaceFreed: 0,
      errors: []
    };

    try {
      const apps = this.getApps();
      const cutoffDate = new Date(Date.now() - (dayThreshold * 24 * 60 * 60 * 1000));

      for (const app of apps) {
        let shouldRemove = false;
        
        // Check if app is old
        if (removeOldApps) {
          const installedDate = new Date(app.installedAt);
          if (installedDate < cutoffDate) {
            shouldRemove = true;
          }
        }
        
        // Check if app is unused (never started)
        if (removeUnusedApps && !app.isRunning) {
          // In a real implementation, we'd track usage statistics
          // For now, skip this check
        }
        
        if (shouldRemove && !dryRun) {
          try {
            await this.uninstallApp(app.id);
            cleanupResult.appsRemoved.push({
              id: app.id,
              name: app.manifest.app.name,
              size: app.installSize
            });
            cleanupResult.spaceFreed += app.installSize || 0;
          } catch (error) {
            cleanupResult.errors.push({
              appId: app.id,
              error: error.message
            });
          }
        }
      }

      this.emit('cleanup:completed', cleanupResult);
      
      return cleanupResult;
    } catch (error) {
      this.emit('cleanup:failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get project manager statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const apps = this.getApps();
    const runningApps = this.getRunningApps();
    
    return {
      totalApps: apps.length,
      runningApps: runningApps.length,
      totalInstallSize: apps.reduce((sum, app) => sum + (app.installSize || 0), 0),
      averageAppSize: apps.length > 0 ? 
        apps.reduce((sum, app) => sum + (app.installSize || 0), 0) / apps.length : 0,
      oldestApp: apps.reduce((oldest, app) => {
        const appDate = new Date(app.installedAt);
        return !oldest || appDate < new Date(oldest.installedAt) ? app : oldest;
      }, null),
      newestApp: apps.reduce((newest, app) => {
        const appDate = new Date(app.installedAt);
        return !newest || appDate > new Date(newest.installedAt) ? app : newest;
      }, null)
    };
  }

  /**
   * Stop all running apps
   * @returns {Promise<void>}
   */
  async stopAllApps() {
    const runningAppIds = Array.from(this.runningApps.keys());
    
    for (const appId of runningAppIds) {
      try {
        await this.stopApp(appId);
      } catch (error) {
        console.warn(`Failed to stop app ${appId}:`, error);
      }
    }
    
    this.emit('all_apps:stopped');
  }

  /**
   * Schedule automatic cleanup
   */
  _scheduleCleanup() {
    // In a real implementation, this would schedule periodic cleanup
    // For now, just emit an event
    this.emit('cleanup:scheduled');
  }
}
/**
 * Distribution Island - App packaging and distribution
 * Exports all distribution-related functionality
 */

import { LahatPackager } from './LahatPackager.js';
import { AppInstaller } from './AppInstaller.js';
import { ProjectManager } from './ProjectManager.js';
import { UpdateManager } from './UpdateManager.js';

export { LahatPackager } from './LahatPackager.js';
export { AppInstaller } from './AppInstaller.js';
export { ProjectManager } from './ProjectManager.js';
export { UpdateManager } from './UpdateManager.js';

/**
 * Distribution Manager - Coordinated distribution functionality
 */
export class DistributionManager {
  constructor(options = {}) {
    this.options = {
      autoCleanup: true,
      autoUpdates: false,
      maxConcurrentOperations: 3,
      ...options
    };
    
    // Initialize components
    this.packager = new LahatPackager();
    this.installer = new AppInstaller();
    this.projectManager = new ProjectManager();
    this.updateManager = new UpdateManager();
    
    // Set up dependencies
    this.projectManager.setDependencies(this.installer, this.packager);
    this.updateManager.setProjectManager(this.projectManager);
    
    this.isStarted = false;
    
    this._setupEventHandlers();
  }

  /**
   * Start the distribution manager
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isStarted) return;
    
    try {
      // Start update manager if auto-updates are enabled
      if (this.options.autoUpdates) {
        await this.updateManager.start();
      }
      
      this.isStarted = true;
      
    } catch (error) {
      console.error('Failed to start distribution manager:', error);
      throw error;
    }
  }

  /**
   * Stop the distribution manager
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isStarted) return;
    
    try {
      // Stop update manager
      this.updateManager.stop();
      
      // Stop all running apps
      await this.projectManager.stopAllApps();
      
      this.isStarted = false;
    } catch (error) {
      console.error('Failed to stop distribution manager:', error);
      throw error;
    }
  }

  /**
   * Package an app project
   * @param {string} projectPath - Path to the project directory
   * @param {string} outputPath - Output path for the .lahat file
   * @param {Object} options - Packaging options
   * @returns {Promise<Object>} Package information
   */
  async packageApp(projectPath, outputPath, options = {}) {
    if (!this.isStarted) {
      throw new Error('Distribution manager not started');
    }
    
    return await this.packager.packageApp(projectPath, outputPath, options);
  }

  /**
   * Install an app from package
   * @param {string} packagePath - Path to the .lahat file
   * @param {Object} options - Installation options
   * @returns {Promise<Object>} Installation result
   */
  async installApp(packagePath, options = {}) {
    if (!this.isStarted) {
      throw new Error('Distribution manager not started');
    }
    
    return await this.projectManager.installApp(packagePath, options);
  }

  /**
   * Uninstall an app
   * @param {string} appId - App ID to uninstall
   * @param {Object} options - Uninstallation options
   * @returns {Promise<boolean>} Success status
   */
  async uninstallApp(appId, options = {}) {
    if (!this.isStarted) {
      throw new Error('Distribution manager not started');
    }
    
    return await this.projectManager.uninstallApp(appId, options);
  }

  /**
   * Start an installed app
   * @param {string} appId - App ID to start
   * @param {Object} options - Start options
   * @returns {Promise<Object>} App process info
   */
  async startApp(appId, options = {}) {
    if (!this.isStarted) {
      throw new Error('Distribution manager not started');
    }
    
    return await this.projectManager.startApp(appId, options);
  }

  /**
   * Stop a running app
   * @param {string} appId - App ID to stop
   * @returns {Promise<boolean>} Success status
   */
  async stopApp(appId) {
    if (!this.isStarted) {
      throw new Error('Distribution manager not started');
    }
    
    return await this.projectManager.stopApp(appId);
  }

  /**
   * Update an app
   * @param {string} appId - App ID to update
   * @param {string} packagePath - Path to new package (optional)
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Update result
   */
  async updateApp(appId, packagePath = null, options = {}) {
    if (!this.isStarted) {
      throw new Error('Distribution manager not started');
    }
    
    if (packagePath) {
      // Manual update with specific package
      return await this.projectManager.updateApp(appId, packagePath, options);
    } else {
      // Automatic update - check for updates first
      const updateInfo = await this.updateManager.checkAppForUpdates(appId);
      if (!updateInfo) {
        throw new Error(`No updates available for app ${appId}`);
      }
      
      return await this.updateManager.updateApp(appId, updateInfo, options);
    }
  }

  /**
   * Get all apps
   * @param {Object} filter - Filter options
   * @returns {Promise<Array<Object>>} Apps with status
   */
  async getApps(filter = {}) {
    return await this.projectManager.getApps(filter);
  }

  /**
   * Get running apps
   * @returns {Array<Object>} Running apps
   */
  getRunningApps() {
    return this.projectManager.getRunningApps();
  }

  /**
   * Get app by ID
   * @param {string} appId - App ID
   * @returns {Object|null} App information
   */
  getApp(appId) {
    return this.projectManager.getApp(appId);
  }

  /**
   * Search apps
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array<Object>} Matching apps
   */
  searchApps(query, options = {}) {
    return this.projectManager.searchApps(query, options);
  }

  /**
   * Check for updates for all apps
   * @returns {Promise<Array>} Available updates
   */
  async checkForUpdates() {
    if (!this.isStarted) {
      throw new Error('Distribution manager not started');
    }
    
    return await this.updateManager.checkForUpdates();
  }

  /**
   * Get package metadata
   * @param {string} packagePath - Path to .lahat file
   * @returns {Promise<Object>} Package metadata
   */
  async getPackageMetadata(packagePath) {
    return await this.packager.getPackageMetadata(packagePath);
  }

  /**
   * Validate package
   * @param {string} packagePath - Path to .lahat file
   * @returns {Promise<Object>} Validation result
   */
  async validatePackage(packagePath) {
    return await this.packager.validatePackage(packagePath);
  }

  /**
   * Backup app
   * @param {string} appId - App ID to backup
   * @param {string} backupPath - Backup destination
   * @returns {Promise<Object>} Backup info
   */
  async backupApp(appId, backupPath) {
    if (!this.isStarted) {
      throw new Error('Distribution manager not started');
    }
    
    return await this.projectManager.backupApp(appId, backupPath);
  }

  /**
   * Restore app from backup
   * @param {string} appId - App ID to restore
   * @param {string} backupPath - Backup source
   * @returns {Promise<boolean>} Success status
   */
  async restoreApp(appId, backupPath) {
    if (!this.isStarted) {
      throw new Error('Distribution manager not started');
    }
    
    return await this.projectManager.restoreApp(appId, backupPath);
  }

  /**
   * Clean up old apps
   * @param {Object} options - Cleanup options
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupApps(options = {}) {
    if (!this.isStarted) {
      throw new Error('Distribution manager not started');
    }
    
    return await this.projectManager.cleanupApps(options);
  }

  /**
   * Get distribution manager statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      isStarted: this.isStarted,
      projectManager: this.projectManager.getStats(),
      updateManager: this.updateManager.getStats(),
      components: {
        packager: 'ready',
        installer: 'ready',
        projectManager: 'ready',
        updateManager: this.updateManager.updateTimer ? 'running' : 'stopped'
      }
    };
  }

  /**
   * Set up event handlers
   */
  _setupEventHandlers() {
    // Project manager events
    this.projectManager.on('app:installed', (data) => {
      console.log(`App installed: ${data.id}`);
    });
    
    this.projectManager.on('app:uninstalled', (data) => {
      console.log(`App uninstalled: ${data.appId}`);
    });
    
    this.projectManager.on('app:started', (data) => {
      console.log(`App started: ${data.appId}`);
    });
    
    this.projectManager.on('app:stopped', (data) => {
      console.log(`App stopped: ${data.appId}`);
    });

    // Update manager events
    this.updateManager.on('update:completed', (data) => {
      console.log(`App updated: ${data.appId}`);
    });
    
    this.updateManager.on('update:failed', (data) => {
      console.warn(`App update failed: ${data.appId}`, data.error);
    });
    
    this.updateManager.on('updates:checked', (data) => {
      console.log(`Updates checked: ${data.updatesAvailable} updates available`);
    });

    // Packager events
    this.packager.on('packaging:completed', (data) => {
      console.log(`Package created: ${data.outputPath}`);
    });
    
    this.packager.on('packaging:failed', (data) => {
      console.error(`Packaging failed: ${data.projectPath}`, data.error);
    });

    // Installer events
    this.installer.on('installation:completed', (data) => {
      console.log(`Installation completed: ${data.appId}`);
    });
    
    this.installer.on('installation:failed', (data) => {
      console.error(`Installation failed: ${data.packagePath}`, data.error);
    });
  }
}

// Create default distribution manager instance
export const distribution = new DistributionManager();

export default distribution;
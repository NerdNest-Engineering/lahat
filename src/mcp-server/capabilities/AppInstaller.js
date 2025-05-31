/**
 * App Installer Capability - Install and manage .lahat packages remotely
 * Provides MCP tools for installing, updating, and removing apps
 */

import { EventEmitter } from 'events';
import { AppInstaller as DistributionInstaller } from '../../distribution/AppInstaller.js';
import { AppValidator } from '../../distribution/AppValidator.js';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export class AppInstaller extends EventEmitter {
  constructor(lahatRuntime) {
    super();
    this.runtime = lahatRuntime;
    this.installer = new DistributionInstaller({
      installDir: path.join(os.homedir(), 'LahatApps')
    });
    this.validator = new AppValidator();
  }

  /**
   * Install a .lahat package
   * @param {string} packagePath - Path to .lahat package file
   * @param {Object} options - Installation options
   * @returns {Promise<Object>} Installation result
   */
  async installApp(packagePath, options = {}) {
    try {
      const { overwrite = false, validate = true } = options;
      
      // Validate package first if requested
      if (validate) {
        const validationResult = await this.validator.validatePackage(packagePath);
        if (!validationResult.isValid) {
          throw new Error(`Invalid package: ${validationResult.errors.join(', ')}`);
        }
      }

      // Check if app already exists
      const packageInfo = await this._getPackageInfo(packagePath);
      const existingApp = await this._findInstalledApp(packageInfo.name);
      
      if (existingApp && !overwrite) {
        return {
          success: false,
          error: 'App already exists. Use overwrite option to replace.',
          appId: existingApp.id,
          existingVersion: existingApp.version,
          packageVersion: packageInfo.version
        };
      }

      // Install the package
      const installedPath = await this.installer.installApp(packagePath, { overwrite });
      
      // Register with runtime if needed
      await this._registerApp(installedPath, packageInfo);
      
      this.emit('app:installed', { 
        packagePath, 
        installedPath, 
        appInfo: packageInfo 
      });
      
      return {
        success: true,
        appId: packageInfo.name,
        name: packageInfo.name,
        version: packageInfo.version,
        installedPath,
        installedAt: new Date().toISOString(),
        wasOverwrite: Boolean(existingApp)
      };
    } catch (error) {
      this.emit('app:install-failed', { packagePath, options, error: error.message });
      throw error;
    }
  }

  /**
   * Uninstall an app
   * @param {string} appId - App ID to uninstall
   * @param {Object} options - Uninstall options
   * @returns {Promise<Object>} Uninstall result
   */
  async uninstallApp(appId, options = {}) {
    try {
      const { force = false, keepData = false } = options;
      
      // Find the installed app
      const app = await this._findInstalledApp(appId);
      if (!app) {
        throw new Error(`App not found: ${appId}`);
      }

      // Check if app is running
      if (this.runtime.runningApps.has(appId) && !force) {
        throw new Error(`App is currently running. Stop the app first or use force option.`);
      }

      // Stop app if running and force is true
      if (this.runtime.runningApps.has(appId) && force) {
        await this.runtime.stopApp(appId);
      }

      // Remove app files
      await fs.rm(app.path, { recursive: true, force: true });
      
      // Clean up app data unless keeping it
      if (!keepData) {
        await this._cleanupAppData(appId);
      }

      // Unregister from runtime
      await this._unregisterApp(appId);
      
      this.emit('app:uninstalled', { appId, options });
      
      return {
        success: true,
        appId,
        uninstalledAt: new Date().toISOString(),
        dataKept: keepData
      };
    } catch (error) {
      this.emit('app:uninstall-failed', { appId, options, error: error.message });
      throw error;
    }
  }

  /**
   * Update an app to a new version
   * @param {string} appId - App ID to update
   * @param {string} packagePath - Path to new .lahat package
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Update result
   */
  async updateApp(appId, packagePath, options = {}) {
    try {
      const { backupOld = true, preserveData = true } = options;
      
      // Find existing app
      const existingApp = await this._findInstalledApp(appId);
      if (!existingApp) {
        throw new Error(`App not found: ${appId}`);
      }

      // Get new package info
      const newPackageInfo = await this._getPackageInfo(packagePath);
      
      // Validate version compatibility
      if (newPackageInfo.name !== existingApp.name) {
        throw new Error(`Package name mismatch: expected ${existingApp.name}, got ${newPackageInfo.name}`);
      }

      // Backup old version if requested
      let backupPath = null;
      if (backupOld) {
        backupPath = await this._backupApp(existingApp);
      }

      // Stop app if running
      const wasRunning = this.runtime.runningApps.has(appId);
      if (wasRunning) {
        await this.runtime.stopApp(appId);
      }

      try {
        // Install new version (with overwrite)
        const result = await this.installApp(packagePath, { overwrite: true });
        
        // Restart app if it was running
        if (wasRunning) {
          await this.runtime.executeApp(newPackageInfo, result.installedPath);
        }

        this.emit('app:updated', { 
          appId, 
          oldVersion: existingApp.version,
          newVersion: newPackageInfo.version,
          backupPath 
        });
        
        return {
          success: true,
          appId,
          oldVersion: existingApp.version,
          newVersion: newPackageInfo.version,
          backupPath,
          updatedAt: new Date().toISOString(),
          wasRunning
        };
      } catch (error) {
        // Restore backup if update failed
        if (backupPath) {
          await this._restoreApp(backupPath, existingApp.path);
        }
        throw error;
      }
    } catch (error) {
      this.emit('app:update-failed', { appId, packagePath, options, error: error.message });
      throw error;
    }
  }

  /**
   * List installed apps
   * @param {Object} options - List options
   * @returns {Promise<Object>} Installed apps list
   */
  async listInstalledApps(options = {}) {
    try {
      const { includeMetadata = true, sortBy = 'name' } = options;
      
      const apps = await this._getInstalledApps();
      
      // Add metadata if requested
      if (includeMetadata) {
        for (const app of apps) {
          app.isRunning = this.runtime.runningApps.has(app.id);
          app.installDate = await this._getInstallDate(app.path);
          app.size = await this._getAppSize(app.path);
        }
      }

      // Sort apps
      apps.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'version':
            return a.version.localeCompare(b.version);
          case 'installDate':
            return new Date(b.installDate) - new Date(a.installDate);
          default:
            return 0;
        }
      });

      return {
        success: true,
        apps,
        total: apps.length
      };
    } catch (error) {
      this.emit('apps:list-failed', { options, error: error.message });
      throw error;
    }
  }

  /**
   * Get package information from .lahat file
   * @private
   */
  async _getPackageInfo(packagePath) {
    // This would extract and parse package.json and lahat.config.js from the .lahat file
    // For now, return mock data
    return {
      name: `app-${Date.now()}`,
      version: '1.0.0',
      description: 'Installed app',
      author: 'Unknown',
      permissions: ['lahat:storage'],
      mcpRequirements: []
    };
  }

  /**
   * Find an installed app by ID
   * @private
   */
  async _findInstalledApp(appId) {
    const apps = await this._getInstalledApps();
    return apps.find(app => app.id === appId || app.name === appId);
  }

  /**
   * Get list of installed apps
   * @private
   */
  async _getInstalledApps() {
    // Mock implementation - would scan install directory
    return [
      {
        id: 'sample-todo-app',
        name: 'Sample Todo App',
        version: '1.0.0',
        path: '/path/to/sample-todo-app'
      }
    ];
  }

  /**
   * Register app with runtime
   * @private
   */
  async _registerApp(installedPath, appInfo) {
    // This would register the app with the runtime system
    console.log(`Registered app: ${appInfo.name} at ${installedPath}`);
  }

  /**
   * Unregister app from runtime
   * @private
   */
  async _unregisterApp(appId) {
    // This would unregister the app from the runtime system
    console.log(`Unregistered app: ${appId}`);
  }

  /**
   * Clean up app data
   * @private
   */
  async _cleanupAppData(appId) {
    // This would clean up stored data for the app
    console.log(`Cleaned up data for app: ${appId}`);
  }

  /**
   * Backup an app
   * @private
   */
  async _backupApp(app) {
    const backupPath = `${app.path}.backup.${Date.now()}`;
    await fs.cp(app.path, backupPath, { recursive: true });
    return backupPath;
  }

  /**
   * Restore an app from backup
   * @private
   */
  async _restoreApp(backupPath, targetPath) {
    await fs.rm(targetPath, { recursive: true, force: true });
    await fs.cp(backupPath, targetPath, { recursive: true });
  }

  /**
   * Get app install date
   * @private
   */
  async _getInstallDate(appPath) {
    try {
      const stats = await fs.stat(appPath);
      return stats.birthtime.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  /**
   * Get app size
   * @private
   */
  async _getAppSize(appPath) {
    // This would calculate the total size of the app directory
    return '1.2 MB'; // Mock value
  }

  /**
   * Get installer status
   */
  getStatus() {
    return {
      installDir: this.installer.options.installDir,
      capabilities: ['install', 'uninstall', 'update', 'list']
    };
  }
}
/**
 * App Installer - Install apps from .lahat files
 * Handles extraction, validation, and installation of mini apps
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { createReadStream } from 'fs';
import { Extract } from 'unzipper';
import { EventEmitter } from 'events';

export class AppInstaller extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      installDir: path.join(os.homedir(), 'LahatApps'),
      allowOverwrite: false,
      validatePackage: true,
      installDependencies: true,
      runPostInstall: true,
      ...options
    };
    
    this.installedApps = new Map();
    this._loadInstalledApps();
  }

  /**
   * Install an app from a .lahat package
   * @param {string} packagePath - Path to the .lahat file
   * @param {Object} options - Installation options
   * @returns {Promise<Object>} Installation result
   */
  async installApp(packagePath, options = {}) {
    try {
      this.emit('installation:started', { packagePath });

      // Validate package first
      if (this.options.validatePackage) {
        await this._validatePackage(packagePath);
      }

      // Extract manifest to get app info
      const manifest = await this._extractManifest(packagePath);
      const appId = this._generateAppId(manifest.app.name, manifest.app.version);

      // Check if app already exists
      if (this.installedApps.has(appId) && !options.allowOverwrite && !this.options.allowOverwrite) {
        throw new Error(`App ${manifest.app.name} v${manifest.app.version} is already installed`);
      }

      // Create installation directory
      const installPath = path.join(this.options.installDir, appId);
      await this._prepareInstallDirectory(installPath, options);

      // Extract package contents
      await this._extractPackage(packagePath, installPath);

      // Install dependencies if needed
      if (this.options.installDependencies) {
        await this._installDependencies(installPath);
      }

      // Run post-install scripts
      if (this.options.runPostInstall) {
        await this._runPostInstallScripts(installPath, manifest);
      }

      // Register the app
      const appInfo = await this._registerApp(appId, installPath, manifest, packagePath);

      this.emit('installation:completed', { packagePath, appId, appInfo });

      return appInfo;
    } catch (error) {
      this.emit('installation:failed', { packagePath, error: error.message });
      throw error;
    }
  }

  /**
   * Uninstall an app
   * @param {string} appId - App ID to uninstall
   * @param {Object} options - Uninstallation options
   * @returns {Promise<boolean>} Success status
   */
  async uninstallApp(appId, options = {}) {
    try {
      this.emit('uninstallation:started', { appId });

      const appInfo = this.installedApps.get(appId);
      if (!appInfo) {
        throw new Error(`App ${appId} is not installed`);
      }

      // Run pre-uninstall scripts
      if (options.runPreUninstall !== false) {
        await this._runPreUninstallScripts(appInfo.installPath, appInfo.manifest);
      }

      // Remove app directory
      await fs.rm(appInfo.installPath, { recursive: true, force: true });

      // Unregister the app
      this.installedApps.delete(appId);
      await this._saveInstalledApps();

      this.emit('uninstallation:completed', { appId });

      return true;
    } catch (error) {
      this.emit('uninstallation:failed', { appId, error: error.message });
      throw error;
    }
  }

  /**
   * Update an app to a newer version
   * @param {string} appId - App ID to update
   * @param {string} packagePath - Path to the new .lahat file
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Update result
   */
  async updateApp(appId, packagePath, options = {}) {
    try {
      this.emit('update:started', { appId, packagePath });

      // Check if app is installed
      const currentApp = this.installedApps.get(appId);
      if (!currentApp) {
        throw new Error(`App ${appId} is not installed`);
      }

      // Extract new manifest
      const newManifest = await this._extractManifest(packagePath);
      
      // Compare versions
      const currentVersion = currentApp.manifest.app.version;
      const newVersion = newManifest.app.version;
      
      if (!this._isNewerVersion(newVersion, currentVersion)) {
        throw new Error(`New version ${newVersion} is not newer than current version ${currentVersion}`);
      }

      // Backup current installation
      const backupPath = await this._createBackup(currentApp);

      try {
        // Install new version (allowing overwrite)
        const updateResult = await this.installApp(packagePath, { 
          ...options, 
          allowOverwrite: true 
        });

        // Remove backup if successful
        await fs.rm(backupPath, { recursive: true, force: true });

        this.emit('update:completed', { appId, oldVersion: currentVersion, newVersion });

        return updateResult;
      } catch (error) {
        // Restore backup on failure
        await this._restoreBackup(backupPath, currentApp.installPath);
        throw error;
      }
    } catch (error) {
      this.emit('update:failed', { appId, packagePath, error: error.message });
      throw error;
    }
  }

  /**
   * List all installed apps
   * @param {Object} filter - Filter options
   * @returns {Array<Object>} Installed apps
   */
  getInstalledApps(filter = {}) {
    let apps = Array.from(this.installedApps.values());

    if (filter.name) {
      apps = apps.filter(app => 
        app.manifest.app.name.toLowerCase().includes(filter.name.toLowerCase())
      );
    }

    if (filter.version) {
      apps = apps.filter(app => app.manifest.app.version === filter.version);
    }

    if (filter.author) {
      apps = apps.filter(app => 
        app.manifest.app.author && 
        app.manifest.app.author.toLowerCase().includes(filter.author.toLowerCase())
      );
    }

    return apps;
  }

  /**
   * Get information about an installed app
   * @param {string} appId - App ID
   * @returns {Object|null} App information
   */
  getAppInfo(appId) {
    return this.installedApps.get(appId) || null;
  }

  /**
   * Check if an app is installed
   * @param {string} appName - App name
   * @param {string} version - App version (optional)
   * @returns {boolean} Whether app is installed
   */
  isAppInstalled(appName, version = null) {
    for (const app of this.installedApps.values()) {
      if (app.manifest.app.name === appName) {
        if (!version || app.manifest.app.version === version) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Repair an installed app
   * @param {string} appId - App ID to repair
   * @returns {Promise<boolean>} Success status
   */
  async repairApp(appId) {
    try {
      this.emit('repair:started', { appId });

      const appInfo = this.installedApps.get(appId);
      if (!appInfo) {
        throw new Error(`App ${appId} is not installed`);
      }

      // Check if installation is intact
      const issues = await this._checkInstallationIntegrity(appInfo);
      
      if (issues.length === 0) {
        this.emit('repair:completed', { appId, issues: [] });
        return true;
      }

      // Attempt to fix issues
      for (const issue of issues) {
        await this._fixInstallationIssue(appInfo, issue);
      }

      // Re-check integrity
      const remainingIssues = await this._checkInstallationIntegrity(appInfo);
      
      this.emit('repair:completed', { appId, issues: remainingIssues });

      return remainingIssues.length === 0;
    } catch (error) {
      this.emit('repair:failed', { appId, error: error.message });
      throw error;
    }
  }

  /**
   * Get installer statistics
   * @returns {Object} Installer statistics
   */
  getStats() {
    const apps = Array.from(this.installedApps.values());
    
    return {
      totalApps: apps.length,
      totalInstallSize: apps.reduce((sum, app) => sum + (app.installSize || 0), 0),
      installDirectory: this.options.installDir,
      lastInstall: apps.reduce((latest, app) => {
        const installTime = new Date(app.installedAt);
        return installTime > latest ? installTime : latest;
      }, new Date(0))
    };
  }

  /**
   * Validate package before installation
   * @param {string} packagePath - Path to the .lahat file
   * @returns {Promise<void>}
   */
  async _validatePackage(packagePath) {
    // Check if file exists and is readable
    try {
      await fs.access(packagePath);
    } catch (error) {
      throw new Error(`Package file not accessible: ${packagePath}`);
    }

    // Check file extension
    if (!packagePath.endsWith('.lahat')) {
      throw new Error('Package must have .lahat extension');
    }

    // Check file size (basic validation)
    const stats = await fs.stat(packagePath);
    if (stats.size === 0) {
      throw new Error('Package file is empty');
    }

    if (stats.size > 100 * 1024 * 1024) { // 100MB limit
      throw new Error('Package file is too large (>100MB)');
    }
  }

  /**
   * Extract manifest from package
   * @param {string} packagePath - Path to the .lahat file
   * @returns {Promise<Object>} Package manifest
   */
  async _extractManifest(packagePath) {
    return new Promise((resolve, reject) => {
      let manifestFound = false;
      
      createReadStream(packagePath)
        .pipe(Extract({ path: '', filter: (entry) => entry.path === 'manifest.json' }))
        .on('entry', async (entry) => {
          if (entry.path === 'manifest.json') {
            manifestFound = true;
            try {
              const chunks = [];
              entry.on('data', (chunk) => chunks.push(chunk));
              entry.on('end', () => {
                try {
                  const manifestContent = Buffer.concat(chunks).toString('utf8');
                  const manifest = JSON.parse(manifestContent);
                  resolve(manifest);
                } catch (error) {
                  reject(new Error(`Invalid manifest.json: ${error.message}`));
                }
              });
            } catch (error) {
              reject(error);
            }
          }
        })
        .on('finish', () => {
          if (!manifestFound) {
            reject(new Error('Package does not contain manifest.json'));
          }
        })
        .on('error', reject);
    });
  }

  /**
   * Prepare installation directory
   * @param {string} installPath - Installation path
   * @param {Object} options - Installation options
   * @returns {Promise<void>}
   */
  async _prepareInstallDirectory(installPath, options) {
    try {
      const stats = await fs.stat(installPath);
      if (stats.isDirectory()) {
        if (options.allowOverwrite || this.options.allowOverwrite) {
          await fs.rm(installPath, { recursive: true, force: true });
        } else {
          throw new Error(`Installation directory already exists: ${installPath}`);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    await fs.mkdir(installPath, { recursive: true });
  }

  /**
   * Extract package contents
   * @param {string} packagePath - Path to the .lahat file
   * @param {string} installPath - Installation path
   * @returns {Promise<void>}
   */
  async _extractPackage(packagePath, installPath) {
    return new Promise((resolve, reject) => {
      let filesExtracted = 0;
      
      createReadStream(packagePath)
        .pipe(Extract({ 
          path: installPath,
          filter: (entry) => entry.path !== 'manifest.json' // Skip manifest, we already have it
        }))
        .on('entry', (entry) => {
          if (entry.type === 'File') {
            filesExtracted++;
            this.emit('installation:progress', {
              filesExtracted,
              currentFile: entry.path
            });
          }
        })
        .on('finish', () => {
          this.emit('installation:extracted', { installPath, filesExtracted });
          resolve();
        })
        .on('error', reject);
    });
  }

  /**
   * Install Node.js dependencies
   * @param {string} installPath - Installation path
   * @returns {Promise<void>}
   */
  async _installDependencies(installPath) {
    const packageJsonPath = path.join(installPath, 'package.json');
    
    try {
      await fs.access(packageJsonPath);
      
      // Check if there are dependencies to install
      const packageContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0) {
        this.emit('dependencies:installing', { installPath });
        
        // In a real implementation, this would run npm install
        // For now, just simulate the process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.emit('dependencies:installed', { installPath });
      }
    } catch (error) {
      // No package.json or no dependencies - not an error
      console.warn('No dependencies to install or package.json not found');
    }
  }

  /**
   * Run post-install scripts
   * @param {string} installPath - Installation path
   * @param {Object} manifest - Package manifest
   * @returns {Promise<void>}
   */
  async _runPostInstallScripts(installPath, manifest) {
    // Check if there are post-install scripts defined
    if (manifest.lahat && manifest.lahat.postInstall) {
      this.emit('postinstall:running', { installPath, scripts: manifest.lahat.postInstall });
      
      // In a real implementation, this would execute the scripts
      // For now, just simulate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.emit('postinstall:completed', { installPath });
    }
  }

  /**
   * Run pre-uninstall scripts
   * @param {string} installPath - Installation path
   * @param {Object} manifest - Package manifest
   * @returns {Promise<void>}
   */
  async _runPreUninstallScripts(installPath, manifest) {
    // Check if there are pre-uninstall scripts defined
    if (manifest.lahat && manifest.lahat.preUninstall) {
      this.emit('preuninstall:running', { installPath, scripts: manifest.lahat.preUninstall });
      
      // In a real implementation, this would execute the scripts
      // For now, just simulate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.emit('preuninstall:completed', { installPath });
    }
  }

  /**
   * Register installed app
   * @param {string} appId - App ID
   * @param {string} installPath - Installation path
   * @param {Object} manifest - Package manifest
   * @param {string} packagePath - Original package path
   * @returns {Promise<Object>} App information
   */
  async _registerApp(appId, installPath, manifest, packagePath) {
    // Calculate installation size
    const installSize = await this._calculateDirectorySize(installPath);
    
    const appInfo = {
      id: appId,
      installPath,
      manifest,
      packagePath,
      installSize,
      installedAt: new Date().toISOString(),
      installedBy: 'Lahat App Installer v3.0.0',
      status: 'installed'
    };

    this.installedApps.set(appId, appInfo);
    await this._saveInstalledApps();

    return appInfo;
  }

  /**
   * Load installed apps registry
   * @returns {Promise<void>}
   */
  async _loadInstalledApps() {
    try {
      const registryPath = path.join(this.options.installDir, '.registry.json');
      const registryContent = await fs.readFile(registryPath, 'utf8');
      const registry = JSON.parse(registryContent);
      
      for (const [appId, appInfo] of Object.entries(registry.apps || {})) {
        this.installedApps.set(appId, appInfo);
      }
    } catch (error) {
      // Registry doesn't exist yet - not an error for first run
      console.log('No existing app registry found, starting fresh');
    }
  }

  /**
   * Save installed apps registry
   * @returns {Promise<void>}
   */
  async _saveInstalledApps() {
    try {
      await fs.mkdir(this.options.installDir, { recursive: true });
      
      const registryPath = path.join(this.options.installDir, '.registry.json');
      const registry = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        apps: Object.fromEntries(this.installedApps)
      };
      
      await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));
    } catch (error) {
      console.error('Failed to save app registry:', error);
    }
  }

  /**
   * Generate app ID
   * @param {string} name - App name
   * @param {string} version - App version
   * @returns {string} App ID
   */
  _generateAppId(name, version) {
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const sanitizedVersion = version.replace(/[^a-z0-9.-]/g, '');
    return `${sanitizedName}-${sanitizedVersion}`;
  }

  /**
   * Check if version is newer
   * @param {string} newVersion - New version string
   * @param {string} currentVersion - Current version string
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
    
    return false; // Versions are equal
  }

  /**
   * Create backup of current installation
   * @param {Object} appInfo - App information
   * @returns {Promise<string>} Backup path
   */
  async _createBackup(appInfo) {
    const backupPath = `${appInfo.installPath}.backup.${Date.now()}`;
    await fs.cp(appInfo.installPath, backupPath, { recursive: true });
    return backupPath;
  }

  /**
   * Restore backup
   * @param {string} backupPath - Backup path
   * @param {string} installPath - Original install path
   * @returns {Promise<void>}
   */
  async _restoreBackup(backupPath, installPath) {
    await fs.rm(installPath, { recursive: true, force: true });
    await fs.cp(backupPath, installPath, { recursive: true });
    await fs.rm(backupPath, { recursive: true, force: true });
  }

  /**
   * Calculate directory size
   * @param {string} dirPath - Directory path
   * @returns {Promise<number>} Size in bytes
   */
  async _calculateDirectorySize(dirPath) {
    let totalSize = 0;
    
    const calculateSize = async (currentPath) => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          await calculateSize(fullPath);
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }
    };
    
    await calculateSize(dirPath);
    return totalSize;
  }

  /**
   * Check installation integrity
   * @param {Object} appInfo - App information
   * @returns {Promise<Array>} List of issues found
   */
  async _checkInstallationIntegrity(appInfo) {
    const issues = [];
    
    try {
      // Check if install directory exists
      await fs.access(appInfo.installPath);
    } catch (error) {
      issues.push({ type: 'missing_directory', path: appInfo.installPath });
    }
    
    // Check for required files from manifest
    if (appInfo.manifest && appInfo.manifest.contents) {
      for (const fileInfo of appInfo.manifest.contents) {
        const filePath = path.join(appInfo.installPath, fileInfo.path);
        try {
          await fs.access(filePath);
        } catch (error) {
          issues.push({ type: 'missing_file', path: fileInfo.path });
        }
      }
    }
    
    return issues;
  }

  /**
   * Fix installation issue
   * @param {Object} appInfo - App information
   * @param {Object} issue - Issue to fix
   * @returns {Promise<void>}
   */
  async _fixInstallationIssue(appInfo, issue) {
    switch (issue.type) {
      case 'missing_directory':
        await fs.mkdir(issue.path, { recursive: true });
        break;
      case 'missing_file':
        // For now, just log that we can't fix missing files
        console.warn(`Cannot restore missing file: ${issue.path}`);
        break;
    }
  }
}
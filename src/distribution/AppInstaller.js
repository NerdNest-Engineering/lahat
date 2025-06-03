/**
 * App Installer - Install .lahat packages
 * TODO: Implement full installation functionality
 */

import fs from 'fs/promises';
import path from 'path';
import extract from 'extract-zip';
import { EventEmitter } from 'events';

export class AppInstaller extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      installDir: path.join(process.cwd(), 'installed-apps'),
      ...options
    };
  }

  /**
   * Install a .lahat package
   * @param {string} packagePath - Path to .lahat package file
   * @param {Object} options - Installation options
   * @returns {Promise<string>} Path to installed app
   */
  async installApp(packagePath, options = {}) {
    const packageName = path.basename(packagePath, '.lahat');
    const installPath = path.join(this.options.installDir, packageName);

    // Check if app already exists
    try {
      await fs.access(installPath);
      if (!options.overwrite) {
        throw new Error(`App already exists at ${installPath}. Use overwrite: true to replace.`);
      }
      // Remove existing installation
      await fs.rm(installPath, { recursive: true, force: true });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Ensure install directory exists
    await fs.mkdir(this.options.installDir, { recursive: true });

    // Extract package to install directory
    await extract(packagePath, { dir: installPath });

    // Remove metadata file if it exists
    try {
      await fs.unlink(path.join(installPath, '.lahat-metadata.json'));
    } catch (error) {
      // Ignore if metadata file doesn't exist
    }

    return installPath;
  }

  /**
   * Uninstall an app
   * @param {string} appName - Name of app to uninstall
   * @returns {Promise<boolean>} Success status
   */
  async uninstallApp(appName) {
    const installPath = path.join(this.options.installDir, appName);
    
    try {
      await fs.rm(installPath, { recursive: true, force: true });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * List installed apps
   * @returns {Promise<Array<string>>} List of installed app names
   */
  async listInstalledApps() {
    try {
      const entries = await fs.readdir(this.options.installDir, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get installed apps with metadata (alias for compatibility)
   * @param {Object} filter - Filter options
   * @returns {Promise<Array<Object>>} List of installed apps with metadata
   */
  async getInstalledApps(filter = {}) {
    try {
      const appNames = await this.listInstalledApps();
      const apps = [];
      
      for (const appName of appNames) {
        const appPath = path.join(this.options.installDir, appName);
        try {
          // Try to read package.json or manifest for metadata
          let manifest = {};
          try {
            const packagePath = path.join(appPath, 'package.json');
            const packageData = await fs.readFile(packagePath, 'utf8');
            manifest = JSON.parse(packageData);
          } catch (error) {
            // Fallback to basic info if no package.json
            manifest = {
              name: appName,
              version: '1.0.0'
            };
          }
          
          apps.push({
            id: appName,
            name: manifest.name || appName,
            version: manifest.version || '1.0.0',
            path: appPath,
            manifest
          });
        } catch (error) {
          console.error(`Error reading app metadata for ${appName}:`, error);
        }
      }
      
      return apps;
    } catch (error) {
      console.error('Error getting installed apps:', error);
      return [];
    }
  }
}
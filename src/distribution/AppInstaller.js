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
}
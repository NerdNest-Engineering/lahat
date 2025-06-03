/**
 * Distribution Preload Module
 * Self-contained preload functionality for app distribution and installation
 */

export class DistributionPreload {
  constructor(ipcRenderer) {
    this.ipcRenderer = ipcRenderer;
  }

  /**
   * Get the preload API methods for distribution functionality
   * @returns {Object} Distribution API methods
   */
  getAPI() {
    return {
      // App installation and management
      getInstalledApps: async (filter = {}) => {
        try {
          return await this.ipcRenderer.invoke('get-installed-apps', filter);
        } catch (error) {
          console.error('Error getting installed apps:', error);
          throw error;
        }
      },

      installApp: async (packagePath, options = {}) => {
        try {
          return await this.ipcRenderer.invoke('install-app', packagePath, options);
        } catch (error) {
          console.error('Error installing app:', error);
          throw error;
        }
      },

      uninstallApp: async (appId, options = {}) => {
        try {
          return await this.ipcRenderer.invoke('uninstall-app', appId, options);
        } catch (error) {
          console.error('Error uninstalling app:', error);
          throw error;
        }
      },

      startApp: async (appId, options = {}) => {
        try {
          return await this.ipcRenderer.invoke('start-app', appId, options);
        } catch (error) {
          console.error('Error starting app:', error);
          throw error;
        }
      },

      stopApp: async (appId) => {
        try {
          return await this.ipcRenderer.invoke('stop-app', appId);
        } catch (error) {
          console.error('Error stopping app:', error);
          throw error;
        }
      },

      // App packaging
      packageApp: async (projectPath, outputPath, options = {}) => {
        try {
          return await this.ipcRenderer.invoke('package-app', projectPath, outputPath, options);
        } catch (error) {
          console.error('Error packaging app:', error);
          throw error;
        }
      }
    };
  }

  /**
   * Get event listeners for distribution functionality
   * @returns {Object} Event listener methods
   */
  getEventListeners() {
    return {
      // Installation progress listeners
      onInstallProgress: (callback) => {
        this.ipcRenderer.on('install-progress', (_event, progress) => callback(progress));
      },

      onInstallComplete: (callback) => {
        this.ipcRenderer.on('install-complete', (_event, result) => callback(result));
      },

      // Packaging progress listeners
      onPackageProgress: (callback) => {
        this.ipcRenderer.on('package-progress', (_event, progress) => callback(progress));
      },

      onPackageComplete: (callback) => {
        this.ipcRenderer.on('package-complete', (_event, result) => callback(result));
      }
    };
  }

  /**
   * Get cleanup methods for event listeners
   * @returns {Object} Cleanup methods
   */
  getCleanupMethods() {
    return {
      removeDistributionListeners: () => {
        this.ipcRenderer.removeAllListeners('install-progress');
        this.ipcRenderer.removeAllListeners('install-complete');
        this.ipcRenderer.removeAllListeners('package-progress');
        this.ipcRenderer.removeAllListeners('package-complete');
      }
    };
  }
}

export default DistributionPreload;
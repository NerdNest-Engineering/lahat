/**
 * App Importer Preload Module
 * Self-contained preload functionality for app import
 */

export class ImporterPreload {
  constructor(ipcRenderer) {
    this.ipcRenderer = ipcRenderer;
  }

  /**
   * Get the preload API methods for app importer functionality
   * @returns {Object} App importer API methods
   */
  getAPI() {
    return {
      // Core import functionality
      importMiniApp: async () => {
        try {
          return await this.ipcRenderer.invoke('import-app');
        } catch (error) {
          console.error('Error importing mini app:', error);
          throw error;
        }
      },

      importMiniAppFromUrl: async (url) => {
        try {
          return await this.ipcRenderer.invoke('import-app-from-url', url);
        } catch (error) {
          console.error('Error importing mini app from URL:', error);
          throw error;
        }
      },

      getImportedApps: async () => {
        try {
          return await this.ipcRenderer.invoke('get-imported-apps');
        } catch (error) {
          console.error('Error getting imported apps:', error);
          throw error;
        }
      },

      validateImportFile: async (filePath) => {
        try {
          return await this.ipcRenderer.invoke('validate-import-file', filePath);
        } catch (error) {
          console.error('Error validating import file:', error);
          throw error;
        }
      }
    };
  }

  /**
   * Get event listeners for app importer functionality
   * @returns {Object} Event listener methods
   */
  getEventListeners() {
    return {
      // Import progress listeners (if needed in the future)
      onImportProgress: (callback) => {
        this.ipcRenderer.on('import-progress', (_event, progress) => callback(progress));
      },

      onImportComplete: (callback) => {
        this.ipcRenderer.on('import-complete', (_event, result) => callback(result));
      }
    };
  }

  /**
   * Get cleanup methods for event listeners
   * @returns {Object} Cleanup methods
   */
  getCleanupMethods() {
    return {
      removeImportListeners: () => {
        this.ipcRenderer.removeAllListeners('import-progress');
        this.ipcRenderer.removeAllListeners('import-complete');
      }
    };
  }
}

export default ImporterPreload;
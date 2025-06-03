/**
 * App Manager Preload Module
 * Self-contained preload functionality for app management
 */

export class ManagerPreload {
  constructor(ipcRenderer) {
    this.ipcRenderer = ipcRenderer;
  }

  /**
   * Get the preload API methods for app manager functionality
   * @returns {Object} App manager API methods
   */
  getAPI() {
    return {
      // Core app management
      listMiniApps: async () => {
        try {
          return await this.ipcRenderer.invoke('list-mini-apps');
        } catch (error) {
          console.error('Error listing mini apps:', error);
          throw error;
        }
      },

      openMiniApp: async (params) => {
        try {
          return await this.ipcRenderer.invoke('open-mini-app', params);
        } catch (error) {
          console.error('Error opening mini app:', error);
          throw error;
        }
      },

      deleteMiniApp: async (params) => {
        try {
          return await this.ipcRenderer.invoke('delete-mini-app', params);
        } catch (error) {
          console.error('Error deleting mini app:', error);
          throw error;
        }
      },

      exportMiniApp: async (params) => {
        try {
          return await this.ipcRenderer.invoke('export-mini-app', params);
        } catch (error) {
          console.error('Error exporting mini app:', error);
          throw error;
        }
      },

      openAppDirectory: async () => {
        try {
          return await this.ipcRenderer.invoke('open-app-directory');
        } catch (error) {
          console.error('Error opening app directory:', error);
          throw error;
        }
      },

      // App search functionality
      searchApps: async (query, options = {}) => {
        try {
          return await this.ipcRenderer.invoke('search-apps', query, options);
        } catch (error) {
          console.error('Error searching apps:', error);
          throw error;
        }
      },

      // Running app management
      getRunningApps: async () => {
        try {
          return await this.ipcRenderer.invoke('get-running-apps');
        } catch (error) {
          console.error('Error getting running apps:', error);
          throw error;
        }
      }
    };
  }

  /**
   * Get event listeners for app manager functionality
   * @returns {Object} Event listener methods
   */
  getEventListeners() {
    return {
      // Listen for app updates
      onAppUpdated: (callback) => {
        this.ipcRenderer.on('app-updated', () => callback());
      },

      // Listen for app list refresh requests
      onRefreshAppList: (callback) => {
        this.ipcRenderer.on('refresh-app-list', () => callback());
      }
    };
  }

  /**
   * Get cleanup methods for event listeners
   * @returns {Object} Cleanup methods
   */
  getCleanupMethods() {
    return {
      removeAppManagerListeners: () => {
        this.ipcRenderer.removeAllListeners('app-updated');
        this.ipcRenderer.removeAllListeners('refresh-app-list');
      }
    };
  }
}

export default ManagerPreload;
/**
 * Window Manager Preload Module
 * Self-contained preload functionality for window management
 */

export class WindowPreload {
  constructor(ipcRenderer) {
    this.ipcRenderer = ipcRenderer;
  }

  /**
   * Get the preload API methods for window management functionality
   * @returns {Object} Window management API methods
   */
  getAPI() {
    return {
      // Core window management
      openWindow: async (type, params = {}) => {
        try {
          return await this.ipcRenderer.invoke('open-window', { type, params });
        } catch (error) {
          console.error('Error opening window:', error);
          throw error;
        }
      },

      closeWindow: () => {
        try {
          this.ipcRenderer.invoke('close-current-window');
        } catch (error) {
          console.error('Error closing window:', error);
          throw error;
        }
      },

      closeCurrentWindow: () => {
        try {
          this.ipcRenderer.invoke('close-current-window');
        } catch (error) {
          console.error('Error closing window:', error);
          throw error;
        }
      },

      getWindowParams: async () => {
        try {
          return await this.ipcRenderer.invoke('get-window-params');
        } catch (error) {
          console.error('Error getting window params:', error);
          throw error;
        }
      },

      // Inter-window communication
      notifyAppUpdated: () => {
        try {
          this.ipcRenderer.invoke('notify-app-updated');
        } catch (error) {
          console.error('Error notifying app updated:', error);
          throw error;
        }
      },

      notifyApiKeyUpdated: () => {
        try {
          this.ipcRenderer.invoke('notify-api-key-updated');
        } catch (error) {
          console.error('Error notifying API key updated:', error);
          throw error;
        }
      },

      notifyAppCreated: async (params) => {
        try {
          return await this.ipcRenderer.invoke('notify-app-created', params);
        } catch (error) {
          console.error('Error notifying app created:', error);
          throw error;
        }
      }
    };
  }

  /**
   * Get event listeners for window management functionality
   * @returns {Object} Event listener methods
   */
  getEventListeners() {
    return {
      // Inter-window communication listeners
      onAppUpdated: (callback) => {
        this.ipcRenderer.on('app-updated', () => callback());
      },

      onApiKeyUpdated: (callback) => {
        this.ipcRenderer.on('api-key-updated', () => callback());
      },

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
      removeWindowListeners: () => {
        this.ipcRenderer.removeAllListeners('app-updated');
        this.ipcRenderer.removeAllListeners('api-key-updated');
        this.ipcRenderer.removeAllListeners('refresh-app-list');
      }
    };
  }
}

export default WindowPreload;
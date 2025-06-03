/**
 * App Creator Preload Module
 * Self-contained preload functionality for app creation
 */

export class AppCreatorPreload {
  constructor(ipcRenderer) {
    this.ipcRenderer = ipcRenderer;
  }

  /**
   * Get the preload API methods for app creator functionality
   * @returns {Object} App creator API methods
   */
  getAPI() {
    return {
      // App generation and management
      createAppFolder: async (params) => {
        try {
          return await this.ipcRenderer.invoke('create-app-folder', params);
        } catch (error) {
          console.error('Error creating app folder:', error);
          throw error;
        }
      },

      generateApp: async (params) => {
        try {
          return await this.ipcRenderer.invoke('generate-mini-app', params);
        } catch (error) {
          console.error('Error generating app:', error);
          throw error;
        }
      },

      generateMiniApp: async (params) => {
        try {
          return await this.ipcRenderer.invoke('generate-mini-app', params);
        } catch (error) {
          console.error('Error generating mini app:', error);
          throw error;
        }
      },

      updateMiniApp: async (params) => {
        try {
          return await this.ipcRenderer.invoke('update-mini-app', params);
        } catch (error) {
          console.error('Error updating mini app:', error);
          throw error;
        }
      },

      // Title and description generation
      generateTitleAndDescription: async (params) => {
        try {
          return await this.ipcRenderer.invoke('generate-title-and-description', params);
        } catch (error) {
          console.error('Error generating title and description:', error);
          throw error;
        }
      },

      // Logo generation
      generateLogo: async (params) => {
        try {
          return await this.ipcRenderer.invoke('generate-logo', params);
        } catch (error) {
          console.error('Error generating logo:', error);
          throw error;
        }
      },

      regenerateLogo: async (params) => {
        try {
          return await this.ipcRenderer.invoke('regenerate-logo', params);
        } catch (error) {
          console.error('Error regenerating logo:', error);
          throw error;
        }
      },

      testLogoGeneration: async () => {
        try {
          return await this.ipcRenderer.invoke('test-logo-generation');
        } catch (error) {
          console.error('Error testing logo generation:', error);
          throw error;
        }
      },

      // App creation settings
      getAppCreationSettings: async () => {
        try {
          const result = await this.ipcRenderer.invoke('get-app-creation-settings');
          return result.success ? result.settings : null;
        } catch (error) {
          console.error('Error getting app creation settings:', error);
          throw error;
        }
      },

      saveAppCreationSettings: async (settings) => {
        try {
          const result = await this.ipcRenderer.invoke('save-app-creation-settings', settings);
          return result.success;
        } catch (error) {
          console.error('Error saving app creation settings:', error);
          throw error;
        }
      },

      updateDefaultCredentials: async (credentials) => {
        try {
          const result = await this.ipcRenderer.invoke('update-default-credentials', credentials);
          return result.success;
        } catch (error) {
          console.error('Error updating default credentials:', error);
          throw error;
        }
      },

      clearDefaultCredentials: async () => {
        try {
          const result = await this.ipcRenderer.invoke('clear-default-credentials');
          return result.success;
        } catch (error) {
          console.error('Error clearing default credentials:', error);
          throw error;
        }
      }
    };
  }

  /**
   * Get event listeners for app creator functionality
   * @returns {Object} Event listener methods
   */
  getEventListeners() {
    return {
      // Event listeners for generation progress
      onGenerationStatus: (callback) => {
        this.ipcRenderer.on('generation-status', (_event, status) => callback(status));
      },

      onGenerationChunk: (callback) => {
        this.ipcRenderer.on('generation-chunk', (_event, chunk) => callback(chunk));
      },

      onTitleDescriptionChunk: (callback) => {
        this.ipcRenderer.on('title-description-chunk', (_event, chunk) => callback(chunk));
      },

      onLogoGenerationProgress: (callback) => {
        this.ipcRenderer.on('logo-generation-progress', (_event, progress) => callback(progress));
      }
    };
  }

  /**
   * Get cleanup methods for event listeners
   * @returns {Object} Cleanup methods
   */
  getCleanupMethods() {
    return {
      removeGenerationListeners: () => {
        this.ipcRenderer.removeAllListeners('generation-status');
        this.ipcRenderer.removeAllListeners('generation-chunk');
        this.ipcRenderer.removeAllListeners('title-description-chunk');
        this.ipcRenderer.removeAllListeners('logo-generation-progress');
      }
    };
  }
}

export default AppCreatorPreload;
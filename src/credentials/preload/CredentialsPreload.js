/**
 * Credentials Preload Module
 * Self-contained preload functionality for credential management
 */

export class CredentialsPreload {
  constructor(ipcRenderer) {
    this.ipcRenderer = ipcRenderer;
  }

  /**
   * Get the preload API methods for credentials functionality
   * @returns {Object} Credentials API methods
   */
  getAPI() {
    return {
      // Core credential management
      saveCredential: async (credentialData) => {
        try {
          return await this.ipcRenderer.invoke('save-credential', credentialData);
        } catch (error) {
          console.error('Error saving credential:', error);
          throw error;
        }
      },

      loadCredentials: async () => {
        try {
          return await this.ipcRenderer.invoke('load-credentials');
        } catch (error) {
          console.error('Error loading credentials:', error);
          throw error;
        }
      },

      getCredentialValue: async (credentialId) => {
        try {
          return await this.ipcRenderer.invoke('get-credential-value', credentialId);
        } catch (error) {
          console.error('Error getting credential value:', error);
          throw error;
        }
      },

      deleteCredential: async (credentialId) => {
        try {
          return await this.ipcRenderer.invoke('delete-credential', credentialId);
        } catch (error) {
          console.error('Error deleting credential:', error);
          throw error;
        }
      },

      updateCredentialLastUsed: async (credentialId) => {
        try {
          return await this.ipcRenderer.invoke('update-credential-last-used', credentialId);
        } catch (error) {
          console.error('Error updating credential last used:', error);
          throw error;
        }
      },

      // Legacy API key management (for backward compatibility)
      setApiKey: async (apiKey) => {
        try {
          return await this.ipcRenderer.invoke('set-api-key', apiKey);
        } catch (error) {
          console.error('Error setting API key:', error);
          throw error;
        }
      },

      checkApiKey: async () => {
        try {
          return await this.ipcRenderer.invoke('check-api-key');
        } catch (error) {
          console.error('Error checking API key:', error);
          throw error;
        }
      },

      setOpenAIApiKey: async (apiKey) => {
        try {
          return await this.ipcRenderer.invoke('set-openai-api-key', apiKey);
        } catch (error) {
          console.error('Error setting OpenAI API key:', error);
          throw error;
        }
      },

      checkOpenAIApiKey: async () => {
        try {
          return await this.ipcRenderer.invoke('check-openai-api-key');
        } catch (error) {
          console.error('Error checking OpenAI API key:', error);
          throw error;
        }
      },

      deleteOpenAIApiKey: async () => {
        try {
          return await this.ipcRenderer.invoke('delete-openai-api-key');
        } catch (error) {
          console.error('Error deleting OpenAI API key:', error);
          throw error;
        }
      }
    };
  }

  /**
   * Get event listeners for credentials functionality
   * @returns {Object} Event listener methods
   */
  getEventListeners() {
    return {
      // Listen for API key updates
      onApiKeyUpdated: (callback) => {
        this.ipcRenderer.on('api-key-updated', () => callback());
      }
    };
  }

  /**
   * Get cleanup methods for event listeners
   * @returns {Object} Cleanup methods
   */
  getCleanupMethods() {
    return {
      removeCredentialListeners: () => {
        this.ipcRenderer.removeAllListeners('api-key-updated');
      }
    };
  }
}

export default CredentialsPreload;
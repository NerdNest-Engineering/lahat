const { contextBridge, ipcRenderer } = require('electron');

// Synchronously expose a basic API first, then enhance it with modules
const basicAPI = {
  // General IPC invoke method that works immediately
  invoke: async (channel, ...args) => {
    try {
      return await ipcRenderer.invoke(channel, ...args);
    } catch (error) {
      console.error(`Error invoking ${channel}:`, error);
      throw error;
    }
  },
  
  // Event listener methods
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Core functionality that needs to work immediately
  loadCredentials: async () => {
    try {
      return await ipcRenderer.invoke('load-credentials');
    } catch (error) {
      console.error('Error loading credentials:', error);
      throw error;
    }
  },

  saveCredential: async (credentialData) => {
    try {
      return await ipcRenderer.invoke('save-credential', credentialData);
    } catch (error) {
      console.error('Error saving credential:', error);
      throw error;
    }
  },

  getCredentialValue: async (credentialId) => {
    try {
      return await ipcRenderer.invoke('get-credential-value', credentialId);
    } catch (error) {
      console.error('Error getting credential value:', error);
      throw error;
    }
  },

  deleteCredential: async (credentialId) => {
    try {
      return await ipcRenderer.invoke('delete-credential', credentialId);
    } catch (error) {
      console.error('Error deleting credential:', error);
      throw error;
    }
  },

  // Window management
  openWindow: async (type, params = {}) => {
    try {
      return await ipcRenderer.invoke('open-window', { type, params });
    } catch (error) {
      console.error('Error opening window:', error);
      throw error;
    }
  },

  closeWindow: () => {
    try {
      ipcRenderer.invoke('close-current-window');
    } catch (error) {
      console.error('Error closing window:', error);
      throw error;
    }
  },

  // App management
  listMiniApps: async () => {
    try {
      return await ipcRenderer.invoke('list-mini-apps');
    } catch (error) {
      console.error('Error listing mini apps:', error);
      throw error;
    }
  },

  openMiniApp: async (params) => {
    try {
      return await ipcRenderer.invoke('open-mini-app', params);
    } catch (error) {
      console.error('Error opening mini app:', error);
      throw error;
    }
  },

  deleteMiniApp: async (params) => {
    try {
      return await ipcRenderer.invoke('delete-mini-app', params);
    } catch (error) {
      console.error('Error deleting mini app:', error);
      throw error;
    }
  },

  exportMiniApp: async (params) => {
    try {
      return await ipcRenderer.invoke('export-mini-app', params);
    } catch (error) {
      console.error('Error exporting mini app:', error);
      throw error;
    }
  },

  importMiniApp: async () => {
    try {
      return await ipcRenderer.invoke('import-app');
    } catch (error) {
      console.error('Error importing mini app:', error);
      throw error;
    }
  },

  // App creation
  createAppFolder: async (params) => {
    try {
      return await ipcRenderer.invoke('create-app-folder', params);
    } catch (error) {
      console.error('Error creating app folder:', error);
      throw error;
    }
  },

  generateMiniApp: async (params) => {
    try {
      return await ipcRenderer.invoke('generate-mini-app', params);
    } catch (error) {
      console.error('Error generating mini app:', error);
      throw error;
    }
  },

  // Event listeners
  onAppUpdated: (callback) => {
    ipcRenderer.on('app-updated', () => callback());
  },

  onRefreshAppList: (callback) => {
    ipcRenderer.on('refresh-app-list', () => callback());
  },

  onGenerationStatus: (callback) => {
    ipcRenderer.on('generation-status', (_event, status) => callback(status));
  },

  onGenerationChunk: (callback) => {
    ipcRenderer.on('generation-chunk', (_event, chunk) => callback(chunk));
  },

  // App creation settings
  getAppCreationSettings: async () => {
    try {
      const result = await ipcRenderer.invoke('get-app-creation-settings');
      return result.success ? result.settings : null;
    } catch (error) {
      console.error('Error getting app creation settings:', error);
      throw error;
    }
  },

  saveAppCreationSettings: async (settings) => {
    try {
      const result = await ipcRenderer.invoke('save-app-creation-settings', settings);
      return result.success;
    } catch (error) {
      console.error('Error saving app creation settings:', error);
      throw error;
    }
  },

  updateDefaultCredentials: async (credentials) => {
    try {
      const result = await ipcRenderer.invoke('update-default-credentials', credentials);
      return result.success;
    } catch (error) {
      console.error('Error updating default credentials:', error);
      throw error;
    }
  },

  clearDefaultCredentials: async () => {
    try {
      const result = await ipcRenderer.invoke('clear-default-credentials');
      return result.success;
    } catch (error) {
      console.error('Error clearing default credentials:', error);
      throw error;
    }
  },

  // Additional methods needed by app creation
  generateTitleAndDescription: async (params) => {
    try {
      return await ipcRenderer.invoke('generate-title-and-description', params);
    } catch (error) {
      console.error('Error generating title and description:', error);
      throw error;
    }
  },

  generateLogo: async (params) => {
    try {
      return await ipcRenderer.invoke('generate-logo', params);
    } catch (error) {
      console.error('Error generating logo:', error);
      throw error;
    }
  },

  updateMiniApp: async (params) => {
    try {
      return await ipcRenderer.invoke('update-mini-app', params);
    } catch (error) {
      console.error('Error updating mini app:', error);
      throw error;
    }
  },

  // More event listeners
  onTitleDescriptionChunk: (callback) => {
    ipcRenderer.on('title-description-chunk', (_event, chunk) => callback(chunk));
  },

  onLogoGenerationProgress: (callback) => {
    ipcRenderer.on('logo-generation-progress', (_event, progress) => callback(progress));
  },

  updateCredentialLastUsed: async (credentialId) => {
    try {
      return await ipcRenderer.invoke('update-credential-last-used', credentialId);
    } catch (error) {
      console.error('Error updating credential last used:', error);
      throw error;
    }
  },

  // Distribution management
  getInstalledApps: async (filter = {}) => {
    try {
      return await ipcRenderer.invoke('get-installed-apps', filter);
    } catch (error) {
      console.error('Error getting installed apps:', error);
      throw error;
    }
  },

  searchApps: async (query, options = {}) => {
    try {
      return await ipcRenderer.invoke('search-apps', query, options);
    } catch (error) {
      console.error('Error searching apps:', error);
      throw error;
    }
  },

  openAppDirectory: async () => {
    try {
      return await ipcRenderer.invoke('open-app-directory');
    } catch (error) {
      console.error('Error opening app directory:', error);
      throw error;
    }
  }
};

// Add a cleanup method for future use
basicAPI.cleanupAllListeners = () => {
  // Basic cleanup - remove all listeners
  const channels = [
    'app-updated', 'refresh-app-list', 'generation-status', 'generation-chunk', 
    'title-description-chunk', 'logo-generation-progress'
  ];
  channels.forEach(channel => {
    ipcRenderer.removeAllListeners(channel);
  });
};

// Expose the complete API immediately
contextBridge.exposeInMainWorld('electronAPI', basicAPI);

console.log('Electron API exposed successfully with all required methods');
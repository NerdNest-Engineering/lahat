const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// IPC communication with the main process
contextBridge.exposeInMainWorld(
  'electronAPI', 
  {
    // Window management
    openWindow: async (type, params = {}) => {
      try {
        return await ipcRenderer.invoke('open-window', { type, params });
      } catch (error) {
        console.error('Error opening window:', error);
        throw error;
      }
    },
    closeCurrentWindow: () => {
      try {
        ipcRenderer.invoke('close-current-window');
      } catch (error) {
        console.error('Error closing window:', error);
        throw error;
      }
    },
    getWindowParams: async () => {
      try {
        return await ipcRenderer.invoke('get-window-params');
      } catch (error) {
        console.error('Error getting window params:', error);
        throw error;
      }
    },
    
    // Inter-window communication
    notifyAppUpdated: () => {
      try {
        ipcRenderer.invoke('notify-app-updated');
      } catch (error) {
        console.error('Error notifying app updated:', error);
        throw error;
      }
    },
    notifyApiKeyUpdated: () => {
      try {
        ipcRenderer.invoke('notify-api-key-updated');
      } catch (error) {
        console.error('Error notifying API key updated:', error);
        throw error;
      }
    },
    onAppUpdated: (callback) => {
      ipcRenderer.on('app-updated', () => callback());
    },
    onApiKeyUpdated: (callback) => {
      ipcRenderer.on('api-key-updated', () => callback());
    },
    
    // Claude API key management
    setApiKey: async (apiKey) => {
      try {
        return await ipcRenderer.invoke('set-api-key', apiKey);
      } catch (error) {
        console.error('Error setting API key:', error);
        throw error;
      }
    },
    checkApiKey: async () => {
      try {
        return await ipcRenderer.invoke('check-api-key');
      } catch (error) {
        console.error('Error checking API key:', error);
        throw error;
      }
    },
    
    // Mini app generation and management
    generateMiniApp: async (params) => {
      try {
        return await ipcRenderer.invoke('generate-mini-app', params);
      } catch (error) {
        console.error('Error generating mini app:', error);
        throw error;
      }
    },
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
    updateMiniApp: async (params) => {
      try {
        return await ipcRenderer.invoke('update-mini-app', params);
      } catch (error) {
        console.error('Error updating mini app:', error);
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
        return await ipcRenderer.invoke('import-mini-app');
      } catch (error) {
        console.error('Error importing mini app:', error);
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
    },
    
    // Event listeners for generation progress
    onGenerationStatus: (callback) => {
      ipcRenderer.on('generation-status', (_event, status) => callback(status));
    },
    onGenerationChunk: (callback) => {
      ipcRenderer.on('generation-chunk', (_event, chunk) => callback(chunk));
    },
    
    // Title and description generation
    generateTitleAndDescription: async (params) => {
      try {
        return await ipcRenderer.invoke('generate-title-and-description', params);
      } catch (error) {
        console.error('Error generating title and description:', error);
        throw error;
      }
    },
    onTitleDescriptionChunk: (callback) => {
      ipcRenderer.on('title-description-chunk', (_event, chunk) => callback(chunk));
    },
    
    // Mini App Iteration APIs
    getAppIterationData: () => ipcRenderer.invoke('get-app-iteration-data'), // Handler added in miniAppHandlers.js
    iterateOnMiniApp: (params) => ipcRenderer.invoke('iterate-on-mini-app', params),
    getVersionHistory: (params) => ipcRenderer.invoke('get-version-history', params),
    restoreVersion: (params) => ipcRenderer.invoke('restore-version', params),
    
    // Event listeners for iteration
    onIterationStatus: (callback) => ipcRenderer.on('iteration-status', (_event, status) => callback(status)),
    onIterationResponse: (callback) => ipcRenderer.on('iteration-response', (_event, data) => callback(data)),
    onVersionCreated: (callback) => ipcRenderer.on('version-created', (_event, versionData) => callback(versionData)),
    onInitAppIteration: (callback) => ipcRenderer.on('init-app-iteration', (_event, data) => callback(data)) // Listener for initial data
  }
);

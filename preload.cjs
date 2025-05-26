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
    closeWindow: () => {
      try {
        ipcRenderer.invoke('close-current-window');
      } catch (error) {
        console.error('Error closing window:', error);
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
    notifyAppCreated: async (params) => {
      try {
        return await ipcRenderer.invoke('notify-app-created', params);
      } catch (error) {
        console.error('Error notifying app created:', error);
        throw error;
      }
    },
    onAppUpdated: (callback) => {
      ipcRenderer.on('app-updated', () => callback());
    },
    onApiKeyUpdated: (callback) => {
      ipcRenderer.on('api-key-updated', () => callback());
    },
    onRefreshAppList: (callback) => {
      ipcRenderer.on('refresh-app-list', () => callback());
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
    
    // OpenAI API key management
    setOpenAIApiKey: async (apiKey) => {
      try {
        return await ipcRenderer.invoke('set-openai-api-key', apiKey);
      } catch (error) {
        console.error('Error setting OpenAI API key:', error);
        throw error;
      }
    },
    checkOpenAIApiKey: async () => {
      try {
        return await ipcRenderer.invoke('check-openai-api-key');
      } catch (error) {
        console.error('Error checking OpenAI API key:', error);
        throw error;
      }
    },
    deleteOpenAIApiKey: async () => {
      try {
        return await ipcRenderer.invoke('delete-openai-api-key');
      } catch (error) {
        console.error('Error deleting OpenAI API key:', error);
        throw error;
      }
    },
    
    // Logo generation
    generateLogo: async (params) => {
      try {
        return await ipcRenderer.invoke('generate-logo', params);
      } catch (error) {
        console.error('Error generating logo:', error);
        throw error;
      }
    },
    regenerateLogo: async (params) => {
      try {
        return await ipcRenderer.invoke('regenerate-logo', params);
      } catch (error) {
        console.error('Error regenerating logo:', error);
        throw error;
      }
    },
    testLogoGeneration: async () => {
      try {
        return await ipcRenderer.invoke('test-logo-generation');
      } catch (error) {
        console.error('Error testing logo generation:', error);
        throw error;
      }
    },
    onLogoGenerationProgress: (callback) => {
      ipcRenderer.on('logo-generation-progress', (_event, progress) => callback(progress));
    },
    
    // App generation and management
    createAppFolder: async (params) => {
      try {
        return await ipcRenderer.invoke('create-app-folder', params);
      } catch (error) {
        console.error('Error creating app folder:', error);
        throw error;
      }
    },
    generateApp: async (params) => {
      try {
        return await ipcRenderer.invoke('generate-mini-app', params);
      } catch (error) {
        console.error('Error generating app:', error);
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
    
    // Event listener cleanup methods
    removeListener: (channel, callback) => {
      ipcRenderer.removeListener(channel, callback);
    },
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    }
  }
);

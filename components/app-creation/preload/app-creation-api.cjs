/**
 * App Creation API
 * Exposes app creation functionality to the renderer process via contextBridge
 */
const { contextBridge, ipcRenderer } = require('electron');

/**
 * Set up the app creation API
 */
function setupAppCreationAPI() {
  contextBridge.exposeInMainWorld('appCreationService', {
    // Title and description generation
    generateTitleAndDescription: async (input) => {
      return await ipcRenderer.invoke('generate-title-and-description', { input });
    },
    
    // Widget generation
    generateWidget: async (params) => {
      return await ipcRenderer.invoke('generate-widget', params);
    },
    
    // Widget management
    listWidgets: async () => {
      return await ipcRenderer.invoke('list-widgets');
    },
    
    openWidget: async (appId, filePath, name) => {
      return await ipcRenderer.invoke('open-widget', { appId, filePath, name });
    },
    
    updateWidget: async (appId, prompt) => {
      return await ipcRenderer.invoke('update-widget', { appId, prompt });
    },
    
    deleteWidget: async (appId) => {
      return await ipcRenderer.invoke('delete-widget', { appId });
    },
    
    // Events
    onGenerationProgress: (callback) => {
      const listener = (_, chunk) => callback(chunk);
      ipcRenderer.on('generation-chunk', listener);
      return () => ipcRenderer.removeListener('generation-chunk', listener);
    },
    
    onGenerationStatus: (callback) => {
      const listener = (_, status) => callback(status);
      ipcRenderer.on('generation-status', listener);
      return () => ipcRenderer.removeListener('generation-status', listener);
    },
    
    onTitleDescriptionProgress: (callback) => {
      const listener = (_, chunk) => callback(chunk);
      ipcRenderer.on('title-description-chunk', listener);
      return () => ipcRenderer.removeListener('title-description-chunk', listener);
    }
  });
}

module.exports = { setupAppCreationAPI };

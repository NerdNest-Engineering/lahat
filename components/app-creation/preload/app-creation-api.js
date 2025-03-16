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
    
    // Mini app generation
    generateMiniApp: async (params) => {
      return await ipcRenderer.invoke('generate-mini-app', params);
    },
    
    // Mini app management
    listMiniApps: async () => {
      return await ipcRenderer.invoke('list-mini-apps');
    },
    
    openMiniApp: async (appId, filePath, name) => {
      return await ipcRenderer.invoke('open-mini-app', { appId, filePath, name });
    },
    
    updateMiniApp: async (appId, prompt) => {
      return await ipcRenderer.invoke('update-mini-app', { appId, prompt });
    },
    
    deleteMiniApp: async (appId) => {
      return await ipcRenderer.invoke('delete-mini-app', { appId });
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

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// IPC communication with the main process
contextBridge.exposeInMainWorld(
  'electronAPI', 
  {
    // Basic window management
    closeWindow: () => {
      ipcRenderer.send('close-window');
    },
    
    // Placeholder for app list functionality
    listApps: async () => {
      try {
        return await ipcRenderer.invoke('list-apps');
      } catch (error) {
        console.error('Error listing apps:', error);
        return { apps: [] };
      }
    },
    
    // Placeholder for app opening functionality
    openApp: async (appId) => {
      try {
        return await ipcRenderer.invoke('open-app', { appId });
      } catch (error) {
        console.error('Error opening app:', error);
        return { success: false, error: error.message };
      }
    }
  }
);

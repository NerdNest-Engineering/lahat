/**
 * Preload script for the app-list module
 * 
 * This script is loaded before the renderer process and provides a secure
 * way to expose APIs from the main process to the renderer process.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'appListAPI', {
    // App management
    getApps: () => ipcRenderer.invoke('app-list:get-apps'),
    getAppById: (appId) => ipcRenderer.invoke('app-list:get-app-by-id', appId),
    
    // Navigation
    openApp: (appId) => ipcRenderer.invoke('app-list:open-app', appId),
    openAppCreator: () => ipcRenderer.invoke('app-list:open-app-creator'),
    openSettings: () => ipcRenderer.invoke('app-list:open-settings'),
    
    // Events
    onAppCreated: (callback) => {
      // Wrap the callback to avoid exposing the event object to the renderer
      const subscription = (event, app) => callback(app);
      ipcRenderer.on('app-list:app-created', subscription);
      
      // Return a function to remove the event listener
      return () => {
        ipcRenderer.removeListener('app-list:app-created', subscription);
      };
    },
    
    onAppUpdated: (callback) => {
      const subscription = (event, app) => callback(app);
      ipcRenderer.on('app-list:app-updated', subscription);
      return () => {
        ipcRenderer.removeListener('app-list:app-updated', subscription);
      };
    },
    
    onAppDeleted: (callback) => {
      const subscription = (event, appId) => callback(appId);
      ipcRenderer.on('app-list:app-deleted', subscription);
      return () => {
        ipcRenderer.removeListener('app-list:app-deleted', subscription);
      };
    }
  }
);

// Log when the preload script has loaded
console.log('App List preload script loaded');

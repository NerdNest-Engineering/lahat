const { contextBridge, ipcRenderer } = require('electron');
const { setupAppCreationAPI } = require('./components/app-creation/preload/index.cjs');

// Set up the app creation API
setupAppCreationAPI();

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
    
    // Widget generation and management
    generateWidget: async (params) => {
      try {
        return await ipcRenderer.invoke('generate-widget', params);
      } catch (error) {
        console.error('Error generating widget:', error);
        throw error;
      }
    },
    
    // Dashboard management
    listDashboards: async () => {
      try {
        return await ipcRenderer.invoke('list-dashboards');
      } catch (error) {
        console.error('Error listing dashboards:', error);
        throw error;
      }
    },
    createDashboard: async (params) => {
      try {
        return await ipcRenderer.invoke('create-dashboard', params);
      } catch (error) {
        console.error('Error creating dashboard:', error);
        throw error;
      }
    },
    getDashboard: async (dashboardId) => {
      try {
        return await ipcRenderer.invoke('get-dashboard', { dashboardId });
      } catch (error) {
        console.error('Error getting dashboard:', error);
        throw error;
      }
    },
    updateDashboard: async (dashboardId, updates) => {
      try {
        return await ipcRenderer.invoke('update-dashboard', { dashboardId, updates });
      } catch (error) {
        console.error('Error updating dashboard:', error);
        throw error;
      }
    },
    deleteDashboard: async (dashboardId) => {
      try {
        return await ipcRenderer.invoke('delete-dashboard', { dashboardId });
      } catch (error) {
        console.error('Error deleting dashboard:', error);
        throw error;
      }
    },
    openDashboard: async (dashboardId) => {
      try {
        return await ipcRenderer.invoke('open-dashboard', { dashboardId });
      } catch (error) {
        console.error('Error opening dashboard:', error);
        throw error;
      }
    },
    createTemporaryDashboard: async (widget) => {
      try {
        return await ipcRenderer.invoke('create-temporary-dashboard', { widget });
      } catch (error) {
        console.error('Error creating temporary dashboard:', error);
        throw error;
      }
    },
    addWidgetToDashboard: async (dashboardId, widget, position) => {
      try {
        return await ipcRenderer.invoke('add-widget-to-dashboard', { dashboardId, widget, position });
      } catch (error) {
        console.error('Error adding widget to dashboard:', error);
        throw error;
      }
    },
    removeWidgetFromDashboard: async (dashboardId, widgetId) => {
      try {
        return await ipcRenderer.invoke('remove-widget-from-dashboard', { dashboardId, widgetId });
      } catch (error) {
        console.error('Error removing widget from dashboard:', error);
        throw error;
      }
    },
    listWidgets: async () => {
      try {
        return await ipcRenderer.invoke('list-widgets');
      } catch (error) {
        console.error('Error listing widgets:', error);
        throw error;
      }
    },
    openWidget: async (params) => {
      try {
        return await ipcRenderer.invoke('open-widget', params);
      } catch (error) {
        console.error('Error opening widget:', error);
        throw error;
      }
    },
    updateWidget: async (params) => {
      try {
        return await ipcRenderer.invoke('update-widget', params);
      } catch (error) {
        console.error('Error updating widget:', error);
        throw error;
      }
    },
    deleteWidget: async (params) => {
      try {
        return await ipcRenderer.invoke('delete-widget', params);
      } catch (error) {
        console.error('Error deleting widget:', error);
        throw error;
      }
    },
    exportWidget: async (params) => {
      try {
        return await ipcRenderer.invoke('export-widget', params);
      } catch (error) {
        console.error('Error exporting widget:', error);
        throw error;
      }
    },
    importWidget: async () => {
      try {
        return await ipcRenderer.invoke('import-widget');
      } catch (error) {
        console.error('Error importing widget:', error);
        throw error;
      }
    },
    openAppDirectory: async () => {
      try {
        return await ipcRenderer.invoke('open-widget-directory');
      } catch (error) {
        console.error('Error opening app directory:', error);
        throw error;
      }
    },
    
    // Event listeners for generation progress
    // Note: These are kept for backward compatibility
    // New code should use the appCreationService API
    onGenerationStatus: (callback) => {
      ipcRenderer.on('generation-status', (_event, status) => callback(status));
    },
    onGenerationChunk: (callback) => {
      ipcRenderer.on('generation-chunk', (_event, chunk) => callback(chunk));
    },
    
    // Title and description generation
    // Note: These are kept for backward compatibility
    // New code should use the appCreationService API
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
    }
  }
);

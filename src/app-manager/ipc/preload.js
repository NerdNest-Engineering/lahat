/**
 * App Manager Preload Script
 * Sets up IPC communication between the renderer process and the main process
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose protected methods that allow the renderer process to use
 * the ipcRenderer without exposing the entire object
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Load an app by ID
   * @param {string} appId - The app ID
   * @returns {Promise<Object>} - The app data
   */
  loadApp: (appId) => ipcRenderer.invoke('app-manager:load-app', appId),
  
  /**
   * Load a component by name
   * @param {string} componentName - The component name
   * @returns {Promise<Object>} - The component data
   */
  loadComponent: (componentName) => ipcRenderer.invoke('app-manager:load-component', componentName),
  
  /**
   * Get available widgets
   * @returns {Promise<Array>} - Array of available widgets
   */
  getAvailableWidgets: () => ipcRenderer.invoke('app-manager:get-available-widgets'),
  
  /**
   * Save app layout
   * @param {string} appId - The app ID
   * @param {Object} layout - The layout data
   * @returns {Promise<Object>} - The result
   */
  saveAppLayout: (appId, layout) => ipcRenderer.invoke('app-manager:save-app-layout', { appId, layout }),
  
  /**
   * Create a new widget
   */
  createNewWidget: () => ipcRenderer.send('app-manager:create-new-widget'),
  
  /**
   * Return to app list
   */
  returnToAppList: () => ipcRenderer.send('window:open', 'app-list'),
  
  /**
   * Set up a handler for app loaded events
   * @param {Function} callback - The callback function
   */
  onAppLoaded: (callback) => {
    ipcRenderer.on('app-manager:app-loaded', (event, appData) => callback(appData));
  },
  
  /**
   * Set up a handler for component loaded events
   * @param {Function} callback - The callback function
   */
  onComponentLoaded: (callback) => {
    ipcRenderer.on('app-manager:component-loaded', (event, componentData) => callback(componentData));
  },
  
  /**
   * Set up a handler for widget added events
   * @param {Function} callback - The callback function
   */
  onWidgetAdded: (callback) => {
    ipcRenderer.on('app-manager:widget-added', (event, widgetData) => callback(widgetData));
  }
});

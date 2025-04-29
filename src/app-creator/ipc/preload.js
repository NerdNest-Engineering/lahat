/**
 * App Creator Preload Script
 * Sets up IPC communication between the renderer process and the main process
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose protected methods that allow the renderer process to use
 * the ipcRenderer without exposing the entire object
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Check if the API key is set
   * @returns {Promise<Object>} - Object with hasApiKey and apiKey properties
   */
  checkApiKey: () => ipcRenderer.invoke('claude:check-api-key'),
  
  /**
   * Generate title and description
   * @param {Object} options - Options for generation
   * @param {string} options.input - The user input
   * @returns {Promise<Object>} - The generation result
   */
  generateTitleAndDescription: (options) => ipcRenderer.invoke('claude:generate-title-description', options),
  
  /**
   * Generate a widget
   * @param {Object} options - Options for generation
   * @param {string} options.appName - The app name
   * @param {string} options.prompt - The app description
   * @returns {Promise<Object>} - The generation result
   */
  generateWidget: (options) => ipcRenderer.invoke('claude:generate-widget', options),
  
  /**
   * Notify that an app has been updated
   */
  notifyAppUpdated: () => ipcRenderer.send('app:updated'),
  
  /**
   * Open a window
   * @param {string} windowName - The window name
   */
  openWindow: (windowName) => ipcRenderer.send('window:open', windowName),
  
  /**
   * Close the current window
   */
  closeCurrentWindow: () => ipcRenderer.send('window:close-current'),
  
  /**
   * Set up a handler for title/description chunks
   * @param {Function} callback - The callback function
   */
  onTitleDescriptionChunk: (callback) => {
    ipcRenderer.on('claude:title-description-chunk', (event, chunk) => callback(chunk));
  },
  
  /**
   * Set up a handler for generation chunks
   * @param {Function} callback - The callback function
   */
  onGenerationChunk: (callback) => {
    ipcRenderer.on('claude:generation-chunk', (event, chunk) => callback(chunk));
  }
});

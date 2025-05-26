import { ipcMain, BrowserWindow } from 'electron';
import * as windowManager from '../windowManager/windowManager.js';

/**
 * Window Handlers Module
 * Responsible for window management IPC handlers
 */

// Track window parameters
const windowParams = new Map();

/**
 * Handle opening a window
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for opening the window
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleOpenWindow(event, { type, params = {} }) {
  try {
    // Store params for the window to retrieve later
    const win = windowManager.showWindow(type);
    const windowId = win.id;
    windowParams.set(windowId, params);
    
    return { success: true };
  } catch (error) {
    console.error('Error opening window:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle closing the current window
 * @param {Object} event - IPC event
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleCloseCurrentWindow(event) {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.close();
    }
    return { success: true };
  } catch (error) {
    console.error('Error closing window:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle getting window parameters
 * @param {Object} event - IPC event
 * @returns {Object} - Window parameters
 */
function handleGetWindowParams(event) {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      return windowParams.get(win.id) || {};
    }
    return {};
  } catch (error) {
    console.error('Error getting window params:', error);
    return {};
  }
}

/**
 * Handle notifying all windows that an app was updated
 * @param {Object} event - IPC event
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleNotifyAppUpdated(event) {
  try {
    // Broadcast to all windows
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed() && win.webContents !== event.sender) {
        win.webContents.send('app-updated');
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Error notifying app updated:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle notifying all windows that the API key was updated
 * @param {Object} event - IPC event
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleNotifyApiKeyUpdated(event) {
  try {
    // Broadcast to all windows
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed() && win.webContents !== event.sender) {
        win.webContents.send('api-key-updated');
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Error notifying API key updated:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle notifying main window that a new app was created
 * @param {Object} event - IPC event
 * @param {Object} params - App creation details
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleNotifyAppCreated(event, { appId, name }) {
  try {
    // Find the main window (not the app creation window)
    const mainWindow = BrowserWindow.getAllWindows().find(win => 
      win.webContents.getTitle().includes('Lahat') && 
      !win.webContents.getURL().includes('app-creation')
    );
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Send refresh signal to main window
      mainWindow.webContents.send('app-updated');
      
      // Don't steal focus from the newly created mini app window
      // The mini app window will naturally get focus when it opens
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error notifying app created:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Register window-related IPC handlers
 */
export function registerHandlers() {
  // Window management IPC handlers
  ipcMain.handle('open-window', handleOpenWindow);
  ipcMain.handle('close-current-window', handleCloseCurrentWindow);
  ipcMain.handle('get-window-params', handleGetWindowParams);
  
  // Inter-window communication IPC handlers
  ipcMain.handle('notify-app-updated', handleNotifyAppUpdated);
  ipcMain.handle('notify-api-key-updated', handleNotifyApiKeyUpdated);
  ipcMain.handle('notify-app-created', handleNotifyAppCreated);
  
  console.log('Window handlers registered');
}

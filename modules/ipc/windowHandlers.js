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
 * Handle creating an external window
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for creating the window
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleCreateExternalWindow(event, { type, url }) {
  try {
    console.log('Creating external window:', event);
    console.log('Creating external window:', { type, url });
    const win = windowManager.createExternalWindow(type, url);
    return { success: true, windowId: win.id };
  } catch (error) {
    console.error('Error creating external window:', error);
    return { success: false, error: error.message };
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
 * Register window-related IPC handlers
 */
export function registerHandlers() {
  // Window management IPC handlers
  ipcMain.handle('open-window', handleOpenWindow);
  ipcMain.handle('create-external-window', handleCreateExternalWindow);
  ipcMain.handle('close-current-window', handleCloseCurrentWindow);
  ipcMain.handle('get-window-params', handleGetWindowParams);
  
  // Inter-window communication IPC handlers
  ipcMain.handle('notify-app-updated', handleNotifyAppUpdated);
  ipcMain.handle('notify-api-key-updated', handleNotifyApiKeyUpdated);
  
  console.log('Window handlers registered');
}

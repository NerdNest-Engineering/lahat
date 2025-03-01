import { BrowserWindow } from 'electron';
import path from 'path';
import * as windowManager from './windowManager/windowManager.js';
import * as fileOperations from './utils/fileOperations.js';

/**
 * Mini App Manager Module
 * Responsible for creating and managing mini app windows
 */

// Track all mini app windows
const miniAppWindows = new Map();

/**
 * Create a mini app window
 * @param {string} appName - Name of the mini app
 * @param {string} htmlContent - HTML content of the mini app
 * @param {string} filePath - Path to the HTML file (optional)
 * @param {string} conversationId - Conversation ID for the mini app
 * @returns {Promise<Object>} - Result object with success flag, filePath, and windowId
 */
export async function createMiniAppWindow(appName, htmlContent, filePath, conversationId) {
  console.log('Creating mini app window:', { appName, filePath, conversationId });
  
  try {
    // Create a temporary file for the HTML content if no filePath is provided
    let tempFilePath = filePath;
    if (!tempFilePath) {
      const tempResult = await fileOperations.createTempFile(htmlContent);
      if (!tempResult.success) {
        return { 
          success: false, 
          error: tempResult.error 
        };
      }
      tempFilePath = tempResult.filePath;
    } else {
      // If filePath is provided, ensure the HTML content is written to it
      const writeResult = await fileOperations.writeFile(tempFilePath, htmlContent);
      if (!writeResult.success) {
        return { 
          success: false, 
          error: writeResult.error 
        };
      }
    }
    
    console.log('HTML content written to file:', tempFilePath);
    
    // Create the window using the window manager
    const win = windowManager.createMiniAppWindow(appName, htmlContent, filePath, conversationId);
    
    // Add event listeners for window events
    win.on('close', () => console.log('Window close event triggered for:', appName));
    win.on('closed', () => {
      console.log('Window closed event triggered for:', appName);
      if (conversationId) {
        miniAppWindows.delete(conversationId);
      }
      
      // Delete the temp file if it's not a saved app
      if (!filePath) {
        fileOperations.deleteFile(tempFilePath).catch((err) => {
          console.error('Error deleting temp file:', err);
        });
      }
    });
    
    try {
      console.log('Loading file into window:', tempFilePath);
      win.loadFile(tempFilePath);
      
      // Open DevTools for debugging
      if (process.env.NODE_ENV === 'development') {
        win.webContents.openDevTools({ mode: 'detach' });
      }
      
      // Add error event listener
      win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load file:', errorDescription, errorCode);
      });
      
      // Ensure window is focused and visible
      win.focus();
      win.moveTop();
      
      console.log('File loaded successfully');
    } catch (error) {
      console.error('Error loading file into window:', error);
      win.close();
      return { 
        success: false, 
        error: `Error loading file: ${error.message}` 
      };
    }
    
    // Store the window reference
    if (conversationId) {
      console.log('Storing window reference for conversation:', conversationId);
      miniAppWindows.set(conversationId, {
        window: win,
        filePath: tempFilePath,
        name: appName
      });
    }
    
    return { 
      success: true, 
      filePath: tempFilePath,
      windowId: win.id
    };
  } catch (error) {
    console.error('Failed to create mini app window:', error);
    return { 
      success: false, 
      error: `Failed to create mini app window: ${error.message}` 
    };
  }
}

/**
 * Open an existing mini app
 * @param {string} appId - ID of the mini app
 * @param {string} filePath - Path to the HTML file
 * @param {string} name - Name of the mini app
 * @returns {Promise<Object>} - Result object with success flag, filePath, and windowId
 */
export async function openMiniApp(appId, filePath, name) {
  console.log('Opening mini app:', { appId, filePath, name });
  
  try {
    // Check if the window is already open
    if (miniAppWindows.has(appId)) {
      const existingWindow = miniAppWindows.get(appId).window;
      if (!existingWindow.isDestroyed()) {
        console.log('Window already exists, focusing it');
        existingWindow.focus();
        return { success: true };
      }
    }
    
    // Read the file content
    const readResult = await fileOperations.readFile(filePath);
    if (!readResult.success) {
      return readResult;
    }
    
    // Create a new window
    console.log('Creating mini app window for:', name);
    const result = await createMiniAppWindow(name, readResult.content, filePath, appId);
    
    return result;
  } catch (error) {
    console.error('Error opening mini app:', error);
    return {
      success: false,
      error: `Error opening mini app: ${error.message}`
    };
  }
}

/**
 * Update an existing mini app
 * @param {string} appId - ID of the mini app
 * @param {string} htmlContent - New HTML content
 * @param {string} filePath - Path to the HTML file
 * @returns {Promise<Object>} - Result object with success flag and filePath
 */
export async function updateMiniApp(appId, htmlContent, filePath) {
  console.log('Updating mini app:', { appId, filePath });
  
  try {
    // Write the updated content to the file
    const writeResult = await fileOperations.writeFile(filePath, htmlContent);
    if (!writeResult.success) {
      return writeResult;
    }
    
    // If the window is open, update it
    if (miniAppWindows.has(appId)) {
      const appWindow = miniAppWindows.get(appId);
      if (!appWindow.window.isDestroyed()) {
        // Update the window content
        appWindow.window.loadFile(filePath);
      }
    }
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Error updating mini app:', error);
    return {
      success: false,
      error: `Error updating mini app: ${error.message}`
    };
  }
}

/**
 * Close a mini app window
 * @param {string} appId - ID of the mini app
 * @returns {boolean} - True if window was closed
 */
export function closeMiniApp(appId) {
  console.log('Closing mini app:', appId);
  
  if (miniAppWindows.has(appId)) {
    const appWindow = miniAppWindows.get(appId);
    if (!appWindow.window.isDestroyed()) {
      appWindow.window.close();
    }
    miniAppWindows.delete(appId);
    return true;
  }
  
  return false;
}

/**
 * Get a mini app window
 * @param {string} appId - ID of the mini app
 * @returns {Object|null} - Mini app window object or null if not found
 */
export function getMiniApp(appId) {
  return miniAppWindows.get(appId) || null;
}

/**
 * Get all mini app windows
 * @returns {Map<string, Object>} - Map of mini app windows
 */
export function getAllMiniApps() {
  return miniAppWindows;
}

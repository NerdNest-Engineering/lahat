import { BrowserWindow } from 'electron';
import path from 'path';
import * as windowManager from './windowManager/windowManager.js';
import * as fileOperations from './utils/fileOperations.js';
import { setActiveWidget, clearActiveWidget } from './utils/activeAppState.js';

/**
 * Widget Manager Module
 * Responsible for creating and managing widget windows
 */

// Track all widget windows
const widgetWindows = new Map();

/**
 * Create a widget window
 * @param {string} appName - Name of the widget
 * @param {string} componentContent - Component content of the widget (optional)
 * @param {string} filePath - Path to the HTML file
 * @param {string} conversationId - Conversation ID for the widget
 * @returns {Promise<Object>} - Result object with success flag, filePath, and windowId
 */
export async function createWidgetWindow(appName, componentContent, filePath, conversationId) {
  console.log('Creating widget window:', { appName, filePath, conversationId });
  
  try {
    // Verify the HTML file exists
    if (!filePath) {
      return { 
        success: false, 
        error: 'No file path provided for widget'
      };
    }
    
    try {
      const readResult = await fileOperations.readFile(filePath);
      if (!readResult.success) {
        return { 
          success: false, 
          error: `Failed to read widget file: ${readResult.error}` 
        };
      }
    } catch (error) {
      console.error('Error verifying file:', error);
      return { 
        success: false, 
        error: `Error verifying widget file: ${error.message}` 
      };
    }
    
    console.log('Widget file verified:', filePath);
    
    // Create the window using the window manager
    const win = windowManager.createWidgetWindow(appName, componentContent, filePath, conversationId);
    
    // Add event listeners for window events
    win.on('close', () => console.log('Window close event triggered for:', appName));
    win.on('closed', () => {
      console.log('Window closed event triggered for:', appName);
      if (conversationId) {
        widgetWindows.delete(conversationId);
        
        // Clear active widget
        clearActiveWidget();
      }
    });
    
    try {
      console.log('Loading file into window:', filePath);
      win.loadFile(filePath);
      
      // DevTools are disabled for widgets to prevent Autofill API errors
      // Uncomment the following code if you need DevTools for debugging widgets
      /*
      if (process.env.NODE_ENV === 'development') {
        win.webContents.openDevTools({ mode: 'detach' });
      }
      */
      
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
      const appInfo = {
        window: win,
        filePath: filePath,
        name: appName
      };
      
      widgetWindows.set(conversationId, appInfo);
      
      // Set as active widget
      setActiveWidget({
        id: conversationId,
        name: appName,
        filePath: filePath
      });
    }
    
    return { 
      success: true, 
      filePath: filePath,
      windowId: win.id
    };
  } catch (error) {
    console.error('Failed to create widget window:', error);
    return { 
      success: false, 
      error: `Failed to create widget window: ${error.message}` 
    };
  }
}

/**
 * Open an existing widget
 * @param {string} appId - ID of the widget
 * @param {string} filePath - Path to the HTML file
 * @param {string} name - Name of the widget
 * @returns {Promise<Object>} - Result object with success flag, filePath, and windowId
 */
export async function openWidget(appId, filePath, name) {
  console.log('Opening widget:', { appId, filePath, name });
  
  try {
    // Check if the window is already open
    if (widgetWindows.has(appId)) {
      const existingWindow = widgetWindows.get(appId).window;
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
    console.log('Creating widget window for:', name);
    const result = await createWidgetWindow(name, readResult.content, filePath, appId);
    
    return result;
  } catch (error) {
    console.error('Error opening widget:', error);
    return {
      success: false,
      error: `Error opening widget: ${error.message}`
    };
  }
}

/**
 * Update an existing widget
 * @param {string} appId - ID of the widget
 * @param {string} componentContent - New component content
 * @param {string} filePath - Path to the HTML file
 * @param {string} componentFilePath - Path to the component file (optional)
 * @returns {Promise<Object>} - Result object with success flag and filePath
 */
export async function updateWidget(appId, componentContent, filePath, componentFilePath) {
  console.log('Updating widget:', { appId, filePath, componentFilePath });
  
  try {
    // If componentFilePath is provided, write the component content to it
    if (componentContent && componentFilePath) {
      console.log('Writing component content to:', componentFilePath);
      const writeComponentResult = await fileOperations.writeFile(componentFilePath, componentContent);
      if (!writeComponentResult.success) {
        return writeComponentResult;
      }
    }
    
    // If the window is open, update it by reloading the HTML file
    if (widgetWindows.has(appId)) {
      const appWindow = widgetWindows.get(appId);
      if (!appWindow.window.isDestroyed()) {
        // Update the window content
        appWindow.window.loadFile(filePath);
      }
    }
    
    return { 
      success: true, 
      filePath,
      componentFilePath
    };
  } catch (error) {
    console.error('Error updating widget:', error);
    return {
      success: false,
      error: `Error updating widget: ${error.message}`
    };
  }
}

/**
 * Close a widget window
 * @param {string} appId - ID of the widget
 * @returns {boolean} - True if window was closed
 */
export function closeWidget(appId) {
  console.log('Closing widget:', appId);
  
  if (widgetWindows.has(appId)) {
    const appWindow = widgetWindows.get(appId);
    if (!appWindow.window.isDestroyed()) {
      appWindow.window.close();
    }
    widgetWindows.delete(appId);
    
    // Clear active widget
    clearActiveWidget();
    
    return true;
  }
  
  return false;
}

/**
 * Get a widget window
 * @param {string} appId - ID of the widget
 * @returns {Object|null} - Widget window object or null if not found
 */
export function getWidget(appId) {
  return widgetWindows.get(appId) || null;
}

/**
 * Get all widget windows
 * @returns {Map<string, Object>} - Map of widget windows
 */
export function getAllWidgets() {
  return widgetWindows;
}

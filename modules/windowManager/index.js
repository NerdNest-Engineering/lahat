/**
 * Window Manager Module Index
 * Exports all window manager modules from a single entry point
 */

// Import electron modules
import { screen, app, BrowserWindow } from 'electron';
import store from '../../store.js';

// Import from windowManager.js
import { 
  WindowType,
  createWindow,
  createMiniAppWindow,
  getWindow,
  hasWindow,
  showWindow,
  closeWindow,
  closeAllWindows,
  sendToWindow,
  broadcastToWindows
} from './windowManager.js';

// Re-export from windowManager.js
export {
  WindowType,
  createWindow,
  createMiniAppWindow,
  getWindow,
  hasWindow,
  showWindow,
  closeWindow,
  closeAllWindows,
  sendToWindow,
  broadcastToWindows
};

// Import and export from windowManager-web-components.js
// Rename exports to avoid conflicts
import * as webComponentsManager from './windowManager-web-components.js';
export { webComponentsManager };

// Window Pool
export * from './windowPool.js';
import { windowPool } from './windowPool.js';

/**
 * Initialize the window manager
 * This function should be called once at application startup
 */
export function initializeWindowManager() {
  // Initialize window pool
  console.log('Window pool initialized with max size:', windowPool.maxPoolSize);
  
  // Initialize main screen dimensions for better window placement
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  // Store primary screen dimensions for use in window positioning
  store.set('primaryScreenDimensions', { width, height });
  
  // Configure dock/taskbar click behavior for macOS
  if (process.platform === 'darwin') {
    app.setActivationPolicy('regular'); // Ensure dock icon is visible
  }
  
  return {
    windowPool
  };
}

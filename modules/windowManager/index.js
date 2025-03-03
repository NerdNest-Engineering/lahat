/**
 * Window Manager Module Index
 * Exports all window manager modules from a single entry point
 */

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
  
  return {
    windowPool
  };
}

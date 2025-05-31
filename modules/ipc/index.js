/**
 * IPC Module Index
 * Exports all IPC-related modules from a single entry point
 */

// IPC Types and Constants
export * from './ipcTypes.js';

// IPC Handler
export * from './ipcHandler.js';

// Re-export existing IPC handlers
export * from './apiHandlers.js';
export * from './miniAppHandlers.js';
export * from './windowHandlers.js';
export * from './credentialHandlers.js';

/**
 * Initialize all IPC handlers
 * This function should be called once at application startup
 */
export function initializeIpcHandlers() {
  const { ipcHandler } = require('./ipcHandler.js');
  const apiHandlers = require('./apiHandlers.js');
  const miniAppHandlers = require('./miniAppHandlers.js');
  const windowHandlers = require('./windowHandlers.js');
  const credentialHandlers = require('./credentialHandlers.js');
  
  // Register API handlers
  apiHandlers.registerHandlers(ipcHandler);
  
  // Register mini app handlers
  miniAppHandlers.registerHandlers(ipcHandler);
  
  // Register window handlers
  windowHandlers.registerHandlers(ipcHandler);
  
  // Register credential handlers
  credentialHandlers.registerHandlers(ipcHandler);
  
  console.log('All IPC handlers registered');
  
  return ipcHandler;
}

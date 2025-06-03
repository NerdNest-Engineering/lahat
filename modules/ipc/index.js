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
export * from './appCreationHandlers.js';

/**
 * Initialize all IPC handlers
 * This function should be called once at application startup
 */
export function initializeIpcHandlers() {
  // Import ES modules dynamically
  import('./ipcHandler.js').then(({ ipcHandler }) => {
    import('./apiHandlers.js').then(apiHandlers => {
      apiHandlers.registerHandlers(ipcHandler);
    });
    
    import('./miniAppHandlers.js').then(miniAppHandlers => {
      miniAppHandlers.registerHandlers(ipcHandler);
    });
    
    import('./windowHandlers.js').then(windowHandlers => {
      windowHandlers.registerHandlers(ipcHandler);
    });
    
    import('./credentialHandlers.js').then(credentialHandlers => {
      credentialHandlers.registerHandlers(ipcHandler);
    });
    
    import('./appCreationHandlers.js').then(appCreationHandlers => {
      appCreationHandlers.registerHandlers(ipcHandler);
    });
    
    console.log('All IPC handlers registered');
    return ipcHandler;
  });
}

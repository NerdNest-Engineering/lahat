/**
 * App Importer Module
 * Self-contained module for importing app packages
 */

// Core functionality
export { default as ImportEngine } from './core/ImportEngine.js';

// UI Components
export { ImportCommandPalette, importCommandPalette } from './ui/ImportCommandPalette.js';

// IPC Handlers
export { registerImportHandlers } from './ipc/ImportHandlers.js';

// API Interface
export { default as ImportAPI } from './api/ImportAPI.js';

/**
 * Initialize the app importer module
 * This function should be called once during application startup
 */
export function initializeAppImporter() {
  // Register IPC handlers for import functionality
  const { registerImportHandlers } = require('./ipc/ImportHandlers.js');
  registerImportHandlers();
  
  // Initialize the import command palette
  const { importCommandPalette } = require('./ui/ImportCommandPalette.js');
  
  // Return the initialized components
  return {
    importCommandPalette,
    ImportEngine: require('./core/ImportEngine.js').default,
    ImportAPI: require('./api/ImportAPI.js').default
  };
}

/**
 * Default export - initialize function for easy setup
 */
export default initializeAppImporter;
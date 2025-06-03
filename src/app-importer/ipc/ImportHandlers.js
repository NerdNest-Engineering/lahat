/**
 * Import IPC Handlers
 * Self-contained IPC handlers for app import functionality
 */

import { dialog, ipcMain } from 'electron';
import ImportEngine from '../core/ImportEngine.js';
import { createSuccessResponse, createErrorResponse } from '../../../modules/ipc/ipcTypes.js';

// Initialize import engine
const importEngine = new ImportEngine();

/**
 * Handle app import from file dialog
 * @param {Object} event - IPC event
 * @returns {Promise<Object>} Import result
 */
async function handleImportApp(event) {
  try {
    // Show file dialog
    const result = await dialog.showOpenDialog({
      title: 'Import App Package',
      filters: [
        { name: 'Lahat App Packages', extensions: ['lahat', 'zip'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || !result.filePaths.length) {
      return createErrorResponse('Import canceled', 'import-app');
    }

    const filePath = result.filePaths[0];
    
    // Import the app
    const importResult = await importEngine.importFromFile(filePath);
    
    if (importResult.success) {
      return createSuccessResponse({
        name: importResult.name,
        path: importResult.path,
        metadata: importResult.metadata
      });
    } else {
      return createErrorResponse(importResult.error, 'import-app');
    }

  } catch (error) {
    console.error('Error in handleImportApp:', error);
    return createErrorResponse(error.message, 'import-app');
  }
}

/**
 * Handle app import from URL
 * @param {Object} event - IPC event
 * @param {string} url - URL to import from
 * @returns {Promise<Object>} Import result
 */
async function handleImportAppFromUrl(event, url) {
  try {
    if (!url || typeof url !== 'string') {
      return createErrorResponse('Invalid URL provided', 'import-app-from-url');
    }

    // Import from URL
    const importResult = await importEngine.importFromUrl(url);
    
    if (importResult.success) {
      return createSuccessResponse({
        name: importResult.name,
        path: importResult.path,
        metadata: importResult.metadata
      });
    } else {
      return createErrorResponse(importResult.error, 'import-app-from-url');
    }

  } catch (error) {
    console.error('Error in handleImportAppFromUrl:', error);
    return createErrorResponse(error.message, 'import-app-from-url');
  }
}

/**
 * Handle getting list of imported apps
 * @param {Object} event - IPC event
 * @returns {Promise<Object>} List of imported apps
 */
async function handleGetImportedApps(event) {
  try {
    const importedApps = await importEngine.getImportedApps();
    
    return createSuccessResponse({
      apps: importedApps,
      count: importedApps.length
    });

  } catch (error) {
    console.error('Error in handleGetImportedApps:', error);
    return createErrorResponse(error.message, 'get-imported-apps');
  }
}

/**
 * Handle import validation (check if file can be imported)
 * @param {Object} event - IPC event
 * @param {string} filePath - Path to file to validate
 * @returns {Promise<Object>} Validation result
 */
async function handleValidateImportFile(event, filePath) {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return createErrorResponse('Invalid file path provided', 'validate-import-file');
    }

    // Check if format is supported
    if (!importEngine.isValidFormat(filePath)) {
      return createErrorResponse(
        `Unsupported format. Supported formats: ${importEngine.supportedFormats.join(', ')}`,
        'validate-import-file'
      );
    }

    // Create temp directory for validation
    const extractPath = await importEngine.createTempDirectory();

    try {
      // Extract and validate package
      await importEngine.extractPackage(filePath, extractPath);
      const metadata = await importEngine.validatePackage(extractPath);

      // Cleanup temp directory
      await importEngine.cleanup(extractPath);

      return createSuccessResponse({
        valid: true,
        metadata: metadata,
        message: 'Package is valid and can be imported'
      });

    } catch (error) {
      // Cleanup on error
      await importEngine.cleanup(extractPath);
      
      return createSuccessResponse({
        valid: false,
        error: error.message,
        message: 'Package validation failed'
      });
    }

  } catch (error) {
    console.error('Error in handleValidateImportFile:', error);
    return createErrorResponse(error.message, 'validate-import-file');
  }
}

/**
 * Register import IPC handlers
 * @param {Object} ipcHandler - Optional IPC handler instance
 */
export function registerImportHandlers(ipcHandler) {
  const handlers = {
    'import-app': handleImportApp,
    'import-app-from-url': handleImportAppFromUrl,
    'get-imported-apps': handleGetImportedApps,
    'validate-import-file': handleValidateImportFile
  };

  if (ipcHandler && typeof ipcHandler.registerMultiple === 'function') {
    // Use the provided IPC handler
    ipcHandler.registerMultiple(handlers);
  } else {
    // Register directly with ipcMain
    Object.entries(handlers).forEach(([channel, handler]) => {
      ipcMain.handle(channel, handler);
    });
  }

  console.log('Import IPC handlers registered');
}

// Export individual handlers for testing
export {
  handleImportApp,
  handleImportAppFromUrl,
  handleGetImportedApps,
  handleValidateImportFile
};
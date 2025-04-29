import { ipcMain, dialog, app } from 'electron';
import path from 'path';
import * as fileOperations from '../utils/fileOperations.js';
import * as apiHandlers from './apiHandlers.js';
import * as miniAppManager from '../miniAppManager.js';
import * as titleDescriptionGenerator from '../utils/titleDescriptionGenerator.js';
import store from '../../store.js';
import fs from 'fs/promises';

/**
 * Mini App Handlers Module
 * Responsible for mini app generation and management IPC handlers
 */

/**
 * Handle generating a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for generating the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleGenerateMiniApp(event, { prompt, appName }) {
  try {
    const claudeClient = apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Start streaming response
    event.sender.send('generation-status', {
      status: 'generating',
      message: 'Generating your mini app...'
    });
    
    const response = await claudeClient.generateApp(prompt);
    let htmlContent = '';
    
    // Stream the response
    for await (const streamEvent of response) {
      if (streamEvent.type === 'content_block_delta' && streamEvent.delta.type === 'text_delta') {
        htmlContent += streamEvent.delta.text || '';
        event.sender.send('generation-chunk', {
          content: streamEvent.delta.text || '',
          done: false
        });
      }
    }
    
    // Signal completion
    event.sender.send('generation-chunk', {
      done: true
    });
    
    // Save the generated app
    const savedApp = await claudeClient.saveGeneratedApp(
      appName || 'Mini App',
      htmlContent,
      prompt
    );
    
    // Create a window for the app
    const windowResult = await miniAppManager.createMiniAppWindow(
      savedApp.metadata.name,
      htmlContent,
      savedApp.filePath,
      savedApp.metadata.conversationId
    );
    
    if (!windowResult.success) {
      return {
        success: false,
        error: windowResult.error
      };
    }
    
    // Update recent apps list
    const recentApps = store.get('recentApps') || [];
    recentApps.unshift({
      id: savedApp.metadata.conversationId,
      name: savedApp.metadata.name,
      created: savedApp.metadata.created,
      filePath: savedApp.filePath
    });
    
    // Keep only the 10 most recent apps
    if (recentApps.length > 10) {
      recentApps.length = 10;
    }
    
    store.set('recentApps', recentApps);
    
    return { 
      success: true,
      appId: savedApp.metadata.conversationId,
      name: savedApp.metadata.name
    };
  } catch (error) {
    event.sender.send('generation-status', {
      status: 'error',
      message: `Error: ${error.message}`
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle listing mini apps
 * @returns {Promise<Object>} - Result object with apps list
 */
async function handleListMiniApps() {
  try {
    const claudeClient = apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return { apps: [] };
    }
    
    const apps = await claudeClient.listGeneratedApps();
    return { apps };
  } catch (error) {
    console.error('Error listing mini apps:', error);
    return {
      success: false,
      error: error.message,
      apps: []
    };
  }
}

/**
 * Handle opening a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for opening the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleOpenMiniApp(event, { appId, filePath, name }) {
  console.log('handleOpenMiniApp called with:', { appId, filePath, name });
  
  try {
    const result = await miniAppManager.openMiniApp(appId, filePath, name);
    return result;
  } catch (error) {
    console.error('Error in handleOpenMiniApp:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle updating a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for updating the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleUpdateMiniApp(event, { appId, prompt }) {
  try {
    const claudeClient = apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Start streaming response
    event.sender.send('generation-status', {
      status: 'updating',
      message: 'Updating your mini app...'
    });
    
    const response = await claudeClient.generateApp(prompt, appId);
    let htmlContent = '';
    
    // Stream the response
    for await (const streamEvent of response) {
      if (streamEvent.type === 'content_block_delta' && streamEvent.delta.type === 'text_delta') {
        htmlContent += streamEvent.delta.text || '';
        event.sender.send('generation-chunk', {
          content: streamEvent.delta.text || '',
          done: false
        });
      }
    }
    
    // Signal completion
    event.sender.send('generation-chunk', {
      done: true
    });
    
    // Update the app
    const updatedApp = await claudeClient.updateGeneratedApp(
      appId,
      prompt,
      htmlContent
    );
    
    // Update the window if it's open
    const updateResult = await miniAppManager.updateMiniApp(
      appId,
      htmlContent,
      updatedApp.filePath
    );
    
    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error
      };
    }
    
    return { 
      success: true,
      appId,
      filePath: updatedApp.filePath
    };
  } catch (error) {
    event.sender.send('generation-status', {
      status: 'error',
      message: `Error: ${error.message}`
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle deleting a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for deleting the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleDeleteMiniApp(event, { appId }) {
  try {
    const claudeClient = apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Close the window if it's open
    miniAppManager.closeMiniApp(appId);
    
    // Delete the app
    await claudeClient.deleteGeneratedApp(appId);
    
    // Update recent apps list
    const recentApps = store.get('recentApps') || [];
    const updatedRecentApps = recentApps.filter(app => app.id !== appId);
    store.set('recentApps', updatedRecentApps);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting mini app:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle exporting a mini app as a package (zip file)
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for exporting the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleExportMiniApp(event, { appId, filePath }) {
  try {
    const claudeClient = apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Show save dialog for zip file
    const { canceled, filePath: savePath } = await dialog.showSaveDialog({
      title: 'Export Mini App Package',
      defaultPath: path.join(app.getPath('documents'), 'mini-app-package.zip'),
      filters: [
        { name: 'Zip Files', extensions: ['zip'] }
      ]
    });
    
    if (canceled) {
      return { success: false, canceled: true };
    }
    
    // Export the app as a package
    const result = await claudeClient.exportMiniAppAsPackage(appId, savePath);
    return result;
  } catch (error) {
    console.error('Error exporting mini app:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle importing a mini app package
 * @param {Object} event - IPC event
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleImportMiniApp(event) {
  try {
    const claudeClient = apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Show open dialog
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import Mini App Package',
      properties: ['openFile'],
      filters: [
        { name: 'Zip Files', extensions: ['zip'] }
      ]
    });
    
    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true };
    }
    
    // Import the app package
    const result = await claudeClient.importMiniAppPackage(filePaths[0]);
    
    if (result.success) {
      // Update recent apps list
      const recentApps = store.get('recentApps') || [];
      recentApps.unshift({
        id: result.appId,
        name: result.name,
        created: new Date().toISOString(),
        filePath: result.filePath
      });
      
      // Keep only the 10 most recent apps
      if (recentApps.length > 10) {
        recentApps.length = 10;
      }
      
      store.set('recentApps', recentApps);
      
      // Open the imported app
      await miniAppManager.openMiniApp(result.appId, result.filePath, result.name);
    }
    
    return result;
  } catch (error) {
    console.error('Error importing mini app:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// handleGenerateTitleAndDescription removed - replaced by src/app-creator/ipc/main-process-handlers.js

/**
 * Register mini app-related IPC handlers
 */
export function registerHandlers() {
  // Generate mini app
  ipcMain.handle('generate-mini-app', handleGenerateMiniApp);
  
  // 'generate-title-and-description' handler removed - replaced by src/app-creator/ipc/main-process-handlers.js
  
  // List mini apps
  ipcMain.handle('list-mini-apps', handleListMiniApps);
  
  // Open a mini app
  ipcMain.handle('open-mini-app', handleOpenMiniApp);
  
  // Update a mini app
  ipcMain.handle('update-mini-app', handleUpdateMiniApp);
  
  // Delete a mini app
  ipcMain.handle('delete-mini-app', handleDeleteMiniApp);
  
  // Export a mini app
  ipcMain.handle('export-mini-app', handleExportMiniApp);
  
  // Import a mini app
  ipcMain.handle('import-mini-app', handleImportMiniApp);
  
  console.log('Mini app handlers registered');
}

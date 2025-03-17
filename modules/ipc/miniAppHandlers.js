import { ipcMain, dialog, app } from 'electron';
import path from 'path';
import * as fileOperations from '../utils/fileOperations.js';
import * as apiHandlers from './apiHandlers.js';
import * as widgetManager from '../miniAppManager.js';
import * as titleDescriptionGenerator from '../utils/titleDescriptionGenerator.js';
import store from '../../store.js';
import fs from 'fs/promises';

/**
 * Widget Handlers Module
 * Responsible for widget generation and management IPC handlers
 */

/**
 * Handle generating a widget
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for generating the widget
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleGenerateWidget(event, { prompt, appName }) {
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
      message: 'Generating your widget...'
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
      appName || 'Widget',
      htmlContent,
      prompt
    );
    
    // Create a window for the app
    const windowResult = await widgetManager.createWidgetWindow(
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
 * Handle listing widgets
 * @returns {Promise<Object>} - Result object with apps list
 */
async function handleListWidgets() {
  try {
    const claudeClient = apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return { apps: [] };
    }
    
    const apps = await claudeClient.listGeneratedApps();
    return { apps };
  } catch (error) {
    console.error('Error listing widgets:', error);
    return {
      success: false,
      error: error.message,
      apps: []
    };
  }
}

/**
 * Handle opening a widget
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for opening the widget
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleOpenWidget(event, { appId, filePath, name }) {
  console.log('handleOpenWidget called with:', { appId, filePath, name });
  
  try {
    const result = await widgetManager.openWidget(appId, filePath, name);
    return result;
  } catch (error) {
    console.error('Error in handleOpenWidget:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle updating a widget
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for updating the widget
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleUpdateWidget(event, { appId, prompt }) {
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
      message: 'Updating your widget...'
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
    const updateResult = await widgetManager.updateWidget(
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
 * Handle deleting a widget
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for deleting the widget
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleDeleteWidget(event, { appId }) {
  try {
    const claudeClient = apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Close the window if it's open
    widgetManager.closeWidget(appId);
    
    // Delete the app
    await claudeClient.deleteGeneratedApp(appId);
    
    // Update recent apps list
    const recentApps = store.get('recentApps') || [];
    const updatedRecentApps = recentApps.filter(app => app.id !== appId);
    store.set('recentApps', updatedRecentApps);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting widget:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle exporting a widget as a package (zip file)
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for exporting the widget
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleExportWidget(event, { appId, filePath }) {
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
      title: 'Export Widget Package',
      defaultPath: path.join(app.getPath('documents'), 'widget-package.zip'),
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
    console.error('Error exporting widget:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle importing a widget package
 * @param {Object} event - IPC event
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleImportWidget(event) {
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
      title: 'Import Widget Package',
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
    await widgetManager.openWidget(result.appId, result.filePath, result.name);
    }
    
    return result;
  } catch (error) {
    console.error('Error importing widget:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle generating title and description for a widget
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for generating title and description
 * @returns {Promise<Object>} - Result object with title and description
 */
async function handleGenerateTitleAndDescription(event, { input }) {
  try {
    const claudeClient = apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Start streaming status
    event.sender.send('generation-status', {
      status: 'generating',
      message: 'Generating title and description...'
    });
    
    // Generate title and description with streaming
    const result = await titleDescriptionGenerator.generateTitleAndDescription(
      input,
      claudeClient.apiKey,
      (chunk) => {
        // Send each chunk to the renderer
        event.sender.send('title-description-chunk', chunk);
      }
    );
    
    // Signal completion
    event.sender.send('generation-status', {
      status: 'complete',
      message: 'Title and description generated'
    });
    
    return { 
      success: true,
      title: result.title,
      description: result.description
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
 * Register widget-related IPC handlers
 */
export function registerHandlers() {
  // Generate widget
  ipcMain.handle('generate-widget', handleGenerateWidget);
  
  // Generate title and description
  ipcMain.handle('generate-title-and-description', handleGenerateTitleAndDescription);
  
  // List widgets
  ipcMain.handle('list-widgets', handleListWidgets);
  
  // Open a widget
  ipcMain.handle('open-widget', handleOpenWidget);
  
  // Update a widget
  ipcMain.handle('update-widget', handleUpdateWidget);
  
  // Delete a widget
  ipcMain.handle('delete-widget', handleDeleteWidget);
  
  // Export a widget
  ipcMain.handle('export-widget', handleExportWidget);
  
  // Import a widget
  ipcMain.handle('import-widget', handleImportWidget);
  
  console.log('Widget handlers registered');
}

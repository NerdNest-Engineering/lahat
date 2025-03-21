/**
 * App Creation Main Process Module
 * Registers IPC handlers for app creation functionality
 */
import { ipcMain } from 'electron';
import path from 'path';
import { handleGenerateWidget } from './handlers/generate-mini-app.js';
import { handleGenerateTitleAndDescription } from './handlers/generate-title-description.js';
import * as widgetService from './services/mini-app-service.js';
import * as apiHandlers from '../../../modules/ipc/apiHandlers.js';
import store from '../../../store.js';

/**
 * Handle listing widgets
 * @returns {Promise<Object>} - Result object with apps list
 */
async function handleListWidgets() {
  const claudeClient = apiHandlers.getClaudeClient();
  return await widgetService.listWidgets(claudeClient);
}

/**
 * Handle opening a widget
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for opening the widget
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleOpenWidget(event, { appId, filePath, name }) {
  return await widgetService.openWidget(appId, filePath, name);
}

/**
 * Handle updating a widget
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for updating the widget
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleUpdateWidget(event, params) {
  const claudeClient = apiHandlers.getClaudeClient();
  
  // If no system prompt is provided, determine one based on the description
  if (!params.systemPrompt && params.prompt) {
    try {
      const { determineWidgetSystemPrompt, DEFAULT_WIDGET_PROMPT } = await import('../widget-system-prompts.js');
      
      // Use Claude to determine the appropriate widget type
      params.systemPrompt = await determineWidgetSystemPrompt(params.prompt);
    } catch (error) {
      console.error('Error determining widget type:', error);
      // Fall back to default widget prompt
      const { DEFAULT_WIDGET_PROMPT } = await import('../widget-system-prompts.js');
      params.systemPrompt = DEFAULT_WIDGET_PROMPT;
    }
  }
  
  return await widgetService.updateWidget(claudeClient, event, params);
}

/**
 * Handle deleting a widget
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for deleting the widget
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleDeleteWidget(event, { appId }) {
  const claudeClient = apiHandlers.getClaudeClient();
  return await widgetService.deleteWidget(claudeClient, appId);
}

/**
 * Handle exporting a widget
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for exporting the widget
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleExportWidget(event, params) {
  try {
    const claudeClient = apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Import the dialog module dynamically
    const { dialog, app } = await import('electron');
    
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
    const result = await claudeClient.exportMiniAppAsPackage(params.appId, savePath);
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
 * Handle importing a widget
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
    
    // Import the dialog module dynamically
    const { dialog } = await import('electron');
    
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
 * Register all app creation IPC handlers
 */
export function registerAppCreationHandlers() {
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
  
  console.log('App creation handlers registered');
}

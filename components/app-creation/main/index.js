/**
 * App Creation Main Process Module
 * Registers IPC handlers for app creation functionality
 */
import { ipcMain } from 'electron';
import { handleGenerateWidget } from './handlers/generate-mini-app.js';
import { handleGenerateTitleAndDescription } from './handlers/generate-title-description.js';
import * as widgetService from './services/mini-app-service.js';
import * as apiHandlers from '../../../modules/ipc/apiHandlers.js';

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
  
  console.log('App creation handlers registered');
}

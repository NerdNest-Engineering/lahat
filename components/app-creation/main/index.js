/**
 * App Creation Main Process Module
 * Registers IPC handlers for app creation functionality
 */
import { ipcMain } from 'electron';
import { handleGenerateMiniApp } from './handlers/generate-mini-app.js';
import { handleGenerateTitleAndDescription } from './handlers/generate-title-description.js';
import * as miniAppService from './services/mini-app-service.js';
import * as apiHandlers from '../../../modules/ipc/apiHandlers.js';

/**
 * Handle listing mini apps
 * @returns {Promise<Object>} - Result object with apps list
 */
async function handleListMiniApps() {
  const claudeClient = apiHandlers.getClaudeClient();
  return await miniAppService.listMiniApps(claudeClient);
}

/**
 * Handle opening a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for opening the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleOpenMiniApp(event, { appId, filePath, name }) {
  return await miniAppService.openMiniApp(appId, filePath, name);
}

/**
 * Handle updating a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for updating the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleUpdateMiniApp(event, params) {
  const claudeClient = apiHandlers.getClaudeClient();
  
  // If no system prompt is provided, determine one based on the description
  if (!params.systemPrompt && params.prompt) {
    const { 
      DEFAULT_SYSTEM_PROMPT, 
      GAME_SYSTEM_PROMPT, 
      UTILITY_SYSTEM_PROMPT, 
      DATA_VIZ_SYSTEM_PROMPT 
    } = await import('../system-prompts.js');
    
    // Simple keyword-based determination of system prompt
    const lowerDesc = params.prompt.toLowerCase();
    
    if (
      lowerDesc.includes('game') || 
      lowerDesc.includes('play') || 
      lowerDesc.includes('score') || 
      lowerDesc.includes('player')
    ) {
      params.systemPrompt = GAME_SYSTEM_PROMPT;
    } else if (
      lowerDesc.includes('calculator') || 
      lowerDesc.includes('convert') || 
      lowerDesc.includes('utility') || 
      lowerDesc.includes('tool')
    ) {
      params.systemPrompt = UTILITY_SYSTEM_PROMPT;
    } else if (
      lowerDesc.includes('chart') || 
      lowerDesc.includes('graph') || 
      lowerDesc.includes('plot') || 
      lowerDesc.includes('visualization')
    ) {
      params.systemPrompt = DATA_VIZ_SYSTEM_PROMPT;
    } else {
      params.systemPrompt = DEFAULT_SYSTEM_PROMPT;
    }
  }
  
  return await miniAppService.updateMiniApp(claudeClient, event, params);
}

/**
 * Handle deleting a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for deleting the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleDeleteMiniApp(event, { appId }) {
  const claudeClient = apiHandlers.getClaudeClient();
  return await miniAppService.deleteMiniApp(claudeClient, appId);
}

/**
 * Register all app creation IPC handlers
 */
export function registerAppCreationHandlers() {
  // Generate mini app
  ipcMain.handle('generate-mini-app', handleGenerateMiniApp);
  
  // Generate title and description
  ipcMain.handle('generate-title-and-description', handleGenerateTitleAndDescription);
  
  // List mini apps
  ipcMain.handle('list-mini-apps', handleListMiniApps);
  
  // Open a mini app
  ipcMain.handle('open-mini-app', handleOpenMiniApp);
  
  // Update a mini app
  ipcMain.handle('update-mini-app', handleUpdateMiniApp);
  
  // Delete a mini app
  ipcMain.handle('delete-mini-app', handleDeleteMiniApp);
  
  console.log('App creation handlers registered');
}

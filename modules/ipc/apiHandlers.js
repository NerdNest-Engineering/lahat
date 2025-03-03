import { shell, ipcMain } from 'electron';
import ClaudeClient from '../../claudeClient.js';
import store from '../../store.js';
import { IpcChannels, createSuccessResponse, createErrorResponse } from './ipcTypes.js';
import { ErrorHandler } from '../utils/errorHandler.js';

/**
 * API Handlers Module
 * Responsible for API key management and Claude client initialization
 */

// Claude client instance
let claudeClient = null;

/**
 * Initialize Claude client
 * @returns {boolean} - True if initialized successfully
 */
export function initializeClaudeClient() {
  const apiKey = store.get('apiKey');
  if (apiKey) {
    try {
      claudeClient = new ClaudeClient(apiKey);
      // Log the app storage path for troubleshooting
      console.log('App storage directory:', claudeClient.appStoragePath);
      return true;
    } catch (error) {
      ErrorHandler.logError('initializeClaudeClient', error);
      return false;
    }
  }
  return false;
}

/**
 * Get the Claude client instance
 * @returns {ClaudeClient|null} - Claude client instance or null if not initialized
 */
export function getClaudeClient() {
  if (!claudeClient) {
    const initialized = initializeClaudeClient();
    if (!initialized) {
      return null;
    }
  }
  return claudeClient;
}

/**
 * Handle setting the API key
 * @param {Object} event - IPC event
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleSetApiKey(event, apiKey) {
  try {
    store.set('apiKey', apiKey);
    claudeClient = new ClaudeClient(apiKey);
    return createSuccessResponse();
  } catch (error) {
    ErrorHandler.logError('handleSetApiKey', error);
    return createErrorResponse(error, 'set-api-key');
  }
}

/**
 * Handle checking if API key is set
 * @returns {Promise<Object>} - Result object with API key status
 */
async function handleCheckApiKey() {
  try {
    const apiKey = store.get('apiKey');
    return createSuccessResponse({ 
      hasApiKey: !!apiKey,
      apiKey: apiKey || ''
    });
  } catch (error) {
    ErrorHandler.logError('handleCheckApiKey', error);
    return createErrorResponse(error, 'check-api-key');
  }
}

/**
 * Handle opening the app directory
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleOpenAppDirectory() {
  try {
    if (!claudeClient) {
      const initialized = initializeClaudeClient();
      if (!initialized) {
        return createErrorResponse(
          'Claude API key not set. Please set your API key in settings.',
          'open-app-directory'
        );
      }
    }
    
    await shell.openPath(claudeClient.appStoragePath);
    return createSuccessResponse();
  } catch (error) {
    ErrorHandler.logError('handleOpenAppDirectory', error);
    return createErrorResponse(error, 'open-app-directory');
  }
}

/**
 * Register API-related IPC handlers
 * @param {Object} ipcHandler - IPC handler instance
 */
export function registerHandlers(ipcHandler) {
  // If no ipcHandler is provided, use the legacy registration method
  if (!ipcHandler) {
    // Handle API key setup
    ipcMain.handle(IpcChannels.SET_API_KEY, handleSetApiKey);
    
    // Check if API key is set
    ipcMain.handle(IpcChannels.CHECK_API_KEY, handleCheckApiKey);
    
    // Open app directory
    ipcMain.handle(IpcChannels.OPEN_APP_DIRECTORY, handleOpenAppDirectory);
    
    console.log('API handlers registered (legacy mode)');
    return;
  }
  
  // Register handlers with the IPC handler
  ipcHandler.registerMultiple({
    [IpcChannels.SET_API_KEY]: handleSetApiKey,
    [IpcChannels.CHECK_API_KEY]: handleCheckApiKey,
    [IpcChannels.OPEN_APP_DIRECTORY]: handleOpenAppDirectory
  });
  
  console.log('API handlers registered');
}

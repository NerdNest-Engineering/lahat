import { shell, ipcMain } from 'electron';
import ClaudeClient from '../../claudeClient.js';
import store from '../../store.js';
import { IpcChannels, createSuccessResponse, createErrorResponse } from './ipcTypes.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import keyManager from '../security/keyManager.js';
import logger from '../utils/logger.js';

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
  const apiKey = keyManager.getApiKey();
  if (apiKey) {
    try {
      claudeClient = new ClaudeClient(apiKey);
      // Log the app storage path for troubleshooting
      logger.info('App storage directory initialized', { path: claudeClient.appStoragePath }, 'ClaudeClient');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Claude client', error, 'initializeClaudeClient');
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
    // Store the API key securely
    const securelyStored = await keyManager.securelyStoreApiKey(apiKey);
    
    // Initialize Claude client with the new API key
    claudeClient = new ClaudeClient(apiKey);
    
    return createSuccessResponse({ securelyStored });
  } catch (error) {
    logger.error('Failed to set API key', error, 'handleSetApiKey');
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
    const hasApiKey = keyManager.hasApiKey();
    // We don't send the actual API key back for security reasons
    return createSuccessResponse({ 
      hasApiKey,
      isSecurelyStored: store.has('encryptedApiKey')
    });
  } catch (error) {
    logger.error('Failed to check API key', error, 'handleCheckApiKey');
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

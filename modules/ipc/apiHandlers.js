import { shell, ipcMain } from 'electron';
import ClaudeClient from '../../claudeClient.js';
import store from '../../store.js';
import { IpcChannels, createSuccessResponse, createErrorResponse } from './ipcTypes.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import keyManager from '../security/keyManager.js';
import logoGenerator from '../utils/logoGenerator.js';
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
 * Handle setting the Claude API key
 * @param {Object} event - IPC event
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleSetApiKey(event, apiKey) {
  try {
    // Check if we're deleting the key (empty string)
    if (!apiKey || apiKey.trim() === '') {
      // Delete the API key
      const deleted = keyManager.deleteApiKey();
      
      // Clear the Claude client
      claudeClient = null;
      
      return createSuccessResponse({ deleted, securelyStored: false });
    }
    
    // Store the API key securely
    const securelyStored = await keyManager.securelyStoreApiKey(apiKey);
    
    // Initialize Claude client with the new API key
    claudeClient = new ClaudeClient(apiKey);
    
    return createSuccessResponse({ securelyStored });
  } catch (error) {
    logger.error('Failed to set Claude API key', error, 'handleSetApiKey');
    ErrorHandler.logError('handleSetApiKey', error);
    return createErrorResponse(error, 'set-api-key');
  }
}

/**
 * Handle checking if Claude API key is set
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
    logger.error('Failed to check Claude API key', error, 'handleCheckApiKey');
    ErrorHandler.logError('handleCheckApiKey', error);
    return createErrorResponse(error, 'check-api-key');
  }
}

/**
 * Handle setting the OpenAI API key
 * @param {Object} event - IPC event
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleSetOpenAIApiKey(event, apiKey) {
  try {
    // Check if we're deleting the key (empty string)
    if (!apiKey || apiKey.trim() === '') {
      // Delete the API key
      const deleted = keyManager.deleteOpenAIKey();
      
      // Refresh the logo generator client
      logoGenerator.refreshClient();
      
      return createSuccessResponse({ deleted, securelyStored: false });
    }
    
    // Store the OpenAI API key securely
    const securelyStored = await keyManager.securelyStoreOpenAIKey(apiKey);
    
    // Refresh the logo generator client
    logoGenerator.refreshClient();
    
    return createSuccessResponse({ securelyStored });
  } catch (error) {
    logger.error('Failed to set OpenAI API key', error, 'handleSetOpenAIApiKey');
    ErrorHandler.logError('handleSetOpenAIApiKey', error);
    return createErrorResponse(error, 'set-openai-api-key');
  }
}

/**
 * Handle checking if OpenAI API key is set
 * @returns {Promise<Object>} - Result object with API key status
 */
async function handleCheckOpenAIApiKey() {
  try {
    const hasOpenAIKey = keyManager.hasOpenAIKey();
    // We don't send the actual API key back for security reasons
    return createSuccessResponse({ 
      hasOpenAIKey,
      isSecurelyStored: store.has('encryptedOpenAIKey')
    });
  } catch (error) {
    logger.error('Failed to check OpenAI API key', error, 'handleCheckOpenAIApiKey');
    ErrorHandler.logError('handleCheckOpenAIApiKey', error);
    return createErrorResponse(error, 'check-openai-api-key');
  }
}

/**
 * Handle deleting the OpenAI API key
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleDeleteOpenAIApiKey() {
  try {
    const deleted = keyManager.deleteOpenAIKey();
    
    // Refresh the logo generator client
    logoGenerator.refreshClient();
    
    return createSuccessResponse({ deleted });
  } catch (error) {
    logger.error('Failed to delete OpenAI API key', error, 'handleDeleteOpenAIApiKey');
    ErrorHandler.logError('handleDeleteOpenAIApiKey', error);
    return createErrorResponse(error, 'delete-openai-api-key');
  }
}

/**
 * Handle logo generation
 * @param {Object} event - IPC event
 * @param {Object} params - Generation parameters
 * @returns {Promise<Object>} - Result object with success flag and logo info
 */
async function handleGenerateLogo(event, params) {
  try {
    const { appName, appDescription, appFolderPath } = params;
    
    if (!appName || !appDescription || !appFolderPath) {
      return createErrorResponse(
        'Missing required parameters: appName, appDescription, appFolderPath',
        'generate-logo'
      );
    }
    
    const result = await logoGenerator.generateAppLogo(appName, appDescription, appFolderPath);
    
    if (result.success) {
      return createSuccessResponse(result);
    } else {
      return createErrorResponse(result.error, 'generate-logo');
    }
  } catch (error) {
    logger.error('Failed to generate logo', error, 'handleGenerateLogo');
    ErrorHandler.logError('handleGenerateLogo', error);
    return createErrorResponse(error, 'generate-logo');
  }
}

/**
 * Handle logo regeneration
 * @param {Object} event - IPC event
 * @param {Object} params - Regeneration parameters
 * @returns {Promise<Object>} - Result object with success flag and logo info
 */
async function handleRegenerateLogo(event, params) {
  try {
    const { appName, appDescription, appFolderPath, currentRetryCount } = params;
    
    if (!appName || !appDescription || !appFolderPath) {
      return createErrorResponse(
        'Missing required parameters: appName, appDescription, appFolderPath',
        'regenerate-logo'
      );
    }
    
    const result = await logoGenerator.regenerateAppLogo(
      appName, 
      appDescription, 
      appFolderPath, 
      currentRetryCount || 0
    );
    
    if (result.success) {
      return createSuccessResponse(result);
    } else {
      return createErrorResponse(result.error, 'regenerate-logo');
    }
  } catch (error) {
    logger.error('Failed to regenerate logo', error, 'handleRegenerateLogo');
    ErrorHandler.logError('handleRegenerateLogo', error);
    return createErrorResponse(error, 'regenerate-logo');
  }
}

/**
 * Handle testing logo generation
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleTestLogoGeneration() {
  try {
    const result = await logoGenerator.testLogoGeneration();
    
    if (result.success) {
      return createSuccessResponse(result);
    } else {
      return createErrorResponse(result.error, 'test-logo-generation');
    }
  } catch (error) {
    logger.error('Failed to test logo generation', error, 'handleTestLogoGeneration');
    ErrorHandler.logError('handleTestLogoGeneration', error);
    return createErrorResponse(error, 'test-logo-generation');
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
    // Claude API handlers
    ipcMain.handle(IpcChannels.SET_API_KEY, handleSetApiKey);
    ipcMain.handle(IpcChannels.CHECK_API_KEY, handleCheckApiKey);
    
    // OpenAI API handlers
    ipcMain.handle(IpcChannels.SET_OPENAI_API_KEY, handleSetOpenAIApiKey);
    ipcMain.handle(IpcChannels.CHECK_OPENAI_API_KEY, handleCheckOpenAIApiKey);
    ipcMain.handle(IpcChannels.DELETE_OPENAI_API_KEY, handleDeleteOpenAIApiKey);
    
    // Logo generation handlers
    ipcMain.handle(IpcChannels.GENERATE_LOGO, handleGenerateLogo);
    ipcMain.handle(IpcChannels.REGENERATE_LOGO, handleRegenerateLogo);
    ipcMain.handle(IpcChannels.TEST_LOGO_GENERATION, handleTestLogoGeneration);
    
    // General handlers
    ipcMain.handle(IpcChannels.OPEN_APP_DIRECTORY, handleOpenAppDirectory);
    
    console.log('API handlers registered (legacy mode)');
    return;
  }
  
  // Register handlers with the IPC handler
  ipcHandler.registerMultiple({
    // Claude API handlers
    [IpcChannels.SET_API_KEY]: handleSetApiKey,
    [IpcChannels.CHECK_API_KEY]: handleCheckApiKey,
    
    // OpenAI API handlers
    [IpcChannels.SET_OPENAI_API_KEY]: handleSetOpenAIApiKey,
    [IpcChannels.CHECK_OPENAI_API_KEY]: handleCheckOpenAIApiKey,
    [IpcChannels.DELETE_OPENAI_API_KEY]: handleDeleteOpenAIApiKey,
    
    // Logo generation handlers
    [IpcChannels.GENERATE_LOGO]: handleGenerateLogo,
    [IpcChannels.REGENERATE_LOGO]: handleRegenerateLogo,
    [IpcChannels.TEST_LOGO_GENERATION]: handleTestLogoGeneration,
    
    // General handlers
    [IpcChannels.OPEN_APP_DIRECTORY]: handleOpenAppDirectory
  });
  
  console.log('API handlers registered');
}

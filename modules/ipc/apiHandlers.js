import { ipcMain, shell } from 'electron';
import ClaudeClient from '../../claudeClient.js';
import store from '../../store.js';

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
    claudeClient = new ClaudeClient(apiKey);
    // Log the app storage path for troubleshooting
    console.log('App storage directory:', claudeClient.appStoragePath);
    return true;
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
    return { success: true };
  } catch (error) {
    console.error('Error setting API key:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle checking if API key is set
 * @returns {Promise<Object>} - Result object with API key status
 */
async function handleCheckApiKey() {
  const apiKey = store.get('apiKey');
  return { 
    hasApiKey: !!apiKey,
    apiKey: apiKey || ''
  };
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
        return {
          success: false,
          error: 'Claude API key not set. Please set your API key in settings.'
        };
      }
    }
    
    await shell.openPath(claudeClient.appStoragePath);
    return { success: true };
  } catch (error) {
    console.error('Error opening app directory:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Register API-related IPC handlers
 */
export function registerHandlers() {
  // Handle API key setup
  ipcMain.handle('set-api-key', handleSetApiKey);
  
  // Check if API key is set
  ipcMain.handle('check-api-key', handleCheckApiKey);
  
  // Open app directory
  ipcMain.handle('open-app-directory', handleOpenAppDirectory);
  
  console.log('API handlers registered');
}

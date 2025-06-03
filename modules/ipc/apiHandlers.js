import { shell, ipcMain } from 'electron';
import ClaudeClient from '../../claudeClient.js';
import store from '../../store.js';
import { IpcChannels, createSuccessResponse, createErrorResponse } from './ipcTypes.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { CredentialManager } from '../../src/credentials/CredentialManager.js';
import keyManager from '../security/keyManager.js'; // Keep for migration
import logoGenerator from '../utils/logoGenerator.js';
import logger from '../utils/logger.js';

/**
 * API Handlers Module
 * Responsible for API key management and Claude client initialization
 */

// Initialize the credential manager
const credentialManager = new CredentialManager();

// Migration flag to track if we've migrated credentials
let migrationCompleted = false;

// Claude client instance
let claudeClient = null;

/**
 * Migrate credentials from old keyManager to new CredentialManager
 * @returns {Promise<boolean>} - True if migration completed successfully
 */
async function migrateCredentials() {
  if (migrationCompleted) {
    return true;
  }

  try {
    logger.info('Starting credential migration from keyManager to CredentialManager', {}, 'migrateCredentials');
    
    const oldCredentials = {};
    
    // Check for Claude API key
    if (keyManager.hasApiKey()) {
      const claudeKey = keyManager.getApiKey();
      if (claudeKey) {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const environment = isDevelopment ? 'development' : 'production';
        oldCredentials[`claude_api_key_${environment}`] = claudeKey;
      }
    }
    
    // Check for OpenAI API key  
    if (keyManager.hasOpenAIKey()) {
      const openaiKey = keyManager.getOpenAIKey();
      if (openaiKey) {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const environment = isDevelopment ? 'development' : 'production';
        oldCredentials[`openai_api_key_${environment}`] = openaiKey;
      }
    }
    
    // Migrate credentials if any exist
    if (Object.keys(oldCredentials).length > 0) {
      logger.info('Migrating credentials to new CredentialManager', { count: Object.keys(oldCredentials).length }, 'migrateCredentials');
      await credentialManager.migrateCredentials(oldCredentials);
      logger.info('Credential migration completed successfully', {}, 'migrateCredentials');
    } else {
      logger.info('No credentials found to migrate', {}, 'migrateCredentials');
    }
    
    migrationCompleted = true;
    return true;
  } catch (error) {
    logger.error('Failed to migrate credentials', error, 'migrateCredentials');
    migrationCompleted = true; // Don't keep retrying
    return false;
  }
}

/**
 * Get the appropriate credential name based on environment
 * @param {string} service - Service name (claude, openai)
 * @returns {string} - Credential name
 */
function getCredentialName(service) {
  // Use 'development' as default since most usage is in development mode
  // This matches the browser-side detection in credential-manager.js
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  const environment = isDevelopment ? 'development' : 'default';
  console.log(`[CREDENTIAL-NAME] Service: ${service}, NODE_ENV: ${process.env.NODE_ENV}, Environment: ${environment}, Final name: ${service}.${environment}`);
  return `${service}.${environment}`;
}

/**
 * Get a credential value from the credential system (with lastUsed tracking)
 * @param {string} service - Service name (claude, openai)
 * @returns {Promise<string|null>} - Credential value or null
 */
async function getCredentialValue(service) {
  try {
    const credentialName = getCredentialName(service);
    console.log(`[GET-CREDENTIAL] Looking for credential with name: ${credentialName}`);
    
    // First, try to find the credential by name in the metadata
    const fs = await import('fs/promises');
    const path = await import('path');
    const { app } = await import('electron');
    
    const credentialsMetadataPath = path.join(app.getPath('userData'), 'credentials-metadata.json');
    
    try {
      const data = await fs.readFile(credentialsMetadataPath, 'utf8');
      const metadataList = JSON.parse(data);
      
      // Find credential by name
      const credential = metadataList.find(c => c.name === credentialName);
      
      if (credential) {
        console.log(`[GET-CREDENTIAL] Found credential in metadata with ID: ${credential.id}`);
        
        // Use the proper credential handler to get value AND update lastUsed
        const { handleGetCredentialValue } = await import('./credentialHandlers.js');
        const result = await handleGetCredentialValue({}, credential.id);
        
        if (result.success && result.value) {
          const value = result.value.value || result.value.password || null;
          console.log(`[GET-CREDENTIAL] Retrieved value exists: ${value !== null}, lastUsed updated`);
          return value;
        } else {
          console.log(`[GET-CREDENTIAL] Failed to get credential value: ${result.error}`);
          return null;
        }
      } else {
        console.log(`[GET-CREDENTIAL] No credential found with name: ${credentialName}`);
        return null;
      }
    } catch (fileError) {
      console.log(`[GET-CREDENTIAL] No credentials metadata file found: ${fileError.message}`);
      return null;
    }
  } catch (error) {
    console.log(`[GET-CREDENTIAL] Failed to get ${service} credential: ${error.message}`);
    return null;
  }
}

/**
 * Initialize Claude client
 * @param {boolean} readOnlyMode - Whether to initialize in read-only mode
 * @returns {boolean} - True if initialized successfully
 */
export async function initializeClaudeClient(readOnlyMode = false) {
  try {
    // Ensure migration is completed first
    await migrateCredentials();
    
    // Get API key from keytar-based credential system
    const apiKey = await getCredentialValue('claude');
    console.log(`[CLAUDE-INIT] API key retrieved: ${apiKey ? 'YES' : 'NO'}, Length: ${apiKey ? apiKey.length : 0}, ReadOnly: ${readOnlyMode}`);
    
    // Initialize with API key if available, otherwise in read-only mode
    if (apiKey) {
      claudeClient = new ClaudeClient(apiKey);
      console.log(`[CLAUDE-INIT] Claude client initialized with API key successfully`);
      logger.info('App storage directory initialized with API key', { path: claudeClient.appStoragePath }, 'ClaudeClient');
      return true;
    } else if (readOnlyMode) {
      // Initialize in read-only mode (null API key)
      claudeClient = new ClaudeClient(null);
      console.log(`[CLAUDE-INIT] Claude client initialized in read-only mode`);
      logger.info('App storage directory initialized in read-only mode', { path: claudeClient.appStoragePath }, 'ClaudeClient');
      return true;
    } else {
      console.log(`[CLAUDE-INIT] No API key found and read-only mode not enabled`);
    }
  } catch (error) {
    console.log(`[CLAUDE-INIT] Failed to initialize: ${error.message}`);
    logger.error('Failed to initialize Claude client', error, 'initializeClaudeClient');
    ErrorHandler.logError('initializeClaudeClient', error);
    return false;
  }
  
  return false;
}

/**
 * Get the Claude client instance
 * @param {boolean} allowReadOnly - Whether to allow read-only mode if no API key is available
 * @returns {Promise<ClaudeClient|null>} - Claude client instance or null if not initialized
 */
export async function getClaudeClient(allowReadOnly = false) {
  if (!claudeClient) {
    // Try to initialize with API key first
    const initialized = await initializeClaudeClient();
    
    // If initialization failed and read-only mode is allowed, try again in read-only mode
    if (!initialized && allowReadOnly) {
      const readOnlyInitialized = await initializeClaudeClient(true);
      if (!readOnlyInitialized) {
        return null;
      }
    } else if (!initialized) {
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
    // Ensure migration is completed first
    await migrateCredentials();
    
    const credentialName = getCredentialName('claude');
    
    // Check if we're deleting the key (empty string)
    if (!apiKey || apiKey.trim() === '') {
      // Find and delete the credential using the credential manager IPC system
      const credentialValue = await getCredentialValue('claude');
      if (credentialValue) {
        // Find the credential ID and delete it
        const fs = await import('fs/promises');
        const path = await import('path');
        const { app } = await import('electron');
        
        const credentialsMetadataPath = path.join(app.getPath('userData'), 'credentials-metadata.json');
        
        try {
          const data = await fs.readFile(credentialsMetadataPath, 'utf8');
          const metadataList = JSON.parse(data);
          const credential = metadataList.find(c => c.name === credentialName);
          
          if (credential) {
            // Use the credential manager's delete handler
            const { handleDeleteCredential } = await import('./credentialHandlers.js');
            await handleDeleteCredential(event, credential.id);
          }
        } catch (fileError) {
          console.log(`[SET-API-KEY] No metadata file to update: ${fileError.message}`);
        }
      }
      
      // Clear the Claude client
      claudeClient = null;
      
      return createSuccessResponse({ deleted: true, securelyStored: false });
    }
    
    // Store using the credential manager IPC system
    const credentialData = {
      id: 'claude_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: credentialName,
      displayName: 'Claude API Key',
      type: 'anthropic',
      description: 'Claude API key for app generation',
      value: apiKey,
      createdAt: new Date().toISOString(),
      lastUsed: null
    };
    
    const { handleSaveCredential } = await import('./credentialHandlers.js');
    const result = await handleSaveCredential(event, credentialData);
    
    if (result.success) {
      // Initialize Claude client with the new API key
      claudeClient = new ClaudeClient(apiKey);
      return createSuccessResponse({ securelyStored: true });
    } else {
      throw new Error(`Failed to save credential: ${result.error}`);
    }
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
    // Ensure migration is completed first
    await migrateCredentials();
    
    const credentialName = getCredentialName('claude');
    console.log(`[API-CHECK] Looking for credential with name: ${credentialName}`);
    
    // Check if credential exists
    const apiKey = await getCredentialValue('claude');
    const hasApiKey = apiKey !== null;
    
    console.log(`[API-CHECK] Credential found: ${hasApiKey}`);
    if (hasApiKey) {
      console.log(`[API-CHECK] Claude API key length: ${apiKey.length} characters`);
    }
    
    // We don't send the actual API key back for security reasons
    return createSuccessResponse({ 
      hasApiKey,
      isSecurelyStored: hasApiKey // New credential manager always stores securely
    });
  } catch (error) {
    console.log(`[API-CHECK] Error checking credential: ${error.message}`);
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
    // Ensure migration is completed first
    await migrateCredentials();
    
    const credentialName = getCredentialName('openai');
    
    // Check if we're deleting the key (empty string)
    if (!apiKey || apiKey.trim() === '') {
      // Find and delete the credential using the credential manager IPC system
      const credentialValue = await getCredentialValue('openai');
      if (credentialValue) {
        // Find the credential ID and delete it
        const fs = await import('fs/promises');
        const path = await import('path');
        const { app } = await import('electron');
        
        const credentialsMetadataPath = path.join(app.getPath('userData'), 'credentials-metadata.json');
        
        try {
          const data = await fs.readFile(credentialsMetadataPath, 'utf8');
          const metadataList = JSON.parse(data);
          const credential = metadataList.find(c => c.name === credentialName);
          
          if (credential) {
            // Use the credential manager's delete handler
            const { handleDeleteCredential } = await import('./credentialHandlers.js');
            await handleDeleteCredential(event, credential.id);
          }
        } catch (fileError) {
          console.log(`[SET-OPENAI-KEY] No metadata file to update: ${fileError.message}`);
        }
      }
      
      // Refresh the logo generator client
      await logoGenerator.refreshClient();
      
      return createSuccessResponse({ deleted: true, securelyStored: false });
    }
    
    // Store using the credential manager IPC system
    const credentialData = {
      id: 'openai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: credentialName,
      displayName: 'OpenAI API Key',
      type: 'openai',
      description: 'OpenAI API key for logo generation',
      value: apiKey,
      createdAt: new Date().toISOString(),
      lastUsed: null
    };
    
    const { handleSaveCredential } = await import('./credentialHandlers.js');
    const result = await handleSaveCredential(event, credentialData);
    
    if (result.success) {
      // Refresh the logo generator client
      await logoGenerator.refreshClient();
      return createSuccessResponse({ securelyStored: true });
    } else {
      throw new Error(`Failed to save credential: ${result.error}`);
    }
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
    // Ensure migration is completed first
    await migrateCredentials();
    
    const credentialName = getCredentialName('openai');
    console.log(`[API-CHECK] Looking for OpenAI credential with name: ${credentialName}`);
    
    // Check if credential exists
    const apiKey = await getCredentialValue('openai');
    const hasOpenAIKey = apiKey !== null;
    
    console.log(`[API-CHECK] OpenAI credential found: ${hasOpenAIKey}`);
    if (hasOpenAIKey) {
      console.log(`[API-CHECK] OpenAI API key length: ${apiKey.length} characters`);
    }
    
    // We don't send the actual API key back for security reasons
    return createSuccessResponse({ 
      hasOpenAIKey,
      isSecurelyStored: hasOpenAIKey // New credential manager always stores securely
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
    // Ensure migration is completed first
    await migrateCredentials();
    
    const credentialName = getCredentialName('openai');
    
    // Find and delete the credential using the credential manager IPC system
    let deleted = false;
    const credentialValue = await getCredentialValue('openai');
    if (credentialValue) {
      // Find the credential ID and delete it
      const fs = await import('fs/promises');
      const path = await import('path');
      const { app } = await import('electron');
      
      const credentialsMetadataPath = path.join(app.getPath('userData'), 'credentials-metadata.json');
      
      try {
        const data = await fs.readFile(credentialsMetadataPath, 'utf8');
        const metadataList = JSON.parse(data);
        const credential = metadataList.find(c => c.name === credentialName);
        
        if (credential) {
          // Use the credential manager's delete handler
          const { handleDeleteCredential } = await import('./credentialHandlers.js');
          const result = await handleDeleteCredential({}, credential.id);
          deleted = result.success;
        }
      } catch (fileError) {
        console.log(`[DELETE-OPENAI-KEY] No metadata file to update: ${fileError.message}`);
      }
    }
    
    // Refresh the logo generator client
    await logoGenerator.refreshClient();
    
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
      // Allow read-only mode for opening app directory
      const initialized = await initializeClaudeClient(true);
      if (!initialized) {
        return createErrorResponse(
          'Failed to initialize app directory access.',
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
 * Export credential value getter for use by other modules
 */
export { getCredentialValue };

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

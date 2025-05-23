/**
 * Key Manager Module
 * Securely stores and retrieves sensitive keys like API keys
 */

import { safeStorage } from 'electron';
import store from '../../store.js';
import logger from '../utils/logger.js';

/**
 * Securely store a Claude API key
 * @param {string} apiKey - The API key to store
 * @returns {Promise<boolean>} - True if stored securely, false if fallback method used
 */
export async function securelyStoreApiKey(apiKey) {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      // Encrypt the API key using the OS's secure storage
      const encryptedKey = safeStorage.encryptString(apiKey);
      
      // Store as base64 string
      store.set('encryptedApiKey', encryptedKey.toString('base64'));
      
      // Remove any plaintext key that might exist
      store.delete('apiKey');
      
      logger.info('Claude API key stored securely using safe storage');
      return true;
    } else {
      // Fallback to less secure storage
      logger.warn('Safe storage not available, storing Claude API key with basic protection');
      store.set('apiKey', apiKey);
      return false;
    }
  } catch (error) {
    logger.error('Failed to securely store Claude API key', error, 'keyManager');
    // Fallback to less secure storage
    store.set('apiKey', apiKey);
    return false;
  }
}

/**
 * Get the stored Claude API key
 * @returns {string|null} - The API key or null if not found
 */
export function getApiKey() {
  try {
    if (store.has('encryptedApiKey') && safeStorage.isEncryptionAvailable()) {
      // Decrypt the key
      const encryptedKey = Buffer.from(store.get('encryptedApiKey'), 'base64');
      return safeStorage.decryptString(encryptedKey);
    } else if (store.has('apiKey')) {
      // Fallback to plaintext key
      return store.get('apiKey');
    }
    
    return null;
  } catch (error) {
    logger.error('Failed to retrieve Claude API key', error, 'keyManager');
    
    // If decryption fails, try the fallback
    if (store.has('apiKey')) {
      return store.get('apiKey');
    }
    
    return null;
  }
}

/**
 * Check if a Claude API key is stored
 * @returns {boolean} - True if an API key is stored
 */
export function hasApiKey() {
  return store.has('encryptedApiKey') || store.has('apiKey');
}

/**
 * Delete the stored Claude API key
 * @returns {boolean} - True if successful
 */
export function deleteApiKey() {
  try {
    store.delete('encryptedApiKey');
    store.delete('apiKey');
    logger.info('Claude API key deleted');
    return true;
  } catch (error) {
    logger.error('Failed to delete Claude API key', error, 'keyManager');
    return false;
  }
}

/**
 * Securely store an OpenAI API key
 * @param {string} apiKey - The OpenAI API key to store
 * @returns {Promise<boolean>} - True if stored securely, false if fallback method used
 */
export async function securelyStoreOpenAIKey(apiKey) {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      // Encrypt the API key using the OS's secure storage
      const encryptedKey = safeStorage.encryptString(apiKey);
      
      // Store as base64 string
      store.set('encryptedOpenAIKey', encryptedKey.toString('base64'));
      
      // Remove any plaintext key that might exist
      store.delete('openAIKey');
      
      logger.info('OpenAI API key stored securely using safe storage');
      return true;
    } else {
      // Fallback to less secure storage
      logger.warn('Safe storage not available, storing OpenAI API key with basic protection');
      store.set('openAIKey', apiKey);
      return false;
    }
  } catch (error) {
    logger.error('Failed to securely store OpenAI API key', error, 'keyManager');
    // Fallback to less secure storage
    store.set('openAIKey', apiKey);
    return false;
  }
}

/**
 * Get the stored OpenAI API key
 * @returns {string|null} - The OpenAI API key or null if not found
 */
export function getOpenAIKey() {
  try {
    if (store.has('encryptedOpenAIKey') && safeStorage.isEncryptionAvailable()) {
      // Decrypt the key
      const encryptedKey = Buffer.from(store.get('encryptedOpenAIKey'), 'base64');
      return safeStorage.decryptString(encryptedKey);
    } else if (store.has('openAIKey')) {
      // Fallback to plaintext key
      return store.get('openAIKey');
    }
    
    return null;
  } catch (error) {
    logger.error('Failed to retrieve OpenAI API key', error, 'keyManager');
    
    // If decryption fails, try the fallback
    if (store.has('openAIKey')) {
      return store.get('openAIKey');
    }
    
    return null;
  }
}

/**
 * Check if an OpenAI API key is stored
 * @returns {boolean} - True if an OpenAI API key is stored
 */
export function hasOpenAIKey() {
  return store.has('encryptedOpenAIKey') || store.has('openAIKey');
}

/**
 * Delete the stored OpenAI API key
 * @returns {boolean} - True if successful
 */
export function deleteOpenAIKey() {
  try {
    store.delete('encryptedOpenAIKey');
    store.delete('openAIKey');
    logger.info('OpenAI API key deleted');
    return true;
  } catch (error) {
    logger.error('Failed to delete OpenAI API key', error, 'keyManager');
    return false;
  }
}

// Default export as an object with all methods
export default {
  securelyStoreApiKey,
  getApiKey,
  hasApiKey,
  deleteApiKey,
  securelyStoreOpenAIKey,
  getOpenAIKey,
  hasOpenAIKey,
  deleteOpenAIKey
};

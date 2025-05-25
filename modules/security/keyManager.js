/**
 * Key Manager Module
 * Stores and retrieves API keys using consistent plaintext storage
 * Uses environment-based key prefixes to separate dev/prod data
 */

import store from '../../store.js';
import logger from '../utils/logger.js';

// Environment detection and key prefix
const isDevelopment = process.env.NODE_ENV === 'development';
const keyPrefix = isDevelopment ? 'dev_' : '';

/**
 * Store a Claude API key
 * @param {string} apiKey - The API key to store
 * @returns {Promise<boolean>} - Always returns true for successful storage
 */
export async function securelyStoreApiKey(apiKey) {
  try {
    const claudeKeyName = `${keyPrefix}claude_api_key`;
    
    // Clear all possible legacy key storage locations
    store.delete('encryptedApiKey');
    store.delete('apiKey');
    store.delete('claude_api_key_dev');
    store.delete('dev_claude_api_key');
    store.delete('claude_api_key');
    
    if (!apiKey || apiKey.trim() === '') {
      return true;
    }
    
    // Store with environment-specific key name
    store.set(claudeKeyName, apiKey);
    return true;
    
  } catch (error) {
    logger.error('Failed to store Claude API key', error, 'keyManager');
    return false;
  }
}

/**
 * Get the stored Claude API key
 * @returns {string|null} - The API key or null if not found
 */
export function getApiKey() {
  try {
    const claudeKeyName = `${keyPrefix}claude_api_key`;
    
    // Check the current environment's key first
    if (store.has(claudeKeyName)) {
      return store.get(claudeKeyName);
    }
    
    // Legacy fallback - check old key formats for migration
    const legacyKeys = [
      'claude_api_key_dev',
      'dev_claude_api_key', 
      'claude_api_key',
      'apiKey'
    ];
    
    for (const legacyKey of legacyKeys) {
      if (store.has(legacyKey)) {
        const value = store.get(legacyKey);
        
        // Migrate to new format
        store.set(claudeKeyName, value);
        store.delete(legacyKey);
        
        return value;
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Error retrieving Claude API key', error, 'keyManager');
    return null;
  }
}

/**
 * Check if a Claude API key is stored
 * @returns {boolean} - True if an API key is stored
 */
export function hasApiKey() {
  const claudeKeyName = `${keyPrefix}claude_api_key`;
  
  // Check current environment key
  if (store.has(claudeKeyName)) {
    return true;
  }
  
  // Check legacy keys for migration
  const legacyKeys = [
    'claude_api_key_dev',
    'dev_claude_api_key', 
    'claude_api_key',
    'apiKey',
    'encryptedApiKey'
  ];
  
  return legacyKeys.some(key => store.has(key));
}

/**
 * Delete the stored Claude API key
 * @returns {boolean} - True if successful
 */
export function deleteApiKey() {
  try {
    const claudeKeyName = `${keyPrefix}claude_api_key`;
    
    // Delete current environment key
    store.delete(claudeKeyName);
    
    // Also clean up any legacy keys
    store.delete('encryptedApiKey');
    store.delete('apiKey');
    store.delete('claude_api_key_dev');
    store.delete('dev_claude_api_key');
    store.delete('claude_api_key');
    
    return true;
  } catch (error) {
    logger.error('Failed to delete Claude API key', error, 'keyManager');
    return false;
  }
}

/**
 * Store an OpenAI API key
 * @param {string} apiKey - The OpenAI API key to store
 * @returns {Promise<boolean>} - Always returns true for successful storage
 */
export async function securelyStoreOpenAIKey(apiKey) {
  try {
    const openaiKeyName = `${keyPrefix}openai_api_key`;
    
    // Clear all possible legacy key storage locations
    store.delete('encryptedOpenAIKey');
    store.delete('openAIKey');
    store.delete('openai_api_key_dev');
    store.delete('dev_openai_api_key');
    store.delete('openai_api_key');
    
    if (!apiKey || apiKey.trim() === '') {
      return true;
    }
    
    // Store with environment-specific key name
    store.set(openaiKeyName, apiKey);
    return true;
    
  } catch (error) {
    logger.error('Failed to store OpenAI API key', error, 'keyManager');
    return false;
  }
}

/**
 * Get the stored OpenAI API key
 * @returns {string|null} - The OpenAI API key or null if not found
 */
export function getOpenAIKey() {
  try {
    const openaiKeyName = `${keyPrefix}openai_api_key`;
    
    // Check the current environment's key first
    if (store.has(openaiKeyName)) {
      return store.get(openaiKeyName);
    }
    
    // Legacy fallback - check old key formats for migration
    const legacyKeys = [
      'openai_api_key_dev',
      'dev_openai_api_key', 
      'openai_api_key',
      'openAIKey'
    ];
    
    for (const legacyKey of legacyKeys) {
      if (store.has(legacyKey)) {
        const value = store.get(legacyKey);
        
        // Migrate to new format
        store.set(openaiKeyName, value);
        store.delete(legacyKey);
        
        return value;
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Error retrieving OpenAI API key', error, 'keyManager');
    return null;
  }
}

/**
 * Check if an OpenAI API key is stored
 * @returns {boolean} - True if an OpenAI API key is stored
 */
export function hasOpenAIKey() {
  const openaiKeyName = `${keyPrefix}openai_api_key`;
  
  // Check current environment key
  if (store.has(openaiKeyName)) {
    return true;
  }
  
  // Check legacy keys for migration
  const legacyKeys = [
    'openai_api_key_dev',
    'dev_openai_api_key', 
    'openai_api_key',
    'openAIKey',
    'encryptedOpenAIKey'
  ];
  
  return legacyKeys.some(key => store.has(key));
}

/**
 * Delete the stored OpenAI API key
 * @returns {boolean} - True if successful
 */
export function deleteOpenAIKey() {
  try {
    const openaiKeyName = `${keyPrefix}openai_api_key`;
    
    // Delete current environment key
    store.delete(openaiKeyName);
    
    // Also clean up any legacy keys
    store.delete('encryptedOpenAIKey');
    store.delete('openAIKey');
    store.delete('openai_api_key_dev');
    store.delete('dev_openai_api_key');
    store.delete('openai_api_key');
    
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

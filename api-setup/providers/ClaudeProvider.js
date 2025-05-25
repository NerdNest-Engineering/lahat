import { ApiProvider } from '../core/ApiProvider.js';

/**
 * ClaudeProvider - Claude API implementation
 */
export class ClaudeProvider extends ApiProvider {
  constructor(config) {
    super(config);
  }
  
  /**
   * Validate Claude API key format
   * @param {string} key - API key to validate
   * @returns {boolean} True if valid
   */
  async validateKey(key) {
    if (!key || typeof key !== 'string') {
      return false;
    }
    return this.validateKeyFormat(key);
  }
  
  /**
   * Test Claude API connection
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    try {
      const result = await window.electronAPI.checkApiKey();
      return {
        success: result && result.hasApiKey,
        message: result && result.hasApiKey ? 'Connection successful' : 'No API key configured'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Connection test failed'
      };
    }
  }
  
  /**
   * Save Claude API key
   * @param {string} key - API key to save
   * @returns {Promise<Object>} Save result
   */
  async saveKey(key) {
    try {
      const result = await window.electronAPI.setApiKey(key);
      
      if (result.success) {
        // Notify other windows that API key has been updated
        if (window.electronAPI.notifyApiKeyUpdated) {
          window.electronAPI.notifyApiKeyUpdated();
        }
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to save API key'
      };
    }
  }
  
  /**
   * Load Claude API key status
   * @returns {Promise<boolean>} True if key exists and can be retrieved
   */
  async loadKey() {
    try {
      const result = await window.electronAPI.checkApiKey();
      console.log('Claude API key check result:', result);
      return result && result.hasApiKey;
    } catch (error) {
      console.error('Error loading Claude API key:', error);
      return false;
    }
  }
  
  /**
   * Delete Claude API key
   * @returns {Promise<Object>} Delete result
   */
  async deleteKey() {
    try {
      const result = await window.electronAPI.setApiKey('');
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to delete API key'
      };
    }
  }
}

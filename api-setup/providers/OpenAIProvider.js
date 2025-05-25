import { ApiProvider } from '../core/ApiProvider.js';

/**
 * OpenAIProvider - OpenAI API implementation
 */
export class OpenAIProvider extends ApiProvider {
  constructor(config) {
    super(config);
  }
  
  /**
   * Validate OpenAI API key format
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
   * Test OpenAI API connection
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    try {
      const result = await window.electronAPI.checkOpenAIApiKey();
      if (result && result.hasOpenAIKey) {
        // Test actual connection with logo generation test
        const logoTestResult = await window.electronAPI.testLogoGeneration();
        return {
          success: logoTestResult.success,
          message: logoTestResult.success ? 'Connection successful' : logoTestResult.error
        };
      } else {
        return {
          success: false,
          message: 'No API key configured'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Connection test failed'
      };
    }
  }
  
  /**
   * Save OpenAI API key
   * @param {string} key - API key to save
   * @returns {Promise<Object>} Save result
   */
  async saveKey(key) {
    try {
      const result = await window.electronAPI.setOpenAIApiKey(key);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to save API key'
      };
    }
  }
  
  /**
   * Load OpenAI API key status
   * @returns {Promise<boolean>} True if key exists
   */
  async loadKey() {
    try {
      const result = await window.electronAPI.checkOpenAIApiKey();
      console.log('OpenAI API key check result:', result);
      return result && result.hasOpenAIKey;
    } catch (error) {
      console.error('Error loading OpenAI API key:', error);
      return false;
    }
  }
  
  /**
   * Delete OpenAI API key
   * @returns {Promise<Object>} Delete result
   */
  async deleteKey() {
    try {
      const result = await window.electronAPI.setOpenAIApiKey('');
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to delete API key'
      };
    }
  }
}

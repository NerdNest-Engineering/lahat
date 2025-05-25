/**
 * ApiProvider - Abstract base class for API providers
 */
export class ApiProvider {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.config = config;
  }
  
  /**
   * Validate API key format
   * @param {string} key - API key to validate
   * @returns {boolean} True if valid
   */
  async validateKey(key) {
    throw new Error('Must implement validateKey');
  }
  
  /**
   * Test API connection
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    throw new Error('Must implement testConnection');
  }
  
  /**
   * Save API key
   * @param {string} key - API key to save
   * @returns {Promise<Object>} Save result
   */
  async saveKey(key) {
    throw new Error('Must implement saveKey');
  }
  
  /**
   * Load API key status
   * @returns {Promise<boolean>} True if key exists
   */
  async loadKey() {
    throw new Error('Must implement loadKey');
  }
  
  /**
   * Delete API key
   * @returns {Promise<Object>} Delete result
   */
  async deleteKey() {
    throw new Error('Must implement deleteKey');
  }
  
  /**
   * Mask API key for display
   * @param {string} key - API key to mask
   * @returns {string} Masked key
   */
  maskKey(key) {
    if (!key || key.length < 8) {
      return '••••••••••••••••••••••••••••••••';
    }
    const start = key.substring(0, 4);
    const end = key.substring(key.length - 4);
    const middle = '•'.repeat(Math.max(8, key.length - 8));
    return `${start}${middle}${end}`;
  }
  
  /**
   * Get help URL for obtaining API key
   * @returns {string} Help URL
   */
  getHelpUrl() {
    return this.config.helpUrl || '#';
  }
  
  /**
   * Get provider description
   * @returns {string} Description
   */
  getDescription() {
    return this.config.description || '';
  }
  
  /**
   * Get provider color
   * @returns {string} Color hex code
   */
  getColor() {
    return this.config.color || '#666666';
  }
  
  /**
   * Get provider icon
   * @returns {string} Icon path
   */
  getIcon() {
    return this.config.icon || '';
  }
  
  /**
   * Check if provider is required
   * @returns {boolean} True if required
   */
  isRequired() {
    return this.config.required || false;
  }
  
  /**
   * Get provider priority for sorting
   * @returns {number} Priority number
   */
  getPriority() {
    return this.config.priority || 999;
  }
  
  /**
   * Validate key format using regex pattern
   * @param {string} key - API key to validate
   * @returns {boolean} True if format is valid
   */
  validateKeyFormat(key) {
    if (!key || !this.config.keyPattern) {
      return false;
    }
    const pattern = new RegExp(this.config.keyPattern);
    return pattern.test(key);
  }
}

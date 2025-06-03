/**
 * Base provider class for credential management
 * Provides common interface and validation for all credential providers
 */

export class BaseProvider {
  constructor(config) {
    this.config = config;
    this.validateConfig();
  }
  
  /**
   * Validate the provider configuration
   * @private
   */
  validateConfig() {
    const required = ['id', 'name', 'displayName'];
    const missing = required.filter(field => !this.config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Provider config missing required fields: ${missing.join(', ')}`);
    }
  }
  
  /**
   * Get provider ID
   * @returns {string} Provider identifier
   */
  getId() {
    return this.config.id;
  }
  
  /**
   * Get provider display name
   * @returns {string} Human-readable name
   */
  getDisplayName() {
    return this.config.displayName;
  }
  
  /**
   * Get provider branding
   * @returns {Object} Branding configuration
   */
  getBranding() {
    return {
      logo: this.config.branding?.logo,
      primaryColor: this.config.branding?.primaryColor || '#007bff',
      secondaryColor: this.config.branding?.secondaryColor || '#0056b3',
      textColor: this.config.branding?.textColor || '#ffffff',
      css: this.config.branding?.css || {}
    };
  }
  
  /**
   * Get field definitions for this provider
   * @returns {Array} Array of field definitions
   */
  getFields() {
    return this.config.fields || [];
  }
  
  /**
   * Validate credential data for this provider
   * @param {Object} credentials - Credential data to validate
   * @returns {Object} Validation result { isValid, errors }
   */
  validateCredentials(credentials) {
    const errors = [];
    const fields = this.getFields();
    
    for (const field of fields) {
      const value = credentials[field.name];
      const fieldErrors = this.validateField(field, value);
      errors.push(...fieldErrors);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate a single field
   * @param {Object} field - Field definition
   * @param {any} value - Field value
   * @returns {Array} Array of error messages
   */
  validateField(field, value) {
    const errors = [];
    
    // Required field validation
    if (field.required && (!value || value.trim() === '')) {
      errors.push(`${field.label} is required`);
      return errors;
    }
    
    // Skip other validations if field is empty and not required
    if (!value || value.trim() === '') {
      return errors;
    }
    
    // Type validation
    if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`${field.label} must be a valid email address`);
      }
    }
    
    // Length validation
    if (field.minLength && value.length < field.minLength) {
      errors.push(`${field.label} must be at least ${field.minLength} characters`);
    }
    
    if (field.maxLength && value.length > field.maxLength) {
      errors.push(`${field.label} must not exceed ${field.maxLength} characters`);
    }
    
    // Pattern validation
    if (field.pattern && !field.pattern.test(value)) {
      errors.push(field.patternMessage || `${field.label} format is invalid`);
    }
    
    // Custom validation
    if (field.customValidator) {
      const customResult = field.customValidator(value);
      if (customResult !== true) {
        errors.push(customResult);
      }
    }
    
    return errors;
  }
  
  /**
   * Get UI configuration for this provider
   * @returns {Object} UI configuration
   */
  getUIConfig() {
    return {
      description: this.config.description,
      website: this.config.website,
      helpUrl: this.config.helpUrl,
      text: this.config.text || {}
    };
  }
  
  /**
   * Transform credentials for storage
   * @param {Object} credentials - Raw credential data
   * @returns {Object} Transformed credentials
   */
  transformForStorage(credentials) {
    // Base implementation - just return as-is
    // Providers can override for encryption, formatting, etc.
    return credentials;
  }
  
  /**
   * Transform credentials from storage
   * @param {Object} storedCredentials - Stored credential data
   * @returns {Object} Transformed credentials
   */
  transformFromStorage(storedCredentials) {
    // Base implementation - just return as-is
    // Providers can override for decryption, formatting, etc.
    return storedCredentials;
  }
  
  /**
   * Test credentials validity (override in providers)
   * @param {Object} credentials - Credentials to test
   * @returns {Promise<Object>} Test result { success, message }
   */
  async testCredentials(credentials) {
    // Base implementation - just validate format
    const validation = this.validateCredentials(credentials);
    return {
      success: validation.isValid,
      message: validation.isValid ? 'Credentials format is valid' : validation.errors.join(', ')
    };
  }
}
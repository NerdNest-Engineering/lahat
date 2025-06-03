/**
 * Provider Registry
 * Manages all credential providers and provides factory methods
 */

import { AnthropicProvider } from './anthropic/AnthropicProvider.js';
import { OpenAIProvider } from './openai/OpenAIProvider.js';
import { AmazonS3Provider } from './amazon-s3/AmazonS3Provider.js';

export class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.registerDefaultProviders();
  }
  
  /**
   * Register default providers
   * @private
   */
  registerDefaultProviders() {
    this.registerProvider(new AnthropicProvider());
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new AmazonS3Provider());
  }
  
  /**
   * Register a provider
   * @param {BaseProvider} provider - Provider instance
   */
  registerProvider(provider) {
    this.providers.set(provider.getId(), provider);
  }
  
  /**
   * Get a provider by ID
   * @param {string} providerId - Provider identifier
   * @returns {BaseProvider|null} Provider instance or null
   */
  getProvider(providerId) {
    return this.providers.get(providerId) || null;
  }
  
  /**
   * Get all registered providers
   * @returns {Array<BaseProvider>} Array of provider instances
   */
  getAllProviders() {
    return Array.from(this.providers.values());
  }
  
  /**
   * Get all provider IDs
   * @returns {Array<string>} Array of provider IDs
   */
  getProviderIds() {
    return Array.from(this.providers.keys());
  }
  
  /**
   * Check if a provider is registered
   * @param {string} providerId - Provider identifier
   * @returns {boolean} True if provider is registered
   */
  hasProvider(providerId) {
    return this.providers.has(providerId);
  }
  
  /**
   * Get providers by category/type
   * @param {string} category - Provider category (e.g., 'ai', 'storage')
   * @returns {Array<BaseProvider>} Filtered providers
   */
  getProvidersByCategory(category) {
    return this.getAllProviders().filter(provider => {
      const config = provider.config;
      return config.category === category;
    });
  }
  
  /**
   * Validate credentials for a specific provider
   * @param {string} providerId - Provider identifier
   * @param {Object} credentials - Credentials to validate
   * @returns {Object} Validation result { isValid, errors }
   */
  validateCredentials(providerId, credentials) {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return {
        isValid: false,
        errors: [`Provider "${providerId}" not found`]
      };
    }
    
    return provider.validateCredentials(credentials);
  }
  
  /**
   * Test credentials for a specific provider
   * @param {string} providerId - Provider identifier
   * @param {Object} credentials - Credentials to test
   * @returns {Promise<Object>} Test result { success, message }
   */
  async testCredentials(providerId, credentials) {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return {
        success: false,
        message: `Provider "${providerId}" not found`
      };
    }
    
    return provider.testCredentials(credentials);
  }
  
  /**
   * Get UI configuration for all providers
   * @returns {Object} UI configuration map { providerId: config }
   */
  getAllProviderUIConfigs() {
    const configs = {};
    
    for (const [providerId, provider] of this.providers) {
      configs[providerId] = {
        ...provider.getUIConfig(),
        branding: provider.getBranding(),
        fields: provider.getFields()
      };
    }
    
    return configs;
  }
  
  /**
   * Get UI configuration for a specific provider
   * @param {string} providerId - Provider identifier
   * @returns {Object|null} UI configuration or null
   */
  getProviderUIConfig(providerId) {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return null;
    }
    
    return {
      ...provider.getUIConfig(),
      branding: provider.getBranding(),
      fields: provider.getFields()
    };
  }
}

// Export singleton instance
export const providerRegistry = new ProviderRegistry();
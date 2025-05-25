/**
 * ProviderRegistry - Dynamic provider registration and management
 */
export class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.config = null;
  }
  
  /**
   * Load provider configuration from JSON file
   * @returns {Promise<void>}
   */
  async loadConfig() {
    try {
      const response = await fetch('./api-setup/config/providers.json');
      if (!response.ok) {
        throw new Error(`Failed to load provider config: ${response.statusText}`);
      }
      this.config = await response.json();
    } catch (error) {
      console.error('Error loading provider configuration:', error);
      // Fallback to default configuration
      this.config = {
        claude: {
          id: 'claude',
          name: 'Claude API',
          description: 'Required for generating mini apps with Claude AI',
          keyPattern: '^sk-ant-[a-zA-Z0-9\\-_]+$',
          helpUrl: 'https://console.anthropic.com/',
          color: '#FF6B35',
          icon: 'assets/icons/claude.svg',
          priority: 1,
          required: true
        },
        openai: {
          id: 'openai',
          name: 'OpenAI API',
          description: 'Required for generating app logos with DALL-E 3',
          keyPattern: '^sk-[a-zA-Z0-9\\-_]+$',
          helpUrl: 'https://platform.openai.com/api-keys',
          color: '#10A37F',
          icon: 'assets/icons/openai.svg',
          priority: 2,
          required: false
        }
      };
    }
  }
  
  /**
   * Register a provider instance
   * @param {ApiProvider} provider - Provider instance to register
   */
  registerProvider(provider) {
    if (!provider || !provider.id) {
      throw new Error('Invalid provider: must have an id');
    }
    this.providers.set(provider.id, provider);
  }
  
  /**
   * Get a provider by ID
   * @param {string} id - Provider ID
   * @returns {ApiProvider|undefined} Provider instance
   */
  getProvider(id) {
    return this.providers.get(id);
  }
  
  /**
   * Get all registered providers sorted by priority
   * @returns {ApiProvider[]} Array of provider instances
   */
  getAllProviders() {
    return Array.from(this.providers.values())
      .sort((a, b) => a.getPriority() - b.getPriority());
  }
  
  /**
   * Get only required providers
   * @returns {ApiProvider[]} Array of required provider instances
   */
  getRequiredProviders() {
    return this.getAllProviders().filter(provider => provider.isRequired());
  }
  
  /**
   * Get only optional providers
   * @returns {ApiProvider[]} Array of optional provider instances
   */
  getOptionalProviders() {
    return this.getAllProviders().filter(provider => !provider.isRequired());
  }
  
  /**
   * Get provider configuration by ID
   * @param {string} id - Provider ID
   * @returns {Object|undefined} Provider configuration
   */
  getProviderConfig(id) {
    return this.config ? this.config[id] : undefined;
  }
  
  /**
   * Get all provider configurations
   * @returns {Object} All provider configurations
   */
  getAllConfigs() {
    return this.config || {};
  }
  
  /**
   * Check if a provider is registered
   * @param {string} id - Provider ID
   * @returns {boolean} True if provider is registered
   */
  hasProvider(id) {
    return this.providers.has(id);
  }
  
  /**
   * Unregister a provider
   * @param {string} id - Provider ID
   * @returns {boolean} True if provider was removed
   */
  unregisterProvider(id) {
    return this.providers.delete(id);
  }
  
  /**
   * Clear all registered providers
   */
  clear() {
    this.providers.clear();
  }
  
  /**
   * Get provider count
   * @returns {number} Number of registered providers
   */
  getProviderCount() {
    return this.providers.size;
  }
}

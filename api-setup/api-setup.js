import { StateManager } from './core/StateManager.js';
import { EventBus } from './core/EventBus.js';
import { ProviderRegistry } from './providers/ProviderRegistry.js';
import { ClaudeProvider } from './providers/ClaudeProvider.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';
import { ProviderCard } from './ui/ProviderCard.js';

/**
 * ApiSetupController - Main controller for the API setup component
 */
class ApiSetupController {
  constructor() {
    this.stateManager = new StateManager();
    this.eventBus = new EventBus();
    this.providerRegistry = new ProviderRegistry();
    this.providerCards = new Map();
    this.initialized = false;
  }
  
  /**
   * Initialize the API setup component
   */
  async initialize() {
    try {
      // 1. Load provider configuration
      await this.providerRegistry.loadConfig();
      
      // 2. Register providers
      this.registerProviders();
      
      // 3. Initialize state from storage
      await this.initializeState();
      
      // 4. Setup event listeners
      this.setupEventListeners();
      
      // 5. Render UI
      this.renderUI();
      
      // 6. Setup global action buttons
      this.setupGlobalActions();
      
      // 7. Mark as initialized
      this.stateManager.setInitialized(true);
      this.initialized = true;
      
    } catch (error) {
      console.error('Error initializing API setup:', error);
      this.handleInitializationError(error);
    }
  }
  
  /**
   * Register all providers
   */
  registerProviders() {
    const configs = this.providerRegistry.getAllConfigs();
    
    // Register Claude provider
    if (configs.claude) {
      this.providerRegistry.registerProvider(new ClaudeProvider(configs.claude));
    }
    
    // Register OpenAI provider
    if (configs.openai) {
      this.providerRegistry.registerProvider(new OpenAIProvider(configs.openai));
    }
  }
  
  /**
   * Initialize state from storage
   */
  async initializeState() {
    const providers = this.providerRegistry.getAllProviders();
    
    for (const provider of providers) {
      try {
        const hasKey = await provider.loadKey();
        
        this.stateManager.setProviderState(provider.id, {
          enabled: hasKey, // Enable only if key exists
          hasKey,
          keyMasked: hasKey ? '••••••••••••••••••••••••••••••••' : '',
          lastTested: null,
          testResult: null,
          isSecurelyStored: hasKey
        });
        
      } catch (error) {
        console.error(`Error loading ${provider.name} state:`, error);
        this.stateManager.setError(provider.id, {
          message: `Failed to load ${provider.name} configuration`,
          type: 'storage',
          timestamp: Date.now()
        });
      }
    }
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for provider events
    this.eventBus.on(EventBus.EVENTS.PROVIDER_KEY_SAVED, (data) => {
      // Key saved successfully
    });
    
    this.eventBus.on(EventBus.EVENTS.PROVIDER_KEY_DELETED, (data) => {
      // Key deleted successfully
    });
    
    this.eventBus.on(EventBus.EVENTS.PROVIDER_TEST_COMPLETED, (data) => {
      // Test completed
    });
  }
  
  /**
   * Render the UI
   */
  renderUI() {
    const contentContainer = document.querySelector('.content');
    if (!contentContainer) {
      throw new Error('Content container not found');
    }
    
    // Clear existing content
    contentContainer.innerHTML = '';
    
    // Create provider sections
    const providers = this.providerRegistry.getAllProviders();
    
    providers.forEach(provider => {
      // Create section for each provider
      const section = document.createElement('div');
      section.className = 'section';
      section.id = `${provider.id}-api-section`;
      
      // Create provider card
      const providerCard = new ProviderCard(provider, this.stateManager, this.eventBus);
      this.providerCards.set(provider.id, providerCard);
      
      // Mount the card
      providerCard.mount(section);
      
      // Add to content
      contentContainer.appendChild(section);
    });
    
    // Add security notice
    this.addSecurityNotice(contentContainer);
    
    // Add action buttons container (will be populated by setupGlobalActions)
    const actionButtonsContainer = document.createElement('div');
    actionButtonsContainer.className = 'action-buttons';
    actionButtonsContainer.id = 'global-action-buttons';
    contentContainer.appendChild(actionButtonsContainer);
  }
  
  /**
   * Add security notice
   * @param {HTMLElement} container - Container element
   */
  addSecurityNotice(container) {
    const securityNotice = document.createElement('div');
    securityNotice.className = 'security-notice';
    securityNotice.innerHTML = `
      <h3>🔒 Security Notice</h3>
      <p>API keys are encrypted and stored securely on your device only. They are never shared or transmitted to any third parties.</p>
    `;
    container.appendChild(securityNotice);
  }
  
  /**
   * Setup global action buttons
   */
  setupGlobalActions() {
    const actionButtonsContainer = document.getElementById('global-action-buttons');
    if (!actionButtonsContainer) {
      return;
    }
    
    actionButtonsContainer.innerHTML = `
      <button id="test-all-apis-button" class="secondary-button">Test All API Connections</button>
      <button id="close-button" class="primary-button">Close</button>
    `;
    
    // Test all APIs button
    const testAllButton = document.getElementById('test-all-apis-button');
    if (testAllButton) {
      testAllButton.addEventListener('click', () => this.testAllConnections());
    }
    
    // Close button
    const closeButton = document.getElementById('close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        if (window.electronAPI && window.electronAPI.closeCurrentWindow) {
          window.electronAPI.closeCurrentWindow();
        }
      });
    }
  }
  
  /**
   * Test all API connections
   */
  async testAllConnections() {
    const testButton = document.getElementById('test-all-apis-button');
    if (testButton) {
      testButton.disabled = true;
      testButton.textContent = 'Testing...';
    }
    
    try {
      const providers = this.providerRegistry.getAllProviders();
      const testPromises = [];
      
      for (const provider of providers) {
        const state = this.stateManager.getProviderState(provider.id);
        if (state.hasKey) {
          // Find the provider card and trigger its test
          const providerCard = this.providerCards.get(provider.id);
          if (providerCard) {
            testPromises.push(providerCard.onTestConnection());
          }
        }
      }
      
      if (testPromises.length > 0) {
        await Promise.all(testPromises);
        console.log('All API connection tests completed');
      } else {
        console.log('No API keys configured for testing');
      }
      
    } catch (error) {
      console.error('Error testing API connections:', error);
    } finally {
      if (testButton) {
        testButton.disabled = false;
        testButton.textContent = 'Test All API Connections';
      }
    }
  }
  
  /**
   * Handle initialization errors
   * @param {Error} error - Initialization error
   */
  handleInitializationError(error) {
    const contentContainer = document.querySelector('.content');
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div class="error-container">
          <h3>Initialization Error</h3>
          <p>Failed to initialize API setup: ${error.message}</p>
          <button onclick="location.reload()" class="primary-button">Retry</button>
        </div>
      `;
    }
  }
  
  /**
   * Cleanup resources
   */
  destroy() {
    // Unmount all provider cards
    this.providerCards.forEach(card => card.unmount());
    this.providerCards.clear();
    
    // Clear event listeners
    this.eventBus.events.clear();
    
    // Reset state
    this.stateManager.state = {
      providers: new Map(),
      loading: new Set(),
      errors: new Map(),
      initialized: false
    };
    
    this.initialized = false;
  }
}

// Global controller instance
let apiSetupController = null;

/**
 * Initialize the API setup when DOM is ready
 */
async function initializeApiSetup() {
  try {
    if (apiSetupController) {
      apiSetupController.destroy();
    }
    
    apiSetupController = new ApiSetupController();
    await apiSetupController.initialize();
    
  } catch (error) {
    console.error('Failed to initialize API setup:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApiSetup);
} else {
  // DOM is already loaded
  initializeApiSetup();
}

// Export for potential external use
export { ApiSetupController, initializeApiSetup };

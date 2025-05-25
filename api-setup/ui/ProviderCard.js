import { EventBus } from '../core/EventBus.js';

/**
 * ProviderCard - Reusable UI component for individual API providers
 */
export class ProviderCard {
  constructor(provider, stateManager, eventBus) {
    this.provider = provider;
    this.stateManager = stateManager;
    this.eventBus = eventBus;
    this.element = null;
    this.boundHandlers = {};
    
    // Bind event handlers
    this.bindEventHandlers();
  }
  
  /**
   * Bind event handlers to maintain proper context
   */
  bindEventHandlers() {
    this.boundHandlers.onSaveKey = this.onSaveKey.bind(this);
    this.boundHandlers.onClearKey = this.onClearKey.bind(this);
    this.boundHandlers.onTestConnection = this.onTestConnection.bind(this);
    this.boundHandlers.onKeyPress = this.onKeyPress.bind(this);
    this.boundHandlers.onStateChange = this.onStateChange.bind(this);
  }
  
  /**
   * Render the provider card
   * @returns {string} HTML string
   */
  render() {
    const state = this.stateManager.getProviderState(this.provider.id);
    const error = this.stateManager.getError(this.provider.id);
    const isLoading = this.stateManager.isLoading(this.provider.id);
    
    // Debug logging
    console.log(`Rendering ${this.provider.name} card with state:`, {
      hasKey: state.hasKey,
      enabled: state.enabled,
      keyMasked: state.keyMasked,
      isSecurelyStored: state.isSecurelyStored
    });
    
    return `
      <div class="provider-card" data-provider="${this.provider.id}">
        <div class="provider-header">
          <div class="provider-info">
            <div class="provider-details">
              <h3>${this.provider.name}</h3>
              <p class="provider-description">${this.provider.getDescription()}</p>
            </div>
          </div>
        </div>
        
        <div class="provider-content">
          ${this.renderKeySection(state, isLoading)}
          ${this.renderStatusSection(state, error)}
          ${this.renderHelpSection()}
        </div>
      </div>
    `;
  }
  
  /**
   * Render the API key input section
   * @param {Object} state - Provider state
   * @param {boolean} isLoading - Loading state
   * @returns {string} HTML string
   */
  renderKeySection(state, isLoading) {
    const placeholder = state.hasKey ? state.keyMasked : `Enter your ${this.provider.name} key`;
    const buttonText = state.hasKey ? `Update ${this.provider.name} Key` : `Save ${this.provider.name} Key`;
    
    return `
      <div class="api-key-container">
        <input 
          type="password" 
          class="api-key-input" 
          placeholder="${placeholder}"
          ${isLoading ? 'disabled' : ''}
        />
        <div class="button-group">
          <button 
            class="save-button primary-button" 
            ${isLoading ? 'disabled' : ''}
          >
            ${isLoading ? 'Saving...' : buttonText}
          </button>
          ${state.hasKey ? `
            <button 
              class="clear-button secondary-button" 
              ${isLoading ? 'disabled' : ''}
            >
              ${isLoading ? 'Clearing...' : 'Clear'}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  /**
   * Render the status section
   * @param {Object} state - Provider state
   * @param {Object} error - Error object
   * @returns {string} HTML string
   */
  renderStatusSection(state, error) {
    let statusClass = 'api-key-status';
    let statusText = 'API key is not set.';
    
    if (error) {
      statusClass += ' error';
      statusText = error.message;
    } else if (state.hasKey) {
      statusClass += ' success';
      statusText = `${this.provider.name} API key is set. ✓`;
    }
    
    return `
      <div class="${statusClass}">${statusText}</div>
      ${state.hasKey ? `
        <button class="test-button secondary-button">
          Test ${this.provider.name} Connection
        </button>
      ` : ''}
    `;
  }
  
  /**
   * Render the help section
   * @returns {string} HTML string
   */
  renderHelpSection() {
    return `
      <div class="api-key-help">
        <p>${this.provider.getDescription()}</p>
        <p>Get your API key from <a href="#" class="help-link">
          ${this.provider.name} Console
        </a></p>
      </div>
    `;
  }
  
  /**
   * Mount the component to the DOM
   * @param {HTMLElement} container - Container element
   */
  mount(container) {
    container.innerHTML = this.render();
    this.element = container.querySelector(`[data-provider="${this.provider.id}"]`);
    this.attachEventListeners();
    
    // Subscribe to state changes
    this.stateManager.subscribe(this.boundHandlers.onStateChange);
  }
  
  /**
   * Unmount the component from the DOM
   */
  unmount() {
    if (this.element) {
      this.detachEventListeners();
      this.stateManager.unsubscribe(this.boundHandlers.onStateChange);
      this.element = null;
    }
  }
  
  /**
   * Attach event listeners
   */
  attachEventListeners() {
    if (!this.element) return;
    
    const saveButton = this.element.querySelector('.save-button');
    const clearButton = this.element.querySelector('.clear-button');
    const testButton = this.element.querySelector('.test-button');
    const input = this.element.querySelector('.api-key-input');
    const helpLink = this.element.querySelector('.help-link');
    
    if (saveButton) {
      saveButton.addEventListener('click', this.boundHandlers.onSaveKey);
    }
    
    if (clearButton) {
      clearButton.addEventListener('click', this.boundHandlers.onClearKey);
    }
    
    if (testButton) {
      testButton.addEventListener('click', this.boundHandlers.onTestConnection);
    }
    
    if (input) {
      input.addEventListener('keypress', this.boundHandlers.onKeyPress);
    }
    
    if (helpLink) {
      helpLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.electronAPI.openExternal(this.provider.getHelpUrl());
      });
    }
  }
  
  /**
   * Detach event listeners
   */
  detachEventListeners() {
    if (!this.element) return;
    
    const saveButton = this.element.querySelector('.save-button');
    const clearButton = this.element.querySelector('.clear-button');
    const testButton = this.element.querySelector('.test-button');
    const input = this.element.querySelector('.api-key-input');
    
    if (saveButton) {
      saveButton.removeEventListener('click', this.boundHandlers.onSaveKey);
    }
    
    if (clearButton) {
      clearButton.removeEventListener('click', this.boundHandlers.onClearKey);
    }
    
    if (testButton) {
      testButton.removeEventListener('click', this.boundHandlers.onTestConnection);
    }
    
    if (input) {
      input.removeEventListener('keypress', this.boundHandlers.onKeyPress);
    }
  }
  
  /**
   * Handle save key button click
   */
  async onSaveKey() {
    const input = this.element.querySelector('.api-key-input');
    const apiKey = input.value.trim();
    
    if (!apiKey) {
      this.stateManager.setError(this.provider.id, {
        message: `Please enter a valid ${this.provider.name} API key.`,
        type: 'validation',
        timestamp: Date.now()
      });
      return;
    }
    
    // Validate key format
    const isValid = await this.provider.validateKey(apiKey);
    if (!isValid) {
      this.stateManager.setError(this.provider.id, {
        message: `Invalid ${this.provider.name} API key format.`,
        type: 'validation',
        timestamp: Date.now()
      });
      return;
    }
    
    // Clear any existing errors
    this.stateManager.clearError(this.provider.id);
    
    // Set loading state
    this.stateManager.setLoading(this.provider.id, true);
    
    try {
      const result = await this.provider.saveKey(apiKey);
      
      if (result.success) {
        // Clear input for security
        input.value = '';
        
        // Update state
        this.stateManager.setProviderState(this.provider.id, {
          hasKey: true,
          keyMasked: this.provider.maskKey(apiKey),
          isSecurelyStored: true
        });
        
        // Emit success event
        this.eventBus.emit(EventBus.EVENTS.PROVIDER_KEY_SAVED, {
          providerId: this.provider.id,
          provider: this.provider
        });
        
        // Show temporary success message
        this.showTemporaryMessage(`${this.provider.name} API key saved successfully. ✓`, 'success');
        
      } else {
        this.stateManager.setError(this.provider.id, {
          message: result.error || 'Failed to save API key',
          type: 'storage',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      this.stateManager.setError(this.provider.id, {
        message: error.message || 'Failed to save API key',
        type: 'storage',
        timestamp: Date.now()
      });
    } finally {
      this.stateManager.setLoading(this.provider.id, false);
    }
  }
  
  /**
   * Handle clear key button click
   */
  async onClearKey() {
    if (!confirm(`Are you sure you want to remove the ${this.provider.name} API key?`)) {
      return;
    }
    
    this.stateManager.setLoading(this.provider.id, true);
    this.stateManager.clearError(this.provider.id);
    
    try {
      const result = await this.provider.deleteKey();
      
      if (result.success) {
        // Update state
        this.stateManager.setProviderState(this.provider.id, {
          hasKey: false,
          keyMasked: '',
          isSecurelyStored: false,
          lastTested: null,
          testResult: null
        });
        
        // Clear input
        const input = this.element.querySelector('.api-key-input');
        if (input) input.value = '';
        
        // Emit deletion event
        this.eventBus.emit(EventBus.EVENTS.PROVIDER_KEY_DELETED, {
          providerId: this.provider.id,
          provider: this.provider
        });
        
        // Show temporary success message
        this.showTemporaryMessage(`${this.provider.name} API key removed successfully.`, 'info');
        
      } else {
        this.stateManager.setError(this.provider.id, {
          message: result.error || 'Failed to remove API key',
          type: 'storage',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      this.stateManager.setError(this.provider.id, {
        message: error.message || 'Failed to remove API key',
        type: 'storage',
        timestamp: Date.now()
      });
    } finally {
      this.stateManager.setLoading(this.provider.id, false);
    }
  }
  
  /**
   * Handle test connection button click
   */
  async onTestConnection() {
    this.stateManager.setLoading(this.provider.id, true);
    this.stateManager.clearError(this.provider.id);
    
    // Emit test started event
    this.eventBus.emit(EventBus.EVENTS.PROVIDER_TEST_STARTED, {
      providerId: this.provider.id,
      provider: this.provider
    });
    
    try {
      const result = await this.provider.testConnection();
      
      // Update test result in state
      this.stateManager.setProviderState(this.provider.id, {
        lastTested: Date.now(),
        testResult: result.success ? 'success' : 'error'
      });
      
      if (result.success) {
        this.showTemporaryMessage(`${this.provider.name} API connection: ✓ Working`, 'success');
      } else {
        this.stateManager.setError(this.provider.id, {
          message: `${this.provider.name} API error: ${result.message}`,
          type: 'network',
          timestamp: Date.now()
        });
      }
      
      // Emit test completed event
      this.eventBus.emit(EventBus.EVENTS.PROVIDER_TEST_COMPLETED, {
        providerId: this.provider.id,
        provider: this.provider,
        result
      });
      
    } catch (error) {
      this.stateManager.setError(this.provider.id, {
        message: `${this.provider.name} API test failed: ${error.message}`,
        type: 'network',
        timestamp: Date.now()
      });
    } finally {
      this.stateManager.setLoading(this.provider.id, false);
    }
  }
  
  /**
   * Handle key press in input field
   * @param {KeyboardEvent} event - Keyboard event
   */
  onKeyPress(event) {
    if (event.key === 'Enter') {
      this.onSaveKey();
    }
  }
  
  /**
   * Handle state changes
   */
  onStateChange() {
    if (this.element) {
      this.update();
    }
  }
  
  /**
   * Update the component
   */
  update() {
    if (!this.element) return;
    
    const container = this.element.parentElement;
    this.detachEventListeners();
    container.innerHTML = this.render();
    this.element = container.querySelector(`[data-provider="${this.provider.id}"]`);
    this.attachEventListeners();
  }
  
  /**
   * Show temporary message
   * @param {string} message - Message to show
   * @param {string} type - Message type (success, error, info)
   */
  showTemporaryMessage(message, type = 'info') {
    const statusElement = this.element.querySelector('.api-key-status');
    if (statusElement) {
      const originalText = statusElement.textContent;
      const originalClass = statusElement.className;
      
      statusElement.textContent = message;
      statusElement.className = `api-key-status ${type}`;
      
      setTimeout(() => {
        statusElement.textContent = originalText;
        statusElement.className = originalClass;
      }, 3000);
    }
  }
}

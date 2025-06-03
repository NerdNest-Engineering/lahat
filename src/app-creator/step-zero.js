/**
 * Step Zero: Credential Selection
 * N8N-style credential selection before app creation begins
 */

import { debugLog } from '../../components/core/debug.js';

class StepZero extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.credentials = {
      claude: [],
      openai: []
    };
    this.selectedCredentials = {
      claude: null,
      openai: null
    };
  }

  async connectedCallback() {
    await this.loadCredentials();
    await this.loadSavedSelections();
    
    // Check if we can auto-skip this step
    if (await this.canAutoSkip()) {
      debugLog('🚀 step-zero: Auto-skipping - credentials already configured');
      this.autoSkipToAppCreation();
      return;
    }
    
    this.render();
    this.setupEventListeners();
  }

  async loadCredentials() {
    try {
      const result = await window.electronAPI.loadCredentials();
      if (result.success) {
        // Filter credentials by service type
        this.credentials.claude = result.credentials.filter(cred => 
          cred.type === 'anthropic' || cred.name.includes('claude') || cred.name.startsWith('claude.')
        );
        this.credentials.openai = result.credentials.filter(cred => 
          cred.type === 'openai' || cred.name.includes('openai') || cred.name.startsWith('openai.')
        );
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  }

  async refreshCredentials() {
    // Reload credentials from the backend
    await this.loadCredentials();
    
    // Repopulate the selectors with fresh data
    this.populateSelectors();
    
    // Update the selectors to reflect saved selections
    this.updateSelectors();
    
    // Update credential previews
    this.updateCredentialPreview('claude');
    this.updateCredentialPreview('openai');
    
    // Update continue button state
    this.updateContinueButton();
    
    debugLog('🔄 step-zero: Credentials refreshed');
  }

  async loadSavedSelections() {
    try {
      const settings = await window.electronAPI.getAppCreationSettings();
      if (settings && settings.defaultCredentials) {
        this.selectedCredentials = { ...settings.defaultCredentials };
        if (this.shadowRoot.innerHTML) {
          this.updateSelectors();
        }
      }
    } catch (error) {
      console.error('Failed to load saved credential selections:', error);
    }
  }

  async canAutoSkip() {
    // Check if we have saved credential selections
    const hasClaudeSelection = !!this.selectedCredentials.claude;
    const hasOpenaiSelection = !!this.selectedCredentials.openai;
    
    if (!hasClaudeSelection || !hasOpenaiSelection) {
      debugLog('🚀 step-zero: Cannot auto-skip - missing saved selections');
      return false;
    }

    // Verify that the selected credentials still exist
    const claudeExists = this.credentials.claude.some(c => c.id === this.selectedCredentials.claude);
    const openaiExists = this.credentials.openai.some(c => c.id === this.selectedCredentials.openai);

    if (!claudeExists || !openaiExists) {
      debugLog('🚀 step-zero: Cannot auto-skip - selected credentials no longer exist');
      // Clear invalid selections
      if (!claudeExists) this.selectedCredentials.claude = null;
      if (!openaiExists) this.selectedCredentials.openai = null;
      await this.saveSelections();
      return false;
    }

    debugLog('🚀 step-zero: Can auto-skip - valid credentials found', {
      claude: this.selectedCredentials.claude,
      openai: this.selectedCredentials.openai
    });
    return true;
  }

  autoSkipToAppCreation() {
    // Immediately proceed to app creation without rendering the UI
    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('step-zero-complete', {
        bubbles: true,
        composed: true,
        detail: {
          selectedCredentials: { ...this.selectedCredentials },
          autoSkipped: true
        }
      }));
    }, 0);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary-color: #4285f4;
          --primary-hover: #3367d6;
          --primary-light: #e8f0fe;
          --success-color: #34a853;
          --success-700: #2e7d32;
          --border-color: #e0e0e0;
          --text-primary: #333;
          --text-secondary: #666;
          --text-muted: #999;
          --background-light: #f5f5f5;
          --border-radius: 8px;
          --spacing-xs: 8px;
          --spacing-sm: 12px;
          --spacing-md: 16px;
          --spacing-lg: 24px;
          --spacing-xl: 32px;
          
          display: block;
          max-width: 600px;
          margin: 0 auto;
          padding: var(--spacing-lg);
        }
        
        :host(.hidden) {
          display: none;
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }
        
        .step-number {
          width: 40px;
          height: 40px;
          background: var(--primary-color);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 18px;
        }
        
        .step-title {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .main-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 var(--spacing-xs) 0;
        }

        .description {
          color: var(--text-secondary);
          font-size: var(--spacing-md);
          line-height: 1.5;
          margin-bottom: var(--spacing-lg);
        }

        .credential-group {
          margin-bottom: var(--spacing-lg);
        }

        .credential-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-sm);
          font-weight: 500;
          color: var(--text-primary);
        }

        .service-icon {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          color: white;
        }

        .claude-icon {
          background: #ff6b35;
        }

        .openai-icon {
          background: #1a1a1a;
        }

        .credential-selector-container {
          display: flex;
          gap: var(--spacing-sm);
          align-items: stretch;
        }

        .credential-selector {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .refresh-btn {
          padding: 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }

        .refresh-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .credential-selector:focus {
          outline: none;
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-500) 12%, transparent);
        }

        .credential-selector:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .add-credential-btn {
          padding: 12px 16px;
          background: #4285f4;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s ease;
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(66, 133, 244, 0.2);
        }

        .add-credential-btn:hover {
          background: #3367d6;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(66, 133, 244, 0.3);
        }

        .add-credential-btn:active {
          transform: translateY(0);
        }

        .credential-info {
          margin-top: var(--spacing-sm);
          padding: var(--spacing-sm);
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
          font-size: 13px;
          color: var(--text-muted);
        }

        .actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--spacing-xl);
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--border-color);
        }

        .left-actions {
          display: flex;
          gap: var(--spacing-md);
          align-items: center;
        }

        .settings-link {
          color: var(--text-muted);
          text-decoration: none;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          transition: color 0.2s ease;
        }

        .settings-link:hover {
          color: var(--primary-500);
        }

        .continue-btn {
          padding: 14px 28px;
          background: #4285f4;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 140px;
          box-shadow: 0 2px 8px rgba(66, 133, 244, 0.3);
        }

        .continue-btn:hover:not(:disabled) {
          background: #3367d6;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);
        }

        .continue-btn:disabled {
          background: #e0e0e0;
          color: #9e9e9e;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        .credential-preview {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-sm);
          padding: var(--spacing-sm);
          background: var(--success-50);
          border: 1px solid var(--success-200);
          border-radius: var(--radius-sm);
          font-size: 13px;
          color: var(--success-700);
        }

        .hidden {
          display: none;
        }
      </style>

      <div class="step-header">
        <div class="step-number">0</div>
        <h1 class="step-title">Select Your API Credentials</h1>
      </div>
      
      <h2 class="main-title">Choose your API credentials</h2>
      <p class="description">
        Choose which API credentials to use for app creation. You can manage these settings and add new credentials anytime.
      </p>

        <div class="credential-group">
          <div class="credential-label">
            <span class="service-icon claude-icon">C</span>
            Claude (Anthropic) - App Generation
          </div>
          <div class="credential-selector-container">
            <select class="credential-selector" id="claude-selector">
              <option value="">Select Claude credential...</option>
            </select>
            <button class="refresh-btn" id="refresh-claude-btn" title="Refresh credentials">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
            <button class="add-credential-btn" id="add-claude-btn">Add New</button>
          </div>
          <div class="credential-info">
            Required for generating app code and logic. Get your API key from console.anthropic.com
          </div>
          <div class="credential-preview hidden" id="claude-preview">
            <span>✓</span>
            <span id="claude-preview-text"></span>
          </div>
        </div>

        <div class="credential-group">
          <div class="credential-label">
            <span class="service-icon openai-icon">AI</span>
            OpenAI - Logo Generation
          </div>
          <div class="credential-selector-container">
            <select class="credential-selector" id="openai-selector">
              <option value="">Select OpenAI credential...</option>
            </select>
            <button class="refresh-btn" id="refresh-openai-btn" title="Refresh credentials">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
            <button class="add-credential-btn" id="add-openai-btn">Add New</button>
          </div>
          <div class="credential-info">
            Required for generating app logos. Get your API key from platform.openai.com
          </div>
          <div class="credential-preview hidden" id="openai-preview">
            <span>✓</span>
            <span id="openai-preview-text"></span>
          </div>
        </div>

        <div class="actions">
          <div class="left-actions">
            <a href="#" class="settings-link" id="settings-link">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Credential Settings
            </a>
          </div>
          <button class="continue-btn" id="continue-btn" disabled>Continue</button>
        </div>
      </div>

      <!-- Inline credential creation modal will be added here -->
      <div id="inline-credential-modal" class="hidden"></div>
    `;
  }

  setupEventListeners() {
    const claudeSelector = this.shadowRoot.querySelector('#claude-selector');
    const openaiSelector = this.shadowRoot.querySelector('#openai-selector');
    const continueBtn = this.shadowRoot.querySelector('#continue-btn');
    const addClaudeBtn = this.shadowRoot.querySelector('#add-claude-btn');
    const addOpenaiBtn = this.shadowRoot.querySelector('#add-openai-btn');
    const refreshClaudeBtn = this.shadowRoot.querySelector('#refresh-claude-btn');
    const refreshOpenaiBtn = this.shadowRoot.querySelector('#refresh-openai-btn');
    const settingsLink = this.shadowRoot.querySelector('#settings-link');

    // Populate selectors
    this.populateSelectors();

    // Handle credential selection
    claudeSelector.addEventListener('change', (e) => {
      this.selectedCredentials.claude = e.target.value;
      this.updateCredentialPreview('claude');
      this.updateContinueButton();
      this.saveSelections();
    });

    openaiSelector.addEventListener('change', (e) => {
      this.selectedCredentials.openai = e.target.value;
      this.updateCredentialPreview('openai');
      this.updateContinueButton();
      this.saveSelections();
    });

    // Handle add new credential buttons
    addClaudeBtn.addEventListener('click', () => {
      this.showInlineCredentialModal('claude');
    });

    addOpenaiBtn.addEventListener('click', () => {
      this.showInlineCredentialModal('openai');
    });

    // Handle refresh buttons
    refreshClaudeBtn.addEventListener('click', async () => {
      await this.refreshCredentials();
    });

    refreshOpenaiBtn.addEventListener('click', async () => {
      await this.refreshCredentials();
    });

    // Handle continue button
    continueBtn.addEventListener('click', () => {
      this.proceedToAppCreation();
    });

    // Handle settings link
    settingsLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.openCredentialSettings();
    });
  }

  populateSelectors() {
    const claudeSelector = this.shadowRoot.querySelector('#claude-selector');
    const openaiSelector = this.shadowRoot.querySelector('#openai-selector');

    // Clear existing options (except the first placeholder)
    claudeSelector.innerHTML = '<option value="">Select Claude credential...</option>';
    openaiSelector.innerHTML = '<option value="">Select OpenAI credential...</option>';

    // Populate Claude credentials
    this.credentials.claude.forEach(cred => {
      const option = document.createElement('option');
      option.value = cred.id;
      option.textContent = cred.displayName || cred.name;
      claudeSelector.appendChild(option);
    });

    // Populate OpenAI credentials
    this.credentials.openai.forEach(cred => {
      const option = document.createElement('option');
      option.value = cred.id;
      option.textContent = cred.displayName || cred.name;
      openaiSelector.appendChild(option);
    });
  }

  updateSelectors() {
    const claudeSelector = this.shadowRoot.querySelector('#claude-selector');
    const openaiSelector = this.shadowRoot.querySelector('#openai-selector');

    if (this.selectedCredentials.claude) {
      claudeSelector.value = this.selectedCredentials.claude;
      this.updateCredentialPreview('claude');
    }

    if (this.selectedCredentials.openai) {
      openaiSelector.value = this.selectedCredentials.openai;
      this.updateCredentialPreview('openai');
    }

    this.updateContinueButton();
  }

  updateCredentialPreview(service) {
    const preview = this.shadowRoot.querySelector(`#${service}-preview`);
    const previewText = this.shadowRoot.querySelector(`#${service}-preview-text`);
    const credentialId = this.selectedCredentials[service];

    if (credentialId) {
      const credential = this.credentials[service].find(c => c.id === credentialId);
      if (credential) {
        previewText.textContent = `Using: ${credential.displayName || credential.name}`;
        preview.classList.remove('hidden');
      }
    } else {
      preview.classList.add('hidden');
    }
  }

  updateContinueButton() {
    const continueBtn = this.shadowRoot.querySelector('#continue-btn');
    const hasClaudeSelection = !!this.selectedCredentials.claude;
    const hasOpenaiSelection = !!this.selectedCredentials.openai;

    continueBtn.disabled = !(hasClaudeSelection && hasOpenaiSelection);
  }

  async saveSelections() {
    try {
      await window.electronAPI.saveAppCreationSettings({
        defaultCredentials: { ...this.selectedCredentials }
      });
    } catch (error) {
      console.error('Failed to save credential selections:', error);
    }
  }

  showInlineCredentialModal(service) {
    // This will be implemented to show an inline modal for adding credentials
    // For now, redirect to credential manager
    this.dispatchEvent(new CustomEvent('open-credential-manager', {
      bubbles: true,
      composed: true,
      detail: { service }
    }));
  }

  openCredentialSettings() {
    this.dispatchEvent(new CustomEvent('open-credential-settings', {
      bubbles: true,
      composed: true
    }));
  }

  proceedToAppCreation() {
    debugLog('🚀 step-zero: Proceeding to app creation with credentials:', this.selectedCredentials);
    
    this.dispatchEvent(new CustomEvent('step-zero-complete', {
      bubbles: true,
      composed: true,
      detail: {
        selectedCredentials: { ...this.selectedCredentials }
      }
    }));
  }

  // Public methods
  setActive(active, isManualNavigation = false) {
    if (active) {
      this.classList.add('active');
      this.classList.remove('hidden');
      
      // Refresh credentials when becoming active
      this.loadCredentials().then(async () => {
        await this.loadSavedSelections();
        
        // Only auto-skip if this is not a manual navigation and credentials are configured
        if (!isManualNavigation && await this.canAutoSkip()) {
          debugLog('🚀 step-zero: Auto-skipping - credentials already configured');
          this.autoSkipToAppCreation();
          return;
        }
        
        // Always render when manually navigating or when auto-skip is not applicable
        if (!this.shadowRoot.innerHTML || this.shadowRoot.innerHTML.trim() === '') {
          // If no content exists, render the full component
          this.render();
          this.setupEventListeners();
        } else {
          // If content exists, just update the selectors
          this.populateSelectors();
          this.updateSelectors();
        }
      });
    } else {
      this.classList.remove('active');
      this.classList.add('hidden');
    }
  }

  async refreshCredentials() {
    await this.loadCredentials();
    this.populateSelectors();
    this.updateSelectors();
  }

  // Static helper methods
  static async clearSavedCredentials() {
    try {
      await window.electronAPI.saveAppCreationSettings({
        defaultCredentials: { claude: null, openai: null }
      });
      debugLog('🚀 step-zero: Cleared saved credential selections');
      return true;
    } catch (error) {
      console.error('Failed to clear saved credential selections:', error);
      return false;
    }
  }

  static async hasValidSavedCredentials() {
    try {
      const settings = await window.electronAPI.getAppCreationSettings();
      const hasCredentials = settings && 
                           settings.defaultCredentials && 
                           settings.defaultCredentials.claude && 
                           settings.defaultCredentials.openai;
      return !!hasCredentials;
    } catch (error) {
      console.error('Failed to check saved credential selections:', error);
      return false;
    }
  }

  setCurrentSelections(selections) {
    // Set current credential selections (called when navigating back from other steps)
    if (selections) {
      this.selectedCredentials = { ...selections };
      if (this.shadowRoot.innerHTML) {
        this.updateSelectors();
      }
    }
  }

  resetButtonContainer() {
    // Step Zero doesn't have a button container to reset
    // This method is added for compatibility with the controller
  }
}

customElements.define('step-zero', StepZero);

export { StepZero };
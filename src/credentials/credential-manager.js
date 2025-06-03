// Custom Credential Manager Web Components
// Redesigned with grid-based tile layout using dynamic provider system

import { providerRegistry } from './providers/ProviderRegistry.js';

// Dynamic provider configurations from our provider system
let PROVIDERS = {};

// Load providers from our provider registry
async function loadProviders() {
  const allProviders = providerRegistry.getAllProviders();
  
  PROVIDERS = {};
  
  for (const provider of allProviders) {
    const branding = provider.getBranding();
    const uiConfig = provider.getUIConfig();
    const fields = provider.getFields();
    
    // Map our provider fields to the UI format
    const primaryField = fields.find(f => f.name === 'apiKey') || fields[0];
    
    PROVIDERS[provider.getId()] = {
      id: provider.getId(),
      name: provider.getDisplayName(),
      description: uiConfig.description || 'API credentials',
      type: primaryField?.type || 'password',
      bgColor: branding.primaryColor,
      textColor: branding.textColor,
      placeholder: primaryField?.placeholder || 'Enter credentials...',
      icon: await getProviderIcon(provider.getId()),
      fields: fields,
      branding: branding,
      uiConfig: uiConfig,
      provider: provider
    };
  }
}

// Provider icons - load from provider directories  
async function getProviderIcon(providerId) {
  try {
    // For browser environment, we'll use the provider's icon configuration
    const provider = PROVIDERS[providerId];
    if (provider && provider.provider) {
      const branding = provider.provider.getBranding();
      if (branding.iconSvg) {
        return branding.iconSvg;
      }
    }
    
    // Fallback icons
    const fallbackIcons = {
      'openai': `<svg width="24" height="24" viewBox="0 0 79.9 81" fill="currentColor">
        <path d="M74.6,33.1c1.8-5.5,1.2-11.6-1.7-16.6c-4.4-7.7-13.3-11.6-22-9.8C47.1,2.4,41.5,0,35.7,0C26.8,0,19,5.7,16.2,14.1
          c-5.7,1.2-10.6,4.7-13.5,9.8c-4.4,7.7-3.4,17.3,2.5,23.9C3.4,53.4,4.1,59.4,7,64.4c4.4,7.7,13.3,11.7,22,9.8
          c3.9,4.3,9.4,6.8,15.2,6.8c8.9,0,16.7-5.7,19.5-14.1c5.7-1.2,10.6-4.7,13.5-9.8C81.6,49.4,80.6,39.7,74.6,33.1z M44.2,75.7
          c-3.6,0-7-1.2-9.7-3.5c0.1-0.1,0.4-0.2,0.5-0.3l16.1-9.3c0.8-0.5,1.3-1.3,1.3-2.3V37.6l6.8,3.9c0.1,0,0.1,0.1,0.1,0.2v18.8
          C59.4,68.9,52.6,75.7,44.2,75.7z M11.6,61.8c-1.8-3.1-2.4-6.7-1.8-10.2c0.1,0.1,0.3,0.2,0.5,0.3l16.1,9.3c0.8,0.5,1.8,0.5,2.6,0
          l19.7-11.4v7.9c0,0.1,0,0.2-0.1,0.2l-16.3,9.4C25.1,71.5,15.8,69,11.6,61.8L11.6,61.8z M7.4,26.6c1.8-3.1,4.6-5.4,7.9-6.7v19.2
          c0,0.9,0.5,1.8,1.3,2.3l19.7,11.4l-6.8,3.9c-0.1,0-0.2,0.1-0.2,0l-16.3-9.4C5.6,43.1,3.2,33.8,7.4,26.6L7.4,26.6z M63.4,39.6
          L43.7,28.2l6.8-3.9c0.1,0,0.2-0.1,0.2,0L67,33.7c7.3,4.2,9.7,13.5,5.5,20.7c-1.8,3.1-4.6,5.4-7.9,6.6V41.9
          C64.7,41,64.2,40.1,63.4,39.6L63.4,39.6z M70.1,29.4c-0.1-0.1-0.3-0.2-0.5-0.3l-16.1-9.3c-0.8-0.5-1.8-0.5-2.6,0L31.2,31.2v-7.9
          c0-0.1,0-0.2,0.1-0.2l16.3-9.4c7.3-4.2,16.5-1.7,20.7,5.6C70.1,22.3,70.7,25.9,70.1,29.4L70.1,29.4z M27.5,43.4l-6.8-3.9
          c-0.1,0-0.1-0.1-0.1-0.2V20.5c0-8.4,6.8-15.2,15.2-15.2c3.6,0,7,1.2,9.7,3.5c-0.1,0.1-0.3,0.2-0.5,0.3l-16.1,9.3
          c-0.8,0.5-1.3,1.3-1.3,2.3V43.4z M31.2,35.4l8.8-5.1l8.8,5.1v10.1l-8.8,5.1l-8.8-5.1L31.2,35.4z"/>
      </svg>`,
      'anthropic': `<svg width="24" height="24" viewBox="0 0 92.2 65" fill="currentColor">
        <path d="M66.5,0H52.4l25.7,65h14.1L66.5,0z M25.7,0L0,65h14.4l5.3-13.6h26.9L51.8,65h14.4L40.5,0C40.5,0,25.7,0,25.7,0z
         M24.3,39.3l8.8-22.8l8.8,22.8H24.3z"/>
      </svg>`,
      'amazon-s3': `<svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor">
        <path d="m259.7 348.2-137 32.7v-250.3l137 32z"/>
        <path d="m256 348.6 133.3 32.3.1-.3v-249.6l-.1-.3-133.3 32.3v185.7"/>
        <path d="m256 64v96.8l58 14.4v-82.2zm133.3 66.6v250.3l25.6-12.8v-224.7zm-133.3 77.1v97l58-7.5v-82.2zm58 129.1-58 14.4v96.8l58-29z"/>
        <path d="m314 175.2-58 10.7-58-10.7 57.9-15.1 58.3 15.1"/>
        <path d="m314 336.8-58-10.7-58 10.7 57.9 16.1 58.3-16.1"/>
      </svg>`
    };
    
    return fallbackIcons[providerId] || `<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
    </svg>`;
  } catch (error) {
    console.warn('Failed to load provider icon:', error);
    return `<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
    </svg>`;
  }
}

// Initialize providers when the module loads
loadProviders();

// IPC Bridge for communicating with main process
class CredentialIPC {
  static async loadCredentials() {
    try {
      const result = await window.electronAPI.loadCredentials();
      return result.success ? result.credentials : [];
    } catch (error) {
      console.error('Failed to load credentials:', error);
      return [];
    }
  }

  static async saveCredential(credentialData) {
    try {
      const result = await window.electronAPI.saveCredential(credentialData);
      return result;
    } catch (error) {
      console.error('Failed to save credential:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteCredential(credentialId) {
    try {
      const result = await window.electronAPI.deleteCredential(credentialId);
      return result;
    } catch (error) {
      console.error('Failed to delete credential:', error);
      return { success: false, error: error.message };
    }
  }

  static async getCredentialValue(credentialId) {
    try {
      const result = await window.electronAPI.getCredentialValue(credentialId);
      return result;
    } catch (error) {
      console.error('Failed to get credential value:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateLastUsed(credentialId) {
    try {
      const result = await window.electronAPI.updateCredentialLastUsed(credentialId);
      return result;
    } catch (error) {
      console.error('Failed to update last used:', error);
      return { success: false, error: error.message };
    }
  }
}

// Credential Tile Component
class CredentialTile extends HTMLElement {
  constructor() {
    super();
    this.credential = null;
  }

  static get observedAttributes() {
    return ['credential-data'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'credential-data' && newValue) {
      this.credential = JSON.parse(newValue);
      this.render();
    }
  }

  render() {
    if (!this.credential) return;

    // Map credential type to provider
    const providerId = this.credential.type === 'openai' ? 'openai' : 
                     this.credential.type === 'anthropic' ? 'anthropic' :
                     this.credential.type === 'aws' ? 'aws' :
                     this.credential.name?.toLowerCase().includes('openai') ? 'openai' :
                     this.credential.name?.toLowerCase().includes('anthropic') ? 'anthropic' :
                     this.credential.name?.toLowerCase().includes('aws') ? 'aws' :
                     'custom'; // fallback

    const provider = PROVIDERS[providerId];
    if (!provider) return;

    this.innerHTML = `
      <style>
        .tile {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
          height: 160px;
          width: 100%;
          position: relative;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .tile:hover {
          border-color: var(--primary-500);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
        }

        .provider-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: ${provider.bgColor};
          color: ${provider.textColor};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .credential-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .provider-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 16px;
          line-height: 1.25;
          margin: 0;
        }

        .credential-type {
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.4;
          margin: 0;
        }

        .last-used {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .actions {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .tile:hover .actions {
          opacity: 1;
        }

        .action-btn {
          background: var(--bg-secondary);
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          color: var(--text-muted);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
        }

        .action-btn:hover {
          background: var(--primary-500);
          color: white;
          transform: scale(1.1);
        }

        .action-btn svg {
          width: 14px;
          height: 14px;
        }
      </style>

      <div class="tile" id="tile">
        <div class="actions">
          <button class="action-btn" id="copy-btn" title="Copy API key">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </button>
          <button class="action-btn" id="delete-btn" title="Delete credential">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
        
        <div class="provider-icon">
          ${provider.icon}
        </div>
        
        <div class="credential-info">
          <div class="provider-name">${this.escapeHtml(this.credential.displayName || this.credential.name)}</div>
          ${this.credential.lastUsed ? `
            <div class="credential-type">Last used: ${this.formatDate(this.credential.lastUsed)}</div>
          ` : `
            <div class="credential-type">Never used</div>
          `}
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const tile = this.querySelector('#tile');
    const copyBtn = this.querySelector('#copy-btn');
    const deleteBtn = this.querySelector('#delete-btn');

    // Tile click - open detail view
    tile?.addEventListener('click', (e) => {
      // Don't trigger if clicking action buttons
      if (e.target.closest('.action-btn')) return;
      
      this.dispatchEvent(new CustomEvent('credential-detail', {
        detail: { credential: this.credential },
        bubbles: true
      }));
    });

    // Copy action
    copyBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const result = await CredentialIPC.getCredentialValue(this.credential.id);
        if (result.success && result.value) {
          const valueToCopy = result.value.value || result.value.password || '';
          await navigator.clipboard.writeText(valueToCopy);
          
          // Update last used
          await CredentialIPC.updateLastUsed(this.credential.id);
          
          this.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: 'API key copied to clipboard', type: 'success' },
            bubbles: true
          }));
        } else {
          this.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: 'Failed to copy: ' + result.error, type: 'error' },
            bubbles: true
          }));
        }
      } catch (error) {
        this.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: 'Failed to copy to clipboard', type: 'error' },
          bubbles: true
        }));
      }
    });

    // Delete action
    deleteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dispatchEvent(new CustomEvent('credential-delete', {
        detail: { credential: this.credential },
        bubbles: true
      }));
    });
  }

  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Add Credential Tile Component
class AddCredentialTile extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <style>
        .add-tile {
          background: var(--bg-card);
          border: 2px dashed var(--border-color);
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 12px;
          height: 160px;
          width: 100%;
          color: var(--text-muted);
        }

        .add-tile:hover {
          border-color: var(--primary-500);
          background: color-mix(in srgb, var(--primary-500) 4%, var(--bg-card));
          color: var(--primary-500);
          transform: translateY(-2px);
        }

        .add-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .add-tile:hover .add-icon {
          background: var(--primary-500);
          color: white;
        }

        .add-text {
          font-weight: 500;
          font-size: 14px;
        }
      </style>

      <div class="add-tile" id="add-tile">
        <div class="add-icon">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
        </div>
        <div class="add-text">Add credential</div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const addTile = this.querySelector('#add-tile');
    
    addTile?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('add-credential', {
        bubbles: true
      }));
    });
  }
}

// Add Credential Modal Component (updated with dropdown)
class AddCredentialModal extends HTMLElement {
  constructor() {
    super();
    this.selectedProvider = null;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <style>
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .modal-overlay.show {
          display: flex;
          opacity: 1;
        }

        .modal {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          padding: 24px;
          max-width: 500px;
          width: 90%;
          box-shadow: var(--shadow-lg);
          transform: scale(0.95);
          transition: transform 0.2s ease;
          border: 1px solid var(--border-color);
        }

        .modal-overlay.show .modal {
          transform: scale(1) translateY(0);
        }

        .modal-title {
          margin: 0 0 24px 0;
          font-size: 20px;
          font-weight: 500;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .input, .select {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 14px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 48px;
          box-sizing: border-box;
        }

        .input:focus, .select:focus {
          outline: none;
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-500) 12%, transparent);
        }

        .input[type="password"] {
          font-family: monospace;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-cancel {
          background: var(--bg-secondary);
          color: var(--text-secondary);
        }

        .btn-cancel:hover {
          background: var(--border-color);
          transform: translateY(-1px);
        }

        .btn-primary {
          background: var(--primary-500);
          color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .btn-primary:hover {
          background: var(--primary-600);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
        }

        .btn-primary:active {
          transform: translateY(0);
        }

        .btn-primary:disabled {
          background: var(--text-muted);
          cursor: not-allowed;
        }

        .provider-info {
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
          padding: 12px;
          margin-top: 10px;
          font-size: 13px;
          color: var(--text-secondary);
        }
      </style>

      <div class="modal-overlay" id="modal-overlay">
        <div class="modal">
          <h3 class="modal-title">Add New Credential</h3>
          
          <div class="form-group">
            <label class="label">Provider</label>
            <select class="select" id="provider-select">
              <option value="">Choose a provider...</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="aws">AWS</option>
              <option value="custom">Custom</option>
            </select>
            <div class="provider-info" id="provider-info" style="display: none;">
              Select a provider to see instructions for obtaining an API key.
            </div>
          </div>

          <div class="form-group">
            <label class="label">Name</label>
            <input type="text" class="input" id="name-input" placeholder="e.g., OpenAI Production" />
          </div>

          <div class="form-group">
            <label class="label">API Key</label>
            <input type="password" class="input" id="key-input" placeholder="Enter your API key..." />
          </div>

          <div class="modal-actions">
            <button class="btn btn-cancel" id="cancel-btn">Cancel</button>
            <button class="btn btn-primary" id="save-btn" disabled>Save Credential</button>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const overlay = this.querySelector('#modal-overlay');
    const providerSelect = this.querySelector('#provider-select');
    const nameInput = this.querySelector('#name-input');
    const keyInput = this.querySelector('#key-input');
    const cancelBtn = this.querySelector('#cancel-btn');
    const saveBtn = this.querySelector('#save-btn');
    const providerInfo = this.querySelector('#provider-info');

    // Provider selection
    providerSelect?.addEventListener('change', (e) => {
      this.selectedProvider = e.target.value;
      this.updateProviderInfo();
      
      // Auto-fill name if empty
      if (this.selectedProvider && !nameInput.value) {
        nameInput.value = PROVIDERS[this.selectedProvider].name;
        // Trigger input event for validation
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Always update save button after any change
      this.updateSaveButton();
    });

    // Input validation
    [nameInput, keyInput].forEach(input => {
      input?.addEventListener('input', () => {
        this.updateSaveButton();
      });
    });

    // Cancel button
    cancelBtn?.addEventListener('click', () => {
      this.hide();
    });

    // Save button
    saveBtn?.addEventListener('click', async () => {
      await this.saveCredential();
    });

    // Close on backdrop click
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hide();
      }
    });

    // Enter key to save
    [nameInput, keyInput].forEach(input => {
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !saveBtn.disabled) {
          this.saveCredential();
        }
      });
    });
  }

  updateProviderInfo() {
    const providerInfo = this.querySelector('#provider-info');
    if (!this.selectedProvider) {
      providerInfo.style.display = 'none';
      return;
    }

    const infoText = {
      openai: 'Get your API key from platform.openai.com → API keys. Keep it secure!',
      anthropic: 'Get your API key from console.anthropic.com → API Keys. Keep it secure!',
      aws: 'Get your access key from AWS IAM → Users → Security credentials. Keep it secure!',
      custom: 'Enter your custom API key. Make sure to keep it secure!'
    };

    providerInfo.textContent = infoText[this.selectedProvider] || '';
    providerInfo.style.display = 'block';
  }

  updateSaveButton() {
    const nameInput = this.querySelector('#name-input');
    const keyInput = this.querySelector('#key-input');
    const saveBtn = this.querySelector('#save-btn');
    
    if (!nameInput || !keyInput || !saveBtn) {
      console.warn('Form elements not found during validation');
      return;
    }
    
    const hasProvider = !!this.selectedProvider;
    const hasName = !!nameInput.value.trim();
    const hasKey = !!keyInput.value.trim();
    
    const isValid = hasProvider && hasName && hasKey;
    saveBtn.disabled = !isValid;
    
    // Debug logging in development
    if (window.electronAPI?.isDevelopment) {
      console.log('Form validation:', { hasProvider, hasName, hasKey, isValid });
    }
  }

  async saveCredential() {
    const nameInput = this.querySelector('#name-input');
    const keyInput = this.querySelector('#key-input');
    
    // Map provider types to the naming convention expected by app creation flow
    const getCredentialName = (providerType) => {
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.protocol === 'file:' ||
                           window.electronAPI?.isDevelopment;
      const environment = isDevelopment ? 'development' : 'default';
      
      const serviceMap = {
        'anthropic': 'claude',
        'openai': 'openai',
        'aws': 'aws',
        'custom': 'custom'
      };
      
      const serviceName = serviceMap[providerType] || providerType;
      return `${serviceName}.${environment}`;
    };
    
    const credentialData = {
      id: 'cred_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: getCredentialName(this.selectedProvider), // Use standardized naming
      displayName: nameInput.value.trim(), // Keep user-friendly name for display
      type: this.selectedProvider,
      description: PROVIDERS[this.selectedProvider].description,
      value: keyInput.value.trim(),
      createdAt: new Date().toISOString(),
      lastUsed: null
    };

    const result = await CredentialIPC.saveCredential(credentialData);
    
    if (result.success) {
      this.dispatchEvent(new CustomEvent('credential-added', {
        detail: { credential: credentialData },
        bubbles: true
      }));
      this.hide();
      this.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Credential saved successfully', type: 'success' },
        bubbles: true
      }));
    } else {
      this.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Failed to save credential: ' + result.error, type: 'error' },
        bubbles: true
      }));
    }
  }

  show() {
    const overlay = this.querySelector('#modal-overlay');
    overlay?.classList.add('show');
    
    // Reset form
    this.querySelector('#provider-select').value = '';
    this.querySelector('#name-input').value = '';
    this.querySelector('#key-input').value = '';
    this.selectedProvider = null;
    this.updateProviderInfo();
    
    // Use setTimeout to ensure DOM is ready for validation
    setTimeout(() => {
      this.updateSaveButton();
    }, 0);
  }

  hide() {
    const overlay = this.querySelector('#modal-overlay');
    overlay?.classList.remove('show');
  }
}

// Confirmation Modal Component
class ConfirmationModal extends HTMLElement {
  constructor() {
    super();
    this.credentialToDelete = null;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <style>
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .modal-overlay.show {
          display: flex;
          opacity: 1;
        }

        .modal {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: var(--shadow-lg);
          transform: scale(0.95);
          transition: transform 0.2s ease;
          border: 1px solid var(--border-color);
        }

        .modal-overlay.show .modal {
          transform: scale(1);
        }

        .modal-title {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .modal-text {
          color: var(--text-secondary);
          margin-bottom: 20px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn {
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: var(--transition);
        }

        .btn-cancel {
          background: var(--bg-secondary);
          color: var(--text-secondary);
        }

        .btn-cancel:hover {
          background: var(--border-color);
        }

        .btn-delete {
          background: var(--error-500);
          color: white;
        }

        .btn-delete:hover {
          background: var(--error-600);
        }
      </style>

      <div class="modal-overlay" id="modal-overlay">
        <div class="modal">
          <h3 class="modal-title">Are you sure?</h3>
          <p class="modal-text">This will permanently delete the credential and cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn btn-cancel" id="cancel-btn">Cancel</button>
            <button class="btn btn-delete" id="confirm-btn">Delete</button>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const overlay = this.querySelector('#modal-overlay');
    const cancelBtn = this.querySelector('#cancel-btn');
    const confirmBtn = this.querySelector('#confirm-btn');

    cancelBtn?.addEventListener('click', () => {
      this.hide();
    });

    confirmBtn?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('modal-confirm', { 
        detail: { credential: this.credentialToDelete },
        bubbles: true 
      }));
      this.hide();
    });

    // Close on backdrop click
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hide();
      }
    });
  }

  show(credential) {
    this.credentialToDelete = credential;
    const overlay = this.querySelector('#modal-overlay');
    overlay?.classList.add('show');
  }

  hide() {
    const overlay = this.querySelector('#modal-overlay');
    overlay?.classList.remove('show');
    this.credentialToDelete = null;
  }
}

// Toast Component
class ToastContainer extends HTMLElement {
  connectedCallback() {
    this.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
  }

  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'var(--success-500)' : 
                   type === 'error' ? 'var(--error-500)' : 
                   'var(--primary-500)';
    
    toast.style.cssText = `
      background: ${bgColor};
      color: white;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 14px;
      box-shadow: var(--shadow-lg);
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      max-width: 300px;
    `;
    toast.textContent = message;
    
    this.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });
    
    // Auto remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }
}

// Main Credential Manager Component
class CredentialManager extends HTMLElement {
  constructor() {
    super();
    this.credentials = [];
    this.filteredCredentials = [];
    this.searchQuery = '';
  }

  async connectedCallback() {
    this.render();
    this.setupEventListeners();
    await this.loadCredentials();
  }

  async loadCredentials() {
    try {
      this.credentials = await CredentialIPC.loadCredentials();
      this.filterCredentials();
      this.refreshCredentialsList();
    } catch (error) {
      console.error('Failed to load credentials:', error);
      this.showToast('Failed to load credentials', 'error');
    }
  }

  filterCredentials() {
    if (!this.searchQuery) {
      this.filteredCredentials = [...this.credentials];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredCredentials = this.credentials.filter(cred =>
        cred.name.toLowerCase().includes(query) ||
        (cred.displayName && cred.displayName.toLowerCase().includes(query)) ||
        cred.type.toLowerCase().includes(query)
      );
    }
  }

  render() {
    this.innerHTML = `
      <style>
        .container {
          width: 100%;
          max-width: none;
          padding: 0;
          margin: 0;
        }

        .search-container {
          margin-bottom: 24px;
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 16px;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-500) 12%, transparent);
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .credentials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px;
          color: var(--text-muted);
          grid-column: 1 / -1;
        }

        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .empty-state-title {
          font-size: 18px;
          font-weight: 500;
          color: var(--text-secondary);
          margin: 0 0 8px 0;
        }

        .empty-state-description {
          font-size: 14px;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.5;
        }
      </style>

      <div class="container">
        <div class="search-container">
          <div class="search-icon">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <input 
            type="text" 
            class="search-input" 
            id="search-input"
            placeholder="Search"
          />
        </div>

        <div class="credentials-grid" id="credentials-grid">
          ${this.renderCredentials()}
        </div>
      </div>

      <add-credential-modal id="add-modal"></add-credential-modal>
      <confirmation-modal id="confirmation-modal"></confirmation-modal>
      <toast-container id="toast-container"></toast-container>
    `;
  }

  renderCredentials() {
    if (this.filteredCredentials.length === 0 && this.credentials.length === 0) {
      return `
        <add-credential-tile></add-credential-tile>
        <div class="empty-state">
          <div class="empty-state-icon">🔐</div>
          <div class="empty-state-title">No credentials yet</div>
          <div class="empty-state-description">Add your first API key to get started</div>
        </div>
      `;
    }

    if (this.filteredCredentials.length === 0 && this.searchQuery) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">No credentials found</div>
          <div class="empty-state-description">Try adjusting your search query</div>
        </div>
      `;
    }

    const tiles = this.filteredCredentials.map(credential => 
      `<credential-tile credential-data='${JSON.stringify(credential)}'></credential-tile>`
    ).join('');

    return `<add-credential-tile></add-credential-tile>${tiles}`;
  }

  setupEventListeners() {
    const searchInput = this.querySelector('#search-input');
    const addModal = this.querySelector('#add-modal');
    const confirmationModal = this.querySelector('#confirmation-modal');

    // Search functionality
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.filterCredentials();
      this.refreshCredentialsList();
    });

    // Add credential
    this.addEventListener('add-credential', () => {
      addModal?.show();
    });

    // Credential added
    this.addEventListener('credential-added', () => {
      this.loadCredentials();
    });

    // Credential deletion
    this.addEventListener('credential-delete', (e) => {
      confirmationModal?.show(e.detail.credential);
    });

    // Credential detail view (placeholder for future implementation)
    this.addEventListener('credential-detail', (e) => {
      console.log('Open detail view for:', e.detail.credential);
      // TODO: Implement credential detail window
    });

    // Modal confirmation
    confirmationModal?.addEventListener('modal-confirm', async (e) => {
      const result = await CredentialIPC.deleteCredential(e.detail.credential.id);
      if (result.success) {
        this.loadCredentials();
        this.showToast('Credential deleted successfully', 'success');
      } else {
        this.showToast('Failed to delete credential: ' + result.error, 'error');
      }
    });

    // Toast messages
    this.addEventListener('show-toast', (e) => {
      this.showToast(e.detail.message, e.detail.type);
    });
  }

  refreshCredentialsList() {
    const container = this.querySelector('#credentials-grid');
    if (container) {
      container.innerHTML = this.renderCredentials();
    }
  }

  showToast(message, type = 'info') {
    const toastContainer = this.querySelector('#toast-container');
    toastContainer?.showToast(message, type);
  }
}

// Register components
customElements.define('credential-tile', CredentialTile);
customElements.define('add-credential-tile', AddCredentialTile);
customElements.define('add-credential-modal', AddCredentialModal);
customElements.define('confirmation-modal', ConfirmationModal);
customElements.define('toast-container', ToastContainer);
customElements.define('credential-manager', CredentialManager);
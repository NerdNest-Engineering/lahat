// Custom Credential Manager Web Components
// Redesigned with grid-based tile layout

// Provider configurations
const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    description: 'API key',
    type: 'api-key',
    bgColor: '#1a1a1a',
    textColor: '#ffffff',
    placeholder: 'sk-...',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
    </svg>`
  },
  anthropic: {
    name: 'Anthropic',
    description: 'API key',
    type: 'api-key',
    bgColor: '#1a1a1a',
    textColor: '#ffffff',
    placeholder: 'sk-ant-api03-...',
    icon: `<span style="font-weight: bold; font-size: 18px; color: currentColor;">A</span>`
  },
  aws: {
    name: 'AWS',
    description: 'API key',
    type: 'api-key',
    bgColor: '#ff9900',
    textColor: '#ffffff',
    placeholder: 'AKIA...',
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.192 0 .088-.064.176-.192.264l-.632.423c-.088.063-.176.095-.256.095-.104 0-.207-.048-.312-.151a3.254 3.254 0 01-.368-.447 8.53 8.53 0 01-.32-.543c-.8.944-1.8 1.416-3.008 1.416-1.216 0-2.176-.351-2.88-1.047-.703-.696-1.056-1.624-1.056-2.784 0-1.232.432-2.232 1.296-2.992.864-.76 2.016-1.144 3.456-1.144.48 0 .976.04 1.504.127.528.088 1.072.207 1.632.368v-1.24c0-1.28-.272-2.184-.8-2.696-.536-.512-1.44-.768-2.72-.768-.584 0-1.184.072-1.8.207a12.533 12.533 0 00-1.752.528c-.256.104-.448.176-.568.207-.12.032-.207.048-.272.048-.152 0-.224-.111-.224-.335v-.527c0-.176.024-.304.08-.384.056-.08.151-.16.295-.231a7.62 7.62 0 011.824-.735c.696-.176 1.448-.264 2.256-.264 1.728 0 2.993.392 3.808 1.184.808.792 1.216 1.992 1.216 3.6v4.744zm-4.16 1.568c.464 0 .944-.087 1.448-.255.504-.168.952-.463 1.328-.888.224-.255.384-.535.48-.848.096-.312.152-.688.152-1.128v-.543a11.81 11.81 0 00-1.296-.312 10.175 10.175 0 00-1.352-.088c-.96 0-1.664.192-2.112.568-.448.384-.672.912-.672 1.591 0 .64.16 1.128.488 1.463.32.335.8.504 1.432.504h.104zm7.736.975c-.192 0-.32-.032-.4-.104-.08-.064-.144-.2-.2-.4l-2.232-7.336c-.056-.191-.088-.32-.088-.375 0-.152.072-.231.224-.231h.912c.2 0 .336.032.4.104.08.064.136.2.184.4l1.592 6.295 1.48-6.295c.04-.2.104-.336.184-.4.08-.072.216-.104.416-.104h.744c.2 0 .336.032.416.104.08.064.144.2.184.4l1.496 6.375 1.64-6.375c.048-.2.112-.336.184-.4.08-.072.208-.104.4-.104h.864c.152 0 .232.08.232.231 0 .048-.008.096-.024.151-.016.056-.04.135-.08.24L14.24 12.4c-.056.2-.12.336-.2.4-.08.072-.216.104-.4.104h-.8c-.2 0-.336-.032-.416-.104-.08-.064-.144-.2-.184-.4l-1.472-6.151-1.456 6.151c-.04.2-.104.336-.184.4-.08.072-.216.104-.416.104h-.8z"/>
    </svg>`
  },
  custom: {
    name: 'Custom',
    description: 'API key',
    type: 'api-key',
    bgColor: '#6366f1',
    textColor: '#ffffff',
    placeholder: 'Enter your API key...',
    icon: `<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
    </svg>`
  }
};

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
          min-height: 140px;
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
          <div class="provider-name">${this.escapeHtml(this.credential.name)}</div>
          <div class="credential-type">${provider.description}</div>
          ${this.credential.lastUsed ? `
            <div class="last-used">Last used: ${this.formatDate(this.credential.lastUsed)}</div>
          ` : ''}
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
          min-height: 140px;
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
      this.updateSaveButton();
      
      // Auto-fill name if empty
      if (this.selectedProvider && !nameInput.value) {
        nameInput.value = PROVIDERS[this.selectedProvider].name;
      }
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
    
    const hasProvider = !!this.selectedProvider;
    const hasName = !!nameInput?.value.trim();
    const hasKey = !!keyInput?.value.trim();
    
    saveBtn.disabled = !(hasProvider && hasName && hasKey);
  }

  async saveCredential() {
    const nameInput = this.querySelector('#name-input');
    const keyInput = this.querySelector('#key-input');
    
    const credentialData = {
      id: 'cred_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: nameInput.value.trim(),
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
    this.updateSaveButton();
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
// AppCreationStepThree Component - Logo Generation
class AppCreationStepThree extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary-color: #4285f4;
          --primary-hover: #3367d6;
          --success-color: #34a853;
          --error-color: #ea4335;
          --warning-color: #ffc107;
          --warning-bg: #fff8e1;
          --warning-text: #856404;
          --border-color: #e0e0e0;
          --text-secondary: #5f6368;
          --text-muted: #999;
          --background-light: #f8f9fa;
          --background-preview: #f0f0f0;
          --border-radius: 8px;
          --spacing-xs: 5px;
          --spacing-sm: 10px;
          --spacing-md: 15px;
          --spacing-lg: 20px;
          
          display: none;
          padding: var(--spacing-lg) 0;
        }
        
        :host(.active) {
          display: block;
        }
        
        :host(.hidden) {
          display: none;
        }
        
        h2 {
          font-size: var(--spacing-lg);
          margin-bottom: var(--spacing-md);
        }
        
        .app-summary {
          background: var(--background-light);
          padding: var(--spacing-md);
          border-radius: var(--border-radius);
          margin-bottom: var(--spacing-lg);
        }
        
        .app-title {
          font-size: 18px;
          font-weight: bold;
          color: var(--primary-color);
          margin-bottom: var(--spacing-xs);
        }
        
        .app-description {
          color: var(--text-secondary);
          font-size: 14px;
        }
        
        .logo-section {
          background: white;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
          text-align: center;
        }
        
        .logo-preview {
          width: 120px;
          height: 120px;
          border-radius: 18px;
          margin: 0 auto var(--spacing-md);
          background: var(--background-preview);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px dashed #ccc;
          position: relative;
          overflow: hidden;
        }
        
        .logo-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 16px;
        }
        
        .logo-placeholder {
          color: var(--text-muted);
          font-size: 14px;
          text-align: center;
        }
        
        .logo-status {
          margin: var(--spacing-md) 0;
          font-size: 14px;
        }
        
        .logo-status.generating {
          color: var(--primary-color);
        }
        
        .logo-status.success {
          color: var(--success-color);
        }
        
        .logo-status.error {
          color: var(--error-color);
        }
        
        .logo-actions {
          display: flex;
          gap: var(--spacing-sm);
          justify-content: center;
          margin: var(--spacing-md) 0;
        }
        
        .logo-actions button {
          padding: 8px 16px;
          border: 1px solid var(--border-color);
          background: white;
          border-radius: var(--border-radius);
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        
        .logo-actions button:hover {
          background: var(--background-light);
        }
        
        .logo-actions button.primary {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }
        
        .logo-actions button.primary:hover {
          background: var(--primary-hover);
        }
        
        .logo-actions button.secondary {
          background: #6c757d;
          color: white;
          border-color: #6c757d;
        }
        
        .logo-actions button.secondary:hover {
          background: #5a6268;
        }
        
        .button-container {
          display: flex;
          justify-content: space-between;
          margin-top: var(--spacing-lg);
        }
        
        .button-container.hidden {
          display: none;
        }
        
        button {
          background: var(--primary-color);
          color: white;
          padding: var(--spacing-sm) var(--spacing-lg);
          border: none;
          border-radius: var(--border-radius);
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: background 0.2s ease;
        }
        
        button:hover {
          background: var(--primary-hover);
        }
        
        button.secondary {
          background: var(--background-light);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }
        
        button.secondary:hover {
          background: #e8eaed;
        }
        
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 3px solid rgba(66, 133, 244, 0.3);
          border-radius: 50%;
          border-top-color: var(--primary-color);
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        .openai-warning {
          background: var(--warning-bg);
          border: 1px solid var(--warning-color);
          border-radius: var(--border-radius);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
          color: var(--warning-text);
        }
        
        .openai-warning h4 {
          margin: 0 0 var(--spacing-sm) 0;
          color: var(--warning-text);
        }
      </style>
      <div>
        <h2>Generate App Logo</h2>
        
        <div class="app-summary">
          <div class="app-title" id="app-title"></div>
          <div class="app-description" id="app-description"></div>
        </div>
        
        <div class="openai-warning" id="openai-warning" style="display: none;">
          <h4>⚠️ OpenAI API Key Not Found</h4>
          <p>Logo generation requires an OpenAI API key. Don't worry - you can <strong>skip this step</strong> and generate your app without a logo, or set up your OpenAI API key to enable logo generation.</p>
        </div>
        
        <div class="logo-section">
          <div class="logo-preview" id="logo-preview">
            <div class="logo-placeholder">
              <div>🎨</div>
              <div>Logo will appear here</div>
            </div>
          </div>
          
          <div class="logo-status" id="logo-status">Ready to generate logo</div>
          
          <div class="logo-actions" id="logo-actions">
            <button id="generate-logo-btn" class="primary">Generate Logo</button>
          </div>
        </div>
        
        <div class="button-container">
          <button id="back-button" class="secondary">Back</button>
          <button id="skip-step-button" class="secondary" style="display: none;">Skip This Step</button>
          <button id="next-button">Next</button>
        </div>
      </div>
    `;
    
    // Set up event listeners
    this.shadowRoot.querySelector('#generate-logo-btn').addEventListener('click', this.handleGenerateLogo.bind(this));
    this.shadowRoot.querySelector('#back-button').addEventListener('click', this.handleBack.bind(this));
    this.shadowRoot.querySelector('#skip-step-button').addEventListener('click', this.handleSkipStep.bind(this));
    this.shadowRoot.querySelector('#next-button').addEventListener('click', this.handleNext.bind(this));
    
    // Initialize state
    this._appTitle = '';
    this._appDescription = '';
    this._logoGenerated = false;
    this._logoPath = null;
    this._appFolderPath = null;
  }
  
  // Getters
  get appTitle() {
    return this.shadowRoot.querySelector('#app-title');
  }
  
  get appDescription() {
    return this.shadowRoot.querySelector('#app-description');
  }
  
  get logoPreview() {
    return this.shadowRoot.querySelector('#logo-preview');
  }
  
  get logoStatus() {
    return this.shadowRoot.querySelector('#logo-status');
  }
  
  get logoActions() {
    return this.shadowRoot.querySelector('#logo-actions');
  }
  
  get openaiWarning() {
    return this.shadowRoot.querySelector('#openai-warning');
  }
  
  // Event handlers
  async handleGenerateLogo() {
    this.setLogoGenerating();
    
    try {
      // Get the folder path from the parent controller
      const folderPath = this._appFolderPath || await this.getAppFolderPath();
      
      const result = await window.electronAPI.generateLogo({
        appName: this._appTitle,
        appDescription: this._appDescription,
        appFolderPath: folderPath
      });
      
      if (result.success) {
        this.setLogoSuccess(result.logo);
        this._logoGenerated = true;
        this._logoPath = result.logo.filePath;
      } else {
        this.setLogoError(result.error);
      }
    } catch (error) {
      this.setLogoError(error.message);
    }
  }
  
  async getAppFolderPath() {
    // Try to get the folder path from the parent controller
    const controller = this.closest('app-creation-controller');
    if (controller && controller.appData && controller.appData.folderPath) {
      return controller.appData.folderPath;
    }
    
    // Fallback: create a temporary folder if needed
    try {
      const result = await window.electronAPI.createAppFolder({
        appName: this._appTitle
      });
      if (result.success) {
        return result.folderPath;
      }
    } catch (error) {
      console.error('Failed to create app folder:', error);
    }
    
    return null;
  }
  
  async handleBack() {
    this.dispatchEvent(new CustomEvent('step-three-back', {
      bubbles: true,
      composed: true
    }));
  }
  
  async handleSkipStep() {
    // Skip logo generation and move to next step
    this.setLogoSkipped();
    this.handleNext();
  }

  async handleNext() {
    // Hide the button container
    this.shadowRoot.querySelector('.button-container').classList.add('hidden');
    
    // Dispatch event to notify parent to move to step 4
    this.dispatchEvent(new CustomEvent('step-three-next', {
      bubbles: true,
      composed: true,
      detail: { 
        logoGenerated: this._logoGenerated,
        logoPath: this._logoPath
      }
    }));
  }
  
  // Public methods
  setActive(active) {
    if (active) {
      this.classList.add('active');
      this.classList.remove('hidden');
    } else {
      this.classList.remove('active');
      this.classList.add('hidden');
    }
  }
  
  setAppInfo(title, description, folderPath = null) {
    this._appTitle = title;
    this._appDescription = description;
    this._appFolderPath = folderPath;
    this.appTitle.textContent = title;
    this.appDescription.textContent = description;
  }
  
  async checkOpenAIAvailability() {
    try {
      const result = await window.electronAPI.checkOpenAIApiKey();
      if (!result.hasOpenAIKey) {
        this.openaiWarning.style.display = 'block';
        this.logoActions.innerHTML = `
          <button onclick="window.electronAPI.openWindow('credential-manager')" class="primary">Setup OpenAI API</button>
          <button id="skip-logo-btn">Skip Logo</button>
        `;
        this.shadowRoot.querySelector('#skip-logo-btn').addEventListener('click', () => {
          this.setLogoSkipped();
        });
      }
    } catch (error) {
      console.warn('Could not check OpenAI availability:', error);
    }
  }
  
  setLogoGenerating() {
    this.logoStatus.textContent = 'Generating logo...';
    this.logoStatus.className = 'logo-status generating';
    this.logoActions.innerHTML = `
      <div class="spinner"></div>
      <span style="margin-left: 10px;">Generating...</span>
    `;
  }
  
  setLogoSuccess(logoInfo) {
    this.logoStatus.textContent = 'Logo generated successfully!';
    this.logoStatus.className = 'logo-status success';
    
    // Show the logo
    this.logoPreview.innerHTML = `<img src="${logoInfo.absolutePath}" alt="Generated logo" />`;
    
    this.logoActions.innerHTML = `
      <button id="regenerate-logo-btn" class="secondary">Regenerate</button>
    `;
    
    this.shadowRoot.querySelector('#regenerate-logo-btn').addEventListener('click', this.handleGenerateLogo.bind(this));
  }
  
  setLogoError(error) {
    this.logoStatus.textContent = `Error: ${error}`;
    this.logoStatus.className = 'logo-status error';
    this.logoActions.innerHTML = `
      <button id="retry-logo-btn" class="primary">Retry</button>
      <button id="skip-logo-btn">Skip Logo</button>
    `;
    
    this.shadowRoot.querySelector('#retry-logo-btn').addEventListener('click', this.handleGenerateLogo.bind(this));
    this.shadowRoot.querySelector('#skip-logo-btn').addEventListener('click', () => {
      this.setLogoSkipped();
    });
  }
  
  setLogoSkipped() {
    this.logoStatus.textContent = 'Logo generation skipped';
    this.logoStatus.className = 'logo-status';
    this.logoActions.innerHTML = `
      <button id="generate-logo-btn" class="primary">Generate Logo</button>
    `;
    this.shadowRoot.querySelector('#generate-logo-btn').addEventListener('click', this.handleGenerateLogo.bind(this));
    this._logoGenerated = false;
    this._logoPath = null;
  }
  
  setOpenAIUnavailable() {
    // Show the warning and provide option to skip automatically
    this.openaiWarning.style.display = 'block';
    this.logoActions.innerHTML = `
      <button onclick="window.electronAPI.openWindow('credential-manager')" class="primary">Setup OpenAI API</button>
      <button id="skip-logo-btn">Skip Logo Generation</button>
    `;
    this.shadowRoot.querySelector('#skip-logo-btn').addEventListener('click', () => {
      this.setLogoSkipped();
    });
    
    // Show the skip step button in navigation
    this.shadowRoot.querySelector('#skip-step-button').style.display = 'inline-block';
  }
  
  resetButtonContainer() {
    this.shadowRoot.querySelector('.button-container').classList.remove('hidden');
  }
}

// Register the component
customElements.define('app-creation-step-three', AppCreationStepThree);

export { AppCreationStepThree };

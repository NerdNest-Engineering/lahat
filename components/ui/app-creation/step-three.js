// AppCreationStepThree Component - Logo Generation
class AppCreationStepThree extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
          padding: 20px 0;
        }
        :host(.active) {
          display: block;
        }
        h2 {
          font-size: 20px;
          margin-bottom: 15px;
        }
        .app-summary {
          background: #f8f9fa;
          padding: 15px;
          border-radius: var(--border-radius, 8px);
          margin-bottom: 20px;
        }
        .app-title {
          font-size: 18px;
          font-weight: bold;
          color: #4285f4;
          margin-bottom: 5px;
        }
        .app-description {
          color: #5f6368;
          font-size: 14px;
        }
        .logo-section {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: var(--border-radius, 8px);
          padding: 20px;
          margin-bottom: 20px;
          text-align: center;
        }
        .logo-preview {
          width: 120px;
          height: 120px;
          border-radius: 18px;
          margin: 0 auto 15px;
          background: #f0f0f0;
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
          color: #999;
          font-size: 14px;
          text-align: center;
        }
        .logo-status {
          margin: 15px 0;
          font-size: 14px;
        }
        .logo-status.generating {
          color: #4285f4;
        }
        .logo-status.success {
          color: #34a853;
        }
        .logo-status.error {
          color: #ea4335;
        }
        .logo-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin: 15px 0;
        }
        .logo-actions button {
          padding: 8px 16px;
          border: 1px solid #e0e0e0;
          background: white;
          border-radius: var(--border-radius, 8px);
          cursor: pointer;
          font-size: 14px;
        }
        .logo-actions button:hover {
          background: #f8f9fa;
        }
        .logo-actions button.primary {
          background: #4285f4;
          color: white;
          border-color: #4285f4;
        }
        .logo-actions button.primary:hover {
          background: #3367d6;
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
          margin-top: 20px;
        }
        .button-container.hidden {
          display: none;
        }
        button {
          background: #4285f4;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: var(--border-radius, 8px);
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
        }
        button:hover {
          background: #3367d6;
        }
        button.secondary {
          background: #f8f9fa;
          color: #5f6368;
          border: 1px solid #e0e0e0;
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
          border-top-color: #4285f4;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .openai-warning {
          background: #fff8e1;
          border: 1px solid #ffc107;
          border-radius: var(--border-radius, 8px);
          padding: 15px;
          margin-bottom: 20px;
          color: #856404;
        }
        .openai-warning h4 {
          margin: 0 0 10px 0;
          color: #856404;
        }
      </style>
      <div>
        <h2>Generate App Logo</h2>
        
        <div class="app-summary">
          <div class="app-title" id="app-title"></div>
          <div class="app-description" id="app-description"></div>
        </div>
        
        <div class="openai-warning" id="openai-warning" style="display: none;">
          <h4>⚠️ OpenAI API Key Required</h4>
          <p>Logo generation requires an OpenAI API key. You can skip this step and generate the app without a logo, or set up your OpenAI API key in settings.</p>
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
          <button id="next-button">Next</button>
        </div>
      </div>
    `;
    
    // Set up event listeners
    this.shadowRoot.querySelector('#generate-logo-btn').addEventListener('click', this.handleGenerateLogo.bind(this));
    this.shadowRoot.querySelector('#back-button').addEventListener('click', this.handleBack.bind(this));
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
    } else {
      this.classList.remove('active');
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
          <button onclick="window.electronAPI.openWindow('api-setup')" class="primary">Setup OpenAI API</button>
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
  
  resetButtonContainer() {
    this.shadowRoot.querySelector('.button-container').classList.remove('hidden');
  }
}

// Register the component
customElements.define('app-creation-step-three', AppCreationStepThree);

export { AppCreationStepThree };

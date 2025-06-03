import { debugLog } from '../../components/core/debug.js';

// AppCreationStepTwo Component
class AppCreationStepTwo extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary-color: #4285f4;
          --primary-hover: #3367d6;
          --border-color: #e0e0e0;
          --text-primary: #202124;
          --text-secondary: #5f6368;
          --background-light: #f8f9fa;
          --border-radius: 8px;
          --spacing-sm: 10px;
          --spacing-md: 15px;
          --spacing-lg: 20px;
          margin: 0 5%;
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
        
        .user-input-display {
          background: var(--background-light);
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--border-radius);
          margin-bottom: var(--spacing-lg);
          font-style: italic;
        }
        
        .preview-section {
          background: white;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
          min-height: 150px;
        }
        
        .preview-section.hidden {
          display: none;
        }
        
        .editable-title {
          margin: var(--spacing-sm) 0;
        }
        
        .editable-title input {
          font-size: 24px;
          font-weight: bold;
          color: var(--primary-color);
          width: 100%;
          border: 1px solid rgba(0, 0, 0, 0.1);
          padding: var(--spacing-sm);
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        }
        
        .editable-title input:hover,
        .editable-title input:focus {
          border-color: var(--primary-color);
          outline: none;
        }
        
        .editable-description {
          margin: var(--spacing-sm) 0;
        }
        
        .editable-description textarea {
          width: 100%;
          border: 1px solid rgba(0, 0, 0, 0.1);
          padding: var(--spacing-sm);
          font-size: 16px;
          line-height: 1.5;
          resize: vertical;
          color: var(--text-secondary);
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          font-family: inherit;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        }
        
        .editable-description textarea:hover,
        .editable-description textarea:focus {
          border-color: var(--primary-color);
          outline: none;
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
        
        .back-button {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }
        
        .back-button:hover {
          background: var(--background-light);
          color: var(--text-primary);
        }
        
        .credential-warning {
          background: #fff8e1;
          border: 1px solid #ffc107;
          border-radius: var(--border-radius);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
          display: none;
        }
        
        .credential-warning h4 {
          margin: 0 0 var(--spacing-sm) 0;
          color: #856404;
        }
        
        .credential-warning p {
          margin: 0 0 var(--spacing-md) 0;
          color: #856404;
        }
        
        .credential-warning .credential-actions {
          display: flex;
          gap: var(--spacing-sm);
        }
        
        .credential-warning button {
          padding: 8px 16px;
          font-size: 14px;
        }
        
      </style>
      <div>
        <h2>What would you like?</h2>
        <div class="user-input-display">
          <span id="user-input-display"></span>
        </div>
        
        <div class="credential-warning" id="credential-warning" style="display: none;">
          <h4>⚠️ API Keys Required</h4>
          <p>App generation requires a Claude API key. You'll also need an OpenAI API key for logo generation in the next step. Please set up both credentials in the credential manager to continue.</p>
          <div class="credential-actions">
            <button id="setup-claude-btn" class="primary">Setup API Keys</button>
            <button id="retry-generation-btn">Retry</button>
          </div>
        </div>
        
        <div class="preview-section hidden">
          <div class="editable-title">
            <input type="text" id="generated-title" placeholder="App Title" />
          </div>
          <div class="editable-description">
            <textarea id="generated-description" rows="6" placeholder="App Description"></textarea>
          </div>
        </div>
        <div class="button-container">
          <button id="back-button" class="back-button">Back</button>
          <button id="next-button">Next</button>
        </div>
      </div>
    `;
    
    // Set up event listeners
    this.shadowRoot.querySelector('#next-button').addEventListener('click', this.handleNextClick.bind(this));
    this.shadowRoot.querySelector('#back-button').addEventListener('click', this.handleBackClick.bind(this));
    this.shadowRoot.querySelector('#retry-generation-btn').addEventListener('click', this.handleRetryGeneration.bind(this));
    this.shadowRoot.querySelector('#setup-claude-btn').addEventListener('click', this.handleSetupClaude.bind(this));
    
    // Set up input event listeners
    this.shadowRoot.querySelector('#generated-title').addEventListener('input', (e) => {
      this._currentTitle = e.target.value;
    });
    
    this.shadowRoot.querySelector('#generated-description').addEventListener('input', (e) => {
      this._currentDescription = e.target.value;
    });
    
    // Initialize state
    this._currentTitle = '';
    this._currentDescription = '';
  }
  
  // Getters and setters
  get userInputDisplay() {
    return this.shadowRoot.querySelector('#user-input-display');
  }
  
  get previewSection() {
    return this.shadowRoot.querySelector('.preview-section');
  }
  
  get generatedTitle() {
    return this.shadowRoot.querySelector('#generated-title');
  }
  
  get generatedDescription() {
    return this.shadowRoot.querySelector('#generated-description');
  }
  
  get currentTitle() {
    return this._currentTitle;
  }
  
  get currentDescription() {
    return this._currentDescription;
  }
  
  // Event handlers
  async handleNextClick() {
    if (!this._currentTitle || !this._currentDescription) {
      // Use global showError function
      if (window.showError) {
        window.showError('Missing Information', 'Please ensure both title and description are filled.');
      }
      return;
    }
    
    // Hide the button container
    this.shadowRoot.querySelector('.button-container').classList.add('hidden');
    
    // Dispatch event to notify parent to move to logo generation step
    this.dispatchEvent(new CustomEvent('step-two-next', {
      bubbles: true,
      composed: true,
      detail: { 
        title: this._currentTitle,
        description: this._currentDescription
      }
    }));
  }
  
  async handleBackClick() {
    // Dispatch event to notify parent to go back to step one
    this.dispatchEvent(new CustomEvent('step-two-back', {
      bubbles: true,
      composed: true
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
  
  setUserInput(input) {
    this.userInputDisplay.textContent = input;
  }
  
  showPreview() {
    this.previewSection.classList.remove('hidden');
  }
  
  hidePreview() {
    this.previewSection.classList.add('hidden');
  }
  
  
  resetButtonContainer() {
    this.shadowRoot.querySelector('.button-container').classList.remove('hidden');
    this.generatedTitle.readOnly = false;
    this.generatedDescription.readOnly = false;
  }
  
  updateTitleIfPresent(title) {
    debugLog('📝 step-two: updateTitleIfPresent called with:', title);
    if (!title) return;
    
    // Update only the input field
    this.generatedTitle.value = title;
    this._currentTitle = title;
    debugLog('📝 step-two: Title updated');
  }
  
  updateDescriptionIfPresent(description) {
    debugLog('📝 step-two: updateDescriptionIfPresent called with:', description);
    if (!description) return;
    
    // Update only the textarea
    this.generatedDescription.value = description;
    this._currentDescription = description;
    debugLog('📝 step-two: Description updated');
  }
  
  handleCompletedChunk(chunk) {
    debugLog('📝 step-two: handleCompletedChunk called with:', chunk);
    // Store the final values
    this._currentTitle = chunk.title || this.generatedTitle.value;
    this._currentDescription = chunk.description || this.generatedDescription.value;
    
    // Update the editable fields with final values
    this.generatedTitle.value = this._currentTitle;
    this.generatedDescription.value = this._currentDescription;
    
    // Restore the button container and make fields editable again
    this.resetButtonContainer();
    debugLog('📝 step-two: Completed chunk handled, UI restored');
  }
  
  handleInProgressChunk(chunk) {
    debugLog('📝 step-two: handleInProgressChunk called with:', chunk);
    // Use setTimeout with zero delay to push DOM updates to the end of the event queue
    setTimeout(() => {
      this.updateTitleIfPresent(chunk.title);
      this.updateDescriptionIfPresent(chunk.description);
      this.showPreview();
      
      // Force a document reflow to ensure updates are visible
      document.body.offsetHeight;
    }, 0);
  }
  
  setGeneratingState() {
    // Hide the button container during generation
    this.shadowRoot.querySelector('.button-container').classList.add('hidden');
    // Make the input fields read-only during generation
    this.generatedTitle.readOnly = true;
    this.generatedDescription.readOnly = true;
  }
  
  showCredentialMissingUI() {
    debugLog('📝 step-two: showCredentialMissingUI() called');
    
    // Hide preview section
    this.previewSection.classList.add('hidden');
    
    // Show credential warning
    this.shadowRoot.querySelector('#credential-warning').style.display = 'block';
    
    // Show button container (so user can go back if needed)
    this.shadowRoot.querySelector('.button-container').classList.remove('hidden');
    
    debugLog('📝 step-two: Credential missing UI shown');
  }
  
  hideCredentialMissingUI() {
    // Hide credential warning
    this.shadowRoot.querySelector('#credential-warning').style.display = 'none';
    
    // Don't automatically show preview section here - let the generation process show it
    // The preview section will be shown by showPreview() when generation actually starts
    
    debugLog('📝 step-two: Credential missing UI hidden');
  }
  
  async handleRetryGeneration() {
    debugLog('📝 step-two: Retry button clicked');
    
    // Hide credential warning
    this.hideCredentialMissingUI();
    
    // Notify parent to retry credential check and generation
    const controller = this.closest('app-creation-controller');
    if (controller) {
      debugLog('📝 step-two: Calling controller.checkClaudeCredentialsAndGenerate()');
      await controller.checkClaudeCredentialsAndGenerate();
    }
  }
  
  async handleSetupClaude() {
    try {
      await window.electronAPI.openWindow('credential-manager');
    } catch (error) {
      console.error('Failed to open credential manager:', error);
      if (window.showError) {
        window.showError('Window Error', 'Failed to open credential manager window.');
      }
    }
  }
}

// Register the component
customElements.define('app-creation-step-two', AppCreationStepTwo);

export { AppCreationStepTwo };

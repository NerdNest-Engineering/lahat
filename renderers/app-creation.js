// Web Components Implementation for App Creation

// ErrorContainer Component
class ErrorContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 400px;
        }
      </style>
      <slot></slot>
    `;
  }
  
  // Public method to add an error
  addError(title, message, level = 'error') {
    const errorElement = document.createElement('error-message');
    errorElement.setAttribute('title', title);
    errorElement.setAttribute('message', message);
    errorElement.setAttribute('level', level);
    this.appendChild(errorElement);
    return errorElement;
  }
}

// ErrorMessage Component
class ErrorMessage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 10px;
        }
        .error-message {
          background-color: #ffebee;
          border-left: 4px solid #f44336;
          padding: 10px 15px;
          border-radius: var(--border-radius, 8px);
          position: relative;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .error-message.warning {
          background-color: #fff8e1;
          border-left-color: #ffc107;
        }
        .error-message.info {
          background-color: #e3f2fd;
          border-left-color: #2196f3;
        }
        .error-title {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .error-content {
          color: #5f6368;
        }
        .error-close {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #5f6368;
          padding: 0;
          line-height: 1;
        }
      </style>
      <div class="error-message">
        <div class="error-title"></div>
        <div class="error-content"></div>
        <button class="error-close">&times;</button>
      </div>
    `;
    
    // Set up event listeners
    this.shadowRoot.querySelector('.error-close').addEventListener('click', () => {
      this.remove();
    });
  }
  
  // Lifecycle callbacks
  connectedCallback() {
    // Auto-dismiss non-fatal errors
    if (this.getAttribute('level') !== 'fatal') {
      setTimeout(() => {
        if (this.isConnected) {
          this.remove();
        }
      }, 5000);
    }
  }
  
  // Observed attributes for reactive updates
  static get observedAttributes() {
    return ['title', 'message', 'level'];
  }
  
  // Attribute changed callback
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'title') {
      this.shadowRoot.querySelector('.error-title').textContent = newValue;
    } else if (name === 'message') {
      this.shadowRoot.querySelector('.error-content').textContent = newValue;
    } else if (name === 'level') {
      const errorElement = this.shadowRoot.querySelector('.error-message');
      errorElement.className = `error-message ${newValue}`;
    }
  }
}

// AppCreationStepOne Component
class AppCreationStepOne extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 20px 0;
        }
        :host(.hidden) {
          display: none;
        }
        h2 {
          font-size: 20px;
          margin-bottom: 15px;
        }
        .input-group {
          margin-bottom: 20px;
        }
        input {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          border-radius: var(--border-radius, 8px);
          border: 1px solid #e0e0e0;
          box-sizing: border-box;
        }
        .button-container {
          display: flex;
          justify-content: flex-end;
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
      </style>
      <div>
        <h2>What would you like?</h2>
        <div class="input-group">
          <input type="text" id="user-input" placeholder="I want tetris" />
        </div>
        <div class="button-container">
          <button id="next-button">Next</button>
        </div>
      </div>
    `;
    
    // Set up event listeners
    this.shadowRoot.querySelector('#next-button').addEventListener('click', this.handleNextClick.bind(this));
  }
  
  // Getters
  get userInput() {
    return this.shadowRoot.querySelector('#user-input').value.trim();
  }
  
  // Event handlers
  async handleNextClick() {
    if (!this.userInput) {
      // Show error using the error container
      const errorContainer = document.querySelector('error-container') || 
        (() => {
          const container = document.createElement('error-container');
          document.body.appendChild(container);
          return container;
        })();
      
      errorContainer.addError('Input Required', 'Please enter what you would like to create.');
      return;
    }
    
    // Hide the button container
    this.shadowRoot.querySelector('.button-container').classList.add('hidden');
    
    // Dispatch event to notify parent
    this.dispatchEvent(new CustomEvent('step-one-next', {
      bubbles: true,
      composed: true,
      detail: { input: this.userInput }
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
  
  resetButtonContainer() {
    this.shadowRoot.querySelector('.button-container').classList.remove('hidden');
  }
}

// AppCreationStepTwo Component
class AppCreationStepTwo extends HTMLElement {
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
        .user-input-display {
          background: #f8f9fa;
          padding: 10px 15px;
          border-radius: var(--border-radius, 8px);
          margin-bottom: 20px;
          font-style: italic;
        }
        .preview-section {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: var(--border-radius, 8px);
          padding: 20px;
          margin-bottom: 20px;
          min-height: 150px;
        }
        .preview-section.hidden {
          display: none;
        }
        .preview-section h3 {
          margin-top: 0;
          color: #5f6368;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .editable-title {
          margin: 10px 0;
        }
        .editable-title input {
          font-size: 24px;
          font-weight: bold;
          color: #4285f4;
          width: 100%;
          border: 1px solid transparent;
          padding: 5px;
          background: transparent;
          border-radius: var(--border-radius, 8px);
          box-sizing: border-box;
        }
        .editable-title input:hover,
        .editable-title input:focus {
          border-color: #e0e0e0;
          background: white;
          outline: none;
        }
        .editable-description {
          margin: 10px 0;
        }
        .editable-description textarea {
          width: 100%;
          border: 1px solid transparent;
          padding: 5px;
          font-size: 16px;
          line-height: 1.5;
          resize: vertical;
          background: transparent;
          color: #5f6368;
          border-radius: var(--border-radius, 8px);
          font-family: inherit;
          box-sizing: border-box;
        }
        .editable-description textarea:hover,
        .editable-description textarea:focus {
          border-color: #e0e0e0;
          background: white;
          outline: none;
        }
        .button-container {
          display: flex;
          justify-content: flex-end;
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
      </style>
      <div>
        <h2>What would you like?</h2>
        <div class="user-input-display">
          <span id="user-input-display"></span>
        </div>
        <div class="preview-section hidden">
          <h3>We will build...</h3>
          <div class="editable-title">
            <input type="text" id="generated-title" placeholder="App Title" />
          </div>
          <div class="editable-description">
            <textarea id="generated-description" rows="6" placeholder="App Description"></textarea>
          </div>
          <div id="streaming-container" style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
            <div id="streaming-title" style="font-weight: bold; font-size: 24px; color: #4285f4; margin-bottom: 10px; padding: 10px; background-color: rgba(240, 240, 240, 0.5); border-radius: 4px; border: 1px solid rgba(0, 0, 0, 0.1); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); min-height: 30px; display: none;"></div>
            <div id="streaming-description" style="font-size: 16px; line-height: 1.5; padding: 10px; background-color: rgba(240, 240, 240, 0.5); border-radius: 4px; border: 1px solid rgba(0, 0, 0, 0.1); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); min-height: 60px; display: none;"></div>
          </div>
        </div>
        <div class="button-container">
          <button id="generate-button">Generate</button>
        </div>
      </div>
    `;
    
    // Set up event listeners
    this.shadowRoot.querySelector('#generate-button').addEventListener('click', this.handleGenerateClick.bind(this));
    
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
  
  get previewHeader() {
    return this.shadowRoot.querySelector('.preview-section h3');
  }
  
  get generatedTitle() {
    return this.shadowRoot.querySelector('#generated-title');
  }
  
  get generatedDescription() {
    return this.shadowRoot.querySelector('#generated-description');
  }
  
  get streamingTitle() {
    return this.shadowRoot.querySelector('#streaming-title');
  }
  
  get streamingDescription() {
    return this.shadowRoot.querySelector('#streaming-description');
  }
  
  get currentTitle() {
    return this._currentTitle;
  }
  
  get currentDescription() {
    return this._currentDescription;
  }
  
  // Event handlers
  async handleGenerateClick() {
    // Hide the button container
    this.shadowRoot.querySelector('.button-container').classList.add('hidden');
    
    // Change preview section to "generating" state
    this.previewHeader.innerHTML = 'We are building... <div class="spinner"></div>';
    
    // Make title and description read-only
    this.generatedTitle.readOnly = true;
    this.generatedDescription.readOnly = true;
    
    // Dispatch event to notify parent
    this.dispatchEvent(new CustomEvent('generate-app', {
      bubbles: true,
      composed: true,
      detail: { 
        title: this._currentTitle,
        description: this._currentDescription
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
  
  setUserInput(input) {
    this.userInputDisplay.textContent = input;
  }
  
  showPreview() {
    this.previewSection.classList.remove('hidden');
  }
  
  hidePreview() {
    this.previewSection.classList.add('hidden');
  }
  
  setPreviewHeader(text) {
    this.previewHeader.textContent = text;
  }
  
  setGeneratingState() {
    this.previewHeader.innerHTML = 'We are building... <div class="spinner"></div>';
  }
  
  resetButtonContainer() {
    this.shadowRoot.querySelector('.button-container').classList.remove('hidden');
    this.generatedTitle.readOnly = false;
    this.generatedDescription.readOnly = false;
    this.previewHeader.textContent = 'We will build...';
  }
  
  updateTitleIfPresent(title) {
    if (!title) return;
    
    // Update both the input field and streaming container
    this.generatedTitle.value = title;
    this._currentTitle = title;
    this.streamingTitle.textContent = title;
    
    // Make sure the streaming container is visible
    this.streamingTitle.style.display = 'block';
  }
  
  updateDescriptionIfPresent(description) {
    if (!description) return;
    
    // Update both the textarea and streaming container
    this.generatedDescription.value = description;
    this._currentDescription = description;
    this.streamingDescription.textContent = description;
    
    // Make sure the streaming container is visible
    this.streamingDescription.style.display = 'block';
  }
  
  handleCompletedChunk(chunk) {
    // Store the final values
    this._currentTitle = chunk.title || this.generatedTitle.value;
    this._currentDescription = chunk.description || this.generatedDescription.value;
    
    // Hide our streaming containers
    this.streamingTitle.style.display = 'none';
    this.streamingDescription.style.display = 'none';
  }
  
  handleInProgressChunk(chunk) {
    // Use setTimeout with zero delay to push DOM updates to the end of the event queue
    setTimeout(() => {
      this.updateTitleIfPresent(chunk.title);
      this.updateDescriptionIfPresent(chunk.description);
      this.showPreview();
      
      // Update preview header if needed
      if (this.previewHeader.innerHTML.includes('We are building') && (chunk.title || chunk.description)) {
        this.previewHeader.textContent = 'We will build...';
      }
      
      // Force a document reflow to ensure updates are visible
      document.body.offsetHeight;
    }, 0);
  }
}

// GenerationStatus Component
class GenerationStatus extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none !important;
        }
        :host(.visible) {
          display: flex !important;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          margin-bottom: 10px;
          padding: 10px 0;
        }
        .spinner {
          width: 20px;
          height: 20px;
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
      </style>
      <div class="spinner"></div>
      <span id="status-text">Generating...</span>
    `;
  }
  
  // Getters
  get statusText() {
    return this.shadowRoot.querySelector('#status-text');
  }
  
  // Public methods
  show(text) {
    this.statusText.textContent = text || 'Generating...';
    this.classList.add('visible');
  }
  
  hide() {
    this.classList.remove('visible');
  }
  
  setStatusText(text) {
    this.statusText.textContent = text;
  }
}

// GenerationPreview Component
class GenerationPreview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none !important;
          margin-top: 20px;
        }
        :host(.visible) {
          display: block !important;
        }
        h3 {
          margin-top: 0;
          color: #5f6368;
          font-size: 16px;
        }
        pre {
          margin: 0;
          white-space: pre-wrap;
          font-family: monospace;
          font-size: 14px;
          overflow-y: auto;
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: var(--border-radius, 8px);
          padding: 15px;
          max-height: 300px;
        }
      </style>
      <h3>Generation Preview</h3>
      <pre id="output"></pre>
    `;
    
    // Initialize state
    this._chunks = '';
  }
  
  // Getters
  get output() {
    return this.shadowRoot.querySelector('#output');
  }
  
  // Public methods
  show() {
    this.classList.add('visible');
  }
  
  hide() {
    this.classList.remove('visible');
  }
  
  reset() {
    this._chunks = '';
    this.output.textContent = '';
  }
  
  addChunk(content) {
    this._chunks += content;
    this.output.textContent = this._chunks;
    
    // Auto-scroll to bottom
    this.output.scrollTop = this.output.scrollHeight;
  }
  
  handleGenerationProgress(content) {
    this.addChunk(content);
  }
  
  handleGenerationComplete() {
    // Reset chunks when generation is complete
    this._chunks = '';
  }
}

// Register custom elements
customElements.define('error-container', ErrorContainer);
customElements.define('error-message', ErrorMessage);
customElements.define('app-creation-step-one', AppCreationStepOne);
customElements.define('app-creation-step-two', AppCreationStepTwo);
customElements.define('generation-status', GenerationStatus);
customElements.define('generation-preview', GenerationPreview);

// Helper function to show error
function showError(title, message, level = 'error') {
  const errorContainer = document.querySelector('error-container') || 
    (() => {
      const container = document.createElement('error-container');
      document.body.appendChild(container);
      return container;
    })();
  
  return errorContainer.addError(title, message, level);
}

// App Controller
class AppCreationController {
  constructor() {
    // Initialize state
    this.currentInput = '';
    
    // Get DOM elements
    this.stepOne = document.getElementById('step-1');
    this.stepTwo = document.getElementById('step-2');
    this.generationStatus = document.getElementById('generation-status');
    this.generationPreview = document.getElementById('generation-preview');
    
    // Set up event listeners
    this.stepOne.addEventListener('step-one-next', this.handleStepOneNext.bind(this));
    this.stepTwo.addEventListener('generate-app', this.handleGenerateApp.bind(this));
    
    // Set up IPC event listeners
    window.electronAPI.onTitleDescriptionChunk(this.handleTitleDescriptionChunk.bind(this));
    window.electronAPI.onGenerationChunk(this.handleGenerationChunk.bind(this));
    
    // Initialize the app
    this.initializeApp();
  }
  
  async initializeApp() {
    // Check if API key is set
    const { hasApiKey } = await window.electronAPI.checkApiKey();
    
    if (!hasApiKey) {
      // Open API setup window if API key is not set
      window.electronAPI.openWindow('api-setup');
      
      // Close this window
      window.electronAPI.closeCurrentWindow();
      return;
    }
  }
  
  async handleStepOneNext(event) {
    this.currentInput = event.detail.input;
    
    // Show loading indicator with enhanced visibility
    this.generationStatus.show('Generating title and description...');
    
    // Show the preview section with a loading message
    this.stepTwo.showPreview();
    this.stepTwo.setGeneratingState();
    
    // Reset the preview fields
    this.stepTwo.generatedTitle.value = '';
    this.stepTwo.generatedDescription.value = '';
    
    // Force a small delay to ensure the UI updates before making the API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      console.log('Starting title and description generation...');
      // Generate title and description
      const result = await window.electronAPI.generateTitleAndDescription({
        input: this.currentInput
      });
      console.log('Title and description generation completed:', result);
      
      if (result.success) {
        // Display the user input
        this.stepTwo.setUserInput(this.currentInput);
        
        // Hide step 1, show step 2
        this.stepOne.setActive(false);
        this.stepTwo.setActive(true);
      } else {
        console.error('Title/description generation failed:', result.error);
        showError('Failed to generate title and description', result.error);
        // Show the button container again if there was an error
        this.stepOne.resetButtonContainer();
      }
    } catch (error) {
      console.error('Unexpected error during title/description generation:', error);
      showError('An unexpected error occurred', error.message);
      // Show the button container again if there was an error
      this.stepOne.resetButtonContainer();
    } finally {
      // Hide loading indicator
      this.generationStatus.hide();
      
      // Reset preview header if we're still in step 1 (error occurred)
      if (this.stepOne.classList.contains('active')) {
        this.stepTwo.setPreviewHeader('We will build...');
      }
    }
  }
  
  async handleGenerateApp(event) {
    // Show loading indicator
    this.generationStatus.show('Generating mini app...');
    
    // Reset and show generation preview
    this.generationPreview.reset();
    this.generationPreview.show();
    
    try {
      const result = await window.electronAPI.generateMiniApp({
        appName: event.detail.title,
        prompt: event.detail.description
      });
      
      if (result.success) {
        // Notify main window to refresh app list
        window.electronAPI.notifyAppUpdated();
        
        // Close this window after a short delay
        setTimeout(() => {
          window.electronAPI.closeCurrentWindow();
        }, 2000);
      } else {
        console.error('Mini app generation failed:', result.error);
        showError('Failed to generate mini app', result.error);
        // Show the button container again if there was an error
        this.stepTwo.resetButtonContainer();
      }
    } catch (error) {
      console.error('Unexpected error during mini app generation:', error);
      showError('An unexpected error occurred', error.message);
      // Show the button container again if there was an error
      this.stepTwo.resetButtonContainer();
    } finally {
      // Hide loading indicator
      this.generationStatus.hide();
    }
  }
  
  handleTitleDescriptionChunk(chunk) {
    console.log('Received title/description chunk:', chunk);
    
    if (chunk.done) {
      this.stepTwo.handleCompletedChunk(chunk);
    } else {
      this.stepTwo.handleInProgressChunk(chunk);
    }
  }
  
  handleGenerationChunk(chunk) {
    if (chunk.done) {
      this.generationPreview.handleGenerationComplete();
    } else {
      this.generationPreview.handleGenerationProgress(chunk.content);
    }
  }
}

// Initialize the app controller when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create error container if it doesn't exist
  if (!document.querySelector('error-container')) {
    const errorContainer = document.createElement('error-container');
    document.body.appendChild(errorContainer);
  }
  
  // Initialize the app controller
  new AppCreationController();
});

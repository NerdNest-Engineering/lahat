import { debugLog } from '../../core/debug.js';

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
          
          display: none;
          padding: var(--spacing-lg) 0;
        }
        
        :host(.active) {
          display: block;
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
          border: 1px solid var(--border-color);
          padding: 5px;
          background: white;
          border-radius: var(--border-radius);
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
          border: 1px solid var(--border-color);
          padding: 5px;
          font-size: 16px;
          line-height: 1.5;
          resize: vertical;
          background: white;
          color: var(--text-secondary);
          border-radius: var(--border-radius);
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
        
        #streaming-container {
          margin-top: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        
        #streaming-title {
          font-weight: bold;
          font-size: 24px;
          color: var(--primary-color);
          margin-bottom: var(--spacing-sm);
          padding: var(--spacing-sm);
          background-color: rgba(240, 240, 240, 0.5);
          border-radius: 4px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          min-height: 30px;
          display: none;
        }
        
        #streaming-description {
          font-size: 16px;
          line-height: 1.5;
          padding: var(--spacing-sm);
          background-color: rgba(240, 240, 240, 0.5);
          border-radius: 4px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          min-height: 60px;
          display: none;
        }
      </style>
      <div>
        <h2>What would you like?</h2>
        <div class="user-input-display">
          <span id="user-input-display"></span>
        </div>
        <div class="preview-section hidden">
          <div class="editable-title">
            <input type="text" id="generated-title" placeholder="App Title" />
          </div>
          <div class="editable-description">
            <textarea id="generated-description" rows="6" placeholder="App Description"></textarea>
          </div>
          <div id="streaming-container">
            <div id="streaming-title"></div>
            <div id="streaming-description"></div>
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
  
  
  resetButtonContainer() {
    this.shadowRoot.querySelector('.button-container').classList.remove('hidden');
    this.generatedTitle.readOnly = false;
    this.generatedDescription.readOnly = false;
  }
  
  updateTitleIfPresent(title) {
    debugLog('📝 step-two: updateTitleIfPresent called with:', title);
    if (!title) return;
    
    // Update both the input field and streaming container
    this.generatedTitle.value = title;
    this._currentTitle = title;
    this.streamingTitle.textContent = title;
    
    // Make sure the streaming container is visible
    this.streamingTitle.style.display = 'block';
    debugLog('📝 step-two: Title updated and streaming container shown');
  }
  
  updateDescriptionIfPresent(description) {
    debugLog('📝 step-two: updateDescriptionIfPresent called with:', description);
    if (!description) return;
    
    // Update both the textarea and streaming container
    this.generatedDescription.value = description;
    this._currentDescription = description;
    this.streamingDescription.textContent = description;
    
    // Make sure the streaming container is visible
    this.streamingDescription.style.display = 'block';
    debugLog('📝 step-two: Description updated and streaming container shown');
  }
  
  handleCompletedChunk(chunk) {
    debugLog('📝 step-two: handleCompletedChunk called with:', chunk);
    // Store the final values
    this._currentTitle = chunk.title || this.generatedTitle.value;
    this._currentDescription = chunk.description || this.generatedDescription.value;
    
    // Hide our streaming containers
    this.streamingTitle.style.display = 'none';
    this.streamingDescription.style.display = 'none';
    
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
}

// Register the component
customElements.define('app-creation-step-two', AppCreationStepTwo);

export { AppCreationStepTwo };

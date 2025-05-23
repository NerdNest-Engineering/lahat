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
        .editable-title {
          margin: 10px 0;
        }
        .editable-title input {
          font-size: 24px;
          font-weight: bold;
          color: #4285f4;
          width: 100%;
          border: 1px solid #e0e0e0;
          padding: 5px;
          background: white;
          border-radius: var(--border-radius, 8px);
          box-sizing: border-box;
        }
        .editable-title input:hover,
        .editable-title input:focus {
          border-color: #4285f4;
          outline: none;
        }
        .editable-description {
          margin: 10px 0;
        }
        .editable-description textarea {
          width: 100%;
          border: 1px solid #e0e0e0;
          padding: 5px;
          font-size: 16px;
          line-height: 1.5;
          resize: vertical;
          background: white;
          color: #5f6368;
          border-radius: var(--border-radius, 8px);
          font-family: inherit;
          box-sizing: border-box;
        }
        .editable-description textarea:hover,
        .editable-description textarea:focus {
          border-color: #4285f4;
          outline: none;
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
        .back-button {
          background: transparent;
          color: #5f6368;
          border: 1px solid #e0e0e0;
        }
        .back-button:hover {
          background: #f8f9fa;
          color: #202124;
        }
        #streaming-container {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        #streaming-title {
          font-weight: bold;
          font-size: 24px;
          color: #4285f4;
          margin-bottom: 10px;
          padding: 10px;
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
          padding: 10px;
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
  
  setPreviewHeader(text) {
    // Method kept for compatibility but does nothing since header is removed
  }
  
  setGeneratingState() {
    // Method kept for compatibility but does nothing since header is removed
  }
  
  resetButtonContainer() {
    this.shadowRoot.querySelector('.button-container').classList.remove('hidden');
    this.generatedTitle.readOnly = false;
    this.generatedDescription.readOnly = false;
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
      
      // Force a document reflow to ensure updates are visible
      document.body.offsetHeight;
    }, 0);
  }
}

// Register the component
customElements.define('app-creation-step-two', AppCreationStepTwo);

export { AppCreationStepTwo };

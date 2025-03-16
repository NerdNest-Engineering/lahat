/**
 * App Creation Step Two Component
 * Second step in the app creation process
 */

import { AppCreationStep } from './app-creation-step.js';

/**
 * AppCreationStepTwo component
 * Handles the second step of the app creation process
 */
export class AppCreationStepTwo extends AppCreationStep {
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
    const titleInput = this.shadowRoot.querySelector('#generated-title');
    titleInput.addEventListener('input', (e) => {
      this._currentTitle = e.target.value;
    });
    
    // Add keydown event listener for Enter key on title input
    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleGenerateClick();
      }
    });
    
    const descriptionInput = this.shadowRoot.querySelector('#generated-description');
    descriptionInput.addEventListener('input', (e) => {
      this._currentDescription = e.target.value;
    });
    
    // Add keydown event listener for Enter key on description textarea
    // Note: For textarea, we check for Ctrl+Enter or Cmd+Enter (Mac)
    descriptionInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        this.handleGenerateClick();
      }
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
    // Validate that we have title and description
    if (!this._currentTitle.trim()) {
      this.showError('Please enter a title for your app');
      return;
    }
    
    if (!this._currentDescription.trim()) {
      this.showError('Please enter a description for your app');
      return;
    }
    
    // Complete this step and move to the next one
    this.completeStep({ 
      title: this._currentTitle,
      description: this._currentDescription
    });
  }
  
  /**
   * Show an error message
   * @param {string} message - The error message to display
   */
  showError(message) {
    // Use the imported showError function or implement inline
    alert(message);
  }
  
  // Generic step interface
  /**
   * Start this step with data from the previous step
   * @param {Object} data - Data from the previous step
   * @param {string} data.input - User input from step one
   */
  async startStep(data) {
    // Activate this step
    this.setActive(true);
    
    // Store the user input
    this._userInput = data.input;
    
    // Prepare UI for title generation
    this.prepareForTitleGeneration(this._userInput);
    
    try {
      // Generate title and description using the domain API
      console.log('Starting title and description generation...');
      const result = await window.appCreationService.generateTitleAndDescription(this._userInput);
      console.log('Title and description generation completed:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate title and description');
      }
      
      // Success handling is done via the streaming chunks
      // The UI will be updated as chunks come in through the handleInProgressChunk method
      
    } catch (error) {
      console.error('Title/description generation failed:', error);
      this.handleGenerationError(error);
      
      // Dispatch event to notify parent of error
      this.dispatchEvent(new CustomEvent('step-two-error', {
        bubbles: true,
        composed: true,
        detail: { error }
      }));
    }
  }
  
  /**
   * End this step
   */
  endStep() {
    this.setActive(false);
  }
  
  /**
   * Handle generation error
   * @param {Error} error - The error that occurred
   */
  handleGenerationError(error) {
    // Reset UI state
    this.resetButtonContainer();
    this.setPreviewHeader('We will build...');
    
    // Report the error
    this.reportError(error);
  }
  
  // Public methods
  setActive(active) {
    if (active) {
      this.classList.add('active');
    } else {
      this.classList.remove('active');
    }
  }
  
  /**
   * Prepares the component for title and description generation
   * Encapsulates all the UI preparation logic
   * @param {string} userInput - The user input from step one
   */
  prepareForTitleGeneration(userInput) {
    // Set the user input display
    this.userInputDisplay.textContent = userInput;
    
    // Show the preview section
    this.showPreview();
    
    // Set generating state
    this.setGeneratingState();
    
    // Reset the preview fields
    this.generatedTitle.value = '';
    this.generatedDescription.value = '';
    this._currentTitle = '';
    this._currentDescription = '';
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
    
    // Show the input fields and update their values
    this.generatedTitle.style.display = 'block';
    this.generatedDescription.style.display = 'block';
    this.generatedTitle.value = this._currentTitle;
    this.generatedDescription.value = this._currentDescription;
  }
  
  handleInProgressChunk(chunk) {
    // Use setTimeout with zero delay to push DOM updates to the end of the event queue
    setTimeout(() => {
      // Hide the input fields when streaming starts
      if (chunk.title && this.generatedTitle.style.display !== 'none') {
        this.generatedTitle.style.display = 'none';
      }
      
      if (chunk.description && this.generatedDescription.style.display !== 'none') {
        this.generatedDescription.style.display = 'none';
      }
      
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

// Note: Component is registered in renderers/app-creation.js

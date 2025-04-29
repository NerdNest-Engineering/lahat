/**
 * App Creation Step Two Component
 * Second step in the app creation process - title and description
 */

import { AppCreationStep } from '../base/app-creation-step.js';

/**
 * App Creation Step Two Component
 * Second step in the app creation process - title and description
 */
export class AppCreationStepTwo extends AppCreationStep {
  constructor() {
    super();
    
    // Create the step content
    const content = document.createElement('div');
    content.innerHTML = `
      <style>
        .title-description-container {
          margin-bottom: 20px;
        }
        
        .section-label {
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .section-description {
          margin-bottom: 15px;
          color: #5f6368;
        }
        
        .input-container {
          margin-bottom: 20px;
        }
        
        .input-label {
          font-weight: 500;
          margin-bottom: 5px;
          font-size: 14px;
        }
        
        .title-input {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: var(--border-radius, 8px);
          font-family: var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
          font-size: 16px;
          margin-bottom: 15px;
        }
        
        .description-textarea {
          width: 100%;
          min-height: 100px;
          padding: 12px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: var(--border-radius, 8px);
          font-family: var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
          font-size: 16px;
          resize: vertical;
        }
        
        .user-input-container {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: var(--border-radius, 8px);
        }
        
        .user-input-label {
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 14px;
        }
        
        .user-input-text {
          white-space: pre-wrap;
          color: #5f6368;
        }
        
        .preview-container {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: var(--border-radius, 8px);
        }
        
        .preview-header {
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .preview-content {
          margin-top: 10px;
        }
        
        .generating-text {
          color: #5f6368;
          font-style: italic;
        }
        
        .cursor {
          display: inline-block;
          width: 2px;
          height: 16px;
          background-color: var(--primary-color, #4285f4);
          animation: blink 1s infinite;
          vertical-align: middle;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      </style>
      
      <div class="title-description-container">
        <div class="section-label">Review and Edit</div>
        <div class="section-description">
          Review and edit the generated title and description for your app.
        </div>
        
        <div class="input-container">
          <div class="input-label">Title</div>
          <input type="text" class="title-input" placeholder="App title">
        </div>
        
        <div class="input-container">
          <div class="input-label">Description</div>
          <textarea class="description-textarea" placeholder="App description"></textarea>
        </div>
        
        <div class="user-input-container">
          <div class="user-input-label">Your original prompt:</div>
          <div class="user-input-text"></div>
        </div>
        
        <div class="preview-container" style="display: none;">
          <div class="preview-header">We will build...</div>
          <div class="preview-content">
            <div class="generating-text">Generating title and description<span class="cursor"></span></div>
          </div>
        </div>
      </div>
    `;
    
    // Add the content to the shadow DOM
    this.shadowRoot.querySelector('.step-content').prepend(content);
    
    // Set up event listeners
    this._setupEventListeners();
    
    // Initialize properties
    this.generatedTitle = '';
    this.generatedDescription = '';
    this.userInput = '';
    this.isGenerating = false;
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // Get elements
    const titleInput = this.shadowRoot.querySelector('.title-input');
    const descriptionTextarea = this.shadowRoot.querySelector('.description-textarea');
    const nextButton = this.shadowRoot.querySelector('.next-button');
    
    // Add event listeners
    if (titleInput) {
      titleInput.addEventListener('input', this._handleInputChange.bind(this));
    }
    
    if (descriptionTextarea) {
      descriptionTextarea.addEventListener('input', this._handleInputChange.bind(this));
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', this._handleNextClick.bind(this));
    }
  }
  
  /**
   * Handle input change
   * @private
   */
  _handleInputChange() {
    const titleInput = this.shadowRoot.querySelector('.title-input');
    const descriptionTextarea = this.shadowRoot.querySelector('.description-textarea');
    const nextButton = this.shadowRoot.querySelector('.next-button');
    
    // Enable or disable the next button based on input content
    if (nextButton && titleInput && descriptionTextarea) {
      nextButton.disabled = titleInput.value.trim().length < 3 || descriptionTextarea.value.trim().length < 10;
    }
  }
  
  /**
   * Handle next button click
   * @private
   */
  _handleNextClick() {
    const titleInput = this.shadowRoot.querySelector('.title-input');
    const descriptionTextarea = this.shadowRoot.querySelector('.description-textarea');
    
    if (titleInput && descriptionTextarea && 
        titleInput.value.trim().length >= 3 && 
        descriptionTextarea.value.trim().length >= 10) {
      
      // Hide the button container
      this._hideButtonContainer();
      
      // Dispatch event
      this.dispatchEvent(new CustomEvent('generate-app', {
        bubbles: true,
        composed: true,
        detail: {
          title: titleInput.value.trim(),
          description: descriptionTextarea.value.trim()
        }
      }));
    }
  }
  
  /**
   * Hide the button container
   * @private
   */
  _hideButtonContainer() {
    const buttonContainer = this.shadowRoot.querySelector('.step-navigation');
    
    if (buttonContainer) {
      buttonContainer.style.display = 'none';
    }
  }
  
  /**
   * Reset the button container
   */
  resetButtonContainer() {
    const buttonContainer = this.shadowRoot.querySelector('.step-navigation');
    
    if (buttonContainer) {
      buttonContainer.style.display = 'flex';
    }
  }
  
  /**
   * Set the user input
   * @param {string} input - The user input
   */
  setUserInput(input) {
    this.userInput = input;
    
    // Update the UI
    const userInputText = this.shadowRoot.querySelector('.user-input-text');
    if (userInputText) {
      userInputText.textContent = input;
    }
  }
  
  /**
   * Show the preview
   */
  showPreview() {
    const previewContainer = this.shadowRoot.querySelector('.preview-container');
    
    if (previewContainer) {
      previewContainer.style.display = 'block';
    }
  }
  
  /**
   * Set the preview header
   * @param {string} header - The preview header
   */
  setPreviewHeader(header) {
    const previewHeader = this.shadowRoot.querySelector('.preview-header');
    
    if (previewHeader) {
      previewHeader.textContent = header;
    }
  }
  
  /**
   * Set the generating state
   */
  setGeneratingState() {
    this.isGenerating = true;
    
    // Update the UI
    const previewContent = this.shadowRoot.querySelector('.preview-content');
    
    if (previewContent) {
      previewContent.innerHTML = `
        <div class="generating-text">Generating title and description<span class="cursor"></span></div>
      `;
    }
  }
  
  /**
   * Handle in-progress chunk
   * @param {Object} chunk - The chunk
   */
  handleInProgressChunk(chunk) {
    // Update the preview UI only
    const previewContent = this.shadowRoot.querySelector('.preview-content');

    if (previewContent && chunk.content) {
      // Append text to preview (simple approach, might need refinement for complex streams)
      const generatingText = previewContent.querySelector('.generating-text');
      if (generatingText) {
        generatingText.textContent += chunk.content;
      } else {
         // If generating text isn't there, maybe it finished early? Update with final text.
         this.updatePreviewContent(this.generatedTitle, this.generatedDescription);
      }
    }
  }
  
  /**
   * Handle completed chunk
   * @param {Object} chunk - The chunk
   */
  handleCompletedChunk(chunk) {
    // Final update based on the aggregated result (if available in chunk)
    // Note: The controller now passes the final data via setInitialData,
    // so this primarily just finalizes the preview.
    if (chunk.content) {
      try {
        const data = JSON.parse(chunk.content);
        if (data.title) this.generatedTitle = data.title;
        if (data.description) this.generatedDescription = data.description;
      } catch (error) {
        console.warn('Could not parse final chunk content in Step Two:', error);
        // Use potentially already set properties if parsing fails
      }
    }

    // Update the preview content definitively
    this.updatePreviewContent(this.generatedTitle, this.generatedDescription);

    // Enable the next button (input fields should already be populated by setInitialData)
    this._handleInputChange();

    // Set generating state to false
    this.isGenerating = false;
  }

  /**
   * Updates the preview content area.
   * @param {string} title
   * @param {string} description
   */
  updatePreviewContent(title, description) {
    const previewContent = this.shadowRoot.querySelector('.preview-content');
    if (previewContent) {
      previewContent.innerHTML = `
        <div>
          <strong>Title:</strong> ${title || 'N/A'}
        </div>
        <div style="margin-top: 10px;">
          <strong>Description:</strong> ${description || 'N/A'}
        </div>
      `;
    }
  }

  /**
   * Sets the initial title and description in the input fields.
   * Called by the controller after generation is complete.
   * @param {string} title
   * @param {string} description
   */
  setInitialData(title, description) {
    this.generatedTitle = title;
    this.generatedDescription = description;

    const titleInput = this.shadowRoot.querySelector('.title-input');
    const descriptionTextarea = this.shadowRoot.querySelector('.description-textarea');

    if (titleInput) {
      titleInput.value = title;
    }
    if (descriptionTextarea) {
      descriptionTextarea.value = description;
    }

    // Update preview as well, in case streaming didn't finish cleanly
    this.updatePreviewContent(title, description);

    // Ensure button state is correct
    this._handleInputChange();
  }
  
  /**
   * Get the generated title
   * @returns {string} - The generated title
   */
  get generatedTitle() {
    return this._generatedTitle || '';
  }
  
  /**
   * Set the generated title
   * @param {string} title - The generated title
   */
  set generatedTitle(title) {
    this._generatedTitle = title;
  }
  
  /**
   * Get the generated description
   * @returns {string} - The generated description
   */
  get generatedDescription() {
    return this._generatedDescription || '';
  }
  
  /**
   * Set the generated description
   * @param {string} description - The generated description
   */
  set generatedDescription(description) {
    this._generatedDescription = description;
  }

  /**
   * Get the current title from the input field
   * @returns {string} - The current title
   */
  getTitle() {
    const titleInput = this.shadowRoot.querySelector('.title-input');
    return titleInput ? titleInput.value.trim() : this.generatedTitle;
  }

  /**
   * Get the current description from the textarea
   * @returns {string} - The current description
   */
  getDescription() {
    const descriptionTextarea = this.shadowRoot.querySelector('.description-textarea');
    return descriptionTextarea ? descriptionTextarea.value.trim() : this.generatedDescription;
  }
}

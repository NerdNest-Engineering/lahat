/**
 * App Creation Step Two Component
 * Second step in the app creation process - title and description
 */
import { EventDefinition } from '../../utils/event-definition.js';

// Title & Description Generation
export const TITLE_DESCRIPTION_GENERATION_START = new EventDefinition(
  'app-creator:title-desc-generation-start',
  'Fired when the process of generating an app title and description is initiated, usually after the user provides an initial app idea/prompt. Signals the start of an asynchronous operation.',
  { prompt: { type: 'string', description: 'The user-provided text prompt used as input for generation.' } }
);
export const TITLE_DESCRIPTION_GENERATION_CHUNK_RECEIVED = new EventDefinition(
  'app-creator:title-desc-generation-chunk-received',
  'Fired when a new chunk of data (streaming) for the title and description is received from the generation service (e.g., via IPC). Allows for progressive UI updates.',
  {
    chunk: { type: 'object', description: 'The data chunk received. Structure may vary based on the service but often contains partial title/description.' },
    done: { type: 'boolean', description: 'True if this is the final chunk and the generation stream is complete.' }
  }
);
export const TITLE_DESCRIPTION_GENERATION_SUCCESS = new EventDefinition(
  'app-creator:title-desc-generation-success',
  'Fired when the title and description generation process completes successfully and the final content is available.',
  {
    title: { type: 'string', description: 'The fully generated app title.' },
    description: { type: 'string', description: 'The fully generated app description.' }
  }
);
export const TITLE_DESCRIPTION_GENERATION_FAILURE = new EventDefinition(
  'app-creator:title-desc-generation-failure',
  'Fired if an error occurs during the title and description generation process.',
  { error: { type: 'string', description: 'A message describing the error that occurred.' } }
);

/**
 * App Creation Step Two Component
 * Second step in the app creation process - title and description
 */
export class AppCreationStepTwo extends HTMLElement {
  constructor() {
    // No super() call needed

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        /* Keep only styles relevant to this step's content */
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

    // Set up event listeners for elements within this component's shadow DOM
    this._setupEventListeners();

    // Initialize properties used for internal preview logic
    this._generatedTitle = '';
    this._generatedDescription = '';
    this._userInput = '';
    this._isGenerating = false;
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // Get elements
    const titleInput = this.shadowRoot.querySelector('.title-input');
    const descriptionTextarea = this.shadowRoot.querySelector('.description-textarea');
    // No next button within this component anymore

    // Add event listeners
    if (titleInput) {
      titleInput.addEventListener('input', this._handleInputChange.bind(this));
    }

    if (descriptionTextarea) {
      descriptionTextarea.addEventListener('input', this._handleInputChange.bind(this));
    }

    // No listener for next button needed here
  }
  
  /**
   * Handle input change
   * @private
   */
  _handleInputChange() {
    const titleInput = this.shadowRoot.querySelector('.title-input');
    const descriptionTextarea = this.shadowRoot.querySelector('.description-textarea');
    // No next button to enable/disable here

    // Dispatch validity change event for the controller
    const isValid = titleInput.value.trim().length >= 3 && descriptionTextarea.value.trim().length >= 10;
    this.dispatchEvent(new CustomEvent('step-validity-change', {
      detail: { isValid },
      bubbles: true,
      composed: true
    }));
  }

  // _handleNextClick, _hideButtonContainer, resetButtonContainer are removed
  
  /**
   * Set the user input
   * @param {string} input - The user input
   */
  /**
   * Initializes the step with data from the previous step or generation.
   * Called by the controller.
   * @param {object} data - Data object. Expected properties: userInput, title, description.
   */
  initializeData(data) {
    this._userInput = data.userInput || '';
    this._generatedTitle = data.title || '';
    this._generatedDescription = data.description || '';

    // Update UI elements
    const userInputText = this.shadowRoot.querySelector('.user-input-text');
    const titleInput = this.shadowRoot.querySelector('.title-input');
    const descriptionTextarea = this.shadowRoot.querySelector('.description-textarea');

    if (userInputText) {
      userInputText.textContent = this._userInput;
    }
    if (titleInput) {
      titleInput.value = this._generatedTitle;
    }
    if (descriptionTextarea) {
      descriptionTextarea.value = this._generatedDescription;
    }

    // Show preview container if needed (controller might decide this)
    // this.showPreview();

    // Update preview content
    this.updatePreviewContent(this._generatedTitle, this._generatedDescription);

    // Ensure initial validity state is dispatched
    this._handleInputChange();
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
  setGeneratingState(isGenerating = true) {
    this._isGenerating = isGenerating;

    // Update the UI
    const previewContent = this.shadowRoot.querySelector('.preview-content');
    const previewContainer = this.shadowRoot.querySelector('.preview-container');

    if (previewContainer) {
       previewContainer.style.display = 'block'; // Ensure preview is visible when generating
    }
    
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
         this.updatePreviewContent(this._generatedTitle, this._generatedDescription);
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
        // Update internal state if needed, though initializeData is the primary source now
        if (data.title) this._generatedTitle = data.title;
        if (data.description) this._generatedDescription = data.description;
      } catch (error) {
        console.warn('Could not parse final chunk content in Step Two:', error);
        // Use potentially already set properties if parsing fails
      }
    }

    // Update the preview content definitively
    // Note: Controller should call initializeData with final results,
    // but we update preview here too for robustness during streaming.
    this.updatePreviewContent(this._generatedTitle, this._generatedDescription);

    // Ensure validity is checked with potentially updated content
    this._handleInputChange();

    // Set generating state to false
    this.setGeneratingState(false);
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
  // setInitialData is replaced by initializeData(data)


  /**
   * Called by the controller to get the step's output data.
   * @returns {{title: string, description: string}} The current title and description.
   */
  getOutputData() {
    const titleInput = this.shadowRoot.querySelector('.title-input');
    const descriptionTextarea = this.shadowRoot.querySelector('.description-textarea');
    return {
      title: titleInput ? titleInput.value.trim() : '',
      description: descriptionTextarea ? descriptionTextarea.value.trim() : ''
    };
  }

  /**
   * Called when the element is connected to the DOM
   */
  connectedCallback() {
    // Initialize validity state on connection
    this._handleInputChange();
  }

  // Removed internal getters/setters for generatedTitle/Description
  // Removed getTitle/getDescription as getOutputData serves this purpose
}

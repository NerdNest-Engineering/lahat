/**
 * App Creation Step Three Component
 * Third step in the app creation process
 */

import { showError } from '../utils/utils.js';
import { AppCreationStep } from './app-creation-step.js';

/**
 * AppCreationStepThree component
 * Handles the third step of the app creation process - generating the widget
 */
export class AppCreationStepThree extends AppCreationStep {
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
        .summary-section {
          background: #f8f9fa;
          padding: 15px;
          border-radius: var(--border-radius, 8px);
          margin-bottom: 20px;
        }
        .summary-item {
          margin-bottom: 10px;
        }
        .summary-label {
          font-weight: bold;
          color: #5f6368;
        }
        .summary-value {
          margin-top: 5px;
        }
        .title-value {
          font-size: 20px;
          color: #4285f4;
          font-weight: bold;
        }
        .description-value {
          white-space: pre-wrap;
        }
        .generation-status {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 20px 0;
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
        .preview-container {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: var(--border-radius, 8px);
          padding: 15px;
          margin-top: 20px;
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
      <div>
        <h2>Generating Your Widget</h2>
        
        <div class="summary-section">
          <div class="summary-item">
            <div class="summary-label">Title:</div>
            <div class="summary-value title-value" id="title-display"></div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Description:</div>
            <div class="summary-value description-value" id="description-display"></div>
          </div>
        </div>
        
        <div class="generation-status">
          <div class="spinner"></div>
          <div>Generating widget...</div>
        </div>
        
        <div class="preview-container">
          <h3>Generation Preview</h3>
          <pre id="preview-output"></pre>
        </div>
      </div>
    `;
    
    // Initialize state
    this._title = '';
    this._description = '';
    this._generationChunks = '';
  }
  
  // Getters
  get titleDisplay() {
    return this.shadowRoot.querySelector('#title-display');
  }
  
  get descriptionDisplay() {
    return this.shadowRoot.querySelector('#description-display');
  }
  
  get previewOutput() {
    return this.shadowRoot.querySelector('#preview-output');
  }
  
  // Generic step interface
  /**
   * Start this step with data from the previous step
   * @param {Object} data - Data from the previous step
   * @param {string} data.title - App title from step two
   * @param {string} data.description - App description from step two
   */
  async startStep(data) {
    // Activate this step
    this.setActive(true);
    
    // Store the title and description
    this._title = data.title;
    this._description = data.description;
    
    // Update the UI
    this.titleDisplay.textContent = this._title;
    this.descriptionDisplay.textContent = this._description;
    
    // Reset the preview output
    this._generationChunks = '';
    this.previewOutput.textContent = '';
    
    try {
      // Generate widget using the domain API
      console.log('Starting widget generation...');
      const result = await window.appCreationService.generateWidget({
        appName: this._title,
        prompt: this._description
      });
      console.log('Widget generation completed:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate widget');
      }
      
      // Success handling is done via the streaming chunks
      // The UI will be updated as chunks come in through the handleGenerationProgress method
      
      // Complete this step
      this.completeStep({ success: true });
      
    } catch (error) {
      console.error('Widget generation failed:', error);
      this.handleGenerationError(error);
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
    // Show error
    showError('Failed to generate widget', error.message);
    
    // Report the error
    this.reportError(error);
  }
  
  /**
   * Handle generation progress
   * @param {string} content - The chunk of generation content
   */
  handleGenerationProgress(content) {
    this._generationChunks += content;
    this.previewOutput.textContent = this._generationChunks;
    
    // Auto-scroll to bottom
    this.previewOutput.scrollTop = this.previewOutput.scrollHeight;
  }
  
  /**
   * Handle generation complete
   */
  handleGenerationComplete() {
    // Reset chunks when generation is complete
    this._generationChunks = '';
    
    // Close the window after generation is complete
    window.close();
  }
  
  // Public methods
  setActive(active) {
    if (active) {
      this.classList.add('active');
    } else {
      this.classList.remove('active');
    }
  }
}

// Note: Component is registered in renderers/app-creation.js

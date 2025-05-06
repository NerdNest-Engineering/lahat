/**
 * App Creation Step Three Component
 * Displays the generation process and resulting code
 */

/**
 * App Creation Step Three Component
 * Final step that shows the generation process and result
 */
export class AppCreationStepThree extends HTMLElement {
  constructor() {
    // No super() call needed

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        /* Keep only styles relevant to this step's content */
        .generation-container {
          margin-bottom: 20px;
        }
        
        .generation-header {
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 15px;
        }
        
        .generation-summary {
          background-color: #f5f5f7;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        .generation-label {
          font-weight: 500;
          margin-bottom: 5px;
        }
        
        .generation-value {
          margin-bottom: 15px;
        }
        
        .generation-value:last-child {
          margin-bottom: 0;
        }
        
        .status-container {
          background-color: #f5f5f7;
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
          text-align: center;
        }
        
        .status-message {
          font-size: 16px;
          margin-bottom: 10px;
        }
        
        .success-message {
          color: #34a853;
          font-weight: 500;
        }
      </style>
      
      <div class="generation-header">Generation Summary</div>
      <div class="generation-summary">
        <div class="generation-label">App Name:</div>
        <div class="generation-value app-name"></div>
        
        <div class="generation-label">Description:</div>
        <div class="generation-value app-description"></div>
      </div>
      
      <div class="status-container">
        <div class="status-message">Your app is being generated...</div>
      </div>
    `;

    // Initialize properties
    this._appName = '';
    this._appDescription = '';
    this._generating = false;

    // No button setup needed here (handled by wrapper/controller)
  }
  
  /**
   * Set the app name
   * @param {string} name - The app name
   */
  /**
   * Initializes the step with data from the previous step.
   * Called by the controller.
   * @param {object} data - Data object. Expected properties: title, description.
   */
  initializeData(data) {
    this._appName = data.title || '';
    this._appDescription = data.description || '';

    // Update UI elements
    const appNameElement = this.shadowRoot.querySelector('.app-name');
    const appDescriptionElement = this.shadowRoot.querySelector('.app-description');

    if (appNameElement) {
      appNameElement.textContent = this._appName;
    }
    if (appDescriptionElement) {
      appDescriptionElement.textContent = this._appDescription;
    }

    // This step is likely always "valid" once initialized, notify controller
    // The 'Next' button in the wrapper might be labeled 'Create App' by the controller
    this.dispatchEvent(new CustomEvent('step-validity-change', {
      detail: { isValid: true },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Called by the controller to get the step's output data for final generation.
   * @returns {{title: string, description: string}} The app title and description.
   */
  getOutputData() {
    return {
      title: this._appName,
      description: this._appDescription
    };
  }

  // _handleNextClick is removed (wrapper handles click, controller handles action)
  
  /**
   * Set the generating state
   */
  setGeneratingState() {
    this._generating = true;
    
    // No need to disable wrapper button from here

    // Update the status message
    const statusMessage = this.shadowRoot.querySelector('.status-message');
    if (statusMessage) {
      statusMessage.textContent = 'Generating your app...';
      statusMessage.classList.remove('success-message');
    }
  }
  
  /**
   * Set the completed state
   */
  setCompletedState() {
    this._generating = false;
    
    // Controller might handle wrapper button text/state

    // Update the status message
    const statusMessage = this.shadowRoot.querySelector('.status-message');
    if (statusMessage) {
      statusMessage.textContent = 'App created successfully!';
      statusMessage.classList.add('success-message');
    }
    
    // Controller might call setCompleted on the wrapper
  }
  
  /**
   * Set the error state
   * @param {string} errorMessage - The error message
   */
  setErrorState(errorMessage) {
    this._generating = false;
    
    // Controller might handle wrapper button text/state

    // Update the status message
    const statusMessage = this.shadowRoot.querySelector('.status-message');
    if (statusMessage) {
      statusMessage.textContent = errorMessage || 'An error occurred while generating the app.';
      statusMessage.style.color = '#ea4335';
    }
  }

  // resetButtonContainer is removed
}

// Register the component if it hasn't been registered yet
if (!customElements.get('app-creation-step-three')) {
  customElements.define('app-creation-step-three', AppCreationStepThree);
}
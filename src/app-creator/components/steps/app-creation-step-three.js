/**
 * App Creation Step Three Component
 * Displays the generation process and resulting code
 */

import { AppCreationStep } from '../base/app-creation-step.js';

/**
 * App Creation Step Three Component
 * Final step that shows the generation process and result
 */
export class AppCreationStepThree extends AppCreationStep {
  constructor() {
    super();
    
    // Get the content container
    const contentContainer = this.shadowRoot.querySelector('.step-content');
    
    // Insert step-specific content before the navigation
    const navigationElement = this.shadowRoot.querySelector('.step-navigation');
    
    // Create generation container
    const generationContainer = document.createElement('div');
    generationContainer.className = 'generation-container';
    generationContainer.innerHTML = `
      <style>
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
    
    // Insert the generation container before the navigation
    contentContainer.insertBefore(generationContainer, navigationElement);
    
    // Initialize properties
    this._appName = '';
    this._appDescription = '';
    this._generating = false;
    
    // Set initial button text
    this.setNextButtonText('Create App');
    
    // Disable the next button initially
    this.enableNextButton(false);
  }
  
  /**
   * Set the app name
   * @param {string} name - The app name
   */
  setAppName(name) {
    this._appName = name;
    
    // Update the UI
    const appNameElement = this.shadowRoot.querySelector('.app-name');
    if (appNameElement) {
      appNameElement.textContent = name;
    }
  }
  
  /**
   * Set the app description
   * @param {string} description - The app description
   */
  setAppDescription(description) {
    this._appDescription = description;
    
    // Update the UI
    const appDescriptionElement = this.shadowRoot.querySelector('.app-description');
    if (appDescriptionElement) {
      appDescriptionElement.textContent = description;
    }
  }
  
  /**
   * Handle next button click override
   * @private
   */
  _handleNextClick() {
    if (this._generating) {
      return;
    }
    
    // Set generating state
    this.setGeneratingState();
    
    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('generate-app', {
      bubbles: true,
      composed: true,
      detail: {
        title: this._appName,
        description: this._appDescription
      }
    }));
  }
  
  /**
   * Set the generating state
   */
  setGeneratingState() {
    this._generating = true;
    
    // Disable the next button
    this.enableNextButton(false);
    
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
    
    // Enable the next button and change its text
    this.enableNextButton(true);
    this.setNextButtonText('Go to App');
    
    // Update the status message
    const statusMessage = this.shadowRoot.querySelector('.status-message');
    if (statusMessage) {
      statusMessage.textContent = 'App created successfully!';
      statusMessage.classList.add('success-message');
    }
    
    // Mark the step as completed
    this.setCompleted(true);
  }
  
  /**
   * Set the error state
   * @param {string} errorMessage - The error message
   */
  setErrorState(errorMessage) {
    this._generating = false;
    
    // Enable the next button and reset its text
    this.enableNextButton(true);
    this.setNextButtonText('Try Again');
    
    // Update the status message
    const statusMessage = this.shadowRoot.querySelector('.status-message');
    if (statusMessage) {
      statusMessage.textContent = errorMessage || 'An error occurred while generating the app.';
      statusMessage.style.color = '#ea4335';
    }
  }
  
  /**
   * Reset the button container
   */
  resetButtonContainer() {
    this._generating = false;
    
    // Enable the next button
    this.enableNextButton(true);
    
    // Reset button text
    this.setNextButtonText('Create App');
  }
}

// Register the component if it hasn't been registered yet
if (!customElements.get('app-creation-step-three')) {
  customElements.define('app-creation-step-three', AppCreationStepThree);
}
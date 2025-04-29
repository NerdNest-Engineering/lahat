/**
 * App Creation Step One Component
 * First step in the app creation process - prompt input
 */

import { AppCreationStep } from '../base/app-creation-step.js';

/**
 * App Creation Step One Component
 * First step in the app creation process - prompt input
 */
export class AppCreationStepOne extends AppCreationStep {
  constructor() {
    super();
    
    // Create the step content
    const content = document.createElement('div');
    content.innerHTML = `
      <style>
        .prompt-container {
          margin-bottom: 20px;
        }
        
        .prompt-label {
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .prompt-description {
          margin-bottom: 15px;
          color: #5f6368;
        }
        
        .prompt-textarea {
          width: 90%;
          max-width: 600px;
          height: 48px;
          padding: 0 12px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: var(--border-radius, 8px);
          font-family: var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
          font-size: 16px;
          resize: none;
          line-height: 48px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          margin: 0 auto;
          display: block;
        }
        
        .prompt-textarea:focus {
          border-color: var(--primary-color, #4285f4);
          box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
        }
        
        .prompt-examples {
          margin-top: 20px;
        }
        
        .prompt-examples-title {
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .example-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
        }
        
        .example-item {
          background-color: #f1f3f4;
          padding: 8px 12px;
          border-radius: var(--border-radius, 8px);
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .example-item:hover {
          background-color: #e8eaed;
        }
        
        .button-container {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        
        .next-button {
          padding: 10px 20px;
          background-color: var(--primary-color, #4285f4);
          color: white;
          border: none;
          border-radius: var(--border-radius, 8px);
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .next-button:hover {
          background-color: #3367d6;
        }
        
        .next-button:disabled {
          background-color: #e0e0e0;
          color: #9e9e9e;
          cursor: not-allowed;
        }
      </style>
      
      <div class="prompt-container">
        <div class="prompt-label">Describe the app you want to create</div>
        <div class="prompt-description">
          Enter a detailed description of the app you want to create. The more specific you are, the better the result will be.
        </div>
        <input class="prompt-textarea" placeholder="Describe your app here..."></input>
      </div>
      
      <div class="prompt-examples">
        <div class="prompt-examples-title">Examples</div>
        <div class="prompt-description">
          Click on an example to use it as a starting point.
        </div>
        <div class="example-list">
          <div class="example-item">A task management app with categories and due dates</div>
          <div class="example-item">A weather dashboard showing current conditions and forecast</div>
          <div class="example-item">A calculator with basic and scientific functions</div>
          <div class="example-item">A note-taking app with markdown support</div>
        </div>
      </div>
    `;
    
    // Add the content to the shadow DOM
    this.shadowRoot.querySelector('.step-content').prepend(content);
    
    // Set up event listeners
    this._setupEventListeners();
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // Get elements
    const textarea = this.shadowRoot.querySelector('.prompt-textarea');
    const nextButton = this.shadowRoot.querySelector('.next-button');
    const exampleItems = this.shadowRoot.querySelectorAll('.example-item');
    
    // Add event listeners
    if (textarea) {
      textarea.addEventListener('input', this._handleTextareaInput.bind(this));
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', this._handleNextClick.bind(this));
    }
    
    if (exampleItems) {
      exampleItems.forEach(item => {
        item.addEventListener('click', this._handleExampleClick.bind(this));
      });
    }
  }
  
  /**
   * Handle textarea input
   * @param {Event} event - The input event
   * @private
   */
  _handleTextareaInput(event) {
    const textarea = event.target;
    const nextButton = this.shadowRoot.querySelector('.next-button');
    
    // Enable or disable the next button based on textarea content
    if (nextButton) {
      nextButton.disabled = textarea.value.trim().length < 10;
    }
  }
  
  /**
   * Handle next button click
   * @private
   */
  _handleNextClick() {
    const textarea = this.shadowRoot.querySelector('.prompt-textarea');
    
    if (textarea && textarea.value.trim().length >= 10) {
      // Hide the button container
      this._hideButtonContainer();
      
      // Dispatch event
      this.dispatchEvent(new CustomEvent('step-one-next', {
        bubbles: true,
        composed: true,
        detail: { input: textarea.value.trim() }
      }));
    }
  }
  
  /**
   * Handle example click
   * @param {Event} event - The click event
   * @private
   */
  _handleExampleClick(event) {
    const example = event.target.textContent;
    const textarea = this.shadowRoot.querySelector('.prompt-textarea');
    const nextButton = this.shadowRoot.querySelector('.next-button');
    
    if (textarea) {
      textarea.value = example;
      
      // Enable the next button
      if (nextButton) {
        nextButton.disabled = false;
      }
      
      // Focus the textarea
      textarea.focus();
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
   * Called when the element is connected to the DOM
   */
  connectedCallback() {
    // Initialize the textarea state
    const textarea = this.shadowRoot.querySelector('.prompt-textarea');
    const nextButton = this.shadowRoot.querySelector('.next-button');
    
    if (textarea && nextButton) {
      nextButton.disabled = textarea.value.trim().length < 10;
    }
  }
}

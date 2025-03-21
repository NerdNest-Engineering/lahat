/**
 * App Creation Step One Component
 * First step in the app creation process
 */

import { showError } from '../utils/utils.js';
import { AppCreationStep } from './app-creation-step.js';

/**
 * AppCreationStepOne component
 * Handles the first step of the app creation process
 */
export class AppCreationStepOne extends AppCreationStep {
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
          <input type="text" id="user-input" placeholder="I want ..." />
        </div>
        <div class="button-container">
          <button id="next-button">Next</button>
        </div>
      </div>
    `;
    
    // Set up event listeners
    this.shadowRoot.querySelector('#next-button').addEventListener('click', this.handleNextClick.bind(this));
    
    // Add event listener for Enter key on input field
    this.shadowRoot.querySelector('#user-input').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.handleNextClick();
      }
    });
  }
  
  // Getters
  get userInput() {
    return this.shadowRoot.querySelector('#user-input').value.trim();
  }
  
  // Event handlers
  async handleNextClick() {
    if (!this.userInput) {
      // Show error using the error container
      showError('Input Required', 'Please enter what you would like to create.');
      return;
    }
    
    // Hide the button container
    this.shadowRoot.querySelector('.button-container').classList.add('hidden');
    
    // Complete this step and move to the next one
    this.completeStep({ input: this.userInput });
  }
  
  // Generic step interface
  /**
   * Start this step
   * @param {Object} data - Data to initialize the step (not used in step one)
   */
  startStep(data = {}) {
    // Activate this step
    this.setActive(true);
    
    // Reset the input field if needed
    if (data.resetInput) {
      this.shadowRoot.querySelector('#user-input').value = '';
    }
    
    // Show the button container
    this.resetButtonContainer();
  }
  
  /**
   * End this step
   */
  endStep() {
    this.setActive(false);
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

// Note: Component is registered in renderers/app-creation.js

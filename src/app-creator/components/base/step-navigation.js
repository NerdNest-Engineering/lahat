/**
 * Step Navigation Component
 * Reusable navigation component for app creation steps with next/back buttons
 */
import { EventDefinition } from '../../utils/event-definition.js';

// Step Navigation & Validity
export const STEP_NEXT = new EventDefinition(
  'app-creator:step-next',
  'Fired when the user initiates a "next step" action, typically by clicking a "Next" or "Continue" button within a step. The controller listens to this to advance the workflow.',
  { stepNumber: { type: 'number', description: 'The number of the step from which the next action was triggered.' } }
);
export const STEP_BACK = new EventDefinition(
  'app-creator:step-back',
  'Fired when the user initiates a "previous step" action, typically by clicking a "Back" button. The controller listens to this to revert to the previous step in the workflow.',
  { stepNumber: { type: 'number', description: 'The number of the step from which the back action was triggered.' } }
);

export class StepNavigation extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Initialize properties
    this._stepNumber = 0;
    
    // Create the template
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .step-navigation {
          display: flex;
          justify-content: flex-start;
          margin-top: 20px;
        }
        
        button {
          padding: 10px 20px;
          border: none;
          border-radius: var(--border-radius, 8px);
          background-color: #e0e0e0;
          color: #333333;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.2s;
          font-weight: 500;
        }
        
        button:hover {
          background-color: #d0d0d0;
        }
        
        button.secondary {
          background-color: #f1f3f4;
          color: var(--text-color, #333333);
        }
        
        button.secondary:hover {
          background-color: #e8eaed;
        }
        
        button:disabled {
          opacity: 0.7;
          color: #9e9e9e;
          cursor: not-allowed;
        }
      </style>
      
      <div class="step-navigation">
        <button class="secondary back-button" style="display: none;">Back</button>
        <button class="next-button">Next</button>
      </div>
    `;
    
    // Set up event listeners
    this._setupEventListeners();
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // Get buttons
    const backButton = this.shadowRoot.querySelector('.back-button');
    const nextButton = this.shadowRoot.querySelector('.next-button');
    
    // Add event listeners
    if (backButton) {
      backButton.addEventListener('click', this._handleBackClick.bind(this));
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', this._handleNextClick.bind(this));
    }
  }
  
  /**
   * Handle back button click
   * @private
   */
  _handleBackClick() {
    // Dispatch event using the event registry
    this.dispatchEvent(new CustomEvent(STEP_BACK, {
      bubbles: true,
      composed: true,
      detail: { stepNumber: this._stepNumber }
    }));
  }
  
  /**
   * Handle next button click
   * @private
   */
  _handleNextClick() {
    // Dispatch event using the event registry
    this.dispatchEvent(new CustomEvent(STEP_NEXT, {
      bubbles: true,
      composed: true,
      detail: { stepNumber: this._stepNumber }
    }));
  }
  
  /**
   * Set the step number
   * @param {number} stepNumber - The step number
   */
  setStepNumber(stepNumber) {
    this._stepNumber = stepNumber;
  }
  
  /**
   * Show or hide the back button
   * @param {boolean} show - Whether to show the back button
   */
  showBackButton(show) {
    const backButton = this.shadowRoot.querySelector('.back-button');
    if (backButton) {
      backButton.style.display = show ? 'block' : 'none';
    }
  }
  
  /**
   * Set the next button text
   * @param {string} text - The button text
   */
  setNextButtonText(text) {
    const nextButton = this.shadowRoot.querySelector('.next-button');
    if (nextButton) {
      nextButton.textContent = text;
    }
  }
  
  /**
   * Enable or disable the next button
   * @param {boolean} enabled - Whether the button is enabled
   */
  enableNextButton(enabled) {
    const nextButton = this.shadowRoot.querySelector('.next-button');
    if (nextButton) {
      nextButton.disabled = !enabled;
    }
  }
}

// Define the custom element
customElements.define('step-navigation', StepNavigation);

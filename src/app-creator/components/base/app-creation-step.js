/**
 * App Creation Step Component
 * Base component for all app creation steps
 */

import { EventDefinition } from '../../utils/event-definition.js';
import { STEP_NEXT, STEP_BACK } from './step-navigation.js'; // Import from step-navigation

// Step Validity
export const STEP_VALIDITY_CHANGE = new EventDefinition(
  'app-creator:step-validity-change',
  'Fired by a step component when its internal validation state changes (e.g., user input meets requirements). The controller uses this to enable/disable navigation controls.',
  {
    element: { type: 'HTMLElement', description: 'The specific input element whose validity changed, if applicable.' },
    isValid: { type: 'boolean', description: 'True if the step/input is currently valid, false otherwise.' }
  }
);

/**
 * App Creation Step Component
 * Base component for all app creation steps
 */
export class AppCreationStep extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Initialize properties
    this._active = false;
    this._completed = false;
    this._stepNumber = 0;
    this._stepTitle = '';
    
    // Create the base template
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 20px;
        }
        
        .step-container {
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: var(--border-radius, 8px);
          overflow: hidden;
        }
        
        .step-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background-color: #f5f5f5;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }
        
        .step-title {
          font-weight: 600;
          font-size: 18px;
          display: flex;
          align-items: center;
        }
        
        .step-number {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: var(--primary-color, #4285f4);
          color: white;
          font-weight: 600;
          margin-right: 10px;
        }
        
        .step-status {
          font-size: 14px;
          color: #5f6368;
        }
        
        .step-content {
          padding: 20px;
        }
        
        .step-navigation {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }
        
        button {
          padding: 10px 20px;
          border: none;
          border-radius: var(--border-radius, 8px);
          background-color: var(--primary-color, #4285f4);
          color: white;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        button:hover {
          background-color: #3367d6;
        }
        
        button.secondary {
          background-color: #f1f3f4;
          color: var(--text-color, #333333);
        }
        
        button.secondary:hover {
          background-color: #e8eaed;
        }
        
        button:disabled {
          background-color: #e0e0e0;
          color: #9e9e9e;
          cursor: not-allowed;
        }
        
        .completed-icon {
          color: var(--success-color, #34a853);
          margin-left: 10px;
        }
        
        /* Animation for step transitions */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        :host(.active) .step-container {
          animation: fadeIn 0.3s ease-out;
        }
        
        /* Slot for step-specific content */
        ::slotted(*) {
          margin-bottom: 15px;
        }
      </style>
      
      <div class="step-container">
        <div class="step-header">
          <div class="step-title">
            <div class="step-number">${this._stepNumber}</div>
            <span>${this._stepTitle}</span>
            <span class="completed-icon" style="display: none;">✓</span>
          </div>
          <div class="step-status"></div>
        </div>
        
        <div class="step-content">
          <slot></slot>
          
          <div class="step-navigation">
            <button class="secondary back-button" style="display: none;">Back</button>
            <button class="next-button">Next</button>
          </div>
        </div>
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
    // Dispatch event using event registry
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
    // Dispatch event using event registry
    this.dispatchEvent(new CustomEvent(STEP_NEXT, {
      bubbles: true,
      composed: true,
      detail: { stepNumber: this._stepNumber }
    }));
  }
  
  /**
   * Set the step as active or inactive
   * @param {boolean} active - Whether the step is active
   */
  setActive(active) {
    this._active = active;
    
    if (active) {
      this.classList.add('active');
    } else {
      this.classList.remove('active');
    }
  }
  
  /**
   * Set the step as completed or not
   * @param {boolean} completed - Whether the step is completed
   */
  setCompleted(completed) {
    this._completed = completed;
    
    // Update the UI
    const completedIcon = this.shadowRoot.querySelector('.completed-icon');
    if (completedIcon) {
      completedIcon.style.display = completed ? 'inline' : 'none';
    }
    
    // Dispatch event
    if (completed) {
      this.dispatchEvent(new CustomEvent('step-completed', {
        bubbles: true,
        composed: true,
        detail: { stepNumber: this._stepNumber }
      }));
    }
  }
  
  /**
   * Set the step number
   * @param {number} stepNumber - The step number
   */
  setStepNumber(stepNumber) {
    this._stepNumber = stepNumber;
    
    // Update the UI
    const stepNumberElement = this.shadowRoot.querySelector('.step-number');
    if (stepNumberElement) {
      stepNumberElement.textContent = stepNumber;
    }
  }
  
  /**
   * Set the step title
   * @param {string} title - The step title
   */
  setStepTitle(title) {
    this._stepTitle = title;
    
    // Update the UI
    const stepTitleElement = this.shadowRoot.querySelector('.step-title span');
    if (stepTitleElement) {
      stepTitleElement.textContent = title;
    }
  }
  
  /**
   * Set the step status
   * @param {string} status - The step status
   */
  setStatus(status) {
    // Update the UI
    const statusElement = this.shadowRoot.querySelector('.step-status');
    if (statusElement) {
      statusElement.textContent = status;
    }
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
  
  /**
   * Reset the step
   */
  reset() {
    this._completed = false;
    
    // Update the UI
    const completedIcon = this.shadowRoot.querySelector('.completed-icon');
    if (completedIcon) {
      completedIcon.style.display = 'none';
    }
    
    // Enable the next button
    this.enableNextButton(true);
  }
  
  /**
   * Check if the step is active
   * @returns {boolean} - Whether the step is active
   */
  isActive() {
    return this._active;
  }
  
  /**
   * Check if the step is completed
   * @returns {boolean} - Whether the step is completed
   */
  isCompleted() {
    return this._completed;
  }
  
  /**
   * Get the step number
   * @returns {number} - The step number
   */
  getStepNumber() {
    return this._stepNumber;
  }
}

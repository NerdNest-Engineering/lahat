/**
 * Step Header Component
 * Reusable header component for app creation steps
 */
export class StepHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Initialize properties
    this._stepNumber = 0;
    this._stepTitle = '';
    this._completed = false;
    
    // Create the template
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .step-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background-color: #f8f9fa;
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
          background-color: #4285f4;
          color: white;
          font-weight: 600;
          margin-right: 10px;
        }
        
        .step-status {
          font-size: 14px;
          color: #5f6368;
        }
        
        .completed-icon {
          color: var(--success-color, #34a853);
          margin-left: 10px;
        }
      </style>
      
      <div class="step-header">
        <div class="step-title">
          <div class="step-number">${this._stepNumber}</div>
          <span>${this._stepTitle}</span>
          <span class="completed-icon" style="display: none;">✓</span>
        </div>
        <div class="step-status"></div>
      </div>
    `;
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

// Define the custom element
customElements.define('step-header', StepHeader);
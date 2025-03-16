/**
 * Base App Creation Step Component
 * Provides common functionality for all step components
 */

/**
 * AppCreationStep component
 * Base class for all step components in the app creation process
 */
export class AppCreationStep extends HTMLElement {
  /**
   * Start this step with data from the previous step
   * @param {Object} data - Data from the previous step
   */
  startStep(data = {}) {
    // Activate this step
    this.setActive(true);
    
    // Store the data for potential use by subclasses
    this._stepData = data;
  }
  
  /**
   * End this step
   */
  endStep() {
    this.setActive(false);
  }
  
  /**
   * Set the active state of this step
   * @param {boolean} active - Whether this step should be active
   */
  setActive(active) {
    if (active) {
      this.classList.add('active');
      this.classList.remove('hidden');
    } else {
      this.classList.remove('active');
      this.classList.add('hidden');
    }
  }
  
  /**
   * Complete this step and move to the next one
   * @param {Object} data - Data to pass to the next step
   */
  completeStep(data = {}) {
    this.dispatchEvent(new CustomEvent('step-complete', {
      bubbles: true,
      composed: true,
      detail: data
    }));
  }
  
  /**
   * Report an error in this step
   * @param {Error} error - The error that occurred
   */
  reportError(error) {
    this.dispatchEvent(new CustomEvent('step-error', {
      bubbles: true,
      composed: true,
      detail: { error }
    }));
  }
}

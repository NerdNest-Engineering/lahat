/**
 * Generation Status Component
 * Displays the status of generation operations
 */

/**
 * Generation Status Component
 * Displays a loading indicator and status message during generation operations
 */
export class GenerationStatus extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          justify-content: center;
          align-items: center;
        }
        
        .status-container {
          background-color: white;
          border-radius: var(--border-radius, 8px);
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          text-align: center;
          max-width: 400px;
          width: 90%;
        }
        
        .spinner {
          display: inline-block;
          width: 50px;
          height: 50px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: var(--primary-color, #4285f4);
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 15px;
        }
        
        .status-message {
          font-size: 18px;
          margin-bottom: 10px;
        }
        
        .status-details {
          font-size: 14px;
          color: #5f6368;
          margin-top: 10px;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        :host(.visible) {
          display: flex;
          animation: fadeIn 0.3s ease-out;
        }
      </style>
      
      <div class="status-container">
        <div class="spinner"></div>
        <div class="status-message">Processing...</div>
        <div class="status-details"></div>
      </div>
    `;
    
    // Initialize properties
    this._message = 'Processing...';
    this._details = '';
    this._visible = false;
  }
  
  /**
   * Show the status indicator with a message
   * @param {string} message - The status message
   * @param {string} details - Optional details
   */
  show(message = 'Processing...', details = '') {
    this._message = message;
    this._details = details;
    this._visible = true;
    
    // Update the UI
    this.shadowRoot.querySelector('.status-message').textContent = message;
    this.shadowRoot.querySelector('.status-details').textContent = details;
    
    // Show the component
    this.classList.add('visible');
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('status-shown', {
      bubbles: true,
      composed: true,
      detail: { message, details }
    }));
  }
  
  /**
   * Hide the status indicator
   */
  hide() {
    this._visible = false;
    
    // Hide the component
    this.classList.remove('visible');
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('status-hidden', {
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * Update the status message
   * @param {string} message - The new status message
   * @param {string} details - Optional details
   */
  updateMessage(message, details = '') {
    this._message = message;
    
    if (details) {
      this._details = details;
    }
    
    // Update the UI if visible
    if (this._visible) {
      this.shadowRoot.querySelector('.status-message').textContent = message;
      
      if (details) {
        this.shadowRoot.querySelector('.status-details').textContent = details;
      }
    }
  }
  
  /**
   * Update the status details
   * @param {string} details - The new status details
   */
  updateDetails(details) {
    this._details = details;
    
    // Update the UI if visible
    if (this._visible) {
      this.shadowRoot.querySelector('.status-details').textContent = details;
    }
  }
  
  /**
   * Check if the status indicator is visible
   * @returns {boolean} - True if visible, false otherwise
   */
  isVisible() {
    return this._visible;
  }
}

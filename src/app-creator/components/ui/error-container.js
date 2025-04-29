/**
 * Error Container Component
 * A container for displaying error messages in the UI
 */

import { ErrorLevel } from '../../utils/error-utils.js';

/**
 * Error Container Component
 * Displays error messages in the UI
 */
export class ErrorContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 400px;
        }
      </style>
      <slot></slot>
    `;
  }
  
  /**
   * Add an error message
   * @param {string} title - The error title
   * @param {string} message - The error message
   * @param {string} level - The error level (info, warning, error, fatal)
   * @returns {ErrorMessage} - The created error message element
   */
  addError(title, message, level = ErrorLevel.ERROR) {
    const errorElement = document.createElement('error-message');
    errorElement.setAttribute('title', title);
    errorElement.setAttribute('message', message);
    errorElement.setAttribute('level', level);
    this.appendChild(errorElement);
    return errorElement;
  }
  
  /**
   * Clear all error messages
   */
  clearErrors() {
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
  }
}

/**
 * Error Message Component
 * Displays a single error message
 */
export class ErrorMessage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 10px;
        }
        .error-message {
          background-color: #ffebee;
          border-left: 4px solid #f44336;
          padding: 10px 15px;
          border-radius: var(--border-radius, 8px);
          position: relative;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.3s ease-out;
        }
        .error-message.warning {
          background-color: #fff8e1;
          border-left-color: #ffc107;
        }
        .error-message.info {
          background-color: #e3f2fd;
          border-left-color: #2196f3;
        }
        .error-message.fatal {
          background-color: #ffebee;
          border-left-color: #d50000;
          border-width: 6px;
        }
        .error-title {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .error-content {
          color: #5f6368;
        }
        .error-close {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #5f6368;
          padding: 0;
          line-height: 1;
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        .fade-out {
          animation: fadeOut 0.3s ease-out forwards;
        }
      </style>
      <div class="error-message">
        <div class="error-title"></div>
        <div class="error-content"></div>
        <button class="error-close">&times;</button>
      </div>
    `;
    
    // Set up event listeners
    this.shadowRoot.querySelector('.error-close').addEventListener('click', () => {
      this.remove();
    });
  }
  
  /**
   * Called when the element is added to the DOM
   */
  connectedCallback() {
    // Auto-dismiss non-fatal errors
    if (this.getAttribute('level') !== ErrorLevel.FATAL) {
      setTimeout(() => {
        if (this.isConnected) {
          // Add fade-out animation
          const errorElement = this.shadowRoot.querySelector('.error-message');
          errorElement.classList.add('fade-out');
          
          // Remove after animation completes
          setTimeout(() => {
            if (this.isConnected) {
              this.remove();
            }
          }, 300);
        }
      }, 5000);
    }
  }
  
  /**
   * Observed attributes for reactive updates
   */
  static get observedAttributes() {
    return ['title', 'message', 'level'];
  }
  
  /**
   * Called when an observed attribute changes
   * @param {string} name - The attribute name
   * @param {string} oldValue - The old attribute value
   * @param {string} newValue - The new attribute value
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'title') {
      this.shadowRoot.querySelector('.error-title').textContent = newValue;
    } else if (name === 'message') {
      this.shadowRoot.querySelector('.error-content').textContent = newValue;
    } else if (name === 'level') {
      const errorElement = this.shadowRoot.querySelector('.error-message');
      errorElement.className = `error-message ${newValue}`;
    }
  }
}

// Web Components Implementation for App Creation

// Import components from the app-creation module
import {
  AppCreationStep,
  AppCreationStepOne,
  AppCreationStepTwo,
  AppCreationStepThree,
  GenerationStatus,
  GenerationPreview,
  AppCreationController,
  showError
} from '../components/app-creation/index.js';

// Define error handling components
class ErrorContainer extends HTMLElement {
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
  
  // Public method to add an error
  addError(title, message, level = 'error') {
    const errorElement = document.createElement('error-message');
    errorElement.setAttribute('title', title);
    errorElement.setAttribute('message', message);
    errorElement.setAttribute('level', level);
    this.appendChild(errorElement);
    return errorElement;
  }
}

class ErrorMessage extends HTMLElement {
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
        }
        .error-message.warning {
          background-color: #fff8e1;
          border-left-color: #ffc107;
        }
        .error-message.info {
          background-color: #e3f2fd;
          border-left-color: #2196f3;
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
  
  // Lifecycle callbacks
  connectedCallback() {
    // Auto-dismiss non-fatal errors
    if (this.getAttribute('level') !== 'fatal') {
      setTimeout(() => {
        if (this.isConnected) {
          this.remove();
        }
      }, 5000);
    }
  }
  
  // Observed attributes for reactive updates
  static get observedAttributes() {
    return ['title', 'message', 'level'];
  }
  
  // Attribute changed callback
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

// Ensure components are registered
if (!customElements.get('app-creation-step')) {
  customElements.define('app-creation-step', AppCreationStep);
}

if (!customElements.get('app-creation-step-one')) {
  customElements.define('app-creation-step-one', AppCreationStepOne);
}

if (!customElements.get('app-creation-step-two')) {
  customElements.define('app-creation-step-two', AppCreationStepTwo);
}

if (!customElements.get('app-creation-step-three')) {
  customElements.define('app-creation-step-three', AppCreationStepThree);
}

if (!customElements.get('generation-status')) {
  customElements.define('generation-status', GenerationStatus);
}

if (!customElements.get('generation-preview')) {
  customElements.define('generation-preview', GenerationPreview);
}

if (!customElements.get('error-container')) {
  customElements.define('error-container', ErrorContainer);
}

if (!customElements.get('error-message')) {
  customElements.define('error-message', ErrorMessage);
}

// Initialize the app controller when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create error container if it doesn't exist
  if (!document.querySelector('error-container')) {
    const errorContainer = document.createElement('error-container');
    document.body.appendChild(errorContainer);
  }
  
  // Initialize the app controller
  new AppCreationController();
});

import { BaseComponent } from '../base-component.js';

/**
 * ErrorMessage component
 * Displays an error message with a title, content, and close button
 */
export class ErrorMessage extends BaseComponent {
  constructor() {
    super();
    
    const styles = `
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
    `;
    
    const html = `
      <div class="error-message">
        <div class="error-title"></div>
        <div class="error-content"></div>
        <button class="error-close">&times;</button>
      </div>
    `;
    
    this.render(html, styles);
    
    // Set up event listeners
    this.shadowRoot.querySelector('.error-close').addEventListener('click', () => {
      this.remove();
    });
  }
  
  /**
   * Lifecycle callback when the element is connected to the DOM
   */
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
  
  /**
   * Define observed attributes for reactive updates
   */
  static get observedAttributes() {
    return ['title', 'message', 'level'];
  }
  
  /**
   * Lifecycle callback when an observed attribute changes
   * @param {string} name - Attribute name
   * @param {string} oldValue - Old attribute value
   * @param {string} newValue - New attribute value
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

// Register the custom element
customElements.define('error-message', ErrorMessage);

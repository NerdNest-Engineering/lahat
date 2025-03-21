import { BaseComponent } from '../base-component.js';

/**
 * ErrorContainer component
 * A container for error messages that appears in the top-right corner of the screen
 */
export class ErrorContainer extends BaseComponent {
  constructor() {
    super();
    
    const styles = `
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
    `;
    
    const html = `<slot></slot>`;
    
    this.render(html, styles);
  }
  
  /**
   * Adds an error message to the container
   * @param {string} title - Error title
   * @param {string} message - Error message
   * @param {string} level - Error level ('error', 'warning', 'info', 'fatal')
   * @returns {HTMLElement} - The created error message element
   */
  addError(title, message, level = 'error') {
    const errorElement = document.createElement('error-message');
    errorElement.setAttribute('title', title);
    errorElement.setAttribute('message', message);
    errorElement.setAttribute('level', level);
    this.appendChild(errorElement);
    return errorElement;
  }
}

// Register the custom element
customElements.define('error-container', ErrorContainer);

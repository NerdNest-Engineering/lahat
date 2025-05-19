/**
 * Generic Component
 * 
 * A simple, customizable web component that can be used inside LahatCell containers.
 * This component provides visual feedback about its dimensions and position,
 * making it useful for testing and development of LahatCell layouts.
 */

// Define the GenericComponent class
class GenericComponent extends HTMLElement {
  constructor() {
    super();
    
    // Create a shadow DOM for the component
    this.attachShadow({ mode: 'open' });
    
    // Default properties
    this._title = 'Generic Component';
    this._content = 'This is a generic component for testing LahatCell layouts';
    this._backgroundColor = '#f0f0f0';
    this._borderColor = '#cccccc';
    this._textColor = '#333333';
    this._width = '100%';
    this._height = '100%';
    
    // Render the component
    this._render();
  }
  
  /**
   * Called when the element is added to the DOM
   */
  connectedCallback() {
    // Set a random background color if none is specified
    if (!this.hasAttribute('background-color')) {
      this.setAttribute('background-color', this._getRandomColor());
    }
    
    // Add resize observer to update dimensions display
    this._setupResizeObserver();
    
    // Update dimensions display
    this._updateDimensions();
  }
  
  /**
   * Called when the element is removed from the DOM
   */
  disconnectedCallback() {
    // Disconnect resize observer
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
  }
  
  /**
   * Define which attributes to observe
   */
  static get observedAttributes() {
    return [
      'title', 
      'content', 
      'background-color', 
      'border-color', 
      'text-color',
      'width',
      'height'
    ];
  }
  
  /**
   * Called when observed attributes change
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'title':
        this._title = newValue;
        break;
      case 'content':
        this._content = newValue;
        break;
      case 'background-color':
        this._backgroundColor = newValue;
        break;
      case 'border-color':
        this._borderColor = newValue;
        break;
      case 'text-color':
        this._textColor = newValue;
        break;
      case 'width':
        this._width = newValue;
        break;
      case 'height':
        this._height = newValue;
        break;
    }
    
    // Re-render the component
    this._render();
  }
  
  /**
   * Set up resize observer to update dimensions display
   */
  _setupResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(entries => {
        this._updateDimensions();
      });
      
      this._resizeObserver.observe(this);
    }
  }
  
  /**
   * Update dimensions display
   */
  _updateDimensions() {
    const dimensionsElement = this.shadowRoot.querySelector('.dimensions');
    if (dimensionsElement) {
      const width = Math.round(this.offsetWidth);
      const height = Math.round(this.offsetHeight);
      dimensionsElement.textContent = `${width}px × ${height}px`;
    }
  }
  
  /**
   * Generate a random color
   */
  _getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
  }
  
  /**
   * Render the component
   */
  _render() {
    // Define the component's HTML and CSS
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: ${this._width};
          height: ${this._height};
          box-sizing: border-box;
        }
        
        .container {
          width: 100%;
          height: 100%;
          background-color: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          color: rgba(0, 0, 0, 0.7);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        }
        
        .title {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          color: rgba(0, 0, 0, 0.8);
        }
        
        .content {
          flex: 1;
          overflow: auto;
          font-size: 14px;
          line-height: 1.5;
          color: rgba(0, 0, 0, 0.6);
        }
        
        .dimensions {
          position: absolute;
          bottom: 8px;
          right: 8px;
          font-size: 10px;
          color: rgba(0, 0, 0, 0.4);
          padding: 2px 6px;
          border-radius: 4px;
          pointer-events: none;
        }
        
        .content-wrapper {
          position: relative;
          height: 100%;
        }
        
        button {
          margin-top: 10px;
          padding: 6px 12px;
          background-color: rgba(66, 133, 244, 0.1);
          color: rgba(66, 133, 244, 0.9);
          border: 1px solid rgba(66, 133, 244, 0.2);
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
          backdrop-filter: blur(4px);
        }
        
        button:hover {
          background-color: rgba(66, 133, 244, 0.2);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }
      </style>
      
      <div class="container">
        <div class="content-wrapper">
          <div class="title">${this._title}</div>
          <div class="content">${this._content}</div>
          <button class="action-button">Interact</button>
        </div>
        <div class="dimensions">0px × 0px</div>
      </div>
    `;
    
    // Add event listener to the button
    const button = this.shadowRoot.querySelector('.action-button');
    if (button) {
      button.addEventListener('click', () => {
        this._handleButtonClick();
      });
    }
    
    // Update dimensions
    this._updateDimensions();
  }
  
  /**
   * Handle button click
   */
  _handleButtonClick() {
    // Create and dispatch a custom event
    const event = new CustomEvent('generic-component-action', {
      bubbles: true,
      composed: true,
      detail: {
        source: this,
        timestamp: Date.now(),
        action: 'button-click'
      }
    });
    
    this.dispatchEvent(event);
    
    // Change background color
    this.setAttribute('background-color', this._getRandomColor());
  }
  
  // Public API
  
  /**
   * Set the title
   */
  setTitle(title) {
    this.setAttribute('title', title);
  }
  
  /**
   * Set the content
   */
  setContent(content) {
    this.setAttribute('content', content);
  }
  
  /**
   * Set the background color
   */
  setBackgroundColor(color) {
    this.setAttribute('background-color', color);
  }
  
  /**
   * Set the border color
   */
  setBorderColor(color) {
    this.setAttribute('border-color', color);
  }
  
  /**
   * Set the text color
   */
  setTextColor(color) {
    this.setAttribute('text-color', color);
  }
}

// Register the component
customElements.define('generic-component', GenericComponent);

/**
 * Lahat Window Component
 * A reusable window component with title bar and content area.
 * Includes proper padding for OS window controls to prevent overlap.
 */
export class LahatWindow extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Set up the shadow DOM content
    this.shadowRoot.innerHTML = `
      <style>
        /* Container styles */
        .lahat-window-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background-color: var(--background-color, #fff);
        }
        
        /* Title bar styles */
        .titlebar-internal {
          height: 30px;
          background-color: var(--primary-color, #4285f4);
          color: white;
          display: flex;
          align-items: center;
          padding: 0 15px 0 75px; /* top right bottom left - 75px left padding for OS controls */
          font-weight: 500;
          -webkit-app-region: drag;
          position: relative;
          z-index: 999;
          flex-shrink: 0;
        }
        
        /* Title text styles */
        #title-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        /* Content area styles */
        .content-internal {
          flex: 1;
          overflow-y: auto;
          position: relative;
          padding: 20px; /* Default content padding */
        }
      </style>
      
      <div class="lahat-window-container">
        <div class="titlebar-internal">
          <span id="title-text"></span>
        </div>
        <div class="content-internal">
          <slot></slot>
        </div>
      </div>
    `;
    
    // Get reference to the title text element
    this._titleTextElement = this.shadowRoot.querySelector('#title-text');
  }
  
  /**
   * Called when the element is connected to the DOM
   */
  connectedCallback() {
    this._updateTitle();
  }
  
  /**
   * Called when observed attributes change
   * @param {string} name - The name of the attribute
   * @param {string} oldValue - The old value
   * @param {string} newValue - The new value
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'window-title') {
      this._updateTitle();
    }
  }
  
  /**
   * The attributes to observe for changes
   * @returns {string[]} - The list of attribute names to observe
   */
  static get observedAttributes() {
    return ['window-title'];
  }
  
  /**
   * Update the title text
   * @private
   */
  _updateTitle() {
    const title = this.getAttribute('window-title') || 'Lahat Window';
    if (this._titleTextElement) {
      this._titleTextElement.textContent = title;
    }
  }
}

// Define the custom element
customElements.define('lahat-window', LahatWindow);
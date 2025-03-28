/**
 * Navigation Controls Web Component
 * 
 * This component provides navigation controls for the app list, including
 * buttons for Mini Apps, Create, and Settings.
 */
export class NavigationControls extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this._initializeDOM();
    this._setupEventListeners();
  }
  
  /**
   * Initialize the DOM structure
   * @private
   */
  _initializeDOM() {
    this.shadowRoot.innerHTML = `
      <style>        
        .widget-controls {
          display: flex;
          flex-direction: row;
          gap: 10px;
          flex-wrap: wrap;
          width: 100%;
        }
      </style>
      
      <div class="widget-controls">
        <button id="api-settings-button" class="secondary" data-action="api-settings">API Settings</button>
        <button id="dashboards-button" class="primary" data-action="dashboards">Dashboards</button>
        <button id="create-widget-button" class="primary" data-action="create-app">Create New App</button>
        <button id="import-widget-button" data-action="import-app">Import App</button>
        <button id="refresh-widgets-button" data-action="refresh">Refresh</button>
        <button id="open-widget-directory-button" data-action="open-directory">Open App Directory</button>
      </div>
    `;
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // Add click event listeners to all buttons 
    const buttons = this.shadowRoot.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('click', this._handleActionClick.bind(this));
    });
  }
  
  /**
   * Handle action button clicks
   * @param {Event} event - The click event
   * @private
   */
  _handleActionClick(event) {
    const action = event.target.dataset.action;
    
    // Dispatch action event
    this.dispatchEvent(new CustomEvent('action', {
      bubbles: true,
      composed: true,
      detail: { action }
    }));
  }
  
  /**
   * Handle search input
   * @param {Event} event - The input event
   * @private
   */
  _handleSearchInput(event) {
    const query = event.target.value;
    
    // Dispatch search event
    this.dispatchEvent(new CustomEvent('search', {
      bubbles: true,
      composed: true,
      detail: { query }
    }));
  }
  
  /**
   * Called when the element is connected to the DOM
   */
  connectedCallback() {
    console.log('NavigationControls connected to DOM');
  }
  
  /**
   * Called when the element is disconnected from the DOM
   */
  disconnectedCallback() {
    console.log('NavigationControls disconnected from DOM');
    
    // Clean up event listeners if needed
    const buttons = this.shadowRoot.querySelectorAll('button');
    buttons.forEach(button => {
      button.removeEventListener('click', this._handleActionClick);
    });
  }
}

// Register the custom element
customElements.define('navigation-controls', NavigationControls);

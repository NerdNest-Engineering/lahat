/**
 * Simplified Base component class for mini apps
 * Provides common functionality for web components
 */

export class BaseComponent extends HTMLElement {
  /**
   * Create a new BaseComponent instance
   */
  constructor() {
    super();
    
    // Attach shadow DOM
    this.attachShadow({ mode: 'open' });
    
    // Setup component state
    this._connected = false;
    this._initialized = false;
    this._props = {};
  }
  
  /**
   * Called when the component is first connected to the DOM
   */
  connectedCallback() {
    this._connected = true;
    
    try {
      // Initialize once if not already initialized
      if (!this._initialized) {
        this.initialize();
        this._initialized = true;
      }
      
      // Call connect hook
      this.onConnected();
    } catch (error) {
      console.error(`Error connecting component ${this.constructor.name}:`, error);
      this.handleError(error);
    }
  }
  
  /**
   * Called when the component is disconnected from the DOM
   */
  disconnectedCallback() {
    try {
      this._connected = false;
      
      // Call disconnect hook
      this.onDisconnected();
    } catch (error) {
      console.error(`Error disconnecting component ${this.constructor.name}:`, error);
    }
  }
  
  /**
   * Initialize component (called once)
   * Override in subclass
   */
  initialize() {
    // Override in subclass
  }
  
  /**
   * Connected callback (called each time component is connected)
   * Override in subclass
   */
  onConnected() {
    // Override in subclass
  }
  
  /**
   * Disconnected callback
   * Override in subclass
   */
  onDisconnected() {
    // Override in subclass
  }
  
  /**
   * Handle component errors
   * @param {Error} error - Error to handle
   */
  handleError(error) {
    console.error(`Error in component ${this.constructor.name}:`, error);
    
    // Emit error event for parent components to handle
    this.emit('component-error', {
      error,
      component: this.constructor.name,
      element: this
    });
  }
  
  /**
   * Set a property value
   * @param {string} name - Property name
   * @param {any} value - Property value
   * @returns {any} - Set value (for chaining)
   */
  setProp(name, value) {
    this._props[name] = value;
    
    // Reflect to attribute for primitive values
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      this.setAttribute(`prop-${name}`, value.toString());
    }
    
    return value;
  }
  
  /**
   * Get a property value
   * @param {string} name - Property name
   * @param {any} defaultValue - Default value if property is not set
   * @returns {any} - Property value
   */
  getProp(name, defaultValue = undefined) {
    return this._props[name] !== undefined ? this._props[name] : defaultValue;
  }
  
  /**
   * Helper method to render HTML and CSS in the shadow DOM
   * @param {string} html - HTML template
   * @param {string} styles - CSS styles
   */
  render(html, styles) {
    // Get a reference to rendered content before updating
    // to try to preserve focus and selection where possible
    const activeElement = this.shadowRoot.activeElement;
    const selectionStart = activeElement?.selectionStart;
    const selectionEnd = activeElement?.selectionEnd;
    
    // Update shadow DOM content
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${html}
    `;
    
    // Try to restore focus and selection if possible
    if (activeElement) {
      const newElement = this.shadowRoot.querySelector(`#${activeElement.id}`);
      if (newElement && typeof newElement.focus === 'function') {
        newElement.focus();
        if (typeof newElement.setSelectionRange === 'function' && 
            selectionStart !== undefined && 
            selectionEnd !== undefined) {
          newElement.setSelectionRange(selectionStart, selectionEnd);
        }
      }
    }
  }
  
  /**
   * Helper to dispatch custom events
   * @param {string} eventName - Name of the event to dispatch
   * @param {Object} detail - Event detail object
   * @returns {boolean} - Whether the event was canceled
   */
  emit(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      bubbles: true,
      composed: true,
      detail
    });
    return this.dispatchEvent(event);
  }
  
  /**
   * Get a reference to an element in the shadow DOM
   * @param {string} selector - CSS selector
   * @returns {Element} - Element or null if not found
   */
  $(selector) {
    return this.shadowRoot.querySelector(selector);
  }
  
  /**
   * Get all elements matching a selector in the shadow DOM
   * @param {string} selector - CSS selector
   * @returns {NodeList} - NodeList of matching elements
   */
  $$(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }
  
  /**
   * Check if this component is connected to the DOM
   * @returns {boolean} - True if connected
   */
  get isConnected() {
    return this._connected;
  }
  
  /**
   * Get all current props
   * @returns {Object} - Props object
   */
  get props() {
    return { ...this._props };
  }
}
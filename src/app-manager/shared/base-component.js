/**
 * Base component class for app-manager module
 * Provides common functionality for web components including:
 * - Lifecycle management
 * - Event handling with automatic cleanup
 * - Resource tracking and cleanup
 * - DOM helper methods
 * - State management
 */

/**
 * Base component that provides common functionality for app-manager web components
 * @extends HTMLElement
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
    this._state = {};
    
    // Create cleanup tracker
    this._cleanup = new Set();
    
    // Store component name for later attribute setting
    this._componentName = this.constructor.name;
  }
  
  /**
   * List of attributes to observe for changes
   * Override in subclass to observe specific attributes
   * @returns {string[]} - Array of attribute names to observe
   */
  static get observedAttributes() {
    return [];
  }
  
  /**
   * Called when the component is first connected to the DOM
   * Handles initialization and connection logic
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
      
      // Set debug and tracking attributes (safe to do after connection)
      this.setAttribute('data-component', this._componentName);
      this.setAttribute('data-event-tracked', 'true');
      this.setAttribute('data-connected', 'true');
    } catch (error) {
      console.error(`Error connecting component ${this.constructor.name}:`, error);
      this.handleError(error);
    }
  }
  
  /**
   * Called when the component is disconnected from the DOM
   * Handles cleanup of resources and event listeners
   */
  disconnectedCallback() {
    try {
      this._connected = false;
      
      // Call disconnect hook
      this.onDisconnected();
      
      // Clean up all resources
      this._cleanup.forEach(cleanupFn => {
        try {
          cleanupFn();
        } catch (error) {
          console.error(`Error during cleanup in ${this.constructor.name}:`, error);
        }
      });
      this._cleanup.clear();
      
      // Remove tracking attributes
      this.removeAttribute('data-connected');
    } catch (error) {
      console.error(`Error disconnecting component ${this.constructor.name}:`, error);
    }
  }
  
  /**
   * Called when observed attributes change
   * @param {string} name - Attribute name
   * @param {string} oldValue - Old attribute value
   * @param {string} newValue - New attribute value
   */
  attributeChangedCallback(name, oldValue, newValue) {
    // Skip if values are the same
    if (oldValue === newValue) return;
    
    try {
      // Update props if this is a prop attribute
      if (name.startsWith('prop-')) {
        const propName = name.slice(5); // Remove 'prop-' prefix
        this._props[propName] = this._parseAttributeValue(newValue);
      }
      
      // Call attribute changed hook
      this.onAttributeChanged(name, oldValue, newValue);
    } catch (error) {
      console.error(`Error in attributeChangedCallback for ${name}:`, error);
      this.handleError(error);
    }
  }
  
  /**
   * Parse attribute value based on type hints
   * @param {string} value - Attribute value to parse
   * @returns {any} - Parsed value
   * @private
   */
  _parseAttributeValue(value) {
    if (value === null || value === undefined) return value;
    
    // Try to parse as JSON if it looks like an object or array
    if ((value.startsWith('{') && value.endsWith('}')) || 
        (value.startsWith('[') && value.endsWith(']'))) {
      try {
        return JSON.parse(value);
      } catch (e) {
        // If parsing fails, return the string value
        return value;
      }
    }
    
    // Parse booleans
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Parse numbers
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      const num = parseFloat(value);
      return Number.isNaN(num) ? value : num;
    }
    
    // Return original string for all other cases
    return value;
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
   * Attribute changed callback
   * Override in subclass
   * @param {string} name - Attribute name
   * @param {string} oldValue - Old attribute value
   * @param {string} newValue - New attribute value
   */
  onAttributeChanged(name, oldValue, newValue) {
    // Override in subclass
  }
  
  /**
   * Handle component errors
   * @param {Error} error - Error to handle
   */
  handleError(error) {
    console.error(`Error in component ${this.constructor.name}`, error);
    
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
    
    // Trigger render if component is already connected and initialized
    if (this._connected && this._initialized) {
      this._renderIfNeeded();
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
   * Set state value
   * @param {string|Object} key - State key or state object
   * @param {any} value - State value (if key is string)
   */
  setState(key, value) {
    if (typeof key === 'object') {
      Object.assign(this._state, key);
    } else {
      this._state[key] = value;
    }
    
    // Trigger render if component is already connected and initialized
    if (this._connected && this._initialized) {
      this._renderIfNeeded();
    }
  }
  
  /**
   * Get state value
   * @param {string} key - State key
   * @param {any} defaultValue - Default value if state is not set
   * @returns {any} - State value
   */
  getState(key, defaultValue = undefined) {
    return this._state[key] !== undefined ? this._state[key] : defaultValue;
  }
  
  /**
   * Trigger render if the component has a render method
   * Uses requestAnimationFrame for better performance
   * @private
   */
  _renderIfNeeded() {
    if (typeof this.render === 'function') {
      // Only re-render if connected to the DOM
      if (!this._connected) return;
      
      // Use requestAnimationFrame to batch rendering
      if (!this._renderPending) {
        this._renderPending = true;
        
        requestAnimationFrame(() => {
          if (this._connected) { // Check again in case component was disconnected
            try {
              this.render();
            } catch (error) {
              console.error(`Error rendering component ${this.constructor.name}:`, error);
              this.handleError(error);
            } finally {
              this._renderPending = false;
            }
          }
        });
      }
    }
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
   * Safe event listener that will be automatically cleaned up
   * @param {EventTarget} element - Element to add listener to
   * @param {string} type - Event type
   * @param {Function} listener - Event listener function
   * @param {Object} options - Event listener options
   * @returns {Function} - Cleanup function
   */
  addEventListener(element, type, listener, options = {}) {
    if (!element) {
      console.warn(`Attempted to add event listener to null/undefined element in ${this.constructor.name}`);
      return () => {};
    }
    
    element.addEventListener(type, listener, options);
    
    const cleanup = () => {
      element.removeEventListener(type, listener, options);
    };
    
    this._cleanup.add(cleanup);
    return cleanup;
  }
  
  /**
   * Add event listener with automatic cleanup tracking
   * @param {string} selector - CSS selector for element
   * @param {string} type - Event type
   * @param {Function} listener - Event listener function
   * @param {Object} options - Event listener options
   */
  addListener(selector, type, listener, options = {}) {
    const element = this.safeQuery(selector);
    if (element) {
      return this.addEventListener(element, type, listener, options);
    }
    return () => {};
  }
  
  /**
   * Create a timeout that will be automatically cleared on disconnection
   * @param {Function} callback - Callback function
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} - Cleanup function
   */
  setTimeout(callback, delay) {
    const timeoutId = setTimeout(callback.bind(this), delay);
    const cleanup = () => clearTimeout(timeoutId);
    this._cleanup.add(cleanup);
    return cleanup;
  }
  
  /**
   * Create an interval that will be automatically cleared on disconnection
   * @param {Function} callback - Callback function
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} - Cleanup function
   */
  setInterval(callback, delay) {
    const intervalId = setInterval(callback.bind(this), delay);
    const cleanup = () => clearInterval(intervalId);
    this._cleanup.add(cleanup);
    return cleanup;
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
   * Safe query selector that won't throw errors
   * @param {string} selector - CSS selector
   * @returns {Element|null} - Element or null if not found
   */
  safeQuery(selector) {
    try {
      return this.shadowRoot.querySelector(selector);
    } catch (error) {
      console.warn(`Invalid selector "${selector}" in ${this.constructor.name}:`, error);
      return null;
    }
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
  
  /**
   * Get all current state
   * @returns {Object} - State object
   */
  get state() {
    return { ...this._state };
  }
}
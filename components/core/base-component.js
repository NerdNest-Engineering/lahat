/**
 * Base component class that all other components will extend.
 * Provides common functionality for web components.
 */
export class BaseComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._connected = false;
    this._initialized = false;
    this._eventListeners = new Map();
  }
  
  /**
   * Called when the component is first connected to the DOM
   */
  connectedCallback() {
    this._connected = true;
    
    if (!this._initialized) {
      this.initialize();
      this._initialized = true;
    }
    
    this.onConnected();
  }
  
  /**
   * Called when the component is disconnected from the DOM
   */
  disconnectedCallback() {
    this._connected = false;
    this.onDisconnected();
    
    // Clean up event listeners
    this._eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ type, listener, options }) => {
        element.removeEventListener(type, listener, options);
      });
    });
    this._eventListeners.clear();
  }
  
  /**
   * Called when attributes change
   * @param {string} name - Attribute name
   * @param {string} oldValue - Old attribute value
   * @param {string} newValue - New attribute value
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.onAttributeChanged(name, oldValue, newValue);
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
   * Helper method to render HTML and CSS in the shadow DOM
   * @param {string} html - HTML template
   * @param {string} styles - CSS styles
   */
  render(html, styles) {
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${html}
    `;
  }
  
  /**
   * Helper for event delegation
   * @param {string} selector - CSS selector to match target elements
   * @param {string} eventType - Event type to listen for
   * @param {Function} handler - Event handler function
   */
  addEventDelegate(selector, eventType, handler) {
    const listener = (event) => {
      const target = event.target.closest(selector);
      if (target) handler.call(this, event, target);
    };
    
    this.shadowRoot.addEventListener(eventType, listener);
    
    // Track the event listener for cleanup
    this.trackEventListener(this.shadowRoot, eventType, listener);
  }
  
  /**
   * Safe event listener that will be automatically cleaned up
   * @param {EventTarget} element - Element to add listener to
   * @param {string} type - Event type
   * @param {Function} listener - Event listener
   * @param {Object} options - Event listener options
   */
  addEventListener(element, type, listener, options = {}) {
    element.addEventListener(type, listener, options);
    this.trackEventListener(element, type, listener, options);
  }
  
  /**
   * Track an event listener for cleanup
   * @param {EventTarget} element - Element with listener
   * @param {string} type - Event type
   * @param {Function} listener - Event listener
   * @param {Object} options - Event listener options
   */
  trackEventListener(element, type, listener, options = {}) {
    if (!this._eventListeners.has(element)) {
      this._eventListeners.set(element, []);
    }
    
    this._eventListeners.get(element).push({ type, listener, options });
  }
  
  /**
   * Helper to dispatch custom events
   * @param {string} eventName - Name of the event to dispatch
   * @param {Object} detail - Event detail object
   */
  emit(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      bubbles: true,
      composed: true,
      detail
    });
    this.dispatchEvent(event);
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
}

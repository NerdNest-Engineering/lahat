/**
 * Base component class that all other components will extend.
 * Provides common functionality for web components including:
 * - Lifecycle management
 * - Event handling with automatic cleanup
 * - Resource tracking and cleanup
 * - DOM helper methods
 * - Performance measurement
 */

// Determine if we're in a browser environment
const isBrowser = typeof process === 'undefined' || !process.versions || !process.versions.electron;

// Import the appropriate resource tracker based on environment
import { ResourceTracker, ResourceType } from '../../modules/utils/browser-resource-tracker.js';
import { PerformanceTracker } from '../../modules/utils/performanceUtils.js';
// Import the appropriate logger based on environment
import browserLogger from '../../modules/utils/browser-logger.js';
const logger = browserLogger;
import { debounce, throttle } from '../../modules/utils/performanceUtils.js';

/**
 * Base component that provides common functionality for web components
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
    
    // Create resource tracker for this component
    this._resources = new ResourceTracker(this.constructor.name);
    
    // Check if we're in Electron or browser environment
    // Safely check for development mode without assuming process exists
    const isDevelopment = typeof window !== 'undefined' && 
                         window.location && 
                         window.location.hostname === 'localhost';
    
    // Create performance tracker for this component in development mode
    this._performance = new PerformanceTracker(
      this.constructor.name,
      isDevelopment
    );
    
    // Set DEBUG attribute for easier identification in DevTools
    if (isDevelopment) {
      this.setAttribute('data-component', this.constructor.name);
    }
    
    // Mark this element for better event listener tracking
    this.setAttribute('data-event-tracked', 'true');
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
    const perfMark = this._performance.start('connectedCallback');
    
    this._connected = true;
    
    try {
      // Initialize once if not already initialized
      if (!this._initialized) {
        const initPerfMark = this._performance.start('initialize');
        try {
          this.initialize();
          this._initialized = true;
        } finally {
          this._performance.stop(initPerfMark);
        }
      }
      
      // Call connect hook
      this.onConnected();
      
      // Set attribute for tracking
      this.setAttribute('data-connected', 'true');
    } catch (error) {
      console.error(`Error connecting component ${this.constructor.name}:`, error);
      this.handleError(error);
    } finally {
      this._performance.stop(perfMark);
    }
  }
  
  /**
   * Called when the component is disconnected from the DOM
   * Handles cleanup of resources and event listeners
   */
  disconnectedCallback() {
    const perfMark = this._performance.start('disconnectedCallback');
    
    try {
      this._connected = false;
      
      // Call disconnect hook
      this.onDisconnected();
      
      // Clean up all resources
      this._resources.releaseAll().catch(error => {
        console.error(`Error releasing resources in ${this.constructor.name}:`, error);
      });
      
      // Log performance metrics in development mode
      // Use the same development check as in constructor
      if (typeof window !== 'undefined' && 
          window.location && 
          window.location.hostname === 'localhost') {
        this._performance.logMeasurements(true);
      }
      
      // Remove tracking attributes
      this.removeAttribute('data-connected');
    } catch (error) {
      console.error(`Error disconnecting component ${this.constructor.name}:`, error);
    } finally {
      this._performance.stop(perfMark);
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
    
    const perfMark = this._performance.start(`attributeChanged:${name}`);
    
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
    } finally {
      this._performance.stop(perfMark);
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
    logger.error(`Error in component ${this.constructor.name}`, error, 'BaseComponent');
    
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
            const perfMark = this._performance.start('render');
            try {
              this.render();
            } catch (error) {
              console.error(`Error rendering component ${this.constructor.name}:`, error);
              this.handleError(error);
            } finally {
              this._performance.stop(perfMark);
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
   * Helper for event delegation
   * @param {string} selector - CSS selector to match target elements
   * @param {string} eventType - Event type to listen for
   * @param {Function} handler - Event handler function
   * @param {Object} options - Event listener options
   * @returns {string} - Resource ID for this event listener
   */
  addEventDelegate(selector, eventType, handler, options = {}) {
    const listener = (event) => {
      const target = event.target.closest(selector);
      if (target) handler.call(this, event, target);
    };
    
    this.shadowRoot.addEventListener(eventType, listener, options);
    
    // Track the event listener for cleanup
    return this._resources.trackEventListener(this.shadowRoot, eventType, listener, options);
  }
  
  /**
   * Safe event listener that will be automatically cleaned up
   * @param {EventTarget} element - Element to add listener to
   * @param {string} type - Event type
   * @param {Function} listener - Event listener function
   * @param {Object} options - Event listener options
   * @returns {string} - Resource ID for this event listener
   */
  addEventListener(element, type, listener, options = {}) {
    if (!element) {
      console.warn(`Attempted to add event listener to null/undefined element in ${this.constructor.name}`);
      return null;
    }
    
    element.addEventListener(type, listener, options);
    return this._resources.trackEventListener(element, type, listener, options);
  }
  
  /**
   * Create and return a debounced version of a function
   * Automatically tracked for cleanup
   * @param {Function} fn - Function to debounce
   * @param {number} wait - Debounce wait time in milliseconds
   * @returns {Function} - Debounced function
   */
  debounce(fn, wait = 100) {
    return debounce(fn.bind(this), wait);
  }
  
  /**
   * Create and return a throttled version of a function
   * Automatically tracked for cleanup
   * @param {Function} fn - Function to throttle
   * @param {number} limit - Throttle limit in milliseconds
   * @returns {Function} - Throttled function
   */
  throttle(fn, limit = 100) {
    return throttle(fn.bind(this), limit);
  }
  
  /**
   * Create a timeout that will be automatically cleared on disconnection
   * @param {Function} callback - Callback function
   * @param {number} delay - Delay in milliseconds
   * @returns {string} - Resource ID for this timeout
   */
  setTimeout(callback, delay) {
    const timeoutId = setTimeout(callback.bind(this), delay);
    return this._resources.trackTimeout(timeoutId, delay);
  }
  
  /**
   * Create an interval that will be automatically cleared on disconnection
   * @param {Function} callback - Callback function
   * @param {number} delay - Delay in milliseconds
   * @returns {string} - Resource ID for this interval
   */
  setInterval(callback, delay) {
    const intervalId = setInterval(callback.bind(this), delay);
    return this._resources.trackInterval(intervalId, delay);
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
  
  /**
   * Get performance metrics for this component
   * Only available in development mode
   * @returns {Object} - Performance metrics
   */
  getPerformanceMetrics() {
    return this._performance.getMeasurements();
  }
  
  /**
   * Get resource usage for this component
   * @returns {Object} - Resource usage stats
   */
  getResourceStats() {
    return this._resources.getStats();
  }
}

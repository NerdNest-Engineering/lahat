/**
 * Event Utilities
 * Utility functions for working with events in the app manager module
 */

/**
 * Create a custom event with the specified name and detail
 * @param {string} name - The event name
 * @param {any} detail - The event detail
 * @param {boolean} bubbles - Whether the event bubbles
 * @param {boolean} composed - Whether the event can cross shadow DOM boundaries
 * @returns {CustomEvent} - The custom event
 */
export function createCustomEvent(name, detail, bubbles = true, composed = true) {
  return new CustomEvent(name, {
    detail,
    bubbles,
    composed
  });
}

/**
 * Dispatch a custom event from the specified element
 * @param {HTMLElement} element - The element to dispatch the event from
 * @param {string} name - The event name
 * @param {any} detail - The event detail
 * @param {boolean} bubbles - Whether the event bubbles
 * @param {boolean} composed - Whether the event can cross shadow DOM boundaries
 * @returns {boolean} - Whether the event was canceled
 */
export function dispatchCustomEvent(element, name, detail, bubbles = true, composed = true) {
  const event = createCustomEvent(name, detail, bubbles, composed);
  return element.dispatchEvent(event);
}

/**
 * Add an event listener to the specified element
 * @param {HTMLElement} element - The element to add the listener to
 * @param {string} eventName - The event name
 * @param {Function} callback - The callback function
 * @param {boolean|Object} options - The event listener options
 * @returns {Function} - A function to remove the event listener
 */
export function addEventListenerWithCleanup(element, eventName, callback, options = false) {
  element.addEventListener(eventName, callback, options);
  
  return () => {
    element.removeEventListener(eventName, callback, options);
  };
}

/**
 * Add multiple event listeners to the specified element
 * @param {HTMLElement} element - The element to add the listeners to
 * @param {Object} listeners - An object mapping event names to callback functions
 * @param {boolean|Object} options - The event listener options
 * @returns {Function} - A function to remove all event listeners
 */
export function addMultipleEventListeners(element, listeners, options = false) {
  const cleanupFunctions = [];
  
  for (const [eventName, callback] of Object.entries(listeners)) {
    const cleanup = addEventListenerWithCleanup(element, eventName, callback, options);
    cleanupFunctions.push(cleanup);
  }
  
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
}

/**
 * Create an event proxy that forwards events from one element to another
 * @param {HTMLElement} source - The source element
 * @param {HTMLElement} target - The target element
 * @param {string[]} eventNames - The event names to proxy
 * @param {Function} [transformer] - Optional function to transform the event detail
 * @returns {Function} - A function to remove the event proxy
 */
export function createEventProxy(source, target, eventNames, transformer) {
  const listeners = {};
  
  for (const eventName of eventNames) {
    listeners[eventName] = (event) => {
      const detail = transformer ? transformer(event.detail, eventName) : event.detail;
      dispatchCustomEvent(target, eventName, detail, event.bubbles, event.composed);
    };
  }
  
  return addMultipleEventListeners(source, listeners);
}

/**
 * Create a debounced version of a function
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce wait time in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait) {
  let timeout;
  
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Create a throttled version of a function
 * @param {Function} func - The function to throttle
 * @param {number} limit - The throttle limit in milliseconds
 * @returns {Function} - The throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  
  return function(...args) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

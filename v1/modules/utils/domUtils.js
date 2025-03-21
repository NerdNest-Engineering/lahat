/**
 * DOM utility functions for renderer processes
 */

/**
 * Creates an element with attributes and children
 * @param {string} tagName - Tag name of the element
 * @param {Object} attributes - Attributes to set on the element
 * @param {Array|Node|string} children - Child elements or text content
 * @returns {HTMLElement} - Created element
 */
export function createElement(tagName, attributes = {}, children = []) {
  const element = document.createElement(tagName);
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.entries(value).forEach(([prop, val]) => {
        element.style[prop] = val;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Add children
  if (Array.isArray(children)) {
    children.forEach(child => {
      appendToElement(element, child);
    });
  } else {
    appendToElement(element, children);
  }
  
  return element;
}

/**
 * Appends a child to an element
 * @param {HTMLElement} element - Parent element
 * @param {Node|string} child - Child element or text content
 */
function appendToElement(element, child) {
  if (child === null || child === undefined) {
    return;
  }
  
  if (child instanceof Node) {
    element.appendChild(child);
  } else {
    element.appendChild(document.createTextNode(String(child)));
  }
}

/**
 * Removes all children from an element
 * @param {HTMLElement} element - Element to clear
 */
export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Adds event listeners to an element with automatic cleanup
 * @param {HTMLElement} element - Element to add listeners to
 * @param {Object} listeners - Map of event types to listener functions
 * @returns {Function} - Function to remove all listeners
 */
export function addEventListeners(element, listeners) {
  const attachedListeners = [];
  
  Object.entries(listeners).forEach(([eventType, listener]) => {
    element.addEventListener(eventType, listener);
    attachedListeners.push({ eventType, listener });
  });
  
  // Return cleanup function
  return () => {
    attachedListeners.forEach(({ eventType, listener }) => {
      element.removeEventListener(eventType, listener);
    });
  };
}

/**
 * Creates a debounced version of a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a throttled version of a function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Checks if an element is visible in the viewport
 * @param {HTMLElement} element - Element to check
 * @param {number} offset - Offset from viewport edges
 * @returns {boolean} - True if element is visible
 */
export function isElementInViewport(element, offset = 0) {
  const rect = element.getBoundingClientRect();
  
  return (
    rect.top >= 0 - offset &&
    rect.left >= 0 - offset &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + offset
  );
}

/**
 * Adds a class to an element if it doesn't already have it
 * @param {HTMLElement} element - Element to add class to
 * @param {string} className - Class to add
 */
export function addClass(element, className) {
  if (!element.classList.contains(className)) {
    element.classList.add(className);
  }
}

/**
 * Removes a class from an element if it has it
 * @param {HTMLElement} element - Element to remove class from
 * @param {string} className - Class to remove
 */
export function removeClass(element, className) {
  if (element.classList.contains(className)) {
    element.classList.remove(className);
  }
}

/**
 * Toggles a class on an element
 * @param {HTMLElement} element - Element to toggle class on
 * @param {string} className - Class to toggle
 * @param {boolean} force - Force add or remove
 */
export function toggleClass(element, className, force) {
  element.classList.toggle(className, force);
}

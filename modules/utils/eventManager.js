/**
 * Event Manager Module
 * Tracks and manages event listeners to prevent memory leaks
 */

import logger from './logger.js';

// Map to track event listeners
const eventListeners = new Map();

/**
 * Add an event listener with tracking
 * @param {EventTarget} element - The element to add event listener to
 * @param {string} eventType - The event type (e.g., 'click')
 * @param {Function} callback - The event callback function
 * @param {boolean|Object} options - Event listener options
 * @returns {Object} - Element and listener info for removal
 */
export function addSafeEventListener(element, eventType, callback, options = {}) {
  if (!element || !eventType || !callback) {
    logger.warn('Invalid parameters for addSafeEventListener', { element, eventType }, 'eventManager');
    return null;
  }

  try {
    // Create a unique ID for this listener
    const listenerId = generateListenerId();
    
    // Add the actual event listener
    element.addEventListener(eventType, callback, options);
    
    // Track the event listener
    if (!eventListeners.has(element)) {
      eventListeners.set(element, new Map());
    }
    
    const elementListeners = eventListeners.get(element);
    if (!elementListeners.has(eventType)) {
      elementListeners.set(eventType, new Map());
    }
    
    const eventTypeListeners = elementListeners.get(eventType);
    eventTypeListeners.set(listenerId, { callback, options });
    
    // Return info needed to remove this specific listener
    return { element, eventType, listenerId };
  } catch (error) {
    logger.error('Error adding safe event listener', error, 'eventManager');
    return null;
  }
}

/**
 * Remove a specific event listener
 * @param {Object} listenerInfo - The listener info from addSafeEventListener
 * @returns {boolean} - True if removed successfully
 */
export function removeSafeEventListener(listenerInfo) {
  if (!listenerInfo || !listenerInfo.element || !listenerInfo.eventType || !listenerInfo.listenerId) {
    return false;
  }
  
  const { element, eventType, listenerId } = listenerInfo;
  
  try {
    if (!eventListeners.has(element)) {
      return false;
    }
    
    const elementListeners = eventListeners.get(element);
    if (!elementListeners.has(eventType)) {
      return false;
    }
    
    const eventTypeListeners = elementListeners.get(eventType);
    if (!eventTypeListeners.has(listenerId)) {
      return false;
    }
    
    // Get the original callback and options
    const { callback, options } = eventTypeListeners.get(listenerId);
    
    // Remove the actual event listener
    element.removeEventListener(eventType, callback, options);
    
    // Remove from tracking
    eventTypeListeners.delete(listenerId);
    
    // Clean up empty maps
    if (eventTypeListeners.size === 0) {
      elementListeners.delete(eventType);
    }
    
    if (elementListeners.size === 0) {
      eventListeners.delete(element);
    }
    
    return true;
  } catch (error) {
    logger.error('Error removing safe event listener', error, 'eventManager');
    return false;
  }
}

/**
 * Remove all event listeners for an element
 * @param {EventTarget} element - The element to remove listeners from
 * @param {string} eventType - Optional event type to limit removal
 * @returns {boolean} - True if any listeners were removed
 */
export function removeAllSafeEventListeners(element, eventType = null) {
  if (!element) {
    return false;
  }
  
  try {
    if (!eventListeners.has(element)) {
      return false;
    }
    
    const elementListeners = eventListeners.get(element);
    let removed = false;
    
    if (eventType) {
      // Remove specific event type listeners
      if (elementListeners.has(eventType)) {
        const eventTypeListeners = elementListeners.get(eventType);
        
        for (const [_, { callback, options }] of eventTypeListeners.entries()) {
          element.removeEventListener(eventType, callback, options);
          removed = true;
        }
        
        elementListeners.delete(eventType);
      }
    } else {
      // Remove all event types
      for (const [evtType, eventTypeListeners] of elementListeners.entries()) {
        for (const [_, { callback, options }] of eventTypeListeners.entries()) {
          element.removeEventListener(evtType, callback, options);
          removed = true;
        }
      }
      
      eventListeners.delete(element);
    }
    
    return removed;
  } catch (error) {
    logger.error('Error removing all safe event listeners', error, 'eventManager');
    return false;
  }
}

/**
 * Generate a unique ID for tracking listeners
 * @returns {string} - Unique ID
 */
function generateListenerId() {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

/**
 * Clear orphaned event listeners (for elements no longer in DOM)
 * @returns {number} - Number of orphaned listeners cleared
 */
export function clearOrphanedEventListeners() {
  let cleared = 0;
  
  try {
    for (const [element, _] of eventListeners.entries()) {
      // Check if element is still in the DOM
      // Note: This only works for DOM elements in a renderer process
      if (element instanceof Element && !document.contains(element)) {
        removeAllSafeEventListeners(element);
        cleared++;
      }
    }
    
    return cleared;
  } catch (error) {
    logger.error('Error clearing orphaned event listeners', error, 'eventManager');
    return cleared;
  }
}

// Default export as an object with all methods
export default {
  addSafeEventListener,
  removeSafeEventListener,
  removeAllSafeEventListeners,
  clearOrphanedEventListeners
};
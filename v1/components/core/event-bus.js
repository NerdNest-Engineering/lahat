/**
 * Event Bus
 * A simple pub/sub implementation for communication between components.
 * Provides methods for publishing and subscribing to events.
 */

/**
 * Event Bus class for component communication
 */
export class EventBus {
  /**
   * Create a new EventBus instance
   */
  constructor() {
    this._subscribers = new Map();
    this._eventHistory = new Map();
    this._historyLimit = 10;
  }
  
  /**
   * Subscribe to an event
   * @param {string} eventName - Event name to subscribe to
   * @param {Function} callback - Callback function to execute when event is published
   * @param {Object} [options] - Subscription options
   * @param {boolean} [options.once=false] - Whether to unsubscribe after first event
   * @param {boolean} [options.receiveLastEvent=false] - Whether to receive the last event immediately
   * @returns {Function} - Unsubscribe function
   */
  subscribe(eventName, callback, options = {}) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    // Get or create subscribers array for this event
    if (!this._subscribers.has(eventName)) {
      this._subscribers.set(eventName, []);
    }
    
    // Create subscriber object
    const subscriber = {
      callback,
      once: options.once === true
    };
    
    // Add subscriber to array
    this._subscribers.get(eventName).push(subscriber);
    
    // Send last event if requested
    if (options.receiveLastEvent && this._eventHistory.has(eventName)) {
      const lastEvent = this._eventHistory.get(eventName);
      callback(lastEvent);
      
      // If once is true, remove subscriber immediately
      if (options.once) {
        this._removeSubscriber(eventName, subscriber);
        return () => {}; // Return empty function since already unsubscribed
      }
    }
    
    // Return unsubscribe function
    return () => {
      this._removeSubscriber(eventName, subscriber);
    };
  }
  
  /**
   * Subscribe to an event once
   * @param {string} eventName - Event name to subscribe to
   * @param {Function} callback - Callback function to execute when event is published
   * @param {Object} [options] - Subscription options
   * @param {boolean} [options.receiveLastEvent=false] - Whether to receive the last event immediately
   * @returns {Function} - Unsubscribe function
   */
  subscribeOnce(eventName, callback, options = {}) {
    return this.subscribe(eventName, callback, { ...options, once: true });
  }
  
  /**
   * Publish an event
   * @param {string} eventName - Event name to publish
   * @param {any} data - Event data
   * @returns {number} - Number of subscribers notified
   */
  publish(eventName, data = {}) {
    // Store event in history
    this._eventHistory.set(eventName, data);
    this._trimEventHistory();
    
    // If no subscribers, return 0
    if (!this._subscribers.has(eventName)) {
      return 0;
    }
    
    const subscribers = this._subscribers.get(eventName);
    const subscribersToRemove = [];
    
    // Notify subscribers
    subscribers.forEach(subscriber => {
      try {
        subscriber.callback(data);
        
        // Mark for removal if once
        if (subscriber.once) {
          subscribersToRemove.push(subscriber);
        }
      } catch (error) {
        console.error(`Error in event subscriber for ${eventName}:`, error);
      }
    });
    
    // Remove subscribers marked for removal
    subscribersToRemove.forEach(subscriber => {
      this._removeSubscriber(eventName, subscriber);
    });
    
    return subscribers.length;
  }
  
  /**
   * Remove a subscriber
   * @param {string} eventName - Event name
   * @param {Object} subscriberToRemove - Subscriber object to remove
   * @private
   */
  _removeSubscriber(eventName, subscriberToRemove) {
    if (!this._subscribers.has(eventName)) {
      return;
    }
    
    const subscribers = this._subscribers.get(eventName);
    const index = subscribers.findIndex(subscriber => subscriber === subscriberToRemove);
    
    if (index !== -1) {
      subscribers.splice(index, 1);
      
      // Remove event from map if no subscribers left
      if (subscribers.length === 0) {
        this._subscribers.delete(eventName);
      }
    }
  }
  
  /**
   * Trim event history to limit
   * @private
   */
  _trimEventHistory() {
    if (this._eventHistory.size <= this._historyLimit) {
      return;
    }
    
    // Get oldest events to remove
    const eventsToRemove = Array.from(this._eventHistory.keys())
      .slice(0, this._eventHistory.size - this._historyLimit);
    
    // Remove oldest events
    eventsToRemove.forEach(eventName => {
      this._eventHistory.delete(eventName);
    });
  }
  
  /**
   * Set the history limit
   * @param {number} limit - Maximum number of events to keep in history
   */
  setHistoryLimit(limit) {
    this._historyLimit = limit;
    this._trimEventHistory();
  }
  
  /**
   * Get the last event for a given event name
   * @param {string} eventName - Event name
   * @returns {any} - Last event data or undefined if no events
   */
  getLastEvent(eventName) {
    return this._eventHistory.get(eventName);
  }
  
  /**
   * Check if an event has subscribers
   * @param {string} eventName - Event name
   * @returns {boolean} - True if event has subscribers
   */
  hasSubscribers(eventName) {
    return this._subscribers.has(eventName) && this._subscribers.get(eventName).length > 0;
  }
  
  /**
   * Get the number of subscribers for an event
   * @param {string} eventName - Event name
   * @returns {number} - Number of subscribers
   */
  getSubscriberCount(eventName) {
    if (!this._subscribers.has(eventName)) {
      return 0;
    }
    
    return this._subscribers.get(eventName).length;
  }
  
  /**
   * Get all event names with subscribers
   * @returns {string[]} - Array of event names
   */
  getEventNames() {
    return Array.from(this._subscribers.keys());
  }
  
  /**
   * Clear all subscribers for a specific event
   * @param {string} eventName - Event name
   * @returns {number} - Number of subscribers removed
   */
  clearEvent(eventName) {
    if (!this._subscribers.has(eventName)) {
      return 0;
    }
    
    const count = this._subscribers.get(eventName).length;
    this._subscribers.delete(eventName);
    return count;
  }
  
  /**
   * Clear all subscribers and event history
   */
  clear() {
    this._subscribers.clear();
    this._eventHistory.clear();
  }
}

/**
 * Create a global event bus instance
 */
export const globalEventBus = new EventBus();

/**
 * Create a namespaced event bus
 * @param {string} namespace - Namespace for events
 * @returns {Object} - Namespaced event bus methods
 */
export function createNamespacedEventBus(namespace) {
  return {
    /**
     * Subscribe to a namespaced event
     * @param {string} eventName - Event name to subscribe to
     * @param {Function} callback - Callback function
     * @param {Object} [options] - Subscription options
     * @returns {Function} - Unsubscribe function
     */
    subscribe(eventName, callback, options = {}) {
      return globalEventBus.subscribe(`${namespace}:${eventName}`, callback, options);
    },
    
    /**
     * Subscribe to a namespaced event once
     * @param {string} eventName - Event name to subscribe to
     * @param {Function} callback - Callback function
     * @param {Object} [options] - Subscription options
     * @returns {Function} - Unsubscribe function
     */
    subscribeOnce(eventName, callback, options = {}) {
      return globalEventBus.subscribeOnce(`${namespace}:${eventName}`, callback, options);
    },
    
    /**
     * Publish a namespaced event
     * @param {string} eventName - Event name to publish
     * @param {any} data - Event data
     * @returns {number} - Number of subscribers notified
     */
    publish(eventName, data = {}) {
      return globalEventBus.publish(`${namespace}:${eventName}`, data);
    },
    
    /**
     * Get the last event for a namespaced event
     * @param {string} eventName - Event name
     * @returns {any} - Last event data or undefined if no events
     */
    getLastEvent(eventName) {
      return globalEventBus.getLastEvent(`${namespace}:${eventName}`);
    },
    
    /**
     * Check if a namespaced event has subscribers
     * @param {string} eventName - Event name
     * @returns {boolean} - True if event has subscribers
     */
    hasSubscribers(eventName) {
      return globalEventBus.hasSubscribers(`${namespace}:${eventName}`);
    },
    
    /**
     * Get the number of subscribers for a namespaced event
     * @param {string} eventName - Event name
     * @returns {number} - Number of subscribers
     */
    getSubscriberCount(eventName) {
      return globalEventBus.getSubscriberCount(`${namespace}:${eventName}`);
    },
    
    /**
     * Clear all subscribers for a specific namespaced event
     * @param {string} eventName - Event name
     * @returns {number} - Number of subscribers removed
     */
    clearEvent(eventName) {
      return globalEventBus.clearEvent(`${namespace}:${eventName}`);
    },
    
    /**
     * Get the namespace
     * @returns {string} - Namespace
     */
    getNamespace() {
      return namespace;
    }
  };
}

export default {
  EventBus,
  globalEventBus,
  createNamespacedEventBus
};

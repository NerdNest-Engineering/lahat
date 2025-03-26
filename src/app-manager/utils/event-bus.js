/**
 * Event Bus
 * A simple event bus for communication between components within the app manager module
 * 
 * This is a module-specific event bus that is completely independent from other modules.
 * It implements a publish-subscribe pattern for event-based communication.
 */

export class EventBus {
  constructor() {
    this.subscribers = {};
  }
  
  /**
   * Subscribe to an event
   * @param {string} event - The event name
   * @param {Function} callback - The callback function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(event, callback) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    
    this.subscribers[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers[event] = this.subscribers[event].filter(cb => cb !== callback);
    };
  }
  
  /**
   * Publish an event
   * @param {string} event - The event name
   * @param {any} data - The event data
   */
  publish(event, data) {
    if (!this.subscribers[event]) {
      return;
    }
    
    this.subscribers[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
  
  /**
   * Subscribe to an event once
   * @param {string} event - The event name
   * @param {Function} callback - The callback function
   */
  once(event, callback) {
    const unsubscribe = this.subscribe(event, data => {
      unsubscribe();
      callback(data);
    });
  }
  
  /**
   * Clear all subscribers for an event
   * @param {string} event - The event name
   */
  clear(event) {
    if (event) {
      this.subscribers[event] = [];
    } else {
      this.subscribers = {};
    }
  }
  
  /**
   * Get the number of subscribers for an event
   * @param {string} event - The event name
   * @returns {number} - The number of subscribers
   */
  getSubscriberCount(event) {
    if (!this.subscribers[event]) {
      return 0;
    }
    
    return this.subscribers[event].length;
  }
}

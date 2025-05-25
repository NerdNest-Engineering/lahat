/**
 * EventBus - Centralized event management for component communication
 */
export class EventBus {
  constructor() {
    this.events = new Map();
  }
  
  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(callback);
  }
  
  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.events.has(event)) {
      this.events.get(event).delete(callback);
    }
  }
  
  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
  
  /**
   * Predefined event constants
   */
  static EVENTS = {
    PROVIDER_KEY_SAVED: 'provider:key:saved',
    PROVIDER_KEY_DELETED: 'provider:key:deleted',
    PROVIDER_TEST_STARTED: 'provider:test:started',
    PROVIDER_TEST_COMPLETED: 'provider:test:completed',
    STATE_CHANGED: 'state:changed',
    PROVIDER_ENABLED: 'provider:enabled',
    PROVIDER_DISABLED: 'provider:disabled',
    ERROR_OCCURRED: 'error:occurred',
    LOADING_STARTED: 'loading:started',
    LOADING_STOPPED: 'loading:stopped'
  };
}

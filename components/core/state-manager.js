/**
 * State Manager
 * Simple state management system for components
 */

/**
 * State Manager class
 * Manages application state with subscription capabilities
 */
export class StateManager {
  /**
   * Create a new state manager
   * @param {Object} initialState - Initial state object
   */
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.listeners = new Map();
    this.nextListenerId = 1;
  }
  
  /**
   * Get the current state or a specific key
   * @param {string|null} key - State key to get, or null for entire state
   * @returns {any} - State value
   */
  get(key = null) {
    if (key === null) {
      return { ...this.state };
    }
    return this.state[key];
  }
  
  /**
   * Set state (can be partial)
   * @param {Object} newState - New state object to merge
   * @returns {StateManager} - This state manager instance for chaining
   */
  set(newState) {
    const oldState = { ...this.state };
    const changedKeys = [];
    
    // Update state and track changed keys
    Object.entries(newState).forEach(([key, value]) => {
      if (this.state[key] !== value) {
        this.state[key] = value;
        changedKeys.push(key);
      }
    });
    
    // Notify listeners of changes
    if (changedKeys.length > 0) {
      this.notifyListeners(changedKeys, oldState);
    }
    
    return this;
  }
  
  /**
   * Subscribe to state changes
   * @param {Array<string>|null} keys - Keys to subscribe to, or null for all changes
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(keys, callback) {
    const id = this.nextListenerId++;
    
    this.listeners.set(id, { keys, callback });
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(id);
    };
  }
  
  /**
   * Notify listeners of state changes
   * @param {Array<string>} changedKeys - Keys that changed
   * @param {Object} oldState - Previous state
   */
  notifyListeners(changedKeys, oldState) {
    this.listeners.forEach(({ keys, callback }) => {
      // If listener is interested in any of the changed keys
      if (keys === null || keys.some(key => changedKeys.includes(key))) {
        callback(this.state, oldState, changedKeys);
      }
    });
  }
  
  /**
   * Reset state to initial values
   * @param {Object} initialState - Initial state to reset to
   * @returns {StateManager} - This state manager instance for chaining
   */
  reset(initialState = {}) {
    const oldState = { ...this.state };
    this.state = { ...initialState };
    
    const changedKeys = Object.keys({ ...oldState, ...this.state });
    this.notifyListeners(changedKeys, oldState);
    
    return this;
  }
  
  /**
   * Create a derived state that updates when source state changes
   * @param {Function} deriveFn - Function that derives state from source state
   * @param {Array<string>} dependencies - Keys to watch for changes
   * @returns {Object} - Object with get() method and subscribe() method
   */
  derive(deriveFn, dependencies) {
    let currentDerivedState = deriveFn(this.state);
    const derivedListeners = new Set();
    
    // Subscribe to source state changes
    const unsubscribe = this.subscribe(dependencies, (state) => {
      const newDerivedState = deriveFn(state);
      
      // Only notify if derived state actually changed
      if (JSON.stringify(newDerivedState) !== JSON.stringify(currentDerivedState)) {
        currentDerivedState = newDerivedState;
        
        // Notify derived state listeners
        derivedListeners.forEach(listener => {
          listener(currentDerivedState);
        });
      }
    });
    
    return {
      get: () => currentDerivedState,
      subscribe: (listener) => {
        derivedListeners.add(listener);
        
        // Return unsubscribe function
        return () => {
          derivedListeners.delete(listener);
          
          // If no more listeners, unsubscribe from source state
          if (derivedListeners.size === 0) {
            unsubscribe();
          }
        };
      }
    };
  }
}

// Create a global app state instance
export const appState = new StateManager({
  apps: [],
  selectedAppId: null,
  isLoading: false,
  apiKeySet: false,
  theme: 'light'
});

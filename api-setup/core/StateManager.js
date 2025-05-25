/**
 * StateManager - Centralized state management with reactive updates
 */
export class StateManager {
  constructor() {
    this.state = {
      providers: new Map(),
      loading: new Set(),
      errors: new Map(),
      initialized: false
    };
    this.listeners = new Set();
  }
  
  /**
   * Set provider state
   * @param {string} providerId - Provider identifier
   * @param {Object} state - Provider state object
   */
  setProviderState(providerId, state) {
    this.state.providers.set(providerId, {
      ...this.getProviderState(providerId),
      ...state
    });
    this.notify();
  }
  
  /**
   * Get provider state
   * @param {string} providerId - Provider identifier
   * @returns {Object} Provider state
   */
  getProviderState(providerId) {
    return this.state.providers.get(providerId) || {
      enabled: false,
      hasKey: false,
      keyMasked: '',
      lastTested: null,
      testResult: null,
      isSecurelyStored: false
    };
  }
  
  /**
   * Set loading state for a provider
   * @param {string} providerId - Provider identifier
   * @param {boolean} isLoading - Loading state
   */
  setLoading(providerId, isLoading) {
    if (isLoading) {
      this.state.loading.add(providerId);
    } else {
      this.state.loading.delete(providerId);
    }
    this.notify();
  }
  
  /**
   * Check if provider is loading
   * @param {string} providerId - Provider identifier
   * @returns {boolean} Loading state
   */
  isLoading(providerId) {
    return this.state.loading.has(providerId);
  }
  
  /**
   * Set error for a provider
   * @param {string} providerId - Provider identifier
   * @param {Object} error - Error object
   */
  setError(providerId, error) {
    if (error) {
      this.state.errors.set(providerId, error);
    } else {
      this.state.errors.delete(providerId);
    }
    this.notify();
  }
  
  /**
   * Get error for a provider
   * @param {string} providerId - Provider identifier
   * @returns {Object|null} Error object
   */
  getError(providerId) {
    return this.state.errors.get(providerId) || null;
  }
  
  /**
   * Clear error for a provider
   * @param {string} providerId - Provider identifier
   */
  clearError(providerId) {
    this.state.errors.delete(providerId);
    this.notify();
  }
  
  /**
   * Set initialized state
   * @param {boolean} initialized - Initialization state
   */
  setInitialized(initialized) {
    this.state.initialized = initialized;
    this.notify();
  }
  
  /**
   * Check if state is initialized
   * @returns {boolean} Initialization state
   */
  isInitialized() {
    return this.state.initialized;
  }
  
  /**
   * Get all provider states
   * @returns {Map} All provider states
   */
  getAllProviderStates() {
    return new Map(this.state.providers);
  }
  
  /**
   * Subscribe to state changes
   * @param {Function} listener - Listener function
   */
  subscribe(listener) {
    this.listeners.add(listener);
  }
  
  /**
   * Unsubscribe from state changes
   * @param {Function} listener - Listener function
   */
  unsubscribe(listener) {
    this.listeners.delete(listener);
  }
  
  /**
   * Notify all listeners of state changes
   */
  notify() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }
  
  /**
   * Get current state snapshot
   * @returns {Object} Current state
   */
  getState() {
    return {
      providers: new Map(this.state.providers),
      loading: new Set(this.state.loading),
      errors: new Map(this.state.errors),
      initialized: this.state.initialized
    };
  }
}

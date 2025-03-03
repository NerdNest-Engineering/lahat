/**
 * Component Registry
 * Provides a central registry for web components
 */

/**
 * Component Registry class
 * Manages registration and retrieval of web components
 */
export class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.pendingRegistrations = new Map();
  }
  
  /**
   * Register a component
   * @param {string} name - Component name (tag name)
   * @param {Class} componentClass - Component class
   * @returns {ComponentRegistry} - This registry instance for chaining
   */
  register(name, componentClass) {
    this.components.set(name, componentClass);
    
    // If there are pending registrations waiting for this component, resolve them
    if (this.pendingRegistrations.has(name)) {
      const callbacks = this.pendingRegistrations.get(name);
      callbacks.forEach(callback => callback(componentClass));
      this.pendingRegistrations.delete(name);
    }
    
    // Define the custom element if it hasn't been defined yet
    if (!customElements.get(name)) {
      customElements.define(name, componentClass);
    }
    
    return this;
  }
  
  /**
   * Get a component by name
   * @param {string} name - Component name
   * @returns {Class|undefined} - Component class or undefined if not found
   */
  get(name) {
    return this.components.get(name);
  }
  
  /**
   * Check if a component is registered
   * @param {string} name - Component name
   * @returns {boolean} - True if component is registered
   */
  has(name) {
    return this.components.has(name);
  }
  
  /**
   * Get a component asynchronously, waiting for it to be registered if necessary
   * @param {string} name - Component name
   * @returns {Promise<Class>} - Promise that resolves to the component class
   */
  async getAsync(name) {
    if (this.components.has(name)) {
      return this.components.get(name);
    }
    
    return new Promise(resolve => {
      if (!this.pendingRegistrations.has(name)) {
        this.pendingRegistrations.set(name, []);
      }
      this.pendingRegistrations.get(name).push(resolve);
    });
  }
  
  /**
   * Get all registered components
   * @returns {Array<[string, Class]>} - Array of [name, class] pairs
   */
  getAll() {
    return Array.from(this.components.entries());
  }
  
  /**
   * Get component names
   * @returns {Array<string>} - Array of component names
   */
  getNames() {
    return Array.from(this.components.keys());
  }
  
  /**
   * Ensure a component is loaded
   * @param {string} name - Component name
   * @param {Function} importFn - Function that imports the component module
   * @returns {Promise<Class>} - Promise that resolves to the component class
   */
  async ensure(name, importFn) {
    if (this.has(name)) {
      return this.get(name);
    }
    
    await importFn();
    return this.getAsync(name);
  }
}

// Create a singleton instance
export const registry = new ComponentRegistry();

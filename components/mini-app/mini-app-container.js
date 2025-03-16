/**
 * Mini App Container Component
 * A standard container for hosting generated mini app web components
 */

import { BaseComponent } from '../core/base-component.js';

/**
 * Mini App Container
 * Provides a standardized environment for loading and running mini app components
 * @extends BaseComponent
 */
export class MiniAppContainer extends BaseComponent {
  /**
   * Create a new MiniAppContainer
   */
  constructor() {
    super();
    
    // Initialize state
    this._loadedComponent = null;
    this._componentInstance = null;
    
    // Create base HTML structure
    this.render(`
      <div class="mini-app-container">
        <div class="mini-app-content">
          <!-- Mini app component will be loaded here -->
        </div>
      </div>
    `, `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      
      .mini-app-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding-top: 38px; /* Space for the drag region */
        box-sizing: border-box;
      }
      
      .mini-app-content {
        flex: 1;
        overflow: auto;
        position: relative;
      }
    `);
  }
  
  /**
   * Load a component into the container
   * @param {Class} ComponentClass - The component class to load
   * @param {Object} props - Optional props to pass to the component
   * @returns {HTMLElement} - The instantiated component
   */
  loadComponent(ComponentClass, props = {}) {
    // Store reference to the component class
    this._loadedComponent = ComponentClass;
    
    // Get the content container
    const contentContainer = this.$('.mini-app-content');
    
    // Clear any existing content
    contentContainer.innerHTML = '';
    
    try {
      // Register the component if it's not already registered
      const tagName = this._getTagNameFromClass(ComponentClass);
      
      if (!customElements.get(tagName)) {
        customElements.define(tagName, ComponentClass);
      }
      
      // Create an instance of the component
      const instance = document.createElement(tagName);
      this._componentInstance = instance;
      
      // Set props if provided
      Object.entries(props).forEach(([key, value]) => {
        if (typeof instance.setProp === 'function') {
          instance.setProp(key, value);
        } else {
          // Fallback for non-BaseComponent components
          instance[key] = value;
        }
      });
      
      // Add the component to the container
      contentContainer.appendChild(instance);
      
      return instance;
    } catch (error) {
      console.error('Error loading component:', error);
      this.handleError(error);
      return null;
    }
  }
  
  /**
   * Get the loaded component instance
   * @returns {HTMLElement|null} - The component instance or null if not loaded
   */
  getComponentInstance() {
    return this._componentInstance;
  }
  
  /**
   * Generate a tag name from a component class
   * @param {Class} ComponentClass - The component class
   * @returns {string} - A valid tag name for the component
   * @private
   */
  _getTagNameFromClass(ComponentClass) {
    // Try to get the name from the component's static tagName property
    if (ComponentClass.tagName) {
      return ComponentClass.tagName;
    }
    
    // Generate a tag name from the class name
    let tagName = ComponentClass.name
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
    
    // Ensure the tag name contains a hyphen (required for custom elements)
    if (!tagName.includes('-')) {
      tagName = `mini-app-${tagName}`;
    }
    
    return tagName;
  }
}

// Register the component
customElements.define('mini-app-container', MiniAppContainer);

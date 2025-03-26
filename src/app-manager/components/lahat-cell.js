/**
 * LahatCell Component
 * A container component that hosts a web component
 * 
 * LahatCells provide:
 * - Lifecycle management for the contained component
 * - Event proxying to the EventBus
 * - Isolation boundaries
 * - Layout capabilities
 */

import { createEventProxy, dispatchCustomEvent } from '../utils/event-utils.js';
import { ErrorLevel, showError } from '../utils/error-utils.js';
import { isSafeComponentCode, isValidMetadata } from '../utils/security-utils.js';

export class LahatCell extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background-color: white;
          border-radius: var(--border-radius, 8px);
          box-shadow: var(--shadow, 0 2px 10px rgba(0, 0, 0, 0.1));
          overflow: hidden;
          position: relative;
          height: 100%;
          width: 100%;
        }
        
        .cell-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background-color: #f5f5f5;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .cell-title {
          font-weight: 500;
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .cell-actions {
          display: flex;
          gap: 8px;
        }
        
        .cell-action {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: #5f6368;
          padding: 4px;
          border-radius: 4px;
        }
        
        .cell-action:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .cell-content {
          padding: 16px;
          height: calc(100% - 37px); /* 37px is the header height */
          overflow: auto;
        }
        
        .cell-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          width: 100%;
        }
        
        .cell-error {
          padding: 16px;
          color: #d32f2f;
        }
      </style>
      
      <div class="cell-header">
        <div class="cell-title"></div>
        <div class="cell-actions">
          <button class="cell-action cell-action-settings">⚙️</button>
          <button class="cell-action cell-action-close">✕</button>
        </div>
      </div>
      
      <div class="cell-content">
        <div class="cell-loading">Loading...</div>
      </div>
    `;
    
    // Set up event listeners
    this.shadowRoot.querySelector('.cell-action-close').addEventListener('click', () => {
      this.remove();
    });
    
    this.shadowRoot.querySelector('.cell-action-settings').addEventListener('click', () => {
      this.openSettings();
    });
    
    // Initialize properties
    this.component = null;
    this.metadata = null;
    this.eventProxy = null;
  }
  
  /**
   * Called when the element is added to the DOM
   */
  connectedCallback() {
    // Set the title
    const title = this.getAttribute('title') || 'Untitled Component';
    this.shadowRoot.querySelector('.cell-title').textContent = title;
    
    // Load the component if a name is provided
    const componentName = this.getAttribute('component-name');
    if (componentName) {
      this.loadComponent(componentName);
    }
  }
  
  /**
   * Observed attributes for reactive updates
   */
  static get observedAttributes() {
    return ['title', 'component-name'];
  }
  
  /**
   * Called when an observed attribute changes
   * @param {string} name - The attribute name
   * @param {string} oldValue - The old attribute value
   * @param {string} newValue - The new attribute value
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'title') {
      this.shadowRoot.querySelector('.cell-title').textContent = newValue || 'Untitled Component';
    } else if (name === 'component-name' && newValue && newValue !== oldValue) {
      this.loadComponent(newValue);
    }
  }
  
  /**
   * Load a component by name
   * @param {string} componentName - The component name
   * @returns {Promise<HTMLElement>} - The loaded component
   */
  async loadComponent(componentName) {
    try {
      // Show loading state
      const contentElement = this.shadowRoot.querySelector('.cell-content');
      contentElement.innerHTML = '<div class="cell-loading">Loading...</div>';
      
      // Load the component
      const { loadComponent } = await import('../ipc/renderer-handlers.js');
      const result = await loadComponent(componentName);
      
      if (!result.success) {
        throw new Error(result.error || `Failed to load component: ${componentName}`);
      }
      
      // Validate the component code
      if (!isSafeComponentCode(result.code)) {
        throw new Error(`Component contains unsafe code: ${componentName}`);
      }
      
      // Validate the metadata
      if (!isValidMetadata(result.metadata)) {
        throw new Error(`Component has invalid metadata: ${componentName}`);
      }
      
      // Store the metadata
      this.metadata = result.metadata;
      
      // Create a script element to execute the component code
      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = result.code;
      document.head.appendChild(script);
      
      // Wait for the component to be defined
      await this.waitForComponentDefinition(componentName);
      
      // Create the component
      const component = document.createElement(componentName);
      
      // Clear the content element
      contentElement.innerHTML = '';
      
      // Add the component to the content element
      contentElement.appendChild(component);
      
      // Store the component
      this.component = component;
      
      // Set up event proxy
      this.setupEventProxy();
      
      // Return the component
      return component;
    } catch (error) {
      console.error(`Error loading component ${componentName}:`, error);
      
      // Show error state
      const contentElement = this.shadowRoot.querySelector('.cell-content');
      contentElement.innerHTML = `<div class="cell-error">Error loading component: ${error.message}</div>`;
      
      // Show error in the UI
      showError('Component Loading Error', error.message, ErrorLevel.ERROR);
      
      throw error;
    }
  }
  
  /**
   * Wait for a component to be defined
   * @param {string} componentName - The component name
   * @returns {Promise<void>} - A promise that resolves when the component is defined
   */
  waitForComponentDefinition(componentName) {
    return new Promise((resolve) => {
      if (customElements.get(componentName)) {
        resolve();
        return;
      }
      
      const checkInterval = setInterval(() => {
        if (customElements.get(componentName)) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000);
    });
  }
  
  /**
   * Set up event proxy for the component
   */
  setupEventProxy() {
    if (!this.component || !this.metadata) {
      return;
    }
    
    // Get the event names from the metadata
    const eventNames = this.metadata.events?.map(e => e.name) || [];
    
    // Create an event proxy
    this.eventProxy = createEventProxy(this.component, this, eventNames, (detail, eventName) => {
      // Add source information to the event detail
      return {
        ...detail,
        source: {
          cellId: this.id,
          componentName: this.metadata.componentName
        }
      };
    });
  }
  
  /**
   * Open the settings for this cell
   */
  openSettings() {
    // Dispatch a settings-requested event
    dispatchCustomEvent(this, 'settings-requested', {
      cellId: this.id,
      componentName: this.metadata?.componentName
    });
  }
  
  /**
   * Called when the element is removed from the DOM
   */
  disconnectedCallback() {
    // Clean up event proxy
    if (this.eventProxy) {
      this.eventProxy();
      this.eventProxy = null;
    }
    
    // Clean up component
    if (this.component) {
      this.component = null;
    }
  }
}

// Register the component
customElements.define('lahat-cell', LahatCell);

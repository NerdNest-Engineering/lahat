/**
 * LahatApp Component
 * The main container component for the app manager module
 * 
 * LahatApp is responsible for:
 * - Creating and destroying LahatCells
 * - Managing the layout of cells
 * - Routing events between cells through the EventBus
 */

import { EventBus } from '../utils/event-bus.js';
import { ErrorLevel, showError } from '../utils/error-utils.js';
import { dispatchCustomEvent } from '../utils/event-utils.js';
import './lahat-cell.js';

export class LahatApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
          width: 100%;
          overflow: auto;
          padding: 16px;
        }
        
        .lahat-app {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          grid-auto-rows: minmax(200px, auto);
          gap: 16px;
          height: 100%;
        }
        
        .lahat-cell {
          grid-column: span 1;
        }
        
        .lahat-cell.medium {
          grid-column: span 2;
        }
        
        .lahat-cell.large {
          grid-column: span 3;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100%;
          color: #5f6368;
          text-align: center;
        }
        
        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .empty-state-title {
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        
        .empty-state-description {
          font-size: 14px;
          margin-bottom: 16px;
        }
        
        .empty-state-button {
          padding: 8px 16px;
          background-color: var(--primary-color, #4285f4);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        }
        
        .empty-state-button:hover {
          background-color: var(--primary-color-dark, #3367d6);
        }
        
        @media (max-width: 768px) {
          .lahat-app {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          }
          
          .lahat-cell.medium,
          .lahat-cell.large {
            grid-column: span 1;
          }
        }
        
        @media (max-width: 480px) {
          .lahat-app {
            grid-template-columns: 1fr;
          }
          
          .lahat-cell {
            grid-column: span 1;
          }
        }
      </style>
      
      <div class="lahat-app">
        <div class="empty-state">
          <div class="empty-state-icon">📱</div>
          <div class="empty-state-title">No Components Added</div>
          <div class="empty-state-description">Add components from the widget drawer to get started.</div>
          <button class="empty-state-button">Open Widget Drawer</button>
        </div>
      </div>
    `;
    
    // Set up event listeners
    this.shadowRoot.querySelector('.empty-state-button').addEventListener('click', () => {
      this.openWidgetDrawer();
    });
    
    // Create an event bus for this app
    this.eventBus = new EventBus();
    
    // Initialize properties
    this.cells = new Map();
    this.appConfig = null;
  }
  
  /**
   * Called when the element is added to the DOM
   */
  connectedCallback() {
    // Load the app if an ID is provided
    const appId = this.getAttribute('app-id');
    if (appId) {
      this.loadApp(appId);
    }
    
    // Set up event listeners for cell events
    this.addEventListener('cell-event', this.handleCellEvent.bind(this));
    this.addEventListener('settings-requested', this.handleSettingsRequested.bind(this));
  }
  
  /**
   * Observed attributes for reactive updates
   */
  static get observedAttributes() {
    return ['app-id'];
  }
  
  /**
   * Called when an observed attribute changes
   * @param {string} name - The attribute name
   * @param {string} oldValue - The old attribute value
   * @param {string} newValue - The new attribute value
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'app-id' && newValue && newValue !== oldValue) {
      this.loadApp(newValue);
    }
  }
  
  /**
   * Load an app by ID
   * @param {string} appId - The app ID
   * @returns {Promise<boolean>} - Whether the app was loaded successfully
   */
  async loadApp(appId) {
    try {
      // Show loading state
      this.showEmptyState('Loading App...', 'Please wait while the app is loaded.');
      
      // Load the app
      const { loadApp } = await import('../ipc/renderer-handlers.js');
      const result = await loadApp(appId);
      
      if (!result.success) {
        throw new Error(result.error || `Failed to load app: ${appId}`);
      }
      
      // Parse the app configuration
      // Note: In a real implementation, this would use a YAML parser
      // For now, we'll just store the raw content
      this.appConfig = result.config;
      
      // Clear the app container
      this.clear();
      
      // Create cells based on the app configuration
      // Note: In a real implementation, this would parse the YAML configuration
      // For now, we'll just create a sample cell
      this.createSampleCell();
      
      // Publish app loaded event
      this.eventBus.publish('app-loaded', {
        appId,
        config: this.appConfig
      });
      
      return true;
    } catch (error) {
      console.error(`Error loading app ${appId}:`, error);
      
      // Show error state
      this.showEmptyState('Error Loading App', error.message, 'Try Again');
      
      // Show error in the UI
      showError('App Loading Error', error.message, ErrorLevel.ERROR);
      
      return false;
    }
  }
  
  /**
   * Create a sample cell for demonstration purposes
   */
  createSampleCell() {
    // Create a cell
    const cell = document.createElement('lahat-cell');
    cell.id = `cell-${Date.now()}`;
    cell.setAttribute('title', 'Sample Component');
    cell.classList.add('lahat-cell');
    
    // Add the cell to the app container
    const appContainer = this.shadowRoot.querySelector('.lahat-app');
    appContainer.innerHTML = '';
    appContainer.appendChild(cell);
    
    // Store the cell
    this.cells.set(cell.id, cell);
  }
  
  /**
   * Create a cell with the specified component
   * @param {string} componentName - The component name
   * @param {string} title - The cell title
   * @param {string} size - The cell size (small, medium, large)
   * @returns {HTMLElement} - The created cell
   */
  createCell(componentName, title, size = 'small') {
    // Create a cell
    const cell = document.createElement('lahat-cell');
    cell.id = `cell-${Date.now()}`;
    cell.setAttribute('title', title || componentName);
    cell.setAttribute('component-name', componentName);
    cell.classList.add('lahat-cell');
    
    // Set the cell size
    if (size === 'medium' || size === 'large') {
      cell.classList.add(size);
    }
    
    // Check if this is the first cell
    const appContainer = this.shadowRoot.querySelector('.lahat-app');
    if (appContainer.querySelector('.empty-state')) {
      appContainer.innerHTML = '';
    }
    
    // Add the cell to the app container
    appContainer.appendChild(cell);
    
    // Store the cell
    this.cells.set(cell.id, cell);
    
    // Return the cell
    return cell;
  }
  
  /**
   * Handle a cell event
   * @param {CustomEvent} event - The cell event
   */
  handleCellEvent(event) {
    // Get the event data
    const { sourceCell, eventName, detail } = event.detail;
    
    // Publish the event to the event bus
    this.eventBus.publish(eventName, detail);
    
    // Dispatch an app event
    dispatchCustomEvent(this, 'app-event', {
      sourceCell,
      eventName,
      detail
    });
  }
  
  /**
   * Handle a settings requested event
   * @param {CustomEvent} event - The settings requested event
   */
  handleSettingsRequested(event) {
    // Get the event data
    const { cellId, componentName } = event.detail;
    
    // Dispatch a settings requested event
    dispatchCustomEvent(this, 'settings-requested', {
      cellId,
      componentName
    });
  }
  
  /**
   * Open the widget drawer
   */
  openWidgetDrawer() {
    // Dispatch a widget drawer requested event
    dispatchCustomEvent(this, 'widget-drawer-requested', {});
  }
  
  /**
   * Show an empty state
   * @param {string} title - The empty state title
   * @param {string} description - The empty state description
   * @param {string} buttonText - The empty state button text
   */
  showEmptyState(title, description, buttonText = 'Open Widget Drawer') {
    const appContainer = this.shadowRoot.querySelector('.lahat-app');
    appContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📱</div>
        <div class="empty-state-title">${title}</div>
        <div class="empty-state-description">${description}</div>
        <button class="empty-state-button">${buttonText}</button>
      </div>
    `;
    
    // Set up event listener for the button
    this.shadowRoot.querySelector('.empty-state-button').addEventListener('click', () => {
      if (buttonText === 'Try Again') {
        const appId = this.getAttribute('app-id');
        if (appId) {
          this.loadApp(appId);
        }
      } else {
        this.openWidgetDrawer();
      }
    });
  }
  
  /**
   * Clear the app container
   */
  clear() {
    // Clear the cells map
    this.cells.clear();
    
    // Show the empty state
    this.showEmptyState('No Components Added', 'Add components from the widget drawer to get started.');
  }
  
  /**
   * Called when the element is removed from the DOM
   */
  disconnectedCallback() {
    // Clean up event listeners
    this.removeEventListener('cell-event', this.handleCellEvent);
    this.removeEventListener('settings-requested', this.handleSettingsRequested);
    
    // Clear the cells
    this.clear();
  }
}

// Register the component
customElements.define('lahat-app', LahatApp);

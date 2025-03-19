/**
 * Updated Lahat Cell Component
 * A container component that manages WebComponents and handles event proxying.
 * This implementation follows the new WebComponent architecture where:
 * - WebComponents remain independent and unaware of Lahat
 * - LahatCell manages WebComponent lifecycle and acts as a proxy for events
 * - EventBus handles global event communication (only if needed)
 */

import { eventBus } from '../core/event-bus.js';
import { getWidgetDataStore } from '../core/widget-data-store.js';

/**
 * LahatCell component for managing WebComponents
 * @extends HTMLElement
 */
export class LahatCell extends HTMLElement {
  /**
   * Create a new LahatCell instance
   */
  constructor() {
    super();
    
    // Cell properties
    this._webComponent = null;
    this._componentType = null;
    this._gridPosition = { x: 0, y: 0 };
    this._gridSize = { width: 1, height: 1 };
    this._dataStore = null;
    
    // Set cell attribute for identification
    this.setAttribute('data-cell', 'true');
    
    // Create base HTML structure
    this.render(`
      <div class="lahat-cell">
        <div class="cell-header">
          <div class="drag-handle"></div>
        </div>
        <div class="cell-content"></div>
        <div class="resize-handle"></div>
      </div>
    `, `
      :host {
        display: block;
        position: relative;
        box-sizing: border-box;
        min-width: 100px;
        min-height: 100px;
      }
      
      .lahat-cell {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
        background-color: #ffffff;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      }
      
      .cell-header {
        height: 24px;
        background-color: #f5f5f5;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        align-items: center;
        padding: 0 8px;
        cursor: move;
      }
      
      .drag-handle {
        width: 20px;
        height: 10px;
        background-image: radial-gradient(#ccc 1px, transparent 1px);
        background-size: 4px 4px;
      }
      
      .cell-content {
        flex: 1;
        position: relative;
        overflow: auto;
      }
      
      .resize-handle {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 16px;
        height: 16px;
        cursor: nwse-resize;
        background-image: linear-gradient(135deg, transparent 50%, #ccc 50%, #ccc 60%, transparent 60%);
      }
    `);
  }
  
  /**
   * Initialize the cell
   * Called once when the cell is first created
   */
  initialize() {
    super.initialize();
    this.setupEventHandlers();
    this.setupDragAndDrop();
  }
  
  /**
   * Set up event handlers for the cell
   * @private
   */
  setupEventHandlers() {
    // We'll set up specific event listeners when a component is loaded
  }
  
  /**
   * Set up drag and drop functionality
   * @private
   */
  setupDragAndDrop() {
    const dragHandle = this.$('.drag-handle');
    const resizeHandle = this.$('.resize-handle');
    
    // Drag to move
    if (dragHandle) {
      this.addEventListener(dragHandle, 'mousedown', this.handleDragStart.bind(this));
    }
    
    // Drag to resize
    if (resizeHandle) {
      this.addEventListener(resizeHandle, 'mousedown', this.handleResizeStart.bind(this));
    }
  }
  
  /**
   * Handle the start of a drag operation
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  handleDragStart(event) {
    // Implement drag functionality
    // This is a placeholder for the actual implementation
    event.preventDefault();
    
    // Emit drag start event
    this.emit('cell-drag-start', {
      cell: this,
      position: this._gridPosition,
      size: this._gridSize
    });
  }
  
  /**
   * Handle the start of a resize operation
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  handleResizeStart(event) {
    // Implement resize functionality
    // This is a placeholder for the actual implementation
    event.preventDefault();
    
    // Emit resize start event
    this.emit('cell-resize-start', {
      cell: this,
      position: this._gridPosition,
      size: this._gridSize
    });
  }
  
  /**
   * Load a WebComponent into this cell
   * @param {string} componentType - The tag name of the WebComponent to load
   * @param {Object} [config={}] - Configuration options for the component
   */
  loadComponent(componentType, config = {}) {
    // Clear existing content
    this.clearContent();
    
    // Set component type
    this._componentType = componentType;
    
    // Get content container
    const contentContainer = this.$('.cell-content');
    
    // Create the WebComponent
    const webComponent = document.createElement(componentType);
    this._webComponent = webComponent;
    
    // Set up data store for this component
    this.setupDataStore();
    
    // Set attributes from config
    if (config.attributes) {
      Object.entries(config.attributes).forEach(([key, value]) => {
        webComponent.setAttribute(key, value);
      });
    }
    
    // Add the component to the DOM
    contentContainer.appendChild(webComponent);
    
    // Set up event listeners for the component
    this.setupComponentEventListeners(webComponent);
    
    // Emit content change event
    this.emit('cell-content-changed', {
      cell: this,
      componentType,
      component: webComponent
    });
    
    return webComponent;
  }
  
  /**
   * Set up event listeners for the WebComponent
   * @param {HTMLElement} component - The WebComponent
   * @private
   */
  setupComponentEventListeners(component) {
    // Use event delegation to capture all events from the component
    component.addEventListener('*', (event) => {
      // Only handle CustomEvents
      if (event instanceof CustomEvent) {
        this.handleComponentEvent(event);
      }
    });
    
    // Listen for specific events that we know about
    // This is a fallback since the '*' selector might not work in all browsers
    const commonEvents = [
      'change', 'input', 'click', 'submit', 'reset',
      'focus', 'blur', 'keydown', 'keyup', 'keypress',
      'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout',
      'touchstart', 'touchend', 'touchmove', 'touchcancel',
      'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop'
    ];
    
    commonEvents.forEach(eventName => {
      component.addEventListener(eventName, this.handleComponentEvent.bind(this));
    });
  }
  
  /**
   * Handle events from the WebComponent and relay them to the EventBus
   * @param {Event} event - The event from the WebComponent
   * @private
   */
  handleComponentEvent(event) {
    // Only handle events that bubble and have the composed flag set
    // This ensures we only handle events that are meant to cross shadow DOM boundaries
    if (!event.bubbles || !event.composed) {
      return;
    }
    
    // Create event data
    const eventData = {
      sourceCell: this,
      sourceComponent: this._webComponent,
      eventName: event.type,
      detail: event.detail || {}
    };
    
    // Publish to EventBus
    eventBus.publish(`component:${this._componentType}:${event.type}`, eventData);
    
    // Emit a cell event
    this.emit('cell-event', eventData);
  }
  
  /**
   * Set up data persistence for the WebComponent
   * @private
   */
  async setupDataStore() {
    try {
      // Get or create data store for this cell
      this._dataStore = getWidgetDataStore(this.id);
      
      // Initialize the data store
      await this._dataStore.initialize();
      
      // Expose data persistence methods to the WebComponent
      if (this._webComponent) {
        // Add methods to the WebComponent
        this._webComponent.getStoredData = async (key) => {
          return await this._dataStore.loadData(key);
        };
        
        this._webComponent.storeData = async (key, value) => {
          return await this._dataStore.saveData(key, value);
        };
        
        // Notify the component that data store is ready
        if (typeof this._webComponent.onDataStoreReady === 'function') {
          await this._webComponent.onDataStoreReady();
        } else {
          // Dispatch an event for components that use event-based communication
          this._webComponent.dispatchEvent(new CustomEvent('data-store-ready', {
            bubbles: false,
            detail: { cellId: this.id }
          }));
        }
      }
    } catch (error) {
      console.error('Error setting up data store:', error);
      this.handleError(error);
    }
  }
  
  /**
   * Clear the current content of this cell
   */
  clearContent() {
    if (this._webComponent) {
      const contentContainer = this.$('.cell-content');
      
      // Remove the component
      contentContainer.removeChild(this._webComponent);
      
      // Clear references
      this._webComponent = null;
      this._componentType = null;
      
      // Emit content change event
      this.emit('cell-content-changed', {
        cell: this,
        componentType: null,
        component: null
      });
    }
  }
  
  /**
   * Get the current WebComponent in this cell
   * @returns {HTMLElement|null} - The WebComponent or null if none
   */
  getComponent() {
    return this._webComponent;
  }
  
  /**
   * Get the type of the current WebComponent
   * @returns {string|null} - The component type or null if none
   */
  getComponentType() {
    return this._componentType;
  }
  
  /**
   * Set the grid position of this cell
   * @param {number} x - X position in grid
   * @param {number} y - Y position in grid
   */
  setGridPosition(x, y) {
    this._gridPosition = { x, y };
    
    // Update position styles
    this.style.gridColumn = `${x + 1} / span ${this._gridSize.width}`;
    this.style.gridRow = `${y + 1} / span ${this._gridSize.height}`;
    
    // Emit position change event
    this.emit('cell-position-changed', {
      cell: this,
      position: this._gridPosition,
      size: this._gridSize
    });
  }
  
  /**
   * Get the grid position of this cell
   * @returns {Object} - Grid position with x and y coordinates
   */
  getGridPosition() {
    return { ...this._gridPosition };
  }
  
  /**
   * Set the grid size of this cell
   * @param {number} width - Width in grid cells
   * @param {number} height - Height in grid cells
   */
  setGridSize(width, height) {
    this._gridSize = { width, height };
    
    // Update size styles
    this.style.gridColumn = `${this._gridPosition.x + 1} / span ${width}`;
    this.style.gridRow = `${this._gridPosition.y + 1} / span ${height}`;
    
    // Emit size change event
    this.emit('cell-size-changed', {
      cell: this,
      position: this._gridPosition,
      size: this._gridSize
    });
    
    // Notify component of resize
    this.notifyComponentResize();
  }
  
  /**
   * Get the grid size of this cell
   * @returns {Object} - Grid size with width and height
   */
  getGridSize() {
    return { ...this._gridSize };
  }
  
  /**
   * Notify the WebComponent of a resize
   * @private
   */
  notifyComponentResize() {
    if (this._webComponent) {
      // Get actual pixel dimensions
      const contentContainer = this.$('.cell-content');
      const width = contentContainer.clientWidth;
      const height = contentContainer.clientHeight;
      
      // Notify the component via method if available
      if (typeof this._webComponent.onResize === 'function') {
        this._webComponent.onResize(width, height);
      } else {
        // Dispatch an event for components that use event-based communication
        this._webComponent.dispatchEvent(new CustomEvent('resize', {
          bubbles: false,
          detail: { width, height }
        }));
      }
    }
  }
  
  /**
   * Emit a cell event
   * @param {string} eventName - Event name
   * @param {any} data - Event data
   * @returns {boolean} - True if event was dispatched
   */
  emit(eventName, data = {}) {
    // Create a custom event with the cell event details
    const event = new CustomEvent('cell-event', {
      bubbles: true,
      composed: true,
      detail: {
        sourceCell: this,
        eventName,
        data
      }
    });
    
    // Dispatch the event
    return this.dispatchEvent(event);
  }
  
  /**
   * Get cell metadata
   * @returns {Object} - Cell metadata
   */
  getMetadata() {
    return {
      id: this.id,
      position: this._gridPosition,
      size: this._gridSize,
      componentType: this._componentType,
      componentId: this._webComponent ? this._webComponent.id : null
    };
  }
}

// Register the component
customElements.define('lahat-cell', LahatCell);

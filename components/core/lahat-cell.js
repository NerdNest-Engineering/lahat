/**
 * Lahat Cell Component
 * A container component that can hold either a single widget or multiple Lahat cells.
 * Handles event communication between cells and manages layout.
 */

import { BaseComponent } from './base-component.js';
import { globalEventBus, createNamespacedEventBus } from './event-bus.js';

/**
 * Lahat Cell component for organizing widgets and other cells
 * @extends BaseComponent
 */
export class LahatCell extends BaseComponent {
  /**
   * Create a new LahatCell instance
   */
  constructor() {
    super();
    
    // Cell properties
    this._content = null;      // Either a widget or an array of LahatCells
    this._contentType = null;  // 'widget' or 'cells'
    this._gridPosition = { x: 0, y: 0 };
    this._gridSize = { width: 1, height: 1 };
    
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
    
    // Create namespaced event bus for this cell
    this._eventBus = createNamespacedEventBus(`cell:${this.id}`);
    
    this.setupEventHandlers();
    this.setupDragAndDrop();
  }
  
  /**
   * Set up event handlers for the cell
   * @private
   */
  setupEventHandlers() {
    // Listen for widget events and forward them
    this.addEventListener('widget-event', this.handleWidgetEvent.bind(this));
    
    // Listen for cell events and forward them
    this.addEventListener('cell-event', this.handleCellEvent.bind(this));
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
   * Handle widget events and forward them as cell events
   * @param {CustomEvent} event - Widget event
   * @private
   */
  handleWidgetEvent(event) {
    // Forward the widget event as a cell event
    const eventData = {
      sourceCell: this,
      sourceWidget: event.detail.sourceWidget,
      originalData: event.detail.data
    };
    
    // Publish to namespaced event bus
    if (this._eventBus) {
      this._eventBus.publish(event.detail.eventName, eventData);
    }
    
    // Forward the widget event as a cell event
    this.publishCellEvent(event.detail.eventName, eventData);
  }
  
  /**
   * Handle cell events from child cells
   * @param {CustomEvent} event - Cell event
   * @private
   */
  handleCellEvent(event) {
    // Forward the cell event to parent cells
    if (event.target !== this) {
      // Publish to namespaced event bus
      if (this._eventBus) {
        this._eventBus.publish(event.detail.eventName, event.detail);
      }
      
      // Forward the cell event to parent cells
      this.publishCellEvent(event.detail.eventName, event.detail);
    }
  }
  
  /**
   * Set the content of this cell to a single widget
   * @param {WidgetComponent} widget - Widget to set as content
   */
  setWidget(widget) {
    // Clear existing content
    this.clearContent();
    
    // Set new content
    this._content = widget;
    this._contentType = 'widget';
    
    // Add widget to the cell content
    const contentContainer = this.$('.cell-content');
    contentContainer.appendChild(widget);
    
    // Set parent cell reference on the widget
    if (typeof widget.setParentCell === 'function') {
      widget.setParentCell(this);
    }
    
    // Emit content change event
    this.emit('cell-content-changed', {
      cell: this,
      contentType: 'widget',
      content: widget
    });
  }
  
  /**
   * Set the content of this cell to multiple cells
   * @param {LahatCell[]} cells - Array of cells to set as content
   */
  setCells(cells) {
    // Clear existing content
    this.clearContent();
    
    // Set new content
    this._content = cells;
    this._contentType = 'cells';
    
    // Add cells to the cell content
    const contentContainer = this.$('.cell-content');
    cells.forEach(cell => {
      contentContainer.appendChild(cell);
    });
    
    // Emit content change event
    this.emit('cell-content-changed', {
      cell: this,
      contentType: 'cells',
      content: cells
    });
  }
  
  /**
   * Clear the current content of this cell
   */
  clearContent() {
    if (this._content) {
      const contentContainer = this.$('.cell-content');
      
      if (this._contentType === 'widget') {
        // Remove widget
        contentContainer.removeChild(this._content);
        
        // Clear parent cell reference
        if (typeof this._content.setParentCell === 'function') {
          this._content.setParentCell(null);
        }
      } else if (this._contentType === 'cells') {
        // Remove cells
        this._content.forEach(cell => {
          contentContainer.removeChild(cell);
        });
      }
      
      // Clear content reference
      this._content = null;
      this._contentType = null;
      
      // Emit content change event
      this.emit('cell-content-changed', {
        cell: this,
        contentType: null,
        content: null
      });
    }
  }
  
  /**
   * Get the current content of this cell
   * @returns {Object} - Content object with type and content
   */
  getContent() {
    return {
      type: this._contentType,
      content: this._content
    };
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
    
    // Notify content of resize
    this.notifyContentResize();
  }
  
  /**
   * Get the grid size of this cell
   * @returns {Object} - Grid size with width and height
   */
  getGridSize() {
    return { ...this._gridSize };
  }
  
  /**
   * Notify content of resize
   * @private
   */
  notifyContentResize() {
    if (this._content && this._contentType === 'widget') {
      // Get actual pixel dimensions
      const contentContainer = this.$('.cell-content');
      const width = contentContainer.clientWidth;
      const height = contentContainer.clientHeight;
      
      // Notify widget of resize
      if (typeof this._content.onResize === 'function') {
        this._content.onResize(width, height);
      }
    }
  }
  
  /**
   * Publish a cell event
   * @param {string} eventName - Event name
   * @param {any} data - Event data
   * @returns {boolean} - True if event was dispatched
   */
  publishCellEvent(eventName, data = {}) {
    // Prepare event detail
    const eventDetail = {
      sourceCell: this,
      eventName,
      data
    };
    
    // Publish to global event bus with cell namespace
    globalEventBus.publish(`cell:${this.id}:${eventName}`, eventDetail);
    
    // Create a custom event with the cell event details
    const event = new CustomEvent('cell-event', {
      bubbles: true,
      composed: true,
      detail: eventDetail
    });
    
    // Dispatch the event
    return this.dispatchEvent(event);
  }
  
  /**
   * Subscribe to cell events
   * @param {string} eventName - Event name to subscribe to
   * @param {Function} callback - Callback function
   * @param {Object} [options] - Subscription options
   * @returns {Function} - Unsubscribe function
   */
  subscribeToCellEvent(eventName, callback, options = {}) {
    if (!this._eventBus) {
      console.warn('Event bus not initialized');
      return () => {};
    }
    
    return this._eventBus.subscribe(eventName, callback, options);
  }
  
  /**
   * Subscribe to cell events once
   * @param {string} eventName - Event name to subscribe to
   * @param {Function} callback - Callback function
   * @param {Object} [options] - Subscription options
   * @returns {Function} - Unsubscribe function
   */
  subscribeToCellEventOnce(eventName, callback, options = {}) {
    if (!this._eventBus) {
      console.warn('Event bus not initialized');
      return () => {};
    }
    
    return this._eventBus.subscribeOnce(eventName, callback, options);
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
      contentType: this._contentType,
      contentMetadata: this._getContentMetadata()
    };
  }
  
  /**
   * Get metadata for the content of this cell
   * @returns {Object|Array|null} - Content metadata
   * @private
   */
  _getContentMetadata() {
    if (!this._content) {
      return null;
    }
    
    if (this._contentType === 'widget') {
      // Get widget metadata
      return typeof this._content.getMetadata === 'function'
        ? this._content.getMetadata()
        : { type: this._content.tagName };
    } else if (this._contentType === 'cells') {
      // Get metadata for all cells
      return this._content.map(cell => 
        typeof cell.getMetadata === 'function'
          ? cell.getMetadata()
          : { type: cell.tagName }
      );
    }
    
    return null;
  }
}

// Register the component
customElements.define('lahat-cell', LahatCell);

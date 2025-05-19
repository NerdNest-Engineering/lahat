/**
 * LahatCell Component (v2)
 * 
 * A self-contained web component for creating recursive cell structures.
 * Uses slots for declarative nesting and provides flexible layout options.
 * 
 * Features:
 * - Designed to be an "invisible container" only, focusing on layout without visual elements
 * - No inheritance dependencies (extends HTMLElement directly)
 * - Uses Shadow DOM with slots for content
 * - Supports recursive nesting of cells
 * - Flexible layout options (flex-row, flex-column, grid)
 * - Event bubbling for communication between cells
 */

// Define the LahatCell component in the global scope
window.LahatCell = class LahatCell extends HTMLElement {
  constructor() {
    super();
    
    // Create a shadow DOM for the component
    this.attachShadow({ mode: 'open' });
    
    // Set up internal structure with slots
    this.shadowRoot.innerHTML = `
      <style>
        /* Container styles - no :host selectors */
        .lahat-cell {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          min-width: 50px;
          min-height: 50px;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
          /* Removed visible styling to make it an invisible container */
          /* border: 1px solid #e0e0e0; */
          /* border-radius: 8px; */
          /* background-color: #ffffff; */
          /* box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); */
        }
        
        /* Optional header - hidden by default */
        .cell-header {
          height: 24px;
          display: none; /* Hidden by default */
          background-color: #f5f5f5;
          border-bottom: 1px solid #e0e0e0;
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
        
        /* Show header when in edit mode */
        .lahat-cell.edit-mode .cell-header {
          display: flex;
        }
        
        /* Content area with layout variations */
        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          position: relative;
          overflow: auto;
        }

        /* Layout variations */
        .content.flex-row {
          flex-direction: row;
        }
        
        .content.flex-column {
          flex-direction: column;
        }
        
        .content.grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          grid-auto-rows: minmax(100px, auto);
          gap: 10px;
        }
        
        /* Resize handle - hidden by default */
        .resize-handle {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 16px;
          height: 16px;
          cursor: nwse-resize;
          background-image: linear-gradient(135deg, transparent 50%, #ccc 50%, #ccc 60%, transparent 60%);
          display: none; /* Hidden by default */
        }
        
        /* Show resize handle when in edit mode */
        .lahat-cell.edit-mode .resize-handle {
          display: block;
        }
      </style>
      
      <div class="lahat-cell">
        <div class="cell-header">
          <div class="drag-handle"></div>
        </div>
        <div class="content">
          <slot></slot>
        </div>
        <div class="resize-handle"></div>
      </div>
    `;
    
    // Store references to important elements
    this._container = this.shadowRoot.querySelector('.lahat-cell');
    this._header = this.shadowRoot.querySelector('.cell-header');
    this._content = this.shadowRoot.querySelector('.content');
    this._resizeHandle = this.shadowRoot.querySelector('.resize-handle');
    
    // Set up event handling for slotted elements
    this._setupEventHandlers();
  }
  
  /**
   * Set up event handlers for the cell
   * @private
   */
  _setupEventHandlers() {
    const slot = this.shadowRoot.querySelector('slot');
    
    // Listen for slotchange events to detect when children are added/removed
    slot.addEventListener('slotchange', () => {
      this._handleSlotChange();
    });
    
    // Listen for events from slotted elements
    this.addEventListener('cell-event', (event) => {
      // Only handle events from direct children, not from this element
      if (event.target !== this) {
        // Bubble the event up
        this._bubbleEvent(event);
        
        // Stop propagation of the original event
        event.stopPropagation();
      }
    });
    
    // Set up drag functionality
    if (this._header) {
      this._header.addEventListener('mousedown', this._handleDragStart.bind(this));
    }
    
    // Set up resize functionality
    if (this._resizeHandle) {
      this._resizeHandle.addEventListener('mousedown', this._handleResizeStart.bind(this));
    }
  }
  
  /**
   * Handle slot change events
   * @private
   */
  _handleSlotChange() {
    // Get all assigned elements
    const slot = this.shadowRoot.querySelector('slot');
    const assignedElements = slot.assignedElements();
    
    // Process only lahat-cell elements
    const childCells = assignedElements.filter(el => el.tagName.toLowerCase() === 'lahat-cell');
    
    // Emit event with the new children
    this._emitEvent('children-changed', { 
      cells: childCells,
      count: childCells.length
    });
  }
  
  /**
   * Handle the start of a drag operation
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleDragStart(event) {
    // Only handle left mouse button
    if (event.button !== 0) return;
    
    event.preventDefault();
    
    // Emit drag start event
    this._emitEvent('drag-start', {
      clientX: event.clientX,
      clientY: event.clientY
    });
    
    // Set up document-level event listeners for drag
    const moveHandler = this._handleDragMove.bind(this);
    const upHandler = (e) => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
      this._handleDragEnd(e);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
  }
  
  /**
   * Handle drag movement
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleDragMove(event) {
    event.preventDefault();
    
    // Emit drag move event
    this._emitEvent('drag-move', {
      clientX: event.clientX,
      clientY: event.clientY
    });
  }
  
  /**
   * Handle the end of a drag operation
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleDragEnd(event) {
    // Emit drag end event
    this._emitEvent('drag-end', {
      clientX: event.clientX,
      clientY: event.clientY
    });
  }
  
  /**
   * Handle the start of a resize operation
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleResizeStart(event) {
    // Only handle left mouse button
    if (event.button !== 0) return;
    
    event.preventDefault();
    
    // Emit resize start event
    this._emitEvent('resize-start', {
      clientX: event.clientX,
      clientY: event.clientY
    });
    
    // Set up document-level event listeners for resize
    const moveHandler = this._handleResizeMove.bind(this);
    const upHandler = (e) => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
      this._handleResizeEnd(e);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
  }
  
  /**
   * Handle resize movement
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleResizeMove(event) {
    event.preventDefault();
    
    // Emit resize move event
    this._emitEvent('resize-move', {
      clientX: event.clientX,
      clientY: event.clientY
    });
  }
  
  /**
   * Handle the end of a resize operation
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleResizeEnd(event) {
    // Emit resize end event
    this._emitEvent('resize-end', {
      clientX: event.clientX,
      clientY: event.clientY
    });
  }
  
  /**
   * Bubble an event up to parent cells
   * @param {CustomEvent} originalEvent - Original event to bubble
   * @private
   */
  _bubbleEvent(originalEvent) {
    // Create a new event to bubble up
    const bubbledEvent = new CustomEvent('cell-event', {
      bubbles: true,
      composed: true,
      detail: {
        originalSource: originalEvent.detail.originalSource || originalEvent.target,
        immediateSource: originalEvent.target,
        bubbledThrough: [...(originalEvent.detail.bubbledThrough || []), this],
        type: originalEvent.detail.type,
        data: originalEvent.detail.data
      }
    });
    
    this.dispatchEvent(bubbledEvent);
  }
  
  /**
   * Emit a cell event
   * @param {string} type - Event type
   * @param {Object} data - Event data
   * @private
   */
  _emitEvent(type, data = {}) {
    const event = new CustomEvent('cell-event', {
      bubbles: true,
      composed: true,
      detail: {
        originalSource: this,
        immediateSource: this,
        bubbledThrough: [],
        type,
        data
      }
    });
    
    this.dispatchEvent(event);
    
    // Also emit a specific named event for easier listening
    const namedEvent = new CustomEvent(`lahat-cell-${type}`, {
      bubbles: true,
      composed: true,
      detail: {
        source: this,
        data
      }
    });
    
    this.dispatchEvent(namedEvent);
  }
  
  // Public API
  
  /**
   * Set the layout type for this cell's children
   * @param {string} type - Layout type (flex-row, flex-column, grid)
   * @param {Object} options - Layout options
   */
  setLayout(type, options = {}) {
    // Remove previous layout classes
    this._content.classList.remove('flex-row', 'flex-column', 'grid');
    
    // Add the new layout class
    this._content.classList.add(type);
    
    // Apply any additional layout options
    if (type === 'grid') {
      if (options.columns) {
        this._content.style.gridTemplateColumns = options.columns;
      }
      
      if (options.rows) {
        this._content.style.gridTemplateRows = options.rows;
      }
      
      if (options.areas) {
        this._content.style.gridTemplateAreas = options.areas;
      }
    }
    
    if (options.gap) {
      this._content.style.gap = options.gap;
    }
    
    if (options.justifyContent) {
      this._content.style.justifyContent = options.justifyContent;
    }
    
    if (options.alignItems) {
      this._content.style.alignItems = options.alignItems;
    }
    
    // Update the layout attribute
    this.setAttribute('layout', type);
    
    // Emit layout change event
    this._emitEvent('layout-changed', { type, options });
  }
  
  /**
   * Add a child cell
   * @param {LahatCell} cell - Cell to add
   * @returns {LahatCell} - The added cell
   */
  addCell(cell) {
    this.appendChild(cell);
    return cell;
  }
  
  /**
   * Remove a child cell
   * @param {LahatCell|string} cellOrId - Cell or cell ID to remove
   * @returns {LahatCell|null} - The removed cell or null
   */
  removeCell(cellOrId) {
    const cell = typeof cellOrId === 'string' 
      ? this.querySelector(`lahat-cell[id="${cellOrId}"]`) 
      : cellOrId;
    
    if (cell && this.contains(cell)) {
      this.removeChild(cell);
      return cell;
    }
    
    return null;
  }
  
  /**
   * Get a child cell by ID
   * @param {string} id - Cell ID
   * @returns {LahatCell|null} - The child cell or null
   */
  getCell(id) {
    return this.querySelector(`lahat-cell[id="${id}"]`);
  }
  
  /**
   * Get all direct child cells
   * @returns {LahatCell[]} - Array of child cells
   */
  getCells() {
    return Array.from(this.querySelectorAll(':scope > lahat-cell'));
  }
  
  /**
   * Clear all child cells
   */
  clearCells() {
    this.getCells().forEach(cell => this.removeChild(cell));
  }
  
  /**
   * Publish an event to be bubbled up through the cell hierarchy
   * @param {string} type - Event type
   * @param {Object} data - Event data
   */
  publishEvent(type, data = {}) {
    this._emitEvent(type, data);
  }
  
  /**
   * Subscribe to events of a specific type
   * @param {string} type - Event type to listen for
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(type, callback) {
    const handler = (event) => {
      if (event.detail.type === type) {
        callback(event.detail);
      }
    };
    
    this.addEventListener('cell-event', handler);
    
    // Return unsubscribe function
    return () => this.removeEventListener('cell-event', handler);
  }
  
  /**
   * Set custom styles for this cell
   * @param {Object} styles - Style object with CSS properties
   */
  setStyles(styles) {
    Object.entries(styles).forEach(([property, value]) => {
      this._container.style[property] = value;
    });
  }
  
  /**
   * Toggle edit mode to show/hide the header and resize handle
   * @param {boolean} enabled - Whether edit mode should be enabled
   */
  setEditMode(enabled) {
    if (enabled) {
      this._container.classList.add('edit-mode');
    } else {
      this._container.classList.remove('edit-mode');
    }
    
    // Emit edit mode change event
    this._emitEvent('edit-mode-changed', { enabled });
  }
  
  // Lifecycle callbacks
  
  connectedCallback() {
    if (!this.id) {
      this.id = 'cell-' + Math.random().toString(36).substring(2, 11);
    }
    
    // Set default layout if none specified
    if (this.hasAttribute('layout')) {
      this.setLayout(this.getAttribute('layout'));
    } else {
      this.setLayout('flex-column');
    }
    
    // Apply any grid-area attribute
    if (this.hasAttribute('grid-area')) {
      this.style.gridArea = this.getAttribute('grid-area');
    }
    
    // Check for edit-mode attribute
    if (this.hasAttribute('edit-mode')) {
      const editMode = this.getAttribute('edit-mode');
      this.setEditMode(editMode === 'true' || editMode === '');
    }
    
    this._emitEvent('connected');
  }
  
  disconnectedCallback() {
    this._emitEvent('disconnected');
  }
  
  // Attribute handling
  
  static get observedAttributes() {
    return ['layout', 'grid-area', 'edit-mode'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    if (name === 'layout' && this._content) {
      this.setLayout(newValue);
    } else if (name === 'grid-area') {
      this.style.gridArea = newValue;
    } else if (name === 'edit-mode') {
      this.setEditMode(newValue === 'true' || newValue === '');
    }
  }
}

// Register the component
customElements.define('lahat-cell', window.LahatCell);

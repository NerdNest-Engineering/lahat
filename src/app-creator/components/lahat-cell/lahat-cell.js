/**
 * LahatCell Component
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
 */

// Create a simple EventBus implementation for the test page
// This avoids having to import from outside the component directory
class EventBus {
  constructor() {
    this.subscribers = {};
  }
  
  subscribe(event, callback) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    
    this.subscribers[event].push(callback);
    
    return () => {
      this.subscribers[event] = this.subscribers[event].filter(cb => cb !== callback);
    };
  }
  
  publish(event, data) {
    if (!this.subscribers[event]) {
      return;
    }
    
    this.subscribers[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
  
  once(event, callback) {
    const unsubscribe = this.subscribe(event, data => {
      unsubscribe();
      callback(data);
    });
  }
  
  clear(event) {
    if (event) {
      this.subscribers[event] = [];
    } else {
      this.subscribers = {};
    }
  }
}

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
      </style>
      
      <div class="lahat-cell">
        <div class="content">
          <slot></slot>
        </div>
      </div>
    `;
    
    // Store references to important elements
    this._container = this.shadowRoot.querySelector('.lahat-cell');
    this._content = this.shadowRoot.querySelector('.content');
    
    // Set up event handling for slotted elements
    this._setupEventHandlers();
  }
  
  /**
   * Get or create an EventBus for LahatCell components
   * This provides a convenient way for consumers to use the EventBus pattern
   * @returns {EventBus} - A shared EventBus instance for LahatCell components
   */
  static createEventBus() {
    // Create a singleton EventBus if not already created
    if (!window.LahatCellEventBus) {
      window.LahatCellEventBus = new EventBus();
    }
    return window.LahatCellEventBus;
  }

  /**
   * Set up event handlers for the cell
   * @private
   */
  _setupEventHandlers() {
    // Slot change events can be observed by consumers using EventBus if needed
    // No default event handling behavior
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
    
    // Publish layout change event using EventBus
    this.publishEvent('layout-changed', { cell: this, type, options });
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
   * Publish an event using the LahatCell EventBus
   * @param {string} type - Event type
   * @param {Object} data - Event data
   */
  publishEvent(type, data = {}) {
    LahatCell.createEventBus().publish(type, data);
  }
  
  /**
   * Subscribe to events of a specific type using the LahatCell EventBus
   * @param {string} type - Event type to listen for
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(type, callback) {
    return LahatCell.createEventBus().subscribe(type, callback);
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
    
    // Publish connected event using EventBus if consumers need it
    this.publishEvent('connected', { cell: this });
  }
  
  disconnectedCallback() {
    // Publish disconnected event using EventBus if consumers need it
    this.publishEvent('disconnected', { cell: this });
  }
  
  // Attribute handling
  
  static get observedAttributes() {
    return ['layout', 'grid-area'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    if (name === 'layout' && this._content) {
      this.setLayout(newValue);
    } else if (name === 'grid-area') {
      this.style.gridArea = newValue;
    }
  }
}

// Register the component
customElements.define('lahat-cell', window.LahatCell);

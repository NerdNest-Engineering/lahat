/**
 * Lahat Grid Component
 * A container component that manages a grid of Lahat cells.
 * Provides layout management and drag-and-drop functionality.
 */

import { BaseComponent } from './base-component.js';
import { LahatCell } from './lahat-cell.js';

/**
 * Lahat Grid component for organizing cells in a grid layout
 * @extends BaseComponent
 */
export class LahatGrid extends BaseComponent {
  /**
   * Create a new LahatGrid instance
   */
  constructor() {
    super();
    
    // Grid properties
    this._cells = new Map();
    this._gridSize = { columns: 12, rows: 12 };
    this._cellPositions = new Map(); // Map of cell IDs to positions
    this._dragState = null;
    this._resizeState = null;
    
    // Create base HTML structure
    this.render(`
      <div class="lahat-grid">
        <div class="grid-container"></div>
        <div class="grid-overlay"></div>
      </div>
    `, `
      :host {
        display: block;
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 400px;
        overflow: auto;
      }
      
      .lahat-grid {
        position: relative;
        width: 100%;
        height: 100%;
      }
      
      .grid-container {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        grid-template-rows: repeat(12, minmax(50px, 1fr));
        grid-gap: 10px;
        padding: 10px;
        width: 100%;
        height: 100%;
        min-height: 400px;
        box-sizing: border-box;
      }
      
      .grid-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
      }
      
      .grid-overlay.active {
        pointer-events: auto;
      }
      
      .grid-placeholder {
        background-color: rgba(0, 0, 255, 0.1);
        border: 2px dashed #4285f4;
        border-radius: 8px;
        position: absolute;
        z-index: 5;
        transition: all 0.2s ease;
      }
    `);
  }
  
  /**
   * Initialize the grid
   * Called once when the grid is first created
   */
  initialize() {
    super.initialize();
    this.setupEventHandlers();
  }
  
  /**
   * Set up event handlers for the grid
   * @private
   */
  setupEventHandlers() {
    // Listen for cell events
    this.addEventListener('cell-drag-start', this.handleCellDragStart.bind(this));
    this.addEventListener('cell-resize-start', this.handleCellResizeStart.bind(this));
    this.addEventListener('cell-event', this.handleCellEvent.bind(this));
    
    // Set up document-level event listeners for drag and resize
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Track these event listeners for cleanup
    this._resources.trackEventListener(document, 'mousemove', this.handleMouseMove.bind(this));
    this._resources.trackEventListener(document, 'mouseup', this.handleMouseUp.bind(this));
  }
  
  /**
   * Handle cell drag start event
   * @param {CustomEvent} event - Cell drag start event
   * @private
   */
  handleCellDragStart(event) {
    const { cell, position, size } = event.detail;
    
    // Set drag state
    this._dragState = {
      cell,
      startPosition: { ...position },
      currentPosition: { ...position },
      size,
      startClientX: event.clientX,
      startClientY: event.clientY
    };
    
    // Create placeholder
    this.createPlaceholder(position.x, position.y, size.width, size.height);
    
    // Activate overlay
    const overlay = this.$('.grid-overlay');
    overlay.classList.add('active');
    
    // Prevent default and stop propagation
    event.preventDefault();
    event.stopPropagation();
  }
  
  /**
   * Handle cell resize start event
   * @param {CustomEvent} event - Cell resize start event
   * @private
   */
  handleCellResizeStart(event) {
    const { cell, position, size } = event.detail;
    
    // Set resize state
    this._resizeState = {
      cell,
      position,
      startSize: { ...size },
      currentSize: { ...size },
      startClientX: event.clientX,
      startClientY: event.clientY
    };
    
    // Create placeholder
    this.createPlaceholder(position.x, position.y, size.width, size.height);
    
    // Activate overlay
    const overlay = this.$('.grid-overlay');
    overlay.classList.add('active');
    
    // Prevent default and stop propagation
    event.preventDefault();
    event.stopPropagation();
  }
  
  /**
   * Handle mouse move event for drag and resize
   * @param {MouseEvent} event - Mouse move event
   * @private
   */
  handleMouseMove(event) {
    if (this._dragState) {
      this.handleDragMove(event);
    } else if (this._resizeState) {
      this.handleResizeMove(event);
    }
  }
  
  /**
   * Handle drag move
   * @param {MouseEvent} event - Mouse move event
   * @private
   */
  handleDragMove(event) {
    const { startPosition, startClientX, startClientY, size } = this._dragState;
    
    // Calculate grid movement
    const gridRect = this.$('.grid-container').getBoundingClientRect();
    const cellWidth = gridRect.width / this._gridSize.columns;
    const cellHeight = gridRect.height / this._gridSize.rows;
    
    const deltaX = Math.round((event.clientX - startClientX) / cellWidth);
    const deltaY = Math.round((event.clientY - startClientY) / cellHeight);
    
    // Calculate new position
    const newX = Math.max(0, Math.min(this._gridSize.columns - size.width, startPosition.x + deltaX));
    const newY = Math.max(0, Math.min(this._gridSize.rows - size.height, startPosition.y + deltaY));
    
    // Update drag state
    this._dragState.currentPosition = { x: newX, y: newY };
    
    // Update placeholder position
    this.updatePlaceholder(newX, newY, size.width, size.height);
  }
  
  /**
   * Handle resize move
   * @param {MouseEvent} event - Mouse move event
   * @private
   */
  handleResizeMove(event) {
    const { position, startSize, startClientX, startClientY } = this._resizeState;
    
    // Calculate grid movement
    const gridRect = this.$('.grid-container').getBoundingClientRect();
    const cellWidth = gridRect.width / this._gridSize.columns;
    const cellHeight = gridRect.height / this._gridSize.rows;
    
    const deltaWidth = Math.round((event.clientX - startClientX) / cellWidth);
    const deltaHeight = Math.round((event.clientY - startClientY) / cellHeight);
    
    // Calculate new size
    const newWidth = Math.max(1, Math.min(this._gridSize.columns - position.x, startSize.width + deltaWidth));
    const newHeight = Math.max(1, Math.min(this._gridSize.rows - position.y, startSize.height + deltaHeight));
    
    // Update resize state
    this._resizeState.currentSize = { width: newWidth, height: newHeight };
    
    // Update placeholder size
    this.updatePlaceholder(position.x, position.y, newWidth, newHeight);
  }
  
  /**
   * Handle mouse up event for drag and resize
   * @param {MouseEvent} event - Mouse up event
   * @private
   */
  handleMouseUp(event) {
    if (this._dragState) {
      this.finalizeDrag();
    } else if (this._resizeState) {
      this.finalizeResize();
    }
  }
  
  /**
   * Finalize drag operation
   * @private
   */
  finalizeDrag() {
    const { cell, currentPosition } = this._dragState;
    
    // Update cell position
    cell.setGridPosition(currentPosition.x, currentPosition.y);
    
    // Update cell position in map
    this._cellPositions.set(cell.id, currentPosition);
    
    // Clean up
    this.removePlaceholder();
    const overlay = this.$('.grid-overlay');
    overlay.classList.remove('active');
    this._dragState = null;
  }
  
  /**
   * Finalize resize operation
   * @private
   */
  finalizeResize() {
    const { cell, currentSize } = this._resizeState;
    
    // Update cell size
    cell.setGridSize(currentSize.width, currentSize.height);
    
    // Clean up
    this.removePlaceholder();
    const overlay = this.$('.grid-overlay');
    overlay.classList.remove('active');
    this._resizeState = null;
  }
  
  /**
   * Create a placeholder element for drag and resize
   * @param {number} x - X position in grid
   * @param {number} y - Y position in grid
   * @param {number} width - Width in grid cells
   * @param {number} height - Height in grid cells
   * @private
   */
  createPlaceholder(x, y, width, height) {
    // Remove existing placeholder
    this.removePlaceholder();
    
    // Create new placeholder
    const placeholder = document.createElement('div');
    placeholder.classList.add('grid-placeholder');
    
    // Position placeholder
    this.updatePlaceholder(x, y, width, height, placeholder);
    
    // Add placeholder to overlay
    const overlay = this.$('.grid-overlay');
    overlay.appendChild(placeholder);
  }
  
  /**
   * Update placeholder position and size
   * @param {number} x - X position in grid
   * @param {number} y - Y position in grid
   * @param {number} width - Width in grid cells
   * @param {number} height - Height in grid cells
   * @param {HTMLElement} [placeholder] - Placeholder element (optional)
   * @private
   */
  updatePlaceholder(x, y, width, height, placeholder = null) {
    // Get placeholder
    placeholder = placeholder || this.$('.grid-placeholder');
    if (!placeholder) return;
    
    // Calculate grid cell size
    const gridRect = this.$('.grid-container').getBoundingClientRect();
    const cellWidth = gridRect.width / this._gridSize.columns;
    const cellHeight = gridRect.height / this._gridSize.rows;
    
    // Calculate placeholder position and size
    const left = x * cellWidth + 10; // 10px for grid padding
    const top = y * cellHeight + 10; // 10px for grid padding
    const placeholderWidth = width * cellWidth - 10; // 10px for grid gap
    const placeholderHeight = height * cellHeight - 10; // 10px for grid gap
    
    // Update placeholder style
    placeholder.style.left = `${left}px`;
    placeholder.style.top = `${top}px`;
    placeholder.style.width = `${placeholderWidth}px`;
    placeholder.style.height = `${placeholderHeight}px`;
  }
  
  /**
   * Remove placeholder element
   * @private
   */
  removePlaceholder() {
    const placeholder = this.$('.grid-placeholder');
    if (placeholder) {
      placeholder.parentNode.removeChild(placeholder);
    }
  }
  
  /**
   * Handle cell events
   * @param {CustomEvent} event - Cell event
   * @private
   */
  handleCellEvent(event) {
    // Forward cell events to listeners
    this.emit('grid-cell-event', event.detail);
  }
  
  /**
   * Add a cell to the grid
   * @param {LahatCell} cell - Cell to add
   * @param {number} x - X position in grid
   * @param {number} y - Y position in grid
   * @param {number} width - Width in grid cells
   * @param {number} height - Height in grid cells
   * @returns {LahatCell} - Added cell
   */
  addCell(cell, x = 0, y = 0, width = 1, height = 1) {
    // Set cell position and size
    cell.setGridPosition(x, y);
    cell.setGridSize(width, height);
    
    // Add cell to grid
    const gridContainer = this.$('.grid-container');
    gridContainer.appendChild(cell);
    
    // Store cell reference
    this._cells.set(cell.id, cell);
    this._cellPositions.set(cell.id, { x, y });
    
    // Emit cell added event
    this.emit('grid-cell-added', {
      grid: this,
      cell,
      position: { x, y },
      size: { width, height }
    });
    
    return cell;
  }
  
  /**
   * Remove a cell from the grid
   * @param {LahatCell|string} cellOrId - Cell or cell ID to remove
   * @returns {boolean} - True if cell was removed
   */
  removeCell(cellOrId) {
    const cellId = typeof cellOrId === 'string' ? cellOrId : cellOrId.id;
    const cell = this._cells.get(cellId);
    
    if (cell) {
      // Remove cell from grid
      const gridContainer = this.$('.grid-container');
      gridContainer.removeChild(cell);
      
      // Remove cell references
      this._cells.delete(cellId);
      this._cellPositions.delete(cellId);
      
      // Emit cell removed event
      this.emit('grid-cell-removed', {
        grid: this,
        cell
      });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Get a cell by ID
   * @param {string} cellId - Cell ID
   * @returns {LahatCell|null} - Cell or null if not found
   */
  getCell(cellId) {
    return this._cells.get(cellId) || null;
  }
  
  /**
   * Get all cells in the grid
   * @returns {LahatCell[]} - Array of cells
   */
  getCells() {
    return Array.from(this._cells.values());
  }
  
  /**
   * Create a new cell and add it to the grid
   * @param {number} x - X position in grid
   * @param {number} y - Y position in grid
   * @param {number} width - Width in grid cells
   * @param {number} height - Height in grid cells
   * @returns {LahatCell} - Created cell
   */
  createCell(x = 0, y = 0, width = 1, height = 1) {
    const cell = new LahatCell();
    return this.addCell(cell, x, y, width, height);
  }
  
  /**
   * Set the grid size
   * @param {number} columns - Number of columns
   * @param {number} rows - Number of rows
   */
  setGridSize(columns, rows) {
    this._gridSize = { columns, rows };
    
    // Update grid template
    const gridContainer = this.$('.grid-container');
    gridContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${rows}, minmax(50px, 1fr))`;
    
    // Emit grid size changed event
    this.emit('grid-size-changed', {
      grid: this,
      size: this._gridSize
    });
  }
  
  /**
   * Get the grid size
   * @returns {Object} - Grid size with columns and rows
   */
  getGridSize() {
    return { ...this._gridSize };
  }
  
  /**
   * Check if a grid position is occupied
   * @param {number} x - X position in grid
   * @param {number} y - Y position in grid
   * @param {number} width - Width in grid cells
   * @param {number} height - Height in grid cells
   * @param {string} [excludeCellId] - Cell ID to exclude from check
   * @returns {boolean} - True if position is occupied
   */
  isPositionOccupied(x, y, width, height, excludeCellId = null) {
    // Check each cell in the grid
    for (const [cellId, cell] of this._cells.entries()) {
      // Skip excluded cell
      if (excludeCellId && cellId === excludeCellId) {
        continue;
      }
      
      // Get cell position and size
      const position = cell.getGridPosition();
      const size = cell.getGridSize();
      
      // Check for overlap
      if (
        x < position.x + size.width &&
        x + width > position.x &&
        y < position.y + size.height &&
        y + height > position.y
      ) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Find a free position in the grid
   * @param {number} width - Width in grid cells
   * @param {number} height - Height in grid cells
   * @returns {Object|null} - Free position with x and y coordinates or null if not found
   */
  findFreePosition(width, height) {
    // Try each position in the grid
    for (let y = 0; y < this._gridSize.rows - height + 1; y++) {
      for (let x = 0; x < this._gridSize.columns - width + 1; x++) {
        if (!this.isPositionOccupied(x, y, width, height)) {
          return { x, y };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Clear all cells from the grid
   */
  clear() {
    // Remove all cells
    const cells = this.getCells();
    cells.forEach(cell => this.removeCell(cell));
    
    // Clear cell maps
    this._cells.clear();
    this._cellPositions.clear();
    
    // Emit grid cleared event
    this.emit('grid-cleared', {
      grid: this
    });
  }
  
  /**
   * Get grid metadata
   * @returns {Object} - Grid metadata
   */
  getMetadata() {
    return {
      id: this.id,
      size: this._gridSize,
      cells: Array.from(this._cells.values()).map(cell => cell.getMetadata())
    };
  }
  
  /**
   * Save grid layout to JSON
   * @returns {Object} - Grid layout JSON
   */
  saveLayout() {
    return {
      gridSize: this._gridSize,
      cells: Array.from(this._cells.entries()).map(([id, cell]) => {
        const position = cell.getGridPosition();
        const size = cell.getGridSize();
        const content = cell.getContent();
        
        return {
          id,
          position,
          size,
          contentType: content.type,
          contentMetadata: content.type === 'widget' 
            ? (typeof content.content.getMetadata === 'function' ? content.content.getMetadata() : null)
            : null
        };
      })
    };
  }
  
  /**
   * Load grid layout from JSON
   * @param {Object} layout - Grid layout JSON
   * @param {Function} widgetFactory - Function to create widgets from metadata
   * @returns {boolean} - True if layout was loaded successfully
   */
  loadLayout(layout, widgetFactory) {
    try {
      // Clear existing cells
      this.clear();
      
      // Set grid size
      this.setGridSize(layout.gridSize.columns, layout.gridSize.rows);
      
      // Create cells
      layout.cells.forEach(cellData => {
        const cell = this.createCell(
          cellData.position.x,
          cellData.position.y,
          cellData.size.width,
          cellData.size.height
        );
        
        // Set content if available
        if (cellData.contentType === 'widget' && cellData.contentMetadata && widgetFactory) {
          const widget = widgetFactory(cellData.contentMetadata);
          if (widget) {
            cell.setWidget(widget);
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error loading grid layout:', error);
      this.handleError(error);
      return false;
    }
  }
}

// Register the component
customElements.define('lahat-grid', LahatGrid);

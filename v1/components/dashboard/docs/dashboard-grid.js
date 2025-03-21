/**
 * Dashboard Grid Component
 * A container component that manages LahatCells and handles layout.
 * This implementation follows the WebComponent architecture where:
 * - LahatCells manage WebComponents
 * - DashboardGrid manages LahatCells
 * - EventBus handles global event communication (only if needed)
 */

import { eventBus } from '../../core/event-bus.js';
import { LahatCell } from './lahat-cell.js';

/**
 * DashboardGrid component for managing LahatCells
 * @extends HTMLElement
 */
export class DashboardGrid extends HTMLElement {
  /**
   * Create a new DashboardGrid instance
   */
  constructor() {
    super();
    
    // Grid properties
    this._cells = new Map();
    this._gridSize = { columns: 12, rows: 8 };
    this._cellSize = { width: 100, height: 100 };
    this._gridGap = 10;
    
    // Create shadow DOM
    this.attachShadow({ mode: 'open' });
    
    // Initialize the grid
    this.render();
    
    // Set up event handlers
    this.setupEventHandlers();
  }
  
  /**
   * Called when the element is added to the DOM
   */
  connectedCallback() {
    // Load saved dashboard state if available
    this.loadDashboardState();
    
    // Emit connected event
    this.dispatchEvent(new CustomEvent('dashboard-connected', {
      bubbles: true,
      composed: true,
      detail: { id: this.id }
    }));
  }
  
  /**
   * Called when the element is removed from the DOM
   */
  disconnectedCallback() {
    // Save dashboard state
    this.saveDashboardState();
    
    // Remove event listeners
    this.removeEventListeners();
    
    // Emit disconnected event
    this.dispatchEvent(new CustomEvent('dashboard-disconnected', {
      bubbles: true,
      composed: true,
      detail: { id: this.id }
    }));
  }
  
  /**
   * Set up event handlers for the grid
   * @private
   */
  setupEventHandlers() {
    // Listen for cell events
    this.addEventListener('cell-event', this.handleCellEvent.bind(this));
    
    // Listen for resize events
    window.addEventListener('resize', this.handleWindowResize.bind(this));
    
    // Subscribe to relevant EventBus events
    eventBus.subscribe('widget-created', this.handleWidgetCreated.bind(this));
  }
  
  /**
   * Remove event listeners
   * @private
   */
  removeEventListeners() {
    // Remove window resize listener
    window.removeEventListener('resize', this.handleWindowResize.bind(this));
    
    // Unsubscribe from EventBus events
    eventBus.unsubscribe('widget-created', this.handleWidgetCreated.bind(this));
  }
  
  /**
   * Handle cell events
   * @param {CustomEvent} event - Cell event
   * @private
   */
  handleCellEvent(event) {
    const { sourceCell, eventName, data } = event.detail;
    
    // Handle specific cell events
    switch (eventName) {
      case 'cell-drag-start':
        this.handleCellDragStart(sourceCell, data);
        break;
      case 'cell-resize-start':
        this.handleCellResizeStart(sourceCell, data);
        break;
      case 'cell-content-changed':
        this.handleCellContentChanged(sourceCell, data);
        break;
      default:
        // Forward other events to the EventBus if needed
        eventBus.publish(`dashboard:${eventName}`, {
          sourceCell,
          dashboardId: this.id,
          ...data
        });
    }
  }
  
  /**
   * Handle window resize events
   * @param {Event} event - Resize event
   * @private
   */
  handleWindowResize(event) {
    // Adjust grid layout based on window size
    this.adjustGridLayout();
    
    // Notify cells of resize
    this.notifyCellsOfResize();
  }
  
  /**
   * Handle widget created events
   * @param {Object} data - Widget data
   * @private
   */
  handleWidgetCreated(data) {
    const { widgetType, widgetId } = data;
    
    // Add the widget to the dashboard
    this.addWidget(widgetType, widgetId);
  }
  
  /**
   * Handle cell drag start
   * @param {LahatCell} cell - The cell being dragged
   * @param {Object} data - Drag data
   * @private
   */
  handleCellDragStart(cell, data) {
    // Implement drag functionality
    console.log('Cell drag started:', cell.id, data);
    
    // Set up drag tracking
    this._dragData = {
      cell,
      startPosition: { ...data.position },
      currentPosition: { ...data.position }
    };
    
    // Add drag event listeners
    document.addEventListener('mousemove', this.handleDragMove.bind(this));
    document.addEventListener('mouseup', this.handleDragEnd.bind(this));
  }
  
  /**
   * Handle cell resize start
   * @param {LahatCell} cell - The cell being resized
   * @param {Object} data - Resize data
   * @private
   */
  handleCellResizeStart(cell, data) {
    // Implement resize functionality
    console.log('Cell resize started:', cell.id, data);
    
    // Set up resize tracking
    this._resizeData = {
      cell,
      startSize: { ...data.size },
      currentSize: { ...data.size }
    };
    
    // Add resize event listeners
    document.addEventListener('mousemove', this.handleResizeMove.bind(this));
    document.addEventListener('mouseup', this.handleResizeEnd.bind(this));
  }
  
  /**
   * Handle cell content changed
   * @param {LahatCell} cell - The cell with changed content
   * @param {Object} data - Content change data
   * @private
   */
  handleCellContentChanged(cell, data) {
    // Update dashboard state
    this.saveDashboardState();
    
    // Emit dashboard updated event
    this.dispatchEvent(new CustomEvent('dashboard-updated', {
      bubbles: true,
      composed: true,
      detail: {
        dashboardId: this.id,
        cellId: cell.id,
        changeType: 'content',
        data
      }
    }));
  }
  
  /**
   * Add a widget to the dashboard
   * @param {string} widgetType - The type of widget to add
   * @param {string} [widgetId] - Optional widget ID
   * @returns {LahatCell} - The created cell
   */
  addWidget(widgetType, widgetId = null) {
    // Find an available position
    const position = this.findAvailablePosition();
    
    // Create a new cell
    const cell = this.createCell(position.x, position.y);
    
    // Load the widget into the cell
    cell.loadComponent(widgetType);
    
    // Set cell ID if provided
    if (widgetId) {
      cell.id = widgetId;
    }
    
    // Add the cell to the grid
    this.addCell(cell);
    
    // Save dashboard state
    this.saveDashboardState();
    
    return cell;
  }
  
  /**
   * Create a new cell
   * @param {number} x - X position in grid
   * @param {number} y - Y position in grid
   * @returns {LahatCell} - The created cell
   * @private
   */
  createCell(x, y) {
    const cell = document.createElement('lahat-cell');
    cell.setGridPosition(x, y);
    cell.setGridSize(1, 1);
    
    return cell;
  }
  
  /**
   * Add a cell to the grid
   * @param {LahatCell} cell - The cell to add
   * @private
   */
  addCell(cell) {
    // Add to cells map
    this._cells.set(cell.id, cell);
    
    // Add to DOM
    this.shadowRoot.querySelector('.dashboard-grid').appendChild(cell);
    
    // Emit cell added event
    this.dispatchEvent(new CustomEvent('cell-added', {
      bubbles: true,
      composed: true,
      detail: {
        dashboardId: this.id,
        cellId: cell.id,
        position: cell.getGridPosition(),
        size: cell.getGridSize()
      }
    }));
  }
  
  /**
   * Remove a cell from the grid
   * @param {string} cellId - The ID of the cell to remove
   */
  removeCell(cellId) {
    const cell = this._cells.get(cellId);
    
    if (cell) {
      // Remove from DOM
      cell.remove();
      
      // Remove from cells map
      this._cells.delete(cellId);
      
      // Emit cell removed event
      this.dispatchEvent(new CustomEvent('cell-removed', {
        bubbles: true,
        composed: true,
        detail: {
          dashboardId: this.id,
          cellId
        }
      }));
      
      // Save dashboard state
      this.saveDashboardState();
    }
  }
  
  /**
   * Find an available position in the grid
   * @returns {Object} - Available position with x and y coordinates
   * @private
   */
  findAvailablePosition() {
    // Simple algorithm to find the first available position
    // In a real implementation, this would be more sophisticated
    
    // Create a grid representation
    const grid = Array(this._gridSize.rows).fill().map(() => 
      Array(this._gridSize.columns).fill(false)
    );
    
    // Mark occupied positions
    this._cells.forEach(cell => {
      const pos = cell.getGridPosition();
      const size = cell.getGridSize();
      
      for (let y = pos.y; y < pos.y + size.height; y++) {
        for (let x = pos.x; x < pos.x + size.width; x++) {
          if (y < grid.length && x < grid[0].length) {
            grid[y][x] = true;
          }
        }
      }
    });
    
    // Find first available position
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (!grid[y][x]) {
          return { x, y };
        }
      }
    }
    
    // If no position is available, add to the end
    return { x: 0, y: grid.length };
  }
  
  /**
   * Adjust grid layout based on window size
   * @private
   */
  adjustGridLayout() {
    const gridElement = this.shadowRoot.querySelector('.dashboard-grid');
    
    // Calculate available width
    const availableWidth = this.clientWidth;
    
    // Calculate column width
    const columnWidth = Math.floor((availableWidth - (this._gridGap * (this._gridSize.columns - 1))) / this._gridSize.columns);
    
    // Update grid template
    gridElement.style.gridTemplateColumns = `repeat(${this._gridSize.columns}, ${columnWidth}px)`;
    gridElement.style.gridGap = `${this._gridGap}px`;
    
    // Update cell size
    this._cellSize.width = columnWidth;
  }
  
  /**
   * Notify cells of resize
   * @private
   */
  notifyCellsOfResize() {
    this._cells.forEach(cell => {
      if (typeof cell.notifyComponentResize === 'function') {
        cell.notifyComponentResize();
      }
    });
  }
  
  /**
   * Load dashboard state from storage
   * @private
   */
  loadDashboardState() {
    try {
      // In a real implementation, this would load from localStorage or a server
      const savedState = localStorage.getItem(`dashboard-${this.id}`);
      
      if (savedState) {
        const state = JSON.parse(savedState);
        
        // Restore cells
        if (state.cells && Array.isArray(state.cells)) {
          state.cells.forEach(cellData => {
            const cell = this.createCell(cellData.position.x, cellData.position.y);
            cell.id = cellData.id;
            cell.setGridSize(cellData.size.width, cellData.size.height);
            
            // Load component
            if (cellData.componentType) {
              cell.loadComponent(cellData.componentType);
            }
            
            this.addCell(cell);
          });
        }
      }
    } catch (error) {
      console.error('Error loading dashboard state:', error);
    }
  }
  
  /**
   * Save dashboard state to storage
   * @private
   */
  saveDashboardState() {
    try {
      // In a real implementation, this would save to localStorage or a server
      const state = {
        id: this.id,
        cells: Array.from(this._cells.values()).map(cell => ({
          id: cell.id,
          position: cell.getGridPosition(),
          size: cell.getGridSize(),
          componentType: cell.getComponentType()
        }))
      };
      
      localStorage.setItem(`dashboard-${this.id}`, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving dashboard state:', error);
    }
  }
  
  /**
   * Render the dashboard grid
   * @private
   */
  render() {
    const styles = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        overflow: auto;
      }
      
      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(${this._gridSize.columns}, ${this._cellSize.width}px);
        grid-auto-rows: ${this._cellSize.height}px;
        grid-gap: ${this._gridGap}px;
        padding: 20px;
      }
    `;
    
    const html = `
      <div class="dashboard-grid"></div>
    `;
    
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${html}
    `;
  }
}

// Register the component
customElements.define('dashboard-grid', DashboardGrid);

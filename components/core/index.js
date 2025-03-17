/**
 * Core Components Index
 * Exports all core components for easier importing
 */

// Import secure widget loader
import { 
  loadWidgetSecurely, 
  loadWidgetIntoGrid, 
  loadWidgetIntoCell 
} from './secure-widget-loader.js';

// Base components
export { BaseComponent } from './base-component.js';
export { WidgetComponent } from './widget-component.js';
export { LahatCell } from './lahat-cell.js';
export { LahatGrid } from './lahat-grid.js';

// Event bus
export { 
  EventBus, 
  globalEventBus, 
  createNamespacedEventBus 
} from './event-bus.js';

// Data store
export { 
  WidgetDataStore, 
  createWidgetDataStore, 
  getWidgetDataStore 
} from './widget-data-store.js';

/**
 * Create a widget and add it to a cell
 * @param {string} widgetType - Widget tag name
 * @param {LahatCell} cell - Cell to add the widget to
 * @returns {HTMLElement} - Created widget
 */
export function createWidgetInCell(widgetType, cell) {
  // Create widget
  const widget = document.createElement(widgetType);
  
  // Add widget to cell
  cell.setWidget(widget);
  
  return widget;
}

/**
 * Create a cell and add it to a grid
 * @param {LahatGrid} grid - Grid to add the cell to
 * @param {number} x - X position in grid
 * @param {number} y - Y position in grid
 * @param {number} width - Width in grid cells
 * @param {number} height - Height in grid cells
 * @returns {LahatCell} - Created cell
 */
export function createCellInGrid(grid, x = 0, y = 0, width = 1, height = 1) {
  // Create cell
  const cell = document.createElement('lahat-cell');
  
  // Add cell to grid
  return grid.addCell(cell, x, y, width, height);
}

/**
 * Create a widget in a new cell in a grid
 * @param {string} widgetType - Widget tag name
 * @param {LahatGrid} grid - Grid to add the cell to
 * @param {number} x - X position in grid
 * @param {number} y - Y position in grid
 * @param {number} width - Width in grid cells
 * @param {number} height - Height in grid cells
 * @returns {Object} - Object with cell and widget
 */
export function createWidgetInGrid(widgetType, grid, x = 0, y = 0, width = 1, height = 1) {
  // Create cell
  const cell = createCellInGrid(grid, x, y, width, height);
  
  // Create widget
  const widget = createWidgetInCell(widgetType, cell);
  
  return { cell, widget };
}

/**
 * Create nested cells in a parent cell
 * @param {LahatCell} parentCell - Parent cell
 * @param {number} count - Number of child cells to create
 * @returns {LahatCell[]} - Array of created cells
 */
export function createNestedCells(parentCell, count = 2) {
  // Create child cells
  const childCells = Array.from({ length: count }, () => document.createElement('lahat-cell'));
  
  // Set parent cell content to child cells
  parentCell.setCells(childCells);
  
  return childCells;
}

// Secure widget loader
export {
  loadWidgetSecurely,
  loadWidgetIntoGrid,
  loadWidgetIntoCell
};

export default {
  BaseComponent,
  WidgetComponent,
  LahatCell,
  LahatGrid,
  EventBus,
  globalEventBus,
  createNamespacedEventBus,
  WidgetDataStore,
  createWidgetDataStore,
  getWidgetDataStore,
  createWidgetInCell,
  createCellInGrid,
  createWidgetInGrid,
  createNestedCells,
  loadWidgetSecurely,
  loadWidgetIntoGrid,
  loadWidgetIntoCell
};

// Import components
import { 
  LahatGrid, 
  LahatCell, 
  createWidgetInGrid
} from '../../components/core/index.js';
import { DoesNothingWidget } from './does-nothing-widget.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Create grid
  const gridContainer = document.getElementById('grid-container');
  const grid = document.createElement('lahat-grid');
  gridContainer.appendChild(grid);
  
  // Set up event listeners
  document.getElementById('add-widget').addEventListener('click', addDoesNothingWidget);
  document.getElementById('clear-grid').addEventListener('click', clearGrid);
  
  // Add initial widget
  addDoesNothingWidget();
  
  /**
   * Add a "does nothing" widget to the grid
   */
  function addDoesNothingWidget() {
    // Find free position
    const position = grid.findFreePosition(3, 3) || { x: 0, y: 0 };
    
    // Create widget in grid
    const { cell, widget } = createWidgetInGrid('does-nothing-widget', grid, position.x, position.y, 3, 3);
    
    console.log('Added does-nothing widget');
  }
  
  /**
   * Clear the grid
   */
  function clearGrid() {
    grid.clear();
    console.log('Cleared grid');
  }
});

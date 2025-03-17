/**
 * Secure Widget Loader
 * Provides functionality for securely loading widget components
 */

import { generateScriptHash } from '../../modules/utils/cspUtils.js';
import securityManifest from '../../modules/utils/widgetSecurityManifest.js';

/**
 * Securely load a widget from a file
 * @param {string} widgetId - Widget ID
 * @returns {Promise<HTMLElement|null>} - Widget instance or null if loading failed
 */
export async function loadWidgetSecurely(widgetId) {
  try {
    // Initialize security manifest if needed
    if (!securityManifest.manifest) {
      await securityManifest.initialize();
    }
    
    // Get widget info from manifest
    const widgetInfo = securityManifest.getWidgetInfo(widgetId);
    if (!widgetInfo) {
      console.error(`Widget not found in security manifest: ${widgetId}`);
      return null;
    }
    
    // Fetch the widget code
    const response = await fetch(widgetInfo.filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch widget file: ${response.status} ${response.statusText}`);
    }
    
    const code = await response.text();
    
    // Verify the hash
    const hash = generateScriptHash(code);
    if (hash !== widgetInfo.hash) {
      console.error(`Widget integrity check failed: ${widgetId}`);
      console.error(`Expected hash: ${widgetInfo.hash}`);
      console.error(`Actual hash: ${hash}`);
      return null;
    }
    
    // Create a blob URL for the verified code
    const blob = new Blob([code], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    
    try {
      // Dynamically import the widget module
      const module = await import(blobUrl);
      
      // Find the widget class (should be the default export or named export)
      const WidgetClass = module.default || Object.values(module).find(
        exp => typeof exp === 'function' && /class/.test(exp.toString())
      );
      
      if (!WidgetClass) {
        throw new Error('Widget class not found in module');
      }
      
      // Check if the custom element is already defined
      const tagName = getTagNameFromCode(code);
      if (!customElements.get(tagName)) {
        // Register the custom element
        customElements.define(tagName, WidgetClass);
      }
      
      // Create an instance of the widget
      const widget = document.createElement(tagName);
      
      // Store the CSP hash on the widget for inline loading
      widget.setAttribute('data-csp-hash', hash);
      
      return widget;
    } finally {
      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);
    }
  } catch (error) {
    console.error(`Error loading widget ${widgetId}:`, error);
    return null;
  }
}

/**
 * Extract the tag name from widget code
 * @param {string} code - Widget JS code
 * @returns {string} - Tag name
 */
function getTagNameFromCode(code) {
  // Look for customElements.define('tag-name', ClassName)
  const match = code.match(/customElements\.define\s*\(\s*['"]([a-z]+-[a-z-]+)['"]/i);
  if (match) {
    return match[1];
  }
  
  // Fallback: generate a tag name based on the widget ID
  return `widget-${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Load a widget into a Lahat cell
 * @param {string} widgetId - Widget ID
 * @param {HTMLElement} grid - Lahat grid element
 * @param {number} x - X position in grid
 * @param {number} y - Y position in grid
 * @param {number} width - Width in grid cells
 * @param {number} height - Height in grid cells
 * @returns {Promise<{cell: HTMLElement, widget: HTMLElement}|null>} - Cell and widget or null if loading failed
 */
export async function loadWidgetIntoGrid(widgetId, grid, x = 0, y = 0, width = 3, height = 3) {
  // Load the widget securely
  const widget = await loadWidgetSecurely(widgetId);
  if (!widget) {
    return null;
  }
  
  // Create a cell for the widget
  const cell = document.createElement('lahat-cell');
  
  // Add the widget to the cell
  cell.setWidget(widget);
  
  // Add the cell to the grid
  grid.addCell(cell, x, y, width, height);
  
  return { cell, widget };
}

/**
 * Load a widget into an existing Lahat cell
 * @param {string} widgetId - Widget ID
 * @param {HTMLElement} cell - Lahat cell element
 * @returns {Promise<HTMLElement|null>} - Widget or null if loading failed
 */
export async function loadWidgetIntoCell(widgetId, cell) {
  // Load the widget securely
  const widget = await loadWidgetSecurely(widgetId);
  if (!widget) {
    return null;
  }
  
  // Add the widget to the cell
  cell.setWidget(widget);
  
  return widget;
}

/**
 * Load a mini app component directly
 * @param {string} filePath - Path to the component file
 * @param {string} [widgetId] - Optional widget ID for security verification
 * @returns {Promise<HTMLElement|null>} - Component instance or null if loading failed
 */
export async function loadMiniAppComponent(filePath, widgetId = null) {
  try {
    // Fetch the component code
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch component file: ${response.status} ${response.statusText}`);
    }
    
    const code = await response.text();
    
    // Generate hash for the component
    const hash = generateScriptHash(code);
    
    // Verify against security manifest if widgetId is provided
    if (widgetId) {
      // Initialize security manifest if needed
      if (!securityManifest.manifest) {
        await securityManifest.initialize();
      }
      
      const widgetInfo = securityManifest.getWidgetInfo(widgetId);
      if (widgetInfo && hash !== widgetInfo.hash) {
        console.error(`Component integrity check failed: ${widgetId}`);
        console.error(`Expected hash: ${widgetInfo.hash}`);
        console.error(`Actual hash: ${hash}`);
        return null;
      }
    }
    
    // Create a blob URL for the verified code
    const blob = new Blob([code], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    
    try {
      // Dynamically import the component module
      const module = await import(blobUrl);
      
      // Find the component class (should be the default export or named export)
      const ComponentClass = module.default || Object.values(module).find(
        exp => typeof exp === 'function' && /class/.test(exp.toString())
      );
      
      if (!ComponentClass) {
        throw new Error('Component class not found in module');
      }
      
      // Check if the custom element is already defined
      const tagName = getTagNameFromCode(code);
      if (!customElements.get(tagName)) {
        // Register the custom element
        customElements.define(tagName, ComponentClass);
      }
      
      // Create an instance of the component
      const component = document.createElement(tagName);
      
      // Store the CSP hash on the component for inline loading
      component.setAttribute('data-csp-hash', hash);
      
      return component;
    } finally {
      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);
    }
  } catch (error) {
    console.error(`Error loading mini app component:`, error);
    return null;
  }
}

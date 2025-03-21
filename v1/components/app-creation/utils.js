/**
 * App Creation Utilities
 * Helper functions for the app creation components
 */

/**
 * Shows an error message using the error container
 * @param {string} title - Error title
 * @param {string} message - Error message
 * @param {string} level - Error level ('error', 'warning', 'info', 'fatal')
 * @returns {HTMLElement} - The created error message element
 */
export function showError(title, message, level = 'error') {
  const errorContainer = document.querySelector('error-container') || 
    (() => {
      const container = document.createElement('error-container');
      document.body.appendChild(container);
      return container;
    })();
  
  return errorContainer.addError(title, message, level);
}

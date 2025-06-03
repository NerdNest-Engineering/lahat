// Import all app creation components
import '../src/app-creator/index.js';

// Import error handling components
import '../components/core/error-handling/error-container.js';
import '../components/core/error-handling/error-message.js';

// Global error handling function
function showError(title, message, level = 'error') {
  const errorContainer = document.querySelector('error-container') || 
    (() => {
      const container = document.createElement('error-container');
      document.body.appendChild(container);
      return container;
    })();
  
  errorContainer.addError(title, message, level);
}

// Make showError available globally
window.showError = showError;

// Global error handlers to prevent window closure
window.addEventListener('error', (event) => {
  if (window.showError) {
    window.showError('Application Error', `An unexpected error occurred: ${event.error?.message || 'Unknown error'}`);
  }
  event.preventDefault();
  return false;
});

window.addEventListener('unhandledrejection', (event) => {
  if (window.showError) {
    window.showError('Promise Error', `An unexpected promise rejection occurred: ${event.reason?.message || 'Unknown error'}`);
  }
  event.preventDefault();
  return false;
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create and append the main controller if it doesn't exist
  if (!document.querySelector('app-creation-controller')) {
    const controller = document.createElement('app-creation-controller');
    const container = document.querySelector('.content') || document.body;
    container.appendChild(controller);
  }
  
  // Create error container if it doesn't exist
  if (!document.querySelector('error-container')) {
    const errorContainer = document.createElement('error-container');
    document.body.appendChild(errorContainer);
  }
});

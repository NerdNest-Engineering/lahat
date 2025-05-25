// Import all app creation components
import '../components/ui/app-creation/index.js';

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

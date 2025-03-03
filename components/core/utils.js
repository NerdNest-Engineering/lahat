/**
 * Utility functions for web components
 */

/**
 * Creates and shows an error message using the error-container component
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

/**
 * Formats a date for display
 * @param {string|Date} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} - Formatted date string
 */
export function formatDate(date, includeTime = true) {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const dateString = dateObj.toLocaleDateString();
  
  if (!includeTime) {
    return dateString;
  }
  
  const timeString = dateObj.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return `${dateString} ${timeString}`;
}

/**
 * Truncates a string to a maximum length and adds ellipsis if needed
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated string
 */
export function truncateString(str, maxLength) {
  if (!str || str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength) + '...';
}

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

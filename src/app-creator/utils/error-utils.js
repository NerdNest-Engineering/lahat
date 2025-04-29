/**
 * Error Utilities
 * Utility functions for error handling in the app creator module
 */

/**
 * Error levels
 * @enum {string}
 */
export const ErrorLevel = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  FATAL: 'fatal'
};

/**
 * Show an error message in the UI
 * @param {string} title - The error title
 * @param {string} message - The error message
 * @param {ErrorLevel} level - The error level
 */
export function showError(title, message, level = ErrorLevel.ERROR) {
  console.error(`${level.toUpperCase()}: ${title} - ${message}`);
  
  // Get the error container
  const errorContainer = document.querySelector('error-container');
  
  if (errorContainer) {
    // Add the error to the container
    errorContainer.addError(title, message, level);
  } else {
    // If the error container doesn't exist, create it
    const container = document.createElement('error-container');
    document.body.appendChild(container);
    
    // Add the error to the container
    container.addError(title, message, level);
  }
}

/**
 * Log an error to the console
 * @param {string} context - The error context
 * @param {Error} error - The error object
 * @param {ErrorLevel} level - The error level
 */
export function logError(context, error, level = ErrorLevel.ERROR) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';
  
  console.error(`${level.toUpperCase()} in ${context}: ${errorMessage}`);
  
  if (errorStack) {
    console.error(errorStack);
  }
  
  // For fatal errors, also show in the UI
  if (level === ErrorLevel.FATAL) {
    showError(`Error in ${context}`, errorMessage, level);
  }
}

/**
 * Create a custom error with additional properties
 * @param {string} message - The error message
 * @param {string} code - The error code
 * @param {any} details - Additional error details
 * @returns {Error} - The custom error
 */
export function createError(message, code, details) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Handle an error from an async function
 * @param {Error} error - The error object
 * @param {string} context - The error context
 * @param {Function} [onError] - Optional error callback
 */
export function handleAsyncError(error, context, onError) {
  logError(context, error);
  
  if (typeof onError === 'function') {
    onError(error);
  }
}

/**
 * Wrap an async function with error handling
 * @param {Function} fn - The async function to wrap
 * @param {string} context - The error context
 * @param {Function} [onError] - Optional error callback
 * @returns {Function} - The wrapped function
 */
export function withErrorHandling(fn, context, onError) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleAsyncError(error, context, onError);
      throw error;
    }
  };
}

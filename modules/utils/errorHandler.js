/**
 * Centralized error handling module for both main and renderer processes
 */
export class ErrorHandler {
  static ERROR_LEVELS = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    FATAL: 'fatal'
  };
  
  /**
   * Log an error with context and level
   * @param {string} context - The context where the error occurred
   * @param {Error|string} error - The error object or message
   * @param {string} level - Error level from ERROR_LEVELS
   */
  static logError(context, error, level = ErrorHandler.ERROR_LEVELS.ERROR) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${level.toUpperCase()}] [${context}]:`, error);
    
    // Could add additional logging here (file, telemetry, etc.)
  }
  
  /**
   * Format an error for UI display
   * @param {Error|string} error - The error object or message
   * @param {string} context - Optional context information
   * @returns {Object} Formatted error object for UI
   */
  static formatErrorForUI(error, context = '') {
    if (typeof error === 'string') {
      return {
        message: error,
        context
      };
    }
    
    return {
      message: error.message || 'An unknown error occurred',
      context,
      stack: error.stack,
      code: error.code
    };
  }
  
  /**
   * Format an error for IPC response
   * @param {Error|string} error - The error object or message
   * @param {string} operation - The operation that failed
   * @returns {Object} Standardized error response for IPC
   */
  static formatErrorForIPC(error, operation) {
    ErrorHandler.logError(operation, error);
    
    return {
      success: false,
      error: error.message || 'An unknown error occurred',
      code: error.code,
      operation
    };
  }
  
  /**
   * Get a user-friendly error message
   * @param {Error|Object|string} error - The error object or message
   * @returns {string} User-friendly error message
   */
  static getUserFriendlyMessage(error) {
    // Map common error codes to user-friendly messages
    const errorMap = {
      'ENOTFOUND': 'Could not connect to the Claude API. Please check your internet connection.',
      'UNAUTHORIZED': 'Your API key appears to be invalid. Please check your API settings.',
      'RATE_LIMIT_EXCEEDED': 'You have reached the Claude API rate limit. Please try again later.',
      'CONTENT_POLICY_VIOLATION': 'Your request was flagged by content filters. Please modify your prompt.'
    };
    
    if (error.code && errorMap[error.code]) {
      return errorMap[error.code];
    }
    
    // Check for common error message patterns
    const message = typeof error === 'string' ? error : (error.message || '');
    
    if (message.includes('API key')) {
      return 'There was an issue with your API key. Please check your settings.';
    }
    
    if (message.includes('network') || message.includes('connection')) {
      return 'A network error occurred. Please check your internet connection.';
    }
    
    return 'An unexpected error occurred. Please try again.';
  }
  
  /**
   * Handle an error and show it in the UI
   * @param {Error|string} error - The error object or message
   * @param {string} context - The context where the error occurred
   * @param {string} level - Error level from ERROR_LEVELS
   */
  static handleError(error, context, level = ErrorHandler.ERROR_LEVELS.ERROR) {
    // Log the error
    ErrorHandler.logError(context, error, level);
    
    // If we're in the renderer process, show the error in the UI
    if (typeof window !== 'undefined' && window.document) {
      const { showError } = require('../../components/core/utils.js');
      const friendlyMessage = ErrorHandler.getUserFriendlyMessage(error);
      showError(context, friendlyMessage, level.toLowerCase());
    }
  }
}

/**
 * Centralized error handling module for both main and renderer processes
 * Enhanced with structured error classes and improved error handling
 */

import { 
  LahatError, 
  fromError, 
  getUserFriendlyMessage as getFriendlyMessage 
} from './errors.js';
import logger from './logger.js';

/**
 * Central error handler for application-wide error management
 */
export class ErrorHandler {
  /**
   * Standard error levels for consistent logging
   */
  static ERROR_LEVELS = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    FATAL: 'fatal'
  };
  
  /**
   * Log an error with context and level
   * @param {string} context - The context where the error occurred
   * @param {Error|LahatError|string} error - The error object or message
   * @param {string} level - Error level from ERROR_LEVELS
   */
  static logError(context, error, level = ErrorHandler.ERROR_LEVELS.ERROR) {
    // Convert to LahatError for consistent handling
    const lahatError = error instanceof Error 
      ? (error instanceof LahatError ? error : fromError(error))
      : new LahatError(String(error), 'GENERIC_ERROR');
    
    // Map ERROR_LEVELS to logger methods
    const logMethod = level === ErrorHandler.ERROR_LEVELS.INFO 
      ? logger.info
      : level === ErrorHandler.ERROR_LEVELS.WARNING 
        ? logger.warn
        : level === ErrorHandler.ERROR_LEVELS.FATAL 
          ? logger.fatal
          : logger.error;
    
    // Log with structured data
    logMethod(
      lahatError.message, 
      {
        code: lahatError.code,
        data: lahatError.data,
        stack: lahatError.stack
      }, 
      context
    );
    
    return lahatError;
  }
  
  /**
   * Format an error for UI display
   * @param {Error|LahatError|string} error - The error object or message
   * @param {string} context - Optional context information
   * @returns {Object} Formatted error object for UI
   */
  static formatErrorForUI(error, context = '') {
    // Convert to LahatError for consistent handling
    const lahatError = error instanceof Error 
      ? (error instanceof LahatError ? error : fromError(error))
      : new LahatError(String(error), 'GENERIC_ERROR');
    
    // Format with user-friendly message
    return {
      message: getFriendlyMessage(lahatError),
      originalMessage: lahatError.message,
      context,
      code: lahatError.code,
      timestamp: lahatError.timestamp.toISOString(),
      // Only include stack in development mode
      ...(process.env.NODE_ENV === 'development' ? { stack: lahatError.stack } : {})
    };
  }
  
  /**
   * Format an error for IPC response
   * @param {Error|LahatError|string} error - The error object or message
   * @param {string} operation - The operation that failed
   * @returns {Object} Standardized error response for IPC
   */
  static formatErrorForIPC(error, operation) {
    // Log the error and convert to LahatError
    const lahatError = ErrorHandler.logError(operation, error);
    
    // Return structured error response
    return {
      success: false,
      error: getFriendlyMessage(lahatError),
      originalMessage: lahatError.message,
      code: lahatError.code,
      operation,
      // Only include stack and data in development mode
      ...(process.env.NODE_ENV === 'development' ? { 
        stack: lahatError.stack,
        data: lahatError.data
      } : {})
    };
  }
  
  /**
   * Get a user-friendly error message
   * @param {Error|LahatError|string} error - The error object or message
   * @returns {string} User-friendly error message
   */
  static getUserFriendlyMessage(error) {
    return getFriendlyMessage(error);
  }
  
  /**
   * Handle an error and show it in the UI
   * @param {Error|LahatError|string} error - The error object or message
   * @param {string} context - The context where the error occurred
   * @param {string} level - Error level from ERROR_LEVELS
   */
  static handleError(error, context, level = ErrorHandler.ERROR_LEVELS.ERROR) {
    // Log the error and convert to LahatError
    const lahatError = ErrorHandler.logError(context, error, level);
    
    // If we're in the renderer process, show the error in the UI
    if (typeof window !== 'undefined' && window.document) {
      try {
        const { showError } = require('../../components/core/utils.js');
        showError(context, getFriendlyMessage(lahatError), level.toLowerCase());
      } catch (uiError) {
        // Fallback if showError fails
        console.error('Failed to show error in UI:', uiError);
        console.error('Original error:', lahatError);
      }
    }
    
    // Return the error for potential further handling
    return lahatError;
  }
  
  /**
   * Wrap a function with error handling
   * @param {Function} fn - Function to wrap
   * @param {Object} options - Options object
   * @param {string} options.context - Context for error logging
   * @param {string} options.level - Error level from ERROR_LEVELS
   * @param {boolean} options.rethrow - Whether to rethrow the error
   * @param {Function} options.onError - Optional custom error handler
   * @returns {Function} Wrapped function with error handling
   */
  static withErrorHandling(fn, { 
    context = fn.name || 'anonymous', 
    level = ErrorHandler.ERROR_LEVELS.ERROR,
    rethrow = false,
    onError = null
  } = {}) {
    return async function errorHandlingWrapper(...args) {
      try {
        return await fn(...args);
      } catch (error) {
        // Handle the error
        const lahatError = ErrorHandler.handleError(error, context, level);
        
        // Call custom error handler if provided
        if (onError && typeof onError === 'function') {
          onError(lahatError, ...args);
        }
        
        // Rethrow if requested
        if (rethrow) {
          throw lahatError;
        }
        
        // Return null or error object depending on context
        return { success: false, error: lahatError };
      }
    };
  }
}

// Export all error classes as a convenience
export * from './errors.js';

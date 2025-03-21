/**
 * Custom error classes for Lahat application
 * Provides structured error handling with error categories and codes
 */

/**
 * Base error class for the application
 * @extends Error
 */
export class LahatError extends Error {
  /**
   * Create a new LahatError
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} data - Additional error data
   */
  constructor(message, code = 'UNKNOWN_ERROR', data = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.data = data;
    this.timestamp = new Date();
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Convert error to a JSON-serializable object
   * @returns {Object} Serializable error object
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      data: this.data,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }
}

/**
 * API related errors
 * @extends LahatError
 */
export class ApiError extends LahatError {
  /**
   * Create a new ApiError
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} data - Additional error data
   */
  constructor(message, code = 'API_ERROR', data = {}) {
    super(message, code, data);
  }
  
  /**
   * Create an error for API key issues
   * @param {string} message - Error message
   * @param {Object} data - Additional error data
   * @returns {ApiError} - API key error
   */
  static apiKey(message = 'Invalid API key', data = {}) {
    return new ApiError(message, 'API_KEY_ERROR', data);
  }
  
  /**
   * Create an error for API authentication issues
   * @param {string} message - Error message
   * @param {Object} data - Additional error data
   * @returns {ApiError} - API authentication error
   */
  static authentication(message = 'API authentication failed', data = {}) {
    return new ApiError(message, 'AUTHENTICATION_ERROR', data);
  }
  
  /**
   * Create an error for API rate limiting
   * @param {string} message - Error message
   * @param {Object} data - Additional error data
   * @returns {ApiError} - API rate limit error
   */
  static rateLimit(message = 'API rate limit exceeded', data = {}) {
    return new ApiError(message, 'RATE_LIMIT_ERROR', data);
  }
  
  /**
   * Create an error for API content policy violations
   * @param {string} message - Error message
   * @param {Object} data - Additional error data
   * @returns {ApiError} - Content policy error
   */
  static contentPolicy(message = 'Content policy violation', data = {}) {
    return new ApiError(message, 'CONTENT_POLICY_ERROR', data);
  }
  
  /**
   * Create an error for network issues
   * @param {string} message - Error message
   * @param {Object} data - Additional error data
   * @returns {ApiError} - Network error
   */
  static network(message = 'Network error', data = {}) {
    return new ApiError(message, 'NETWORK_ERROR', data);
  }
}

/**
 * File system related errors
 * @extends LahatError
 */
export class FileSystemError extends LahatError {
  /**
   * Create a new FileSystemError
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} data - Additional error data
   */
  constructor(message, code = 'FILE_SYSTEM_ERROR', data = {}) {
    super(message, code, data);
  }
  
  /**
   * Create an error for file not found
   * @param {string} filePath - Path to the file
   * @param {Object} data - Additional error data
   * @returns {FileSystemError} - File not found error
   */
  static notFound(filePath, data = {}) {
    return new FileSystemError(
      `File not found: ${filePath}`,
      'FILE_NOT_FOUND',
      { filePath, ...data }
    );
  }
  
  /**
   * Create an error for file access issues
   * @param {string} filePath - Path to the file
   * @param {string} operation - File operation that failed
   * @param {Object} data - Additional error data
   * @returns {FileSystemError} - File access error
   */
  static accessDenied(filePath, operation = 'access', data = {}) {
    return new FileSystemError(
      `Access denied for operation '${operation}' on file: ${filePath}`,
      'ACCESS_DENIED',
      { filePath, operation, ...data }
    );
  }
  
  /**
   * Create an error for invalid file paths
   * @param {string} filePath - Path to the file
   * @param {Object} data - Additional error data
   * @returns {FileSystemError} - Invalid path error
   */
  static invalidPath(filePath, data = {}) {
    return new FileSystemError(
      `Invalid file path: ${filePath}`,
      'INVALID_PATH',
      { filePath, ...data }
    );
  }
  
  /**
   * Create an error for file already exists
   * @param {string} filePath - Path to the file
   * @param {Object} data - Additional error data
   * @returns {FileSystemError} - File exists error
   */
  static fileExists(filePath, data = {}) {
    return new FileSystemError(
      `File already exists: ${filePath}`,
      'FILE_EXISTS',
      { filePath, ...data }
    );
  }
}

/**
 * Window management related errors
 * @extends LahatError
 */
export class WindowError extends LahatError {
  /**
   * Create a new WindowError
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} data - Additional error data
   */
  constructor(message, code = 'WINDOW_ERROR', data = {}) {
    super(message, code, data);
  }
  
  /**
   * Create an error for window not found
   * @param {number|string} windowId - Window ID or name
   * @param {Object} data - Additional error data
   * @returns {WindowError} - Window not found error
   */
  static notFound(windowId, data = {}) {
    return new WindowError(
      `Window not found: ${windowId}`,
      'WINDOW_NOT_FOUND',
      { windowId, ...data }
    );
  }
  
  /**
   * Create an error for window creation issues
   * @param {string} windowType - Type of window
   * @param {Error} originalError - Original error
   * @param {Object} data - Additional error data
   * @returns {WindowError} - Window creation error
   */
  static creationFailed(windowType, originalError, data = {}) {
    return new WindowError(
      `Failed to create window of type '${windowType}': ${originalError.message}`,
      'WINDOW_CREATION_FAILED',
      { windowType, originalError, ...data }
    );
  }
}

/**
 * IPC related errors
 * @extends LahatError
 */
export class IpcError extends LahatError {
  /**
   * Create a new IpcError
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} data - Additional error data
   */
  constructor(message, code = 'IPC_ERROR', data = {}) {
    super(message, code, data);
  }
  
  /**
   * Create an error for invalid channel
   * @param {string} channel - IPC channel name
   * @param {Object} data - Additional error data
   * @returns {IpcError} - Invalid channel error
   */
  static invalidChannel(channel, data = {}) {
    return new IpcError(
      `Invalid IPC channel: ${channel}`,
      'INVALID_CHANNEL',
      { channel, ...data }
    );
  }
  
  /**
   * Create an error for handler not found
   * @param {string} channel - IPC channel name
   * @param {Object} data - Additional error data
   * @returns {IpcError} - Handler not found error
   */
  static handlerNotFound(channel, data = {}) {
    return new IpcError(
      `Handler not found for channel: ${channel}`,
      'HANDLER_NOT_FOUND',
      { channel, ...data }
    );
  }
  
  /**
   * Create an error for invalid parameters
   * @param {string} channel - IPC channel name
   * @param {Object} params - Invalid parameters
   * @param {Object} data - Additional error data
   * @returns {IpcError} - Invalid parameters error
   */
  static invalidParams(channel, params, data = {}) {
    return new IpcError(
      `Invalid parameters for channel: ${channel}`,
      'INVALID_PARAMS',
      { channel, params, ...data }
    );
  }
  
  /**
   * Create an error for timeout
   * @param {string} channel - IPC channel name
   * @param {number} timeout - Timeout duration in ms
   * @param {Object} data - Additional error data
   * @returns {IpcError} - Timeout error
   */
  static timeout(channel, timeout, data = {}) {
    return new IpcError(
      `IPC call timed out after ${timeout}ms for channel: ${channel}`,
      'IPC_TIMEOUT',
      { channel, timeout, ...data }
    );
  }
}

/**
 * Validation related errors
 * @extends LahatError
 */
export class ValidationError extends LahatError {
  /**
   * Create a new ValidationError
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} data - Additional error data
   */
  constructor(message, code = 'VALIDATION_ERROR', data = {}) {
    super(message, code, data);
  }
  
  /**
   * Create an error for invalid input
   * @param {string} field - Field name
   * @param {any} value - Invalid value
   * @param {string} reason - Reason for validation failure
   * @param {Object} data - Additional error data
   * @returns {ValidationError} - Invalid input error
   */
  static invalidInput(field, value, reason = 'invalid', data = {}) {
    return new ValidationError(
      `Invalid input for field '${field}': ${reason}`,
      'INVALID_INPUT',
      { field, value, reason, ...data }
    );
  }
  
  /**
   * Create an error for required field
   * @param {string} field - Required field name
   * @param {Object} data - Additional error data
   * @returns {ValidationError} - Required field error
   */
  static requiredField(field, data = {}) {
    return new ValidationError(
      `Required field missing: ${field}`,
      'REQUIRED_FIELD',
      { field, ...data }
    );
  }
  
  /**
   * Create an error for invalid format
   * @param {string} field - Field name
   * @param {string} expectedFormat - Expected format description
   * @param {Object} data - Additional error data
   * @returns {ValidationError} - Invalid format error
   */
  static invalidFormat(field, expectedFormat, data = {}) {
    return new ValidationError(
      `Invalid format for field '${field}': expected ${expectedFormat}`,
      'INVALID_FORMAT',
      { field, expectedFormat, ...data }
    );
  }
}

/**
 * Map standard Error names to custom error classes
 * Used to convert standard errors to custom errors
 */
const ERROR_MAPPING = {
  'TypeError': (error) => new ValidationError(error.message, 'TYPE_ERROR', { originalError: error }),
  'ReferenceError': (error) => new LahatError(error.message, 'REFERENCE_ERROR', { originalError: error }),
  'SyntaxError': (error) => new LahatError(error.message, 'SYNTAX_ERROR', { originalError: error }),
  'RangeError': (error) => new ValidationError(error.message, 'RANGE_ERROR', { originalError: error }),
  'URIError': (error) => new ValidationError(error.message, 'URI_ERROR', { originalError: error }),
  'EvalError': (error) => new LahatError(error.message, 'EVAL_ERROR', { originalError: error }),
  'Error': (error) => new LahatError(error.message, 'GENERIC_ERROR', { originalError: error })
};

/**
 * Convert a standard Error to a custom error class
 * @param {Error} error - Standard error to convert
 * @returns {LahatError} - Custom error instance
 */
export function fromError(error) {
  // If it's already a LahatError, return it
  if (error instanceof LahatError) {
    return error;
  }
  
  // Convert based on error type
  const errorConverter = ERROR_MAPPING[error.constructor.name] || ERROR_MAPPING['Error'];
  return errorConverter(error);
}

/**
 * Map of error codes to user-friendly messages
 */
export const USER_FRIENDLY_MESSAGES = {
  // API errors
  'API_KEY_ERROR': 'There was an issue with your API key. Please check your settings.',
  'AUTHENTICATION_ERROR': 'Authentication failed. Please check your credentials.',
  'RATE_LIMIT_ERROR': 'You have reached the API rate limit. Please try again later.',
  'CONTENT_POLICY_ERROR': 'Your request was flagged by content filters. Please modify your prompt.',
  'NETWORK_ERROR': 'A network error occurred. Please check your internet connection.',
  
  // File system errors
  'FILE_NOT_FOUND': 'The requested file could not be found.',
  'ACCESS_DENIED': 'Access to the file was denied.',
  'INVALID_PATH': 'The file path is invalid.',
  'FILE_EXISTS': 'A file with this name already exists.',
  
  // Window errors
  'WINDOW_NOT_FOUND': 'The requested window could not be found.',
  'WINDOW_CREATION_FAILED': 'Failed to create the window.',
  
  // IPC errors
  'IPC_TIMEOUT': 'The operation timed out. Please try again.',
  'INVALID_PARAMS': 'Invalid parameters were provided.',
  
  // Validation errors
  'VALIDATION_ERROR': 'The provided input is invalid.',
  'INVALID_INPUT': 'The provided input is invalid.',
  'REQUIRED_FIELD': 'A required field is missing.',
  'INVALID_FORMAT': 'The provided input has an invalid format.',
  
  // Generic errors
  'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.',
  'GENERIC_ERROR': 'An error occurred. Please try again.'
};

/**
 * Get a user-friendly message for an error
 * @param {Error|LahatError} error - Error object
 * @returns {string} - User-friendly message
 */
export function getUserFriendlyMessage(error) {
  // Convert to LahatError if needed
  const lahatError = error instanceof LahatError ? error : fromError(error);
  
  // Get message from mapping or use default
  return USER_FRIENDLY_MESSAGES[lahatError.code] || lahatError.message;
}
/**
 * Browser-compatible Logger Module
 * Provides structured logging with different log levels for browser environments
 */

/**
 * Log levels with numeric values for comparison
 */
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

// Default log level based on environment
const currentLogLevel = (typeof process !== 'undefined' && 
                        process.env && 
                        process.env.NODE_ENV === 'development')
  ? LOG_LEVELS.DEBUG 
  : LOG_LEVELS.INFO;

/**
 * Log a message with context and data
 * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR, FATAL)
 * @param {string} message - Log message
 * @param {any} data - Additional data to log
 * @param {string} context - Context where the log originated
 */
export function log(level, message, data = null, context = '') {
  // Skip if log level is lower than current level
  if (LOG_LEVELS[level] < currentLogLevel) {
    return;
  }
  
  const timestamp = new Date().toISOString();
  
  // Log to console with appropriate level
  const consoleMethod = level.toLowerCase() === 'debug' ? 'log' :
                       level.toLowerCase() === 'info' ? 'info' :
                       level.toLowerCase() === 'warn' ? 'warn' : 'error';
  
  console[consoleMethod](
    `[${timestamp}] [${level}] ${context ? `[${context}]` : ''} ${message}`,
    data ? data : ''
  );
}

// Helper functions for each log level
export const debug = (message, data, context) => log('DEBUG', message, data, context);
export const info = (message, data, context) => log('INFO', message, data, context);
export const warn = (message, data, context) => log('WARN', message, data, context);
export const error = (message, data, context) => log('ERROR', message, data, context);
export const fatal = (message, data, context) => log('FATAL', message, data, context);

// Default export as an object with all methods
export default {
  LOG_LEVELS,
  log,
  debug,
  info,
  warn,
  error,
  fatal
};

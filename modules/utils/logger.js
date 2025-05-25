/**
 * Logger Module - Browser Compatible Version
 * Provides structured logging with different log levels
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

// Default log level - always enable debug in browser for now
const currentLogLevel = LOG_LEVELS.DEBUG;

/**
 * Log a message with context and data
 * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR, FATAL)
 * @param {string} message - Log message
 * @param {any} data - Additional data to log
 * @param {string} context - Context where the log originated
 * @returns {Promise<void>}
 */
export async function log(level, message, data = null, context = '') {
  // Skip if log level is lower than current level
  if (LOG_LEVELS[level] < currentLogLevel) {
    return;
  }
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    context: context || 'APP',
    message,
    data: data || null
  };
  
  // Log to console with appropriate level
  const consoleMethod = level.toLowerCase() === 'debug' ? 'log' :
                       level.toLowerCase() === 'info' ? 'info' :
                       level.toLowerCase() === 'warn' ? 'warn' : 'error';
  
  console[consoleMethod](
    `[${timestamp}] [${level}] ${context ? `[${context}]` : ''} ${message}`,
    data ? data : ''
  );
  
  // In browser, we could potentially store logs in localStorage or IndexedDB
  // For now, just console logging is sufficient
}

// Helper functions for each log level
export const debug = (message, data, context) => log('DEBUG', message, data, context);
export const info = (message, data, context) => log('INFO', message, data, context);
export const warn = (message, data, context) => log('WARN', message, data, context);
export const error = (message, data, context) => log('ERROR', message, data, context);
export const fatal = (message, data, context) => log('FATAL', message, data, context);

/**
 * Get the path to the logs directory (browser version - not applicable)
 * @returns {string|null} Always returns null in browser
 */
export function getLogsPath() {
  return null;
}

/**
 * Get recent log files (browser version - not applicable)
 * @param {number} days - Number of days of logs to retrieve
 * @returns {Promise<string[]>} Always returns empty array in browser
 */
export async function getRecentLogFiles(days = 7) {
  return [];
}

/**
 * Show error report dialog (browser version - simplified)
 * @param {Error} error - The error that triggered this
 * @returns {Promise<boolean>} Always returns false in browser
 */
export async function showErrorReportDialog(error) {
  // In browser, we could show a custom modal or use window.alert
  // For now, just log the error
  console.error('Error occurred:', error);
  return false;
}

// Default export as an object with all methods
export default {
  LOG_LEVELS,
  log,
  debug,
  info,
  warn,
  error,
  fatal,
  getLogsPath,
  getRecentLogFiles,
  showErrorReportDialog
};

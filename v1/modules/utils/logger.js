/**
 * Logger Module
 * Provides structured logging with different log levels
 * Enhanced with error reporting capabilities for production
 */

import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { dialog } from 'electron';

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
const currentLogLevel = process.env.NODE_ENV === 'development' 
  ? LOG_LEVELS.DEBUG 
  : LOG_LEVELS.INFO;

// Get log file path in user data directory
const logFilePath = app.getPath('userData') ? path.join(app.getPath('userData'), 'logs') : null;

/**
 * Ensure log directory exists
 * @returns {Promise<void>}
 */
export async function ensureLogDirectory() {
  if (logFilePath) {
    await fs.mkdir(logFilePath, { recursive: true });
  }
}

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
  
  // Log to file if in production
  if (process.env.NODE_ENV !== 'development' && logFilePath) {
    try {
      await ensureLogDirectory();
      
      const logFile = path.join(
        logFilePath,
        `lahat-${new Date().toISOString().split('T')[0]}.log`
      );
      
      await fs.appendFile(
        logFile,
        JSON.stringify(logEntry) + '\n'
      );
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
}

// Helper functions for each log level
export const debug = (message, data, context) => log('DEBUG', message, data, context);
export const info = (message, data, context) => log('INFO', message, data, context);
export const warn = (message, data, context) => log('WARN', message, data, context);
export const error = (message, data, context) => log('ERROR', message, data, context);
export const fatal = (message, data, context) => log('FATAL', message, data, context);

/**
 * Get the path to the logs directory
 * @returns {string|null} The path to the logs directory or null if not available
 */
export function getLogsPath() {
  return logFilePath;
}

/**
 * Get recent log files
 * @param {number} days - Number of days of logs to retrieve
 * @returns {Promise<string[]>} Array of log file paths
 */
export async function getRecentLogFiles(days = 7) {
  if (!logFilePath) return [];
  
  try {
    await ensureLogDirectory();
    const files = await fs.readdir(logFilePath);
    const logFiles = files.filter(file => file.startsWith('lahat-') && file.endsWith('.log'));
    
    // Sort by date (most recent first)
    return logFiles
      .map(file => ({
        path: path.join(logFilePath, file),
        date: new Date(file.split('lahat-')[1].split('.log')[0])
      }))
      .filter(item => {
        // Filter logs within the specified number of days
        const now = new Date();
        const diffTime = Math.abs(now - item.date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= days;
      })
      .sort((a, b) => b.date - a.date)
      .map(item => item.path);
  } catch (error) {
    console.error('Failed to get log files:', error);
    return [];
  }
}

/**
 * Show dialog to send error reports
 * Allows users to send logs to developers
 * @param {Error} error - The error that triggered this
 * @returns {Promise<boolean>} True if user chose to send reports
 */
export async function showErrorReportDialog(error) {
  try {
    // Only show in production and main process
    if (process.env.NODE_ENV === 'development' || !app) {
      return false;
    }
    
    const { response } = await dialog.showMessageBox({
      type: 'error',
      title: 'Application Error',
      message: 'Lahat encountered an error',
      detail: `Would you like to send an error report to help us improve?\n\nError: ${error.message}`,
      buttons: ['Send Error Report', 'Don\'t Send'],
      defaultId: 0,
      cancelId: 1
    });
    
    if (response === 0) {
      // User wants to send report
      const logFiles = await getRecentLogFiles(2); // Last 2 days of logs
      
      if (logFiles.length === 0) {
        dialog.showMessageBox({
          type: 'info',
          message: 'No log files available',
          detail: 'No recent log files were found to include in the report.'
        });
        return false;
      }
      
      const { filePath } = await dialog.showSaveDialog({
        title: 'Save Error Report',
        defaultPath: path.join(app.getPath('desktop'), `lahat-error-report-${new Date().toISOString().split('T')[0]}.zip`),
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
      });
      
      if (!filePath) return false;
      
      // Create a ZIP file with logs
      const { createZipArchive } = await import('../utils/fileOperations.js');
      await createZipArchive(filePath, logFiles.map(file => ({
        source: file,
        destination: path.basename(file)
      })));
      
      dialog.showMessageBox({
        type: 'info',
        message: 'Error Report Created',
        detail: `The error report has been saved to:\n${filePath}\n\nPlease attach this file when reporting the issue on GitHub.`
      });
      
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('Failed to show error report dialog:', err);
    return false;
  }
}

// Default export as an object with all methods
export default {
  LOG_LEVELS,
  ensureLogDirectory,
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
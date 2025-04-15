/**
 * Utility functions index
 * Exports all utility functions from a single entry point
 * 
 * This module organizes all utility functions into categories
 * for easier import and usage throughout the application.
 */

// Error handling utilities
// Provides structured error handling with custom error classes
export * from './errorHandler.js';

// String utilities
// Functions for string manipulation, formatting, and validation
export * from './stringUtils.js';

// Date utilities
// Functions for date formatting, parsing, and manipulation
export * from './dateUtils.js';

// File operations
// Functions for reading, writing, and managing files
export * from './fileOperations.js';

// Performance utilities
// Functions for measuring and optimizing performance
export * from './performanceUtils.js';

// Resource tracking utilities
// Functions for tracking and cleaning up resources
export * from './resourceTracker.js';

// Logger (re-export for convenience)
export { default as logger } from './logger.js';

// Export categorized utility bundles for selective importing

// Error utilities bundle
import * as ErrorUtils from './errorHandler.js';
export const errorUtils = ErrorUtils;

// String utilities bundle
import * as StringUtils from './stringUtils.js';
export const stringUtils = StringUtils;

// Date utilities bundle
import * as DateUtils from './dateUtils.js';
export const dateUtils = DateUtils;

// File utilities bundle
import * as FileUtils from './fileOperations.js';
export const fileUtils = FileUtils;

// Performance utilities bundle
import * as PerformanceUtils from './performanceUtils.js';
export const performanceUtils = PerformanceUtils;

// Resource tracking utilities bundle
import * as ResourceUtils from './resourceTracker.js';
export const resourceUtils = ResourceUtils;

// Default export with all utility bundles
export default {
  error: errorUtils,
  string: stringUtils,
  date: dateUtils,
  file: fileUtils,
  performance: performanceUtils,
  resource: resourceUtils,
  logger
};

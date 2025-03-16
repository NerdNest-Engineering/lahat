/**
 * Utility functions index
 * Exports all utility functions from a single entry point
 * 
 * This module organizes all utility functions into categories
 * for easier import and usage throughout the application.
 */

// CSP utilities
// Functions for working with Content Security Policy
export * from './cspUtils.js';

// Error handling utilities
// Provides structured error handling with custom error classes
export * from './errorHandler.js';

// String utilities
// Functions for string manipulation, formatting, and validation
export * from './stringUtils.js';

// Date utilities
// Functions for date formatting, parsing, and manipulation
export * from './dateUtils.js';

// Validation utilities
// Functions for validating user input and data
export * from './validationUtils.js';

// DOM utilities (only for renderer processes)
// Functions for DOM manipulation and event handling
export * from './domUtils.js';

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

// Validation utilities bundle
import * as ValidationUtils from './validationUtils.js';
export const validationUtils = ValidationUtils;

// DOM utilities bundle
import * as DOMUtils from './domUtils.js';
export const domUtils = DOMUtils;

// File utilities bundle
import * as FileUtils from './fileOperations.js';
export const fileUtils = FileUtils;

// Performance utilities bundle
import * as PerformanceUtils from './performanceUtils.js';
export const performanceUtils = PerformanceUtils;

// Resource tracking utilities bundle
import * as ResourceUtils from './resourceTracker.js';
export const resourceUtils = ResourceUtils;

// CSP utilities bundle
import * as CSPUtils from './cspUtils.js';
export const cspUtils = CSPUtils;

// Default export with all utility bundles
export default {
  error: errorUtils,
  string: stringUtils,
  date: dateUtils,
  validation: validationUtils,
  dom: domUtils,
  file: fileUtils,
  performance: performanceUtils,
  resource: resourceUtils,
  csp: cspUtils,
  logger
};

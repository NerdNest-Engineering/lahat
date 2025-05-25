/**
 * Debug utility for conditional logging based on NODE_ENV
 */

// Check if we're in development mode
// In browser environment, process may not be defined, so we need to check safely
const isDevelopment = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') || 
                     (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost');

/**
 * Debug logger that only logs in development mode
 * @param {...any} args - Arguments to log
 */
export function debugLog(...args) {
  if (isDevelopment) {
    console.log(...args);
  }
}

/**
 * Debug error logger that only logs in development mode
 * @param {...any} args - Arguments to log
 */
export function debugError(...args) {
  if (isDevelopment) {
    console.error(...args);
  }
}

/**
 * Debug warn logger that only logs in development mode
 * @param {...any} args - Arguments to log
 */
export function debugWarn(...args) {
  if (isDevelopment) {
    console.warn(...args);
  }
}

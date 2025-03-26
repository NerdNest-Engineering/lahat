/**
 * Security Utilities
 * Basic utility functions for security-related operations in the app manager module
 */

/**
 * Check if a component code contains dangerous patterns
 * @param {string} code - The component code to check
 * @returns {boolean} - Whether the code is safe
 */
export function isSafeComponentCode(code) {
  // List of basic dangerous patterns to check for
  const dangerousPatterns = [
    /eval\s*\(/g,                 // eval()
    /Function\s*\(/g,             // Function constructor
    /document\.write/g,           // document.write
    /localStorage\./g,            // localStorage access
    /sessionStorage\./g,          // sessionStorage access
    /indexedDB\./g,               // indexedDB access
    /window\.open/g,              // window.open
    /window\.location/g,          // window.location
    /require\s*\(/g,              // Node.js require
    /process\./g,                 // Node.js process
  ];
  
  // Check if the code contains any dangerous patterns
  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Create a basic Content Security Policy for a component
 * @returns {Object} - The CSP object
 */
export function createBasicCSP() {
  return {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"],  // Allow inline styles for Shadow DOM
    'connect-src': ["'self'"],
    'img-src': ["'self'", "data:"],
    'font-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"]
  };
}

/**
 * Validate component metadata
 * @param {Object} metadata - The component metadata
 * @returns {boolean} - Whether the metadata is valid
 */
export function isValidMetadata(metadata) {
  // Check if the metadata has the required fields
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }
  
  // Check for required fields
  if (!metadata.componentName || typeof metadata.componentName !== 'string') {
    return false;
  }
  
  // Check events array if it exists
  if (metadata.events && !Array.isArray(metadata.events)) {
    return false;
  }
  
  return true;
}

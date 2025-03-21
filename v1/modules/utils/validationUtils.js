/**
 * Validation utility functions
 */

/**
 * Validates an email address
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if email is valid
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is valid
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a value is a valid number
 * @param {any} value - Value to check
 * @returns {boolean} - True if value is a valid number
 */
export function isValidNumber(value) {
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value);
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return !isNaN(parsed) && isFinite(parsed);
  }
  
  return false;
}

/**
 * Checks if a value is a valid integer
 * @param {any} value - Value to check
 * @returns {boolean} - True if value is a valid integer
 */
export function isValidInteger(value) {
  if (typeof value === 'number') {
    return Number.isInteger(value);
  }
  
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return !isNaN(parsed) && parsed.toString() === value;
  }
  
  return false;
}

/**
 * Validates that a value is not empty
 * @param {any} value - Value to check
 * @returns {boolean} - True if value is not empty
 */
export function isNotEmpty(value) {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }
  
  return true;
}

/**
 * Validates a value against a minimum and maximum length
 * @param {string|Array} value - Value to check
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {boolean} - True if value length is within range
 */
export function isValidLength(value, minLength = 0, maxLength = Infinity) {
  if (value === null || value === undefined) {
    return false;
  }
  
  const length = value.length;
  
  return length >= minLength && length <= maxLength;
}

/**
 * Validates a value against a minimum and maximum value
 * @param {number} value - Value to check
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} - True if value is within range
 */
export function isInRange(value, min = -Infinity, max = Infinity) {
  if (!isValidNumber(value)) {
    return false;
  }
  
  const numValue = Number(value);
  
  return numValue >= min && numValue <= max;
}

/**
 * Validates that a string matches a regular expression pattern
 * @param {string} value - Value to check
 * @param {RegExp} pattern - Regular expression pattern
 * @returns {boolean} - True if value matches pattern
 */
export function matchesPattern(value, pattern) {
  if (typeof value !== 'string') {
    return false;
  }
  
  return pattern.test(value);
}

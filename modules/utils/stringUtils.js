/**
 * String utility functions
 */

/**
 * Truncates a string to a maximum length and adds ellipsis if needed
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} ellipsis - Ellipsis string to append
 * @returns {string} - Truncated string
 */
export function truncateString(str, maxLength, ellipsis = '...') {
  if (!str || str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength) + ellipsis;
}

/**
 * Converts a string to a URL-friendly slug
 * @param {string} text - Text to slugify
 * @returns {string} - Slugified string
 */
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Capitalizes the first letter of a string
 * @param {string} string - String to capitalize
 * @returns {string} - Capitalized string
 */
export function capitalizeFirstLetter(string) {
  if (!string || typeof string !== 'string' || string.length === 0) {
    return string;
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Generates a random string of specified length
 * @param {number} length - Length of the random string
 * @returns {string} - Random string
 */
export function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Checks if a string is empty or contains only whitespace
 * @param {string} str - String to check
 * @returns {boolean} - True if string is empty or whitespace only
 */
export function isEmptyString(str) {
  return !str || /^\s*$/.test(str);
}

/**
 * Escapes HTML special characters in a string
 * @param {string} html - String to escape
 * @returns {string} - Escaped string
 */
export function escapeHtml(html) {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

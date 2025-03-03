/**
 * Date utility functions
 */

/**
 * Formats a date for display
 * @param {string|Date} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} - Formatted date string
 */
export function formatDate(date, includeTime = true) {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const dateString = dateObj.toLocaleDateString();
  
  if (!includeTime) {
    return dateString;
  }
  
  const timeString = dateObj.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return `${dateString} ${timeString}`;
}

/**
 * Returns a relative time string (e.g., "5 minutes ago")
 * @param {string|Date} date - Date to format
 * @returns {string} - Relative time string
 */
export function getRelativeTimeString(date) {
  const now = new Date();
  const dateObj = date instanceof Date ? date : new Date(date);
  const diffMs = now - dateObj;
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`;
  
  return formatDate(dateObj, false);
}

/**
 * Formats a date as ISO string (YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} - ISO date string
 */
export function formatISODate(date) {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toISOString().split('T')[0];
}

/**
 * Adds days to a date
 * @param {string|Date} date - Date to add days to
 * @param {number} days - Number of days to add
 * @returns {Date} - New date
 */
export function addDays(date, days) {
  const dateObj = date instanceof Date ? new Date(date) : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
}

/**
 * Checks if a date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} - True if date is today
 */
export function isToday(date) {
  const dateObj = date instanceof Date ? date : new Date(date);
  const today = new Date();
  
  return dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear();
}

/**
 * Gets the time difference between two dates in a human-readable format
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date (defaults to now)
 * @returns {string} - Human-readable time difference
 */
export function getTimeDifference(startDate, endDate = new Date()) {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  
  const diffMs = Math.abs(end - start);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }
  
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  }
  
  if (diffMin > 0) {
    return `${diffMin} minute${diffMin !== 1 ? 's' : ''}`;
  }
  
  return `${diffSec} second${diffSec !== 1 ? 's' : ''}`;
}

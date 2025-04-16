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

/**
 * Active App State Module
 * Tracks the state of the active widget
 */

// Active widget state
let activeWidget = null;

/**
 * Set the active widget
 * @param {Object} app - Widget object with id, name, and filePath
 */
export function setActiveWidget(app) {
  activeWidget = app;
}

/**
 * Get the active widget
 * @returns {Object|null} - Active widget object or null if no app is active
 */
export function getActiveWidget() {
  return activeWidget;
}

/**
 * Check if there is an active widget
 * @returns {boolean} - True if there is an active widget
 */
export function hasActiveWidget() {
  return activeWidget !== null;
}

/**
 * Clear the active widget
 */
export function clearActiveWidget() {
  activeWidget = null;
}

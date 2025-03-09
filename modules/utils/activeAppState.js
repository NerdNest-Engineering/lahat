/**
 * Active App State Module
 * Tracks the state of the active mini app
 */

// Active mini app state
let activeMiniApp = null;

/**
 * Set the active mini app
 * @param {Object} app - Mini app object with id, name, and filePath
 */
export function setActiveMiniApp(app) {
  activeMiniApp = app;
}

/**
 * Get the active mini app
 * @returns {Object|null} - Active mini app object or null if no app is active
 */
export function getActiveMiniApp() {
  return activeMiniApp;
}

/**
 * Check if there is an active mini app
 * @returns {boolean} - True if there is an active mini app
 */
export function hasActiveMiniApp() {
  return activeMiniApp !== null;
}

/**
 * Clear the active mini app
 */
export function clearActiveMiniApp() {
  activeMiniApp = null;
}

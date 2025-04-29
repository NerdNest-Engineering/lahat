/**
 * App Creator Renderer Handlers
 * Handles IPC events in the renderer process
 */

/**
 * Set up IPC handlers for the app creator module
 * @param {EventBus} eventBus - The event bus for communication
 */
export function setupRendererHandlers(eventBus) {
  // Check if the IPC API is available
  if (!window.electronAPI) {
    console.warn('Electron IPC API not available. Running in browser mode.');
    return;
  }
  
  // Set up handlers for title/description chunks
  window.electronAPI.onTitleDescriptionChunk((chunk) => {
    // Publish the chunk to the event bus
    eventBus.publish('title-description-chunk', chunk);
  });
  
  // Set up handlers for generation chunks
  window.electronAPI.onGenerationChunk((chunk) => {
    // Publish the chunk to the event bus
    eventBus.publish('generation-chunk', chunk);
  });
}

/**
 * Check if the API key is set
 * @returns {Promise<Object>} - Object with hasApiKey and apiKey properties
 */
export async function checkApiKey() {
  if (!window.electronAPI) {
    return { hasApiKey: false };
  }
  
  return await window.electronAPI.checkApiKey();
}

/**
 * Generate title and description
 * @param {string} input - The user input
 * @returns {Promise<Object>} - The generation result
 */
export async function generateTitleAndDescription(input) {
  if (!window.electronAPI) {
    // Browser mode - simulate a response
    return {
      success: true,
      title: 'Generated Title',
      description: 'Generated description for the app.'
    };
  }
  
  return await window.electronAPI.generateTitleAndDescription({ input });
}

/**
 * Generate a widget
 * @param {string} appName - The app name
 * @param {string} prompt - The app description
 * @returns {Promise<Object>} - The generation result
 */
export async function generateWidget(appName, prompt) {
  if (!window.electronAPI) {
    // Browser mode - simulate a response
    return {
      success: true,
      widgetName: appName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    };
  }
  
  return await window.electronAPI.generateWidget({ appName, prompt });
}

/**
 * Notify that an app has been updated
 */
export function notifyAppUpdated() {
  if (!window.electronAPI) {
    return;
  }
  
  window.electronAPI.notifyAppUpdated();
}

/**
 * Open a window
 * @param {string} windowName - The window name
 */
export function openWindow(windowName) {
  if (!window.electronAPI) {
    return;
  }
  
  window.electronAPI.openWindow(windowName);
}

/**
 * Close the current window
 */
export function closeCurrentWindow() {
  if (!window.electronAPI) {
    return;
  }
  
  window.electronAPI.closeCurrentWindow();
}

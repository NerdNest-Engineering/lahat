/**
 * Renderer process handlers for the app-list module
 * 
 * This module provides functions to interact with the main process through
 * the IPC bridge exposed by the preload script.
 */

/**
 * Get all apps from the main process
 * @returns {Promise<Array>} A promise that resolves to the list of apps
 */
export async function getApps() {
  try {
    // Check if the appListAPI is available
    if (!window.appListAPI) {
      console.warn('appListAPI is not available. Running in browser mode with mock data.');
      return getMockApps();
    }
    
    return await window.appListAPI.getApps();
  } catch (error) {
    console.error('Error getting apps:', error);
    throw error;
  }
}

/**
 * Get an app by its ID from the main process
 * @param {string} appId - The ID of the app to get
 * @returns {Promise<Object|null>} A promise that resolves to the app or null if not found
 */
export async function getAppById(appId) {
  try {
    // Check if the appListAPI is available
    if (!window.appListAPI) {
      console.warn('appListAPI is not available. Running in browser mode with mock data.');
      const mockApps = getMockApps();
      return mockApps.find(app => app.id === appId) || null;
    }
    
    return await window.appListAPI.getAppById(appId);
  } catch (error) {
    console.error(`Error getting app ${appId}:`, error);
    throw error;
  }
}

/**
 * Open an app in the app manager
 * @param {string} appId - The ID of the app to open
 * @returns {Promise<Object>} A promise that resolves to the result of the operation
 */
export async function openApp(appId) {
  try {
    // Check if the appListAPI is available
    if (!window.appListAPI) {
      console.warn('appListAPI is not available. Running in browser mode.');
      console.log(`Would open app ${appId}`);
      return { success: true };
    }
    
    return await window.appListAPI.openApp(appId);
  } catch (error) {
    console.error(`Error opening app ${appId}:`, error);
    throw error;
  }
}

/**
 * Open the app creator
 * @returns {Promise<Object>} A promise that resolves to the result of the operation
 */
export async function openAppCreator() {
  try {
    // Check if the appListAPI is available
    if (!window.appListAPI) {
      console.warn('appListAPI is not available. Running in browser mode.');
      console.log('Would open app creator');
      return { success: true };
    }
    
    return await window.appListAPI.openAppCreator();
  } catch (error) {
    console.error('Error opening app creator:', error);
    throw error;
  }
}

/**
 * Open the settings
 * @returns {Promise<Object>} A promise that resolves to the result of the operation
 */
export async function openSettings() {
  try {
    // Check if the appListAPI is available
    if (!window.appListAPI) {
      console.warn('appListAPI is not available. Running in browser mode.');
      console.log('Would open settings');
      return { success: true };
    }
    
    return await window.appListAPI.openSettings();
  } catch (error) {
    console.error('Error opening settings:', error);
    throw error;
  }
}

/**
 * Register a callback to be called when a new app is created
 * @param {Function} callback - The callback function
 * @returns {Function} A function to unregister the callback
 */
export function onAppCreated(callback) {
  // Check if the appListAPI is available
  if (!window.appListAPI) {
    console.warn('appListAPI is not available. Running in browser mode.');
    return () => {};
  }
  
  return window.appListAPI.onAppCreated(callback);
}

/**
 * Register a callback to be called when an app is updated
 * @param {Function} callback - The callback function
 * @returns {Function} A function to unregister the callback
 */
export function onAppUpdated(callback) {
  // Check if the appListAPI is available
  if (!window.appListAPI) {
    console.warn('appListAPI is not available. Running in browser mode.');
    return () => {};
  }
  
  return window.appListAPI.onAppUpdated(callback);
}

/**
 * Register a callback to be called when an app is deleted
 * @param {Function} callback - The callback function
 * @returns {Function} A function to unregister the callback
 */
export function onAppDeleted(callback) {
  // Check if the appListAPI is available
  if (!window.appListAPI) {
    console.warn('appListAPI is not available. Running in browser mode.');
    return () => {};
  }
  
  return window.appListAPI.onAppDeleted(callback);
}

/**
 * Get mock apps for testing in browser mode
 * @returns {Array} A list of mock apps
 */
function getMockApps() {
  return [
    {
      id: 'app1',
      title: 'Todo List',
      description: 'A simple todo list application',
      lastModified: new Date('2025-03-20')
    },
    {
      id: 'app2',
      title: 'Weather App',
      description: 'Check the weather in your area',
      lastModified: new Date('2025-03-18')
    },
    {
      id: 'app3',
      title: 'Calculator',
      description: 'A basic calculator application',
      lastModified: new Date('2025-03-15')
    },
    {
      id: 'app4',
      title: 'Note Taking App',
      description: 'Create and manage your notes',
      lastModified: new Date('2025-03-10')
    },
    {
      id: 'app5',
      title: 'Pomodoro Timer',
      description: 'Stay productive with a pomodoro timer',
      lastModified: new Date('2025-03-05')
    }
  ];
}

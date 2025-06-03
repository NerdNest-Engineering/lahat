/**
 * App Creation Settings Handlers
 * Manages app creation preferences and credential selections
 */

import { ipcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';

// Get the app creation settings storage path
const getSettingsPath = () => path.join(app.getPath('userData'), 'app-creation-settings.json');

/**
 * Load app creation settings
 * @returns {Promise<Object>} Settings object
 */
async function loadAppCreationSettings() {
  try {
    const settingsPath = getSettingsPath();
    const data = await fs.readFile(settingsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet, return default settings
      return {
        defaultCredentials: {
          claude: null,
          openai: null
        },
        preferences: {
          autoSkipCredentialSelection: true,
          rememberLastUsedCredentials: true
        }
      };
    }
    throw error;
  }
}

/**
 * Save app creation settings
 * @param {Object} settings - Settings object to save
 * @returns {Promise<void>}
 */
async function saveAppCreationSettings(settings) {
  const settingsPath = getSettingsPath();
  
  // Ensure the directory exists
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  
  // Load existing settings and merge with new ones
  const existingSettings = await loadAppCreationSettings();
  const mergedSettings = {
    ...existingSettings,
    ...settings,
    lastUpdated: new Date().toISOString()
  };
  
  // Save merged settings to disk
  await fs.writeFile(settingsPath, JSON.stringify(mergedSettings, null, 2), 'utf8');
  console.log('[APP-CREATION-SETTINGS] Settings saved:', Object.keys(settings));
}

/**
 * Handle getting app creation settings
 * @param {Object} event - IPC event
 * @returns {Promise<Object>} Result object with settings
 */
async function handleGetAppCreationSettings(event) {
  try {
    const settings = await loadAppCreationSettings();
    return {
      success: true,
      settings
    };
  } catch (error) {
    console.error('Error getting app creation settings:', error);
    return {
      success: false,
      error: error.message,
      settings: null
    };
  }
}

/**
 * Handle saving app creation settings
 * @param {Object} event - IPC event
 * @param {Object} settings - Settings to save
 * @returns {Promise<Object>} Result object with success flag
 */
async function handleSaveAppCreationSettings(event, settings) {
  try {
    await saveAppCreationSettings(settings);
    return {
      success: true
    };
  } catch (error) {
    console.error('Error saving app creation settings:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle updating default credentials
 * @param {Object} event - IPC event
 * @param {Object} credentials - Credential selections
 * @returns {Promise<Object>} Result object with success flag
 */
async function handleUpdateDefaultCredentials(event, credentials) {
  try {
    await saveAppCreationSettings({
      defaultCredentials: credentials
    });
    return {
      success: true
    };
  } catch (error) {
    console.error('Error updating default credentials:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle clearing default credentials (force show credential selection)
 * @param {Object} event - IPC event
 * @returns {Promise<Object>} Result object with success flag
 */
async function handleClearDefaultCredentials(event) {
  try {
    await saveAppCreationSettings({
      defaultCredentials: {
        claude: null,
        openai: null
      }
    });
    return {
      success: true
    };
  } catch (error) {
    console.error('Error clearing default credentials:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Register app creation settings IPC handlers
 */
export function registerHandlers() {
  // App creation settings handlers
  ipcMain.handle('get-app-creation-settings', handleGetAppCreationSettings);
  ipcMain.handle('save-app-creation-settings', handleSaveAppCreationSettings);
  ipcMain.handle('update-default-credentials', handleUpdateDefaultCredentials);
  ipcMain.handle('clear-default-credentials', handleClearDefaultCredentials);
  
  console.log('App creation settings handlers registered');
}

// Export functions for use by other modules
export {
  loadAppCreationSettings,
  saveAppCreationSettings
};
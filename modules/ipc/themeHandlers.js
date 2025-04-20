import { ipcMain } from 'electron';
import themeManager from '../utils/themeManager.js';
import { createSuccessResponse, createErrorResponse } from './ipcTypes.js';

/**
 * Theme Handlers Module
 * Responsible for theme-related IPC handlers
 */

/**
 * Handle getting theme settings
 * @returns {Object} Current theme settings
 */
async function handleGetThemeSettings() {
  try {
    return createSuccessResponse({
      ...themeManager.getThemeSettings()
    });
  } catch (error) {
    console.error('Error getting theme settings:', error);
    return createErrorResponse(error, 'getThemeSettings');
  }
}

/**
 * Handle setting theme
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for setting theme
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleSetTheme(event, { theme }) {
  try {
    themeManager.setTheme(theme);
    return createSuccessResponse();
  } catch (error) {
    console.error('Error setting theme:', error);
    return createErrorResponse(error, 'setTheme');
  }
}

/**
 * Register theme-related IPC handlers
 */
export function registerHandlers() {
  // Theme IPC handlers
  ipcMain.handle('get-theme-settings', handleGetThemeSettings);
  ipcMain.handle('set-theme', handleSetTheme);
  
  console.log('Theme handlers registered');
}
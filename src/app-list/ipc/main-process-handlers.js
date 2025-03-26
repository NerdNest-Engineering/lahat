/**
 * Main process handlers for the app-list module
 * 
 * This module defines the IPC handlers that will be registered in the main process
 * to handle requests from the renderer process.
 */

const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Mock data for testing
let mockApps = [
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

/**
 * Register IPC handlers for the app-list module
 * @param {BrowserWindow} mainWindow - The main window of the application
 */
function registerAppListHandlers(mainWindow) {
  // Get all apps
  ipcMain.handle('app-list:get-apps', async () => {
    try {
      // In a real implementation, this would load apps from storage
      return mockApps;
    } catch (error) {
      console.error('Error getting apps:', error);
      throw error;
    }
  });
  
  // Get app by ID
  ipcMain.handle('app-list:get-app-by-id', async (event, appId) => {
    try {
      // In a real implementation, this would load the app from storage
      return mockApps.find(app => app.id === appId) || null;
    } catch (error) {
      console.error(`Error getting app ${appId}:`, error);
      throw error;
    }
  });
  
  // Open app
  ipcMain.handle('app-list:open-app', async (event, appId) => {
    try {
      console.log(`Opening app ${appId}`);
      
      // In a real implementation, this would open the app in the app-manager
      // For now, just log the action
      
      return { success: true };
    } catch (error) {
      console.error(`Error opening app ${appId}:`, error);
      throw error;
    }
  });
  
  // Open app creator
  ipcMain.handle('app-list:open-app-creator', async () => {
    try {
      console.log('Opening app creator');
      
      // In a real implementation, this would open the app-creator
      // For now, just log the action
      
      return { success: true };
    } catch (error) {
      console.error('Error opening app creator:', error);
      throw error;
    }
  });
  
  // Open settings
  ipcMain.handle('app-list:open-settings', async () => {
    try {
      console.log('Opening settings');
      
      // In a real implementation, this would open the settings
      // For now, just log the action
      
      return { success: true };
    } catch (error) {
      console.error('Error opening settings:', error);
      throw error;
    }
  });
}

/**
 * Unregister IPC handlers for the app-list module
 */
function unregisterAppListHandlers() {
  ipcMain.removeHandler('app-list:get-apps');
  ipcMain.removeHandler('app-list:get-app-by-id');
  ipcMain.removeHandler('app-list:open-app');
  ipcMain.removeHandler('app-list:open-app-creator');
  ipcMain.removeHandler('app-list:open-settings');
}

module.exports = {
  registerAppListHandlers,
  unregisterAppListHandlers
};

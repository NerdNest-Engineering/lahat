/**
 * App Manager Main Process Handlers
 * Handles IPC events from the renderer process in the main process
 */

const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const store = require('../../store');

/**
 * Register IPC handlers for the app manager module
 */
function registerAppManagerHandlers() {
  // Load an app by ID
  ipcMain.handle('app-manager:load-app', async (event, appId) => {
    try {
      // Get the app directory
      const appsDir = process.env.APPS_DIR || './apps';
      const appDir = path.join(appsDir, appId);
      
      // Check if the app exists
      if (!fs.existsSync(appDir)) {
        throw new Error(`App not found: ${appId}`);
      }
      
      // Load the app configuration
      const appConfigPath = path.join(appDir, 'app.yaml');
      
      // Check if the app configuration exists
      if (!fs.existsSync(appConfigPath)) {
        throw new Error(`App configuration not found: ${appConfigPath}`);
      }
      
      // Read the app configuration
      const appConfig = fs.readFileSync(appConfigPath, 'utf8');
      
      // Parse the app configuration
      // Note: In a real implementation, this would use a YAML parser
      // For now, we'll just return the raw content
      
      return {
        success: true,
        appId,
        config: appConfig
      };
    } catch (error) {
      console.error('Error loading app:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  // Load a component by name
  ipcMain.handle('app-manager:load-component', async (event, componentName) => {
    try {
      // Get the components directory
      const componentsDir = process.env.COMPONENTS_DIR || './components';
      const componentDir = path.join(componentsDir, componentName);
      
      // Check if the component exists
      if (!fs.existsSync(componentDir)) {
        throw new Error(`Component not found: ${componentName}`);
      }
      
      // Load the component code
      const componentPath = path.join(componentDir, 'index.js');
      
      // Check if the component code exists
      if (!fs.existsSync(componentPath)) {
        throw new Error(`Component code not found: ${componentPath}`);
      }
      
      // Read the component code
      const componentCode = fs.readFileSync(componentPath, 'utf8');
      
      // Load the component metadata
      const metadataPath = path.join(componentDir, 'meta.json');
      
      // Check if the metadata exists
      if (!fs.existsSync(metadataPath)) {
        throw new Error(`Component metadata not found: ${metadataPath}`);
      }
      
      // Read the metadata
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      
      return {
        success: true,
        componentName,
        code: componentCode,
        metadata
      };
    } catch (error) {
      console.error('Error loading component:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  // Get available widgets
  ipcMain.handle('app-manager:get-available-widgets', async () => {
    try {
      // Get the components directory
      const componentsDir = process.env.COMPONENTS_DIR || './components';
      
      // Check if the components directory exists
      if (!fs.existsSync(componentsDir)) {
        return {
          success: true,
          widgets: []
        };
      }
      
      // Get all component directories
      const componentDirs = fs.readdirSync(componentsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      // Load metadata for each component
      const widgets = [];
      
      for (const componentName of componentDirs) {
        const metadataPath = path.join(componentsDir, componentName, 'meta.json');
        
        // Check if the metadata exists
        if (fs.existsSync(metadataPath)) {
          // Read the metadata
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          
          widgets.push({
            name: componentName,
            ...metadata
          });
        }
      }
      
      return {
        success: true,
        widgets
      };
    } catch (error) {
      console.error('Error getting available widgets:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  // Save app layout
  ipcMain.handle('app-manager:save-app-layout', async (event, { appId, layout }) => {
    try {
      // Get the app directory
      const appsDir = process.env.APPS_DIR || './apps';
      const appDir = path.join(appsDir, appId);
      
      // Check if the app exists
      if (!fs.existsSync(appDir)) {
        throw new Error(`App not found: ${appId}`);
      }
      
      // Load the app configuration
      const appConfigPath = path.join(appDir, 'app.yaml');
      
      // Check if the app configuration exists
      if (!fs.existsSync(appConfigPath)) {
        throw new Error(`App configuration not found: ${appConfigPath}`);
      }
      
      // Read the app configuration
      const appConfig = fs.readFileSync(appConfigPath, 'utf8');
      
      // Parse the app configuration
      // Note: In a real implementation, this would use a YAML parser
      // For now, we'll just update the raw content
      
      // Save the updated app configuration
      fs.writeFileSync(appConfigPath, appConfig);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error saving app layout:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  // Create a new widget
  ipcMain.on('app-manager:create-new-widget', (event) => {
    try {
      // Get the sender window
      const senderWindow = event.sender.getOwnerBrowserWindow();
      
      // Open the app creator window
      if (senderWindow && !senderWindow.isDestroyed()) {
        senderWindow.webContents.send('window:open', 'app-creator');
      }
    } catch (error) {
      console.error('Error creating new widget:', error);
    }
  });
}

module.exports = {
  registerAppManagerHandlers
};

import { app, BrowserWindow, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';
import { readFileSync } from 'fs';
import store from './store.js';
import * as windowManager from './modules/windowManager/index.js';
import * as apiHandlers from './modules/ipc/apiHandlers.js';
import * as miniAppHandlers from './modules/ipc/miniAppHandlers.js';
import * as windowHandlers from './modules/ipc/windowHandlers.js';
import { ErrorHandler } from './modules/utils/errorHandler.js';
// Import CommonJS module correctly
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version from package.json
let packageJson = {};
try {
  packageJson = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
} catch (error) {
  console.error('Failed to read package.json:', error);
}

// Disable IMK warnings on macOS
if (process.platform === 'darwin') {
  process.env.IMK_DISABLE_WARNINGS = '1';
}

// Set app name for consistency
app.name = 'Lahat';

// Set app user model ID for Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('com.nerdnest.lahat');
}

// Set app metadata for About panel (macOS)
if (process.platform === 'darwin' && packageJson) {
  app.setAboutPanelOptions({
    applicationName: packageJson.name || 'Lahat',
    applicationVersion: packageJson.version || '1.0.0',
    version: packageJson.version || '1.0.0',
    copyright: '© 2024 NerdNest LLC',
  });
}

/**
 * Initialize the application
 */
function initializeApp() {
  console.log('Initializing application...');
  
  try {
    // Initialize store with default window config if not set
    if (!store.has('windowConfig')) {
      store.set('windowConfig', {});
    }
    
    // Initialize store with default settings if not set
    if (!store.has('settings')) {
      store.set('settings', {
        defaultWindowWidth: 800,
        defaultWindowHeight: 600,
        theme: 'light',
        autoUpdate: true
      });
    }
    

    
    // Initialize window manager
    windowManager.initializeWindowManager();
    
    // Register IPC handlers
    apiHandlers.registerHandlers();
    miniAppHandlers.registerHandlers();
    windowHandlers.registerHandlers();
    
    // Initialize Claude client
    apiHandlers.initializeClaudeClient();
    
    // Create main window
    windowManager.showWindow(windowManager.WindowType.MAIN);
    
    // Setup auto-updater if enabled
    if (store.get('settings.autoUpdate') !== false) {
      setupAutoUpdater();
    }
    
    console.log('Application initialized');
  } catch (error) {
    ErrorHandler.logError('initializeApp', error, ErrorHandler.ERROR_LEVELS.FATAL);
    console.error('Failed to initialize application:', error);
    app.quit();
  }
}

/**
 * Setup auto-update functionality
 */
function setupAutoUpdater() {
  // Disable update checks in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('Auto-updater disabled in development mode');
    return;
  }
  
  // Configure auto-updater with standard settings
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = false;
  
  // Set up logging
  autoUpdater.logger = console;
  if (autoUpdater.logger.transports && autoUpdater.logger.transports.file) {
    autoUpdater.logger.transports.file.level = 'info';
  }
  
  // Configure GitHub provider - this is all that's needed for standard workflow
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'NerdNest-Engineering',
    repo: 'lahat'
  });
  
  console.log('Auto-updater configured for GitHub releases');
  
  // Handle update events
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    const mainWindow = windowManager.getWindow(windowManager.WindowType.MAIN);
    if (mainWindow) {
      const message = `A new version (${info.version}) has been downloaded. Would you like to install it now?`;
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        buttons: ['Install and Restart', 'Later'],
        title: 'Update Available',
        message,
        detail: 'The application will restart to install the update.'
      }).then(result => {
        if (result.response === 0) {
          console.log('User chose to install the update now');
          // Use the standard electron-updater approach
          autoUpdater.quitAndInstall();
        }
      });
    }
  });
  
  autoUpdater.on('error', (err) => {
    ErrorHandler.logError('autoUpdater', err, ErrorHandler.ERROR_LEVELS.ERROR);
    console.error('Auto-updater error:', err);
  });
  

  
  // Add event listeners for debugging
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
  });
  
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
  });
  
  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available. Current version:', info.version);
  });
  
  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Download progress: ${progressObj.percent.toFixed(2)}%`);
  });
  
  // Register the before-quit event to properly handle application quit
  app.on('before-quit', () => {
    console.log('Application quitting - ensuring updates are applied');
  });
  
  // Check for updates with a slight delay to ensure app is fully initialized
  // Only proceed with this part if we're not in development mode (early return above)
  setTimeout(() => {
    console.log('Checking for updates...');
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
      ErrorHandler.logError('checkForUpdatesAndNotify', err, ErrorHandler.ERROR_LEVELS.ERROR);
      console.error('Failed to check for updates:', err);
    });
  }, 3000);
}

// Application lifecycle events - simplified
app.on('before-quit', () => {
  console.log('Application before-quit event');
});

/**
 * Handle importing a .lahat file
 * @param {string} filePath - Path to the .lahat file
 */
async function handleLahatFileOpen(filePath) {
  console.log('Handling .lahat file open:', filePath);
  
  if (!filePath || !filePath.endsWith('.lahat')) {
    console.error('Invalid .lahat file path:', filePath);
    return;
  }
  
  try {
    // Get the Claude client in read-only mode
    const claudeClient = apiHandlers.getClaudeClient(true);
    if (!claudeClient) {
      console.error('Failed to initialize Claude client in read-only mode');
      
      // Show error dialog to the user
      dialog.showErrorBox(
        'API Key Required',
        'Cannot open .lahat file: Claude API key not set. Please set your API key in settings.'
      );
      
      return;
    }
    
    // Import the app package
    const result = await claudeClient.importMiniAppPackage(filePath);
    
    if (result.success) {
      // Update recent apps list
      const recentApps = store.get('recentApps') || [];
      recentApps.unshift({
        id: result.appId,
        name: result.name,
        created: new Date().toISOString(),
        filePath: result.filePath
      });
      
      // Keep only the 10 most recent apps
      if (recentApps.length > 10) {
        recentApps.length = 10;
      }
      
      store.set('recentApps', recentApps);
      
      // Open the imported app
      // Ensure main window is open first
      const mainWindow = windowManager.getWindow(windowManager.WindowType.MAIN);
      if (!mainWindow) {
        windowManager.showWindow(windowManager.WindowType.MAIN);
      } else {
        // Notify the main window to refresh the app list
        mainWindow.webContents.send('refresh-app-list');
      }
      
      // Then open the mini app
      setTimeout(() => {
        import('./modules/miniAppManager.js').then(miniAppManager => {
          miniAppManager.openMiniApp(result.appId, result.filePath, result.name);
        });
      }, 1000);
    } else {
      console.error('Failed to import .lahat file:', result.error);
      
      // Show error dialog
      dialog.showErrorBox(
        'Import Failed',
        `Failed to import the Lahat app: ${result.error}`
      );
    }
  } catch (error) {
    console.error('Error handling .lahat file open:', error);
    
    // Show error dialog
    dialog.showErrorBox(
      'Import Error',
      `An error occurred while importing the Lahat app: ${error.message}`
    );
  }
}

app.whenReady().then(() => {
  initializeApp();
  
  // Set up file association handling for .lahat files
  // This handles files opened from Finder/Explorer after the app is already running
  app.on('open-file', (event, path) => {
    event.preventDefault();
    console.log('open-file event triggered with path:', path);
    
    if (path.endsWith('.lahat')) {
      handleLahatFileOpen(path);
    }
  });
  
  // Handle files passed as command line arguments (e.g., when double-clicking a .lahat file)
  const filePathArg = process.argv.find(arg => arg.endsWith('.lahat'));
  if (filePathArg) {
    console.log('Found .lahat file in command line arguments:', filePathArg);
    handleLahatFileOpen(filePathArg);
  }

  // Handle macOS dock click or Windows taskbar click
  app.on('activate', () => {
    // Get the main window if it exists
    const mainWindow = windowManager.getWindow(windowManager.WindowType.MAIN);
    
    if (mainWindow) {
      // If the window exists but is hidden or minimized, show and focus it
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    } else {
      // If no window exists, create a new one
      windowManager.showWindow(windowManager.WindowType.MAIN);
    }
  });
});

// Handle window-all-closed event
app.on('window-all-closed', () => {
  // On macOS, applications typically stay active until the user quits explicitly
  // This allows the app to be reopened by clicking the dock icon
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  ErrorHandler.logError('uncaughtException', error, ErrorHandler.ERROR_LEVELS.FATAL);
  console.error('Uncaught exception:', error);
  
  // Only in production and when the app is ready, offer error reporting
  if (process.env.NODE_ENV !== 'development' && app.isReady()) {
    import('./modules/utils/logger.js').then(logger => {
      logger.showErrorReportDialog(error).catch(err => {
        console.error('Failed to show error report dialog:', err);
      });
    }).catch(err => {
      console.error('Failed to import logger module:', err);
    });
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  // Convert the reason to an Error object if it isn't already
  const error = reason instanceof Error ? reason : new Error(String(reason));
  ErrorHandler.logError('unhandledRejection', error, ErrorHandler.ERROR_LEVELS.ERROR);
  console.error('Unhandled promise rejection:', error);
  
  // Only show error reporting for fatal promise rejections in production
  if (process.env.NODE_ENV !== 'development' && app.isReady() && 
      error.message && error.message.toLowerCase().includes('fatal')) {
    import('./modules/utils/logger.js').then(logger => {
      logger.showErrorReportDialog(error).catch(err => {
        console.error('Failed to show error report dialog:', err);
      });
    }).catch(err => {
      console.error('Failed to import logger module:', err);
    });
  }
});

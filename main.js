import { app, BrowserWindow, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
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

// Disable IMK warnings on macOS
if (process.platform === 'darwin') {
  process.env.IMK_DISABLE_WARNINGS = '1';
}

// Set app name
app.name = 'Lahat';

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
  // Configure auto-updater with all possible options
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = true;
  
  // Ensure updates aren't blocked by development mode
  if (process.env.NODE_ENV === 'development') {
    autoUpdater.forceDevUpdateConfig = true;
  }
  
  // Add more detailed logging for debugging
  autoUpdater.logger = console;
  autoUpdater.logger.transports.file.level = 'debug';
  
  // Track if an update is available
  autoUpdater.isUpdateAvailable = false;
  
  // Handle update events
  autoUpdater.on('update-downloaded', (info) => {
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
          
          // Set force quit flag so we know we're handling updates
          forceQuit = true;
          
          // Unregister all window close events to prevent hanging
          BrowserWindow.getAllWindows().forEach(window => {
            if (!window.isDestroyed()) {
              window.removeAllListeners('close');
              window.destroy(); // Force destroy windows
            }
          });
          
          // Use longer timeout to ensure everything is cleaned up
          setTimeout(() => {
            console.log('All windows destroyed, installing update...');
            try {
              // Try the standard approach first
              autoUpdater.quitAndInstall(false, true);
              
              // Set a backup forced exit
              setTimeout(() => {
                console.log('Forcing app exit as backup...');
                app.exit(0);
              }, 3000);
            } catch (err) {
              console.error('Error during update installation:', err);
              app.exit(0); // Force exit if update installation fails
            }
          }, 1000);
        }
      });
    }
  });
  
  autoUpdater.on('error', (err) => {
    ErrorHandler.logError('autoUpdater', err, ErrorHandler.ERROR_LEVELS.ERROR);
    console.error('Auto-updater error:', err);
  });
  
  // Explicitly set allowDowngrade as a workaround
  autoUpdater.allowDowngrade = true;
  
  // Tell app to quit for updates
  autoUpdater.forceDevUpdateConfig = true;
  
  // Add event listeners for debugging
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
  });
  
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    
    // Mark that an update is available
    autoUpdater.isUpdateAvailable = true;
    
    // Explicitly request download when update is detected
    autoUpdater.downloadUpdate().catch(err => {
      console.error('Error downloading update:', err);
    });
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
  setTimeout(() => {
    console.log('Checking for updates...');
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
      ErrorHandler.logError('checkForUpdatesAndNotify', err, ErrorHandler.ERROR_LEVELS.ERROR);
      console.error('Failed to check for updates:', err);
    });
  }, 3000);
}

// Force clean exit when update is ready
let forceQuit = false;

// Application lifecycle events
app.on('before-quit', (event) => {
  console.log('Application before-quit event');
  
  // If we're forcing quit for updates, don't prevent it
  if (forceQuit) {
    console.log('Force quit is enabled - allowing quit');
    return;
  }
  
  // Only handle update installation in before-quit if we're not already handling it
  if (autoUpdater.isUpdateAvailable && !forceQuit) {
    console.log('Update is available during quit - handling update installation');
    event.preventDefault();
    forceQuit = true;
    
    // Use more radical shutdown approach
    BrowserWindow.getAllWindows().forEach(window => {
      if (!window.isDestroyed()) {
        window.removeAllListeners('close');
        window.destroy(); // Force destroy instead of just close
      }
    });
    
    // Use longer timeout to ensure everything is properly cleaned up
    setTimeout(() => {
      console.log('Forcefully installing update...');
      try {
        autoUpdater.quitAndInstall(false, true);
      } catch (err) {
        console.error('Error during quitAndInstall:', err);
        app.exit(0); // Force exit if quitAndInstall fails
      }
    }, 1000);
  }
});

app.whenReady().then(() => {
  initializeApp();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.showWindow(windowManager.WindowType.MAIN);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  ErrorHandler.logError('uncaughtException', error, ErrorHandler.ERROR_LEVELS.FATAL);
  console.error('Uncaught exception:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  ErrorHandler.logError('unhandledRejection', reason, ErrorHandler.ERROR_LEVELS.ERROR);
  console.error('Unhandled promise rejection:', reason);
});

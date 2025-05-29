import { app, BrowserWindow, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import fs from 'fs';
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
    
    // Check for pending updates from previous run
    const updateReadyFile = path.join(app.getPath('userData'), 'update-ready');
    if (fs.existsSync(updateReadyFile)) {
      try {
        console.log('Detected pending update, applying changes...');
        // Apply the update that was downloaded in a previous session
        autoUpdater.checkForUpdatesAndNotify().catch(err => {
          console.error('Error applying pending update:', err);
        });
        // Delete the marker file
        fs.unlinkSync(updateReadyFile);
      } catch (err) {
        console.error('Error handling pending update:', err);
        // Delete the marker file to prevent infinite loop
        if (fs.existsSync(updateReadyFile)) {
          fs.unlinkSync(updateReadyFile);
        }
      }
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

// Track if an update is available using a simple variable
let isUpdateAvailable = false;

/**
 * Setup auto-update functionality
 */
function setupAutoUpdater() {
  // Configure auto-updater with all possible options
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = true;
  
  // Disable update checks in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('Auto-updater disabled in development mode');
    // Return early - don't set up update functionality in dev mode
    return;
  }
  
  // Set the feed URL based on environment variable or default to GitHub
  let updateUrl = process.env.UPDATE_URL;
  if (!updateUrl) {
    // Fallback to GitHub if not specified
    console.log('UPDATE_URL not found in environment, using GitHub as provider');
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'NerdNest-Engineering',
      repo: 'lahat'
    });
  } else {
    console.log(`Setting update URL to: ${updateUrl}`);
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: updateUrl
    });
  }
  
  // Add more detailed logging for debugging
  autoUpdater.logger = console;
  
  // Only set file transport level if it exists (will be undefined in dev mode)
  if (autoUpdater.logger.transports && autoUpdater.logger.transports.file) {
    autoUpdater.logger.transports.file.level = 'debug';
  }
  
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
          
          // Create a marker file to indicate an update is ready
          const updateReadyFile = path.join(app.getPath('userData'), 'update-ready');
          fs.writeFileSync(updateReadyFile, info.version, 'utf8');
          
          // Get the path to the current application
          let appPath = '';
          
          // Platform-specific app path detection
          if (process.platform === 'darwin') {
            // On macOS, determine the .app bundle path
            appPath = path.dirname(path.dirname(path.dirname(path.dirname(process.execPath))));
            if (!appPath.endsWith('.app')) {
              appPath = path.dirname(process.execPath);
            }
          } else if (process.platform === 'win32') {
            // On Windows, use the executable path
            appPath = process.execPath;
          } else {
            // On Linux, use the executable path
            appPath = process.execPath;
          }
          
          console.log('Application path for restart:', appPath);
          
          // Create a restart script based on platform
          let restartScript = '';
          let scriptPath = '';
          
          if (process.platform === 'darwin') {
            // macOS restart script (shell script)
            scriptPath = path.join(app.getPath('temp'), 'restart-lahat.sh');
            restartScript = `#!/bin/bash
# Wait for the app to quit
sleep 2

# Apply the update
"${app.getPath('exe')}" --install-update

# Wait for the update to be applied
sleep 2

# Relaunch the app
open "${appPath}"
`;
          } else if (process.platform === 'win32') {
            // Windows restart script (batch file)
            scriptPath = path.join(app.getPath('temp'), 'restart-lahat.bat');
            restartScript = `@echo off
:: Wait for the app to quit
timeout /t 2 /nobreak

:: Apply the update
"${app.getPath('exe')}" --install-update

:: Wait for the update to be applied
timeout /t 2 /nobreak

:: Relaunch the app
start "" "${appPath}"
`;
          } else {
            // Linux restart script (shell script)
            scriptPath = path.join(app.getPath('temp'), 'restart-lahat.sh');
            restartScript = `#!/bin/bash
# Wait for the app to quit
sleep 2

# Apply the update
"${app.getPath('exe')}" --install-update

# Wait for the update to be applied
sleep 2

# Relaunch the app
"${appPath}"
`;
          }
          
          // Write the restart script to disk
          fs.writeFileSync(scriptPath, restartScript, { mode: 0o755 });
          console.log('Created restart script at:', scriptPath);
          
          // Execute the restart script
          try {
            if (process.platform === 'darwin' || process.platform === 'linux') {
              execFile('/bin/bash', [scriptPath], { detached: true, stdio: 'ignore' });
            } else if (process.platform === 'win32') {
              execFile('cmd.exe', ['/c', scriptPath], { detached: true, stdio: 'ignore' });
            }
            console.log('Launched restart script, now quitting app...');
            
            // Exit the app after a short delay to allow the restart script to detach
            setTimeout(() => {
              app.exit(0);
            }, 500);
          } catch (err) {
            console.error('Failed to execute restart script:', err);
            // If restart script fails, try the standard approach
            autoUpdater.quitAndInstall(false, true);
          }
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
    isUpdateAvailable = true;
    
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
  // Only proceed with this part if we're not in development mode (early return above)
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
  if (isUpdateAvailable && !forceQuit) {
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

import { app, BrowserWindow, dialog, shell, Menu, ipcMain } from 'electron'; // Added Menu, ipcMain
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import fs from 'fs';
import store from './store.js';
import * as windowManager from './modules/windowManager/index.js';
import { WindowType } from './modules/windowManager/index.js'; // Added WindowType
import * as apiHandlers from './modules/ipc/apiHandlers.js';
import * as miniAppHandlers from './modules/ipc/miniAppHandlers.js';
import * as windowHandlers from './modules/ipc/windowHandlers.js';
import { ErrorHandler } from './modules/utils/errorHandler.js';
import { getActiveMiniApp, hasActiveMiniApp } from './modules/utils/activeAppState.js'; // Added activeAppState functions
import * as versionControl from './modules/utils/versionControl.js'; // Added versionControl
import * as fileOperations from './modules/utils/fileOperations.js'; // Added fileOperations
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
    windowManager.showWindow(WindowType.MAIN); // Use imported WindowType
    
    // Build and set the application menu
    buildAppMenu();
    
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
 * Build and set the application menu
 */
function buildAppMenu() {
  const template = [
    // { role: 'appMenu' } // Standard macOS app menu
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    { role: 'fileMenu' }, // Standard File menu
    { role: 'editMenu' }, // Standard Edit menu
    { role: 'viewMenu' }, // Standard View menu
    { role: 'windowMenu' }, // Standard Window menu
    {
      label: 'Mini App',
      submenu: [
        {
          label: 'Iterate with Chat',
          click: async () => {
            const activeApp = getActiveMiniApp();
            if (activeApp) {
              // Open the iteration window using our handler that sets up git repo
              const result = await miniAppHandlers.handleOpenIterationWindow(null, {
                appId: activeApp.id,
                filePath: activeApp.filePath,
                name: activeApp.name
              });
              
              if (!result.success) {
                dialog.showErrorBox('Error Opening Iteration Window', result.error || 'Failed to open iteration window');
              }
            } else {
              dialog.showErrorBox('No Active App', 'Please open a Mini App first to use the iteration feature.');
            }
          },
          // This will be dynamically updated, but set initial state
          get enabled() { return hasActiveMiniApp(); }
        },
        // Add other mini-app related actions here if needed
        { type: 'separator' },
        {
          label: 'Show Version History (Placeholder)', // Example
          click: async () => {
             const activeApp = getActiveMiniApp();
             if (activeApp) {
                const history = await versionControl.getCommitHistory(activeApp.id);
                // TODO: Display history (e.g., in a new window or modal)
                console.log('Version History:', history);
                dialog.showMessageBox({ title: 'Version History', message: 'History logged to console (implementation pending).' });
             }
          },
          get enabled() { return hasActiveMiniApp(); }
        }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://github.com/your-repo/lahat'); // Replace with actual link
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Update menu enabled state when active app changes (requires event system)
  // Placeholder: Rebuild menu periodically or on window focus/blur
  // A more robust solution would involve an event emitter in activeAppState.js
  setInterval(() => {
     const newMenu = Menu.buildFromTemplate(template); // Rebuild based on current state
     Menu.setApplicationMenu(newMenu);
  }, 5000); // Rebuild every 5 seconds (simple polling)
}

// IPC Handler for Iteration Window Initial Data is now registered in miniAppHandlers.js

/**
 * Setup auto-update functionality
 */
function setupAutoUpdater() {
  // Configure auto-updater with all possible options
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = true;
  
  // Disable update checks in development mode (use both checks for robustness)
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
    console.log('Auto-updater disabled in development mode');
    // Return early - don't set up update functionality in dev mode
    return;
  }
  
  // Add more detailed logging for debugging
  autoUpdater.logger = console;
  
  // Only set file transport level if it exists (will be undefined in dev mode)
  if (autoUpdater.logger.transports && autoUpdater.logger.transports.file) {
    autoUpdater.logger.transports.file.level = 'debug';
  }
  
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

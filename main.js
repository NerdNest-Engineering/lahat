import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import store from './store.js';
import * as windowManager from './modules/windowManager/index.js';
import * as apiHandlers from './modules/ipc/apiHandlers.js';
import * as miniAppHandlers from './modules/ipc/miniAppHandlers.js';
import * as windowHandlers from './modules/ipc/windowHandlers.js';
import { ErrorHandler } from './modules/utils/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Disable IMK warnings on macOS
if (process.platform === 'darwin') {
  process.env.IMK_DISABLE_WARNINGS = '1';
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
        theme: 'light'
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
    
    console.log('Application initialized');
  } catch (error) {
    ErrorHandler.logError('initializeApp', error, ErrorHandler.ERROR_LEVELS.FATAL);
    console.error('Failed to initialize application:', error);
    app.quit();
  }
}

// Application lifecycle events
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

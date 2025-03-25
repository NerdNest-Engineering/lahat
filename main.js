import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import store from './v1/store.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Disable IMK warnings on macOS
if (process.platform === 'darwin') {
  process.env.IMK_DISABLE_WARNINGS = '1';
}

// Set app name
app.name = 'Lahat';

// Track main window reference
let mainWindow = null;

/**
 * Initialize the application
 */
function initializeApp() {
  console.log('Initializing Lahat test app...');
  
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
    
    // Create main window
    createMainWindow();
    
    console.log('Application initialized');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    app.quit();
  }
}

/**
 * Create the main application window
 */
function createMainWindow() {
  // Get window dimensions from store or use defaults
  const windowWidth = store.get('settings.defaultWindowWidth') || 800;
  const windowHeight = store.get('settings.defaultWindowHeight') || 600;
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false, // Don't show until ready-to-show
    titleBarStyle: 'hiddenInset'
  });
  
  // Load the main app HTML file
  mainWindow.loadFile(path.join(__dirname, 'src/app-list/app-list.html'));
  
  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  
  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Application lifecycle events
app.whenReady().then(() => {
  initializeApp();

  // Handle macOS dock click or Windows taskbar click
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
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
  console.error('Uncaught exception:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection:', reason);
});

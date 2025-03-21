import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import store from './store.js';
import * as windowManager from './modules/windowManager/windowManager-web-components.js';
import * as apiHandlers from './modules/ipc/apiHandlers.js';
import * as miniAppHandlers from './modules/ipc/miniAppHandlers.js';
import * as windowHandlers from './modules/ipc/windowHandlers.js';

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
  console.log('Initializing application with Web Components...');
  
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
  
  // Register IPC handlers
  apiHandlers.registerHandlers();
  miniAppHandlers.registerHandlers();
  windowHandlers.registerHandlers();
  
  // Initialize Claude client
  apiHandlers.initializeClaudeClient();
  
  // Create main window with web components
  windowManager.showWindow(windowManager.WindowType.MAIN_WEB_COMPONENTS);
  
  console.log('Application initialized with Web Components');
}

// Application lifecycle events
app.whenReady().then(() => {
  initializeApp();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.showWindow(windowManager.WindowType.MAIN_WEB_COMPONENTS);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

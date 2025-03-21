import { BrowserWindow, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import store from '../../store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '../../');

// Window types
export const WindowType = {
  MAIN: 'main',
  API_SETUP: 'api-setup',
  APP_CREATION: 'app-creation',
  MINI_APP: 'mini-app',
  DASHBOARD_LIST: 'dashboard-list',
  DASHBOARD: 'dashboard'
};

// Track all windows
const windows = new Map();

// Default window dimensions
const DEFAULT_DIMENSIONS = {
  [WindowType.MAIN]: { width: 1200, height: 800 },
  [WindowType.API_SETUP]: { width: 600, height: 300 },
  [WindowType.APP_CREATION]: { width: 800, height: 600 },
  [WindowType.MINI_APP]: { width: 800, height: 600 },
  [WindowType.DASHBOARD_LIST]: { width: 1000, height: 700 },
  [WindowType.DASHBOARD]: { width: 1200, height: 800 }
};

// Window HTML files
const WINDOW_HTML = {
  [WindowType.MAIN]: 'main.html',
  [WindowType.API_SETUP]: 'api-setup.html',
  [WindowType.APP_CREATION]: 'components/app-creation/app-creation.html',
  [WindowType.MINI_APP]: null, // Mini apps use dynamic content
  [WindowType.DASHBOARD_LIST]: 'components/dashboard/dashboard-list.html',
  [WindowType.DASHBOARD]: null // Dashboards use dynamic content
};

// Window preload scripts
const WINDOW_PRELOAD = {
  [WindowType.MAIN]: 'preload.cjs',
  [WindowType.API_SETUP]: 'preload.cjs',
  [WindowType.APP_CREATION]: 'preload.cjs',
  [WindowType.MINI_APP]: 'miniAppPreload.cjs',
  [WindowType.DASHBOARD_LIST]: 'preload.cjs',
  [WindowType.DASHBOARD]: 'preload.cjs'
};

/**
 * Create a new window
 * @param {string} type - Window type from WindowType enum
 * @param {Object} options - Additional options for the window
 * @returns {BrowserWindow} - The created window
 */
export function createWindow(type, options = {}) {
  // Get stored window position and size if available
  const windowConfig = store.get(`windowConfig.${type}`) || {};
  
  // Get default dimensions for this window type
  const defaultDimensions = DEFAULT_DIMENSIONS[type] || { width: 800, height: 600 };
  
  // Merge default dimensions with stored config and provided options
  const windowOptions = {
    width: windowConfig.width || defaultDimensions.width,
    height: windowConfig.height || defaultDimensions.height,
    x: windowConfig.x,
    y: windowConfig.y,
    titleBarStyle: 'hidden', // Changed from 'hiddenInset' to allow content to extend to edges
    backgroundColor: '#ffffff',
    icon: path.join(rootDir, 'assets/icons/lahat.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: type === WindowType.MINI_APP, // Only sandbox mini apps
      preload: path.join(__dirname, '../../', WINDOW_PRELOAD[type]),
      devTools: process.env.NODE_ENV === 'development'
    },
    ...options
  };

  // Ensure window is visible on screen
  ensureWindowVisibility(windowOptions);
  
  // Create the window
  const win = new BrowserWindow(windowOptions);
  
  // Load the appropriate HTML file
  if (type !== WindowType.MINI_APP) {
    win.loadFile(path.join(__dirname, '../../', WINDOW_HTML[type]));
  }
  
  // Enable DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools({ mode: 'detach' });
  }
  
  // Save window position and size when closed
  win.on('close', () => {
    if (!win.isDestroyed()) {
      const { x, y, width, height } = win.getBounds();
      store.set(`windowConfig.${type}`, { x, y, width, height });
    }
    
    // Remove from windows map
    windows.delete(type);
  });
  
  // Store window reference
  windows.set(type, win);
  
  return win;
}

/**
 * Create a mini app window
 * @param {string} appName - Name of the mini app
 * @param {string} htmlContent - HTML content of the mini app
 * @param {string} filePath - Path to save the mini app HTML file
 * @param {string} conversationId - Conversation ID for the mini app
 * @returns {BrowserWindow} - The created window
 */
export function createMiniAppWindow(appName, htmlContent, filePath, conversationId) {
  // Get default window size from settings
  const { defaultWindowWidth, defaultWindowHeight } = store.get('settings');
  
  const win = createWindow(WindowType.MINI_APP, {
    width: defaultWindowWidth,
    height: defaultWindowHeight,
    title: appName,
    // Add specific position parameters to ensure window is visible
    x: 100,
    y: 100
  });
  
  // The rest of the mini app window creation logic will be handled by the caller
  // (main.js) as it involves file operations and other complex logic
  
  return win;
}

/**
 * Get a window by type
 * @param {string} type - Window type from WindowType enum
 * @returns {BrowserWindow|null} - The window or null if not found
 */
export function getWindow(type) {
  return windows.get(type) || null;
}

/**
 * Check if a window exists and is not destroyed
 * @param {string} type - Window type from WindowType enum
 * @returns {boolean} - True if window exists and is not destroyed
 */
export function hasWindow(type) {
  const win = windows.get(type);
  return win && !win.isDestroyed();
}

/**
 * Show a window, creating it if it doesn't exist
 * @param {string} type - Window type from WindowType enum
 * @param {Object} options - Additional options for the window if it needs to be created
 * @returns {BrowserWindow} - The window
 */
export function showWindow(type, options = {}) {
  let win = getWindow(type);
  
  if (!win || win.isDestroyed()) {
    win = createWindow(type, options);
  }
  
  if (win.isMinimized()) {
    win.restore();
  }
  
  win.show();
  win.focus();
  
  return win;
}

/**
 * Close a window if it exists
 * @param {string} type - Window type from WindowType enum
 * @returns {boolean} - True if window was closed
 */
export function closeWindow(type) {
  const win = getWindow(type);
  
  if (win && !win.isDestroyed()) {
    win.close();
    return true;
  }
  
  return false;
}

/**
 * Close all windows
 */
export function closeAllWindows() {
  for (const [type, win] of windows.entries()) {
    if (!win.isDestroyed()) {
      win.close();
    }
  }
  
  windows.clear();
}

/**
 * Send a message to a window
 * @param {string} type - Window type from WindowType enum
 * @param {string} channel - IPC channel
 * @param {...any} args - Arguments to send
 * @returns {boolean} - True if message was sent
 */
export function sendToWindow(type, channel, ...args) {
  const win = getWindow(type);
  
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, ...args);
    return true;
  }
  
  return false;
}

/**
 * Broadcast a message to all windows
 * @param {string} channel - IPC channel
 * @param {...any} args - Arguments to send
 */
export function broadcastToWindows(channel, ...args) {
  for (const [type, win] of windows.entries()) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, ...args);
    }
  }
}

/**
 * Ensure window is visible on screen
 * @param {Object} windowOptions - Window options with x, y, width, height
 */
function ensureWindowVisibility(windowOptions) {
  // If x or y is not set, center the window
  if (windowOptions.x === undefined || windowOptions.y === undefined) {
    delete windowOptions.x;
    delete windowOptions.y;
    return;
  }
  
  const displays = screen.getAllDisplays();
  let isVisible = false;
  
  // Check if window is visible on any display
  for (const display of displays) {
    const { x, y, width, height } = display.bounds;
    
    if (
      windowOptions.x >= x && 
      windowOptions.y >= y && 
      windowOptions.x + windowOptions.width <= x + width && 
      windowOptions.y + windowOptions.height <= y + height
    ) {
      isVisible = true;
      break;
    }
  }
  
  // If not visible, center on primary display
  if (!isVisible) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    
    windowOptions.x = Math.floor((width - windowOptions.width) / 2);
    windowOptions.y = Math.floor((height - windowOptions.height) / 2);
  }
}

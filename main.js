import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import ClaudeClient from './claudeClient.js';
import store from './store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let claudeClient = null;

// Track all mini app windows
const miniAppWindows = new Map();

// Disable IMK warnings on macOS
if (process.platform === 'darwin') {
  process.env.IMK_DISABLE_WARNINGS = '1';
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs'),
      // Disable DevTools in production
      devTools: process.env.NODE_ENV === 'development'
    }
  });

  win.loadFile('index.html');

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  return win;
}

function createMiniAppWindow(appName, htmlContent, filePath, conversationId) {
  // Get default window size from settings
  const { defaultWindowWidth, defaultWindowHeight } = store.get('settings');
  
  const win = new BrowserWindow({
    width: defaultWindowWidth,
    height: defaultWindowHeight,
    titleBarStyle: 'hiddenInset',
    title: appName,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true, // Sandbox for security
      preload: path.join(__dirname, 'miniAppPreload.cjs'),
    }
  });

  // Create a temporary file for the HTML content
  const tempFilePath = filePath || path.join(app.getPath('temp'), `${Date.now()}.html`);
  
  // Save the HTML content to the file
  fs.writeFile(tempFilePath, htmlContent)
    .then(() => {
      // Load the file
      win.loadFile(tempFilePath);
      
      // Store the window reference
      if (conversationId) {
        miniAppWindows.set(conversationId, {
          window: win,
          filePath: tempFilePath,
          name: appName
        });
      }
      
      // Clean up when the window is closed
      win.on('closed', () => {
        if (conversationId) {
          miniAppWindows.delete(conversationId);
        }
        
        // Delete the temp file if it's not a saved app
        if (!filePath) {
          fs.unlink(tempFilePath).catch(() => {});
        }
      });
    })
    .catch(error => {
      console.error('Failed to create mini app window:', error);
      win.close();
    });

  return win;
}

// Initialize Claude client
function initializeClaudeClient() {
  const apiKey = store.get('apiKey');
  if (apiKey) {
    claudeClient = new ClaudeClient(apiKey);
    return true;
  }
  return false;
}

// Handle API key setup
ipcMain.handle('set-api-key', async (event, apiKey) => {
  try {
    store.set('apiKey', apiKey);
    claudeClient = new ClaudeClient(apiKey);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Check if API key is set
ipcMain.handle('check-api-key', async () => {
  const apiKey = store.get('apiKey');
  return { 
    hasApiKey: !!apiKey,
    apiKey: apiKey || ''
  };
});

// Generate mini app
ipcMain.handle('generate-mini-app', async (event, { prompt, appName }) => {
  try {
    if (!claudeClient) {
      const initialized = initializeClaudeClient();
      if (!initialized) {
        return {
          success: false,
          error: 'Claude API key not set. Please set your API key in settings.'
        };
      }
    }
    
    // Start streaming response
    event.sender.send('generation-status', {
      status: 'generating',
      message: 'Generating your mini app...'
    });
    
    const response = await claudeClient.generateApp(prompt);
    let htmlContent = '';
    
    // Stream the response
    for await (const streamEvent of response) {
      if (streamEvent.type === 'content_block_delta' && streamEvent.delta.type === 'text_delta') {
        htmlContent += streamEvent.delta.text || '';
        event.sender.send('generation-chunk', {
          content: streamEvent.delta.text || '',
          done: false
        });
      }
    }
    
    // Signal completion
    event.sender.send('generation-chunk', {
      done: true
    });
    
    // Save the generated app
    const savedApp = await claudeClient.saveGeneratedApp(
      appName || 'Mini App',
      htmlContent,
      prompt
    );
    
    // Create a window for the app
    createMiniAppWindow(
      savedApp.metadata.name,
      htmlContent,
      savedApp.filePath,
      savedApp.metadata.conversationId
    );
    
    // Update recent apps list
    const recentApps = store.get('recentApps') || [];
    recentApps.unshift({
      id: savedApp.metadata.conversationId,
      name: savedApp.metadata.name,
      created: savedApp.metadata.created,
      filePath: savedApp.filePath
    });
    
    // Keep only the 10 most recent apps
    if (recentApps.length > 10) {
      recentApps.length = 10;
    }
    
    store.set('recentApps', recentApps);
    
    return { 
      success: true,
      appId: savedApp.metadata.conversationId,
      name: savedApp.metadata.name
    };
  } catch (error) {
    event.sender.send('generation-status', {
      status: 'error',
      message: `Error: ${error.message}`
    });
    
    return {
      success: false,
      error: error.message
    };
  }
});

// List generated apps
ipcMain.handle('list-mini-apps', async () => {
  try {
    if (!claudeClient) {
      const initialized = initializeClaudeClient();
      if (!initialized) {
        return { apps: [] };
      }
    }
    
    const apps = await claudeClient.listGeneratedApps();
    return { apps };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      apps: []
    };
  }
});

// Open a mini app
ipcMain.handle('open-mini-app', async (event, { appId, filePath, name }) => {
  try {
    // Check if the window is already open
    if (miniAppWindows.has(appId)) {
      const existingWindow = miniAppWindows.get(appId).window;
      if (!existingWindow.isDestroyed()) {
        existingWindow.focus();
        return { success: true };
      }
    }
    
    // Read the file content
    const htmlContent = await fs.readFile(filePath, 'utf-8');
    
    // Create a new window
    createMiniAppWindow(name, htmlContent, filePath, appId);
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Update a mini app
ipcMain.handle('update-mini-app', async (event, { appId, prompt }) => {
  try {
    if (!claudeClient) {
      const initialized = initializeClaudeClient();
      if (!initialized) {
        return {
          success: false,
          error: 'Claude API key not set. Please set your API key in settings.'
        };
      }
    }
    
    // Start streaming response
    event.sender.send('generation-status', {
      status: 'updating',
      message: 'Updating your mini app...'
    });
    
    const response = await claudeClient.generateApp(prompt, appId);
    let htmlContent = '';
    
    // Stream the response
    for await (const streamEvent of response) {
      if (streamEvent.type === 'content_block_delta' && streamEvent.delta.type === 'text_delta') {
        htmlContent += streamEvent.delta.text || '';
        event.sender.send('generation-chunk', {
          content: streamEvent.delta.text || '',
          done: false
        });
      }
    }
    
    // Signal completion
    event.sender.send('generation-chunk', {
      done: true
    });
    
    // Update the app
    const updatedApp = await claudeClient.updateGeneratedApp(
      appId,
      prompt,
      htmlContent
    );
    
    // If the window is open, update it
    if (miniAppWindows.has(appId)) {
      const appWindow = miniAppWindows.get(appId);
      if (!appWindow.window.isDestroyed()) {
        // Update the window content
        await fs.writeFile(updatedApp.filePath, htmlContent);
        appWindow.window.loadFile(updatedApp.filePath);
      }
    }
    
    return { 
      success: true,
      appId,
      filePath: updatedApp.filePath
    };
  } catch (error) {
    event.sender.send('generation-status', {
      status: 'error',
      message: `Error: ${error.message}`
    });
    
    return {
      success: false,
      error: error.message
    };
  }
});

// Delete a mini app
ipcMain.handle('delete-mini-app', async (event, { appId }) => {
  try {
    if (!claudeClient) {
      const initialized = initializeClaudeClient();
      if (!initialized) {
        return {
          success: false,
          error: 'Claude API key not set. Please set your API key in settings.'
        };
      }
    }
    
    // Close the window if it's open
    if (miniAppWindows.has(appId)) {
      const appWindow = miniAppWindows.get(appId);
      if (!appWindow.window.isDestroyed()) {
        appWindow.window.close();
      }
      miniAppWindows.delete(appId);
    }
    
    // Delete the app
    await claudeClient.deleteGeneratedApp(appId);
    
    // Update recent apps list
    const recentApps = store.get('recentApps') || [];
    const updatedRecentApps = recentApps.filter(app => app.id !== appId);
    store.set('recentApps', updatedRecentApps);
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Export a mini app
ipcMain.handle('export-mini-app', async (event, { appId, filePath }) => {
  try {
    // Read the file content
    const htmlContent = await fs.readFile(filePath, 'utf-8');
    
    // Show save dialog
    const { canceled, filePath: savePath } = await dialog.showSaveDialog({
      title: 'Export Mini App',
      defaultPath: path.join(app.getPath('documents'), 'mini-app.html'),
      filters: [
        { name: 'HTML Files', extensions: ['html'] }
      ]
    });
    
    if (canceled) {
      return { success: false, canceled: true };
    }
    
    // Save the file
    await fs.writeFile(savePath, htmlContent);
    
    return { success: true, filePath: savePath };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Open app directory
ipcMain.handle('open-app-directory', async () => {
  try {
    if (!claudeClient) {
      const initialized = initializeClaudeClient();
      if (!initialized) {
        return {
          success: false,
          error: 'Claude API key not set. Please set your API key in settings.'
        };
      }
    }
    
    await shell.openPath(claudeClient.appStoragePath);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

app.whenReady().then(() => {
  createMainWindow();
  initializeClaudeClient();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

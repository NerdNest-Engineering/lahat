import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import path from 'path';
import * as fileOperations from '../utils/fileOperations.js';
import * as apiHandlers from './apiHandlers.js';
import * as miniAppManager from '../miniAppManager.js';
import * as titleDescriptionGenerator from '../utils/titleDescriptionGenerator.js';
import store from '../../store.js';
import fs from 'fs/promises';

/**
 * Get the app storage path without requiring Claude client initialization
 * @returns {string} - Path to the app storage directory
 */
function getAppStoragePath() {
  return path.join(app.getPath('userData'), 'generated-apps');
}

/**
 * Migrate old metadata format to new standardized format
 * @param {Object} metadata - Old metadata object
 * @param {string} metadataPath - Path to the metadata file
 * @returns {Promise<Object>} - Migrated metadata object
 */
async function migrateMetadata(metadata, metadataPath) {
  // Check if metadata is already in new format
  if (metadata.appName && metadata.appDescription && metadata.createdAt) {
    return metadata; // Already in new format
  }
  
  console.log('Migrating metadata to new format:', metadataPath);
  
  // Create new standardized metadata
  const migratedMetadata = {
    appName: metadata.appName || metadata.name || 'Untitled App',
    appDescription: metadata.appDescription || metadata.description || metadata.prompt || 'No description available',
    createdAt: metadata.createdAt || metadata.created || new Date().toISOString(),
    updatedAt: metadata.updatedAt || metadata.created || new Date().toISOString(),
    conversationId: metadata.conversationId || `legacy_${Date.now()}`,
    logo: metadata.logo || null,
    versions: metadata.versions || [
      {
        timestamp: Date.now(),
        filePath: 'index.html'
      }
    ]
  };
  
  // Write the migrated metadata back to disk
  try {
    await fs.writeFile(metadataPath, JSON.stringify(migratedMetadata, null, 2));
    console.log('Successfully migrated metadata:', metadataPath);
  } catch (error) {
    console.warn('Failed to write migrated metadata:', error);
  }
  
  return migratedMetadata;
}

/**
 * List apps from filesystem without requiring Claude client
 * @returns {Promise<Array>} - Array of app objects
 */
async function listAppsFromFileSystem() {
  try {
    const appStoragePath = getAppStoragePath();
    
    // Ensure the directory exists
    try {
      await fs.access(appStoragePath);
    } catch (error) {
      // Directory doesn't exist, return empty array
      return [];
    }
    
    // Get all folders in the app storage directory
    const items = await fs.readdir(appStoragePath, { withFileTypes: true });
    const folders = items.filter(item => item.isDirectory()).map(item => item.name);
    const apps = [];
    
    for (const folder of folders) {
      const metadataPath = path.join(appStoragePath, folder, 'metadata.json');
      
      try {
        // Check if metadata file exists
        await fs.access(metadataPath);
        
        // Read and parse metadata
        const metaContent = await fs.readFile(metadataPath, 'utf-8');
        const rawMetadata = JSON.parse(metaContent);
        
        // Migrate metadata to new format if needed
        const metadata = await migrateMetadata(rawMetadata, metadataPath);
        
        // Get the latest version file path
        const latestVersion = metadata.versions[metadata.versions.length - 1];
        const latestFilePath = path.join(appStoragePath, folder, latestVersion.filePath);
        
        // Get logo path if available
        let logoPath = null;
        if (metadata.logo && metadata.logo.filePath) {
          logoPath = path.join(appStoragePath, folder, metadata.logo.filePath);
        }
        
        apps.push({
          id: folder,
          name: metadata.appName,
          description: metadata.appDescription,
          filePath: latestFilePath,
          logo: metadata.logo,
          logoPath: logoPath,
          createdAt: metadata.createdAt,
          updatedAt: metadata.updatedAt,
          versions: metadata.versions
        });
      } catch (error) {
        // If metadata doesn't exist, try to find an HTML file directly
        try {
          const htmlFilePath = path.join(appStoragePath, folder, 'index.html');
          await fs.access(htmlFilePath);
          
          // Get file stats for created date
          const stats = await fs.stat(htmlFilePath);
          
          // Check for logo
          let logoPath = null;
          try {
            const assetsDir = path.join(appStoragePath, folder, 'assets');
            const assetItems = await fs.readdir(assetsDir);
            const logoFile = assetItems.find(file => file.startsWith('logo.'));
            if (logoFile) {
              logoPath = path.join(assetsDir, logoFile);
            }
          } catch (e) {
            // No assets directory or logo file
          }
          
          // Create fallback app entry
          apps.push({
            id: folder,
            name: folder.replace(/_/g, ' ').replace(/\d+$/, '').trim() || folder,
            description: 'Legacy app (no metadata available)',
            filePath: htmlFilePath,
            logo: logoPath ? { filePath: `assets/${path.basename(logoPath)}` } : null,
            logoPath: logoPath,
            createdAt: stats.birthtime.toISOString(),
            updatedAt: stats.mtime.toISOString(),
            versions: [{
              timestamp: stats.mtime.getTime(),
              filePath: 'index.html'
            }]
          });
        } catch (htmlError) {
          console.warn(`No valid app found in ${folder}: ${htmlError.message}`);
          // Skip this directory completely
        }
      }
    }
    
    // Sort by updatedAt date (most recent first)
    apps.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    return apps;
  } catch (error) {
    console.error('Error listing apps from filesystem:', error);
    return [];
  }
}

/**
 * Mini App Handlers Module
 * Responsible for mini app generation and management IPC handlers
 */

/**
 * Handle generating a mini app with pre-created folder
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for generating the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleGenerateMiniApp(event, { prompt, appName, folderPath, conversationId, logoPath }) {
  try {
    const claudeClient = await apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Start streaming response
    if (!event.sender.isDestroyed()) {
      event.sender.send('generation-status', {
        status: 'generating',
        message: 'Generating your mini app...'
      });
    }
    
    const response = await claudeClient.generateApp(prompt, conversationId);
    let htmlContent = '';
    
    // Stream the response
    for await (const streamEvent of response) {
      if (streamEvent.type === 'content_block_delta' && streamEvent.delta.type === 'text_delta') {
        htmlContent += streamEvent.delta.text || '';
        if (!event.sender.isDestroyed()) {
          event.sender.send('generation-chunk', {
            content: streamEvent.delta.text || '',
            done: false
          });
        }
      }
    }
    
    // Signal completion
    if (!event.sender.isDestroyed()) {
      event.sender.send('generation-chunk', {
        done: true
      });
    }
    
    // Save the generated app to the pre-created folder
    let savedApp;
    if (folderPath && conversationId) {
      // Use the pre-created folder structure
      const htmlFilePath = path.join(folderPath, 'index.html');
      await fs.writeFile(htmlFilePath, htmlContent);
      
      // Create metadata in new standardized format
      const metadata = {
        appName: appName || 'Mini App',
        appDescription: prompt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        conversationId,
        logo: logoPath ? { filePath: logoPath } : null,
        versions: [
          {
            timestamp: Date.now(),
            filePath: 'index.html'
          }
        ]
      };
      
      // Save metadata
      const metadataPath = path.join(folderPath, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      savedApp = {
        folderPath,
        filePath: htmlFilePath,
        metadata
      };
    } else {
      // Fallback to original method
      savedApp = await claudeClient.saveGeneratedApp(
        appName || 'Mini App',
        htmlContent,
        prompt
      );
    }
    
    // Create a window for the app
    const windowResult = await miniAppManager.createMiniAppWindow(
      savedApp.metadata.appName,
      htmlContent,
      savedApp.filePath,
      savedApp.metadata.conversationId
    );
    
    if (!windowResult.success) {
      return {
        success: false,
        error: windowResult.error
      };
    }
    
    // Update recent apps list
    const recentApps = store.get('recentApps') || [];
    recentApps.unshift({
      id: savedApp.metadata.conversationId,
      name: savedApp.metadata.appName,
      created: savedApp.metadata.createdAt,
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
      name: savedApp.metadata.appName
    };
  } catch (error) {
    if (!event.sender.isDestroyed()) {
      event.sender.send('generation-status', {
        status: 'error',
        message: `Error: ${error.message}`
      });
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle listing mini apps
 * @returns {Promise<Object>} - Result object with apps list
 */
async function handleListMiniApps() {
  try {
    // List apps directly from filesystem without requiring Claude client
    const apps = await listAppsFromFileSystem();
    return { apps };
  } catch (error) {
    console.error('Error listing mini apps:', error);
    return {
      success: false,
      error: error.message,
      apps: []
    };
  }
}

/**
 * Handle opening a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for opening the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleOpenMiniApp(event, { appId, filePath, name }) {
  console.log('handleOpenMiniApp called with:', { appId, filePath, name });
  
  try {
    // No need for Claude client to open existing apps
    const result = await miniAppManager.openMiniApp(appId, filePath, name);
    return result;
  } catch (error) {
    console.error('Error in handleOpenMiniApp:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle updating a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for updating the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleUpdateMiniApp(event, { appId, prompt }) {
  try {
    const claudeClient = await apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Start streaming response
    if (!event.sender.isDestroyed()) {
      event.sender.send('generation-status', {
        status: 'updating',
        message: 'Updating your mini app...'
      });
    }
    
    const response = await claudeClient.generateApp(prompt, appId);
    let htmlContent = '';
    
    // Stream the response
    for await (const streamEvent of response) {
      if (streamEvent.type === 'content_block_delta' && streamEvent.delta.type === 'text_delta') {
        htmlContent += streamEvent.delta.text || '';
        if (!event.sender.isDestroyed()) {
          event.sender.send('generation-chunk', {
            content: streamEvent.delta.text || '',
            done: false
          });
        }
      }
    }
    
    // Signal completion
    if (!event.sender.isDestroyed()) {
      event.sender.send('generation-chunk', {
        done: true
      });
    }
    
    // Update the app
    const updatedApp = await claudeClient.updateGeneratedApp(
      appId,
      prompt,
      htmlContent
    );
    
    // Update the window if it's open
    const updateResult = await miniAppManager.updateMiniApp(
      appId,
      htmlContent,
      updatedApp.filePath
    );
    
    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error
      };
    }
    
    return { 
      success: true,
      appId,
      filePath: updatedApp.filePath
    };
  } catch (error) {
    if (!event.sender.isDestroyed()) {
      event.sender.send('generation-status', {
        status: 'error',
        message: `Error: ${error.message}`
      });
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle deleting a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for deleting the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleDeleteMiniApp(event, { appId }) {
  try {
    const claudeClient = await apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Close the window if it's open
    miniAppManager.closeMiniApp(appId);
    
    // Delete the app
    await claudeClient.deleteGeneratedApp(appId);
    
    // Update recent apps list
    const recentApps = store.get('recentApps') || [];
    const updatedRecentApps = recentApps.filter(app => app.id !== appId);
    store.set('recentApps', updatedRecentApps);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting mini app:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle exporting a mini app as a package (.lahat file)
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for exporting the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleExportMiniApp(event, { appId, filePath }) {
  try {
    // No need for Claude client to export existing apps
    
    // Get the app name - first check if it's open in a window
    let appName = null;
    const miniApp = miniAppManager.getMiniApp(appId);
    if (miniApp && miniApp.name) {
      appName = miniApp.name;
    } else {
      // If not open, we need to find the app in the storage directory
      try {
        // Get all folders in the app storage directory
        const appStoragePath = path.join(app.getPath('userData'), 'generated-apps');
        const items = await fs.readdir(appStoragePath, { withFileTypes: true });
        const folders = items.filter(item => item.isDirectory()).map(item => item.name);
        
        // Search for the app with matching conversationId
        for (const folder of folders) {
          const metadataPath = path.join(appStoragePath, folder, 'metadata.json');
          
          try {
            const metaContent = await fs.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(metaContent);
            
            if (metadata.conversationId === appId) {
              appName = metadata.appName || metadata.name;
              break;
            }
          } catch (error) {
            continue; // Skip invalid metadata files
          }
        }
      } catch (error) {
        console.warn('Could not retrieve app name from storage:', error);
      }
    }
    
    // If we couldn't find the name, use a default
    if (!appName) {
      appName = 'mini-app';
    }
    
    // Format app name to be filename-friendly
    const safeAppName = appName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
    
    // Show save dialog for .lahat file with app name
    const { canceled, filePath: savePath } = await dialog.showSaveDialog({
      title: 'Export Mini App Package',
      defaultPath: path.join(app.getPath('documents'), `${safeAppName}.lahat`),
      filters: [
        { name: 'Lahat Apps', extensions: ['lahat'] }
      ]
    });
    
    if (canceled) {
      return { success: false, canceled: true };
    }
    
    // Export the app as a package
    const result = await claudeClient.exportMiniAppAsPackage(appId, savePath);
    return result;
  } catch (error) {
    console.error('Error exporting mini app:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle importing a mini app package
 * @param {Object} event - IPC event
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleImportMiniApp(event) {
  try {
    // No need for Claude client to import apps
    
    // Show open dialog
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import Mini App Package',
      properties: ['openFile'],
      filters: [
        { name: 'Lahat Apps', extensions: ['lahat'] },
        { name: 'Zip Files', extensions: ['zip'] }
      ]
    });
    
    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true };
    }
    
    // Import the app package
    const result = await claudeClient.importMiniAppPackage(filePaths[0]);
    
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
      
      // Notify main window to refresh app list
      const mainWindow = BrowserWindow.getAllWindows().find(win => 
        win.webContents.getTitle().includes('Lahat'));
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('refresh-app-list');
      }
      
      // Open the imported app
      await miniAppManager.openMiniApp(result.appId, result.filePath, result.name);
    }
    
    return result;
  } catch (error) {
    console.error('Error importing mini app:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle creating app folder structure early for logo generation
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for creating app folder
 * @returns {Promise<Object>} - Result object with folder path
 */
async function handleCreateAppFolder(event, { appName }) {
  try {
    const claudeClient = await apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Create a safe folder name from the app name
    const safeAppName = appName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = Date.now();
    const folderName = `${safeAppName}_${timestamp}`;
    const folderPath = path.join(claudeClient.appStoragePath, folderName);
    
    // Create the app folder
    await fs.mkdir(folderPath, { recursive: true });
    
    // Create assets folder
    await fs.mkdir(path.join(folderPath, 'assets'), { recursive: true });
    
    return {
      success: true,
      folderPath,
      folderName,
      conversationId: `conv_${timestamp}`
    };
  } catch (error) {
    console.error('Error creating app folder:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle generating title and description for a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for generating title and description
 * @returns {Promise<Object>} - Result object with title and description
 */
async function handleGenerateTitleAndDescription(event, { input }) {
  try {
    const claudeClient = await apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Start streaming status
    if (!event.sender.isDestroyed()) {
      event.sender.send('generation-status', {
        status: 'generating',
        message: 'Generating title and description...'
      });
    }
    
    // Generate title and description with streaming
    const result = await titleDescriptionGenerator.generateTitleAndDescription(
      input,
      claudeClient.apiKey,
      (chunk) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send('title-description-chunk', chunk);
        }
      }
    );
    
    // Signal completion
    if (!event.sender.isDestroyed()) {
      event.sender.send('generation-status', {
        status: 'complete',
        message: 'Title and description generated'
      });
    }
    
    return { 
      success: true,
      title: result.title,
      description: result.description
    };
  } catch (error) {
    if (!event.sender.isDestroyed()) {
      event.sender.send('generation-status', {
        status: 'error',
        message: `Error: ${error.message}`
      });
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Register mini app-related IPC handlers
 */
export function registerHandlers() {
  // Create app folder
  ipcMain.handle('create-app-folder', handleCreateAppFolder);
  
  // Generate mini app
  ipcMain.handle('generate-mini-app', handleGenerateMiniApp);
  
  // Generate title and description
  ipcMain.handle('generate-title-and-description', handleGenerateTitleAndDescription);
  
  // List mini apps
  ipcMain.handle('list-mini-apps', handleListMiniApps);
  
  // Open a mini app
  ipcMain.handle('open-mini-app', handleOpenMiniApp);
  
  // Update a mini app
  ipcMain.handle('update-mini-app', handleUpdateMiniApp);
  
  // Delete a mini app
  ipcMain.handle('delete-mini-app', handleDeleteMiniApp);
  
  // Export a mini app
  ipcMain.handle('export-mini-app', handleExportMiniApp);
  
  // Import a mini app
  ipcMain.handle('import-mini-app', handleImportMiniApp);
  
  console.log('Mini app handlers registered');
}

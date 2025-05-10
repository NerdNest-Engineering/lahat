import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import path from 'path';
import * as fileOperations from '../utils/fileOperations.js';
import * as apiHandlers from './apiHandlers.js';
import * as miniAppManager from '../miniAppManager.js';
import * as titleDescriptionGenerator from '../utils/titleDescriptionGenerator.js';
import * as versionControl from '../utils/versionControl.js'; // Added import
import { getActiveMiniApp } from '../utils/activeAppState.js'; // Added import
import * as windowManager from '../windowManager/windowManager.js'; // Added import
import { WindowType } from '../windowManager/windowManager.js'; // Added import
import store from '../../store.js';
import fs from 'fs/promises';

/**
 * Mini App Handlers Module
 * Responsible for mini app generation and management IPC handlers
 */

/**
 * Handle generating a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for generating the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleGenerateMiniApp(event, { prompt, appName }) {
  try {
    const claudeClient = apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
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
    const windowResult = await miniAppManager.createMiniAppWindow(
      savedApp.metadata.name,
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
}

/**
 * Handle listing mini apps
 * @returns {Promise<Object>} - Result object with apps list
 */
async function handleListMiniApps() {
  try {
    const claudeClient = apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return { apps: [] };
    }
    
    const apps = await claudeClient.listGeneratedApps();
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
    const claudeClient = apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
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
    event.sender.send('generation-status', {
      status: 'error',
      message: `Error: ${error.message}`
    });
    
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
    const claudeClient = apiHandlers.getClaudeClient();
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
 * Handle exporting a mini app as a package (zip file)
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for exporting the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleExportMiniApp(event, { appId, filePath }) {
  try {
    const claudeClient = apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Show save dialog for zip file
    const { canceled, filePath: savePath } = await dialog.showSaveDialog({
      title: 'Export Mini App Package',
      defaultPath: path.join(app.getPath('documents'), 'mini-app-package.zip'),
      filters: [
        { name: 'Zip Files', extensions: ['zip'] }
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
    const claudeClient = apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Show open dialog
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import Mini App Package',
      properties: ['openFile'],
      filters: [
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
 * Handle generating title and description for a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for generating title and description
 * @returns {Promise<Object>} - Result object with title and description
 */
async function handleGenerateTitleAndDescription(event, { input }) {
  try {
    const claudeClient = apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Start streaming status
    event.sender.send('generation-status', {
      status: 'generating',
      message: 'Generating title and description...'
    });
    
    // Generate title and description with streaming
    const result = await titleDescriptionGenerator.generateTitleAndDescription(
      input,
      claudeClient.apiKey,
      (chunk) => {
        // Send each chunk to the renderer
        event.sender.send('title-description-chunk', chunk);
      }
    );
    
    // Signal completion
    event.sender.send('generation-status', {
      status: 'complete',
      message: 'Title and description generated'
    });
    
    return { 
      success: true,
      title: result.title,
      description: result.description
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
}

// Helper function to extract HTML and explanation from Claude response
function extractFromResponse(response) {
  // Extract HTML between code blocks
  const htmlMatch = response.match(/```html\s*([\s\S]*?)\s*```/) ||
                    response.match(/<html[\s\S]*<\/html>/);
  
  let html = '';
  if (htmlMatch && htmlMatch[1]) {
    html = htmlMatch[1].trim();
  } else {
    // If no clear HTML markers, look for anything that looks like HTML
    const possibleHtml = response.match(/<(!DOCTYPE|html|body|head)[\s\S]*$/);
    if (possibleHtml) {
      html = possibleHtml[0];
    } else {
      // If still no HTML found, use entire response
      html = response;
    }
  }
  
  // Extract explanation (first few lines before any code block)
  let explanation = response.split('```')[0].trim();
  
  // If explanation is too long, trim it
  if (explanation.length > 200) {
    explanation = explanation.substring(0, 197) + '...';
  }
  
  return { html, explanation };
}


/**
 * Open the iteration window for a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters with appId, filePath, and name
 * @returns {Promise<Object>} - Result object with window ID
 */
async function handleOpenIterationWindow(event, { appId, filePath, name }) {
  try {
    console.log('Opening iteration window for:', { appId, filePath, name });
    
    // Initialize git repo for version control
    const repoResult = await versionControl.initRepo(appId, filePath);
    if (!repoResult.success) {
      return repoResult;
    }
    
    // Read the current HTML
    const readResult = await fileOperations.readFile(filePath);
    if (!readResult.success) {
      return readResult;
    }
    
    // Create window
    const win = windowManager.createWindow(WindowType.APP_ITERATION, {
      title: `Iterate on ${name}`,
      width: 900,
      height: 700
    });
    
    // Once window is ready, send app data
    win.webContents.once('did-finish-load', () => {
      win.webContents.send('init-app-iteration', {
        appId,
        appName: name,
        filePath,
        html: readResult.content
      });
    });
    
    // We'll register a proper handler for 'get-app-iteration-data' in the registerHandlers function
    // Store the data for this window to be retrieved later
    win.appIterationData = {
      appId,
      appName: name,
      filePath,
      html: readResult.content
    };

    return {
      success: true,
      windowId: win.id
    };
  } catch (error) {
    console.error('Error opening iteration window:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle iterating on a mini app with a prompt
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters with appId and prompt
 * @returns {Promise<Object>} - Result object with commit info
 */
async function handleIterateOnMiniApp(event, { appId, prompt }) {
  try {
    const claudeClient = apiHandlers.getClaudeClient();
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    // Try to get the app from the window manager first
    let app = miniAppManager.getMiniApp(appId);
    let originalFilePath;

    if (app) {
      // If the app window is open, use its filePath
      originalFilePath = app.filePath;
    } else {
      // Otherwise, get app details from metadata
      const appDetailsResult = await apiHandlers.getAppDetails(appId);
      if (!appDetailsResult || !appDetailsResult.success) {
        return {
          success: false,
          error: appDetailsResult?.error || 'App details not found for the given ID.'
        };
      }
      originalFilePath = appDetailsResult.metadata.filePath;
    }
    
    // Ensure repo exists
    const repoInfo = await versionControl.initRepo(appId, originalFilePath);
    if (!repoInfo.success) return repoInfo;
    
    // Read from repo path
    const readResult = await fileOperations.readFile(repoInfo.filePath);
    if (!readResult.success) {
      return readResult;
    }
    
    // Create specialized prompt for iteration
    const iterationPrompt = `
      I have a mini app with the following HTML content. Please update it according to the user's request.
      
      CURRENT HTML:
      \`\`\`html
      ${readResult.content}
      \`\`\`
      
      USER REQUEST: ${prompt}
      
      Your response should include:
      1. A brief explanation of the changes you made (1-2 sentences)
      2. The complete updated HTML code
      
      Provide the complete HTML code, including any unchanged parts. Ensure the HTML is valid.
    `;
    
    // Stream response status to the sender
    event.sender.send('iteration-status', {
      status: 'processing',
      message: 'Processing your request...'
    });
    
    // Send to Claude and get response
    const response = await claudeClient.generateText(iterationPrompt);
    
    // Extract explanation and HTML
    const { explanation, html } = extractFromResponse(response);

    if (!html) {
       throw new Error("Could not extract valid HTML from the response.");
    }
    
    // Update the app file and reload window if open
    // Pass the originalFilePath obtained from metadata
    const updateResult = await miniAppManager.updateMiniApp(
      appId,
      html,
      originalFilePath // Update the original file path
    );
    
    if (!updateResult.success) {
      event.sender.send('iteration-status', {
        status: 'error',
        message: updateResult.error
      });
      return updateResult;
    }
    
    // Create a version commit using the updated content
    const commitResult = await versionControl.commitChange(
      appId,
      html,
      `Iteration: ${prompt.substring(0, 40)}${prompt.length > 40 ? '...' : ''}`
    );

    if (!commitResult.success) {
       // Handle commit failure (e.g., empty commit error handled in versionControl)
       if (commitResult.noChanges) {
          event.sender.send('iteration-response', {
             success: true,
             message: "No changes detected in the generated HTML.",
             commitId: commitResult.commitId, // Send existing commit ID
             noChanges: true
          });
          return { success: true, commitId: commitResult.commitId, message: "No changes detected.", noChanges: true };
       } else {
          throw new Error(commitResult.error); // Throw other commit errors
       }
    }
    
    // Send success status and response
    event.sender.send('iteration-response', {
      success: true,
      message: explanation || "Changes applied.", // Provide default explanation
      commitId: commitResult.commitId
    });
    
    // Also notify about the new version for the list update
    event.sender.send('version-created', {
       id: commitResult.commitId,
       message: commitResult.message,
       date: commitResult.date
    });

    return {
      success: true,
      commitId: commitResult.commitId,
      message: explanation || "Changes applied."
    };
  } catch (error) {
    console.error('Error iterating on mini app:', error);
    
    event.sender.send('iteration-status', {
      status: 'error',
      message: `Error: ${error.message}`
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get version history for a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters with appId
 * @returns {Promise<Object>} - Result object with commits
 */
async function handleGetVersionHistory(event, { appId }) {
  try {
    // Ensure repo is initialized before getting history
    const app = miniAppManager.getMiniApp(appId);
    if (!app) return { success: false, error: 'App not found', commits: [] };
    await versionControl.initRepo(appId, app.filePath);
    
    return await versionControl.getCommitHistory(appId);
  } catch (error) {
    console.error('Error getting version history:', error);
    return {
      success: false,
      error: error.message,
      commits: []
    };
  }
}

/**
 * Restore a specific version of a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters with appId and commitId
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleRestoreVersion(event, { appId, commitId }) {
  try {
    // Try to get the app from the window manager first
    let app = miniAppManager.getMiniApp(appId);
    let originalFilePath;

    if (app) {
      // If the app window is open, use its filePath
      originalFilePath = app.filePath;
    } else {
      // Otherwise, get app details from metadata
      const appDetailsResult = await apiHandlers.getAppDetails(appId);
      if (!appDetailsResult || !appDetailsResult.success) {
        return {
          success: false,
          error: appDetailsResult?.error || 'App details not found for the given ID.'
        };
      }
      originalFilePath = appDetailsResult.metadata.filePath;
    }
    
    // Restore the version in the repo and update the original file
    const restoreResult = await versionControl.restoreVersion(
      appId,
      commitId,
      originalFilePath // Pass the original path to update
    );
    
    if (!restoreResult.success) {
      return restoreResult;
    }
    
    // Update the mini app window content by reloading the file
    const updateResult = await miniAppManager.updateMiniApp(
      appId,
      restoreResult.content, // Use restored content
      originalFilePath
    );
    
    return updateResult;
  } catch (error) {
    console.error('Error restoring version:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Register mini app-related IPC handlers
 */
// Export these functions for direct use in main.js
export { handleOpenIterationWindow };

export function registerHandlers() {
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
// New handlers for iteration
ipcMain.handle('open-iteration-window', handleOpenIterationWindow);
ipcMain.handle('iterate-on-mini-app', handleIterateOnMiniApp);
ipcMain.handle('get-version-history', handleGetVersionHistory);
ipcMain.handle('restore-version', handleRestoreVersion);

// Handler for getting iteration data
ipcMain.handle('get-app-iteration-data', async (event) => {
  // Find the window that the request is coming from
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || !win.appIterationData) {
    const activeApp = getActiveMiniApp();
    if (!activeApp) {
      throw new Error("No active mini app found to iterate on.");
    }
    
    try {
      // Ensure repo is initialized
      const repoResult = await versionControl.initRepo(activeApp.id, activeApp.filePath);
      if (!repoResult.success) {
        throw new Error(`Failed to initialize version control: ${repoResult.error}`);
      }
      
      // Read the current HTML content (from the repo version for consistency)
      const readResult = await fileOperations.readFile(repoResult.filePath);
      if (!readResult.success) {
        throw new Error(`Failed to read app content: ${readResult.error}`);
      }
      
      return {
        appId: activeApp.id,
        appName: activeApp.name,
        filePath: activeApp.filePath,
        html: readResult.content
      };
    } catch (error) {
      console.error('Error preparing iteration data:', error);
      throw error;
    }
  }
  
  // Return the stored data for this window
  return win.appIterationData;
});

  
  console.log('Mini app handlers registered');
}

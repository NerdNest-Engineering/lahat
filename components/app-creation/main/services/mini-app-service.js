/**
 * Mini App Service
 * Business logic for mini app operations
 */
import * as fileOperations from '../../../../modules/utils/fileOperations.js';
import * as miniAppManager from '../../../../modules/miniAppManager.js';
import * as titleDescriptionGenerator from '../../../../modules/utils/titleDescriptionGenerator.js';
import store from '../../../../store.js';

/**
 * Generate a mini app
 * @param {Object} claudeClient - Claude API client
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for generating the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
export async function generateMiniApp(claudeClient, event, { prompt, appName }) {
  try {
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
 * List mini apps
 * @param {Object} claudeClient - Claude API client
 * @returns {Promise<Object>} - Result object with apps list
 */
export async function listMiniApps(claudeClient) {
  try {
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
 * Open a mini app
 * @param {Object} appId - App ID
 * @param {string} filePath - File path
 * @param {string} name - App name
 * @returns {Promise<Object>} - Result object with success flag
 */
export async function openMiniApp(appId, filePath, name) {
  try {
    const result = await miniAppManager.openMiniApp(appId, filePath, name);
    return result;
  } catch (error) {
    console.error('Error in openMiniApp:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update a mini app
 * @param {Object} claudeClient - Claude API client
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for updating the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
export async function updateMiniApp(claudeClient, event, { appId, prompt }) {
  try {
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
 * Delete a mini app
 * @param {Object} claudeClient - Claude API client
 * @param {string} appId - App ID
 * @returns {Promise<Object>} - Result object with success flag
 */
export async function deleteMiniApp(claudeClient, appId) {
  try {
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
 * Generate title and description for a mini app
 * @param {Object} claudeClient - Claude API client
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for generating title and description
 * @returns {Promise<Object>} - Result object with title and description
 */
export async function generateTitleAndDescription(claudeClient, event, { input }) {
  try {
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

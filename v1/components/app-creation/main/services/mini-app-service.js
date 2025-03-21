/**
 * Widget Service
 * Business logic for widget operations
 */
import * as fileOperations from '../../../../modules/utils/fileOperations.js';
import * as widgetManager from '../../../../modules/miniAppManager.js';
import * as titleDescriptionGenerator from '../../../../modules/utils/titleDescriptionGenerator.js';
import store from '../../../../store.js';
import { DEFAULT_WIDGET_PROMPT } from '../../widget-system-prompts.js';
import path from 'path';
import securityManifest from '../../../../modules/utils/widgetSecurityManifest.js';
import { generateScriptHash } from '../../../../modules/utils/cspUtils.js';

/**
 * Initialize the security manifest
 * @returns {Promise<void>}
 */
async function initializeSecurityManifest() {
  if (!securityManifest.manifest) {
    await securityManifest.initialize();
  }
}

/**
 * Generate a widget
 * @param {Object} claudeClient - Claude API client
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for generating the widget
 * @param {string} params.prompt - The prompt for generating the widget
 * @param {string} params.appName - The name of the app
 * @param {string} [params.systemPrompt] - Optional custom system prompt
 * @param {boolean} [params.minimal=false] - Whether to generate a minimal app without dependencies
 * @returns {Promise<Object>} - Result object with success flag
 */
export async function generateWidget(claudeClient, event, { prompt, appName, systemPrompt = DEFAULT_WIDGET_PROMPT, minimal = false }) {
  try {
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Initialize security manifest
    await initializeSecurityManifest();
    
    // Start streaming response
    event.sender.send('generation-status', {
      status: 'generating',
      message: 'Generating your widget component...'
    });
    
    const response = await claudeClient.generateApp(prompt, null, systemPrompt);
    let widgetCode = '';
    
    // Stream the response
    for await (const streamEvent of response) {
      if (streamEvent.type === 'content_block_delta' && streamEvent.delta.type === 'text_delta') {
        widgetCode += streamEvent.delta.text || '';
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
    
    // Clean up the widget code (remove markdown code blocks if present)
    widgetCode = cleanWidgetCode(widgetCode);
    
    // Update imports to use lahat dependencies instead of local files
    widgetCode = updateWidgetImports(widgetCode);
    
    // Save the generated app metadata
    const savedApp = await claudeClient.saveGeneratedApp(
      appName || 'Widget',
      widgetCode,
      prompt,
      null, // conversationId
      minimal // Pass the minimal flag
    );
    
    // If in minimal mode, the saveGeneratedApp method already created all necessary files
    // and we can skip the additional file operations
    if (savedApp.isMinimal) {
      // Generate hash and add to security manifest
      const widgetId = savedApp.metadata.conversationId;
      await securityManifest.addOrUpdateWidget(widgetId, savedApp.componentFilePath);
      
      // Update recent apps list
      const recentApps = store.get('recentApps') || [];
      recentApps.unshift({
        id: savedApp.metadata.conversationId,
        name: savedApp.metadata.name,
        created: savedApp.metadata.created,
        filePath: savedApp.componentFilePath,
        type: 'widget',
        isMinimal: true
      });
      
      // Keep only the 10 most recent apps
      if (recentApps.length > 10) {
        recentApps.length = 10;
      }
      
      store.set('recentApps', recentApps);
      
      return { 
        success: true,
        appId: savedApp.metadata.conversationId,
        name: savedApp.metadata.name,
        filePath: savedApp.componentFilePath,
        isMinimal: true
      };
    }
    
    // For non-minimal mode, continue with the additional file operations
    
    // Create app directory if it doesn't exist
    const appDir = path.dirname(savedApp.filePath);
    await fileOperations.ensureDirectory(appDir);
    
    // Generate component name based on app name
    const componentFileName = `${savedApp.metadata.name.toLowerCase().replace(/\s+/g, '_')}-component.js`;
    
    // Save the widget code directly to the app directory (not in components subdirectory)
    const widgetFilePath = path.join(appDir, componentFileName);
    await fileOperations.writeFile(widgetFilePath, widgetCode);
    
    // Update metadata to reflect the simplified structure
    const metadata = savedApp.metadata;
    if (!metadata.versions) {
      metadata.versions = [];
    }
    
    // Update or add the latest version
    const latestVersion = {
      timestamp: Date.now(),
      componentFilePath: componentFileName,
      isWebComponent: true
    };
    
    if (metadata.versions.length > 0) {
      metadata.versions[0] = { ...metadata.versions[0], ...latestVersion };
    } else {
      metadata.versions.push(latestVersion);
    }
    
    // Set isWebComponent flag
    metadata.isWebComponent = true;
    
    // Save updated metadata
    const metadataPath = path.join(appDir, 'metadata.json');
    await fileOperations.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    // Generate hash and add to security manifest
    const widgetId = savedApp.metadata.conversationId;
    await securityManifest.addOrUpdateWidget(widgetId, widgetFilePath);
    
    // Update recent apps list
    const recentApps = store.get('recentApps') || [];
    recentApps.unshift({
      id: savedApp.metadata.conversationId,
      name: savedApp.metadata.name,
      created: savedApp.metadata.created,
      filePath: widgetFilePath,
      type: 'widget'
    });
    
    // Keep only the 10 most recent apps
    if (recentApps.length > 10) {
      recentApps.length = 10;
    }
    
    store.set('recentApps', recentApps);
    
    return { 
      success: true,
      appId: savedApp.metadata.conversationId,
      name: savedApp.metadata.name,
      filePath: widgetFilePath
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
 * List widgets
 * @param {Object} claudeClient - Claude API client
 * @returns {Promise<Object>} - Result object with apps list
 */
export async function listWidgets(claudeClient) {
  try {
    if (!claudeClient) {
      return { apps: [] };
    }
    
    const apps = await claudeClient.listGeneratedApps();
    return { apps };
  } catch (error) {
    console.error('Error listing widgets:', error);
    return {
      success: false,
      error: error.message,
      apps: []
    };
  }
}

/**
 * Clean widget code by removing markdown code blocks if present
 * @param {string} code - The widget code
 * @returns {string} - Cleaned widget code
 */
function cleanWidgetCode(code) {
  // Check if the code is wrapped in markdown code blocks
  const markdownMatch = code.match(/```(?:javascript|js)([\s\S]+?)```/);
  if (markdownMatch) {
    return markdownMatch[1].trim();
  }
  
  return code.trim();
}

/**
 * Update widget imports to use lahat dependencies instead of local files
 * @param {string} code - The widget code
 * @returns {string} - Updated widget code with correct imports
 */
function updateWidgetImports(code) {
  // Replace BaseComponent import
  code = code.replace(
    /import\s*{\s*BaseComponent\s*}\s*from\s*['"]\.\/base-component\.js['"]/g,
    "import { BaseComponent } from '../../components/core/base-component.js'"
  );
  
  // Replace WidgetComponent import
  code = code.replace(
    /import\s*{\s*WidgetComponent\s*}\s*from\s*['"]\.\.\/\.\.\/components\/core\/widget-component\.js['"]/g,
    "import { WidgetComponent } from '../../components/core/widget-component.js'"
  );
  
  // Replace any other local imports with lahat dependencies
  code = code.replace(
    /import\s*{\s*([^}]+)\s*}\s*from\s*['"]\.\.\/(\.\.\/)?components\/([^'"]+)['"]/g,
    "import { $1 } from '../../components/$3'"
  );
  
  return code;
}

/**
 * Open a widget
 * @param {Object} appId - App ID
 * @param {string} filePath - File path
 * @param {string} name - App name
 * @returns {Promise<Object>} - Result object with success flag
 */
export async function openWidget(appId, filePath, name) {
  try {
    // Initialize security manifest
    await initializeSecurityManifest();
    
    // Verify widget integrity
    const widgetInfo = securityManifest.getWidgetInfo(appId);
    if (!widgetInfo) {
      // Add widget to security manifest if not already there
      const content = await fileOperations.readFile(filePath);
      const hash = generateScriptHash(content);
      await securityManifest.addOrUpdateWidget(appId, filePath);
    }
    
    // Open the widget in a Lahat cell
    const result = {
      success: true,
      appId,
      name,
      filePath,
      type: 'widget'
    };
    
    return result;
  } catch (error) {
    console.error('Error in openWidget:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update a widget
 * @param {Object} claudeClient - Claude API client
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for updating the widget
 * @param {string} params.appId - The ID of the app to update
 * @param {string} params.prompt - The prompt for updating the widget
 * @param {string} [params.systemPrompt] - Optional custom system prompt
 * @param {boolean} [params.minimal=false] - Whether to generate a minimal app without dependencies
 * @returns {Promise<Object>} - Result object with success flag
 */
export async function updateWidget(claudeClient, event, { appId, prompt, systemPrompt = DEFAULT_WIDGET_PROMPT, minimal = false }) {
  try {
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Initialize security manifest
    await initializeSecurityManifest();
    
    // Start streaming response
    event.sender.send('generation-status', {
      status: 'updating',
      message: 'Updating your widget component...'
    });
    
    const response = await claudeClient.generateApp(prompt, appId, systemPrompt);
    let widgetCode = '';
    
    // Stream the response
    for await (const streamEvent of response) {
      if (streamEvent.type === 'content_block_delta' && streamEvent.delta.type === 'text_delta') {
        widgetCode += streamEvent.delta.text || '';
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
    
    // Clean up the widget code (remove markdown code blocks if present)
    widgetCode = cleanWidgetCode(widgetCode);
    
    // Update imports to use lahat dependencies instead of local files
    widgetCode = updateWidgetImports(widgetCode);
    
    // Get widget info from security manifest
    const widgetInfo = securityManifest.getWidgetInfo(appId);
    let widgetFilePath;
    let appDir;
    
    // Check if the app is already in minimal mode
    const recentApps = store.get('recentApps') || [];
    const appInfo = recentApps.find(app => app.id === appId);
    
    if (appInfo && appInfo.isMinimal) {
      // For minimal apps, just update the file directly
      widgetFilePath = appInfo.filePath;
      appDir = path.dirname(widgetFilePath);
      
      // Save the widget code to the file
      await fileOperations.writeFile(widgetFilePath, widgetCode);
      
      // Update the security manifest
      await securityManifest.addOrUpdateWidget(appId, widgetFilePath);
      
      return { 
        success: true,
        appId,
        filePath: widgetFilePath,
        isMinimal: true
      };
    } else if (widgetInfo) {
      // Use existing file path
      widgetFilePath = widgetInfo.filePath;
      appDir = path.dirname(widgetFilePath);
    } else {
      // Get app info from recent apps
      const recentApps = store.get('recentApps') || [];
      const appInfo = recentApps.find(app => app.id === appId);
      
      if (appInfo && appInfo.filePath) {
        widgetFilePath = appInfo.filePath;
        appDir = path.dirname(widgetFilePath);
      } else {
        // Update the app in Claude's system
        const updatedApp = await claudeClient.updateGeneratedApp(
          appId,
          prompt,
          widgetCode,
          minimal // Pass the minimal flag
        );
        
        // Create a new file path
        appDir = path.dirname(updatedApp.filePath);
        await fileOperations.ensureDirectory(appDir);
        
        // Get app metadata to determine component filename
        const metadataPath = path.join(appDir, 'metadata.json');
        let metadata;
        
        try {
          const metadataContent = await fileOperations.readFile(metadataPath);
          metadata = JSON.parse(metadataContent);
        } catch (error) {
          // If metadata doesn't exist, create a default one
          metadata = {
            name: 'Widget',
            conversationId: appId,
            created: new Date().toISOString(),
            prompt: prompt,
            isWebComponent: true,
            versions: []
          };
        }
        
        const componentFileName = `${metadata.name.toLowerCase().replace(/\s+/g, '_')}-component.js`;
        widgetFilePath = path.join(appDir, componentFileName);
        
        // Update metadata
        const latestVersion = {
          timestamp: Date.now(),
          componentFilePath: componentFileName,
          isWebComponent: true
        };
        
        if (metadata.versions && metadata.versions.length > 0) {
          metadata.versions[0] = { ...metadata.versions[0], ...latestVersion };
        } else {
          metadata.versions = [latestVersion];
        }
        
        // Save updated metadata
        await fileOperations.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      }
    }
    
    // Save the widget code to the file
    await fileOperations.writeFile(widgetFilePath, widgetCode);
    
    // Update the security manifest
    await securityManifest.addOrUpdateWidget(appId, widgetFilePath);
    
    return { 
      success: true,
      appId,
      filePath: widgetFilePath
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
 * Delete a widget
 * @param {Object} claudeClient - Claude API client
 * @param {string} appId - App ID
 * @returns {Promise<Object>} - Result object with success flag
 */
export async function deleteWidget(claudeClient, appId) {
  try {
    if (!claudeClient) {
      return {
        success: false,
        error: 'Claude API key not set. Please set your API key in settings.'
      };
    }
    
    // Initialize security manifest
    await initializeSecurityManifest();
    
    // Get widget info from security manifest
    const widgetInfo = securityManifest.getWidgetInfo(appId);
    
    if (widgetInfo) {
      // Delete the widget file
      try {
        await fileOperations.deleteFile(widgetInfo.filePath);
      } catch (error) {
        console.warn(`Could not delete widget file: ${error.message}`);
      }
      
      // Remove from security manifest
      await securityManifest.removeWidget(appId);
    }
    
    // Delete the app from Claude's system
    await claudeClient.deleteGeneratedApp(appId);
    
    // Update recent apps list
    const recentApps = store.get('recentApps') || [];
    const updatedRecentApps = recentApps.filter(app => app.id !== appId);
    store.set('recentApps', updatedRecentApps);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting widget:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate title and description for a widget
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

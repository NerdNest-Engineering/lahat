# Lahat: App Creation Flow

## Overview

The app creation process in Lahat follows a multi-step wizard interface that guides users from an initial idea to a functioning mini application. This document outlines this process and the technical implementation behind it.

## User Journey

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  1. API Setup   │ ──▶ │  2. App Details │ ──▶ │ 3. Generation   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  6. App Gallery │ ◀── │   5. Save App   │ ◀── │   4. Preview    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Step 1: API Setup

**User Actions:**
- Enter an API key
- Submit the key for validation

**Technical Implementation:**
```javascript
// In preload.cjs
contextBridge.exposeInMainWorld('electronAPI', {
  setApiKey: (apiKey) => ipcRenderer.invoke('set-api-key', apiKey),
  checkApiKey: () => ipcRenderer.invoke('check-api-key')
});

// In apiHandlers.js
async function handleSetApiKey(event, apiKey) {
  try {
    // Store the API key securely
    const securelyStored = await keyManager.securelyStoreApiKey(apiKey);
    
    // Initialize Claude client with the new API key
    claudeClient = new ClaudeClient(apiKey);
    
    return createSuccessResponse({ securelyStored });
  } catch (error) {
    logger.error('Failed to set API key', error, 'handleSetApiKey');
    return createErrorResponse(error, 'set-api-key');
  }
}
```

## Step 2: App Details

**User Actions:**
- Enter a description of the desired application
- Optionally specify application name and details
- Request AI-generated title and description (optional)

**Technical Implementation:**
```javascript
// Title/description generation
async function handleGenerateTitleAndDescription(event, { input }) {
  try {
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
    // Error handling...
  }
}
```

## Step 3: App Generation

**User Actions:**
- Review the app details
- Initiate the app generation process
- View real-time generation progress

**Technical Implementation:**
```javascript
// Mini app generation
async function handleGenerateMiniApp(event, { prompt, appName }) {
  try {
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
    
    // Save and open the app...
  } catch (error) {
    // Error handling...
  }
}
```

## Step 4: Preview

**User Actions:**
- View the generated application
- Test functionality
- Optionally return to modify the prompt

**Technical Implementation:**
```javascript
// Creating a mini app window
export async function createMiniAppWindow(appName, htmlContent, filePath, conversationId) {
  try {
    // Create a temporary file for the HTML content if no filePath is provided
    let tempFilePath = filePath;
    if (!tempFilePath) {
      const tempResult = await fileOperations.createTempFile(htmlContent);
      if (!tempResult.success) {
        return { success: false, error: tempResult.error };
      }
      tempFilePath = tempResult.filePath;
    }
    
    // Create the window using the window manager
    const win = windowManager.createMiniAppWindow(appName, htmlContent, filePath, conversationId);
    
    // Add event listeners...
    win.loadFile(tempFilePath);
    
    // Store the window reference
    if (conversationId) {
      miniAppWindows.set(conversationId, {
        window: win,
        filePath: tempFilePath,
        name: appName
      });
    }
    
    return { success: true, filePath: tempFilePath, windowId: win.id };
  } catch (error) {
    // Error handling...
  }
}
```

## Step 5: Save App

**User Actions:**
- Save the application with a name
- Add any additional metadata
- Receive confirmation of successful save

**Technical Implementation:**
```javascript
// Save the generated app
async function saveGeneratedApp(appName, htmlContent, prompt, conversationId = null) {
  // Create a safe filename from the app name
  const safeAppName = appName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const timestamp = Date.now();
  const filename = `${safeAppName}_${timestamp}.html`;
  const filePath = path.join(this.appStoragePath, filename);
  
  // Save the HTML content
  try {
    await fs.writeFile(filePath, htmlContent);
    
    // Save metadata
    const metadataPath = path.join(this.appStoragePath, `${filename}.meta.json`);
    const metadata = {
      name: appName,
      created: new Date().toISOString(),
      prompt,
      conversationId: conversationId || `conv_${timestamp}`,
      versions: [
        {
          timestamp,
          filePath
        }
      ]
    };
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    return {
      filename,
      filePath,
      metadata
    };
  } catch (error) {
    throw new Error(`Failed to save generated app: ${error.message}`);
  }
}
```

## Step 6: App Gallery

**User Actions:**
- View all created applications
- Open, edit, or delete existing applications
- Create new applications

**Technical Implementation:**
```javascript
// List mini apps
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
    return { success: false, error: error.message, apps: [] };
  }
}

// Open a mini app
async function handleOpenMiniApp(event, { appId, filePath, name }) {
  try {
    const result = await miniAppManager.openMiniApp(appId, filePath, name);
    return result;
  } catch (error) {
    console.error('Error in handleOpenMiniApp:', error);
    return { success: false, error: error.message };
  }
}
```

## Window Sheet Architecture

The app creation flow uses a "window sheets" architecture:

1. Each step in the flow has its own HTML file
2. Windows are created or repurposed as needed
3. State is passed between windows using IPC

```javascript
// Window type definitions
export const WindowType = {
  MAIN: 'main',
  API_SETUP: 'api-setup',
  APP_CREATION: 'app-creation',
  MINI_APP: 'mini-app'
};

// Create a window of a specific type
export function showWindow(type, params = {}) {
  const window = createWindow(type, params);
  window.show();
  return window;
}

// Window creation with proper configuration for each type
export function createWindow(type, params = {}) {
  let window;
  let options = {};
  
  switch (type) {
    case WindowType.MAIN:
      options = getMainWindowOptions();
      break;
    case WindowType.API_SETUP:
      options = getApiSetupWindowOptions();
      break;
    case WindowType.APP_CREATION:
      options = getAppCreationWindowOptions();
      break;
    // Other window types...
  }
  
  // Create the window
  window = new BrowserWindow(options);
  
  // Store params for retrieval by the window
  windowParams.set(window.id, params);
  
  // Load the appropriate HTML file
  window.loadFile(`${type}.html`);
  
  return window;
}
```

## User Experience Enhancements

1. **Real-time feedback**:
   - Streaming generation results
   - Progress indicators
   - Animated transitions

2. **Error handling**:
   - User-friendly error messages
   - Recovery options
   - Detailed error information when needed

3. **Accessibility**:
   - Keyboard navigation
   - Screen reader support
   - High contrast options
   
4. **Responsive design**:
   - Adapts to different window sizes
   - Consistent styling across the application
   - Smooth animations and transitions
# Lahat Collaboration Framework - Implementation Plan

This document outlines the technical implementation plan for adding collaboration capabilities to Lahat mini apps.

## Overview

To implement the collaboration framework as described in the documentation, we need to:

1. Add required dependencies to the Lahat project
2. Create the LahatCollab library
3. Modify the app generation process to inject collaboration code
4. Update the UI to include collaboration options
5. Update the system prompt to include collaboration documentation

## Implementation Steps

### 1. Add Dependencies

Update `package.json` to include the required dependencies:

```json
{
  "dependencies": {
    // Existing dependencies...
    "yjs": "^13.5.50",
    "y-webrtc": "^10.2.5",
    "y-indexeddb": "^9.0.9"
  }
}
```

Run `npm install` to install the new dependencies.

### 2. Create LahatCollab Library

Create a new directory for the collaboration framework:

```
modules/collaboration/
```

Create the following files:

#### `modules/collaboration/index.js`

Main entry point for the collaboration module.

#### `modules/collaboration/lahat-collab.js`

Core implementation of the LahatCollab library.

#### `modules/collaboration/bundle.js`

Utility to bundle the collaboration libraries for injection into mini apps.

### 3. Modify App Generation Process

#### Update `claudeClient.js`

Modify the `saveGeneratedApp` and `updateGeneratedApp` methods to inject collaboration code when enabled.

#### Create `modules/collaboration/injector.js`

Create a utility for injecting the collaboration code into mini app HTML.

### 4. Update UI

#### Create Collaboration Toggle in App Creation UI

Modify `app-creation.html` to include a collaboration toggle.

#### Update Renderer

Modify `renderers/app-creation.js` to handle the collaboration toggle.

### 5. Update System Prompt

Modify the system prompt in `claudeClient.js` to include documentation and examples for using the collaboration features.

## Detailed Implementation

### LahatCollab Library (`modules/collaboration/lahat-collab.js`)

```javascript
/**
 * LahatCollab - Collaboration framework for Lahat mini apps
 */
(function() {
  // Core collaboration functionality
  class LahatCollabCore {
    constructor(roomId, options = {}) {
      this.roomId = roomId;
      this.doc = new Y.Doc();
      this.persistence = new Y.IndexeddbPersistence(roomId, this.doc);
      this.provider = new Y.WebrtcProvider(roomId, this.doc, options.webrtc || {});
      this.awareness = this.provider.awareness;
      this.sharedData = {};
      
      // Setup connection monitoring
      this.setupConnectionMonitoring();
    }
    
    setupConnectionMonitoring() {
      // Implementation details...
    }
    
    createShared(name, type = 'object') {
      let sharedType;
      
      switch(type) {
        case 'array':
          sharedType = this.doc.getArray(name);
          break;
        case 'text':
          sharedType = this.doc.getText(name);
          break;
        case 'object':
        default:
          sharedType = this.doc.getMap(name);
      }
      
      this.sharedData[name] = sharedType;
      return sharedType;
    }
    
    onUpdate(name, callback) {
      if (!this.sharedData[name]) {
        console.error(`Shared data "${name}" not found`);
        return;
      }
      
      this.sharedData[name].observe(callback);
    }
    
    getClientId() {
      return this.doc.clientID;
    }
  }
  
  // Expose the API globally
  window.LahatCollab = {
    init: (roomId, options) => new LahatCollabCore(roomId, options),
    
    // Connection API
    connection: {
      isOnline: () => {
        // Implementation details...
      },
      onStatusChange: (callback) => {
        // Implementation details...
      },
      getStats: () => {
        // Implementation details...
      }
    },
    
    // Sync API
    sync: {
      forceSync: async () => {
        // Implementation details...
      },
      pauseSync: () => {
        // Implementation details...
      },
      resumeSync: () => {
        // Implementation details...
      }
    }
  };
})();
```

### Collaboration Bundler (`modules/collaboration/bundle.js`)

```javascript
import * as Y from 'yjs';
import * as YWebrtc from 'y-webrtc';
import * as YIndexeddb from 'y-indexeddb';
import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the LahatCollab implementation
const lahatCollabPath = path.join(__dirname, 'lahat-collab.js');
const lahatCollabImplementation = await fs.readFile(lahatCollabPath, 'utf-8');

/**
 * Create a bundle of the collaboration libraries
 * @returns {Promise<string>} The bundled code
 */
export async function createBundle() {
  // Create a bundle that exposes libraries to the window object
  const bundleContent = `
    // Bundled collaboration libraries
    (function() {
      // Y.js core
      ${Y.toString()}
      
      // Y-WebRTC provider
      ${YWebrtc.toString()}
      
      // Y-IndexedDB provider
      ${YIndexeddb.toString()}
      
      // Expose to window
      window.Y = Y;
      window.YWebrtc = YWebrtc;
      window.YIndexeddb = YIndexeddb;
    })();
    
    // LahatCollab implementation
    ${lahatCollabImplementation}
  `;
  
  return bundleContent;
}
```

### Collaboration Injector (`modules/collaboration/injector.js`)

```javascript
import { createBundle } from './bundle.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Inject collaboration code into HTML content
 * @param {string} htmlContent - The original HTML content
 * @param {boolean} enableCollaboration - Whether to enable collaboration
 * @param {string} appId - The app ID
 * @returns {Promise<string>} - The modified HTML content
 */
export async function injectCollaborationCode(htmlContent, enableCollaboration, appId) {
  if (!enableCollaboration) return htmlContent;
  
  // Generate a unique room ID based on the app ID
  const roomId = `lahat-${appId}-${uuidv4().substring(0, 8)}`;
  
  // Get the bundled library
  const bundleContent = await createBundle();
  
  // Inject the bundled library directly into the HTML
  const collabLibs = `
    <script>
      ${bundleContent}
    </script>
  `;
  
  // Inject collaboration initialization
  const collabInit = `
    <script>
      // Initialize LahatCollab with room ID
      window.LahatCollabInstance = LahatCollab.init('${roomId}');
      
      // Add connection status UI
      const statusEl = document.createElement('div');
      statusEl.className = 'lahat-collab-status';
      statusEl.style.position = 'fixed';
      statusEl.style.bottom = '10px';
      statusEl.style.right = '10px';
      statusEl.style.padding = '5px 10px';
      statusEl.style.borderRadius = '4px';
      statusEl.style.fontSize = '12px';
      statusEl.style.zIndex = '9999';
      statusEl.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      statusEl.style.color = 'white';
      statusEl.textContent = 'Connecting...';
      
      // Add room ID display
      const roomIdEl = document.createElement('div');
      roomIdEl.className = 'lahat-collab-room-id';
      roomIdEl.style.position = 'fixed';
      roomIdEl.style.bottom = '40px';
      roomIdEl.style.right = '10px';
      roomIdEl.style.padding = '5px 10px';
      roomIdEl.style.borderRadius = '4px';
      roomIdEl.style.fontSize = '12px';
      roomIdEl.style.zIndex = '9999';
      roomIdEl.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      roomIdEl.style.color = 'white';
      roomIdEl.textContent = 'Room ID: ${roomId}';
      
      document.body.appendChild(statusEl);
      document.body.appendChild(roomIdEl);
      
      // Update status when connection changes
      LahatCollabInstance.connection.onStatusChange((isOnline) => {
        statusEl.style.backgroundColor = isOnline ? 'rgba(0, 128, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
        statusEl.textContent = isOnline ? 'Connected' : 'Offline';
      });
    </script>
  `;
  
  // Insert before closing body tag
  return htmlContent.replace('</body>', `${collabLibs}${collabInit}</body>`);
}
```

### Update ClaudeClient.js

Modify the `saveGeneratedApp` method in `claudeClient.js`:

```javascript
import { injectCollaborationCode } from './modules/collaboration/injector.js';

// In the saveGeneratedApp method
async saveGeneratedApp(appName, htmlContent, prompt, conversationId = null, options = {}) {
  // Existing code...
  
  // Inject collaboration code if enabled
  if (options.enableCollaboration) {
    htmlContent = await injectCollaborationCode(htmlContent, true, metadata.conversationId);
    
    // Update metadata to indicate collaboration is enabled
    metadata.collaboration = {
      enabled: true,
      roomId: `lahat-${metadata.conversationId}`
    };
  }
  
  // Continue with existing code...
}
```

### Update System Prompt

Add collaboration documentation to the system prompt in `claudeClient.js`:

```javascript
this.systemPrompt = `You are an expert web developer specializing in creating self-contained mini applications using HTML, CSS, and JavaScript. When given a description of an application, you will generate a complete, functional implementation that can run in an Electron window.

IMPORTANT GUIDELINES:
1. Your response must be a SINGLE self-contained HTML file that includes all CSS and JavaScript.
2. All CSS must be in a <style> tag in the <head> section.
3. All JavaScript must be in a <script> tag at the end of the <body> section.
4. The application must be fully functional without any external dependencies or network requests.
5. Use modern JavaScript (ES6+) and CSS features.
6. Ensure the UI is clean, intuitive, and responsive.
7. Include appropriate error handling and user feedback.
8. Add comments to explain complex logic or functionality.
9. CRITICAL: You MUST include a transparent draggable region at the top of the window for the Electron app. Add this to your HTML body as the first element: <div style="height: 38px; width: 100%; position: fixed; top: 0; left: 0; -webkit-app-region: drag; z-index: 1000;"></div>
10. Make sure your content has enough top padding (at least 38px) to account for the draggable region.

COLLABORATION FEATURES:
If the user enables collaboration for this mini app, a LahatCollab library will be automatically injected. You can use this library to implement collaborative features:

1. Basic shared data:
\`\`\`javascript
// Initialize collaboration
const collab = LahatCollab.init('my-app');

// Create a shared object that syncs between users
const sharedData = collab.createShared('appData');

// Any changes to this object will sync to all connected users
sharedData.title = "New Title";
sharedData.items = ["item1", "item2"];

// Listen for changes from other users
collab.onUpdate('appData', () => {
  // Update UI with new data
  updateUI(sharedData);
});
\`\`\`

2. Presence awareness:
\`\`\`javascript
// Show user activity
collab.presence.setLocalState({
  cursor: {x: 100, y: 200},
  editing: "card-123"
});

// React to other users' presence
collab.presence.onUpdate((states) => {
  // Show indicators for each user
  showUserIndicators(states);
});
\`\`\`

RESPONSE FORMAT:
Your response must be a valid HTML document starting with <!DOCTYPE html> and containing all necessary elements. Do not include any explanations or markdown formatting outside the HTML code.`;
```

### Update App Creation UI

Modify `app-creation.html` to include a collaboration toggle:

```html
<!-- Add this to the form -->
<div class="form-group">
  <label for="enable-collaboration">
    <input type="checkbox" id="enable-collaboration" name="enable-collaboration">
    Enable Collaboration
  </label>
  <p class="help-text">Allow multiple users to collaborate on this mini app in real-time.</p>
</div>
```

Update `renderers/app-creation.js` to handle the collaboration toggle:

```javascript
// In the form submission handler
const enableCollaboration = document.getElementById('enable-collaboration').checked;

// When calling the generate-mini-app IPC handler
ipcRenderer.invoke('generate-mini-app', {
  prompt,
  appName,
  enableCollaboration
});
```

Update `modules/ipc/miniAppHandlers.js` to pass the collaboration option:

```javascript
// In the handleGenerateMiniApp function
async function handleGenerateMiniApp(event, { prompt, appName, enableCollaboration }) {
  // Existing code...
  
  // Save the generated app with collaboration option
  const savedApp = await claudeClient.saveGeneratedApp(
    appName || 'Mini App',
    htmlContent,
    prompt,
    null, // conversationId
    { enableCollaboration }
  );
  
  // Continue with existing code...
}
```

## Testing Plan

1. Install the required dependencies
2. Implement the collaboration framework
3. Test basic collaboration features:
   - Create a mini app with collaboration enabled
   - Open the app in multiple windows
   - Verify that changes sync between windows
   - Test offline functionality by disconnecting one window
   - Verify that changes sync when reconnected

## Future Enhancements

1. Add user authentication for secure collaboration
2. Implement custom signaling servers for improved reliability
3. Add more advanced collaboration UI components
4. Create collaboration templates for common app types

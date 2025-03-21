# Lahat: Code Architecture

## Module Structure

Lahat's codebase follows a modular organization pattern with clear separation of concerns:

```
modules/
├── ipc/                    # Inter-process communication handlers
│   ├── apiHandlers.js      # API-related IPC handlers
│   ├── miniAppHandlers.js  # Mini app management handlers
│   ├── windowHandlers.js   # Window management handlers
│   ├── ipcHandler.js       # IPC handler registration
│   └── ipcTypes.js         # IPC message type definitions
├── security/               # Security-related functionality
│   └── keyManager.js       # Secure API key storage
├── utils/                  # Utility modules
│   ├── errorHandler.js     # Error handling and reporting
│   ├── eventManager.js     # Event listener tracking for memory management
│   ├── fileOperations.js   # File system operations with caching
│   ├── logger.js           # Structured logging system
│   └── ...                 # Other utility modules
├── windowManager/          # Window management system
│   ├── windowManager.js    # Window creation and management
│   ├── windowPool.js       # Window recycling and reuse
│   └── ...                 # Other window management modules
└── miniAppManager.js       # Mini app creation and management
```

## Key Architectural Components

### Main Process (main.js)

The main entry point for the Electron application, responsible for:
- Application lifecycle management
- Module initialization and coordination
- IPC handler registration
- Window creation and management

```javascript
// Simplified main.js structure
import { app, BrowserWindow } from 'electron';
import * as windowManager from './modules/windowManager/index.js';
import * as ipc from './modules/ipc/index.js';
import { ErrorHandler } from './modules/utils/errorHandler.js';

// Initialize the application
function initializeApp() {
  try {
    // Initialize window manager
    windowManager.initializeWindowManager();
    
    // Initialize IPC handlers
    ipc.initializeIpcHandlers();
    
    // Initialize Claude client
    ipc.apiHandlers.initializeClaudeClient();
    
    // Create main window when app is ready
    app.whenReady().then(() => {
      windowManager.createMainWindow();
    });
    
    // App lifecycle event handlers
    // ...
  } catch (error) {
    ErrorHandler.logError('initializeApp', error, ErrorHandler.ERROR_LEVELS.FATAL);
    app.quit();
  }
}

// Initialize the application
initializeApp();
```

### Mini App Manager (modules/miniAppManager.js)

Responsible for mini app window creation and management:
- Creating mini app windows
- Tracking window references
- Opening, updating, and deleting mini apps
- Managing mini app lifecycle

```javascript
// Key functions in miniAppManager.js
export async function createMiniAppWindow(appName, htmlContent, filePath, conversationId) {
  // Implementation...
}

export async function openMiniApp(appId, filePath, name) {
  // Implementation...
}

export function getMiniApp(appId) {
  // Implementation...
}

export function closeMiniApp(appId) {
  // Implementation...
}
```

### IPC Handlers (modules/ipc/*)

Handle communication between main and renderer processes:

```javascript
// modules/ipc/apiHandlers.js - API-related IPC handlers
export function registerHandlers(ipcHandler) {
  ipcHandler.registerMultiple({
    [IpcChannels.SET_API_KEY]: handleSetApiKey,
    [IpcChannels.CHECK_API_KEY]: handleCheckApiKey,
    [IpcChannels.OPEN_APP_DIRECTORY]: handleOpenAppDirectory
  });
}

// modules/ipc/miniAppHandlers.js - Mini app-related IPC handlers
export function registerHandlers(ipcHandler) {
  ipcHandler.registerMultiple({
    [IpcChannels.GENERATE_MINI_APP]: handleGenerateMiniApp,
    [IpcChannels.LIST_MINI_APPS]: handleListMiniApps,
    [IpcChannels.OPEN_MINI_APP]: handleOpenMiniApp,
    // Other mini app handlers...
  });
}
```

### Window Manager (modules/windowManager/windowManager.js)

Manages window creation and lifecycle:
- Creating windows with appropriate configuration
- Managing window state and parameters
- Handling window events
- Window recycling via window pool

```javascript
// Key functions in windowManager.js
export function createWindow(type, options = {}) {
  // Implementation...
}

export function createMainWindow() {
  // Implementation...
}

export function createMiniAppWindow(name, htmlContent, filePath, conversationId) {
  // Implementation...
}

export function getWindowParams(windowId) {
  // Implementation...
}
```

### Security Features

1. **Key Manager (modules/security/keyManager.js)**
   - Securely stores API keys using Electron's safeStorage
   - Encrypts sensitive data using OS-level secure storage
   - Provides fallback mechanisms when encryption is unavailable

2. **Content Security Policy**
   - Implemented in all HTML files
   - Restricts resource loading to secure sources
   - Prevents XSS and other injection attacks

3. **Sandboxed Mini Apps**
   - Mini apps run in sandboxed BrowserWindows
   - Context isolation prevents access to Node.js APIs
   - Limited IPC capabilities for mini apps

### Utilities

1. **Error Handler (modules/utils/errorHandler.js)**
   - Centralized error handling and reporting
   - User-friendly error messages
   - Error categorization and logging

2. **Event Manager (modules/utils/eventManager.js)**
   - Tracks event listeners to prevent memory leaks
   - Safely adds and removes event listeners
   - Cleans up orphaned event listeners

3. **File Operations (modules/utils/fileOperations.js)**
   - Handles file system operations
   - Implements metadata caching for performance
   - Provides secure file read/write capabilities

4. **Logger (modules/utils/logger.js)**
   - Structured logging with different levels
   - Context-aware log entries
   - File logging for production environments

## Component Organization

```
components/
├── core/                  # Core component infrastructure
│   ├── base-component.js  # Base web component class
│   ├── component-registry.js # Component registration
│   ├── dynamic-loader.js  # Dynamic component loading
│   ├── state-manager.js   # State management
│   └── utils.js           # Component utilities
└── ui/                    # UI components
    ├── cards/             # Card-style components
    ├── containers/        # Container components
    └── modals/            # Modal dialog components
```

## Renderer Organization

```
renderers/
├── main.js              # Main window renderer
├── api-setup.js         # API setup window renderer
├── app-creation.js      # App creation window renderer
└── main-web-components.js # Web components version of main renderer
```

## Communication Flow

1. **User Interaction** → Renderer Process
2. Renderer Process → **IPC Message** → Main Process
3. Main Process → **Process Request** → (File System | Claude API | Window Management)
4. Main Process → **IPC Response** → Renderer Process
5. Renderer Process → **Update UI** → User sees result
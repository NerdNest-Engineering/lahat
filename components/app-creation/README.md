# App Creation Module

This module contains all the functionality related to mini app creation in the Lahat application. It follows a modular architecture that separates concerns between the main process, renderer process, and preload script.

## Directory Structure

```
components/app-creation/
├── main/                  # Main process code
│   ├── handlers/          # IPC handlers
│   │   ├── generate-mini-app.js
│   │   ├── generate-title-description.js
│   │   └── ...
│   ├── services/          # Business logic
│   │   ├── mini-app-service.js
│   │   └── ...
│   └── index.js           # Exports main process functionality
├── preload/               # Preload scripts
│   ├── app-creation-api.js # Domain-focused API
│   └── index.js           # Exports preload functionality
├── renderer/              # Renderer process code
│   ├── components/        # UI components
│   │   ├── app-creation-step.js
│   │   ├── app-creation-step-one.js
│   │   ├── app-creation-step-two.js
│   │   ├── app-creation-step-three.js
│   │   ├── generation-preview.js
│   │   └── generation-status.js
│   ├── controller/        # UI controllers
│   │   └── app-creation-controller.js
│   ├── utils/             # Renderer utilities
│   │   └── utils.js
│   └── index.js           # Exports renderer components
├── app-creation.html      # HTML template
├── app-creation-controller.js # Legacy controller (to be removed)
├── utils.js               # Utility functions (to be moved to renderer/utils)
└── index.js               # Main module entry point
```

**Note:** There are currently two controller implementations (app-creation-controller.js in the root directory and renderer/controller/app-creation-controller.js). The renderer/controller version is the newer implementation and should be used going forward.

## Architecture

The app creation module follows a clean architecture that separates concerns:

1. **Main Process**: Contains the business logic and IPC handlers for mini app operations
2. **Preload Script**: Uses contextBridge to expose a domain-focused API to the renderer process
3. **Renderer Process**: Contains the UI components and controllers that use the domain API

## Usage

### Main Process

The main process code is registered in the application's main entry point:

```javascript
import { registerAppCreationHandlers } from './components/app-creation/main/index.js';

// Register IPC handlers
registerAppCreationHandlers();
```

### Preload Script

The preload script is set up in the application's preload script:

```javascript
const { setupAppCreationAPI } = require('./components/app-creation/preload/index.js');

// Set up the app creation API
setupAppCreationAPI();
```

### Renderer Process

The renderer process components are used in the application's renderer scripts (renderers/app-creation.js):

```javascript
import {
  AppCreationStep,
  AppCreationStepOne,
  AppCreationStepTwo,
  AppCreationStepThree,
  GenerationStatus,
  GenerationPreview,
  AppCreationController,
  showError
} from '../components/app-creation/index.js';

// Register the Web Components
customElements.define('app-creation-step', AppCreationStep);
customElements.define('app-creation-step-one', AppCreationStepOne);
// ... other component registrations

// Initialize the app controller
document.addEventListener('DOMContentLoaded', () => {
  new AppCreationController();
});
```

## Domain API

The module exposes a domain-focused API through the contextBridge. In the current implementation, these APIs are accessed as part of the window.electronAPI object, but future refactoring will move them to window.appCreationService:

```javascript
// Current Implementation (through window.electronAPI)
window.electronAPI.generateTitleAndDescription(input)
window.electronAPI.generateMiniApp(params)
window.electronAPI.notifyAppUpdated()
window.electronAPI.openWindow(windowName)
window.electronAPI.closeCurrentWindow()
window.electronAPI.checkApiKey()
window.electronAPI.onGenerationChunk(callback)
window.electronAPI.onTitleDescriptionChunk(callback)

// Future Implementation (through window.appCreationService)
window.appCreationService.generateTitleAndDescription(input)
window.appCreationService.generateMiniApp(params)
window.appCreationService.onGenerationProgress(callback)
window.appCreationService.onGenerationStatus(callback)
window.appCreationService.onTitleDescriptionProgress(callback)
```

## Documentation

Detailed documentation about the app creation components can be found in the `docs` directory.

**Note:** The documentation is divided into two parts:
1. Current implementation documentation that accurately reflects the current code
2. Target architecture documentation that describes the planned final architecture

### Current Implementation Documentation
- [Current Implementation](./docs/current-implementation.md) - Detailed documentation of the current implementation

### Target Architecture Documentation
- [Architecture Overview](./docs/index.md) - Overview of the target step lifecycle and component architecture
- [Step Lifecycle Interface](./docs/step-lifecycle.md) - Formal lifecycle interface for steps
- [Event-Based Communication](./docs/event-communication.md) - Event-based communication between steps
- [Error Handling](./docs/error-handling.md) - Approach for handling errors within step components
- [Controller Refactoring](./docs/controller-refactoring.md) - Refactoring the controller to use events
- [Migration Guide](./docs/migration-guide.md) - Guide for migrating existing components

## Current Implementation vs. Documentation

The current implementation differs from the documentation in several ways:

1. The step lifecycle is simpler in the current implementation with just `startStep()`, `endStep()`, and `setActive()` methods
2. Error handling is done via a simple error container rather than the more sophisticated approach described in the documentation
3. Communication between steps is done via simple events rather than the structured event system described in the documentation
4. Two controller implementations exist (one in the root directory and one in renderer/controller)

## Current Implementation Details

### Step Components

The current step components extend `AppCreationStep` which provides the following methods:

```javascript
startStep(data = {})  // Start the step with optional data
endStep()            // End the step
setActive(active)    // Set the step's active state
completeStep(data)   // Complete the step and move to the next one
reportError(error)   // Report an error in the step
```

### Controller

The newer controller implementation in renderer/controller/app-creation-controller.js:

- Uses an array of steps configured by ID
- Handles step completion and errors
- Manages the transition between steps
- Handles streaming updates from the main process

## Future Improvements

1. Fully implement the step lifecycle interface as described in the documentation
2. Remove the legacy controller in the root directory
3. Move any remaining utility functions from the root directory to renderer/utils
4. Add the improved error handling as described in the documentation
5. Implement the event-based communication system as described in the documentation
6. Add unit tests for the services and controllers

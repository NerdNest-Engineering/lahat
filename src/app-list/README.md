# App List Module

This module serves as the main entry point to the Lahat application. It displays a list of available mini apps and provides navigation controls to access other parts of the application.

## Features

- Display a list of available mini apps
- Navigation controls (Mini Apps, Create, Settings)
- App selection and launching
- App filtering and sorting
- IPC communication with other modules

## Components

### Web Components

- **`<app-list-container>`**: Main container for the app list
- **`<app-card>`**: Displays information about a single app
- **`<navigation-controls>`**: Provides navigation between different views

### Services

- **AppListService**: Manages the list of available apps

### Utilities

- **app-filter.js**: Provides utility functions for filtering and sorting apps

### IPC

- **preload.js**: Exposes IPC APIs to the renderer process
- **main-process-handlers.js**: Handles IPC requests in the main process
- **renderer-handlers.js**: Provides functions to interact with the main process

## Usage

### Testing in Browser

You can test the app-list module in a browser by opening the `test.html` file:

```bash
cd src/app-list
open test.html
```

This will open a test page that displays the app list with mock data.

### Integration with Electron

To integrate the app-list module with Electron, you need to:

1. Register the IPC handlers in the main process:

```javascript
const { registerAppListHandlers } = require('./src/app-list/ipc/main-process-handlers');

// In your main process
registerAppListHandlers(mainWindow);
```

2. Set up the preload script in the BrowserWindow:

```javascript
const appListPreloadPath = path.join(__dirname, 'src/app-list/ipc/preload.js');

// In your main process
const mainWindow = new BrowserWindow({
  // ...
  webPreferences: {
    preload: appListPreloadPath,
    // ...
  }
});
```

3. Load the app-list HTML file:

```javascript
// In your main process
mainWindow.loadFile('src/app-list/app-list.html');
```

## Todo

- [ ] Implement error handling and display error messages to the user
- [ ] Add loading state while fetching apps
- [ ] Implement app deletion functionality
- [ ] Add app sorting options
- [ ] Implement app grouping
- [ ] Add animations for smoother transitions
- [ ] Implement proper IPC communication with the app-creator and app-manager modules
- [ ] Add unit tests for components and services
- [ ] Add integration tests for IPC communication
- [ ] Implement proper error boundaries for web components
- [ ] Add accessibility features (keyboard navigation, screen reader support, etc.)
- [ ] Implement theming support
- [ ] Add internationalization support

## Architecture

The app-list module follows a modular architecture with clear separation of concerns:

- **Web Components**: Handle the UI and user interactions
- **Services**: Manage data and business logic
- **Utilities**: Provide helper functions
- **IPC**: Handle communication with other modules

### Communication Flow

1. User interacts with a web component (e.g., clicks on an app card)
2. Web component dispatches a custom event
3. Event listener in app-list.js handles the event
4. Event handler calls the appropriate IPC function
5. IPC function communicates with the main process
6. Main process handles the request and responds
7. Response is handled in the renderer process
8. UI is updated accordingly

## Dependencies

- No external dependencies, only built-in browser APIs and Electron

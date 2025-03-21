# Component Library

This is a reusable component library for the Electron app. It provides a set of web components that can be used across the application to ensure consistency and maintainability.

## Structure

The component library is organized as follows:

```
components/
├── core/                      # Core components and utilities
│   ├── base-component.js      # Base component class
│   ├── utils.js               # Utility functions
│   └── error-handling/        # Error handling components
│       ├── error-container.js
│       └── error-message.js
├── ui/                        # UI components
│   ├── cards/                 # Card components
│   │   └── app-card.js        # App card component
│   ├── containers/            # Container components
│   │   ├── app-list.js        # App list component
│   │   └── app-management-section.js # App management section
│   └── modals/                # Modal components
│       └── app-details-modal.js # App details modal
└── index.js                   # Exports all components
```

## Usage

To use the component library in a renderer process, import the components you need:

```javascript
// Import all components
import '../components/index.js';

// Or import specific components
import '../components/core/error-handling/error-container.js';
import '../components/core/error-handling/error-message.js';
import '../components/ui/cards/app-card.js';
```

Then use the components in your HTML:

```html
<!-- Error container -->
<error-container></error-container>

<!-- App management section -->
<app-management-section></app-management-section>

<!-- App details modal -->
<app-details-modal></app-details-modal>
```

## Components

### Core Components

#### BaseComponent

A base class that all components extend. It provides common functionality like shadow DOM attachment, event handling, and custom event dispatching.

```javascript
import { BaseComponent } from '../components/core/base-component.js';

class MyComponent extends BaseComponent {
  constructor() {
    super();
    
    const styles = `/* CSS styles */`;
    const html = `<!-- HTML template -->`;
    
    this.render(html, styles);
  }
}
```

#### Error Handling Components

- **ErrorContainer**: A container for error messages that appears in the top-right corner of the screen.
- **ErrorMessage**: Displays an error message with a title, content, and close button.

```javascript
// Show an error
import { showError } from '../components/core/utils.js';

showError('Error Title', 'Error message', 'error'); // Levels: error, warning, info, fatal
```

### UI Components

#### Cards

- **AppCard**: Displays information about a mini app in a card format.

#### Containers

- **AppList**: Displays a list of app cards and handles the "no apps" message.
- **AppManagementSection**: Contains the app management controls and app list.

#### Modals

- **AppDetailsModal**: Displays details about a selected app and provides actions.

## Events

Components communicate with each other and with the application using custom events:

- **app-selected**: Fired when an app card is clicked.
- **app-deleted**: Fired when an app is deleted.
- **create-app**: Fired when the create app button is clicked.
- **open-api-settings**: Fired when the API settings button is clicked.
- **refresh-apps**: Fired when the refresh button is clicked.
- **open-app-directory**: Fired when the open directory button is clicked.
- **modal-opened**: Fired when a modal is opened.
- **modal-closed**: Fired when a modal is closed.

## Utility Functions

The `utils.js` file provides utility functions for components:

- **showError**: Creates and shows an error message.
- **formatDate**: Formats a date for display.
- **truncateString**: Truncates a string to a maximum length.
- **debounce**: Debounces a function call.

## Example

Here's an example of how to use the component library in a renderer process:

```javascript
import '../components/index.js';
import { showError } from '../components/core/utils.js';

class AppController {
  constructor() {
    // Initialize components
    this.appManagementSection = document.querySelector('app-management-section');
    this.appDetailsModal = document.querySelector('app-details-modal');
    
    // Set up event listeners
    this.appManagementSection.addEventListener('create-app', () => {
      window.electronAPI.openWindow('app-creation');
    });
    
    document.addEventListener('app-selected', (event) => {
      this.appDetailsModal.setApp(event.detail);
      this.appDetailsModal.open();
    });
    
    // Load apps
    this.loadMiniApps();
  }
  
  async loadMiniApps() {
    try {
      const { apps } = await window.electronAPI.listMiniApps();
      this.appManagementSection.setApps(apps);
    } catch (error) {
      showError('Error', `Failed to load mini apps: ${error.message}`);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Create error container
  if (!document.querySelector('error-container')) {
    const errorContainer = document.createElement('error-container');
    document.body.appendChild(errorContainer);
  }
  
  // Initialize app controller
  new AppController();
});

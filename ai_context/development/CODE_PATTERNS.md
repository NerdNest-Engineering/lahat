# Lahat: Code Patterns

## Overview

This document outlines the key code patterns used in the Lahat application. It serves as a guide for maintaining consistency and understanding the design decisions that shape the codebase.

## Module Organization

Lahat follows a modular code structure with clear separation of concerns:

```
modules/
├── ipc/                    # Inter-process communication
├── security/               # Security functionality
├── utils/                  # Utility functions
├── windowManager/          # Window management
└── miniAppManager.js       # Mini app management
```

Each module has a well-defined responsibility and exports a consistent interface.

## Error Handling Pattern

Error handling is centralized through the `ErrorHandler` class:

```javascript
// Typical error handling pattern
try {
  // Risky operation
} catch (error) {
  ErrorHandler.logError('operationName', error);
  return createErrorResponse(error, 'operation-channel');
}
```

Key principles:
- Always use try/catch for operations that might fail
- Log errors with context and appropriate level
- Return standardized error responses from IPC handlers
- Present user-friendly error messages in UI

## IPC Communication Pattern

IPC communication follows a request-response pattern:

```javascript
// Main process (handler)
ipcHandler.register('channel-name', async (event, ...args) => {
  try {
    // Process the request
    return createSuccessResponse({ result });
  } catch (error) {
    return createErrorResponse(error, 'channel-name');
  }
});

// Renderer process (caller)
const result = await window.electronAPI.channelName(params);
if (!result.success) {
  // Handle error
}
```

Best practices:
- Use descriptive channel names
- Validate all parameters
- Handle all errors consistently
- Return standardized response objects

## Component Architecture

Web components extend the `BaseComponent` class:

```javascript
class MyComponent extends BaseComponent {
  static get observedAttributes() {
    return ['attribute-name'];
  }
  
  initialize() {
    // One-time initialization
    this.render(this.generateTemplate(), this.styles());
  }
  
  onAttributeChanged(name, oldValue, newValue) {
    // Handle attribute changes
    this.render(this.generateTemplate(), this.styles());
  }
  
  generateTemplate() {
    return `<div>Component content</div>`;
  }
  
  styles() {
    return `
      :host {
        display: block;
      }
    `;
  }
}

// Register the component
customElements.define('my-component', MyComponent);
```

Component guidelines:
- Keep components focused on a single responsibility
- Use shadow DOM for style encapsulation
- Track event listeners for proper cleanup
- Implement lifecycle hooks consistently

## Window Management Pattern

Window creation follows a factory pattern:

```javascript
// Create a window of a specific type
const window = windowManager.createWindow(WindowType.MAIN, {
  param1: 'value1',
  param2: 'value2'
});

// Show the window
window.show();
```

Window guidelines:
- Use defined window types for consistency
- Pass parameters through the windowParams map
- Apply appropriate security settings for each window type
- Use the window pool for reusing windows

## File Operations Pattern

File operations use consistent error handling and async/await:

```javascript
// Read a file
async function readFile(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    logger.error('Error reading file', { error: error.message, filePath });
    return { success: false, error: error.message };
  }
}
```

File operation guidelines:
- Use absolute paths for clarity
- Validate paths before operations
- Use async/await for all file operations
- Return consistent result objects

## State Management Pattern

State management uses a publish-subscribe pattern:

```javascript
// Create a state manager
const stateManager = new StateManager({
  initialState: {
    key1: 'value1',
    key2: 'value2'
  }
});

// Update state
stateManager.set({ key1: 'new value' });

// Subscribe to state changes
const unsubscribe = stateManager.subscribe(['key1'], (state, oldState, changedKeys) => {
  // Handle state change
});

// Unsubscribe when done
unsubscribe();
```

State management guidelines:
- Keep state immutable
- Use fine-grained subscriptions
- Unsubscribe when components are destroyed
- Use state only for data that needs to be shared

## Utility Functions Pattern

Utility functions are pure and focused:

```javascript
// String utilities example
export function truncateString(str, maxLength, suffix = '...') {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + suffix;
}
```

Utility function guidelines:
- Write pure functions when possible
- Use descriptive names
- Document parameters and return values
- Group related utilities in appropriately named files

## Security Pattern

Security is implemented through multiple layers:

1. Process isolation (contextIsolation, nodeIntegration: false)
2. Content Security Policy
3. Secure storage for sensitive data
4. Input validation
5. Path validation
6. Sandboxed mini apps

```javascript
// Creating a secure window
const win = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    preload: path.join(__dirname, 'preload.cjs')
  }
});
```

Security guidelines:
- Apply the principle of least privilege
- Validate all user inputs
- Use secure storage for sensitive data
- Implement Content Security Policy
- Sanitize content before display

## Testing Pattern

Testing follows these patterns:

1. Unit tests for utility functions
2. Component tests for UI components
3. Integration tests for IPC flows
4. End-to-end tests for key user journeys

```javascript
// Example utility test
describe('truncateString', () => {
  it('should truncate a string if it exceeds maxLength', () => {
    expect(truncateString('Hello World', 5)).toBe('Hello...');
  });
  
  it('should return the original string if it is shorter than maxLength', () => {
    expect(truncateString('Hello', 10)).toBe('Hello');
  });
});
```

Testing guidelines:
- Test business logic thoroughly
- Mock external dependencies
- Test error cases
- Test boundary conditions

## Conclusion

Following these patterns ensures consistency and maintainability throughout the Lahat codebase. When making changes, be sure to adhere to these established patterns and update this documentation if new patterns emerge.
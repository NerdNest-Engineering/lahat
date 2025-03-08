# Lahat: Testing Guide

## Overview

This document provides guidance for implementing effective testing practices for the Lahat application. It covers unit testing, component testing, integration testing, and end-to-end testing approaches.

## Testing Frameworks

For the Lahat application, we recommend the following testing stack:

1. **Jest**: For unit testing utility functions, modules, and business logic
2. **Testing Library**: For testing web components
3. **Spectron / Playwright**: For end-to-end testing the Electron application

## Test Directory Structure

```
tests/
├── unit/                 # Unit tests
│   ├── utils/            # Tests for utility functions
│   ├── ipc/              # Tests for IPC handlers
│   └── security/         # Tests for security modules
├── components/           # Component tests
│   ├── core/             # Tests for core components
│   └── ui/               # Tests for UI components
├── integration/          # Integration tests
│   ├── ipc-flows/        # Tests for IPC communication flows
│   └── window-management/ # Tests for window management
└── e2e/                  # End-to-end tests
    ├── app-creation/     # Tests for app creation flow
    └── mini-apps/        # Tests for mini app functionality
```

## Unit Testing

Unit tests focus on testing individual functions and classes in isolation.

### Testing Utility Functions

```javascript
// Example test for utils/stringUtils.js
import { truncateString, slugify } from '../../modules/utils/stringUtils.js';

describe('String Utilities', () => {
  describe('truncateString', () => {
    test('should truncate a string when it exceeds max length', () => {
      expect(truncateString('Hello World', 5)).toBe('Hello...');
    });
    
    test('should not truncate a string when it is shorter than max length', () => {
      expect(truncateString('Hello', 10)).toBe('Hello');
    });
    
    test('should handle null and undefined values', () => {
      expect(truncateString(null, 5)).toBeNull();
      expect(truncateString(undefined, 5)).toBeUndefined();
    });
    
    test('should use custom suffix when provided', () => {
      expect(truncateString('Hello World', 5, '!')).toBe('Hello!');
    });
  });
  
  describe('slugify', () => {
    // Tests for slugify function
  });
});
```

### Testing Error Handling

```javascript
// Example test for utils/errorHandler.js
import { ErrorHandler } from '../../modules/utils/errorHandler.js';

describe('ErrorHandler', () => {
  test('should format errors for IPC responses', () => {
    const error = new Error('Test error');
    error.code = 'TEST_ERROR';
    
    const result = ErrorHandler.formatErrorForIPC(error, 'test-operation');
    
    expect(result).toEqual({
      success: false,
      error: 'Test error',
      code: 'TEST_ERROR',
      operation: 'test-operation'
    });
  });
  
  test('should provide user-friendly error messages', () => {
    const error = new Error('API key invalid');
    const message = ErrorHandler.getUserFriendlyMessage(error);
    
    expect(message).toContain('API key');
  });
});
```

### Mocking Dependencies

```javascript
// Example test with mocked dependencies
import { saveGeneratedApp } from '../../modules/miniAppManager.js';
import fs from 'fs';

// Mock the fs module
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('miniAppManager', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    jest.clearAllMocks();
  });
  
  test('should save generated app to file system', async () => {
    const appName = 'Test App';
    const htmlContent = '<html>Test content</html>';
    const prompt = 'Create a test app';
    
    const result = await saveGeneratedApp(appName, htmlContent, prompt);
    
    // Verify fs.writeFile was called twice (for HTML and metadata)
    expect(fs.promises.writeFile).toHaveBeenCalledTimes(2);
    expect(result.filename).toContain('test_app');
    expect(result.metadata.name).toBe(appName);
  });
});
```

## Component Testing

Component tests focus on testing web components in isolation.

```javascript
// Example test for a component
import { fireEvent, screen } from '@testing-library/dom';
import { AppCard } from '../../components/ui/cards/app-card.js';

// Register the component
customElements.define('app-card', AppCard);

describe('AppCard', () => {
  let element;
  
  beforeEach(() => {
    // Create a new component instance for each test
    element = document.createElement('app-card');
    element.setAttribute('name', 'Test App');
    element.setAttribute('description', 'A test application');
    document.body.appendChild(element);
  });
  
  afterEach(() => {
    // Clean up after each test
    element.remove();
  });
  
  test('should render app name and description', () => {
    const shadow = element.shadowRoot;
    
    const nameElement = shadow.querySelector('.app-name');
    const descriptionElement = shadow.querySelector('.app-description');
    
    expect(nameElement.textContent).toBe('Test App');
    expect(descriptionElement.textContent).toBe('A test application');
  });
  
  test('should emit open event when card is clicked', () => {
    const shadow = element.shadowRoot;
    const card = shadow.querySelector('.card');
    
    // Set up event listener
    const openHandler = jest.fn();
    element.addEventListener('open', openHandler);
    
    // Simulate click
    fireEvent.click(card);
    
    // Verify event was emitted
    expect(openHandler).toHaveBeenCalledTimes(1);
  });
});
```

## Integration Testing

Integration tests focus on testing how different parts of the application work together.

```javascript
// Example integration test for IPC communication
import { ipcMain } from 'electron';
import { registerHandlers } from '../../modules/ipc/miniAppHandlers.js';
import { miniAppManager } from '../../modules/miniAppManager.js';

// Mock dependencies
jest.mock('../../modules/miniAppManager.js', () => ({
  miniAppManager: {
    createMiniAppWindow: jest.fn().mockResolvedValue({
      success: true,
      windowId: 123,
      filePath: '/tmp/test.html'
    }),
    openMiniApp: jest.fn().mockResolvedValue({
      success: true,
      windowId: 123
    })
  }
}));

jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    removeHandler: jest.fn()
  }
}));

describe('Mini App IPC Integration', () => {
  beforeEach(() => {
    // Register handlers
    registerHandlers();
  });
  
  afterEach(() => {
    // Clean up
    jest.clearAllMocks();
  });
  
  test('should register generate-mini-app handler', () => {
    // Verify handler was registered
    expect(ipcMain.handle).toHaveBeenCalledWith(
      'generate-mini-app',
      expect.any(Function)
    );
  });
  
  test('should register open-mini-app handler', () => {
    // Verify handler was registered
    expect(ipcMain.handle).toHaveBeenCalledWith(
      'open-mini-app',
      expect.any(Function)
    );
  });
  
  // Test handler behavior by capturing and calling the handler function
  test('generate-mini-app handler should create a mini app window', async () => {
    // Find the handler function
    const calls = ipcMain.handle.mock.calls;
    const generateMiniAppHandler = calls.find(
      call => call[0] === 'generate-mini-app'
    )[1];
    
    // Call the handler
    const result = await generateMiniAppHandler({}, {
      appName: 'Test App',
      prompt: 'Create a test app',
      htmlContent: '<html>Test</html>'
    });
    
    // Verify the handler called the appropriate function
    expect(miniAppManager.createMiniAppWindow).toHaveBeenCalledWith(
      'Test App',
      '<html>Test</html>',
      expect.any(String),
      expect.any(String)
    );
    
    // Verify the result
    expect(result.success).toBe(true);
    expect(result.windowId).toBe(123);
  });
});
```

## End-to-End Testing

End-to-end tests focus on testing the application as a whole, from the user's perspective.

```javascript
// Example end-to-end test using Spectron
import { Application } from 'spectron';
import path from 'path';

describe('Application Launch', function() {
  let app;
  
  beforeEach(function() {
    app = new Application({
      path: path.join(__dirname, '../../node_modules/.bin/electron'),
      args: [path.join(__dirname, '../../main.js')],
      env: { NODE_ENV: 'test' }
    });
    
    return app.start();
  });
  
  afterEach(function() {
    if (app && app.isRunning()) {
      return app.stop();
    }
  });
  
  test('shows the main window', async function() {
    // Check if the window is visible
    const isVisible = await app.browserWindow.isVisible();
    expect(isVisible).toBe(true);
    
    // Get the window title
    const title = await app.browserWindow.getTitle();
    expect(title).toBe('Lahat');
  });
  
  test('displays the app list', async function() {
    // Get the app list element
    const appList = await app.client.$('.app-list');
    
    // Check if it's visible
    const isVisible = await appList.isDisplayed();
    expect(isVisible).toBe(true);
  });
});
```

## Testing API Integration

For testing API integration, we recommend using mocks:

```javascript
// Example test for Claude API integration
import { generateApp } from '../../modules/api/claudeClient.js';
import { Anthropic } from '@anthropic-ai/sdk';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    Anthropic: jest.fn().mockImplementation(() => {
      return {
        messages: {
          create: jest.fn().mockImplementation(() => {
            return {
              content: [
                {
                  type: 'text',
                  text: '<html>Generated App</html>'
                }
              ]
            };
          })
        }
      };
    })
  };
});

describe('Claude API Integration', () => {
  test('should generate app HTML from prompt', async () => {
    const apiKey = 'test-api-key';
    const prompt = 'Create a simple calculator app';
    
    const result = await generateApp(apiKey, prompt);
    
    // Verify Anthropic was initialized with the correct API key
    expect(Anthropic).toHaveBeenCalledWith({
      apiKey: 'test-api-key'
    });
    
    // Verify the create method was called with the correct parameters
    const anthropicInstance = new Anthropic();
    expect(anthropicInstance.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        max_tokens: expect.any(Number),
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining(prompt)
          })
        ])
      })
    );
    
    // Verify the result
    expect(result).toBe('<html>Generated App</html>');
  });
});
```

## Test Coverage

Track test coverage to ensure adequate testing:

```json
// Jest configuration in package.json
{
  "jest": {
    "collectCoverage": true,
    "coverageReporters": ["text", "lcov"],
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## Continuous Integration

Set up continuous integration to run tests automatically:

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Use Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18.x'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Upload coverage
      uses: codecov/codecov-action@v1
```

## Testing Best Practices

1. **Test Isolation**: Each test should run independently without relying on the state from other tests.

2. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification phases.

3. **Use Descriptive Test Names**: Name tests to describe the behavior being tested.

4. **Focus on Behavior, Not Implementation**: Test what the code does, not how it does it.

5. **Mock External Dependencies**: Use Jest's mocking capabilities to isolate code from external dependencies.

6. **Test Error Cases**: Don't just test the happy path; also test error handling and edge cases.

7. **Avoid Test Duplication**: Use beforeEach and helpers to reduce duplication in test setup.

8. **Keep Tests Fast**: Optimize tests to run quickly to encourage frequent testing.

9. **Use Snapshot Testing Sparingly**: Snapshot tests can be useful but can also become brittle if overused.

10. **Prioritize Tests by Risk**: Focus testing efforts on critical functionality and complex logic.

## Implementing Testing

To implement testing in the Lahat project:

1. Install testing dependencies:
   ```
   npm install --save-dev jest @testing-library/dom @testing-library/jest-dom spectron
   ```

2. Add test scripts to package.json:
   ```json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage"
     }
   }
   ```

3. Create Jest configuration:
   ```javascript
   // jest.config.js
   module.exports = {
     testEnvironment: 'jsdom',
     transform: {
       // Transform ES modules
     },
     setupFilesAfterEnv: [
       './tests/setup.js'
     ],
     // Other configuration
   };
   ```

4. Create a test setup file:
   ```javascript
   // tests/setup.js
   import '@testing-library/jest-dom';
   
   // Set up global test environment
   global.window.electronAPI = {
     // Mock electronAPI for tests
   };
   ```

5. Start writing tests following the examples above.

## Conclusion

A comprehensive testing strategy is essential for maintaining the quality and reliability of the Lahat application. By implementing unit tests, component tests, integration tests, and end-to-end tests, you can ensure that the application behaves as expected and catch issues early in the development process.

Remember that testing is an ongoing process, and test coverage should grow alongside the codebase.
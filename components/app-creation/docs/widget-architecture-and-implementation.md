# Widget Architecture and Implementation

This document provides a comprehensive overview of the widget architecture and current implementation in Lahat as of March 2025.

## Architecture Vision

The vision for Lahat's widget system is to generate and use **self-contained web components** that are directly integrated into Lahat cells. This represents a shift from the previous approach, which created separate HTML files with their own execution context.

**Note: We have moved away from the "mini app" terminology. Any references to "mini apps" should be converted to the widget approach. No backward compatibility is needed.**

### Key Principles

1. **Web Component Based**: All widgets are implemented as standard web components using the Custom Elements API
2. **Self-Contained**: Widgets encapsulate all their functionality, styling, and behavior
3. **Shadow DOM**: Widgets use Shadow DOM for style encapsulation
4. **Direct Integration**: Widgets are loaded directly into Lahat cells, not as separate applications
5. **Clean Separation**: WebComponents focus solely on UI while LahatCell handles integration

## Benefits of Web Component Approach

### Enhanced Capabilities

- **Access to Lahat APIs**: LahatCell provides access to Lahat capabilities when needed
- **Data Integration**: LahatCell handles integration with Lahat's data model
- **Event Communication**: LahatCell manages event communication between components

### Better Integration

- **Consistent UI**: LahatCell applies Lahat's design system for a consistent user experience
- **Seamless Embedding**: Widgets are embedded directly in cells, not loaded in iframes or separate windows
- **Responsive Design**: LahatCell handles responsive layout adjustments

### Simplified Security

- **Clear Separation**: WebComponents have no knowledge of Lahat-specific concepts
- **Controlled Execution**: Widgets run in a controlled environment with defined permissions
- **Simplified Model**: No complex security verification needed

### Simplified Architecture

- **Reduced Complexity**: No need for separate HTML files or execution contexts
- **Cleaner Separation**: WebComponents focus solely on UI while LahatCell handles integration
- **Easier Maintenance**: Simpler architecture is easier to maintain and extend

## Current Implementation

The widget creation functionality is currently organized as follows:

```
components/app-creation/
├── main/                  # Main process code
│   ├── handlers/          # IPC handlers
│   │   ├── generate-widget.js
│   │   ├── generate-title-description.js
│   ├── services/          # Business logic
│   │   ├── widget-service.js
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
│   │   └── app-creation-controller.js  # New controller implementation
│   ├── utils/             # Renderer utilities
│   │   └── utils.js
│   └── index.js           # Exports renderer components
├── app-creation.html      # HTML template
├── app-creation-controller.js # Legacy controller (to be removed)
├── utils.js               # Utility functions (to be moved to renderer/utils)
├── widget-system-prompts.js # System prompts for widget generation
└── index.js               # Main module entry point
```

### Widget Generation Process

The widget generation process now works as follows:

1. Claude generates a JavaScript file containing a widget component class that extends the standard HTMLElement
2. The widget code is saved to a JS file in the app's directory
3. The widget is dynamically imported and instantiated within a LahatCell container

### Widget Loading

Widgets are loaded by LahatCell using a straightforward process:

```javascript
// components/core/lahat-cell.js
export class LahatCell extends HTMLElement {
  // ...
  
  async loadComponent(componentType) {
    // Clear existing content
    this.clearContent();
    
    // Set component type
    this._componentType = componentType;
    
    // Get content container
    const contentContainer = this.$('.cell-content');
    
    try {
      // Import the component module
      const module = await import(`/widgets/${componentType}.js`);
      
      // Register the custom element if needed
      if (!customElements.get(componentType)) {
        const ComponentClass = module.default || Object.values(module)[0];
        customElements.define(componentType, ComponentClass);
      }
      
      // Create the WebComponent
      const webComponent = document.createElement(componentType);
      this._webComponent = webComponent;
      
      // Add the component to the DOM
      contentContainer.appendChild(webComponent);
      
      // Set up event listeners for the component
      this.setupComponentEventListeners(webComponent);
      
      return webComponent;
    } catch (error) {
      console.error(`Error loading component ${componentType}:`, error);
      this.handleError(error);
    }
  }
  
  // ...
}
```

### Widget Component Structure

A typical widget component follows this structure:

```javascript
export class MyCustomWidget extends HTMLElement {
  constructor() {
    super();
    
    // Create shadow DOM
    this.attachShadow({ mode: 'open' });
    
    // Initialize shadow DOM
    this.shadowRoot.innerHTML = `
      <style>
        /* Component-specific styles */
        :host {
          display: block;
          padding: 16px;
        }
        /* More styles... */
      </style>
      
      <div class="widget-container">
        <!-- Widget content -->
      </div>
    `;
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  // Lifecycle methods
  connectedCallback() {
    // Initialize when added to DOM
  }
  
  disconnectedCallback() {
    // Clean up when removed from DOM
  }
  
  // Widget-specific methods
  setupEventListeners() {
    // Set up event listeners
  }
  
  // Other methods...
}

// Register the custom element
customElements.define('my-custom-widget', MyCustomWidget);
```

### Current Lifecycle Implementation

The current implementation has a simplified lifecycle compared to the target architecture:

```javascript
export class AppCreationStep extends HTMLElement {
  // Start this step with data from the previous step
  startStep(data = {}) {
    // Activate this step
    this.setActive(true);
    
    // Store the data for potential use by subclasses
    this._stepData = data;
  }
  
  // End this step
  endStep() {
    this.setActive(false);
  }
  
  // Set the active state of this step
  setActive(active) {
    if (active) {
      this.classList.add('active');
      this.classList.remove('hidden');
    } else {
      this.classList.remove('active');
      this.classList.add('hidden');
    }
  }
  
  // Complete this step and move to the next one
  completeStep(data = {}) {
    this.dispatchEvent(new CustomEvent('step-complete', {
      bubbles: true,
      composed: true,
      detail: data
    }));
  }
  
  // Report an error in this step
  reportError(error) {
    this.dispatchEvent(new CustomEvent('step-error', {
      bubbles: true,
      composed: true,
      detail: { error }
    }));
  }
}
```

## Migration Path

The current implementation is being gradually migrated toward the target architecture:

1. Step components have been moved to the renderer/components directory
2. A new controller implementation exists in renderer/controller
3. Basic event communication has been implemented
4. Widget integration has been updated to load widgets directly into Lahat cells
5. Security measures have been added to verify widget integrity

For details on the migration plan, see the [WebComponent Migration Guide](./webcomponent-migration-guide.md).

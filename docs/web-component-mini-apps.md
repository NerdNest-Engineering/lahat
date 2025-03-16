# Web Component Mini Apps

This document explains the new web component-based mini app system in Lahat.

## Overview

Instead of generating self-contained HTML files, Lahat now generates mini apps as web components. This approach offers several advantages:

1. **Modularity**: Each mini app is a self-contained web component that can be easily loaded into any container.
2. **Reusability**: Web components can be reused across different parts of the application.
3. **Encapsulation**: Shadow DOM provides style and DOM encapsulation, preventing conflicts with the main application.
4. **Standardization**: Web components are a web standard, making the code more maintainable and future-proof.
5. **Customization**: The container can be customized to provide a consistent look and feel across all mini apps.

## Architecture

The system consists of the following components:

1. **MiniAppContainer**: A standard container that hosts mini app web components.
2. **Generated Web Components**: Each mini app is generated as a web component that extends HTMLElement.
3. **Template HTML**: A standard HTML template that loads the mini app container and the generated web component.

## How It Works

1. When a user requests a new mini app, Claude generates a web component JavaScript file instead of an HTML file.
2. The system creates a standard HTML file that imports both the MiniAppContainer and the generated web component.
3. The HTML file loads the MiniAppContainer and then loads the generated web component into it.
4. The mini app runs within the container, which provides a consistent environment and UI.

## Creating a Mini App

Mini apps are now created as web components. Here's an example of a simple calculator mini app:

```javascript
export class CalculatorComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Initialize state
    this.state = {
      // Component state here
    };
    
    // Render initial UI
    this.render();
  }
  
  // Lifecycle methods
  connectedCallback() {
    // Component connected to DOM
    this.setupEventListeners();
  }
  
  disconnectedCallback() {
    // Component removed from DOM
    this.removeEventListeners();
  }
  
  // Render method
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        /* Component styles */
      </style>
      <div>
        <!-- Component HTML -->
      </div>
    `;
  }
  
  // Event handling
  setupEventListeners() {
    // Set up event listeners
  }
  
  removeEventListeners() {
    // Clean up event listeners
  }
}

// Register the component
customElements.define('calculator-component', CalculatorComponent);
```

## Loading a Mini App

To load a mini app, you use the MiniAppContainer component:

```javascript
import { MiniAppContainer } from './components/mini-app/mini-app-container.js';
import { MyMiniAppComponent } from './path/to/mini-app-component.js';

// Get the container
const container = document.getElementById('app-container');

// Load the mini app component
container.loadComponent(MyMiniAppComponent);
```

## Testing Mini Apps

You can test mini apps using the provided example:

1. Open `examples/mini-apps/calculator-test.html` in a browser.
2. The calculator mini app should load and be fully functional.

## Benefits for Lahat

This approach provides several benefits for Lahat:

1. **Consistency**: All mini apps have a consistent container and behavior.
2. **Maintainability**: The code is more modular and easier to maintain.
3. **Flexibility**: The container can be customized to provide additional features or styling.
4. **Performance**: Web components are lightweight and efficient.
5. **Integration**: Mini apps can be more easily integrated with the main application.

## Future Enhancements

Possible future enhancements include:

1. **Component Library**: Create a library of common components that mini apps can use.
2. **State Management**: Add a state management system for more complex mini apps.
3. **Communication API**: Allow mini apps to communicate with each other or with the main application.
4. **Theming**: Add support for theming mini apps to match the main application.
5. **Accessibility**: Ensure all mini apps are accessible by default.

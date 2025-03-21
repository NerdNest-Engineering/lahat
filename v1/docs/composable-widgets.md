# Composable Widgets Architecture

This document provides an overview of the composable widgets architecture in Lahat, including the core components, event communication system, and usage examples.

## Introduction

The composable widgets architecture allows for the creation of small, focused web components that can be composed together to create more complex applications. Each widget is a self-contained web component that can be placed in a Lahat cell, which can contain either a single widget or multiple nested cells.

The key benefits of this architecture include:

- **Modularity**: Each widget is a self-contained component that can be developed and tested independently.
- **Composability**: Widgets can be composed together to create more complex applications.
- **Encapsulation**: Shadow DOM provides style and DOM isolation, preventing conflicts between components.
- **Standardization**: Web components are a web standard, making the code more maintainable and future-proof.
- **Event-based Communication**: Widgets communicate with each other through a standardized event system.

## Core Components

### WidgetComponent

The `WidgetComponent` is the base class for all widgets in the system. It extends the `BaseComponent` class and provides common functionality for widgets, including:

- Data persistence through the `WidgetDataStore`
- Event communication through the `EventBus`
- Standard widget lifecycle methods
- DOM helper methods

Example usage:

```javascript
import { WidgetComponent } from '../../components/core/widget-component.js';

export class MyWidget extends WidgetComponent {
  constructor() {
    super();
    
    // Initialize state
    this._myState = 0;
    
    // Render initial UI
    this.render();
  }
  
  // Called when the data store is ready
  async onDataStoreReady() {
    // Load initial data from the data store
    const savedState = await this.loadData('myState');
    if (savedState !== null) {
      this._myState = savedState;
      this.updateUI();
    }
  }
  
  // Render the widget UI
  render() {
    const html = `
      <div class="my-widget">
        <h2>My Widget</h2>
        <div class="state-display">${this._myState}</div>
        <button class="update-button">Update</button>
      </div>
    `;
    
    const styles = `
      :host {
        display: block;
      }
      
      .my-widget {
        padding: 16px;
      }
    `;
    
    // Update shadow DOM
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${html}
    `;
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  // Set up event listeners
  setupEventListeners() {
    const button = this.$('.update-button');
    if (button) {
      this.addEventListener(button, 'click', this.handleUpdate.bind(this));
    }
  }
  
  // Handle update button click
  handleUpdate() {
    this._myState++;
    this.updateUI();
    this.saveState();
    
    // Publish event
    this.publishEvent('state-changed', { state: this._myState });
  }
  
  // Update the UI
  updateUI() {
    const display = this.$('.state-display');
    if (display) {
      display.textContent = this._myState;
    }
  }
  
  // Save the state to the data store
  async saveState() {
    await this.saveData('myState', this._myState);
  }
}

// Register the component
customElements.define('my-widget', MyWidget);
```

### LahatCell

The `LahatCell` is a container component that can hold either a single widget or multiple Lahat cells. It handles event communication between cells and manages layout.

Key features:

- Can contain either a single widget or multiple Lahat cells (not both)
- Handles event communication between cells
- Provides drag-and-drop functionality for arrangement
- Manages layout and positioning

Example usage:

```javascript
// Create a cell
const cell = document.createElement('lahat-cell');

// Add a widget to the cell
const widget = document.createElement('my-widget');
cell.setWidget(widget);

// Or add multiple cells to the cell
const childCell1 = document.createElement('lahat-cell');
const childCell2 = document.createElement('lahat-cell');
cell.setCells([childCell1, childCell2]);
```

### LahatGrid

The `LahatGrid` is a container component that manages a grid of Lahat cells. It provides layout management and drag-and-drop functionality.

Key features:

- Manages a grid of Lahat cells
- Provides drag-and-drop functionality for cell arrangement
- Handles cell resizing
- Manages cell positioning

Example usage:

```javascript
// Create a grid
const grid = document.createElement('lahat-grid');
document.body.appendChild(grid);

// Add a cell to the grid
const cell = document.createElement('lahat-cell');
grid.addCell(cell, 0, 0, 3, 3);

// Create a widget
const widget = document.createElement('my-widget');

// Add widget to cell
cell.setWidget(widget);
```

## Event Communication

The event communication system is based on a pub/sub pattern, where components can publish events and subscribe to events from other components.

### EventBus

The `EventBus` is a simple pub/sub implementation for communication between components. It provides methods for publishing and subscribing to events.

Key features:

- Publish events to subscribers
- Subscribe to events from publishers
- Namespaced events for better organization
- Event history for late subscribers

Example usage:

```javascript
import { globalEventBus, createNamespacedEventBus } from '../../components/core/event-bus.js';

// Create a namespaced event bus
const myEventBus = createNamespacedEventBus('my-namespace');

// Subscribe to an event
const unsubscribe = myEventBus.subscribe('my-event', (data) => {
  console.log('Received event:', data);
});

// Publish an event
myEventBus.publish('my-event', { foo: 'bar' });

// Unsubscribe from the event
unsubscribe();
```

### Widget-to-Cell Communication

Widgets can communicate with their parent cell through the `publishEvent` method:

```javascript
// In a widget
this.publishEvent('my-event', { foo: 'bar' });
```

The parent cell will receive this event and can forward it to other cells or handle it directly.

### Cell-to-Cell Communication

Cells can communicate with each other through the `publishCellEvent` method:

```javascript
// In a cell
this.publishCellEvent('my-event', { foo: 'bar' });
```

Other cells can subscribe to these events through the `subscribeToCellEvent` method:

```javascript
// In a cell
this.subscribeToCellEvent('my-event', (data) => {
  console.log('Received event:', data);
});
```

## Data Persistence

Widgets can persist their data through the `WidgetDataStore`, which provides methods for saving and loading data.

Key features:

- Save data to persistent storage
- Load data from persistent storage
- Data isolation between widgets
- Automatic data loading on widget initialization

Example usage:

```javascript
// In a widget
// Save data
await this.saveData('myKey', 'myValue');

// Load data
const value = await this.loadData('myKey');
```

## Creating a Widget

To create a new widget, follow these steps:

1. Create a new JavaScript file that extends the `WidgetComponent` class.
2. Implement the required methods and properties.
3. Register the component with `customElements.define()`.

Example:

```javascript
import { WidgetComponent } from '../../components/core/widget-component.js';

export class MyWidget extends WidgetComponent {
  constructor() {
    super();
    
    // Initialize state
    this._myState = 0;
    
    // Render initial UI
    this.render();
  }
  
  // ... implement required methods ...
}

// Register the component
customElements.define('my-widget', MyWidget);
```

## Testing Widgets

You can test widgets using the provided example:

1. Run the widget test HTML file:
   ```bash
   ./examples/widgets/run-widget-test.sh
   ```
2. The test page will load with a grid and controls for adding widgets and cells.
3. You can add widgets, cells, and nested cells to test the functionality.
4. The event log will show events published by widgets and cells.

## Widget Generation

Widgets can be generated using Claude with the provided system prompts. The system prompts are designed to guide Claude in generating widgets that follow the composable widgets architecture.

Example:

```javascript
import { determineWidgetSystemPrompt } from '../../components/app-creation/widget-system-prompts.js';

// Determine the appropriate system prompt based on the widget description
const systemPrompt = determineWidgetSystemPrompt('Create a calculator widget');

// Generate the widget using Claude
const widgetCode = await claudeClient.generateWidget(
  'Create a calculator widget that can perform basic arithmetic operations.',
  systemPrompt
);
```

## Future Enhancements

Possible future enhancements include:

1. **Widget Library**: Create a library of common widgets that can be reused across applications.
2. **Advanced Event Routing**: Implement more sophisticated event routing and filtering.
3. **Widget Marketplace**: Create a marketplace for sharing and discovering widgets.
4. **Widget Templates**: Provide templates for common widget types.
5. **Widget Composition**: Allow widgets to be composed together to create more complex widgets.
6. **Widget Testing Framework**: Create a testing framework for widgets.
7. **Widget Documentation Generator**: Create a documentation generator for widgets.
8. **Widget Versioning**: Implement versioning for widgets.
9. **Widget Dependency Management**: Implement dependency management for widgets.
10. **Widget Theming**: Implement theming for widgets.

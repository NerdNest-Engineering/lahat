# Widget Architecture

This document describes the widget architecture in Lahat v2.

## Overview

Widgets in Lahat are self-contained WebComponents that can be added to dashboards. They follow a layered architecture that separates concerns and promotes reusability.

## WebComponent Architecture

The WebComponent architecture consists of three layers:

1. **WebComponent Layer**
2. **LahatCell Layer**
3. **EventBus Layer**

### WebComponent Layer

The WebComponent layer is responsible for:

- Rendering the UI
- Handling DOM events
- Managing component-specific state
- Providing a public API

WebComponents are completely unaware of Lahat and can be used in any web application.

### LahatCell Layer

The LahatCell layer is responsible for:

- Managing WebComponent lifecycle
- Acting as a proxy for events
- Providing UI integration with Lahat
- Managing data persistence

The LahatCell is a container for WebComponents and provides the bridge between WebComponents and Lahat.

### EventBus Layer

The EventBus layer is responsible for:

- Global event communication
- Inter-component communication
- Dashboard-level event handling

The EventBus is only used when necessary and is not required for basic widget functionality.

## Widget Creation Flow

1. **Widget Design**: Define the widget's purpose, UI, and behavior
2. **WebComponent Implementation**: Create a WebComponent that implements the widget
3. **LahatCell Integration**: Add the WebComponent to a LahatCell
4. **Dashboard Integration**: Add the LahatCell to a dashboard

## Widget API

Widgets expose a standard API that allows them to be integrated with Lahat:

```javascript
class MyWidget extends HTMLElement {
  // Standard WebComponent lifecycle methods
  constructor() { ... }
  connectedCallback() { ... }
  disconnectedCallback() { ... }
  
  // Lahat-specific methods
  onResize(width, height) { ... }
  onDataStoreReady() { ... }
  
  // Data persistence methods (provided by LahatCell)
  getStoredData(key) { ... }
  storeData(key, value) { ... }
}
```

## Widget Examples

The `examples/widgets/` directory contains examples of widgets that demonstrate different aspects of the widget architecture:

- `counter-widget.js`: A simple counter widget
- `does-nothing-widget.js`: A widget that does nothing (for demonstration)

## Best Practices

1. **Keep WebComponents Independent**: WebComponents should not depend on Lahat
2. **Use Standard Web APIs**: Avoid framework-specific code
3. **Follow Web Component Best Practices**: Custom elements, shadow DOM, etc.
4. **Implement Resize Handling**: Widgets should adapt to different sizes
5. **Use Data Persistence Carefully**: Only store necessary data
# Widget Creation Component Documentation

This documentation covers both the target architecture for widget creation components and the WebComponent migration initiative. These are two separate but related efforts to improve the widget system in Lahat.

**Note: We have moved away from the "mini app" terminology. Any references to "mini apps" should be converted to the widget approach. No backward compatibility is needed.**

## Overview
The Lahat WebComponent architecture is designed to ensure that:
- WebComponents remain **completely independent** and unaware of Lahat.
- **LahatCell** manages WebComponent lifecycle and acts as a **proxy for events**.
- **LahatCell** handles all responsibilities related to step lifecycle, event communication, controller functionality, and UI integration.
- **LahatCell** provides the bridge that makes WebComponents appear integrated with the Lahat UI.
- WebComponents are truly self-contained "black boxes" with no knowledge of Lahat-specific concepts.
- **EventBus** handles global event communication (only if needed).
- No CORS issues since **WebComponents are loaded as local files**.

## High-Level Architecture

The Lahat WebComponent architecture separates concerns into **three distinct layers** with clear responsibilities:

1. **WebComponent**: Self-contained, completely unaware of Lahat, focused solely on UI rendering and DOM events.
2. **LahatCell**: Fully manages component lifecycle (creation, mounting, updating, destruction), handles all event communication, acts as a controller, provides UI integration with Lahat, and manages all Lahat-specific functionality.
3. **EventBus**: Global event handler (only if needed).

```pseudocode
class EventBus
  - properties:
    - eventListeners (Dictionary of event names → array of listeners)

  method subscribe(eventName, callback)
    - if eventName not in eventListeners
      - initialize empty list for eventName
    - add callback to eventListeners[eventName]

  method unsubscribe(eventName, callback)
    - if eventName in eventListeners
      - remove callback from eventListeners[eventName]

  method publish(eventName, data)
    - if eventName in eventListeners
      - for each callback in eventListeners[eventName]
        - invoke callback(data)

class WebComponent
  - properties:
    - id
    - shadowDOM

  method initialize()
    - setup shadowDOM
    - render()

  method render()
    - generate UI (HTML + CSS)

  method emit(eventName, detail)
    - dispatch CustomEvent(eventName, { bubbles: true, composed: true, detail })

class LahatCell
  - properties:
    - id
    - webComponent
    - size, position

  method initialize(componentType, config)
    - Create instance of WebComponent
    - Attach WebComponent to the DOM

  method handleEvent(event)
    - EventBus.publish(event.type, event.detail)  # Relay to EventBus

  method destroy()
    - Remove WebComponent from DOM
    - Clean up event listeners
```

### Key Benefits of This Architecture
- **WebComponents are self-contained** → No dependencies, no Lahat-specific knowledge.
- **LahatCell owns the lifecycle** → Ensures reusability and handles all step lifecycle management.
- **LahatCell acts as controller** → Simplifies WebComponents by removing controller logic.
- **LahatCell handles UI integration** → WebComponents don't need to know about Lahat UI.
- **Clear separation of concerns** → WebComponents focus only on UI, LahatCell handles everything else.
- **Simplified security model** → No need for CSP hashes or complex verification.
- **EventBus is optional** → Avoids unnecessary complexity.

This architecture ensures that WebComponents remain completely independent and unaware of Lahat, while LahatCell acts as a proxy for events and handles all Lahat-specific functionality.

## Implementation Details

### 1. EventBus (Global Pub/Sub)
- Handles **global events** but remains **completely separate** from WebComponents.
- Used only when **components need to communicate globally**.

```js
// event-bus.js
class EventBus {
  constructor() {
    this.listeners = {};
  }

  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  unsubscribe(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  publish(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
}

// Singleton instance
export const eventBus = new EventBus();
```

### 2. WebComponent Implementation
- A **standalone WebComponent** that **only emits standard DOM events**.
- It **does not** know about `LahatCell` or `EventBus`.

```js
// my-widget.js
class MyWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; padding: 10px; background: #eee; }
      </style>
      <button id="saveBtn">Save Note</button>
    `;

    this.shadowRoot.querySelector('#saveBtn').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('note-saved', {
        bubbles: true, composed: true, detail: { noteId: Date.now() }
      }));
    });
  }
}

customElements.define('my-widget', MyWidget);
```

### 3. LahatCell Implementation
- **Creates, attaches, and destroys WebComponents.**
- **Fully manages component lifecycle** including start, end, disable, enable, hide, show.
- **Acts as a controller** by handling all business logic and state management.
- **Captures events** from WebComponents and **forwards them** to `EventBus`.
- **Provides UI integration with Lahat** by:
  - Applying Lahat styling and themes
  - Handling responsive layout adjustments
  - Managing component positioning within the Lahat grid
  - Providing access to Lahat capabilities when needed
- **Keeps WebComponents completely independent** of Lahat-specific concepts.

For a detailed implementation of LahatCell, see [Updated LahatCell](./updated-lahat-cell.js).

## Widget Creation Target Architecture

This section describes the *target architecture* for the widget creation components, with a formalized lifecycle for steps enabling more flexible UI transitions and better separation of concerns. **This represents the planned architecture, not the current implementation.**

### Relationship with Dashboards

Widgets created through this component are designed to be instantiated within Lahat cells that are composed in dashboards. Dashboards are where we instantiate the Lahat cells containing the widgets so they can be composed to fulfill the needs of our users. This separation allows:

1. **Flexible Composition**: Widgets can be arranged and combined in various ways
2. **Independent Development**: Widgets and dashboards can be developed separately
3. **Reusability**: The same widget can be used in multiple dashboards
4. **Customization**: Dashboards can configure widgets to meet specific needs

## Overview

The widget creation process consists of multiple steps that guide the user through creating a widget. This documentation outlines the target architecture for these steps, focusing on the WebComponent approach for widget integration.

**Note: The current implementation is simpler and represents a transition state towards this target architecture. See [Widget Architecture and Implementation](./widget-architecture-and-implementation.md) for detailed documentation of the current code implementation.**

## Widget Integration

The widget creation module now generates standalone widget components that are loaded by LahatCell containers (part of the dashboard component), rather than creating separate HTML files with their own execution context. This approach provides several benefits:

1. **Enhanced Capabilities**: LahatCell (in the dashboard component) provides access to Lahat capabilities when needed
2. **UI Integration**: LahatCell handles all integration with the Lahat UI
3. **Simplified Architecture**: Cleaner separation of concerns with WebComponents focused solely on UI

### Widget Generation Process

The widget generation process works as follows:

1. Claude generates a JavaScript file containing a widget component class that extends the standard HTMLElement
2. The widget code is saved to a JS file in the app's directory
3. The widget is dynamically imported and instantiated within a LahatCell container

### Widget Loading

Widgets are loaded by LahatCell (in the dashboard component) using a straightforward process:

1. LahatCell imports the widget module
2. Registers the custom element if needed
3. Creates and returns an instance of the widget
4. Handles all lifecycle management and event communication

For details on the LahatCell implementation, see the [Dashboard Component Documentation](../../dashboard/docs/index.md).

## Documentation Sections

### [Widget Architecture and Implementation](./widget-architecture-and-implementation.md)
Comprehensive documentation of the widget architecture and current implementation as of March 2025.

## Key Benefits

Implementing this architecture provides several benefits:

1. **Enhanced Maintainability**: Changes to one component don't affect other components
2. **Clean Separation**: WebComponents focus solely on UI while LahatCell handles integration
3. **Simplified Development**: WebComponents can be developed without Lahat-specific knowledge
4. **WebComponent Benefits**: All the advantages of the WebComponent approach (see WebComponent Migration Initiative section)
5. **Improved Modularity**: Self-contained components usable outside of Lahat
6. **Standard-Based**: Uses web standards (Custom Elements, Shadow DOM)
7. **Simplified Security Model**: No need for CSP hashes or complex verification
8. **No CORS Issues**: WebComponents are loaded as local files

## WebComponent Migration Initiative

This initiative aims to make widgets more modular, reusable, and independent from Lahat.

### Documentation

- [**WebComponent Migration Guide**](./webcomponent-migration-guide.md) - Comprehensive migration guide
- [**Migration Architecture**](../../lahat-webcomponent-architecture.md) - Architecture details
- [**Widget Architecture and Implementation**](./widget-architecture-and-implementation.md) - Current implementation details

### Key Benefits

1. **Improved Modularity**: Self-contained components usable outside of Lahat
2. **Standard-Based**: Uses web standards (Custom Elements, Shadow DOM)
3. **Better Separation of Concerns**: Clear separation between layers
4. **Simplified Development**: No Lahat-specific knowledge required

# Lahat WebComponent Architecture

## **Overview**
This document describes the approach for integrating **WebComponents** into **Lahat**, where:
- WebComponents remain **completely independent** and unaware of Lahat.
- **LahatCell** manages WebComponent lifecycle and acts as a **proxy for events**.
- **LahatCell** handles all responsibilities related to step lifecycle, event communication, controller functionality, and UI integration.
- **LahatCell** provides the bridge that makes WebComponents appear integrated with the Lahat UI.
- WebComponents are truly self-contained "black boxes" with no knowledge of Lahat-specific concepts.
- **EventBus** handles global event communication (only if needed).
- No CORS issues since **WebComponents are loaded as local files**.

---

## **🔹 High-Level Architecture**
We separate concerns into **three layers** with clear responsibilities:
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

✅ **Key Benefits**
- **WebComponents are self-contained** → No dependencies, no Lahat-specific knowledge.
- **LahatCell owns the lifecycle** → Ensures reusability and handles all step lifecycle management.
- **LahatCell acts as controller** → Simplifies WebComponents by removing controller logic.
- **LahatCell handles UI integration** → WebComponents don't need to know about Lahat UI.
- **Clear separation of concerns** → WebComponents focus only on UI, LahatCell handles everything else.
- **Simplified security model** → No need for CSP hashes or complex verification.
- **EventBus is optional** → Avoids unnecessary complexity.

---

## **1️⃣ EventBus (Global Pub/Sub)**
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

✅ **Why this works?**  
- **Centralized event management** while keeping WebComponents independent.
- Used **only when needed**, avoiding unnecessary dependencies.

---

## **2️⃣ Sample WebComponent (Independent, Emits DOM Events)**
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
    this.shadowRoot.innerHTML = \`
      <style>
        :host { display: block; padding: 10px; background: #eee; }
      </style>
      <button id="saveBtn">Save Note</button>
    \`;

    this.shadowRoot.querySelector('#saveBtn').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('note-saved', {
        bubbles: true, composed: true, detail: { noteId: Date.now() }
      }));
    });
  }
}

customElements.define('my-widget', MyWidget);
```

✅ **Why this works?**  
- It **emits native `CustomEvent`s**, allowing natural DOM event bubbling.
- Can **be used outside of Lahat** since it has no external dependencies.

---

## **3️⃣ LahatCell (Manages Lifecycle & Relays Events)**
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

```js
// lahat-cell.js
import { eventBus } from './event-bus.js';

class LahatCell extends HTMLElement {
  constructor(componentType) {
    super();
    this.componentType = componentType;
    this.attachShadow({ mode: 'open' });
    this.isEnabled = true;
    this.isVisible = true;
    this.loadComponent();
  }

  loadComponent() {
    this.shadowRoot.innerHTML = \`<\${this.componentType}></\${this.componentType}>\`;
    this.widget = this.shadowRoot.querySelector(this.componentType);
    
    // Listen for events from WebComponent and relay to EventBus
    this.widget.addEventListener('note-saved', (event) => {
      console.log('LahatCell received event:', event.detail);
      eventBus.publish('note-saved', event.detail);
    });
  }

  // Lifecycle management methods
  start(data) {
    // Initialize the component with data
    if (this.widget && typeof this.widget.initialize === 'function') {
      this.widget.initialize(data);
    }
  }

  end() {
    // Clean up the component
    if (this.widget && typeof this.widget.cleanup === 'function') {
      this.widget.cleanup();
    }
  }

  enable() {
    this.isEnabled = true;
    this.updateState();
  }

  disable() {
    this.isEnabled = false;
    this.updateState();
  }

  show() {
    this.isVisible = true;
    this.updateState();
  }

  hide() {
    this.isVisible = false;
    this.updateState();
  }

  updateState() {
    if (!this.widget) return;
    
    // Update visibility
    this.style.display = this.isVisible ? 'block' : 'none';
    
    // Update interactivity (disable/enable)
    if (this.isEnabled) {
      this.widget.removeAttribute('disabled');
      this.style.opacity = '1';
      this.style.pointerEvents = 'auto';
    } else {
      this.widget.setAttribute('disabled', '');
      this.style.opacity = '0.5';
      this.style.pointerEvents = 'none';
    }
  }

  destroy() {
    this.end();
    this.shadowRoot.innerHTML = ''; // Remove component
    this.widget = null;
  }
}

customElements.define('lahat-cell', LahatCell);
```

✅ **Why this works?**  
- Keeps **WebComponents completely independent** with no knowledge of Lahat.
- **LahatCell handles all lifecycle management** that was previously part of the step components.
- **Acts as a controller** by managing state and business logic.
- Handles **loading, lifecycle, and event forwarding**.
- Provides **clear separation of concerns** with WebComponents focused only on UI.

---

## **4️⃣ Example Usage (Adding WebComponents to Lahat)**
Dynamically create a **LahatCell** and subscribe to **global events**.

```js
// index.js
import { eventBus } from './event-bus.js';

document.body.innerHTML = \`<lahat-cell></lahat-cell>\`;

// Subscribe to global events
eventBus.subscribe('note-saved', (data) => {
  console.log('Global EventBus received note-saved event:', data);
});
```

✅ **Why this works?**  
- **LahatCell manages WebComponents**, keeping them reusable.
- **EventBus acts as a global relay**, **only when needed**.

---

## **🔹 Final Architecture**
| Component | Responsibility | Aware of EventBus? | Aware of Lahat? |
|-----------|---------------|-------------------|----------------|
| **EventBus** | Manages global pub/sub | ✅ Yes (but separate) | ❌ No |
| **WebComponent** | Emits DOM events, UI rendering only | ❌ No | ❌ No |
| **LahatCell** | Manages complete component lifecycle, acts as controller, handles all event communication, manages UI integration with Lahat | ✅ Yes | ✅ Yes |

---

## **🚀 Why This is the Best Approach**
✅ **WebComponents stay modular** (they work even outside of Lahat).  
✅ **LahatCell handles complete lifecycle** without adding extra logic to WebComponents.  
✅ **LahatCell acts as controller** simplifying WebComponents by removing controller logic.  
✅ **Step lifecycle is managed by LahatCell** (start, end, disable, enable, hide, show).  
✅ **Event-based communication is handled by LahatCell** keeping WebComponents simple.  
✅ **UI integration is managed by LahatCell** so WebComponents don't need Lahat-specific styling.  
✅ **WebComponents are truly self-contained black boxes** with no knowledge of Lahat.  
✅ **Simplified security model** without CSP hashes or complex verification.  
✅ **EventBus provides global communication** **only if needed**.  
✅ **No `iframe`, No CORS issues**, No extra dependencies!  

Would you like to extend this system to **automatically detect available WebComponents** inside `LahatCell`? 🚀

/**
 * App Manager Renderer Handlers
 * Handles IPC events in the renderer process
 */

/**
 * Set up IPC handlers for the app manager module
 * @param {EventBus} eventBus - The event bus for communication
 */
export function setupRendererHandlers(eventBus) {
  // Check if the IPC API is available
  if (!window.electronAPI) {
    console.warn('Electron IPC API not available. Running in browser mode.');
    return;
  }
  
  // Set up handlers for app loaded events
  window.electronAPI.onAppLoaded((appData) => {
    // Publish the app data to the event bus
    eventBus.publish('app-loaded', appData);
  });
  
  // Set up handlers for component loaded events
  window.electronAPI.onComponentLoaded((componentData) => {
    // Publish the component data to the event bus
    eventBus.publish('component-loaded', componentData);
  });
  
  // Set up handlers for widget added events
  window.electronAPI.onWidgetAdded((widgetData) => {
    // Publish the widget data to the event bus
    eventBus.publish('widget-added', widgetData);
  });
}

/**
 * Load an app by ID
 * @param {string} appId - The app ID
 * @returns {Promise<Object>} - The app data
 */
export async function loadApp(appId) {
  if (!window.electronAPI) {
    // Browser mode - simulate a response
    return {
      success: true,
      appId,
      config: `
        # App metadata
        appName: Sample App
        version: 1.0.0
        description: A sample app for testing
        
        # App layout
        layout:
          type: responsive-grid
          columns: 12
          rowHeight: 50
          gap: 16
        
        # App cells (components)
        cells:
          - id: cell-1
            componentName: sample-component
            position:
              x: 0
              y: 0
            size:
              width: 6
              height: 4
      `
    };
  }
  
  return await window.electronAPI.loadApp(appId);
}

/**
 * Load a component by name
 * @param {string} componentName - The component name
 * @returns {Promise<Object>} - The component data
 */
export async function loadComponent(componentName) {
  if (!window.electronAPI) {
    // Browser mode - simulate a response
    return {
      success: true,
      componentName,
      code: `
        class SampleComponent extends HTMLElement {
          constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.render();
          }
          
          render() {
            this.shadowRoot.innerHTML = \`
              <style>
                :host { display: block; padding: 16px; }
              </style>
              <div>
                <h2>Sample Component</h2>
                <p>This is a sample component for testing.</p>
              </div>
            \`;
          }
        }
        
        customElements.define('sample-component', SampleComponent);
      `,
      metadata: {
        componentName: "sample-component",
        version: "1.0.0",
        description: "A sample component for testing",
        events: []
      }
    };
  }
  
  return await window.electronAPI.loadComponent(componentName);
}

/**
 * Get available widgets
 * @returns {Promise<Array>} - Array of available widgets
 */
export async function getAvailableWidgets() {
  if (!window.electronAPI) {
    // Browser mode - simulate a response
    return {
      success: true,
      widgets: [
        {
          name: "sample-component",
          componentName: "sample-component",
          version: "1.0.0",
          description: "A sample component for testing"
        }
      ]
    };
  }
  
  return await window.electronAPI.getAvailableWidgets();
}

/**
 * Save app layout
 * @param {string} appId - The app ID
 * @param {Object} layout - The layout data
 * @returns {Promise<Object>} - The result
 */
export async function saveAppLayout(appId, layout) {
  if (!window.electronAPI) {
    // Browser mode - simulate a response
    return {
      success: true
    };
  }
  
  return await window.electronAPI.saveAppLayout(appId, layout);
}

/**
 * Create a new widget
 */
export function createNewWidget() {
  if (!window.electronAPI) {
    return;
  }
  
  window.electronAPI.createNewWidget();
}

/**
 * Return to app list
 */
export function returnToAppList() {
  if (!window.electronAPI) {
    return;
  }
  
  window.electronAPI.returnToAppList();
}

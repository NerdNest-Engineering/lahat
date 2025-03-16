import Anthropic from '@anthropic-ai/sdk';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';
import extract from 'extract-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ClaudeClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.anthropic = new Anthropic({
      apiKey: this.apiKey || process.env.ANTHROPIC_API_KEY
    });
    
    this.systemPrompt = `You are an expert web developer specializing in creating self-contained web components using JavaScript. When given a description of an application, you will generate a complete, functional web component implementation.

IMPORTANT GUIDELINES:
1. Your response must be a SINGLE JavaScript file that defines a web component class extending HTMLElement.
2. The web component must use Shadow DOM for encapsulation.
3. All CSS must be included within the component using a <style> tag in the shadow DOM.
4. All functionality must be self-contained within the component class.
5. The component must be fully functional without any external dependencies or network requests.
6. Use modern JavaScript (ES6+) and CSS features.
7. Ensure the UI is clean, intuitive, and responsive.
8. Include appropriate error handling and user feedback.
9. Add comments to explain complex logic or functionality.
10. The component will be loaded in a container that already has a draggable region at the top, so you don't need to add one.

RESPONSE FORMAT:
Your response must be a valid JavaScript file defining a web component class and registering it with customElements.define().

EXAMPLE OUTPUT:
/**
 * Mini App Component
 * Description of what this component does
 */
export class MiniAppComponent extends HTMLElement {
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
    this.shadowRoot.innerHTML = \`
      <style>
        /* Component styles */
        :host {
          display: block;
          font-family: system-ui, sans-serif;
        }
        .container {
          padding: 20px;
        }
      </style>
      <div class="container">
        <!-- Component HTML -->
      </div>
    \`;
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
customElements.define('mini-app-component', MiniAppComponent);`;

    this.appStoragePath = path.join(app.getPath('userData'), 'generated-apps');
    this.ensureAppStorageDirectory();
    this.migrateExistingApps();
  }

  // Migrate existing apps to the new folder structure
  async migrateExistingApps() {
    try {
      console.log('Checking for apps to migrate...');
      const files = await fs.readdir(this.appStoragePath);
      const metaFiles = files.filter(file => file.endsWith('.meta.json'));
      
      if (metaFiles.length === 0) {
        console.log('No apps to migrate');
        return;
      }
      
      console.log(`Found ${metaFiles.length} apps to migrate`);
      
      for (const metaFile of metaFiles) {
        try {
          const metaPath = path.join(this.appStoragePath, metaFile);
          const metaContent = await fs.readFile(metaPath, 'utf-8');
          let metadata;
          
          try {
            metadata = JSON.parse(metaContent);
          } catch (error) {
            console.error(`Error parsing metadata file ${metaFile}:`, error);
            continue;
          }
          
          // Create a folder for this app
          const baseFilename = metaFile.replace('.meta.json', '');
          const folderName = baseFilename;
          const folderPath = path.join(this.appStoragePath, folderName);
          
          console.log(`Migrating app to folder: ${folderPath}`);
          
          // Create the folder
          await fs.mkdir(folderPath, { recursive: true });
          
          // Create assets folder
          await fs.mkdir(path.join(folderPath, 'assets'), { recursive: true });
          
          // Move all versions to the new folder
          if (metadata.versions && Array.isArray(metadata.versions)) {
            for (let i = 0; i < metadata.versions.length; i++) {
              const version = metadata.versions[i];
              const oldPath = path.join(this.appStoragePath, version.filePath);
              
              // For the first version, save as index.html
              // For other versions, save as vX.html
              const newFilename = i === 0 ? 'index.html' : `v${i + 1}.html`;
              const newPath = path.join(folderPath, newFilename);
              
              try {
                // Read the file content
                const content = await fs.readFile(oldPath, 'utf-8');
                
                // Write to the new location
                await fs.writeFile(newPath, content);
                
                // Update the file path in metadata
                version.filePath = newFilename;
                
                // Delete the old file
                await fs.unlink(oldPath).catch(() => {});
              } catch (error) {
                console.error(`Error moving file ${oldPath}:`, error);
              }
            }
          }
          
          // Save the updated metadata to the new location
          await fs.writeFile(
            path.join(folderPath, 'metadata.json'),
            JSON.stringify(metadata, null, 2)
          );
          
          // Delete the old metadata file
          await fs.unlink(metaPath).catch(() => {});
          
          console.log(`Successfully migrated app: ${metadata.name}`);
        } catch (error) {
          console.error(`Error migrating app ${metaFile}:`, error);
        }
      }
      
      console.log('Migration complete');
    } catch (error) {
      console.error('Error migrating apps:', error);
    }
  }

  async ensureAppStorageDirectory() {
    try {
      await fs.mkdir(this.appStoragePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create app storage directory:', error);
    }
  }

  async generateApp(prompt, conversationId = null, customSystemPrompt = null) {
    try {
      // Initialize messages with just the user prompt
      const messages = [
        { role: 'user', content: prompt }
      ];

      // If this is a continuation of a conversation, load previous messages
      if (conversationId) {
        const previousMessages = await this.loadConversation(conversationId);
        if (previousMessages && previousMessages.length > 0) {
          // Filter out any system messages from previous conversations
          const filteredMessages = previousMessages.filter(msg => msg.role !== 'system');
          messages.unshift(...filteredMessages);
        }
      }

      const response = await this.anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // Updated to latest model
        max_tokens: 64000, // Reduced to maximum allowed for this model
        system: customSystemPrompt || this.systemPrompt, // Use custom prompt if provided
        messages,
        stream: true
      });

      return response;
    } catch (error) {
      console.error('Claude API Error details:', error);
      throw new Error(`Claude API Error: ${error.message}`);
    }
  }

  async saveGeneratedApp(appName, componentContent, prompt, conversationId = null) {
    // Create a safe folder name from the app name
    const safeAppName = appName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = Date.now();
    const folderName = `${safeAppName}_${timestamp}`;
    const folderPath = path.join(this.appStoragePath, folderName);
    
    console.log('Saving generated app to folder:', folderPath);
    
    try {
      // Create the app folder
      await fs.mkdir(folderPath, { recursive: true });
      
      // Create assets folder
      await fs.mkdir(path.join(folderPath, 'assets'), { recursive: true });
      
      // Create components folder
      await fs.mkdir(path.join(folderPath, 'components'), { recursive: true });
      
      // Save the component content as a JS file
      const componentName = `${safeAppName}-component.js`;
      const componentFilePath = path.join(folderPath, 'components', componentName);
      await fs.writeFile(componentFilePath, componentContent);
      
      // Copy the base-component.js file
      const baseComponentSrc = path.join(__dirname, 'components', 'core', 'base-component.js');
      const baseComponentDest = path.join(folderPath, 'base-component.js');
      try {
        const baseComponentContent = await fs.readFile(baseComponentSrc, 'utf-8');
        // Create a simplified version without external dependencies
        const simplifiedBaseComponent = `/**
 * Simplified Base component class for mini apps
 * Provides common functionality for web components
 */

export class BaseComponent extends HTMLElement {
  /**
   * Create a new BaseComponent instance
   */
  constructor() {
    super();
    
    // Attach shadow DOM
    this.attachShadow({ mode: 'open' });
    
    // Setup component state
    this._connected = false;
    this._initialized = false;
    this._props = {};
  }
  
  /**
   * Called when the component is first connected to the DOM
   */
  connectedCallback() {
    this._connected = true;
    
    try {
      // Initialize once if not already initialized
      if (!this._initialized) {
        this.initialize();
        this._initialized = true;
      }
      
      // Call connect hook
      this.onConnected();
    } catch (error) {
      console.error(\`Error connecting component \${this.constructor.name}:\`, error);
      this.handleError(error);
    }
  }
  
  /**
   * Called when the component is disconnected from the DOM
   */
  disconnectedCallback() {
    try {
      this._connected = false;
      
      // Call disconnect hook
      this.onDisconnected();
    } catch (error) {
      console.error(\`Error disconnecting component \${this.constructor.name}:\`, error);
    }
  }
  
  /**
   * Initialize component (called once)
   * Override in subclass
   */
  initialize() {
    // Override in subclass
  }
  
  /**
   * Connected callback (called each time component is connected)
   * Override in subclass
   */
  onConnected() {
    // Override in subclass
  }
  
  /**
   * Disconnected callback
   * Override in subclass
   */
  onDisconnected() {
    // Override in subclass
  }
  
  /**
   * Handle component errors
   * @param {Error} error - Error to handle
   */
  handleError(error) {
    console.error(\`Error in component \${this.constructor.name}:\`, error);
    
    // Emit error event for parent components to handle
    this.emit('component-error', {
      error,
      component: this.constructor.name,
      element: this
    });
  }
  
  /**
   * Set a property value
   * @param {string} name - Property name
   * @param {any} value - Property value
   * @returns {any} - Set value (for chaining)
   */
  setProp(name, value) {
    this._props[name] = value;
    
    // Reflect to attribute for primitive values
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      this.setAttribute(\`prop-\${name}\`, value.toString());
    }
    
    return value;
  }
  
  /**
   * Get a property value
   * @param {string} name - Property name
   * @param {any} defaultValue - Default value if property is not set
   * @returns {any} - Property value
   */
  getProp(name, defaultValue = undefined) {
    return this._props[name] !== undefined ? this._props[name] : defaultValue;
  }
  
  /**
   * Helper method to render HTML and CSS in the shadow DOM
   * @param {string} html - HTML template
   * @param {string} styles - CSS styles
   */
  render(html, styles) {
    // Get a reference to rendered content before updating
    // to try to preserve focus and selection where possible
    const activeElement = this.shadowRoot.activeElement;
    const selectionStart = activeElement?.selectionStart;
    const selectionEnd = activeElement?.selectionEnd;
    
    // Update shadow DOM content
    this.shadowRoot.innerHTML = \`
      <style>\${styles}</style>
      \${html}
    \`;
    
    // Try to restore focus and selection if possible
    if (activeElement) {
      const newElement = this.shadowRoot.querySelector(\`#\${activeElement.id}\`);
      if (newElement && typeof newElement.focus === 'function') {
        newElement.focus();
        if (typeof newElement.setSelectionRange === 'function' && 
            selectionStart !== undefined && 
            selectionEnd !== undefined) {
          newElement.setSelectionRange(selectionStart, selectionEnd);
        }
      }
    }
  }
  
  /**
   * Helper to dispatch custom events
   * @param {string} eventName - Name of the event to dispatch
   * @param {Object} detail - Event detail object
   * @returns {boolean} - Whether the event was canceled
   */
  emit(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      bubbles: true,
      composed: true,
      detail
    });
    return this.dispatchEvent(event);
  }
  
  /**
   * Get a reference to an element in the shadow DOM
   * @param {string} selector - CSS selector
   * @returns {Element} - Element or null if not found
   */
  $(selector) {
    return this.shadowRoot.querySelector(selector);
  }
  
  /**
   * Get all elements matching a selector in the shadow DOM
   * @param {string} selector - CSS selector
   * @returns {NodeList} - NodeList of matching elements
   */
  $$(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }
  
  /**
   * Check if this component is connected to the DOM
   * @returns {boolean} - True if connected
   */
  get isConnected() {
    return this._connected;
  }
  
  /**
   * Get all current props
   * @returns {Object} - Props object
   */
  get props() {
    return { ...this._props };
  }
}`;
        await fs.writeFile(baseComponentDest, simplifiedBaseComponent);
      } catch (error) {
        console.error('Error copying base-component.js:', error);
      }
      
      // Copy the mini-app-container.js file
      const miniAppContainerSrc = path.join(__dirname, 'components', 'mini-app', 'mini-app-container.js');
      const miniAppContainerDest = path.join(folderPath, 'mini-app-container.js');
      try {
        const miniAppContainerContent = await fs.readFile(miniAppContainerSrc, 'utf-8');
        // Create a simplified version that uses the local base-component.js
        const simplifiedMiniAppContainer = `/**
 * Mini App Container Component
 * A standard container for hosting generated mini app web components
 */

import { BaseComponent } from './base-component.js';

/**
 * Mini App Container
 * Provides a standardized environment for loading and running mini app components
 * @extends BaseComponent
 */
export class MiniAppContainer extends BaseComponent {
  /**
   * Create a new MiniAppContainer
   */
  constructor() {
    super();
    
    // Initialize state
    this._loadedComponent = null;
    this._componentInstance = null;
    
    // Create base HTML structure
    this.render(\`
      <div class="mini-app-container">
        <div class="mini-app-content">
          <!-- Mini app component will be loaded here -->
        </div>
      </div>
    \`, \`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      
      .mini-app-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding-top: 38px; /* Space for the drag region */
        box-sizing: border-box;
      }
      
      .mini-app-content {
        flex: 1;
        overflow: auto;
        position: relative;
      }
    \`);
  }
  
  /**
   * Load a component into the container
   * @param {Class} ComponentClass - The component class to load
   * @param {Object} props - Optional props to pass to the component
   * @returns {HTMLElement} - The instantiated component
   */
  loadComponent(ComponentClass, props = {}) {
    // Store reference to the component class
    this._loadedComponent = ComponentClass;
    
    // Get the content container
    const contentContainer = this.$('.mini-app-content');
    
    // Clear any existing content
    contentContainer.innerHTML = '';
    
    try {
      // Register the component if it's not already registered
      const tagName = this._getTagNameFromClass(ComponentClass);
      
      if (!customElements.get(tagName)) {
        customElements.define(tagName, ComponentClass);
      }
      
      // Create an instance of the component
      const instance = document.createElement(tagName);
      this._componentInstance = instance;
      
      // Set props if provided
      Object.entries(props).forEach(([key, value]) => {
        if (typeof instance.setProp === 'function') {
          instance.setProp(key, value);
        } else {
          // Fallback for non-BaseComponent components
          instance[key] = value;
        }
      });
      
      // Add the component to the container
      contentContainer.appendChild(instance);
      
      return instance;
    } catch (error) {
      console.error('Error loading component:', error);
      this.handleError(error);
      return null;
    }
  }
  
  /**
   * Get the loaded component instance
   * @returns {HTMLElement|null} - The component instance or null if not loaded
   */
  getComponentInstance() {
    return this._componentInstance;
  }
  
  /**
   * Generate a tag name from a component class
   * @param {Class} ComponentClass - The component class
   * @returns {string} - A valid tag name for the component
   * @private
   */
  _getTagNameFromClass(ComponentClass) {
    // Try to get the name from the component's static tagName property
    if (ComponentClass.tagName) {
      return ComponentClass.tagName;
    }
    
    // Generate a tag name from the class name
    let tagName = ComponentClass.name
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
    
    // Ensure the tag name contains a hyphen (required for custom elements)
    if (!tagName.includes('-')) {
      tagName = \`mini-app-\${tagName}\`;
    }
    
    return tagName;
  }
}

// Register the component
customElements.define('mini-app-container', MiniAppContainer);`;
        await fs.writeFile(miniAppContainerDest, simplifiedMiniAppContainer);
      } catch (error) {
        console.error('Error copying mini-app-container.js:', error);
      }
      
      // Copy CSS files
      const stylesSrc = path.join(__dirname, 'styles.css');
      const stylesDest = path.join(folderPath, 'styles.css');
      try {
        const stylesContent = await fs.readFile(stylesSrc, 'utf-8');
        // Create a simplified version with only the essential styles
        const simplifiedStyles = `/* Base Styles */
:root {
  --primary-color: #4285f4;
  --primary-dark: #3367d6;
  --secondary-color: #34a853;
  --danger-color: #ea4335;
  --warning-color: #fbbc05;
  --light-gray: #f8f9fa;
  --medium-gray: #e0e0e0;
  --dark-gray: #5f6368;
  --border-radius: 8px;
  --shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  --drag-region-height: 38px; /* Height for the draggable region */
}

/* Draggable region for window dragging */
.drag-region {
  height: var(--drag-region-height);
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  -webkit-app-region: drag;
  z-index: 1000; /* Ensure it's above other content */
}

/* Ensure elements inside the drag region aren't draggable */
.drag-region * {
  -webkit-app-region: no-drag;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  background: white;
  color: #202124;
}

h1, h2, h3 {
  font-weight: normal;
  margin-top: 0;
}

h1 {
  font-size: 28px;
  margin-bottom: 10px;
}

h2 {
  font-size: 20px;
  margin-bottom: 15px;
}

h3 {
  font-size: 18px;
  margin-bottom: 10px;
}

button {
  padding: 10px 20px;
  font-size: 14px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

button:hover {
  background: var(--primary-dark);
}

button:active {
  transform: scale(0.98);
}

button.secondary {
  background: var(--light-gray);
  color: var(--dark-gray);
  border: 1px solid var(--medium-gray);
}

button.secondary:hover {
  background: var(--medium-gray);
}

button.danger {
  background: var(--danger-color);
}

button.danger:hover {
  background: #d32f2f;
}

input, textarea {
  padding: 12px;
  font-size: 14px;
  border: 2px solid var(--medium-gray);
  border-radius: var(--border-radius);
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
}

input:focus, textarea:focus {
  border-color: var(--primary-color);
}

textarea {
  resize: vertical;
  min-height: 80px;
}

.hidden {
  display: none !important;
}`;
        await fs.writeFile(stylesDest, simplifiedStyles);
      } catch (error) {
        console.error('Error copying styles.css:', error);
      }
      
      // Create fonts.css
      const fontsDest = path.join(folderPath, 'fonts.css');
      try {
        // Create fonts directory
        await fs.mkdir(path.join(folderPath, 'fonts'), { recursive: true });
        
        // Copy font files if needed
        const fontSrc = path.join(__dirname, 'fonts', 'NotoSansTagalog-Regular.ttf');
        const fontDest = path.join(folderPath, 'fonts', 'NotoSansTagalog-Regular.ttf');
        try {
          await fs.copyFile(fontSrc, fontDest);
        } catch (fontError) {
          console.error('Error copying font file:', fontError);
        }
        
        // Create a simple fonts.css
        const fontsContent = `/* Font Declarations */

@font-face {
  font-family: 'Noto Sans Tagalog';
  src: url('./fonts/NotoSansTagalog-Regular.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

/* Utility class for Tagalog text */
.tagalog-text {
  font-family: 'Noto Sans Tagalog', sans-serif;
}`;
        await fs.writeFile(fontsDest, fontsContent);
      } catch (error) {
        console.error('Error creating fonts.css:', error);
      }
      
      // Read the template HTML file
      const templatePath = path.join(__dirname, 'templates', 'mini-app-template.html');
      let templateContent;
      
      try {
        templateContent = await fs.readFile(templatePath, 'utf-8');
      } catch (error) {
        console.error('Error reading template file:', error);
        // Create a basic template if the file doesn't exist
        templateContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mini App</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
    }
    
    .drag-region {
      height: 38px;
      width: 100%;
      position: fixed;
      top: 0;
      left: 0;
      -webkit-app-region: drag;
      z-index: 1000;
    }
    
    #app-container {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div class="drag-region"></div>
  <mini-app-container id="app-container"></mini-app-container>
  
  <script type="module">
    import { MiniAppContainer } from '../components/mini-app/mini-app-container.js';
    import { MINI_APP_COMPONENT } from './MINI_APP_PATH';
    
    document.addEventListener('DOMContentLoaded', () => {
      const container = document.getElementById('app-container');
      container.loadComponent(MINI_APP_COMPONENT);
    });
  </script>
</body>
</html>`;
      }
      
      // Replace the placeholder with the actual component path
      const relativePath = `./components/${componentName}`;
      const componentImportName = this._getComponentImportName(componentContent);
      
      templateContent = templateContent.replace('./MINI_APP_PATH', relativePath);
      templateContent = templateContent.replace('MINI_APP_COMPONENT', componentImportName);
      
      // Save the HTML file
      const htmlFilePath = path.join(folderPath, 'index.html');
      await fs.writeFile(htmlFilePath, templateContent);
      
      // Create metadata
      const metadata = {
        name: appName,
        created: new Date().toISOString(),
        prompt,
        conversationId: conversationId || `conv_${timestamp}`,
        versions: [
          {
            timestamp,
            filePath: 'index.html', // Main HTML file
            componentFilePath: `components/${componentName}` // Component file
          }
        ],
        isWebComponent: true // Flag to indicate this is a web component app
      };
      
      // Save metadata
      const metadataPath = path.join(folderPath, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      return {
        folderName,
        filePath: htmlFilePath,
        componentFilePath: componentFilePath,
        folderPath,
        metadata
      };
    } catch (error) {
      throw new Error(`Failed to save generated app: ${error.message}`);
    }
  }

  async loadConversation(conversationId) {
    try {
      // Get all folders in the app storage directory
      const items = await fs.readdir(this.appStoragePath, { withFileTypes: true });
      const folders = items.filter(item => item.isDirectory()).map(item => item.name);
      
      for (const folder of folders) {
        const metadataPath = path.join(this.appStoragePath, folder, 'metadata.json');
        
        try {
          // Check if metadata file exists
          await fs.access(metadataPath);
          
          // Read and parse metadata
          const metaContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metaContent);
          
          if (metadata.conversationId === conversationId) {
            // Reconstruct conversation from metadata
            const messages = [
              { role: 'user', content: metadata.prompt },
              { 
                role: 'assistant', 
                content: await fs.readFile(
                  path.join(this.appStoragePath, folder, metadata.versions[0].filePath), 
                  'utf-8'
                ) 
              }
            ];
            
            // Add any additional messages from iterations
            for (let i = 1; i < metadata.versions.length; i++) {
              if (metadata.versions[i].prompt) {
                messages.push({ role: 'user', content: metadata.versions[i].prompt });
                messages.push({ 
                  role: 'assistant', 
                  content: await fs.readFile(
                    path.join(this.appStoragePath, folder, metadata.versions[i].filePath), 
                    'utf-8'
                  )
                });
              }
            }
            
            return messages;
          }
        } catch (error) {
          // Skip folders without valid metadata
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load conversation:', error);
      return null;
    }
  }

  async listGeneratedApps() {
    try {
      // Get all folders in the app storage directory
      const items = await fs.readdir(this.appStoragePath, { withFileTypes: true });
      const folders = items.filter(item => item.isDirectory()).map(item => item.name);
      const apps = [];
      
      for (const folder of folders) {
        const metadataPath = path.join(this.appStoragePath, folder, 'metadata.json');
        
        try {
          // Check if metadata file exists
          await fs.access(metadataPath);
          
          // Read and parse metadata
          const metaContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metaContent);
          
          // Get the latest version file path
          const latestVersion = metadata.versions[metadata.versions.length - 1];
          const latestFilePath = path.join(this.appStoragePath, folder, latestVersion.filePath);
          
          apps.push({
            id: metadata.conversationId,
            name: metadata.name,
            created: metadata.created,
            filePath: latestFilePath,
            folderPath: path.join(this.appStoragePath, folder),
            versions: metadata.versions.length
          });
        } catch (error) {
          // Skip folders without valid metadata
          continue;
        }
      }
      
      // Sort by creation date (newest first)
      return apps.sort((a, b) => new Date(b.created) - new Date(a.created));
    } catch (error) {
      console.error('Failed to list generated apps:', error);
      return [];
    }
  }

  async updateGeneratedApp(conversationId, prompt, componentContent) {
    try {
      // Get all folders in the app storage directory
      const items = await fs.readdir(this.appStoragePath, { withFileTypes: true });
      const folders = items.filter(item => item.isDirectory()).map(item => item.name);
      
      for (const folder of folders) {
        const metadataPath = path.join(this.appStoragePath, folder, 'metadata.json');
        
        try {
          // Check if metadata file exists
          await fs.access(metadataPath);
          
          // Read and parse metadata
          const metaContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metaContent);
          
          if (metadata.conversationId === conversationId) {
            // Create a new version
            const timestamp = Date.now();
            const versionNumber = metadata.versions.length + 1;
            
            // Create version-specific filenames
            const versionHtmlFilename = `v${versionNumber}.html`;
            const versionHtmlPath = path.join(this.appStoragePath, folder, versionHtmlFilename);
            
            // Create components directory if it doesn't exist
            const componentsDir = path.join(this.appStoragePath, folder, 'components');
            await fs.mkdir(componentsDir, { recursive: true });
            
            // Create a version-specific component filename
            const safeAppName = metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const versionComponentFilename = `${safeAppName}-component-v${versionNumber}.js`;
            const versionComponentPath = path.join(componentsDir, versionComponentFilename);
            
            console.log('Updating app, saving component to:', versionComponentPath);
            
            // Save the new component version
            await fs.writeFile(versionComponentPath, componentContent);
            
            // Read the template HTML file
            const templatePath = path.join(__dirname, 'templates', 'mini-app-template.html');
            let templateContent;
            
            try {
              templateContent = await fs.readFile(templatePath, 'utf-8');
            } catch (error) {
              console.error('Error reading template file:', error);
              // Create a basic template if the file doesn't exist
              templateContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mini App</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
    }
    
    .drag-region {
      height: 38px;
      width: 100%;
      position: fixed;
      top: 0;
      left: 0;
      -webkit-app-region: drag;
      z-index: 1000;
    }
    
    #app-container {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div class="drag-region"></div>
  <mini-app-container id="app-container"></mini-app-container>
  
  <script type="module">
    import { MiniAppContainer } from '../components/mini-app/mini-app-container.js';
    import { MINI_APP_COMPONENT } from './MINI_APP_PATH';
    
    document.addEventListener('DOMContentLoaded', () => {
      const container = document.getElementById('app-container');
      container.loadComponent(MINI_APP_COMPONENT);
    });
  </script>
</body>
</html>`;
            }
            
            // Replace the placeholder with the actual component path
            const relativePath = `./components/${versionComponentFilename}`;
            const componentImportName = this._getComponentImportName(componentContent);
            
            templateContent = templateContent.replace('./MINI_APP_PATH', relativePath);
            templateContent = templateContent.replace('MINI_APP_COMPONENT', componentImportName);
            
            // Make sure the template uses local paths
            templateContent = templateContent.replace(/href="\.\.\/styles\.css"/, 'href="./styles.css"');
            templateContent = templateContent.replace(/href="\.\.\/styles\/fonts\.css"/, 'href="./fonts.css"');
            templateContent = templateContent.replace(/import\s*{\s*MiniAppContainer\s*}\s*from\s*['"]\.\.\/components\/mini-app\/mini-app-container\.js['"]/, 'import { MiniAppContainer } from \'./mini-app-container.js\'');
            
            // Save the HTML file
            await fs.writeFile(versionHtmlPath, templateContent);
            
            // Update metadata
            metadata.versions.push({
              timestamp,
              filePath: versionHtmlFilename,
              componentFilePath: `components/${versionComponentFilename}`,
              prompt
            });
            
            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
            
            return {
              conversationId,
              filePath: versionHtmlPath,
              componentFilePath: path.join(this.appStoragePath, folder, 'components', versionComponentFilename),
              folderPath: path.join(this.appStoragePath, folder),
              versionNumber
            };
          }
        } catch (error) {
          // Skip folders without valid metadata
          continue;
        }
      }
      
      throw new Error(`App with conversation ID ${conversationId} not found`);
    } catch (error) {
      throw new Error(`Failed to update generated app: ${error.message}`);
    }
  }

  async deleteGeneratedApp(conversationId) {
    try {
      // Get all folders in the app storage directory
      const items = await fs.readdir(this.appStoragePath, { withFileTypes: true });
      const folders = items.filter(item => item.isDirectory()).map(item => item.name);
      
      for (const folder of folders) {
        const metadataPath = path.join(this.appStoragePath, folder, 'metadata.json');
        
        try {
          // Check if metadata file exists
          await fs.access(metadataPath);
          
          // Read and parse metadata
          const metaContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metaContent);
          
          if (metadata.conversationId === conversationId) {
            // Delete the entire folder
            const folderPath = path.join(this.appStoragePath, folder);
            
            // Get all files in the folder
            const folderFiles = await fs.readdir(folderPath);
            
            // Delete each file
            for (const file of folderFiles) {
              await fs.unlink(path.join(folderPath, file)).catch(() => {});
            }
            
            // Delete any subdirectories
            const subItems = await fs.readdir(folderPath, { withFileTypes: true });
            const subDirs = subItems.filter(item => item.isDirectory()).map(item => item.name);
            
            for (const subDir of subDirs) {
              const subDirPath = path.join(folderPath, subDir);
              const subFiles = await fs.readdir(subDirPath);
              
              // Delete files in subdirectory
              for (const file of subFiles) {
                await fs.unlink(path.join(subDirPath, file)).catch(() => {});
              }
              
              // Remove subdirectory
              await fs.rmdir(subDirPath).catch(() => {});
            }
            
            // Remove the main folder
            await fs.rmdir(folderPath).catch(() => {});
            
            return true;
          }
        } catch (error) {
          // Skip folders without valid metadata
          continue;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to delete generated app:', error);
      return false;
    }
  }
  
  /**
   * Export a mini app as a zip package
   * @param {string} conversationId - ID of the mini app to export
   * @param {string} outputPath - Path to save the zip file (optional)
   * @returns {Promise<Object>} - Result object with success flag and file path
   */
  async exportMiniAppAsPackage(conversationId, outputPath = null) {
    try {
      // Find the app folder
      const items = await fs.readdir(this.appStoragePath, { withFileTypes: true });
      const folders = items.filter(item => item.isDirectory()).map(item => item.name);
      let appFolder = null;
      let metadata = null;
      
      for (const folder of folders) {
        const metadataPath = path.join(this.appStoragePath, folder, 'metadata.json');
        
        try {
          // Check if metadata file exists
          await fs.access(metadataPath);
          
          // Read and parse metadata
          const metaContent = await fs.readFile(metadataPath, 'utf-8');
          const parsedMetadata = JSON.parse(metaContent);
          
          if (parsedMetadata.conversationId === conversationId) {
            appFolder = folder;
            metadata = parsedMetadata;
            break;
          }
        } catch (error) {
          // Skip folders without valid metadata
          continue;
        }
      }
      
      if (!appFolder || !metadata) {
        throw new Error(`App with conversation ID ${conversationId} not found`);
      }
      
      // Create a safe filename for the zip
      const safeAppName = metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const zipFilename = outputPath || path.join(app.getPath('downloads'), `${safeAppName}_package.zip`);
      
      // Create a zip file
      const output = createWriteStream(zipFilename);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });
      
      // Pipe the archive to the output file
      archive.pipe(output);
      
      // Add the entire app folder to the zip
      const folderPath = path.join(this.appStoragePath, appFolder);
      archive.directory(folderPath, false);
      
      // Finalize the archive
      await archive.finalize();
      
      return {
        success: true,
        filePath: zipFilename
      };
    } catch (error) {
      console.error('Failed to export mini app as package:', error);
      return {
        success: false,
        error: `Failed to export mini app: ${error.message}`
      };
    }
  }
  
  /**
   * Import a mini app from a zip package
   * @param {string} zipFilePath - Path to the zip file
   * @returns {Promise<Object>} - Result object with success flag and app info
   */
  async importMiniAppPackage(zipFilePath) {
    try {
      // Create a temporary directory for extraction
      const tempDir = path.join(app.getPath('temp'), `import_${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
      
      // Extract the zip file
      await extract(zipFilePath, { dir: tempDir });
      
      // Check for metadata.json
      const metadataPath = path.join(tempDir, 'metadata.json');
      
      try {
        await fs.access(metadataPath);
      } catch (error) {
        throw new Error('Invalid mini app package: metadata.json not found');
      }
      
      // Read and validate metadata
      const metaContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metaContent);
      
      if (!metadata.name || !metadata.conversationId || !metadata.versions || !Array.isArray(metadata.versions)) {
        throw new Error('Invalid metadata format in package');
      }
      
      // Create a new folder in the app storage directory
      const safeAppName = metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const timestamp = Date.now();
      const folderName = `${safeAppName}_${timestamp}`;
      const folderPath = path.join(this.appStoragePath, folderName);
      
      // Create the folder
      await fs.mkdir(folderPath, { recursive: true });
      
      // Create assets folder
      await fs.mkdir(path.join(folderPath, 'assets'), { recursive: true });
      
      // Copy all files from temp directory to the new folder
      const files = await fs.readdir(tempDir);
      
      for (const file of files) {
        if (file === 'assets') {
          // Handle assets directory separately
          const assetFiles = await fs.readdir(path.join(tempDir, 'assets'));
          for (const assetFile of assetFiles) {
            const srcPath = path.join(tempDir, 'assets', assetFile);
            const destPath = path.join(folderPath, 'assets', assetFile);
            await fs.copyFile(srcPath, destPath);
          }
        } else {
          const srcPath = path.join(tempDir, file);
          const destPath = path.join(folderPath, file);
          
          // Check if it's a directory
          const stat = await fs.stat(srcPath);
          if (stat.isDirectory() && file !== 'assets') {
            // Create the directory
            await fs.mkdir(destPath, { recursive: true });
            
            // Copy all files in the directory
            const subFiles = await fs.readdir(srcPath);
            for (const subFile of subFiles) {
              const subSrcPath = path.join(srcPath, subFile);
              const subDestPath = path.join(destPath, subFile);
              await fs.copyFile(subSrcPath, subDestPath);
            }
          } else if (stat.isFile()) {
            // Copy the file
            await fs.copyFile(srcPath, destPath);
          }
        }
      }
      
      // Update the metadata with a new conversation ID to avoid conflicts
      metadata.conversationId = `conv_imported_${timestamp}`;
      
      // Save the updated metadata
      await fs.writeFile(
        path.join(folderPath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      // Clean up temp directory
      await this.deleteDirectory(tempDir);
      
      return {
        success: true,
        appId: metadata.conversationId,
        name: metadata.name,
        filePath: path.join(folderPath, 'index.html'),
        folderPath
      };
    } catch (error) {
      console.error('Failed to import mini app package:', error);
      return {
        success: false,
        error: `Failed to import mini app: ${error.message}`
      };
    }
  }
  
  /**
   * Extract the component class name from the generated code
   * @param {string} componentContent - The generated component code
   * @returns {string} - The component class name
   * @private
   */
  _getComponentImportName(componentContent) {
    // Try to find the export class declaration
    const exportClassMatch = componentContent.match(/export\s+class\s+(\w+)/);
    if (exportClassMatch && exportClassMatch[1]) {
      return exportClassMatch[1];
    }
    
    // Try to find the customElements.define declaration
    const defineMatch = componentContent.match(/customElements\.define\(['"][\w-]+['"],\s*(\w+)/);
    if (defineMatch && defineMatch[1]) {
      return defineMatch[1];
    }
    
    // Default to a generic name if we can't find the class name
    return 'MiniAppComponent';
  }
  
  /**
   * Helper method to recursively delete a directory
   * @param {string} dirPath - Path to the directory
   */
  async deleteDirectory(dirPath) {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          await this.deleteDirectory(itemPath);
        } else {
          await fs.unlink(itemPath).catch(() => {});
        }
      }
      
      await fs.rmdir(dirPath).catch(() => {});
    } catch (error) {
      console.error(`Error deleting directory ${dirPath}:`, error);
    }
  }
}

export default ClaudeClient;

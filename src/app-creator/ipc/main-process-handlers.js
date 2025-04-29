/**
 * App Creator Main Process Handlers
 * Handles IPC events from the renderer process in the main process
 */

const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const store = require('../../store');

// Import Claude client
let claudeClient;
try {
  claudeClient = require('../../claudeClient');
} catch (error) {
  console.error('Failed to import Claude client:', error);
}

/**
 * Register IPC handlers for the app creator module
 */
function registerAppCreationHandlers() {
  // Check if API key is set
  ipcMain.handle('claude:check-api-key', async () => {
    try {
      const apiKey = store.get('claude.apiKey');
      return {
        hasApiKey: !!apiKey,
        apiKey: apiKey
      };
    } catch (error) {
      console.error('Error checking API key:', error);
      return {
        hasApiKey: false,
        error: error.message
      };
    }
  });
  
  // Generate title and description
  ipcMain.handle('claude:generate-title-description', async (event, options) => {
    try {
      const { input } = options;
      
      if (!claudeClient) {
        throw new Error('Claude client not available');
      }
      
      // Get the sender window
      const senderWindow = event.sender.getOwnerBrowserWindow();
      
      // Create a prompt for generating title and description
      const prompt = `
        You are an expert app designer. Your task is to generate a title and description for an app based on the user's input.
        
        User Input: ${input}
        
        Generate a concise title and a detailed description for this app. The title should be clear and descriptive.
        The description should explain what the app does and its key features.
        
        Format your response as a JSON object with "title" and "description" fields.
        
        Example:
        {
          "title": "Task Master Pro",
          "description": "A productivity app that helps users manage their tasks with categories, priorities, and due dates. Features include task sorting, filtering, reminders, and progress tracking."
        }
      `;
      
      // Set up streaming response
      const onChunk = (chunk) => {
        if (senderWindow && !senderWindow.isDestroyed()) {
          senderWindow.webContents.send('claude:title-description-chunk', chunk);
        }
      };
      
      // Generate title and description
      const response = await claudeClient.generateTitleAndDescription(prompt, onChunk);
      
      return {
        success: true,
        ...response
      };
    } catch (error) {
      console.error('Error generating title and description:', error);
      return {
        success: false,
        error: error?.message || 'An unknown error occurred during title/description generation.'
      };
    }
  });
  
  // Generate widget
  ipcMain.handle('claude:generate-widget', async (event, options) => {
    try {
      const { appName, prompt } = options;
      
      if (!claudeClient) {
        throw new Error('Claude client not available');
      }
      
      // Get the sender window
      const senderWindow = event.sender.getOwnerBrowserWindow();
      
      // Create a prompt for generating the widget
      const widgetPrompt = `
        You are an expert web component developer. Your task is to create a self-contained web component based on the user's description.
        
        App Name: ${appName}
        Description: ${prompt}
        
        Create a web component that implements this app. The component should:
        1. Extend HTMLElement
        2. Use Shadow DOM for encapsulation
        3. Be completely self-contained with all styles and functionality
        4. Use standard DOM events for communication (CustomEvent with bubbles: true, composed: true)
        5. Not have any external dependencies
        
        Format your response as JavaScript code for the web component.
        
        Example:
        // COMPONENT: TaskManager
        class TaskManager extends HTMLElement {
          constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this._tasks = [];
            this.render();
          }
          
          // Rest of the component implementation...
        }
        
        customElements.define('task-manager', TaskManager);
      `;
      
      // Set up streaming response
      const onChunk = (chunk) => {
        if (senderWindow && !senderWindow.isDestroyed()) {
          senderWindow.webContents.send('claude:generation-chunk', chunk);
        }
      };
      
      // Generate widget
      const { code, metadata } = await claudeClient.generateWidget(widgetPrompt, onChunk);
      
      // Save the widget
      const widgetName = appName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const componentsDir = path.join(process.env.COMPONENTS_DIR || './components', widgetName);
      
      // Create the components directory if it doesn't exist
      if (!fs.existsSync(componentsDir)) {
        fs.mkdirSync(componentsDir, { recursive: true });
      }
      
      // Save the component code
      fs.writeFileSync(path.join(componentsDir, 'index.js'), code);
      
      // Save the metadata
      fs.writeFileSync(path.join(componentsDir, 'meta.json'), JSON.stringify(metadata, null, 2));
      
      return {
        success: true,
        widgetName,
        componentsDir
      };
    } catch (error) {
      console.error('Error generating widget:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
}

module.exports = {
  registerAppCreationHandlers
};

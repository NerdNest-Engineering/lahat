/**
 * Claude Service
 * Handles communication with the Claude API
 */

import { logError, ErrorLevel } from '../utils/error-utils.js';

/**
 * Claude Service
 * Handles communication with the Claude API
 */
export class ClaudeService {
  /**
   * Create a new ClaudeService
   * @param {EventBus} eventBus - The event bus for communication
   */
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.apiKey = null;
    this.isElectron = typeof window !== 'undefined' && window.electronAPI;
  }
  
  /**
   * Initialize the service
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    try {
      if (this.isElectron) {
        // Check if API key is set
        const { hasApiKey, apiKey } = await window.electronAPI.checkApiKey();
        
        if (hasApiKey) {
          this.apiKey = apiKey;
          return true;
        } else {
          return false;
        }
      } else {
        // Browser mode - API key would be provided by the user
        return false;
      }
    } catch (error) {
      logError('ClaudeService.initialize', error, ErrorLevel.ERROR);
      return false;
    }
  }
  
  /**
   * Generate title and description
   * @param {string} prompt - The user prompt
   * @param {Function} onChunk - Callback for receiving chunks
   * @returns {Promise<Object>} - The generation result
   */
  async generateTitleAndDescription(prompt, onChunk) {
    try {
      if (this.isElectron) {
        // Use Electron IPC
        return await window.electronAPI.generateTitleAndDescription({
          input: prompt
        });
      } else {
        // Browser mode - direct API call
        // This is a placeholder - in a real app, you would implement this
        
        // Simulate streaming response
        if (onChunk) {
          // First chunk
          setTimeout(() => {
            onChunk({
              content: JSON.stringify({
                title: 'Generated Title',
                description: ''
              }),
              done: false
            });
          }, 500);
          
          // Second chunk
          setTimeout(() => {
            onChunk({
              content: JSON.stringify({
                title: 'Generated Title',
                description: 'Generated description part 1'
              }),
              done: false
            });
          }, 1500);
          
          // Final chunk
          setTimeout(() => {
            onChunk({
              content: JSON.stringify({
                title: 'Generated Title',
                description: 'Generated description part 1. Generated description part 2.'
              }),
              done: true
            });
          }, 2500);
        }
        
        // Return success
        return {
          success: true,
          title: 'Generated Title',
          description: 'Generated description part 1. Generated description part 2.'
        };
      }
    } catch (error) {
      logError('ClaudeService.generateTitleAndDescription', error, ErrorLevel.ERROR);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Generate app
   * @param {string} title - The app title
   * @param {string} description - The app description
   * @param {Function} onChunk - Callback for receiving chunks
   * @returns {Promise<Object>} - The generation result
   */
  async generateApp(title, description, onChunk) {
    try {
      if (this.isElectron) {
        // Use Electron IPC
        return await window.electronAPI.generateWidget({
          appName: title,
          prompt: description
        });
      } else {
        // Browser mode - direct API call
        // This is a placeholder - in a real app, you would implement this
        
        // Simulate streaming response
        if (onChunk) {
          // First chunk
          setTimeout(() => {
            onChunk({
              content: '// COMPONENT: App\nclass App extends HTMLElement {\n  constructor() {\n    super();\n',
              done: false
            });
          }, 500);
          
          // Second chunk
          setTimeout(() => {
            onChunk({
              content: '    this.attachShadow({ mode: "open" });\n    this.render();\n  }\n\n  render() {\n',
              done: false
            });
          }, 1500);
          
          // Third chunk
          setTimeout(() => {
            onChunk({
              content: '    this.shadowRoot.innerHTML = `\n      <style>\n        :host { display: block; }\n      </style>\n      <div>\n        <h1>${title}</h1>\n        <p>${description}</p>\n      </div>\n    `;\n  }\n}\n\ncustomElements.define("app-component", App);',
              done: true
            });
          }, 2500);
        }
        
        // Return success
        return {
          success: true
        };
      }
    } catch (error) {
      logError('ClaudeService.generateApp', error, ErrorLevel.ERROR);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Set the API key
   * @param {string} apiKey - The API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }
  
  /**
   * Check if the API key is set
   * @returns {boolean} - Whether the API key is set
   */
  hasApiKey() {
    return !!this.apiKey;
  }
}

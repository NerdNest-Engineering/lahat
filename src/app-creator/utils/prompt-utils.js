/**
 * Prompt Utilities
 * Utility functions for prompt engineering
 */

/**
 * Create a prompt for generating a title and description
 * @param {string} input - The user input
 * @returns {string} - The prompt
 */
export function createTitleDescriptionPrompt(input) {
  return `
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
}

/**
 * Create a prompt for generating a web component
 * @param {string} appName - The app name
 * @param {string} description - The app description
 * @returns {string} - The prompt
 */
export function createWebComponentPrompt(appName, description) {
  return `
    You are an expert web component developer. Your task is to create a self-contained web component based on the user's description.
    
    App Name: ${appName}
    Description: ${description}
    
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
}

/**
 * Create a prompt for analyzing component requirements
 * @param {string} appName - The app name
 * @param {string} description - The app description
 * @returns {string} - The prompt
 */
export function createComponentAnalysisPrompt(appName, description) {
  return `
    You are an expert software architect. Your task is to analyze the requirements for an app and identify logical UI and functional boundaries for component separation.
    
    App Name: ${appName}
    Description: ${description}
    
    Analyze the app requirements and identify:
    1. The core functionality needed in the application
    2. Potential reusable patterns and components
    3. Logical UI and functional boundaries for component separation
    
    Format your response as a JSON object with the following structure:
    {
      "components": [
        {
          "name": "ComponentName",
          "responsibility": "Description of what this component does",
          "ui": "Description of the UI elements in this component",
          "functionality": "Description of the functionality in this component",
          "events": [
            {
              "name": "event-name",
              "description": "Description of when this event is emitted",
              "data": "Description of the data included in this event"
            }
          ]
        }
      ]
    }
  `;
}

/**
 * Create a prompt for defining component structure
 * @param {Object} analysisResult - The result of the component analysis
 * @returns {string} - The prompt
 */
export function createComponentStructurePrompt(analysisResult) {
  return `
    You are an expert software architect. Your task is to define the optimal structure of web components based on the component analysis.
    
    Component Analysis:
    ${JSON.stringify(analysisResult, null, 2)}
    
    Define the optimal structure of web components for this app. Each component should:
    1. Be completely independent and unaware of Lahat
    2. Be self-contained with clear boundaries
    3. Focus on a single responsibility
    4. Communicate through events
    
    Format your response as a JSON object with the following structure:
    {
      "components": [
        {
          "name": "ComponentName",
          "tagName": "component-name",
          "responsibility": "Description of what this component does",
          "properties": [
            {
              "name": "propertyName",
              "type": "string|number|boolean|array|object",
              "description": "Description of this property"
            }
          ],
          "methods": [
            {
              "name": "methodName",
              "description": "Description of what this method does",
              "parameters": [
                {
                  "name": "paramName",
                  "type": "string|number|boolean|array|object",
                  "description": "Description of this parameter"
                }
              ]
            }
          ],
          "events": [
            {
              "name": "event-name",
              "description": "Description of when this event is emitted",
              "data": {
                "propertyName": "Description of this property"
              }
            }
          ]
        }
      ]
    }
  `;
}

/**
 * Create a prompt for defining event communication
 * @param {Object} structureResult - The result of the component structure definition
 * @returns {string} - The prompt
 */
export function createEventCommunicationPrompt(structureResult) {
  return `
    You are an expert software architect. Your task is to define how components will communicate via events.
    
    Component Structure:
    ${JSON.stringify(structureResult, null, 2)}
    
    Define how components will communicate via events. For each component:
    1. Identify all CustomEvents it will emit
    2. Define the event data structures
    3. Specify event bubbling properties
    4. Document how these events will be consumed by other components
    
    Format your response as a JSON object with the following structure:
    {
      "components": [
        {
          "name": "ComponentName",
          "tagName": "component-name",
          "events": [
            {
              "name": "event-name",
              "bubbles": true,
              "composed": true,
              "description": "Description of when this event is emitted",
              "detail": {
                "propertyName": {
                  "type": "string|number|boolean|array|object",
                  "description": "Description of this property"
                }
              }
            }
          ],
          "listensTo": [
            {
              "component": "OtherComponentName",
              "event": "other-event-name",
              "action": "Description of what this component does when it receives this event"
            }
          ]
        }
      ]
    }
  `;
}

/**
 * Parse a JSON response from Claude
 * @param {string} response - The response from Claude
 * @returns {Object} - The parsed JSON
 */
export function parseJsonResponse(response) {
  try {
    // Extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('No JSON found in response');
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    throw error;
  }
}

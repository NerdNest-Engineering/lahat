/**
 * Self-Contained Widget Example
 * 
 * This example demonstrates how to generate a self-contained widget (a simple counter)
 * without all the additional dependencies.
 */

// Import required modules
import { generateMiniApp } from '../components/app-creation/main/services/mini-app-service.js';
import { DEFAULT_WIDGET_PROMPT } from '../components/app-creation/widget-system-prompts.js';
import ClaudeClient from '../claudeClient.js';

/**
 * Example function to demonstrate generating a self-contained widget
 * @param {string} apiKey - Claude API key
 * @returns {Promise<Object>} - Result of widget generation
 */
async function generateSelfContainedWidget(apiKey) {
  // Create a Claude client
  const claudeClient = new ClaudeClient(apiKey);
  
  // Define the event object (normally provided by the IPC system)
  const mockEvent = {
    sender: {
      send: (channel, data) => {
        console.log(`[${channel}]`, data);
      }
    }
  };
  
  // Define the prompt for a simple counter widget
  const prompt = `
    Create a simple counter widget that:
    1. Displays a number (starting at 0)
    2. Has increment and decrement buttons
    3. Has a reset button
    4. Uses minimal styling
  `;
  
  // Generate a self-contained widget
  const result = await generateMiniApp(claudeClient, mockEvent, {
    prompt,
    appName: "SimpleCounter",
    systemPrompt: DEFAULT_WIDGET_PROMPT,
    minimal: true // Generate a self-contained widget
  });
  
  console.log('Widget generated successfully:', result);
  console.log('Widget ID:', result.appId);
  console.log('File path:', result.filePath);
  
  return result;
}

/**
 * Example function to demonstrate updating a self-contained widget
 * @param {string} apiKey - Claude API key
 * @param {string} appId - ID of the widget to update
 * @returns {Promise<Object>} - Result of widget update
 */
async function updateSelfContainedWidget(apiKey, appId) {
  // Create a Claude client
  const claudeClient = new ClaudeClient(apiKey);
  
  // Define the event object (normally provided by the IPC system)
  const mockEvent = {
    sender: {
      send: (channel, data) => {
        console.log(`[${channel}]`, data);
      }
    }
  };
  
  // Define the prompt for updating the counter widget
  const prompt = `
    Update the counter widget to:
    1. Add a "double" button that multiplies the current count by 2
    2. Add a "halve" button that divides the current count by 2 (round down)
    3. Add a counter history that shows the last 5 values
  `;
  
  // Update the self-contained widget
  const result = await updateMiniApp(claudeClient, mockEvent, {
    appId,
    prompt,
    systemPrompt: DEFAULT_WIDGET_PROMPT,
    minimal: true // Keep it as a self-contained widget
  });
  
  console.log('Widget updated successfully:', result);
  console.log('File path:', result.filePath);
  
  return result;
}

/**
 * Example of how to use self-contained widgets in a real application
 */
async function runExample() {
  try {
    // Replace with your actual API key
    const apiKey = process.env.CLAUDE_API_KEY;
    
    if (!apiKey) {
      console.error('Please set the CLAUDE_API_KEY environment variable');
      return;
    }
    
    // Generate a new self-contained widget
    console.log('Generating self-contained widget...');
    const generatedWidget = await generateSelfContainedWidget(apiKey);
    
    // Update the widget
    console.log('\nUpdating self-contained widget...');
    await updateSelfContainedWidget(apiKey, generatedWidget.appId);
    
    console.log('\nExample completed successfully!');
  } catch (error) {
    console.error('Error running example:', error);
  }
}

// Uncomment to run the example
// runExample();

export { generateSelfContainedWidget, updateSelfContainedWidget, runExample };

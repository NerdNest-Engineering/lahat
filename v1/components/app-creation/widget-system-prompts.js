/**
 * System Prompts for Widget Generation
 * Contains system prompts used to guide Claude in generating widgets
 */

/**
 * Base prompt template containing common elements for all widget types
 * This includes the shared guidelines and interface documentation
 */
const BASE_PROMPT_TEMPLATE = `
IMPORTANT GUIDELINES:
1. Your response must be a SINGLE JavaScript file that defines a widget component class extending WidgetComponent.
2. The widget must use Shadow DOM for encapsulation.
3. All CSS must be included within the component using a <style> tag in the shadow DOM.
4. All functionality must be self-contained within the component class.
5. The component must be fully functional without any external dependencies or network requests.
6. Use modern JavaScript (ES6+) and CSS features.
7. Ensure the UI is clean, intuitive, and responsive.
8. Include appropriate error handling and user feedback.
9. Add comments to explain complex logic or functionality.
10. The widget will be placed in a Lahat cell and should support resizing.
11. Use the provided data persistence methods (this.saveData and this.loadData) for storing widget state.
12. Implement event communication using this.publishEvent to communicate with the parent cell.
13. DO NOT include any HTML boilerplate or script tags - ONLY the widget component class and its registration.
14. Your code will be directly imported into Lahat, so ensure it's compatible with ES modules.
15. Make sure to register your component with customElements.define() at the end of the file.
{{SPECIFIC_GUIDELINES}}

WIDGET COMPONENT INTERFACE:
The WidgetComponent base class provides the following methods and properties:

- Data Persistence:
  - async saveData(key, value): Save data to persistent storage
  - async loadData(key): Load data from persistent storage
  - async onDataStoreReady(): Called when the data store is ready (override to load initial data)

- Event Communication:
  - publishEvent(eventName, data): Publish an event to the parent cell
  - subscribeToEvent(eventName, callback, options): Subscribe to widget events
  - subscribeToEventOnce(eventName, callback, options): Subscribe to widget events once

- Lifecycle Methods:
  - initialize(): Called once when the widget is first created
  - onConnected(): Called each time the widget is connected to the DOM
  - onDisconnected(): Called each time the widget is disconnected from the DOM
  - onResize(width, height): Called when the widget is resized

- DOM Helpers:
  - $(selector): Get a reference to an element in the shadow DOM
  - $$(selector): Get all elements matching a selector in the shadow DOM
  - render(html, styles): Render HTML and CSS in the shadow DOM

RESPONSE FORMAT:
Your response must be a valid JavaScript file defining a widget component class extending WidgetComponent and registering it with customElements.define().

EXAMPLE RESPONSE FORMAT:
// The following is an example of what your response should look like
// This is just a template - your actual implementation will be different

/*
import { WidgetComponent } from '../../components/core/widget-component.js';

export class ExampleWidget extends WidgetComponent {
  constructor() {
    super();
    this._count = 0;
    this.render();
  }
  
  async onDataStoreReady() {
    const savedCount = await this.loadData('count');
    if (savedCount !== null) {
      this._count = savedCount;
      this.updateUI();
    }
  }
  
  render() {
    const html = \`
      <div class="example-widget">
        <h2>Example Widget</h2>
        <div class="count">\${this._count}</div>
        <button class="increment">Increment</button>
      </div>
    \`;
    
    const styles = \`
      :host {
        display: block;
      }
      
      .example-widget {
        padding: 16px;
        background-color: #f5f5f5;
        border-radius: 8px;
      }
    \`;
    
    this.shadowRoot.innerHTML = \`
      <style>\${styles}</style>
      \${html}
    \`;
    
    this.shadowRoot.querySelector('.increment').addEventListener('click', () => {
      this._count++;
      this.updateUI();
      this.saveData('count', this._count);
      this.publishEvent('count-changed', { count: this._count });
    });
  }
  
  updateUI() {
    const countElement = this.shadowRoot.querySelector('.count');
    if (countElement) {
      countElement.textContent = this._count;
    }
  }
}

// Register the component
customElements.define('example-widget', ExampleWidget);
*/`;

/**
 * Widget type-specific content
 * Contains the introduction and specialized guidelines for each widget type
 */
const WIDGET_SPECIFIC_CONTENT = {
  default: {
    introduction: `You are an expert web developer specializing in creating self-contained web components using JavaScript. When given a description of a widget, you will generate a complete, functional web component implementation.`,
    guidelines: `13. Design the widget to focus on a single, specific task.`
  },
  
  dataViz: {
    introduction: `You are an expert web developer specializing in creating self-contained data visualization web components using JavaScript. When given a description of a data visualization widget, you will generate a complete, functional web component implementation.`,
    guidelines: `13. Design the widget to focus on a single, specific data visualization task.
14. Use SVG or Canvas for rendering visualizations.
15. Include options for customizing the visualization (colors, scales, etc.).
16. Ensure the visualization is accessible and includes appropriate labels and legends.
17. Implement responsive design to handle different sizes and aspect ratios.`
  },
  
  utility: {
    introduction: `You are an expert web developer specializing in creating self-contained utility web components using JavaScript. When given a description of a utility widget, you will generate a complete, functional web component implementation.`,
    guidelines: `13. Design the widget to focus on a single, specific utility task.
14. Focus on accuracy, efficiency, and ease of use.
15. Include input validation and helpful error messages.
16. Ensure calculations and conversions are precise and follow standard formulas.`
  },
  
  interactive: {
    introduction: `You are an expert web developer specializing in creating self-contained interactive web components using JavaScript. When given a description of an interactive widget or game, you will generate a complete, functional web component implementation.`,
    guidelines: `13. Design the widget to focus on a single, specific interactive task or game.
14. Focus on user engagement, feedback, and enjoyment.
15. Include game mechanics, user interaction, and providing a fun experience.
16. Include score tracking, win/lose conditions, and game state management.
17. Ensure the game is replayable and has appropriate difficulty progression.`
  }
};

/**
 * Generate a complete widget prompt by combining the base template with widget-specific content
 * @param {string} widgetType - The type of widget ('default', 'dataViz', 'utility', or 'interactive')
 * @returns {string} - The complete system prompt for the specified widget type
 */
function generateWidgetPrompt(widgetType) {
  const specificContent = WIDGET_SPECIFIC_CONTENT[widgetType];
  
  if (!specificContent) {
    throw new Error(`Unknown widget type: ${widgetType}`);
  }
  
  return `${specificContent.introduction}

${BASE_PROMPT_TEMPLATE.replace('{{SPECIFIC_GUIDELINES}}', specificContent.guidelines)}`;
}

/**
 * Default system prompt for widget generation
 * This is the base prompt that will be used if no specific prompt is provided
 */
export const DEFAULT_WIDGET_PROMPT = generateWidgetPrompt('default');

/**
 * System prompt for data visualization widgets
 * Use this prompt when generating data visualization widgets
 */
export const DATA_VIZ_WIDGET_PROMPT = generateWidgetPrompt('dataViz');

/**
 * System prompt for utility widgets
 * Use this prompt when generating utility widgets
 */
export const UTILITY_WIDGET_PROMPT = generateWidgetPrompt('utility');

/**
 * System prompt for interactive widgets
 * Use this prompt when generating interactive widgets like games
 */
export const INTERACTIVE_WIDGET_PROMPT = generateWidgetPrompt('interactive');

/**
 * Determine the widget type using Claude API
 * @param {string} description - The widget description
 * @returns {Promise<string>} - The determined widget type ('default', 'dataViz', 'utility', or 'interactive')
 * @private
 */
async function determineWidgetTypeWithClaude(description) {
  // Import Anthropic SDK
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  
  // Get API key from environment
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not found in environment variables. Defaulting to standard widget type.');
    return 'default';
  }
  
  // Create Anthropic client
  const anthropic = new Anthropic({
    apiKey: apiKey
  });
  
  // Create a system prompt for widget type classification
  const systemPrompt = `You are a widget type classifier. Given a description of a widget, classify it into one of the following types:
- dataViz: For data visualization widgets like charts, graphs, dashboards, etc.
- utility: For utility widgets like calculators, converters, tools, etc.
- interactive: For interactive widgets like games, puzzles, etc.
- default: For general-purpose widgets that don't fit into the above categories.

Respond with ONLY the widget type (dataViz, utility, interactive, or default) without any explanation or additional text.`;
  
  try {
    // Use Claude 3 Haiku (cheapest model) for this simple classification task
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10, // We only need a short response
      system: systemPrompt,
      messages: [
        { role: 'user', content: description }
      ]
    });
    
    // Extract the widget type from the response
    const widgetType = response.content[0].text.trim().toLowerCase();
    
    // Validate the response
    if (['dataviz', 'utility', 'interactive', 'default'].includes(widgetType)) {
      return widgetType;
    } else {
      console.warn(`Unexpected widget type from Claude: ${widgetType}. Defaulting to 'default'.`);
      return 'default';
    }
  } catch (error) {
    console.error('Error determining widget type with Claude:', error);
    // Fall back to default widget type in case of error
    return 'default';
  }
}

/**
 * Determine the appropriate system prompt based on the widget description
 * Uses Claude API to classify the widget type
 * @param {string} description - The widget description
 * @returns {Promise<string>} - The appropriate system prompt
 */
export async function determineWidgetSystemPrompt(description) {
  try {
    // Use Claude to determine the widget type
    const widgetType = await determineWidgetTypeWithClaude(description);
    
    // Return the appropriate prompt based on the determined type
    switch(widgetType) {
      case 'dataviz':
        return DATA_VIZ_WIDGET_PROMPT;
      case 'utility':
        return UTILITY_WIDGET_PROMPT;
      case 'interactive':
        return INTERACTIVE_WIDGET_PROMPT;
      default:
        return DEFAULT_WIDGET_PROMPT;
    }
  } catch (error) {
    console.error('Error in determineWidgetSystemPrompt:', error);
    // Fall back to default widget prompt in case of error
    return DEFAULT_WIDGET_PROMPT;
  }
}

export default {
  DEFAULT_WIDGET_PROMPT,
  DATA_VIZ_WIDGET_PROMPT,
  UTILITY_WIDGET_PROMPT,
  INTERACTIVE_WIDGET_PROMPT,
  determineWidgetSystemPrompt
};

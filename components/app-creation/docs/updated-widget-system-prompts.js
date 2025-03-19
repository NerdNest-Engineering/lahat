/**
 * Updated System Prompts for WebComponent Generation
 * Contains system prompts used to guide Claude in generating standalone WebComponents
 */

/**
 * Base prompt template containing common elements for all WebComponent types
 * This includes the shared guidelines and interface documentation
 */
const BASE_PROMPT_TEMPLATE = `
IMPORTANT GUIDELINES:
1. Your response must be a SINGLE JavaScript file that defines a web component class extending HTMLElement.
2. The component must use Shadow DOM for encapsulation.
3. All CSS must be included within the component using a <style> tag in the shadow DOM.
4. All functionality must be self-contained within the component class.
5. The component must be fully functional without any external dependencies or network requests.
6. Use modern JavaScript (ES6+) and CSS features.
7. Ensure the UI is clean, intuitive, and responsive.
8. Include appropriate error handling and user feedback.
9. Add comments to explain complex logic or functionality.
10. The component should support resizing.
11. Store state internally within the component.
12. Use standard DOM events for communication with the parent container.
13. DO NOT include any HTML boilerplate or script tags - ONLY the web component class and its registration.
14. Your code will be directly imported, so ensure it's compatible with ES modules.
15. Make sure to register your component with customElements.define() at the end of the file.
{{SPECIFIC_GUIDELINES}}

WEB COMPONENT INTERFACE:
A standard web component should implement the following:

- Lifecycle Methods:
  - constructor(): Initialize the component and set up shadow DOM
  - connectedCallback(): Called when the component is added to the DOM
  - disconnectedCallback(): Called when the component is removed from the DOM
  - attributeChangedCallback(name, oldValue, newValue): Called when attributes are changed

- Static Properties:
  - static get observedAttributes(): Return an array of attribute names to observe

- Event Communication:
  - Use standard DOM events: this.dispatchEvent(new CustomEvent('event-name', { 
      bubbles: true, 
      composed: true, 
      detail: { /* your data here */ } 
    }))

- DOM Helpers (implement these yourself):
  - this.shadowRoot.querySelector(selector): Get a reference to an element in the shadow DOM
  - this.shadowRoot.querySelectorAll(selector): Get all elements matching a selector in the shadow DOM

RESPONSE FORMAT:
Your response must be a valid JavaScript file defining a web component class extending HTMLElement and registering it with customElements.define().

EXAMPLE RESPONSE FORMAT:
// The following is an example of what your response should look like
// This is just a template - your actual implementation will be different

/*
export class ExampleComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._count = 0;
    this.render();
  }
  
  static get observedAttributes() {
    return ['title'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'title' && oldValue !== newValue) {
      this.render();
    }
  }
  
  connectedCallback() {
    // Component added to DOM
    this.shadowRoot.querySelector('.increment').addEventListener('click', this.handleIncrement.bind(this));
  }
  
  disconnectedCallback() {
    // Component removed from DOM - clean up event listeners
    this.shadowRoot.querySelector('.increment').removeEventListener('click', this.handleIncrement.bind(this));
  }
  
  handleIncrement() {
    this._count++;
    this.updateUI();
    
    // Emit event to notify parent
    this.dispatchEvent(new CustomEvent('count-changed', {
      bubbles: true, 
      composed: true, 
      detail: { count: this._count }
    }));
  }
  
  render() {
    const title = this.getAttribute('title') || 'Example Component';
    
    const html = \`
      <div class="example-component">
        <h2>\${title}</h2>
        <div class="count">\${this._count}</div>
        <button class="increment">Increment</button>
      </div>
    \`;
    
    const styles = \`
      :host {
        display: block;
      }
      
      .example-component {
        padding: 16px;
        background-color: #f5f5f5;
        border-radius: 8px;
      }
      
      .count {
        font-size: 24px;
        margin: 16px 0;
      }
      
      .increment {
        padding: 8px 16px;
        background-color: #4285f4;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .increment:hover {
        background-color: #3367d6;
      }
    \`;
    
    this.shadowRoot.innerHTML = \`
      <style>\${styles}</style>
      \${html}
    \`;
  }
  
  updateUI() {
    const countElement = this.shadowRoot.querySelector('.count');
    if (countElement) {
      countElement.textContent = this._count;
    }
  }
}

// Register the component
customElements.define('example-component', ExampleComponent);
*/`;

/**
 * WebComponent type-specific content
 * Contains the introduction and specialized guidelines for each component type
 */
const COMPONENT_SPECIFIC_CONTENT = {
  default: {
    introduction: `You are an expert web developer specializing in creating self-contained web components using JavaScript. When given a description of a component, you will generate a complete, functional web component implementation.`,
    guidelines: `16. Design the component to focus on a single, specific task.`
  },
  
  dataViz: {
    introduction: `You are an expert web developer specializing in creating self-contained data visualization web components using JavaScript. When given a description of a data visualization component, you will generate a complete, functional web component implementation.`,
    guidelines: `16. Design the component to focus on a single, specific data visualization task.
17. Use SVG or Canvas for rendering visualizations.
18. Include options for customizing the visualization (colors, scales, etc.).
19. Ensure the visualization is accessible and includes appropriate labels and legends.
20. Implement responsive design to handle different sizes and aspect ratios.`
  },
  
  utility: {
    introduction: `You are an expert web developer specializing in creating self-contained utility web components using JavaScript. When given a description of a utility component, you will generate a complete, functional web component implementation.`,
    guidelines: `16. Design the component to focus on a single, specific utility task.
17. Focus on accuracy, efficiency, and ease of use.
18. Include input validation and helpful error messages.
19. Ensure calculations and conversions are precise and follow standard formulas.`
  },
  
  interactive: {
    introduction: `You are an expert web developer specializing in creating self-contained interactive web components using JavaScript. When given a description of an interactive component or game, you will generate a complete, functional web component implementation.`,
    guidelines: `16. Design the component to focus on a single, specific interactive task or game.
17. Focus on user engagement, feedback, and enjoyment.
18. Include game mechanics, user interaction, and providing a fun experience.
19. Include score tracking, win/lose conditions, and game state management.
20. Ensure the game is replayable and has appropriate difficulty progression.`
  }
};

/**
 * Generate a complete component prompt by combining the base template with component-specific content
 * @param {string} componentType - The type of component ('default', 'dataViz', 'utility', or 'interactive')
 * @returns {string} - The complete system prompt for the specified component type
 */
function generateComponentPrompt(componentType) {
  const specificContent = COMPONENT_SPECIFIC_CONTENT[componentType];
  
  if (!specificContent) {
    throw new Error(`Unknown component type: ${componentType}`);
  }
  
  return `${specificContent.introduction}

${BASE_PROMPT_TEMPLATE.replace('{{SPECIFIC_GUIDELINES}}', specificContent.guidelines)}`;
}

/**
 * Default system prompt for component generation
 * This is the base prompt that will be used if no specific prompt is provided
 */
export const DEFAULT_COMPONENT_PROMPT = generateComponentPrompt('default');

/**
 * System prompt for data visualization components
 * Use this prompt when generating data visualization components
 */
export const DATA_VIZ_COMPONENT_PROMPT = generateComponentPrompt('dataViz');

/**
 * System prompt for utility components
 * Use this prompt when generating utility components
 */
export const UTILITY_COMPONENT_PROMPT = generateComponentPrompt('utility');

/**
 * System prompt for interactive components
 * Use this prompt when generating interactive components like games
 */
export const INTERACTIVE_COMPONENT_PROMPT = generateComponentPrompt('interactive');

/**
 * Determine the component type using Claude API
 * @param {string} description - The component description
 * @returns {Promise<string>} - The determined component type ('default', 'dataViz', 'utility', or 'interactive')
 * @private
 */
async function determineComponentTypeWithClaude(description) {
  // Import Anthropic SDK
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  
  // Get API key from environment
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not found in environment variables. Defaulting to standard component type.');
    return 'default';
  }
  
  // Create Anthropic client
  const anthropic = new Anthropic({
    apiKey: apiKey
  });
  
  // Create a system prompt for component type classification
  const systemPrompt = `You are a web component type classifier. Given a description of a component, classify it into one of the following types:
- dataViz: For data visualization components like charts, graphs, dashboards, etc.
- utility: For utility components like calculators, converters, tools, etc.
- interactive: For interactive components like games, puzzles, etc.
- default: For general-purpose components that don't fit into the above categories.

Respond with ONLY the component type (dataViz, utility, interactive, or default) without any explanation or additional text.`;
  
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
    
    // Extract the component type from the response
    const componentType = response.content[0].text.trim().toLowerCase();
    
    // Validate the response
    if (['dataviz', 'utility', 'interactive', 'default'].includes(componentType)) {
      return componentType;
    } else {
      console.warn(`Unexpected component type from Claude: ${componentType}. Defaulting to 'default'.`);
      return 'default';
    }
  } catch (error) {
    console.error('Error determining component type with Claude:', error);
    // Fall back to default component type in case of error
    return 'default';
  }
}

/**
 * Determine the appropriate system prompt based on the component description
 * Uses Claude API to classify the component type
 * @param {string} description - The component description
 * @returns {Promise<string>} - The appropriate system prompt
 */
export async function determineComponentSystemPrompt(description) {
  try {
    // Use Claude to determine the component type
    const componentType = await determineComponentTypeWithClaude(description);
    
    // Return the appropriate prompt based on the determined type
    switch(componentType) {
      case 'dataviz':
        return DATA_VIZ_COMPONENT_PROMPT;
      case 'utility':
        return UTILITY_COMPONENT_PROMPT;
      case 'interactive':
        return INTERACTIVE_COMPONENT_PROMPT;
      default:
        return DEFAULT_COMPONENT_PROMPT;
    }
  } catch (error) {
    console.error('Error in determineComponentSystemPrompt:', error);
    // Fall back to default component prompt in case of error
    return DEFAULT_COMPONENT_PROMPT;
  }
}

export default {
  DEFAULT_COMPONENT_PROMPT,
  DATA_VIZ_COMPONENT_PROMPT,
  UTILITY_COMPONENT_PROMPT,
  INTERACTIVE_COMPONENT_PROMPT,
  determineComponentSystemPrompt
};

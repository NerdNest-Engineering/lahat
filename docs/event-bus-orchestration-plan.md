# EventBus Singleton & Choreography Pattern Implementation Plan

## Overview

This document outlines our plan to modify the application to use a single EventBus instance across all windows and implement a choreography pattern for component communication. This transition will make the system more decentralized, with components communicating directly via events rather than relying on a central controller.

## Current Architecture

### EventBus Implementation
- The `EventBus` class in `src/app-creator/utils/event-bus.js` already supports cross-window communication using the `BroadcastChannel` API
- Each file that uses `EventBus` potentially creates its own instance
- The `app-creator.js` module creates and exports an EventBus instance, but not all components import this shared instance

### Controller-Based Coordination
- Currently, the `AppCreationController` serves as a central orchestrator
- Step components dispatch DOM events that bubble up to the controller
- The controller manages flow and business logic between steps

### Component Communication
- Step components use DOM events like `STEP_NEXT`, `STEP_BACK`, and `STEP_VALIDITY_CHANGE`
- These events bubble up through the DOM to reach the controller
- The controller dispatches events to components or directly calls component methods

## Implementation Goals

1. **Singleton EventBus**: Create a single EventBus instance used across all windows
2. **Choreography Pattern**: Move from centralized control to decentralized choreography
3. **Direct Component Communication**: Components should communicate directly via the EventBus
4. **Cross-Window Consistency**: Ensure consistent state across all windows

## Implementation Plan

### 1. Modify EventBus to Export a Singleton

Modify `src/app-creator/utils/event-bus.js` to implement the singleton pattern:

```javascript
let instance = null;

export class EventBus {
  constructor(channel = 'lahat-bus') {
    if (instance) {
      return instance;
    }
    
    this.subscribers = new Map();
    // Use BroadcastChannel if we can; otherwise, stay local
    this.bc = (typeof BroadcastChannel !== 'undefined')
      ? new BroadcastChannel(channel)
      : null;

    // Fan-in from other windows
    this.bc?.addEventListener('message', ({ data }) => {
      const { event, payload } = data || {};
      if (event) this.#dispatch(event, payload, /*fromRemote*/ true);
    });
    
    // Set the instance
    instance = this;
    
    // Add window unload handler to close the channel
    window.addEventListener('unload', () => {
      this.close();
    });
  }
  
  // Rest of existing EventBus implementation
}

// Export a pre-instantiated singleton
export const eventBus = new EventBus();
```

### 2. Define Domain Events for the Choreography Pattern

Create a new file `src/app-creator/utils/choreography-events.js` with event definitions that describe business processes rather than UI navigation:

```javascript
import { EventDefinition } from './event-definition.js';

// Process State Events
export const APP_CREATION_STARTED = new EventDefinition(
  'choreography:app-creation-started',
  'Fired when the app creation process begins',
  {}
);

export const PROMPT_SUBMITTED = new EventDefinition(
  'choreography:prompt-submitted',
  'Fired when a valid prompt is submitted and ready for processing',
  { 
    prompt: { type: 'string', description: 'The submitted prompt text' }
  }
);

export const TITLE_DESCRIPTION_GENERATED = new EventDefinition(
  'choreography:title-description-generated',
  'Fired when title and description are successfully generated',
  { 
    title: { type: 'string', description: 'The generated title' },
    description: { type: 'string', description: 'The generated description' },
    prompt: { type: 'string', description: 'The original prompt' }
  }
);

export const TITLE_DESCRIPTION_CONFIRMED = new EventDefinition(
  'choreography:title-description-confirmed',
  'Fired when the user confirms the title and description',
  { 
    title: { type: 'string', description: 'The confirmed title' },
    description: { type: 'string', description: 'The confirmed description' },
    prompt: { type: 'string', description: 'The original prompt' }
  }
);

export const APP_GENERATION_STARTED = new EventDefinition(
  'choreography:app-generation-started',
  'Fired when app generation begins',
  { 
    title: { type: 'string', description: 'The app title' },
    description: { type: 'string', description: 'The app description' },
    prompt: { type: 'string', description: 'The original prompt' }
  }
);

export const APP_GENERATION_PROGRESS = new EventDefinition(
  'choreography:app-generation-progress',
  'Fired when app generation sends a progress update',
  { 
    content: { type: 'string', description: 'The chunk of generated content' },
    progress: { type: 'number', description: 'Percentage complete (0-100)' }
  }
);

export const APP_GENERATION_FINISHED = new EventDefinition(
  'choreography:app-generation-finished',
  'Fired when app generation completes',
  { 
    success: { type: 'boolean', description: 'Whether generation was successful' },
    error: { type: 'string', optional: true, description: 'Error message if failed' }
  }
);

// Revision Events
export const PROMPT_REVISION_REQUESTED = new EventDefinition(
  'choreography:prompt-revision-requested',
  'Fired when the user wants to go back and edit the prompt',
  {}
);

export const TITLE_DESCRIPTION_REVISION_REQUESTED = new EventDefinition(
  'choreography:title-description-revision-requested',
  'Fired when the user wants to go back and edit the title/description',
  {}
);

export const APP_CREATION_RESTART_REQUESTED = new EventDefinition(
  'choreography:app-creation-restart-requested',
  'Fired when the user wants to restart the app creation process',
  {}
);
```

### 3. Create Domain Services for Business Logic

Create service files for business logic that was previously in the controller:

#### Prompt Service (`src/app-creator/services/prompt-service.js`)

```javascript
import { eventBus } from '../utils/event-bus.js';
import { 
  PROMPT_SUBMITTED,
  TITLE_DESCRIPTION_GENERATED
} from '../utils/choreography-events.js';

export class PromptService {
  constructor() {
    this._setupEventListeners();
  }
  
  _setupEventListeners() {
    eventBus.subscribe(PROMPT_SUBMITTED, this._handlePromptSubmitted.bind(this));
  }
  
  async _handlePromptSubmitted(data) {
    const { prompt } = data;
    
    try {
      let result;
      if (window.electronAPI) {
        result = await window.electronAPI.generateTitleAndDescription({ input: prompt });
      } else {
        // Fallback for browser testing
        await new Promise(resolve => setTimeout(resolve, 1500));
        result = { 
          success: true, 
          title: "Generated Title for: " + prompt.substring(0, 20),
          description: "Generated Description for the app based on: " + prompt
        };
      }
      
      if (result.success) {
        // Publish the generated title and description
        eventBus.publish(TITLE_DESCRIPTION_GENERATED, {
          title: result.title,
          description: result.description,
          prompt: prompt
        });
      } else {
        console.error('Failed to generate title and description:', result.error);
        // Consider publishing an error event
      }
    } catch (error) {
      console.error('Error generating title and description:', error);
      // Consider publishing an error event
    }
  }
}

// Instantiate the service when this module is imported
export const promptService = new PromptService();
```

#### App Generation Service (`src/app-creator/services/app-generation-service.js`)

```javascript
import { eventBus } from '../utils/event-bus.js';
import { 
  TITLE_DESCRIPTION_CONFIRMED,
  APP_GENERATION_STARTED,
  APP_GENERATION_PROGRESS,
  APP_GENERATION_FINISHED
} from '../utils/choreography-events.js';

export class AppGenerationService {
  constructor() {
    this._setupEventListeners();
  }
  
  _setupEventListeners() {
    eventBus.subscribe(TITLE_DESCRIPTION_CONFIRMED, this._handleTitleDescriptionConfirmed.bind(this));
  }
  
  _handleTitleDescriptionConfirmed(data) {
    const { title, description, prompt } = data;
    
    // Publish that app generation has started
    eventBus.publish(APP_GENERATION_STARTED, { title, description, prompt });
    
    // Start the actual generation process
    this._generateApp(title, description, prompt);
  }
  
  async _generateApp(title, description, prompt) {
    try {
      let result;
      
      if (window.electronAPI) {
        // Set up progress handler if available
        if (window.electronAPI.onGenerationChunk) {
          const unsubscribe = window.electronAPI.onGenerationChunk((chunk) => {
            eventBus.publish(APP_GENERATION_PROGRESS, {
              content: chunk.content,
              progress: chunk.progress || 50
            });
            
            if (chunk.done) {
              unsubscribe();
            }
          });
        }
        
        result = await window.electronAPI.generateWidget({
          appName: title,
          prompt: description
        });
      } else {
        // Fallback for browser testing
        // Simulate some progress updates
        for (let i = 0; i < 5; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          eventBus.publish(APP_GENERATION_PROGRESS, {
            content: `Generating part ${i+1}/5...`,
            progress: (i+1) * 20
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        result = { success: true };
      }
      
      // Publish completion event
      eventBus.publish(APP_GENERATION_FINISHED, {
        success: result.success,
        error: result.error
      });
      
      // Notify if app was successfully created
      if (result.success && window.electronAPI) {
        window.electronAPI.notifyAppUpdated();
      }
    } catch (error) {
      console.error('Error generating app:', error);
      eventBus.publish(APP_GENERATION_FINISHED, {
        success: false,
        error: error.message
      });
    }
  }
}

// Instantiate the service when this module is imported
export const appGenerationService = new AppGenerationService();
```

### 4. Update Step Components to Use EventBus

#### Step One Component (`src/app-creator/components/steps/app-creation-step-one.js`)

```javascript
import '../base/step-header.js';
import '../base/step-navigation.js';
import '../base/step-container.js';
import { eventBus } from '../../utils/event-bus.js';
import { 
  APP_CREATION_STARTED,
  PROMPT_SUBMITTED,
  PROMPT_REVISION_REQUESTED,
  APP_CREATION_RESTART_REQUESTED
} from '../../utils/choreography-events.js';
import '../../services/prompt-service.js';

// Change handlers to use EventBus instead of DOM events
_handleStepNext(event) {
  const textarea = this.shadowRoot.querySelector('.prompt-textarea');
  const prompt = textarea ? textarea.value.trim() : '';
  
  // Only proceed if prompt is valid
  if (prompt.length >= 10) {
    // Publish the prompt submitted event
    eventBus.publish(PROMPT_SUBMITTED, { prompt });
  }
}

// Add event subscriptions in connectedCallback
connectedCallback() {
  // Listen for events that should activate this step
  this._unsubscribeStart = eventBus.subscribe(
    APP_CREATION_STARTED,
    () => this.setActive(true)
  );
  
  this._unsubscribeRestart = eventBus.subscribe(
    APP_CREATION_RESTART_REQUESTED,
    () => {
      this.reset();
      this.setActive(true);
    }
  );
  
  this._unsubscribeRevision = eventBus.subscribe(
    PROMPT_REVISION_REQUESTED,
    () => this.setActive(true)
  );
  
  // Initialize validity check
  const textarea = this.shadowRoot.querySelector('.prompt-textarea');
  if (textarea) {
    this._handleTextareaInput({ target: textarea });
  }
  
  // Activate this step by default on initial load
  if (!this.hasAttribute('hidden')) {
    eventBus.publish(APP_CREATION_STARTED, {});
  }
}

// Clean up subscriptions
disconnectedCallback() {
  if (this._unsubscribeStart) this._unsubscribeStart();
  if (this._unsubscribeRestart) this._unsubscribeRestart();
  if (this._unsubscribeRevision) this._unsubscribeRevision();
}
```

#### Step Two Component (`src/app-creator/components/steps/app-creation-step-two.js`)

```javascript
import '../base/step-header.js';
import '../base/step-navigation.js';
import '../base/step-container.js';
import { eventBus } from '../../utils/event-bus.js';
import { 
  TITLE_DESCRIPTION_GENERATED,
  TITLE_DESCRIPTION_CONFIRMED,
  PROMPT_REVISION_REQUESTED,
  PROMPT_SUBMITTED
} from '../../utils/choreography-events.js';

// Add event subscriptions in connectedCallback
connectedCallback() {
  // Listen for events that should activate this step
  this._unsubscribeGenerated = eventBus.subscribe(
    TITLE_DESCRIPTION_GENERATED,
    this._handleTitleDescriptionGenerated.bind(this)
  );
  
  // Listen for events that should deactivate this step
  this._unsubscribePrompt = eventBus.subscribe(
    PROMPT_SUBMITTED,
    () => {
      this.setActive(false);
      this.setCompleted(false);
    }
  );
  
  // Initialize validity state
  this._handleInputChange();
}

// Handle next button click
_handleStepNext(event) {
  if (this._isValid) {
    const titleInput = this.shadowRoot.querySelector('.title-input');
    const descriptionTextarea = this.shadowRoot.querySelector('.description-textarea');
    
    const title = titleInput ? titleInput.value.trim() : '';
    const description = descriptionTextarea ? descriptionTextarea.value.trim() : '';
    
    // Publish the confirmation event
    eventBus.publish(TITLE_DESCRIPTION_CONFIRMED, {
      title,
      description,
      prompt: this._originalPrompt
    });
  }
}

// Handle back button click
_handleStepBack(event) {
  // Publish event to go back to prompt step
  eventBus.publish(PROMPT_REVISION_REQUESTED, {});
}

// Clean up subscriptions
disconnectedCallback() {
  if (this._unsubscribeGenerated) this._unsubscribeGenerated();
  if (this._unsubscribePrompt) this._unsubscribePrompt();
}
```

#### Step Three Component (`src/app-creator/components/steps/app-creation-step-three.js`)

```javascript
import '../base/step-header.js';
import '../base/step-navigation.js';
import '../base/step-container.js';
import { eventBus } from '../../utils/event-bus.js';
import { 
  APP_GENERATION_STARTED,
  APP_GENERATION_PROGRESS,
  APP_GENERATION_FINISHED,
  TITLE_DESCRIPTION_REVISION_REQUESTED,
  APP_CREATION_RESTART_REQUESTED
} from '../../utils/choreography-events.js';
import '../../services/app-generation-service.js';

// Add event subscriptions in connectedCallback
connectedCallback() {
  // Listen for events that should activate this step
  this._unsubscribeStarted = eventBus.subscribe(
    APP_GENERATION_STARTED,
    this._handleAppGenerationStarted.bind(this)
  );
  
  // Listen for progress updates
  this._unsubscribeProgress = eventBus.subscribe(
    APP_GENERATION_PROGRESS,
    this._handleAppGenerationProgress.bind(this)
  );
  
  // Listen for completion
  this._unsubscribeFinished = eventBus.subscribe(
    APP_GENERATION_FINISHED,
    this._handleAppGenerationFinished.bind(this)
  );
}

// Handle back button click
_handleStepBack(event) {
  // Publish event to go back to title/description step
  eventBus.publish(TITLE_DESCRIPTION_REVISION_REQUESTED, {});
}

// Optional "New App" button for restarting the process
_handleRestartClick() {
  eventBus.publish(APP_CREATION_RESTART_REQUESTED, {});
}

// Clean up subscriptions
disconnectedCallback() {
  if (this._unsubscribeStarted) this._unsubscribeStarted();
  if (this._unsubscribeProgress) this._unsubscribeProgress();
  if (this._unsubscribeFinished) this._unsubscribeFinished();
}
```

### 5. Simplify the App Creator Module

Simplify `src/app-creator/app-creator.js` to rely on services and components with autonomous orchestration:

```javascript
import { EventDefinition } from './utils/event-definition.js';
import { eventBus } from './utils/event-bus.js';
import { ErrorContainer, ErrorMessage } from './components/ui/error-container.js';
import './components/steps/app-creation-step-one.js';
import './components/steps/app-creation-step-two.js';
import './components/steps/app-creation-step-three.js';
import './services/prompt-service.js';
import './services/app-generation-service.js';

// Initialization
export const APP_CREATOR_INITIALIZED = new EventDefinition(
  'app-creator:initialized',
  'Fired when the App Creator module has completed its initial setup',
  {}
);

/**
 * Initialize the app creator module
 */
function initializeAppCreator() {
  console.log('Initializing app creator module...');
  
  try {
    // Register custom elements if not already registered
    // ...existing registration code...
    
    // Create error container if it doesn't exist
    if (!document.querySelector('error-container')) {
      const errorContainer = document.createElement('error-container');
      document.body.appendChild(errorContainer);
    }
    
    // Publish initialization event
    eventBus.publish(APP_CREATOR_INITIALIZED, {});
    
    console.log('App creator module initialized');
  } catch (error) {
    console.error('Failed to initialize app creator module:', error);
    
    // Show error in the UI
    const errorContainer = document.querySelector('error-container');
    if (errorContainer) {
      errorContainer.addError('Initialization Error', error.message, 'fatal');
    }
  }
}

// Initialize the module when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeAppCreator);
```

## Benefits of This Approach

### Shared EventBus
- A single EventBus instance ensures consistent event handling across windows
- BroadcastChannel API ensures events propagate to all windows
- Singleton pattern prevents accidental creation of multiple instances

### Choreography Pattern
- Components communicate directly through events without tight coupling
- Business processes are represented by descriptive events
- No central controller means components can be more autonomous

### Decentralized Logic
- Business logic lives in domain services rather than a centralized controller
- Step components manage their own state based on events
- More maintainable and easier to expand with new functionality

### Improved Cross-Window Communication
- Events are automatically shared across windows
- UI state is consistent regardless of which window triggers an action
- Multiple windows can participate in the same workflow

## Migration Strategy

1. First, modify the EventBus class to implement the singleton pattern
2. Create the choreography events file
3. Create domain service files
4. Update one step component at a time to use the EventBus
5. Gradually simplify the controller as functionality moves to services and components
6. Finally, update app-creator.js to import all needed services and components

This approach allows for incremental migration without breaking existing functionality.

## Future Extensibility

The choreography pattern makes the system more extensible for future enhancements:

- New steps can be added by creating new components that subscribe to relevant events
- Additional services can be created for new business logic
- The event-driven architecture can easily integrate with other systems
- It provides a foundation for potential LLM-driven orchestration in the future

## Conclusion

This implementation plan will transform the application from a controller-centric architecture to an event-driven choreography pattern with a shared EventBus. The result will be a more decentralized, maintainable system with improved cross-window communication.
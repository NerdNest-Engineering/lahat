# Plan: App Creator Event Registry

**Date:** 2025-05-07

**Author:** Roo (AI Technical Leader)

**Status:** Approved

## 1. Overview

This document outlines the plan to create a centralized and descriptive event registry for the `app-creator` module. The primary goals are:

*   Standardize event names and their usage across the module.
*   Provide clear documentation for each event, including its purpose, trigger, and expected payload structure.
*   Facilitate the refactoring of `src/app-creator/components/app-creation-controller.js` to be more event-driven.
*   Prepare for potential future integration with AI agents or other automated systems by making event contracts explicit and descriptive.

## 2. Core Events Identified

The following core events have been identified based on analysis of `app-creation-step-one.js`, `app-creation-controller.js`, and the general application flow:

*   `STEP_NEXT`
*   `STEP_BACK`
*   `STEP_VALIDITY_CHANGE`
*   `APP_CREATOR_INITIALIZED`
*   `STEP_ACTIVATED`
*   `API_KEY_CHECK_START`
*   `API_KEY_MISSING`
*   `API_KEY_PRESENT`
*   `TITLE_DESCRIPTION_GENERATION_START`
*   `TITLE_DESCRIPTION_GENERATION_CHUNK_RECEIVED`
*   `TITLE_DESCRIPTION_GENERATION_SUCCESS`
*   `TITLE_DESCRIPTION_GENERATION_FAILURE`
*   `APP_GENERATION_START`
*   `APP_GENERATION_CHUNK_RECEIVED`
*   `APP_GENERATION_SUCCESS`
*   `APP_GENERATION_FAILURE`
*   `NOTIFY_APP_UPDATED`
*   `OPEN_WINDOW_REQUEST`
*   `CLOSE_CURRENT_WINDOW_REQUEST`

## 3. Event Naming Convention

*   **Constant Name:** Uppercase `SNAKE_CASE` (e.g., `APP_CREATOR_INITIALIZED`).
*   **Event Name String:** Lowercase, colon-namespaced string (e.g., `'app-creator:initialized'`) for use with event bus publish/subscribe and DOM event listeners.

## 4. Event Registry File Structure

*   **File Name:** `app-events.js`
*   **Location:** `src/app-creator/utils/app-events.js`
*   **Content Structure:** The file will export a frozen object (`AppCreatorEvents`). Each key in this object will be the event constant (e.g., `APP_CREATOR_INITIALIZED`), and its value will be an object containing:
    *   `eventName`: The actual string name of the event.
    *   `description`: A detailed explanation of what the event signifies, when it's typically fired, and its purpose.
    *   `payloadSchema`: An object describing the expected structure and types of data in the event's detail/payload.

### Proposed Content for `src/app-creator/utils/app-events.js`:

```javascript
// src/app-creator/utils/app-events.js

/**
 * @file app-events.js
 * @description Defines standardized event names and their contracts for the App Creator module.
 * This registry provides detailed descriptions and payload structures for each event,
 * facilitating consistent usage, clear documentation, and potential integration
 * with AI agents or other automated systems.
 */

export const AppCreatorEvents = Object.freeze({
  // Initialization
  APP_CREATOR_INITIALIZED: {
    eventName: 'app-creator:initialized',
    description: 'Fired when the App Creator module has completed its initial setup, including DOM checks, component registrations, and initial IPC listener setup (if applicable). Indicates the module is ready for user interaction or to proceed with the first step.',
    payloadSchema: { /* No specific payload expected, but can be an empty object {} */ }
  },

  // Step Navigation & Validity
  STEP_NEXT: {
    eventName: 'app-creator:step-next',
    description: 'Fired when the user initiates a "next step" action, typically by clicking a "Next" or "Continue" button within a step. The controller listens to this to advance the workflow.',
    payloadSchema: {
      stepNumber: { type: 'number', description: 'The number of the step from which the next action was triggered.' }
    }
  },
  STEP_BACK: {
    eventName: 'app-creator:step-back',
    description: 'Fired when the user initiates a "previous step" action, typically by clicking a "Back" button. The controller listens to this to revert to the previous step in the workflow.',
    payloadSchema: {
      stepNumber: { type: 'number', description: 'The number of the step from which the back action was triggered.' }
    }
  },
  STEP_VALIDITY_CHANGE: {
    eventName: 'app-creator:step-validity-change',
    description: 'Fired by a step component when its internal validation state changes (e.g., user input meets requirements). The controller uses this to enable/disable navigation controls.',
    payloadSchema: {
      element: { type: 'HTMLElement', description: 'The specific input element whose validity changed, if applicable.' },
      isValid: { type: 'boolean', description: 'True if the step/input is currently valid, false otherwise.' }
    }
  },
  STEP_ACTIVATED: {
    eventName: 'app-creator:step-activated',
    description: 'Fired by the controller after a new step has been successfully loaded and made active in the UI. Components can listen to this to perform actions when a specific step becomes visible.',
    payloadSchema: {
      stepNumber: { type: 'number', description: 'The number of the step that has just been activated.' }
    }
  },

  // API Key Management
  API_KEY_CHECK_START: {
    eventName: 'app-creator:api-key-check-start',
    description: 'Fired at the beginning of the app initialization to signal the start of an API key validation process. Useful for showing loading indicators or disabling UI elements.',
    payloadSchema: { /* No specific payload */ }
  },
  API_KEY_MISSING: {
    eventName: 'app-creator:api-key-missing',
    description: 'Fired if the API key check determines that the required API key is not set or is invalid. This typically triggers UI changes to prompt the user for API key setup.',
    payloadSchema: { /* No specific payload */ }
  },
  API_KEY_PRESENT: {
    eventName: 'app-creator:api-key-present',
    description: 'Fired if the API key check confirms that a valid API key is available, allowing the application to proceed with normal operations.',
    payloadSchema: { /* No specific payload */ }
  },

  // Title & Description Generation
  TITLE_DESCRIPTION_GENERATION_START: {
    eventName: 'app-creator:title-desc-generation-start',
    description: 'Fired when the process of generating an app title and description is initiated, usually after the user provides an initial app idea/prompt. Signals the start of an asynchronous operation.',
    payloadSchema: {
      prompt: { type: 'string', description: 'The user-provided text prompt used as input for generation.' }
    }
  },
  TITLE_DESCRIPTION_GENERATION_CHUNK_RECEIVED: {
    eventName: 'app-creator:title-desc-generation-chunk-received',
    description: 'Fired when a new chunk of data (streaming) for the title and description is received from the generation service (e.g., via IPC). Allows for progressive UI updates.',
    payloadSchema: {
      chunk: { type: 'object', description: 'The data chunk received. Structure may vary based on the service but often contains partial title/description.' },
      done: { type: 'boolean', description: 'True if this is the final chunk and the generation stream is complete.' }
    }
  },
  TITLE_DESCRIPTION_GENERATION_SUCCESS: {
    eventName: 'app-creator:title-desc-generation-success',
    description: 'Fired when the title and description generation process completes successfully and the final content is available.',
    payloadSchema: {
      title: { type: 'string', description: 'The fully generated app title.' },
      description: { type: 'string', description: 'The fully generated app description.' }
    }
  },
  TITLE_DESCRIPTION_GENERATION_FAILURE: {
    eventName: 'app-creator:title-desc-generation-failure',
    description: 'Fired if an error occurs during the title and description generation process.',
    payloadSchema: {
      error: { type: 'string', description: 'A message describing the error that occurred.' }
    }
  },

  // App Generation
  APP_GENERATION_START: {
    eventName: 'app-creator:app-generation-start',
    description: 'Fired when the main app/widget generation process is initiated, using the confirmed title, description, and original prompt. Signals the start of a potentially long asynchronous operation.',
    payloadSchema: {
      title: { type: 'string', description: 'The confirmed app title.' },
      description: { type: 'string', description: 'The confirmed app description.' },
      prompt: { type: 'string', optional: true, description: 'The original user prompt, if needed for context.' }
    }
  },
  APP_GENERATION_CHUNK_RECEIVED: {
    eventName: 'app-creator:app-generation-chunk-received',
    description: 'Fired when a new chunk of data (streaming) for the app/widget code or structure is received from the generation service. Allows for displaying generation progress.',
    payloadSchema: {
      content: { type: 'string', description: 'The chunk of generated content (e.g., code, logs).' },
      done: { type: 'boolean', description: 'True if this is the final chunk and the generation stream is complete.' }
    }
  },
  APP_GENERATION_SUCCESS: {
    eventName: 'app-creator:app-generation-success',
    description: 'Fired when the app/widget generation process completes successfully. The generated app might be stored or ready for display/use.',
    payloadSchema: { /* May include path to generated files or other relevant success data if applicable */ }
  },
  APP_GENERATION_FAILURE: {
    eventName: 'app-creator:app-generation-failure',
    description: 'Fired if an error occurs during the app/widget generation process.',
    payloadSchema: {
      error: { type: 'string', description: 'A message describing the error that occurred.' }
    }
  },

  // Notifications & Window Management (Requests that might be handled by IPC or other services)
  NOTIFY_APP_UPDATED: {
    eventName: 'app-creator:notify-app-updated',
    description: 'Fired to signal that a new app has been created or an existing one updated, prompting other parts of the system (e.g., an app list manager) to refresh or take notice.',
    payloadSchema: { /* Could include app ID or name if relevant */ }
  },
  OPEN_WINDOW_REQUEST: {
    eventName: 'app-creator:open-window-request',
    description: 'Fired when there is a need to open a new application window (e.g., for API setup, help, or a sub-module). This is a request that would typically be handled by a window manager service.',
    payloadSchema: {
      windowName: { type: 'string', description: 'A unique identifier or path for the window to be opened (e.g., "api-setup", "help-viewer").' },
      options: { type: 'object', optional: true, description: 'Additional options for window creation (e.g., size, position, modal).' }
    }
  },
  CLOSE_CURRENT_WINDOW_REQUEST: {
    eventName: 'app-creator:close-current-window-request',
    description: 'Fired to request the closing of the current application window. Typically handled by a window manager service.',
    payloadSchema: { /* No specific payload */ }
  }
});

// Example Usage:
//
// import { AppCreatorEvents } from './app-events.js';
//
// // Publishing an event:
// eventBus.publish(AppCreatorEvents.APP_CREATOR_INITIALIZED.eventName, {});
//
// // Subscribing to an event:
// component.addEventListener(AppCreatorEvents.STEP_NEXT.eventName, (event) => {
//   const stepNumber = event.detail.stepNumber;
//   // Access description: AppCreatorEvents.STEP_NEXT.description
//   // Access payload schema: AppCreatorEvents.STEP_NEXT.payloadSchema
// });
```

## 5. Conceptual Event Flow (Mermaid Diagram)

```mermaid
graph TD
    subgraph AppCreationStepOne
        UserInput -->|Input/Click| A1[Dispatch STEP_VALIDITY_CHANGE]
        NextClick -->|Click| A2[Dispatch STEP_NEXT]
        BackClick -->|Click| A3[Dispatch STEP_BACK]
    end

    subgraph AppCreationController
        B1[Listens for STEP_NEXT] --> B2{Process Step 1 Data}
        B2 -- Prompt --> B3[Dispatch TITLE_DESCRIPTION_GENERATION_START]
        B2 -- Other Steps --> B_Other[Handle Other Steps]

        B4[Listens for STEP_BACK] --> B5[Activate Previous Step]
        B5 --> B6[Dispatch STEP_ACTIVATED]

        B7[Listens for STEP_VALIDITY_CHANGE] --> B8[Update UI (e.g., Next Button State)]

        B9[Initialize App] --> B10[Dispatch APP_CREATOR_INITIALIZED]
        B9 --> B11[Dispatch API_KEY_CHECK_START]
        B11 -- Missing --> B12[Dispatch API_KEY_MISSING]
        B12 --> B13[Dispatch OPEN_WINDOW_REQUEST (api-setup)]
        B12 --> B14[Dispatch CLOSE_CURRENT_WINDOW_REQUEST]
        B11 -- Present --> B15[Dispatch API_KEY_PRESENT]
        B15 --> B16[Activate Step 1]
        B16 --> B6

        IPC_TitleDescChunk --> B17[Dispatch TITLE_DESCRIPTION_GENERATION_CHUNK_RECEIVED]
        B17 -- Success --> B18[Dispatch TITLE_DESCRIPTION_GENERATION_SUCCESS]
        B17 -- Failure --> B19[Dispatch TITLE_DESCRIPTION_GENERATION_FAILURE]

        IPC_AppGenChunk --> B20[Dispatch APP_GENERATION_CHUNK_RECEIVED]
        B20 -- Success --> B21[Dispatch APP_GENERATION_SUCCESS]
        B21 --> B22[Dispatch NOTIFY_APP_UPDATED]
        B21 --> B14 ; Eventually close window
        B20 -- Failure --> B23[Dispatch APP_GENERATION_FAILURE]

        B_Other -- Generate App --> B24[Dispatch APP_GENERATION_START]
    end

    subgraph IPC_Handlers
        IH1[onTitleDescriptionChunk] --> IPC_TitleDescChunk
        IH2[onGenerationChunk] --> IPC_AppGenChunk
    end

    EventBus[(Event Bus)]

    A1 --> EventBus
    A2 --> EventBus
    A3 --> EventBus

    EventBus --> B1
    EventBus --> B4
    EventBus --> B7
    EventBus --> B17
    EventBus --> B20


    B3 --> EventBus
    B6 --> EventBus
    B10 --> EventBus
    B11 --> EventBus
    B12 --> EventBus
    B13 --> EventBus
    B14 --> EventBus
    B15 --> EventBus
    B18 --> EventBus
    B19 --> EventBus
    B21 --> EventBus
    B22 --> EventBus
    B23 --> EventBus
    B24 --> EventBus

    %% Styling for clarity
    classDef component fill:#f9f,stroke:#333,stroke-width:2px;
    classDef event fill:#lightgrey,stroke:#333,stroke-width:1px,color:black;
    classDef ipc fill:#ccf,stroke:#333,stroke-width:2px;

    class AppCreationStepOne,AppCreationController component;
    class IPC_Handlers ipc;
    class A1,A2,A3,B3,B6,B10,B11,B12,B13,B14,B15,B17,B18,B19,B20,B21,B22,B23,B24 event;
```

## 6. Next Steps

Once this plan is actioned (i.e., the `app-events.js` file is created):
1.  Refactor `src/app-creator/components/app-creation-step-one.js` to import and use event names from `AppCreatorEvents`.
2.  Refactor `src/app-creator/components/app-creation-controller.js` to:
    *   Import and use event names from `AppCreatorEvents`.
    *   Transition its internal logic to be more driven by these standardized events.
3.  Update any other relevant components or services within the `app-creator` module to use the new event registry.
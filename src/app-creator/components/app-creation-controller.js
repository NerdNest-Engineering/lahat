/**
 * App Creation Controller
 * Manages the app creation process and coordinates between components
 */

import { showError, logError, ErrorLevel } from '../utils/error-utils.js';
// EventDefinition is imported where it's used if not already via other event imports.
// For events defined in this file, EventDefinition is implicitly available.
import { APP_CREATOR_INITIALIZED } from '../app-creator.js';
import { STEP_NEXT, STEP_BACK } from './base/step-navigation.js';
import { STEP_VALIDITY_CHANGE } from './base/app-creation-step.js';
import {
  TITLE_DESCRIPTION_GENERATION_START,
  TITLE_DESCRIPTION_GENERATION_CHUNK_RECEIVED,
  TITLE_DESCRIPTION_GENERATION_SUCCESS,
  TITLE_DESCRIPTION_GENERATION_FAILURE
} from './steps/app-creation-step-two.js';
import {
  APP_GENERATION_START,
  APP_GENERATION_CHUNK_RECEIVED,
  APP_GENERATION_SUCCESS,
  APP_GENERATION_FAILURE
} from './steps/app-creation-step-three.js';
import { EventDefinition } from '../utils/event-definition.js';


// Step Activation
export const STEP_ACTIVATED = new EventDefinition(
  'app-creator:step-activated',
  'Fired by the controller after a new step has been successfully loaded and made active in the UI. Components can listen to this to perform actions when a specific step becomes visible.',
  { stepNumber: { type: 'number', description: 'The number of the step that has just been activated.' } }
);

// API Key Management
export const API_KEY_CHECK_START = new EventDefinition(
  'app-creator:api-key-check-start',
  'Fired at the beginning of the app initialization to signal the start of an API key validation process. Useful for showing loading indicators or disabling UI elements.',
  { /* No specific payload */ }
);
export const API_KEY_MISSING = new EventDefinition(
  'app-creator:api-key-missing',
  'Fired if the API key check determines that the required API key is not set or is invalid. This typically triggers UI changes to prompt the user for API key setup.',
  { /* No specific payload */ }
);
export const API_KEY_PRESENT = new EventDefinition(
  'app-creator:api-key-present',
  'Fired if the API key check confirms that a valid API key is available, allowing the application to proceed with normal operations.',
  { /* No specific payload */ }
);

// Notifications & Window Management (Requests that might be handled by IPC or other services)
export const NOTIFY_APP_UPDATED = new EventDefinition(
  'app-creator:notify-app-updated',
  'Fired to signal that a new app has been created or an existing one updated, prompting other parts of the system (e.g., an app list manager) to refresh or take notice.',
  { /* Could include app ID or name if relevant */ }
);
export const OPEN_WINDOW_REQUEST = new EventDefinition(
  'app-creator:open-window-request',
  'Fired when there is a need to open a new application window (e.g., for API setup, help, or a sub-module). This is a request that would typically be handled by a window manager service.',
  {
    windowName: { type: 'string', description: 'A unique identifier or path for the window to be opened (e.g., "api-setup", "help-viewer").' },
    options: { type: 'object', optional: true, description: 'Additional options for window creation (e.g., size, position, modal).' }
  }
);
export const CLOSE_CURRENT_WINDOW_REQUEST = new EventDefinition(
  'app-creator:close-current-window-request',
  'Fired to request the closing of the current application window. Typically handled by a window manager service.',
  { /* No specific payload */ }
);

/**
 * App Creation Controller
 * Manages the app creation process and coordinates between components
 */
export class AppCreationController {
  /**
   * Create a new AppCreationController
   * @param {EventBus} eventBus - The event bus for communication
   */
  constructor(eventBus) {
    // Store the event bus
    this.eventBus = eventBus;


    
    

    // Initialize state
    // this.currentStep = 0; // Start at 0, _activateStep will set it to 1
    // this.stepData = {}; // Store data collected from steps if needed across async calls
    // this.stepValidity = false; // Track validity of the current step

    // // Get DOM elements
    // // IMPORTANT: Ensure the <app-creation-step> element in app-creator.html has id="step-container"
    // this.stepContainer = document.getElementById('step-container');
    // this.generationStatus = document.getElementById('generation-status');
    // this.generationPreview = document.getElementById('generation-preview');
    // this.currentStepElement = null; // Reference to the currently slotted step component

    // // Bind methods that will be used as event listeners
    // this._handleStepValidityChange = this._handleStepValidityChange.bind(this);
    // this._handleWrapperNext = this._handleWrapperNext.bind(this);
    // this._handleWrapperBack = this._handleWrapperBack.bind(this);

    // // Remove _initializeSteps call

    // // Set up event listeners
    this._setupEventListeners();
    
    // // Set up IPC event listeners
    // this._setupIpcListeners();
    
    // // Initialize the app
    // this._initializeApp();
  }
  
  // Removed _initializeSteps method

  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    if (!this.stepContainer) {
      logError('_setupEventListeners', 'Step container not found.', ErrorLevel.FATAL);
      showError('Initialization Error', 'Could not find the main step container element.');
      return;
    }
    // Listen to events from the wrapper component using standardized event names
    this.stepContainer.addEventListener(STEP_NEXT, this._handleWrapperNext);
    this.stepContainer.addEventListener(STEP_BACK, this._handleWrapperBack);

    // Step-specific event listeners (like STEP_VALIDITY_CHANGE) are added/removed dynamically in _activateStep
  }
  
  /**
   * Set up IPC event listeners
   * @private
   */
  _setupIpcListeners() {
    // Check if the IPC API is available
    if (window.electronAPI) {
      // Set up IPC event listeners
      // Bind IPC handlers here to ensure 'this' context is correct
      window.electronAPI.onTitleDescriptionChunk(this._handleTitleDescriptionChunk.bind(this));
      window.electronAPI.onGenerationChunk(this._handleGenerationChunk.bind(this));
    } else {
      console.warn('Electron IPC API not available. Running in browser mode.');
    }
  }
  
  /**
   * Initialize the app
   * @private
   */
  async _initializeApp() {
    try {
      // Dispatch API key check start event
      this.eventBus.publish(API_KEY_CHECK_START, {});
      
      // Check if API key is set (if using Electron)
      if (window.electronAPI) {
        const { hasApiKey } = await window.electronAPI.checkApiKey();
        
        if (!hasApiKey) {
          // Publish API key missing event
          this.eventBus.publish(API_KEY_MISSING, {});
          
          // Open API setup window if API key is not set
          window.electronAPI.openWindow('api-setup');
          this.eventBus.publish(OPEN_WINDOW_REQUEST, {
            windowName: 'api-setup'
          });
          
          // Close this window
          window.electronAPI.closeCurrentWindow();
          this.eventBus.publish(CLOSE_CURRENT_WINDOW_REQUEST, {});
          return;
        }
        
        // Publish API key present event
        this.eventBus.publish(API_KEY_PRESENT, {});
      }
      
      // Activate the first step
      // Activate the first step on initialization
      // await this._activateStep(1);

      // Publish event using standardized event name
      this.eventBus.publish(APP_CREATOR_INITIALIZED, {});
    } catch (error) {
      logError('initializeApp', error, ErrorLevel.FATAL);
      showError('Initialization Error', 'Failed to initialize the app creator.');
    }
  }

  /**
   * Handles the 'step-validity-change' event from the current step component.
   * @param {CustomEvent} event - The event containing { detail: { isValid: boolean } }
   * @private
   */
  _handleStepValidityChange(event) {
    this.stepValidity = event.detail.isValid;
    if (this.stepContainer) {
      this.stepContainer.enableNextButton(this.stepValidity);
    }
  }

  /**
   * Handles the 'step-next' event from the wrapper component.
   * @private
   */
  async _handleWrapperNext() {


    // if (!this.currentStepElement || !this.stepValidity) {
    //   logError('_handleWrapperNext', `Next called on invalid state. Step: ${this.currentStep}, Validity: ${this.stepValidity}`, ErrorLevel.WARN);
    //   return; // Should not happen if button is correctly disabled
    // }

    // Disable buttons during processing
    // this.stepContainer.enableNextButton(false);
    // this.stepContainer.showBackButton(false); // Hide back button too? Optional.

    // try {
    //   // --- Step 1 Logic ---
    //   if (this.currentStep === 1) {
    //     const prompt = this.currentStepElement.getOutputData();
    //     this.stepData.prompt = prompt; // Store for potential use in step 2/3

    //     // Show generating state in step 2's preview area (if step 2 exists and has the method)
    //     // We need to anticipate step 2 existing to show its loading state *before* activating it.
    //     // This requires either preloading step 2 or making the loading indicator more generic.
    //     // For now, let's assume a generic loading indicator or handle it post-activation.
    //     if (this.generationStatus) this.generationStatus.show('Generating title...');

    //     console.log('Starting title and description generation...');
        
    //     // Publish title & description generation start event
    //     this.eventBus.publish(TITLE_DESCRIPTION_GENERATION_START, {
    //       prompt
    //     });
        
    //     let result;
    //     if (window.electronAPI) {
    //       result = await window.electronAPI.generateTitleAndDescription({ input: prompt });
    //     } else {
    //       // Placeholder for browser mode
    //       await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
    //       result = { success: true, title: "Generated Title", description: "Generated Description" };
    //     }
    //     console.log('Title and description generation completed:', result);

    //     if (this.generationStatus) this.generationStatus.hide();

    //     // Publish title & description generation success event
    //     if (result.success && result.title && result.description) {
    //       this.eventBus.publish(TITLE_DESCRIPTION_GENERATION_SUCCESS, {
    //         title: result.title,
    //         description: result.description
    //       });
    //       // Pass necessary data to step 2
    //       await this._activateStep(2, {
    //         userInput: prompt,
    //         title: result.title,
    //         description: result.description
    //       });
    //     } else {
    //       console.error('Title/description generation failed:', result.error);
    //       // Publish title & description generation failure event
    //       this.eventBus.publish(TITLE_DESCRIPTION_GENERATION_FAILURE, {
    //         error: result.error || 'Unknown error'
    //       });
    //       showError('Failed to generate title and description', result.error);
    //       // Re-enable buttons on failure
    //       this.stepContainer.enableNextButton(this.stepValidity); // Re-enable based on current validity
    //       this.stepContainer.showBackButton(this.currentStep > 1);
    //     }
    //   }
    //   // --- Step 2 Logic ---
    //   else if (this.currentStep === 2) {
    //     const { title, description } = this.currentStepElement.getOutputData();
    //     this.stepData.title = title;
    //     this.stepData.description = description;
    //     // Pass data to step 3 if needed
    //     await this._activateStep(3, { title, description, prompt: this.stepData.prompt });
    //   }
    //   // --- Step 3 Logic ---
    //   else if (this.currentStep === 3) {
    //     // Assuming step 3 provides the final data needed for generation
    //     const finalData = this.currentStepElement.getOutputData(); // Or use stored this.stepData

    //     if (this.generationStatus) this.generationStatus.show('Generating app...');
    //     if (this.generationPreview) {
    //       this.generationPreview.reset();
    //       this.generationPreview.show();
    //     }
    //     // Optionally call a method on step 3 to show its internal generating state
    //     if (typeof this.currentStepElement.setGeneratingState === 'function') {
    //        this.currentStepElement.setGeneratingState(true);
    //     }


    //     console.log('Starting app generation...');
        
    //     // Publish app generation start event
    //     this.eventBus.publish(APP_GENERATION_START, {
    //       title: finalData.title,
    //       description: finalData.description,
    //       prompt: this.stepData.prompt
    //     });
        
    //     let result;
    //     if (window.electronAPI) {
    //       result = await window.electronAPI.generateWidget({
    //         appName: finalData.title, // Use data from step 3 or stored data
    //         prompt: finalData.description // Use data from step 3 or stored data
    //       });
    //     } else {
    //       // Placeholder for browser mode
    //        await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate delay
    //       result = { success: true };
    //     }
    //     console.log('App generation completed:', result);

    //     if (this.generationStatus) this.generationStatus.hide();
    //      if (typeof this.currentStepElement.setGeneratingState === 'function') {
    //        this.currentStepElement.setGeneratingState(false);
    //     }


    //     if (result.success) {
    //       // Publish app generation success event
    //       this.eventBus.publish(APP_GENERATION_SUCCESS, {});
          
    //       if (window.electronAPI) {
    //         window.electronAPI.notifyAppUpdated();
    //         this.eventBus.publish(NOTIFY_APP_UPDATED, {});
    //       }
    //       showError('App created successfully', 'Your app has been created.', ErrorLevel.INFO);
    //        if (typeof this.currentStepElement.setCompletedState === 'function') {
    //          this.currentStepElement.setCompletedState();
    //       }
    //       // Optionally close window after delay
    //       setTimeout(() => {
    //         if (window.electronAPI) {
    //           window.electronAPI.closeCurrentWindow();
    //           this.eventBus.publish(CLOSE_CURRENT_WINDOW_REQUEST, {});
    //         }
    //       }, 3000);
    //     } else {
    //       console.error('App generation failed:', result.error);
    //       // Publish app generation failure event
    //       this.eventBus.publish(APP_GENERATION_FAILURE, {
    //         error: result.error
    //       });
    //       showError('Failed to generate app', result.error);
    //        if (typeof this.currentStepElement.setErrorState === 'function') {
    //          this.currentStepElement.setErrorState(result.error);
    //       }
    //       // Re-enable buttons on failure
    //       this.stepContainer.enableNextButton(this.stepValidity);
    //       this.stepContainer.showBackButton(this.currentStep > 1);
    //     }
    //   }
    // } catch (error) {
    //   logError(`_handleWrapperNext (Step ${this.currentStep})`, error, ErrorLevel.ERROR);
    //   showError('An unexpected error occurred', error.message);
    //   if (this.generationStatus) this.generationStatus.hide();
    //   // Ensure buttons are re-enabled on unexpected error
    //   this.stepContainer.enableNextButton(this.stepValidity);
    //   this.stepContainer.showBackButton(this.currentStep > 1);
    //    if (this.currentStepElement && typeof this.currentStepElement.setErrorState === 'function') {
    //      this.currentStepElement.setErrorState(error.message);
    //   }
    // }
    // // Note: Buttons might remain disabled on success if the window closes or moves to a final state.
  }

  /**
   * Handles the 'step-back' event from the wrapper component.
   * @private
   */
  async _handleWrapperBack() {
    if (this.currentStep > 1) {
      await this._activateStep(this.currentStep - 1);
    }
  }

  /**
   * Activate a step: remove old, create new, add to slot, update wrapper.
   * @param {number} stepNumber - The step number to activate.
   * @param {object | null} [dataToPass=null] - Optional data to pass to the new step's initializeData method.
   * @private
   */
  async _activateStep(stepNumber, dataToPass = null) {
    if (!this.stepContainer) {
       logError('_activateStep', 'Step container not found.', ErrorLevel.FATAL);
       return;
    }

    const stepsConfig = {
      1: { tagName: 'app-creation-step-one', title: 'Describe Your App' },
      2: { tagName: 'app-creation-step-two', title: 'Review Title & Description' },
      3: { tagName: 'app-creation-step-three', title: 'Generate App' }
      // Add other steps here
    };

    const config = stepsConfig[stepNumber];
    if (!config) {
      logError('_activateStep', `Invalid step number: ${stepNumber}`, ErrorLevel.ERROR);
      return;
    }

    // --- Teardown previous step ---
    if (this.currentStepElement) {
      this.currentStepElement.removeEventListener('step-validity-change', this._handleStepValidityChange);
      // Check if parentNode exists before removing
      if (this.currentStepElement.parentNode === this.stepContainer) {
         this.stepContainer.removeChild(this.currentStepElement);
      } else {
         logError('_activateStep', 'Current step element not found in container during removal.', ErrorLevel.WARN);
      }
      this.currentStepElement = null;
    }

    // Reset validity for the new step
    this.stepValidity = false;

    // --- Setup new step ---
    const newStep = document.createElement(config.tagName);
    this.currentStepElement = newStep; // Assign early for potential IPC handlers

    // Initialize data if method exists and data is provided
    if (dataToPass && typeof newStep.initializeData === 'function') {
      try {
        newStep.initializeData(dataToPass);
      } catch (error) {
         logError(`_activateStep ${config.tagName}.initializeData`, error, ErrorLevel.ERROR);
         showError('Step Initialization Error', `Failed to initialize step ${stepNumber}.`);
         // Potentially revert or handle error state
         this.currentStepElement = null; // Clear ref if init failed
         return;
      }
    }

    // Add listener for validity changes using standardized event name
    newStep.addEventListener(STEP_VALIDITY_CHANGE, this._handleStepValidityChange);

    // Add the new step to the container's slot (implicitly)
    this.stepContainer.appendChild(newStep);

    // --- Update Wrapper ---
    this.stepContainer.setStepNumber(stepNumber);
    this.stepContainer.setStepTitle(config.title);
    this.stepContainer.showBackButton(stepNumber > 1);
    this.stepContainer.enableNextButton(this.stepValidity); // Set initial button state based on (likely false) validity
    this.stepContainer.setCompleted(false); // Reset completed state visually

    // Update controller state
    this.currentStep = stepNumber;

    // Publish step activated event using standardized event name
    this.eventBus.publish(STEP_ACTIVATED, {
      stepNumber
    });

    // Small delay to allow DOM update before potentially checking validity again
    await new Promise(resolve => setTimeout(resolve, 0));
    // Re-check initial validity in case initializeData set valid state
     if (typeof newStep.checkValidity === 'function') { // Or re-trigger input handler if appropriate
        newStep.checkValidity(); // Assuming steps might have a method to check initial state
     } else if (typeof newStep._handleInputChange === 'function') { // Fallback for simple cases
        newStep._handleInputChange();
     }

  }

  // Removed _handleStepOneNext, _handleStepTwoNext, _handleGenerateApp
  
  /**
   * Handle title description chunk
   * @param {Object} chunk - The chunk
   * @private
   */
  _handleTitleDescriptionChunk(chunk) {
    console.log('Received title/description chunk:', chunk);
    
    // Publish title & description generation chunk received event
    this.eventBus.publish(TITLE_DESCRIPTION_GENERATION_CHUNK_RECEIVED, {
      chunk: chunk,
      done: chunk.done || false
    });
    
    // Route chunk to the current step if it handles it (specifically step 2)
    if (this.currentStep === 2 && this.currentStepElement && typeof this.currentStepElement.handleInProgressChunk === 'function') {
       if (chunk.done) {
         if(typeof this.currentStepElement.handleCompletedChunk === 'function') {
            this.currentStepElement.handleCompletedChunk(chunk);
         }
       } else {
         this.currentStepElement.handleInProgressChunk(chunk);
       }
    } else if (chunk.done && this.currentStep === 2) {
        // Handle case where step 2 might not have finished processing before 'done' arrives
        logError('_handleTitleDescriptionChunk', 'Received done chunk but step 2 or handler missing/inactive.', ErrorLevel.WARN);
    }
 }
  
  /**
   * Handle generation chunk
   * @param {Object} chunk - The chunk
   * @private
   */
  _handleGenerationChunk(chunk) {
    // Publish app generation chunk received event
    this.eventBus.publish(APP_GENERATION_CHUNK_RECEIVED, {
      content: chunk.content || '',
      done: chunk.done || false
    });
    
    // Handle generation preview updates (seems separate from step components)
    if (this.generationPreview) {
      if (chunk.done) {
        this.generationPreview.handleGenerationComplete();
      } else {
        this.generationPreview.handleGenerationProgress(chunk.content);
      }
    }

    // Optionally route to step 3 if it needs to display generation progress
     if (this.currentStep === 3 && this.currentStepElement && typeof this.currentStepElement.handleGenerationChunk === 'function') {
        this.currentStepElement.handleGenerationChunk(chunk);
     }
  }
}

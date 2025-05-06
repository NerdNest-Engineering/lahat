/**
 * App Creation Controller
 * Manages the app creation process and coordinates between components
 */

import { showError, logError, ErrorLevel } from '../utils/error-utils.js';

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
    this.currentStep = 0; // Start at 0, _activateStep will set it to 1
    this.stepData = {}; // Store data collected from steps if needed across async calls
    this.stepValidity = false; // Track validity of the current step

    // Get DOM elements
    // IMPORTANT: Ensure the <app-creation-step> element in app-creator.html has id="step-container"
    this.stepContainer = document.getElementById('step-container');
    this.generationStatus = document.getElementById('generation-status');
    this.generationPreview = document.getElementById('generation-preview');
    this.currentStepElement = null; // Reference to the currently slotted step component

    // Bind methods that will be used as event listeners
    this._handleStepValidityChange = this._handleStepValidityChange.bind(this);
    this._handleWrapperNext = this._handleWrapperNext.bind(this);
    this._handleWrapperBack = this._handleWrapperBack.bind(this);

    // Remove _initializeSteps call

    // Set up event listeners
    // this._setupEventListeners();
    
    // Set up IPC event listeners
    this._setupIpcListeners();
    
    // Initialize the app
    this._initializeApp();
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
    // Listen to events from the wrapper component
    this.stepContainer.addEventListener('step-next', this._handleWrapperNext);
    this.stepContainer.addEventListener('step-back', this._handleWrapperBack);

    // Step-specific event listeners (like step-validity-change) are added/removed dynamically in _activateStep
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
      // Check if API key is set (if using Electron)
      if (window.electronAPI) {
        const { hasApiKey } = await window.electronAPI.checkApiKey();
        
        if (!hasApiKey) {
          // Open API setup window if API key is not set
          window.electronAPI.openWindow('api-setup');
          
          // Close this window
          window.electronAPI.closeCurrentWindow();
          return;
        }
      }
      
      // Activate the first step
      // Activate the first step on initialization
      // await this._activateStep(1);

      // Publish event
      this.eventBus.publish('app-creator-initialized', {});
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
    if (!this.currentStepElement || !this.stepValidity) {
      logError('_handleWrapperNext', `Next called on invalid state. Step: ${this.currentStep}, Validity: ${this.stepValidity}`, ErrorLevel.WARN);
      return; // Should not happen if button is correctly disabled
    }

    // Disable buttons during processing
    this.stepContainer.enableNextButton(false);
    this.stepContainer.showBackButton(false); // Hide back button too? Optional.

    try {
      // --- Step 1 Logic ---
      if (this.currentStep === 1) {
        const prompt = this.currentStepElement.getOutputData();
        this.stepData.prompt = prompt; // Store for potential use in step 2/3

        // Show generating state in step 2's preview area (if step 2 exists and has the method)
        // We need to anticipate step 2 existing to show its loading state *before* activating it.
        // This requires either preloading step 2 or making the loading indicator more generic.
        // For now, let's assume a generic loading indicator or handle it post-activation.
        if (this.generationStatus) this.generationStatus.show('Generating title...');

        console.log('Starting title and description generation...');
        let result;
        if (window.electronAPI) {
          result = await window.electronAPI.generateTitleAndDescription({ input: prompt });
        } else {
          // Placeholder for browser mode
          await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
          result = { success: true, title: "Generated Title", description: "Generated Description" };
        }
        console.log('Title and description generation completed:', result);

        if (this.generationStatus) this.generationStatus.hide();

        if (result.success && result.title && result.description) {
          // Pass necessary data to step 2
          await this._activateStep(2, {
            userInput: prompt,
            title: result.title,
            description: result.description
          });
        } else {
          console.error('Title/description generation failed:', result.error);
          showError('Failed to generate title and description', result.error);
          // Re-enable buttons on failure
          this.stepContainer.enableNextButton(this.stepValidity); // Re-enable based on current validity
          this.stepContainer.showBackButton(this.currentStep > 1);
        }
      }
      // --- Step 2 Logic ---
      else if (this.currentStep === 2) {
        const { title, description } = this.currentStepElement.getOutputData();
        this.stepData.title = title;
        this.stepData.description = description;
        // Pass data to step 3 if needed
        await this._activateStep(3, { title, description, prompt: this.stepData.prompt });
      }
      // --- Step 3 Logic ---
      else if (this.currentStep === 3) {
        // Assuming step 3 provides the final data needed for generation
        const finalData = this.currentStepElement.getOutputData(); // Or use stored this.stepData

        if (this.generationStatus) this.generationStatus.show('Generating app...');
        if (this.generationPreview) {
          this.generationPreview.reset();
          this.generationPreview.show();
        }
        // Optionally call a method on step 3 to show its internal generating state
        if (typeof this.currentStepElement.setGeneratingState === 'function') {
           this.currentStepElement.setGeneratingState(true);
        }


        console.log('Starting app generation...');
        let result;
        if (window.electronAPI) {
          result = await window.electronAPI.generateWidget({
            appName: finalData.title, // Use data from step 3 or stored data
            prompt: finalData.description // Use data from step 3 or stored data
          });
        } else {
          // Placeholder for browser mode
           await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate delay
          result = { success: true };
        }
        console.log('App generation completed:', result);

        if (this.generationStatus) this.generationStatus.hide();
         if (typeof this.currentStepElement.setGeneratingState === 'function') {
           this.currentStepElement.setGeneratingState(false);
        }


        if (result.success) {
          if (window.electronAPI) window.electronAPI.notifyAppUpdated();
          showError('App created successfully', 'Your app has been created.', ErrorLevel.INFO);
           if (typeof this.currentStepElement.setCompletedState === 'function') {
             this.currentStepElement.setCompletedState();
          }
          // Optionally close window after delay
          setTimeout(() => {
            if (window.electronAPI) window.electronAPI.closeCurrentWindow();
          }, 3000);
        } else {
          console.error('App generation failed:', result.error);
          showError('Failed to generate app', result.error);
           if (typeof this.currentStepElement.setErrorState === 'function') {
             this.currentStepElement.setErrorState(result.error);
          }
          // Re-enable buttons on failure
          this.stepContainer.enableNextButton(this.stepValidity);
          this.stepContainer.showBackButton(this.currentStep > 1);
        }
      }
    } catch (error) {
      logError(`_handleWrapperNext (Step ${this.currentStep})`, error, ErrorLevel.ERROR);
      showError('An unexpected error occurred', error.message);
      if (this.generationStatus) this.generationStatus.hide();
      // Ensure buttons are re-enabled on unexpected error
      this.stepContainer.enableNextButton(this.stepValidity);
      this.stepContainer.showBackButton(this.currentStep > 1);
       if (this.currentStepElement && typeof this.currentStepElement.setErrorState === 'function') {
         this.currentStepElement.setErrorState(error.message);
      }
    }
    // Note: Buttons might remain disabled on success if the window closes or moves to a final state.
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

    // Add listener for validity changes
    newStep.addEventListener('step-validity-change', this._handleStepValidityChange);

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

    // Publish event (optional, if other parts of the app need to know)
    this.eventBus.publish('step-activated', { stepNumber });

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

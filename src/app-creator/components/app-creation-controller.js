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
    this.currentStep = 1;
    this.currentInput = '';
    this.generatedTitle = '';
    this.generatedDescription = '';
    
    // Get DOM elements
    this.stepOne = document.getElementById('step-1');
    this.stepTwo = document.getElementById('step-2');
    this.stepThree = document.getElementById('step-3');
    this.stepFour = document.getElementById('step-4');
    this.stepFive = document.getElementById('step-5');
    this.stepSix = document.getElementById('step-6');
    this.generationStatus = document.getElementById('generation-status');
    this.generationPreview = document.getElementById('generation-preview');
    
    // Set up step numbers and titles
    this._initializeSteps();
    
    // Set up event listeners
    this._setupEventListeners();
    
    // Set up IPC event listeners
    this._setupIpcListeners();
    
    // Initialize the app
    this._initializeApp();
  }
  
  /**
   * Initialize the steps
   * @private
   */
  _initializeSteps() {
    // Set step numbers and titles
    if (this.stepOne) {
      this.stepOne.setStepNumber(1);
      this.stepOne.setStepTitle('Describe Your App');
    }
    
    if (this.stepTwo) {
      this.stepTwo.setStepNumber(2);
      this.stepTwo.setStepTitle('Title and Description');
      this.stepTwo.showBackButton(true);
    }
    
    if (this.stepThree) {
      this.stepThree.setStepNumber(3);
      this.stepThree.setStepTitle('Component Analysis');
      this.stepThree.showBackButton(true);
    }
    
    if (this.stepFour) {
      this.stepFour.setStepNumber(4);
      this.stepFour.setStepTitle('Component Structure');
      this.stepFour.showBackButton(true);
    }
    
    if (this.stepFive) {
      this.stepFive.setStepNumber(5);
      this.stepFive.setStepTitle('Event Communication');
      this.stepFive.showBackButton(true);
    }
    
    if (this.stepSix) {
      this.stepSix.setStepNumber(6);
      this.stepSix.setStepTitle('Generation');
      this.stepSix.showBackButton(true);
      this.stepSix.setNextButtonText('Create App');
    }
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // Step navigation events
    document.addEventListener('step-next', this._handleStepNext.bind(this));
    document.addEventListener('step-back', this._handleStepBack.bind(this));
    
    // Step-specific events
    if (this.stepOne) {
      this.stepOne.addEventListener('step-one-next', this._handleStepOneNext.bind(this));
    }
    
    if (this.stepTwo) {
      this.stepTwo.addEventListener('generate-app', this._handleGenerateApp.bind(this));
    }
  }
  
  /**
   * Set up IPC event listeners
   * @private
   */
  _setupIpcListeners() {
    // Check if the IPC API is available
    if (window.electronAPI) {
      // Set up IPC event listeners
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
      this._activateStep(1);
      
      // Publish event
      this.eventBus.publish('app-creator-initialized', {});
    } catch (error) {
      logError('initializeApp', error, ErrorLevel.FATAL);
    }
  }
  
  /**
   * Handle step next event
   * @param {CustomEvent} event - The event
   * @private
   */
  _handleStepNext(event) {
    const { stepNumber } = event.detail;
    this._activateStep(stepNumber + 1);
  }
  
  /**
   * Handle step back event
   * @param {CustomEvent} event - The event
   * @private
   */
  _handleStepBack(event) {
    const { stepNumber } = event.detail;
    this._activateStep(stepNumber - 1);
  }
  
  /**
   * Activate a step
   * @param {number} stepNumber - The step number to activate
   * @private
   */
  _activateStep(stepNumber) {
    // Deactivate all steps
    [this.stepOne, this.stepTwo, this.stepThree, this.stepFour, this.stepFive, this.stepSix]
      .filter(Boolean)
      .forEach(step => step.setActive(false));
    
    // Activate the requested step
    switch (stepNumber) {
      case 1:
        if (this.stepOne) {
          this.stepOne.setActive(true);
        }
        break;
      case 2:
        if (this.stepTwo) {
          this.stepTwo.setActive(true);
        }
        break;
      case 3:
        if (this.stepThree) {
          this.stepThree.setActive(true);
        }
        break;
      case 4:
        if (this.stepFour) {
          this.stepFour.setActive(true);
        }
        break;
      case 5:
        if (this.stepFive) {
          this.stepFive.setActive(true);
        }
        break;
      case 6:
        if (this.stepSix) {
          this.stepSix.setActive(true);
        }
        break;
    }
    
    // Update current step
    this.currentStep = stepNumber;
    
    // Publish event
    this.eventBus.publish('step-activated', { stepNumber });
  }
  
  /**
   * Handle step one next event
   * @param {CustomEvent} event - The event
   * @private
   */
  async _handleStepOneNext(event) {
    this.currentInput = event.detail.input;
    
    // Show loading indicator
    if (this.generationStatus) {
      this.generationStatus.show('Generating title and description...');
    }
    
    // Show the preview section with a loading message
    if (this.stepTwo) {
      this.stepTwo.showPreview();
      this.stepTwo.setGeneratingState();
    }
    
    // Force a small delay to ensure the UI updates before making the API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      console.log('Starting title and description generation...');
      
      // Generate title and description
      let result;
      
      if (window.electronAPI) {
        // Use Electron IPC
        result = await window.electronAPI.generateTitleAndDescription({
          input: this.currentInput
        });
      } else {
        // Use direct API call (browser mode)
        // This is a placeholder - in a real app, you would implement this
        result = { success: true };
      }
      
      console.log('Title and description generation completed:', result);
      
      if (result.success) {
        // Display the user input
        if (this.stepTwo) {
          this.stepTwo.setUserInput(this.currentInput);
        }
        
        // Hide step 1, show step 2
        this._activateStep(2);
      } else {
        console.error('Title/description generation failed:', result.error);
        showError('Failed to generate title and description', result.error);
        
        // Show the button container again if there was an error
        if (this.stepOne) {
          this.stepOne.resetButtonContainer();
        }
      }
    } catch (error) {
      console.error('Unexpected error during title/description generation:', error);
      showError('An unexpected error occurred', error.message);
      
      // Show the button container again if there was an error
      if (this.stepOne) {
        this.stepOne.resetButtonContainer();
      }
    } finally {
      // Hide loading indicator
      if (this.generationStatus) {
        this.generationStatus.hide();
      }
      
      // Reset preview header if we're still in step 1 (error occurred)
      if (this.stepOne && this.stepOne.isActive()) {
        if (this.stepTwo) {
          this.stepTwo.setPreviewHeader('We will build...');
        }
      }
    }
  }
  
  /**
   * Handle generate app event
   * @param {CustomEvent} event - The event
   * @private
   */
  async _handleGenerateApp(event) {
    // Show loading indicator
    if (this.generationStatus) {
      this.generationStatus.show('Generating app...');
    }
    
    // Reset and show generation preview
    if (this.generationPreview) {
      this.generationPreview.reset();
      this.generationPreview.show();
    }
    
    try {
      let result;
      
      if (window.electronAPI) {
        // Use Electron IPC
        result = await window.electronAPI.generateWidget({
          appName: event.detail.title,
          prompt: event.detail.description
        });
      } else {
        // Use direct API call (browser mode)
        // This is a placeholder - in a real app, you would implement this
        result = { success: true };
      }
      
      if (result.success) {
        // Notify main window to refresh app list
        if (window.electronAPI) {
          window.electronAPI.notifyAppUpdated();
        }
        
        // Show success message
        showError('App created successfully', 'Your app has been created and added to the app list.', ErrorLevel.INFO);
        
        // Close this window after a short delay
        setTimeout(() => {
          if (window.electronAPI) {
            window.electronAPI.closeCurrentWindow();
          }
        }, 2000);
      } else {
        console.error('App generation failed:', result.error);
        showError('Failed to generate app', result.error);
        
        // Show the button container again if there was an error
        if (this.stepTwo) {
          this.stepTwo.resetButtonContainer();
        }
      }
    } catch (error) {
      console.error('Unexpected error during app generation:', error);
      showError('An unexpected error occurred', error.message);
      
      // Show the button container again if there was an error
      if (this.stepTwo) {
        this.stepTwo.resetButtonContainer();
      }
    } finally {
      // Hide loading indicator
      if (this.generationStatus) {
        this.generationStatus.hide();
      }
    }
  }
  
  /**
   * Handle title description chunk
   * @param {Object} chunk - The chunk
   * @private
   */
  _handleTitleDescriptionChunk(chunk) {
    console.log('Received title/description chunk:', chunk);
    
    if (this.stepTwo) {
      if (chunk.done) {
        this.stepTwo.handleCompletedChunk(chunk);
      } else {
        this.stepTwo.handleInProgressChunk(chunk);
      }
    }
  }
  
  /**
   * Handle generation chunk
   * @param {Object} chunk - The chunk
   * @private
   */
  _handleGenerationChunk(chunk) {
    if (this.generationPreview) {
      if (chunk.done) {
        this.generationPreview.handleGenerationComplete();
      } else {
        this.generationPreview.handleGenerationProgress(chunk.content);
      }
    }
  }
}

/**
 * App Creation Controller
 * Main controller for the app creation process
 */

// Step configuration - makes it easy to add/remove steps
const APP_CREATION_STEPS = [
  { id: 'step-1' }, // Step One: User Input
  { id: 'step-2' }, // Step Two: Title & Description
  { id: 'step-3' }  // Step Three: Mini App Generation
];

/**
 * AppCreationController class
 * Manages the app creation process by orchestrating the flow between steps
 * This controller is intentionally "dumb" - it only handles step transitions
 * and passes data between steps. All business logic is encapsulated in the steps.
 */
export class AppCreationController {
  constructor() {
    // Initialize step registry
    this.steps = APP_CREATION_STEPS.map(stepConfig => document.getElementById(stepConfig.id));
    this.currentStepIndex = -1;
    
    // Set up generic event listeners for all steps
    this.steps.forEach(step => {
      step.addEventListener('step-complete', this.handleStepComplete.bind(this));
      step.addEventListener('step-error', this.handleStepError.bind(this));
    });
    
    // Set up event listeners using the domain API for streaming updates
    this.unsubscribeGenerationProgress = window.appCreationService.onGenerationProgress(
      this.handleGenerationChunk.bind(this)
    );
    
    this.unsubscribeTitleDescriptionProgress = window.appCreationService.onTitleDescriptionProgress(
      this.handleTitleDescriptionChunk.bind(this)
    );
    
    // Initialize the app
    this.initializeApp();
  }
  
  async initializeApp() {
    // Check if API key is set - using window.electronAPI for now as this is not part of app creation
    const { hasApiKey } = await window.electronAPI.checkApiKey();
    
    if (!hasApiKey) {
      // Open API setup window if API key is not set
      window.electronAPI.openWindow('api-setup');
      
      // Close this window
      window.electronAPI.closeCurrentWindow();
      return;
    }
    
    // Start with step one
    if (this.steps.length > 0) {
      this.steps[0].startStep();
      this.currentStepIndex = 0;
    }
  }
  
  /**
   * Handle completion of a step
   * @param {CustomEvent} event - The step-complete event
   */
  handleStepComplete(event) {
    const currentStep = event.target;
    const currentIndex = this.steps.indexOf(currentStep);
    
    // End current step
    currentStep.endStep();
    
    // Move to next step if available
    if (currentIndex < this.steps.length - 1) {
      const nextStep = this.steps[currentIndex + 1];
      nextStep.startStep(event.detail);
      this.currentStepIndex = currentIndex + 1;
    } else {
      // We're at the last step, complete the process
      this.completeProcess(event.detail);
    }
  }
  
  /**
   * Handle error in a step
   * @param {CustomEvent} event - The step-error event
   */
  handleStepError(event) {
    const currentStep = event.target;
    const currentIndex = this.steps.indexOf(currentStep);
    
    // End current step
    currentStep.endStep();
    
    // Go back to previous step if available
    if (currentIndex > 0) {
      const previousStep = this.steps[currentIndex - 1];
      previousStep.startStep();
      this.currentStepIndex = currentIndex - 1;
    } else {
      // We're at the first step, just restart it
      currentStep.startStep();
    }
  }
  
  /**
   * Complete the app creation process
   * @param {Object} data - Data from the final step
   */
  completeProcess(data) {
    // Notify main window to refresh app list
    window.electronAPI.notifyAppUpdated();
    
    // Close this window after a short delay
    setTimeout(() => {
      window.electronAPI.closeCurrentWindow();
    }, 2000);
  }
  
  /**
   * Handle title/description generation chunks
   * @param {Object} chunk - The chunk of title/description data
   */
  handleTitleDescriptionChunk(chunk) {
    // Pass the chunk to step two for handling (index 1)
    if (this.steps.length > 1) {
      const stepTwo = this.steps[1];
      if (chunk.done) {
        stepTwo.handleCompletedChunk(chunk);
      } else {
        stepTwo.handleInProgressChunk(chunk);
      }
    }
  }
  
  /**
   * Handle mini app generation chunks
   * @param {Object} chunk - The chunk of generation data
   */
  handleGenerationChunk(chunk) {
    // Pass the chunk to step three for handling (index 2)
    if (this.steps.length > 2) {
      const stepThree = this.steps[2];
      if (chunk.done) {
        stepThree.handleGenerationComplete();
      } else {
        stepThree.handleGenerationProgress(chunk.content);
      }
    }
  }
  
  // Clean up when component is destroyed
  disconnectedCallback() {
    // Clean up event listeners
    if (this.unsubscribeGenerationProgress) {
      this.unsubscribeGenerationProgress();
    }
    
    if (this.unsubscribeTitleDescriptionProgress) {
      this.unsubscribeTitleDescriptionProgress();
    }
  }
}

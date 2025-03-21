/**
 * App Creation Controller
 * Main controller for the app creation process
 */

import { showError } from './utils.js';

/**
 * AppCreationController class
 * Manages the app creation process and coordinates between components
 */
export class AppCreationController {
  constructor() {
    // Initialize state
    this.currentInput = '';
    
    // Get DOM elements
    this.stepOne = document.getElementById('step-1');
    this.stepTwo = document.getElementById('step-2');
    this.generationStatus = document.getElementById('generation-status');
    this.generationPreview = document.getElementById('generation-preview');
    
    // Set up event listeners
    this.stepOne.addEventListener('step-one-next', this.handleStepOneNext.bind(this));
    this.stepTwo.addEventListener('generate-app', this.handleGenerateApp.bind(this));
    
    // Set up IPC event listeners
    window.electronAPI.onTitleDescriptionChunk(this.handleTitleDescriptionChunk.bind(this));
    window.electronAPI.onGenerationChunk(this.handleGenerationChunk.bind(this));
    
    // Initialize the app
    this.initializeApp();
  }
  
  async initializeApp() {
    // Check if API key is set
    const { hasApiKey } = await window.electronAPI.checkApiKey();
    
    if (!hasApiKey) {
      // Open API setup window if API key is not set
      window.electronAPI.openWindow('api-setup');
      
      // Close this window
      window.electronAPI.closeCurrentWindow();
      return;
    }
  }
  
  async handleStepOneNext(event) {
    this.currentInput = event.detail.input;
    
    // Show loading indicator with enhanced visibility
    this.generationStatus.show('Generating title and description...');
    
    // Show the preview section with a loading message
    this.stepTwo.showPreview();
    this.stepTwo.setGeneratingState();
    
    // Reset the preview fields
    this.stepTwo.generatedTitle.value = '';
    this.stepTwo.generatedDescription.value = '';
    
    // Force a small delay to ensure the UI updates before making the API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      console.log('Starting title and description generation...');
      // Generate title and description
      const result = await window.electronAPI.generateTitleAndDescription({
        input: this.currentInput
      });
      console.log('Title and description generation completed:', result);
      
      if (result.success) {
        // Display the user input
        this.stepTwo.setUserInput(this.currentInput);
        
        // Hide step 1, show step 2
        this.stepOne.setActive(false);
        this.stepTwo.setActive(true);
      } else {
        console.error('Title/description generation failed:', result.error);
        showError('Failed to generate title and description', result.error);
        // Show the button container again if there was an error
        this.stepOne.resetButtonContainer();
      }
    } catch (error) {
      console.error('Unexpected error during title/description generation:', error);
      showError('An unexpected error occurred', error.message);
      // Show the button container again if there was an error
      this.stepOne.resetButtonContainer();
    } finally {
      // Hide loading indicator
      this.generationStatus.hide();
      
      // Reset preview header if we're still in step 1 (error occurred)
      if (this.stepOne.classList.contains('active')) {
        this.stepTwo.setPreviewHeader('We will build...');
      }
    }
  }
  
  async handleGenerateApp(event) {
    // Show loading indicator
    this.generationStatus.show('Generating widget...');
    
    // Reset and show generation preview
    this.generationPreview.reset();
    this.generationPreview.show();
    
    try {
      const result = await window.electronAPI.generateWidget({
        appName: event.detail.title,
        prompt: event.detail.description
      });
      
      if (result.success) {
        // Notify main window to refresh app list
        window.electronAPI.notifyAppUpdated();
        
        // Close this window after a short delay
        setTimeout(() => {
          window.electronAPI.closeCurrentWindow();
        }, 2000);
      } else {
        console.error('Widget generation failed:', result.error);
        showError('Failed to generate widget', result.error);
        // Show the button container again if there was an error
        this.stepTwo.resetButtonContainer();
      }
    } catch (error) {
      console.error('Unexpected error during widget generation:', error);
      showError('An unexpected error occurred', error.message);
      // Show the button container again if there was an error
      this.stepTwo.resetButtonContainer();
    } finally {
      // Hide loading indicator
      this.generationStatus.hide();
    }
  }
  
  handleTitleDescriptionChunk(chunk) {
    console.log('Received title/description chunk:', chunk);
    
    if (chunk.done) {
      this.stepTwo.handleCompletedChunk(chunk);
    } else {
      this.stepTwo.handleInProgressChunk(chunk);
    }
  }
  
  handleGenerationChunk(chunk) {
    if (chunk.done) {
      this.generationPreview.handleGenerationComplete();
    } else {
      this.generationPreview.handleGenerationProgress(chunk.content);
    }
  }
}

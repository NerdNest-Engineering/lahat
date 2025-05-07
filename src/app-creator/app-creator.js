/**
 * App Creator Module
 * Main JavaScript file for the app creator module
 * 
 * This file initializes the app creator module and sets up the event handlers.
 */

import { AppCreationController } from './components/app-creation-controller.js';
import { EventBus } from './utils/event-bus.js';
import { ErrorContainer, ErrorMessage } from './components/ui/error-container.js';
import { AppCreationStep } from './components/base/app-creation-step.js';
import './components/steps/app-creation-step-one.js';
import { AppCreationStepTwo } from './components/steps/app-creation-step-two.js';
import { AppCreationStepThree } from './components/steps/app-creation-step-three.js';
import { GenerationStatus } from './components/ui/generation-status.js';
import { GenerationPreview } from './components/ui/generation-preview.js';

// Create a module-specific event bus
const eventBus = new EventBus();

/**
 * Initialize the app creator module
 */
function initializeAppCreator() {
  console.log('Initializing app creator module...');
  
  try {
    // Register custom elements if not already registered
    if (!customElements.get('app-creation-step')) {
      customElements.define('app-creation-step', AppCreationStep);
    }
    
    if (!customElements.get('app-creation-step-two')) {
      customElements.define('app-creation-step-two', AppCreationStepTwo);
    }
    
    if (!customElements.get('app-creation-step-three')) {
      customElements.define('app-creation-step-three', AppCreationStepThree);
    }
    
    if (!customElements.get('generation-status')) {
      customElements.define('generation-status', GenerationStatus);
    }
    
    if (!customElements.get('generation-preview')) {
      customElements.define('generation-preview', GenerationPreview);
    }
    
    if (!customElements.get('error-container')) {
      customElements.define('error-container', ErrorContainer);
    }
    
    if (!customElements.get('error-message')) {
      customElements.define('error-message', ErrorMessage);
    }
    
    // Create error container if it doesn't exist
    if (!document.querySelector('error-container')) {
      const errorContainer = document.createElement('error-container');
      document.body.appendChild(errorContainer);
    }
    
    // Initialize the app controller
    const controller = new AppCreationController(eventBus);
    
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

// Export the event bus for use by other components
export { eventBus };

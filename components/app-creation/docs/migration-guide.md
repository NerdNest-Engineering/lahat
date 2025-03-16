# Migration Guide

This document provides a step-by-step guide for migrating the existing app creation components to use the new step lifecycle and event-based communication system.

## Overview

The migration process involves:

1. Creating a base step component
2. Updating existing steps to implement the lifecycle interface
3. Refactoring the controller to use event-based communication
4. Testing and validating the changes

This guide outlines a gradual approach that allows for incremental changes without breaking existing functionality.

## Step 1: Create a Base Step Component

First, create a base step component that implements the lifecycle interface:

```javascript
// components/app-creation/renderer/components/base-step-component.js

/**
 * Base Step Component
 * Provides common functionality for all step components
 */
export class BaseStepComponent extends HTMLElement {
  constructor() {
    super();
    // Common initialization
  }
  
  // Lifecycle methods
  start(data = {}) {
    this.show();
    this.enable();
    
    // Dispatch event to notify that the step has started
    this.dispatchEvent(new CustomEvent('step-event', {
      bubbles: true,
      composed: true,
      detail: {
        action: 'step-started',
        source: this.getHandle(),
        data
      }
    }));
  }
  
  end() {
    this.hide();
    
    // Dispatch event to notify that the step has ended
    this.dispatchEvent(new CustomEvent('step-event', {
      bubbles: true,
      composed: true,
      detail: {
        action: 'step-ended',
        source: this.getHandle()
      }
    }));
  }
  
  disable() {
    this.classList.add('disabled');
    this.shadowRoot.querySelectorAll('input, button, select, textarea').forEach(el => {
      el.disabled = true;
    });
    
    // Dispatch event to notify that the step has been disabled
    this.dispatchEvent(new CustomEvent('step-event', {
      bubbles: true,
      composed: true,
      detail: {
        action: 'step-disabled',
        source: this.getHandle()
      }
    }));
  }
  
  enable() {
    this.classList.remove('disabled');
    this.shadowRoot.querySelectorAll('input, button, select, textarea').forEach(el => {
      el.disabled = false;
    });
    
    // Dispatch event to notify that the step has been enabled
    this.dispatchEvent(new CustomEvent('step-event', {
      bubbles: true,
      composed: true,
      detail: {
        action: 'step-enabled',
        source: this.getHandle()
      }
    }));
  }
  
  hide() {
    this.classList.add('hidden');
    
    // Dispatch event to notify that the step has been hidden
    this.dispatchEvent(new CustomEvent('step-event', {
      bubbles: true,
      composed: true,
      detail: {
        action: 'step-hidden',
        source: this.getHandle()
      }
    }));
  }
  
  show() {
    this.classList.remove('hidden');
    
    // Dispatch event to notify that the step has been shown
    this.dispatchEvent(new CustomEvent('step-event', {
      bubbles: true,
      composed: true,
      detail: {
        action: 'step-shown',
        source: this.getHandle()
      }
    }));
  }
  
  getHandle() {
    // Should be overridden by subclasses
    throw new Error('getHandle() must be implemented by subclass');
  }
  
  // Helper method for dispatching events
  dispatchStepEvent(action, data = {}, target = null) {
    this.dispatchEvent(new CustomEvent('step-event', {
      bubbles: true,
      composed: true,
      detail: {
        action,
        source: this.getHandle(),
        target,
        data
      }
    }));
  }
}
```

## Step 2: Update CSS for Step Components

Add the necessary CSS to support the lifecycle states:

```css
/* Add to each step component's CSS */
:host {
  display: block;
}

:host(.hidden) {
  display: none;
}

:host(.disabled) {
  opacity: 0.7;
  pointer-events: none;
}

/* Optional: Add visual indicators for disabled state */
:host(.disabled) input,
:host(.disabled) button,
:host(.disabled) select,
:host(.disabled) textarea {
  cursor: not-allowed;
  background-color: #f5f5f5;
}
```

## Step 3: Update Step One Component

Update the step one component to extend the base component and use event-based communication:

```javascript
// components/app-creation/renderer/components/app-creation-step-one.js

import { BaseStepComponent } from './base-step-component.js';
import { showError } from '../utils/utils.js';

/**
 * AppCreationStepOne component
 * Handles the first step of the app creation process
 */
export class AppCreationStepOne extends BaseStepComponent {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Add CSS including the lifecycle states
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 20px 0;
        }
        :host(.hidden) {
          display: none;
        }
        :host(.disabled) {
          opacity: 0.7;
          pointer-events: none;
        }
        /* Rest of the CSS remains the same */
        /* ... */
      </style>
      <!-- Rest of the HTML remains the same -->
      <!-- ... -->
    `;
    
    // Set up event listeners
    this.shadowRoot.querySelector('#next-button').addEventListener('click', this.handleNextClick.bind(this));
    
    // Add event listener for Enter key on input field
    this.shadowRoot.querySelector('#user-input').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.handleNextClick();
      }
    });
  }
  
  // Implement getHandle method
  getHandle() {
    return 'step-one';
  }
  
  // Getters
  get userInput() {
    return this.shadowRoot.querySelector('#user-input').value.trim();
  }
  
  // Event handlers
  async handleNextClick() {
    if (!this.userInput) {
      // Show error using the error container
      showError('Input Required', 'Please enter what you would like to create.');
      return;
    }
    
    // Hide the button container
    this.shadowRoot.querySelector('.button-container').classList.add('hidden');
    
    // Dispatch event to notify that the user input is ready
    this.dispatchStepEvent('user-input-ready', { input: this.userInput });
    
    // Dispatch event to disable this step
    this.dispatchStepEvent('disable-self');
    
    // Dispatch event to start the next step
    this.dispatchStepEvent('start-step', { input: this.userInput }, 'step-two');
  }
  
  // Override start method to add custom behavior
  start(data = {}) {
    super.start(data);
    
    // Reset the input field if needed
    if (data.resetInput) {
      this.shadowRoot.querySelector('#user-input').value = '';
    }
    
    // Show the button container
    this.resetButtonContainer();
  }
  
  // Public methods
  resetButtonContainer() {
    this.shadowRoot.querySelector('.button-container').classList.remove('hidden');
  }
  
  // Error handling
  handleError() {
    // Reset the button container
    this.resetButtonContainer();
    
    // Enable the step
    this.enable();
  }
}
```

## Step 4: Update Step Two Component

Update the step two component in a similar way:

```javascript
// components/app-creation/renderer/components/app-creation-step-two.js

import { BaseStepComponent } from './base-step-component.js';

/**
 * AppCreationStepTwo component
 * Handles the second step of the app creation process
 */
export class AppCreationStepTwo extends BaseStepComponent {
  constructor() {
    super();
    // Rest of the constructor remains similar
    // ...
  }
  
  // Implement getHandle method
  getHandle() {
    return 'step-two';
  }
  
  // Override start method to add custom behavior
  async start(data = {}) {
    super.start(data);
    
    // Store the user input
    this._userInput = data.input;
    
    // Set the user input display
    this.userInputDisplay.textContent = this._userInput;
    
    // Show the preview section
    this.showPreview();
    
    // Set generating state
    this.setGeneratingState();
    
    // Reset the preview fields
    this.generatedTitle.value = '';
    this.generatedDescription.value = '';
    this._currentTitle = '';
    this._currentDescription = '';
    
    try {
      // Generate title and description using the domain API
      console.log('Starting title and description generation...');
      const result = await window.appCreationService.generateTitleAndDescription(this._userInput);
      console.log('Title and description generation completed:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate title and description');
      }
      
      // Success handling is done via the streaming chunks
      // The UI will be updated as chunks come in through the handleInProgressChunk method
      
    } catch (error) {
      console.error('Title/description generation failed:', error);
      
      // Dispatch error event
      this.dispatchStepEvent('error-occurred', {
        errorType: 'generation-failed',
        errorMessage: error.message || 'Failed to generate title and description'
      });
    }
  }
  
  // Event handlers
  async handleGenerateClick() {
    // Validate that we have title and description
    if (!this._currentTitle.trim()) {
      this.showError('Please enter a title for your app');
      return;
    }
    
    if (!this._currentDescription.trim()) {
      this.showError('Please enter a description for your app');
      return;
    }
    
    // Dispatch event to disable this step
    this.dispatchStepEvent('disable-self');
    
    // Dispatch event to start the next step
    this.dispatchStepEvent('start-step', {
      title: this._currentTitle,
      description: this._currentDescription
    }, 'step-three');
  }
  
  // Rest of the methods remain similar
  // ...
}
```

## Step 5: Update Step Three Component

Update the step three component in a similar way:

```javascript
// components/app-creation/renderer/components/app-creation-step-three.js

import { BaseStepComponent } from './base-step-component.js';
import { showError } from '../utils/utils.js';

/**
 * AppCreationStepThree component
 * Handles the third step of the app creation process
 */
export class AppCreationStepThree extends BaseStepComponent {
  constructor() {
    super();
    // Rest of the constructor remains similar
    // ...
  }
  
  // Implement getHandle method
  getHandle() {
    return 'step-three';
  }
  
  // Override start method to add custom behavior
  async start(data = {}) {
    super.start(data);
    
    // Store the title and description
    this._title = data.title;
    this._description = data.description;
    
    // Update the UI
    this.titleDisplay.textContent = this._title;
    this.descriptionDisplay.textContent = this._description;
    
    // Reset the preview output
    this._generationChunks = '';
    this.previewOutput.textContent = '';
    
    try {
      // Generate mini app using the domain API
      console.log('Starting mini app generation...');
      const result = await window.appCreationService.generateMiniApp({
        appName: this._title,
        prompt: this._description
      });
      console.log('Mini app generation completed:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate mini app');
      }
      
      // Success handling is done via the streaming chunks
      // The UI will be updated as chunks come in through the handleGenerationProgress method
      
      // Dispatch event to complete the process
      this.dispatchStepEvent('complete-process', {
        title: this._title,
        description: this._description
      });
      
    } catch (error) {
      console.error('Mini app generation failed:', error);
      
      // Dispatch error event
      this.dispatchStepEvent('error-occurred', {
        errorType: 'generation-failed',
        errorMessage: error.message || 'Failed to generate mini app'
      });
    }
  }
  
  // Rest of the methods remain similar
  // ...
}
```

## Step 6: Update the Controller

Refactor the controller to use event-based communication:

```javascript
// components/app-creation/renderer/controller/app-creation-controller.js

/**
 * App Creation Controller
 * Main controller for the app creation process
 */
export class AppCreationController {
  constructor() {
    // Get step components and store by handle
    this.steps = {
      'step-one': document.getElementById('step-1'),
      'step-two': document.getElementById('step-2'),
      'step-three': document.getElementById('step-3')
    };
    
    // Get utility components
    this.generationStatus = document.getElementById('generation-status');
    this.generationPreview = document.getElementById('generation-preview');
    
    // Set up event listener for step events
    document.addEventListener('step-event', this.handleStepEvent.bind(this));
    
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
      window.electronAPI.closeCurrentWindow();
      return;
    }
    
    // Start with step one
    this.steps['step-one'].start();
  }
  
  handleStepEvent(event) {
    const { action, source, target, data } = event.detail;
    console.log(`Step event: ${action} from ${source} to ${target || 'N/A'}`, data);
    
    // Handle self-directed actions
    if (action.endsWith('-self')) {
      const baseAction = action.replace('-self', '');
      const sourceStep = this.steps[source];
      
      if (sourceStep && typeof sourceStep[baseAction] === 'function') {
        sourceStep[baseAction](data);
      }
      return;
    }
    
    // Handle target-directed actions
    if (action.endsWith('-step') && target) {
      const baseAction = action.replace('-step', '');
      const targetStep = this.steps[target];
      
      if (targetStep && typeof targetStep[baseAction] === 'function') {
        targetStep[baseAction](data);
      }
      return;
    }
    
    // Handle specific actions
    switch (action) {
      case 'user-input-ready':
        this.handleUserInputReady(source, data);
        break;
      case 'error-occurred':
        this.handleError(source, data);
        break;
      case 'complete-process':
        this.completeProcess(data);
        break;
    }
  }
  
  handleUserInputReady(source, data) {
    // Show loading indicator
    this.generationStatus.show('Generating title and description...');
  }
  
  handleError(source, data) {
    // Show error message
    showError(data.errorTitle || 'Error', data.errorMessage || 'An error occurred');
    
    // Let the source step handle its own error state
    const sourceStep = this.steps[source];
    if (sourceStep && typeof sourceStep.handleError === 'function') {
      sourceStep.handleError(data);
    }
    
    // Hide loading indicator
    this.generationStatus.hide();
  }
  
  completeProcess(data) {
    // Notify main window to refresh app list
    window.electronAPI.notifyAppUpdated();
    
    // Close this window after a short delay
    setTimeout(() => {
      window.electronAPI.closeCurrentWindow();
    }, 2000);
  }
  
  handleTitleDescriptionChunk(chunk) {
    // Forward the chunk to step two
    const stepTwo = this.steps['step-two'];
    if (stepTwo) {
      if (chunk.done) {
        stepTwo.handleCompletedChunk(chunk);
      } else {
        stepTwo.handleInProgressChunk(chunk);
      }
    }
  }
  
  handleGenerationChunk(chunk) {
    // Forward the chunk to step three
    const stepThree = this.steps['step-three'];
    if (stepThree) {
      if (chunk.done) {
        stepThree.handleGenerationComplete();
      } else {
        stepThree.handleGenerationProgress(chunk.content);
      }
    }
    
    // Also update the generation preview
    if (this.generationPreview) {
      if (chunk.done) {
        this.generationPreview.handleGenerationComplete();
      } else {
        this.generationPreview.handleGenerationProgress(chunk.content);
      }
    }
  }
}
```

## Step 7: Update Component Registration

Update the component registration in `renderers/app-creation.js`:

```javascript
// renderers/app-creation.js

// Import the base component
import { BaseStepComponent } from '../components/app-creation/renderer/components/base-step-component.js';

// Import components from the app-creation module
import {
  AppCreationStepOne,
  AppCreationStepTwo,
  AppCreationStepThree,
  GenerationStatus,
  GenerationPreview,
  AppCreationController,
  showError
} from '../components/app-creation/index.js';

// Register the base component
if (!customElements.get('base-step-component')) {
  customElements.define('base-step-component', BaseStepComponent);
}

// Register step components
if (!customElements.get('app-creation-step-one')) {
  customElements.define('app-creation-step-one', AppCreationStepOne);
}

// Rest of the component registration remains the same
// ...
```

## Step 8: Update the Renderer Index

Update the renderer index to export the base component:

```javascript
// components/app-creation/renderer/index.js

/**
 * App Creation Renderer Components Index
 * Exports all app creation renderer components for easy importing
 */

// Export base component
export * from './components/base-step-component.js';

// Export controller
export * from './controller/app-creation-controller.js';

// Export utilities
export * from './utils/utils.js';

// Export UI components
export * from './components/app-creation-step-one.js';
export * from './components/app-creation-step-two.js';
export * from './components/app-creation-step-three.js';
export * from './components/generation-preview.js';
export * from './components/generation-status.js';
```

## Testing and Validation

After implementing these changes, test the app creation process thoroughly:

1. **Unit Tests**: Create unit tests for each step component to verify that they implement the lifecycle interface correctly
2. **Integration Tests**: Test the interaction between steps and the controller
3. **End-to-End Tests**: Test the complete app creation process from start to finish

### Test Cases

1. **Basic Flow**: Test the normal flow from step one to step three
2. **Error Handling**: Test error scenarios in each step
3. **Lifecycle Methods**: Test each lifecycle method (start, end, disable, enable, hide, show)
4. **Event Propagation**: Test that events are properly propagated and handled

## Common Pitfalls and Solutions

### 1. Event Bubbling Issues

**Problem**: Events not reaching the controller

**Solution**: Ensure that events have `bubbles: true` and `composed: true` set in the CustomEvent options

### 2. Method Not Found Errors

**Problem**: "Cannot perform X on Y: Method not found" errors

**Solution**: Double-check that all lifecycle methods are implemented in each step component

### 3. CSS Transitions

**Problem**: Abrupt transitions between steps

**Solution**: Add CSS transitions for opacity and transform properties to create smoother transitions

```css
:host {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

:host(.hidden) {
  opacity: 0;
  transform: translateY(10px);
}

:host(.disabled) {
  opacity: 0.7;
  transition: opacity 0.3s ease;
}
```

### 4. Event Handling Order

**Problem**: Events being handled in the wrong order

**Solution**: Use `setTimeout` with zero delay to ensure proper event handling order

```javascript
handleNextClick() {
  // Dispatch events in the correct order
  setTimeout(() => {
    this.dispatchStepEvent('disable-self');
  }, 0);
  
  setTimeout(() => {
    this.dispatchStepEvent('start-step', { input: this.userInput }, 'step-two');
  }, 10);
}
```

## Incremental Migration Strategy

To minimize disruption, consider an incremental migration approach:

1. **Phase 1**: Implement the base component and update one step
2. **Phase 2**: Update the controller to handle events from the updated step
3. **Phase 3**: Update the remaining steps one by one
4. **Phase 4**: Remove legacy code and finalize the migration

This approach allows you to test each change in isolation and roll back if issues arise.

## Conclusion

By following this migration guide, you can successfully transition the app creation components to use the new step lifecycle and event-based communication system. This will result in a more maintainable, flexible, and robust implementation that better separates concerns and reduces coupling between components.

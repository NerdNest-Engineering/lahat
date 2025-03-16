/**
 * Component Library Index
 * Exports all components for easy importing
 */

// Core Components and Utilities
export * from './core/base-component.js';
export * from './core/utils.js';
export * from './core/component-registry.js';
export * from './core/state-manager.js';
export * from './core/dynamic-loader.js';

// Error Handling Components
export * from './core/error-handling/error-container.js';
export * from './core/error-handling/error-message.js';

// UI Components
// Cards
export * from './ui/cards/app-card.js';

// Containers
export * from './ui/containers/app-list.js';
export * from './ui/containers/app-management-section.js';

// Modals
export * from './ui/modals/app-details-modal.js';
export * from './ui/modals/command-palette.js';

// Mini App Components
export * from './mini-app/mini-app-container.js';

// App Creation Components
export * from './app-creation/index.js';

/**
 * Initialize the component library
 * This function should be called once at application startup
 */
export function initializeComponentLibrary() {
  // Import the registry
  const { registry } = require('./core/component-registry.js');
  
  // Register all components
  const BaseComponent = require('./core/base-component.js').BaseComponent;
  const ErrorContainer = require('./core/error-handling/error-container.js').ErrorContainer;
  const ErrorMessage = require('./core/error-handling/error-message.js').ErrorMessage;
  const AppCard = require('./ui/cards/app-card.js').AppCard;
  const AppList = require('./ui/containers/app-list.js').AppList;
  const AppManagementSection = require('./ui/containers/app-management-section.js').AppManagementSection;
  const AppDetailsModal = require('./ui/modals/app-details-modal.js').AppDetailsModal;
  const CommandPalette = require('./ui/modals/command-palette.js').CommandPalette;
  const MiniAppContainer = require('./mini-app/mini-app-container.js').MiniAppContainer;
  
  // App Creation Components
  const AppCreationStepOne = require('./app-creation/app-creation-step-one.js').AppCreationStepOne;
  const AppCreationStepTwo = require('./app-creation/app-creation-step-two.js').AppCreationStepTwo;
  const GenerationStatus = require('./app-creation/generation-status.js').GenerationStatus;
  const GenerationPreview = require('./app-creation/generation-preview.js').GenerationPreview;
  
  // Register components with the registry
  registry.register('error-container', ErrorContainer);
  registry.register('error-message', ErrorMessage);
  registry.register('app-card', AppCard);
  registry.register('app-list', AppList);
  registry.register('app-management-section', AppManagementSection);
  registry.register('app-details-modal', AppDetailsModal);
  registry.register('command-palette', CommandPalette);
  registry.register('mini-app-container', MiniAppContainer);
  
  // Register app creation components
  registry.register('app-creation-step-one', AppCreationStepOne);
  registry.register('app-creation-step-two', AppCreationStepTwo);
  registry.register('generation-status', GenerationStatus);
  registry.register('generation-preview', GenerationPreview);
  
  // Initialize the state manager with default values
  const { appState } = require('./core/state-manager.js');
  
  // Load essential components
  const { loadEssentialComponents } = require('./core/dynamic-loader.js');
  loadEssentialComponents();
  
  return {
    registry,
    appState
  };
}

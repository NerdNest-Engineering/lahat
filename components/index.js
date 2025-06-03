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
  
  // Register components with the registry
  registry.register('error-container', ErrorContainer);
  registry.register('error-message', ErrorMessage);
  registry.register('app-card', AppCard);
  registry.register('app-list', AppList);
  registry.register('app-management-section', AppManagementSection);
  registry.register('app-details-modal', AppDetailsModal);
  
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

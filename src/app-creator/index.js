/**
 * App Creator Module
 * Entry point for the app creator module
 * 
 * This module is responsible for creating new applications through natural language prompts.
 * It provides a step-based interface for users to describe the application they want to create
 * and uses Claude to generate the necessary code.
 */

// Export components
export * from './components/base/app-creation-step.js';
export * from './components/steps/app-creation-step-one.js';
export * from './components/steps/app-creation-step-two.js';
export * from './components/steps/app-creation-step-three.js';
export * from './components/ui/generation-status.js';
export * from './components/ui/generation-preview.js';
export * from './components/ui/error-container.js';

// Export services
export * from './services/claude-service.js';

// Export utilities
export * from './utils/event-bus.js';
export * from './utils/error-utils.js';

// Export controller
export * from './app-creator.js';

// Note: IPC handlers are not exported as they are used directly by the main process and preload script

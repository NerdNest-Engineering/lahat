/**
 * App Creation Components Index
 * 
 * This module provides a centralized export point for all app creation components.
 * It handles both named exports for selective importing and automatic registration
 * of all web components when the module is imported.
 * 
 * @module AppCreationComponents
 */

// Named exports for selective importing
export { StepZero } from './step-zero.js';
export { AppCreationStepOne } from './step-one.js';
export { AppCreationStepTwo } from './step-two.js';
export { AppCreationStepThree } from './step-three.js';
export { AppCreationStepFour } from './step-four.js';
export { GenerationStatus } from './generation-status.js';
export { AppCreationController } from './app-creation-controller.js';

// Auto-register all components when this module is imported
import './step-zero.js';
import './step-one.js';
import './step-two.js';
import './step-three.js';
import './step-four.js';
import './generation-status.js';
import './app-creation-controller.js';

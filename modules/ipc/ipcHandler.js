/**
 * IPC Handler
 * Provides a standardized way to register and manage IPC handlers
 * with enhanced error handling and validation
 */

import { ipcMain } from 'electron';
import { createErrorResponse, createSuccessResponse } from './ipcTypes.js';
import { 
  ErrorHandler, 
  IpcError 
} from '../utils/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * IPC Handler class
 * Manages registration and handling of IPC messages
 */
export class IpcHandler {
  /**
   * Create a new IPC handler
   */
  constructor() {
    this.handlers = new Map();
    this.validators = new Map();
    this.timeouts = new Map();
  }
  
  /**
   * Register a handler for an IPC channel
   * @param {string} channel - IPC channel name
   * @param {Function} handler - Handler function
   * @param {Object} options - Options object
   * @param {Function} options.validator - Optional validator function for parameters
   * @param {number} options.timeout - Optional timeout in milliseconds
   * @returns {IpcHandler} - This handler instance for chaining
   */
  register(channel, handler, { validator = null, timeout = null } = {}) {
    if (this.handlers.has(channel)) {
      logger.warn(`Handler for channel ${channel} already registered. Overwriting.`, {}, 'IpcHandler');
    }
    
    // Store handler and options
    this.handlers.set(channel, handler);
    if (validator) this.validators.set(channel, validator);
    if (timeout) this.timeouts.set(channel, timeout);
    
    // Register with Electron IPC
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        // Apply validator if present
        const validator = this.validators.get(channel);
        if (validator) {
          try {
            const isValid = await validator(event, ...args);
            if (!isValid) {
              throw IpcError.invalidParams(channel, args);
            }
          } catch (validationError) {
            if (validationError instanceof IpcError) {
              throw validationError;
            } else {
              throw IpcError.invalidParams(channel, args, { cause: validationError });
            }
          }
        }
        
        // Apply timeout if present
        const timeoutMs = this.timeouts.get(channel);
        if (timeoutMs) {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(IpcError.timeout(channel, timeoutMs));
            }, timeoutMs);
          });
          
          // Race the handler against timeout
          return await Promise.race([
            handler(event, ...args),
            timeoutPromise
          ]);
        } else {
          // Standard handler execution
          return await handler(event, ...args);
        }
      } catch (error) {
        return ErrorHandler.formatErrorForIPC(error, channel);
      }
    });
    
    return this;
  }
  
  /**
   * Unregister a handler
   * @param {string} channel - IPC channel name
   * @returns {IpcHandler} - This handler instance for chaining
   */
  unregister(channel) {
    if (this.handlers.has(channel)) {
      ipcMain.removeHandler(channel);
      this.handlers.delete(channel);
      this.validators.delete(channel);
      this.timeouts.delete(channel);
      
      logger.debug(`Unregistered handler for channel: ${channel}`, {}, 'IpcHandler');
    }
    
    return this;
  }
  
  /**
   * Get all registered handlers
   * @returns {Array<string>} - Array of registered channel names
   */
  getHandlers() {
    return Array.from(this.handlers.keys());
  }
  
  /**
   * Check if a handler is registered
   * @param {string} channel - IPC channel name
   * @returns {boolean} - True if handler is registered
   */
  hasHandler(channel) {
    return this.handlers.has(channel);
  }
  
  /**
   * Register multiple handlers
   * @param {Object} handlers - Map of channel names to handler functions or objects
   * @returns {IpcHandler} - This handler instance for chaining
   */
  registerMultiple(handlers) {
    Object.entries(handlers).forEach(([channel, handler]) => {
      // Check if handler is a function or an object with handler and options
      if (typeof handler === 'function') {
        this.register(channel, handler);
      } else if (typeof handler === 'object' && handler !== null && typeof handler.handler === 'function') {
        // Extract handler and options
        const { handler: handlerFn, validator, timeout } = handler;
        this.register(channel, handlerFn, { validator, timeout });
      } else {
        logger.error(`Invalid handler for channel ${channel}`, { handlerType: typeof handler }, 'IpcHandler');
      }
    });
    
    return this;
  }
  
  /**
   * Create a validator function that checks required parameters
   * @param {Array<string>} requiredParams - Array of required parameter names
   * @returns {Function} - Validator function
   */
  static createParamValidator(requiredParams) {
    return (event, params) => {
      if (!params || typeof params !== 'object') {
        return false;
      }
      
      // Check all required parameters are present and not null/undefined
      for (const param of requiredParams) {
        if (params[param] === undefined || params[param] === null) {
          return false;
        }
      }
      
      return true;
    };
  }
  
  /**
   * Create a handler with standardized success/error response
   * @param {Function} handlerFn - Handler function that returns a result
   * @returns {Function} - Wrapped handler function
   */
  static createStandardHandler(handlerFn) {
    return async (event, ...args) => {
      try {
        const result = await handlerFn(event, ...args);
        return createSuccessResponse(result);
      } catch (error) {
        throw error; // Will be caught by the main error handler
      }
    };
  }
}

// Create a singleton instance
export const ipcHandler = new IpcHandler();

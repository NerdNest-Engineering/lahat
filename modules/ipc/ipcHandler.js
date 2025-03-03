/**
 * IPC Handler
 * Provides a standardized way to register and manage IPC handlers
 */

import { ipcMain } from 'electron';
import { createErrorResponse } from './ipcTypes.js';
import { ErrorHandler } from '../utils/errorHandler.js';

/**
 * IPC Handler class
 * Manages registration and handling of IPC messages
 */
export class IpcHandler {
  constructor() {
    this.handlers = new Map();
  }
  
  /**
   * Register a handler for an IPC channel
   * @param {string} channel - IPC channel name
   * @param {Function} handler - Handler function
   * @returns {IpcHandler} - This handler instance for chaining
   */
  register(channel, handler) {
    if (this.handlers.has(channel)) {
      console.warn(`Handler for channel ${channel} already registered. Overwriting.`);
    }
    
    this.handlers.set(channel, handler);
    
    // Register with Electron IPC
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        return await handler(event, ...args);
      } catch (error) {
        ErrorHandler.logError(channel, error);
        return createErrorResponse(error, channel);
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
   * @param {Object} handlers - Map of channel names to handler functions
   * @returns {IpcHandler} - This handler instance for chaining
   */
  registerMultiple(handlers) {
    Object.entries(handlers).forEach(([channel, handler]) => {
      this.register(channel, handler);
    });
    
    return this;
  }
}

// Create a singleton instance
export const ipcHandler = new IpcHandler();

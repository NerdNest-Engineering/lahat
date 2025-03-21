/**
 * Window Pool Manager
 * Manages a pool of reusable windows to improve performance
 */

import { BrowserWindow } from 'electron';

/**
 * Window Pool class
 * Manages a pool of reusable windows for better performance
 */
export class WindowPool {
  /**
   * Create a new window pool
   * @param {number} maxPoolSize - Maximum number of windows to keep in the pool
   */
  constructor(maxPoolSize = 5) {
    this.pools = new Map();
    this.maxPoolSize = maxPoolSize;
  }
  
  /**
   * Get a window from the pool or null if none available
   * @param {string} type - Window type
   * @returns {BrowserWindow|null} - Window from the pool or null
   */
  getWindow(type) {
    if (!this.pools.has(type)) {
      return null;
    }
    
    const pool = this.pools.get(type);
    if (pool.length === 0) {
      return null;
    }
    
    const window = pool.pop();
    
    // Check if window is still valid
    if (window.isDestroyed()) {
      return this.getWindow(type);
    }
    
    return window;
  }
  
  /**
   * Return a window to the pool
   * @param {string} type - Window type
   * @param {BrowserWindow} window - Window to return to the pool
   * @returns {boolean} - True if window was added to the pool
   */
  releaseWindow(type, window) {
    if (window.isDestroyed()) {
      return false;
    }
    
    if (!this.pools.has(type)) {
      this.pools.set(type, []);
    }
    
    const pool = this.pools.get(type);
    
    // If pool is full, destroy the oldest window
    if (pool.length >= this.maxPoolSize) {
      const oldestWindow = pool.shift();
      if (!oldestWindow.isDestroyed()) {
        oldestWindow.destroy();
      }
    }
    
    // Reset window state
    window.webContents.loadURL('about:blank');
    
    // Add to pool
    pool.push(window);
    
    return true;
  }
  
  /**
   * Create a new window or get one from the pool
   * @param {string} type - Window type
   * @param {Function} createFn - Function to create a new window
   * @returns {Promise<BrowserWindow>} - Window from the pool or a new window
   */
  async createOrGetWindow(type, createFn) {
    // Try to get from pool first
    const pooledWindow = this.getWindow(type);
    if (pooledWindow) {
      return pooledWindow;
    }
    
    // Create new window
    return createFn();
  }
  
  /**
   * Clear all windows from the pool
   */
  clear() {
    for (const [type, pool] of this.pools.entries()) {
      for (const window of pool) {
        if (!window.isDestroyed()) {
          window.destroy();
        }
      }
      this.pools.set(type, []);
    }
  }
  
  /**
   * Get the number of windows in the pool
   * @param {string} type - Window type (optional)
   * @returns {number} - Number of windows in the pool
   */
  getPoolSize(type = null) {
    if (type) {
      return this.pools.has(type) ? this.pools.get(type).length : 0;
    }
    
    let total = 0;
    for (const pool of this.pools.values()) {
      total += pool.length;
    }
    return total;
  }
  
  /**
   * Get all window types in the pool
   * @returns {Array<string>} - Array of window types
   */
  getTypes() {
    return Array.from(this.pools.keys());
  }
}

// Create a singleton instance
export const windowPool = new WindowPool();

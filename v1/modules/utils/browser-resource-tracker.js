/**
 * Browser-compatible Resource tracker for managing disposable resources and preventing memory leaks
 * Provides utilities for tracking and cleaning up event listeners, timeouts, intervals, etc.
 */

import browserLogger from './browser-logger.js';

/**
 * Resource types for tracking different kinds of resources
 */
export const ResourceType = {
  EVENT_LISTENER: 'eventListener',
  TIMEOUT: 'timeout',
  INTERVAL: 'interval',
  DOM_ELEMENT: 'domElement',
  CUSTOM: 'custom'
};

/**
 * Resource tracker class for managing disposable resources
 */
export class ResourceTracker {
  /**
   * Create a new resource tracker
   * @param {string} context - Context for this tracker (e.g., component name)
   */
  constructor(context = 'ResourceTracker') {
    this.resources = new Map();
    this.context = context;
    this.disposed = false;
    this.idCounter = 1;
  }
  
  /**
   * Generate a unique ID for a resource
   * @param {string} type - Resource type
   * @returns {string} - Unique resource ID
   */
  generateId(type) {
    return `${type}_${this.idCounter++}_${Date.now()}`;
  }
  
  /**
   * Track a resource for later cleanup
   * @param {string} type - Resource type from ResourceType enum
   * @param {any} resource - The resource to track
   * @param {Function} disposeMethod - Function to call to dispose the resource
   * @param {Object} metadata - Additional metadata about the resource
   * @returns {string} - The resource ID
   */
  track(type, resource, disposeMethod, metadata = {}) {
    if (this.disposed) {
      browserLogger.warn(`Adding resource to disposed ResourceTracker (${this.context})`, {}, 'ResourceTracker');
    }
    
    const id = this.generateId(type);
    
    this.resources.set(id, {
      type,
      resource,
      disposeMethod,
      metadata,
      addedAt: new Date()
    });
    
    return id;
  }
  
  /**
   * Track an event listener
   * @param {EventTarget} target - Event target
   * @param {string} eventType - Event type (e.g., 'click')
   * @param {Function} listener - Event listener function
   * @param {Object|boolean} options - Event listener options
   * @returns {string} - The resource ID
   */
  trackEventListener(target, eventType, listener, options = {}) {
    return this.track(
      ResourceType.EVENT_LISTENER,
      { target, eventType, listener, options },
      () => {
        try {
          target.removeEventListener(eventType, listener, options);
          return true;
        } catch (err) {
          browserLogger.warn(`Failed to remove event listener: ${err.message}`, {
            eventType,
            options
          }, this.context);
          return false;
        }
      },
      { eventType, target: target.toString() }
    );
  }
  
  /**
   * Track a timeout
   * @param {number} timeoutId - Timeout ID from setTimeout
   * @param {number} delay - Delay in milliseconds
   * @returns {string} - The resource ID
   */
  trackTimeout(timeoutId, delay) {
    return this.track(
      ResourceType.TIMEOUT,
      timeoutId,
      () => {
        clearTimeout(timeoutId);
        return true;
      },
      { delay }
    );
  }
  
  /**
   * Track an interval
   * @param {number} intervalId - Interval ID from setInterval
   * @param {number} delay - Delay in milliseconds
   * @returns {string} - The resource ID
   */
  trackInterval(intervalId, delay) {
    return this.track(
      ResourceType.INTERVAL,
      intervalId,
      () => {
        clearInterval(intervalId);
        return true;
      },
      { delay }
    );
  }
  
  /**
   * Track a DOM element
   * @param {Element} element - DOM element
   * @param {string} description - Description of the element
   * @returns {string} - The resource ID
   */
  trackDomElement(element, description = '') {
    return this.track(
      ResourceType.DOM_ELEMENT,
      element,
      () => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
          return true;
        }
        return false;
      },
      { description }
    );
  }
  
  /**
   * Track a custom resource
   * @param {any} resource - Resource to track
   * @param {Function} disposeMethod - Function to dispose the resource
   * @param {string} description - Description of the resource
   * @returns {string} - The resource ID
   */
  trackCustom(resource, disposeMethod, description = '') {
    return this.track(
      ResourceType.CUSTOM,
      resource,
      disposeMethod,
      { description }
    );
  }
  
  /**
   * Release a resource by ID
   * @param {string} id - Resource ID
   * @returns {boolean} - True if resource was successfully released
   */
  release(id) {
    if (!this.resources.has(id)) {
      return false;
    }
    
    const { resource, disposeMethod, type } = this.resources.get(id);
    
    try {
      const result = disposeMethod(resource);
      this.resources.delete(id);
      
      if (result instanceof Promise) {
        return result.then(() => {
          this.resources.delete(id);
          return true;
        }).catch(err => {
          browserLogger.warn(`Failed to release resource ${id} of type ${type}: ${err.message}`, {}, this.context);
          return false;
        });
      }
      
      return result !== false;
    } catch (err) {
      browserLogger.warn(`Error releasing resource ${id} of type ${type}: ${err.message}`, {}, this.context);
      this.resources.delete(id);
      return false;
    }
  }
  
  /**
   * Release all resources of a specific type
   * @param {string} type - Resource type from ResourceType enum
   * @returns {Array<boolean|Promise<boolean>>} - Array of release results
   */
  releaseByType(type) {
    const results = [];
    
    for (const [id, { type: resourceType }] of this.resources.entries()) {
      if (resourceType === type) {
        results.push(this.release(id));
      }
    }
    
    return results;
  }
  
  /**
   * Release all resources
   * @returns {Promise<number>} - Number of successfully released resources
   */
  async releaseAll() {
    const results = [];
    
    for (const id of this.resources.keys()) {
      results.push(this.release(id));
    }
    
    // Wait for all async releases to complete
    const resolvedResults = await Promise.all(
      results.map(result => result instanceof Promise ? result : Promise.resolve(result))
    );
    
    // Count successful releases
    const successCount = resolvedResults.filter(result => result === true).length;
    
    this.disposed = true;
    return successCount;
  }
  
  /**
   * Dispose this tracker and release all resources
   * @returns {Promise<number>} - Number of successfully released resources
   */
  async dispose() {
    const count = await this.releaseAll();
    this.resources.clear();
    this.disposed = true;
    return count;
  }
  
  /**
   * Get the count of tracked resources
   * @param {string} type - Optional resource type to count
   * @returns {number} - Count of resources
   */
  getCount(type = null) {
    if (!type) {
      return this.resources.size;
    }
    
    let count = 0;
    for (const { type: resourceType } of this.resources.values()) {
      if (resourceType === type) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Get information about all tracked resources
   * @returns {Object} - Resource statistics
   */
  getStats() {
    const stats = {
      total: this.resources.size,
      byType: {}
    };
    
    // Initialize counts for all resource types
    Object.values(ResourceType).forEach(type => {
      stats.byType[type] = 0;
    });
    
    // Count resources by type
    for (const { type } of this.resources.values()) {
      stats.byType[type]++;
    }
    
    return stats;
  }
  
  /**
   * Log resource statistics
   */
  logStats() {
    const stats = this.getStats();
    browserLogger.info(`Resource tracker stats for ${this.context}`, stats, 'ResourceTracker');
  }
}

/**
 * Create a shared instance of the resource tracker
 * @param {string} context - Context name
 * @returns {ResourceTracker} - Resource tracker instance
 */
export function createResourceTracker(context) {
  return new ResourceTracker(context);
}

/**
 * Global application resource tracker
 */
export const appResources = new ResourceTracker('Application');

/**
 * Find orphaned DOM elements with event listeners
 * Useful for debugging memory leaks
 * @returns {Object} - Information about orphaned elements
 */
export function findOrphanedEventListeners() {
  if (typeof document === 'undefined') {
    return { error: 'Not running in a browser environment' };
  }
  
  const orphans = [];
  const allNodes = [];
  
  // Function to check if an element is in the document
  const isInDocument = (node) => {
    return node.nodeType === Node.DOCUMENT_NODE || document.contains(node);
  };
  
  // Walk the event listeners in the global registry if available
  if (typeof getEventListeners === 'function') {
    // Chrome DevTools API available
    for (const node of Object.keys(getEventListeners)) {
      allNodes.push(node);
      if (!isInDocument(node)) {
        const listeners = getEventListeners(node);
        orphans.push({
          node: node.toString(),
          listeners: Object.entries(listeners).map(([type, listeners]) => ({
            type,
            count: listeners.length
          }))
        });
      }
    }
  } else {
    // Limited check - only detects HTMLElements with tracked listeners
    const trackedElements = [];
    let orphanCount = 0;
    
    // Get all elements with our data attribute
    const elements = document.querySelectorAll('[data-event-tracked]');
    elements.forEach(element => {
      trackedElements.push(element);
      
      // Check if the element is orphaned (not in document)
      if (!document.contains(element)) {
        orphanCount++;
        orphans.push({
          node: element.tagName,
          orphaned: true
        });
      }
    });
    
    allNodes.push(...trackedElements);
  }
  
  return {
    orphanCount: orphans.length,
    totalTracked: allNodes.length,
    orphans
  };
}

/**
 * Track DOM mutation events to detect potential memory leaks
 * @param {number} interval - Check interval in milliseconds
 * @returns {Function} - Function to stop tracking
 */
export function trackDomMutations(interval = 10000) {
  if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') {
    return () => {}; // No-op in non-browser environment
  }
  
  const stats = {
    addedElements: 0,
    removedElements: 0,
    potentialLeaks: []
  };
  
  // Create a lookup of removed nodes to track potential leaks
  const removedNodes = new WeakMap();
  
  // Create mutation observer
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        // Track added elements
        stats.addedElements += mutation.addedNodes.length;
        
        // Track removed elements
        stats.removedElements += mutation.removedNodes.length;
        
        // Mark removed nodes with timestamp
        Array.from(mutation.removedNodes)
          .filter(node => node.nodeType === Node.ELEMENT_NODE)
          .forEach(node => {
            removedNodes.set(node, { 
              time: Date.now(),
              tag: node.tagName,
              id: node.id,
              classes: node.className
            });
          });
      }
    });
  });
  
  // Observe all changes to the document
  observer.observe(document, {
    childList: true,
    subtree: true
  });
  
  // Periodically check for potential memory leaks
  const intervalId = setInterval(() => {
    const leakThreshold = Date.now() - (interval * 2); // Nodes removed more than 2 intervals ago
    let leakCount = 0;
    
    // We can't iterate a WeakMap, but we can detect potential leaks
    // by checking allocation statistics or using sampling
    
    const memoryUsage = window.performance?.memory 
      ? window.performance.memory 
      : { usedJSHeapSize: 0, totalJSHeapSize: 0 };
      
    const memoryStats = {
      addedElements: stats.addedElements,
      removedElements: stats.removedElements,
      potentialOrphans: findOrphanedEventListeners().orphanCount,
      usedHeapSize: memoryUsage.usedJSHeapSize,
      totalHeapSize: memoryUsage.totalJSHeapSize,
      timestamp: Date.now()
    };
    
    stats.potentialLeaks.push(memoryStats);
    
    // Only keep the last 10 stats
    if (stats.potentialLeaks.length > 10) {
      stats.potentialLeaks.shift();
    }
    
    // Log warning if we detect signs of memory leaks
    if (memoryStats.potentialOrphans > 0) {
      browserLogger.warn(`Potential memory leak detected: ${memoryStats.potentialOrphans} orphaned elements with event listeners`, 
        memoryStats, 
        'ResourceTracker'
      );
    }
  }, interval);
  
  // Return function to stop tracking
  return () => {
    clearInterval(intervalId);
    observer.disconnect();
    
    return stats;
  };
}

// Export all utilities
export default {
  ResourceType,
  ResourceTracker,
  createResourceTracker,
  appResources,
  findOrphanedEventListeners,
  trackDomMutations
};

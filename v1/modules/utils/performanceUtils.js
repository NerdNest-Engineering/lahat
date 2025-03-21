/**
 * Performance utilities for measuring and optimizing application performance
 */

// Determine if we're in a browser environment
const isBrowser = typeof process === 'undefined' || !process.versions || !process.versions.electron;

// Import the appropriate logger based on environment
// Use dynamic import for logger.js to avoid loading electron in browser context
import browserLoggerModule from './browser-logger.js';
const logger = browserLoggerModule;

/**
 * Measures the execution time of a function
 * @param {Function} fn - Function to measure
 * @param {string} name - Optional name for the measurement
 * @returns {Function} - Wrapped function that logs execution time
 */
export function measureExecutionTime(fn, name = fn.name || 'anonymous') {
  return async function(...args) {
    const start = performance.now();
    
    try {
      return await fn(...args);
    } finally {
      const end = performance.now();
      const duration = end - start;
      
      logger.debug(`Execution time for ${name}: ${duration.toFixed(2)}ms`, {
        duration,
        function: name
      }, 'Performance');
    }
  };
}

/**
 * Records execution time for multiple function calls
 */
export class PerformanceTracker {
  /**
   * Create a new performance tracker
   * @param {string} context - Context for this tracker
   * @param {boolean} enabled - Whether tracking is enabled
   */
  constructor(context = 'AppPerformance', enabled = true) {
    this.context = context;
    this.measurements = new Map();
    this.enabled = enabled;
    this.startTime = Date.now();
  }
  
  /**
   * Start measuring a named operation
   * @param {string} name - Name of the operation
   * @returns {Object} - Measurement context for stopping
   */
  start(name) {
    if (!this.enabled) return { name };
    
    const start = performance.now();
    const measurement = {
      name,
      start,
      calls: 1
    };
    
    if (this.measurements.has(name)) {
      const existing = this.measurements.get(name);
      existing.calls++;
      existing.current = start;
    } else {
      measurement.current = start;
      this.measurements.set(name, measurement);
    }
    
    return { name, start };
  }
  
  /**
   * Stop measuring a named operation
   * @param {Object} measurementContext - Context from start()
   */
  stop(measurementContext) {
    if (!this.enabled || !measurementContext) return;
    
    const { name, start } = measurementContext;
    const end = performance.now();
    
    if (!this.measurements.has(name)) {
      logger.warn(`No measurement found for ${name}`, {}, this.context);
      return;
    }
    
    const measurement = this.measurements.get(name);
    const duration = end - (start || measurement.current);
    
    if (!measurement.totalDuration) {
      measurement.totalDuration = duration;
      measurement.minDuration = duration;
      measurement.maxDuration = duration;
    } else {
      measurement.totalDuration += duration;
      measurement.minDuration = Math.min(measurement.minDuration, duration);
      measurement.maxDuration = Math.max(measurement.maxDuration, duration);
    }
    
    measurement.avgDuration = measurement.totalDuration / measurement.calls;
    measurement.lastDuration = duration;
    measurement.lastCompleted = end;
  }
  
  /**
   * Measure the execution time of a function
   * @param {string} name - Name for the measurement
   * @param {Function} fn - Function to execute and measure
   * @param  {...any} args - Arguments to pass to the function
   * @returns {any} - Result of the function
   */
  async measure(name, fn, ...args) {
    const measurement = this.start(name);
    
    try {
      return await fn(...args);
    } finally {
      this.stop(measurement);
    }
  }
  
  /**
   * Create a wrapped function that measures execution time
   * @param {string} name - Name for the measurement
   * @param {Function} fn - Function to wrap
   * @returns {Function} - Wrapped function
   */
  wrap(name, fn) {
    return async (...args) => {
      return await this.measure(name, fn, ...args);
    };
  }
  
  /**
   * Get all measurements
   * @param {boolean} reset - Whether to reset measurements after getting them
   * @returns {Object} - Measurement data
   */
  getMeasurements(reset = false) {
    const result = {
      context: this.context,
      startTime: this.startTime,
      uptime: Date.now() - this.startTime,
      measurements: Object.fromEntries(this.measurements)
    };
    
    if (reset) {
      this.resetMeasurements();
    }
    
    return result;
  }
  
  /**
   * Reset all measurements
   */
  resetMeasurements() {
    this.measurements.clear();
  }
  
  /**
   * Log all current measurements
   * @param {boolean} reset - Whether to reset measurements after logging
   */
  logMeasurements(reset = false) {
    if (!this.enabled || this.measurements.size === 0) return;
    
    const measurements = this.getMeasurements(reset);
    
    logger.info(`Performance measurements for ${this.context}`, 
      measurements, 
      'PerformanceTracker'
    );
  }
  
  /**
   * Enable or disable the tracker
   * @param {boolean} enabled - Whether tracking should be enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

/**
 * Application-wide performance tracker
 */
export const appPerformance = new PerformanceTracker(
  'ApplicationPerformance', 
  typeof window !== 'undefined' && 
  window.location && 
  window.location.hostname === 'localhost'
);

/**
 * Debounce a function to limit how often it can be called
 * @param {Function} fn - Function to debounce
 * @param {number} wait - Milliseconds to wait between calls
 * @returns {Function} - Debounced function
 */
export function debounce(fn, wait = 100) {
  let timeout;
  
  return function debounced(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Throttle a function to limit how often it can be called
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Milliseconds to wait between calls
 * @returns {Function} - Throttled function
 */
export function throttle(fn, limit = 100) {
  let waiting = false;
  
  return function throttled(...args) {
    if (!waiting) {
      fn.apply(this, args);
      waiting = true;
      setTimeout(() => {
        waiting = false;
      }, limit);
    }
  };
}

/**
 * Cache the results of expensive function calls
 * @param {Function} fn - Function to memoize
 * @param {Function} keyFn - Optional function to generate cache key from args
 * @param {Object} options - Cache options
 * @param {number} options.maxSize - Maximum number of entries in cache
 * @param {number} options.ttl - Time to live for cache entries in milliseconds
 * @returns {Function} - Memoized function
 */
export function memoize(fn, keyFn = null, { maxSize = 100, ttl = null } = {}) {
  const cache = new Map();
  const timestamps = new Map();
  
  return function memoized(...args) {
    // Generate cache key
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    // Check for expiration if TTL is set
    if (ttl && timestamps.has(key)) {
      const timestamp = timestamps.get(key);
      if (Date.now() - timestamp > ttl) {
        cache.delete(key);
        timestamps.delete(key);
      }
    }
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    // If cache is at max size, remove the oldest entry
    if (cache.size >= maxSize) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
      timestamps.delete(oldestKey);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    if (ttl) {
      timestamps.set(key, Date.now());
    }
    
    return result;
  };
}

/**
 * Measure memory usage for a function
 * @param {Function} fn - Function to measure
 * @param {string} name - Optional name for the measurement
 * @returns {Function} - Wrapped function that logs memory usage
 */
export function measureMemoryUsage(fn, name = fn.name || 'anonymous') {
  return async function(...args) {
    // Check if we're in Node.js/Electron environment
    if (typeof process === 'undefined' || !process.memoryUsage) {
      // In browser environment, just run the function without memory measurement
      return await fn(...args);
    }
    
    const memoryBefore = process.memoryUsage();
    
    try {
      return await fn(...args);
    } finally {
      const memoryAfter = process.memoryUsage();
      const diff = {
        rss: memoryAfter.rss - memoryBefore.rss,
        heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
        heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
        external: memoryAfter.external - memoryBefore.external
      };
      
      logger.debug(`Memory usage for ${name}`, {
        diff,
        before: memoryBefore,
        after: memoryAfter,
        function: name
      }, 'Performance');
    }
  };
}

/**
 * Run garbage collection if available
 * Note: Requires --expose-gc flag to be set when starting Node.js
 * @returns {boolean} - Whether garbage collection was run
 */
export function runGarbageCollection() {
  // Check if we're in Node.js/Electron environment with gc available
  if (typeof global !== 'undefined' && global.gc) {
    global.gc();
    logger.debug('Garbage collection run', {}, 'Performance');
    return true;
  }
  
  logger.debug('Garbage collection not available (browser environment or --expose-gc not set)', {}, 'Performance');
  return false;
}

/**
 * Get current memory usage statistics
 * @returns {Object} - Memory usage information
 */
export function getMemoryUsage() {
  // Check if we're in Node.js/Electron environment
  if (typeof process === 'undefined' || !process.memoryUsage) {
    // In browser environment, return placeholder data
    return {
      raw: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0 },
      formatted: {
        rss: 'N/A (Browser)',
        heapTotal: 'N/A (Browser)',
        heapUsed: 'N/A (Browser)',
        external: 'N/A (Browser)'
      },
      timestamp: Date.now(),
      environment: 'browser'
    };
  }
  
  const memory = process.memoryUsage();
  
  // Convert to MB for readability
  const memoryInMb = {
    rss: (memory.rss / 1024 / 1024).toFixed(2) + ' MB',
    heapTotal: (memory.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
    heapUsed: (memory.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
    external: (memory.external / 1024 / 1024).toFixed(2) + ' MB'
  };
  
  return {
    raw: memory,
    formatted: memoryInMb,
    timestamp: Date.now(),
    environment: 'node'
  };
}

/**
 * Log current memory usage
 * @param {string} context - Context for the log
 */
export function logMemoryUsage(context = 'Application') {
  const memory = getMemoryUsage();
  
  if (memory.environment === 'browser') {
    logger.info(`Memory usage for ${context} (Browser environment - limited data available)`, memory, 'Performance');
  } else {
    logger.info(`Memory usage for ${context}`, memory, 'Performance');
  }
}

// Export all performance utilities
export default {
  measureExecutionTime,
  PerformanceTracker,
  appPerformance,
  debounce,
  throttle,
  memoize,
  measureMemoryUsage,
  runGarbageCollection,
  getMemoryUsage,
  logMemoryUsage
};

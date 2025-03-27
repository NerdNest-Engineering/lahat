/**
 * Dynamic Component Loader
 * Enables lazy loading of components
 */

/**
 * Dynamic Component Loader class
 * Manages loading components on demand
 */
export class DynamicComponentLoader {
  constructor() {
    this.loadedComponents = new Set();
    this.loading = new Map();
  }
  
  /**
   * Load a component dynamically
   * @param {string} componentPath - Path to the component module
   * @returns {Promise<boolean>} - Promise that resolves when component is loaded
   */
  async load(componentPath) {
    // If already loaded, return immediately
    if (this.loadedComponents.has(componentPath)) {
      return true;
    }
    
    // If currently loading, wait for it to complete
    if (this.loading.has(componentPath)) {
      return this.loading.get(componentPath);
    }
    
    // Start loading
    const loadPromise = new Promise(async (resolve, reject) => {
      try {
        // Dynamic import
        await import(`../${componentPath}`);
        this.loadedComponents.add(componentPath);
        this.loading.delete(componentPath);
        resolve(true);
      } catch (error) {
        this.loading.delete(componentPath);
        console.error(`Failed to load component: ${componentPath}`, error);
        reject(error);
      }
    });
    
    this.loading.set(componentPath, loadPromise);
    return loadPromise;
  }
  
  /**
   * Load multiple components
   * @param {Array<string>} componentPaths - Paths to component modules
   * @returns {Promise<Array<boolean>>} - Promise that resolves when all components are loaded
   */
  async loadMultiple(componentPaths) {
    return Promise.all(componentPaths.map(path => this.load(path)));
  }
  
  /**
   * Check if a component is loaded
   * @param {string} componentPath - Path to the component module
   * @returns {boolean} - True if component is loaded
   */
  isLoaded(componentPath) {
    return this.loadedComponents.has(componentPath);
  }
  
  /**
   * Get all loaded component paths
   * @returns {Array<string>} - Array of loaded component paths
   */
  getLoadedComponents() {
    return Array.from(this.loadedComponents);
  }
}

// Create a singleton instance
export const componentLoader = new DynamicComponentLoader();

/**
 * Component paths for common components
 */
export const ComponentPaths = {
  // Core components
  ERROR_CONTAINER: 'core/error-handling/error-container.js',
  ERROR_MESSAGE: 'core/error-handling/error-message.js',
  
  // UI components
  APP_CARD: 'ui/cards/app-card.js',
  APP_LIST: 'ui/containers/app-list.js',
  APP_MANAGEMENT_SECTION: 'ui/containers/app-management-section.js',
  APP_DETAILS_MODAL: 'ui/modals/app-details-modal.js'
};

/**
 * Load essential components needed for most pages
 * @returns {Promise<void>} - Promise that resolves when essential components are loaded
 */
export async function loadEssentialComponents() {
  await componentLoader.loadMultiple([
    ComponentPaths.ERROR_CONTAINER,
    ComponentPaths.ERROR_MESSAGE
  ]);
}

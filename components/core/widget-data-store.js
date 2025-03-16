/**
 * Widget Data Store
 * A simple data persistence layer for widgets.
 * This is a placeholder implementation that will be replaced with SQLite in the future.
 */

/**
 * Widget Data Store class for persisting widget data
 */
export class WidgetDataStore {
  /**
   * Create a new WidgetDataStore instance
   * @param {string} widgetId - ID of the widget
   */
  constructor(widgetId) {
    this._widgetId = widgetId;
    this._data = new Map();
    this._initialized = false;
  }
  
  /**
   * Initialize the data store
   * @returns {Promise<boolean>} - True if initialized successfully
   */
  async initialize() {
    if (this._initialized) {
      return true;
    }
    
    try {
      // Load data from localStorage as a temporary solution
      // This will be replaced with SQLite in the future
      await this._loadFromLocalStorage();
      this._initialized = true;
      return true;
    } catch (error) {
      console.error(`Error initializing data store for widget ${this._widgetId}:`, error);
      return false;
    }
  }
  
  /**
   * Save data to the store
   * @param {string} key - Data key
   * @param {any} value - Data value
   * @returns {Promise<boolean>} - True if saved successfully
   */
  async saveData(key, value) {
    if (!this._initialized) {
      await this.initialize();
    }
    
    try {
      // Store data in memory
      this._data.set(key, value);
      
      // Persist to localStorage as a temporary solution
      await this._saveToLocalStorage();
      
      return true;
    } catch (error) {
      console.error(`Error saving data for widget ${this._widgetId}, key ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Load data from the store
   * @param {string} key - Data key
   * @returns {Promise<any>} - Loaded data or null if not found
   */
  async loadData(key) {
    if (!this._initialized) {
      await this.initialize();
    }
    
    return this._data.get(key) || null;
  }
  
  /**
   * Delete data from the store
   * @param {string} key - Data key
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteData(key) {
    if (!this._initialized) {
      await this.initialize();
    }
    
    try {
      // Remove from memory
      const existed = this._data.delete(key);
      
      // Persist changes to localStorage
      await this._saveToLocalStorage();
      
      return existed;
    } catch (error) {
      console.error(`Error deleting data for widget ${this._widgetId}, key ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Clear all data for this widget
   * @returns {Promise<boolean>} - True if cleared successfully
   */
  async clearData() {
    try {
      // Clear memory
      this._data.clear();
      
      // Clear localStorage
      await this._clearLocalStorage();
      
      return true;
    } catch (error) {
      console.error(`Error clearing data for widget ${this._widgetId}:`, error);
      return false;
    }
  }
  
  /**
   * Get all keys in the store
   * @returns {Promise<string[]>} - Array of keys
   */
  async getKeys() {
    if (!this._initialized) {
      await this.initialize();
    }
    
    return Array.from(this._data.keys());
  }
  
  /**
   * Check if a key exists in the store
   * @param {string} key - Data key
   * @returns {Promise<boolean>} - True if key exists
   */
  async hasKey(key) {
    if (!this._initialized) {
      await this.initialize();
    }
    
    return this._data.has(key);
  }
  
  /**
   * Get the size of the store
   * @returns {Promise<number>} - Number of key-value pairs
   */
  async getSize() {
    if (!this._initialized) {
      await this.initialize();
    }
    
    return this._data.size;
  }
  
  /**
   * Load data from localStorage
   * @private
   */
  async _loadFromLocalStorage() {
    // Skip if not in browser environment
    if (typeof localStorage === 'undefined') {
      return;
    }
    
    const storageKey = `widget_data_${this._widgetId}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        
        // Convert to Map
        this._data.clear();
        Object.entries(parsedData).forEach(([key, value]) => {
          this._data.set(key, value);
        });
      } catch (error) {
        console.error(`Error parsing stored data for widget ${this._widgetId}:`, error);
      }
    }
  }
  
  /**
   * Save data to localStorage
   * @private
   */
  async _saveToLocalStorage() {
    // Skip if not in browser environment
    if (typeof localStorage === 'undefined') {
      return;
    }
    
    const storageKey = `widget_data_${this._widgetId}`;
    
    // Convert Map to object for storage
    const dataObject = {};
    this._data.forEach((value, key) => {
      dataObject[key] = value;
    });
    
    localStorage.setItem(storageKey, JSON.stringify(dataObject));
  }
  
  /**
   * Clear localStorage for this widget
   * @private
   */
  async _clearLocalStorage() {
    // Skip if not in browser environment
    if (typeof localStorage === 'undefined') {
      return;
    }
    
    const storageKey = `widget_data_${this._widgetId}`;
    localStorage.removeItem(storageKey);
  }
}

/**
 * Create a data store for a widget
 * @param {string} widgetId - ID of the widget
 * @returns {WidgetDataStore} - Widget data store instance
 */
export function createWidgetDataStore(widgetId) {
  return new WidgetDataStore(widgetId);
}

/**
 * Global registry of widget data stores
 */
const dataStoreRegistry = new Map();

/**
 * Get or create a data store for a widget
 * @param {string} widgetId - ID of the widget
 * @returns {WidgetDataStore} - Widget data store instance
 */
export function getWidgetDataStore(widgetId) {
  if (!dataStoreRegistry.has(widgetId)) {
    const dataStore = createWidgetDataStore(widgetId);
    dataStoreRegistry.set(widgetId, dataStore);
  }
  
  return dataStoreRegistry.get(widgetId);
}

export default {
  WidgetDataStore,
  createWidgetDataStore,
  getWidgetDataStore
};

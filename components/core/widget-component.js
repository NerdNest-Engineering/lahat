/**
 * Widget Component Base Class
 * Base class for all widget components in the Lahat system.
 * Provides common functionality for widgets including:
 * - Event communication with parent cells
 * - Data persistence
 * - Standard widget lifecycle
 */

import { BaseComponent } from './base-component.js';
import { getWidgetDataStore } from './widget-data-store.js';
import { globalEventBus, createNamespacedEventBus } from './event-bus.js';

/**
 * Widget Component that provides common functionality for all widgets
 * @extends BaseComponent
 */
export class WidgetComponent extends BaseComponent {
  /**
   * Create a new WidgetComponent instance
   */
  constructor() {
    super();
    
    // Widget-specific properties
    this._dataStore = null;
    this._parentCell = null;
    
    // Set widget attribute for identification
    this.setAttribute('data-widget', 'true');
  }
  
  /**
   * Initialize the widget
   * Called once when the widget is first created
   */
  initialize() {
    super.initialize();
    this.setupDataStore();
  }
  
  /**
   * Set up data persistence for this widget
   * @private
   */
  async setupDataStore() {
    try {
      // Get or create data store for this widget
      this._dataStore = getWidgetDataStore(this.id);
      
      // Initialize the data store
      await this._dataStore.initialize();
      
      // Create namespaced event bus for this widget
      this._eventBus = createNamespacedEventBus(`widget:${this.id}`);
      
      // Load initial data if needed
      await this.onDataStoreReady();
    } catch (error) {
      console.error('Error setting up data store:', error);
      this.handleError(error);
    }
  }
  
  /**
   * Called when the data store is ready
   * Override in subclass to load initial data
   */
  async onDataStoreReady() {
    // Override in subclass
  }
  
  /**
   * Save data to persistent storage
   * @param {string} key - Data key
   * @param {any} value - Data value
   * @returns {Promise<boolean>} - Success flag
   */
  async saveData(key, value) {
    if (!this._dataStore) {
      console.warn('Data store not initialized');
      return false;
    }
    
    try {
      return await this._dataStore.saveData(key, value);
    } catch (error) {
      console.error(`Error saving data for key ${key}:`, error);
      this.handleError(error);
      return false;
    }
  }
  
  /**
   * Load data from persistent storage
   * @param {string} key - Data key
   * @returns {Promise<any>} - Loaded data or null if not found
   */
  async loadData(key) {
    if (!this._dataStore) {
      console.warn('Data store not initialized');
      return null;
    }
    
    try {
      return await this._dataStore.loadData(key);
    } catch (error) {
      console.error(`Error loading data for key ${key}:`, error);
      this.handleError(error);
      return null;
    }
  }
  
  /**
   * Set the parent cell for this widget
   * @param {LahatCell} cell - Parent cell
   */
  setParentCell(cell) {
    this._parentCell = cell;
  }
  
  /**
   * Get the parent cell for this widget
   * @returns {LahatCell|null} - Parent cell or null if not set
   */
  getParentCell() {
    return this._parentCell;
  }
  
  /**
   * Publish an event to the parent cell
   * @param {string} eventName - Event name
   * @param {any} data - Event data
   * @returns {boolean} - True if event was dispatched
   */
  publishEvent(eventName, data = {}) {
    // Publish to namespaced event bus
    if (this._eventBus) {
      this._eventBus.publish(eventName, data);
    }
    
    // Create a custom event with the widget event details
    const event = new CustomEvent('widget-event', {
      bubbles: true,
      composed: true,
      detail: {
        sourceWidget: this,
        eventName,
        data
      }
    });
    
    // Dispatch the event
    return this.dispatchEvent(event);
  }
  
  /**
   * Subscribe to widget events
   * @param {string} eventName - Event name to subscribe to
   * @param {Function} callback - Callback function
   * @param {Object} [options] - Subscription options
   * @returns {Function} - Unsubscribe function
   */
  subscribeToEvent(eventName, callback, options = {}) {
    if (!this._eventBus) {
      console.warn('Event bus not initialized');
      return () => {};
    }
    
    return this._eventBus.subscribe(eventName, callback, options);
  }
  
  /**
   * Subscribe to widget events once
   * @param {string} eventName - Event name to subscribe to
   * @param {Function} callback - Callback function
   * @param {Object} [options] - Subscription options
   * @returns {Function} - Unsubscribe function
   */
  subscribeToEventOnce(eventName, callback, options = {}) {
    if (!this._eventBus) {
      console.warn('Event bus not initialized');
      return () => {};
    }
    
    return this._eventBus.subscribeOnce(eventName, callback, options);
  }
  
  /**
   * Handle resize events
   * Override in subclass to handle resizing
   * @param {number} width - New width
   * @param {number} height - New height
   */
  onResize(width, height) {
    // Override in subclass
  }
  
  /**
   * Get widget metadata
   * @returns {Object} - Widget metadata
   */
  getMetadata() {
    return {
      id: this.id,
      tagName: this.tagName,
      type: this.constructor.name,
      dataKeys: this._dataStore ? this._dataStore.getKeys() : []
    };
  }
  
  /**
   * Dispose widget resources
   * Called when the widget is being removed
   */
  dispose() {
    // Clean up resources
    if (this._dataStore) {
      // Don't clear data, just release the reference
      this._dataStore = null;
    }
    
    // Call parent dispose
    super.dispose && super.dispose();
  }
}

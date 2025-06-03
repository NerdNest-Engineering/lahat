import { BaseComponent } from '../shared/base-component.js';
import './app-card.js';

/**
 * @typedef {Object} AppData
 * @property {string} id - Unique app identifier
 * @property {string} name - App name
 * @property {string} [description] - App description
 * @property {string} [icon] - App icon URL
 */

/**
 * AppList component - Displays app cards in a responsive flexbox grid
 * 
 * Features:
 * - Responsive layout using CSS Flexbox with CSS custom properties
 * - Automatic wrapping based on available space
 * - Empty state handling with welcome message
 * - Event delegation for app actions (open, delete, export)
 * - Loading states and smooth transitions
 * - Accessibility support with ARIA attributes
 * - Performance optimizations with memoization
 * 
 * @extends BaseComponent
 */
export class AppList extends BaseComponent {
  /** @type {Map<string, HTMLElement>} */
  #appCardCache = new Map();
  
  /** @type {boolean} */
  #isLoading = false;
  
  /** @type {AbortController|null} */
  #loadingController = null;

  /** @type {HTMLElement|null} */
  #noAppsMessageElement = null;

  /** @type {AppData[]} */
  #allApps = [];

  /** @type {string} */
  #currentSearchQuery = '';

  constructor() {
    super();
    this._boundEventHandlers = this._createBoundEventHandlers();
  }

  /**
   * Create bound event handlers for better performance
   * @private
   * @returns {Object} Bound event handlers
   */
  _createBoundEventHandlers() {
    return {
      handleAppOpen: this._handleAppOpen.bind(this),
      handleAppDelete: this._handleAppDelete.bind(this),
      handleAppExport: this._handleAppExport.bind(this)
    };
  }

  /**
   * Initialize component - called once when component is first created
   */
  initialize() {
    this.render(this._getTemplate(), this._getStyles());
    this._cacheElements();
    this._setupAccessibility();
  }

  /**
   * Called when component is connected to DOM
   */
  onConnected() {
    this._setupEventListeners();
  }

  /**
   * Called when component is disconnected from DOM
   */
  onDisconnected() {
    this._cleanup();
  }

  /**
   * Get component styles with CSS custom properties and modern features
   * @private
   * @returns {string} CSS styles
   */
  _getStyles() {
    return `
      :host {
        --no-apps-bg: #f8f9fa;
        --no-apps-text: #5f6368;
        --no-apps-heading: #333;
        --border-radius: 8px;
        --gap-min: 16px;
        --gap-preferred: 2vw;
        --gap-max: 24px;
        --transition-duration: 0.2s;
        --transition-easing: ease-out;
        
        display: block;
        margin: 0;
        contain: layout style paint;
      }
      
      .no-apps-message {
        background: var(--no-apps-bg);
        border-radius: var(--border-radius);
        padding: 20px;
        text-align: center;
        color: var(--no-apps-text);
        margin: 8px;
      }
      
      .no-apps-message h3 {
        margin: 0 0 8px 0;
        color: var(--no-apps-heading);
        font-size: 18px;
        font-weight: 600;
      }
      
      .no-apps-message p {
        margin: 4px 0;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .app-list-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-content: flex-start;
        gap: clamp(var(--gap-min), var(--gap-preferred), var(--gap-max));
        padding: 8px;
        width: 100%;
        margin: 0;
        box-sizing: border-box;
        contain: layout style;
        min-height: 100px;
        position: relative;
      }
      
      .app-list-container.loading {
        opacity: 0.7;
        pointer-events: none;
      }
      
      .app-list-container.loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 24px;
        height: 24px;
        margin: -12px 0 0 -12px;
        border: 2px solid #e0e0e0;
        border-top-color: #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .no-apps-message,
        .app-list-container {
          transition: none;
        }
        
        .app-list-container.loading::after {
          animation: none;
          border-top-color: #007bff;
        }
      }
      
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .no-apps-message {
          border: 2px solid currentColor;
        }
      }
    `;
  }

  /**
   * Get component HTML template with accessibility attributes
   * @private
   * @returns {string} HTML template
   */
  _getTemplate() {
    return `
      <div class="app-list-container" 
           role="grid" 
           aria-label="App list"
           aria-live="polite"
           aria-busy="false">
      </div>
    `;
  }

  /**
   * Create the "no apps" message element
   * @private
   * @returns {HTMLElement} No apps message element
   */
  _createNoAppsMessage() {
    const element = document.createElement('div');
    element.className = 'no-apps-message';
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
    element.innerHTML = `
      <h3>🚀 Welcome to Lahat!</h3>
      <p>You don't have any mini apps yet.</p>
      <p>Click the "Create App" button to get started!</p>
    `;
    return element;
  }

  /**
   * Create the "no search results" message element
   * @private
   * @returns {HTMLElement} No search results message element
   */
  _createNoSearchResultsMessage() {
    const element = document.createElement('div');
    element.className = 'no-apps-message';
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
    element.innerHTML = `
      <h3>🔍 No apps found</h3>
      <p>No apps match your search query "${this.#currentSearchQuery}".</p>
      <p>Try a different search term or clear the search to see all apps.</p>
    `;
    return element;
  }

  /**
   * Cache DOM element references using BaseComponent helpers
   * @private
   */
  _cacheElements() {
    this._appListContainer = this.$('.app-list-container');
    
    if (!this._appListContainer) {
      throw new Error('Required DOM elements not found');
    }
  }

  /**
   * Setup accessibility features
   * @private
   */
  _setupAccessibility() {
    // Set initial ARIA attributes
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Application list');
  }

  /**
   * Set up event listeners for app card actions using event delegation
   * @private
   */
  _setupEventListeners() {
    this.addEventListener(this._appListContainer, 'app-open', this._boundEventHandlers.handleAppOpen);
    this.addEventListener(this._appListContainer, 'app-delete', this._boundEventHandlers.handleAppDelete);
    this.addEventListener(this._appListContainer, 'app-export', this._boundEventHandlers.handleAppExport);
  }

  /**
   * Handle app open event with enhanced error context
   * @param {CustomEvent} event - The app open event
   * @private
   */
  _handleAppOpen(event) {
    try {
      if (!event.detail) {
        throw new Error('App open event missing detail data');
      }
      // Stop propagation to prevent duplicate handling
      event.stopPropagation();
      this.emit('app-open', event.detail);
    } catch (error) {
      this.handleError(new Error(`Failed to handle app open: ${error.message}`));
    }
  }

  /**
   * Handle app delete event with enhanced error context
   * @param {CustomEvent} event - The app delete event
   * @private
   */
  _handleAppDelete(event) {
    try {
      if (!event.detail) {
        throw new Error('App delete event missing detail data');
      }
      // Stop propagation to prevent duplicate handling
      event.stopPropagation();
      this.emit('app-delete', event.detail);
    } catch (error) {
      this.handleError(new Error(`Failed to handle app delete: ${error.message}`));
    }
  }

  /**
   * Handle app export event with enhanced error context
   * @param {CustomEvent} event - The app export event
   * @private
   */
  _handleAppExport(event) {
    try {
      if (!event.detail) {
        throw new Error('App export event missing detail data');
      }
      // Stop propagation to prevent duplicate handling
      event.stopPropagation();
      this.emit('app-export', event.detail);
    } catch (error) {
      this.handleError(new Error(`Failed to handle app export: ${error.message}`));
    }
  }

  /**
   * Set loading state with visual feedback
   * @param {boolean} loading - Loading state
   * @private
   */
  _setLoadingState(loading) {
    this.#isLoading = loading;
    this._appListContainer.classList.toggle('loading', loading);
    this._appListContainer.setAttribute('aria-busy', loading.toString());
    
    if (loading) {
      this._appListContainer.setAttribute('aria-label', 'Loading apps...');
    } else {
      this._appListContainer.setAttribute('aria-label', 'App list');
    }
  }

  /**
   * Clear the app list container and cache
   * @private
   */
  _clearAppList() {
    this._appListContainer.innerHTML = '';
    this.#appCardCache.clear();
  }

  /**
   * Show the "no apps" message by adding it to DOM
   * @private
   */
  _showNoAppsMessage() {
    // Remove existing message if present
    this._hideNoAppsMessage();
    
    // Create and insert the message element
    this.#noAppsMessageElement = this._createNoAppsMessage();
    this.shadowRoot.insertBefore(this.#noAppsMessageElement, this._appListContainer);
    
    this._appListContainer.setAttribute('aria-label', 'No apps available');
  }

  /**
   * Show the "no search results" message by adding it to DOM
   * @private
   */
  _showNoSearchResultsMessage() {
    // Remove existing message if present
    this._hideNoAppsMessage();
    
    // Create and insert the message element
    this.#noAppsMessageElement = this._createNoSearchResultsMessage();
    this.shadowRoot.insertBefore(this.#noAppsMessageElement, this._appListContainer);
    
    this._appListContainer.setAttribute('aria-label', `No search results for "${this.#currentSearchQuery}"`);
  }

  /**
   * Hide the "no apps" message by removing it from DOM
   * @private
   */
  _hideNoAppsMessage() {
    if (this.#noAppsMessageElement && this.#noAppsMessageElement.parentNode) {
      this.#noAppsMessageElement.parentNode.removeChild(this.#noAppsMessageElement);
      this.#noAppsMessageElement = null;
    }
  }

  /**
   * Validate app data structure
   * @param {AppData} app - App data to validate
   * @private
   * @throws {Error} If app data is invalid
   */
  _validateAppData(app) {
    if (!app || typeof app !== 'object') {
      throw new Error('App must be a valid object');
    }
    
    if (!app.id || typeof app.id !== 'string') {
      throw new Error('App must have a valid string ID');
    }
    
    if (!app.name || typeof app.name !== 'string') {
      throw new Error('App must have a valid string name');
    }
  }

  /**
   * Create a single app card with caching and validation
   * @param {AppData} app - App data
   * @returns {Promise<HTMLElement>} App card element
   * @private
   */
  async _createAppCard(app) {
    this._validateAppData(app);
    
    // Check cache first
    if (this.#appCardCache.has(app.id)) {
      const cachedCard = this.#appCardCache.get(app.id);
      // Update cached card with new data
      if (typeof cachedCard.setAppData === 'function') {
        cachedCard.setAppData(app);
      }
      return cachedCard.cloneNode(true);
    }
    
    const appCard = document.createElement('app-card');
    
    if (typeof appCard.setAppData !== 'function') {
      throw new Error('app-card element does not support setAppData method');
    }
    
    appCard.setAppData(app);
    appCard.setAttribute('role', 'gridcell');
    appCard.setAttribute('tabindex', '0');
    
    // Cache the card
    this.#appCardCache.set(app.id, appCard.cloneNode(true));
    
    return appCard;
  }

  /**
   * Create app cards from app data with better error handling
   * @param {AppData[]} apps - Array of app objects
   * @returns {Promise<HTMLElement[]>} Array of app card elements
   * @private
   */
  async _createAppCards(apps) {
    if (!Array.isArray(apps)) {
      throw new Error('Apps must be an array');
    }
    
    const appCards = [];
    const errors = [];
    
    for (const [index, app] of apps.entries()) {
      try {
        const appCard = await this._createAppCard(app);
        appCards.push(appCard);
      } catch (error) {
        errors.push(`App ${index} (${app?.id || 'unknown'}): ${error.message}`);
      }
    }
    
    if (errors.length > 0) {
      this.handleError(new Error(`Failed to create some app cards:\n${errors.join('\n')}`));
    }
    
    return appCards;
  }

  /**
   * Filter apps based on search query
   * @param {AppData[]} apps - Array of app objects to filter
   * @param {string} query - Search query
   * @returns {AppData[]} Filtered apps
   * @private
   */
  _filterApps(apps, query) {
    if (!query || !query.trim()) {
      return apps;
    }

    const searchTerm = query.toLowerCase().trim();
    return apps.filter(app => {
      const name = (app.name || '').toLowerCase();
      const description = (app.description || '').toLowerCase();
      return name.includes(searchTerm) || description.includes(searchTerm);
    });
  }

  /**
   * Apply current search filter and update display
   * @returns {Promise<void>}
   * @private
   */
  async _applySearchFilter() {
    const filteredApps = this._filterApps(this.#allApps, this.#currentSearchQuery);
    await this._displayApps(filteredApps);
  }

  /**
   * Display apps (internal method used by both setApps and search)
   * @param {AppData[]} apps - Array of app objects to display
   * @returns {Promise<void>}
   * @private
   */
  async _displayApps(apps) {
    // Cancel any ongoing loading operation
    if (this.#loadingController) {
      this.#loadingController.abort();
    }
    
    this.#loadingController = new AbortController();
    const { signal } = this.#loadingController;
    
    try {
      this._setLoadingState(true);
      this._clearAppList();
      
      if (signal.aborted) return;
      
      if (!apps?.length) {
        if (this.#currentSearchQuery) {
          this._showNoSearchResultsMessage();
        } else {
          this._showNoAppsMessage();
        }
        return;
      }
      
      this._hideNoAppsMessage();
      
      // Wait for app-card custom element to be defined
      await customElements.whenDefined('app-card');
      
      if (signal.aborted) return;
      
      // Create app cards using DocumentFragment for better performance
      const fragment = document.createDocumentFragment();
      const appCards = await this._createAppCards(apps);
      
      if (signal.aborted) return;
      
      appCards.forEach(card => fragment.appendChild(card));
      this._appListContainer.appendChild(fragment);
      
      // Update accessibility
      const searchText = this.#currentSearchQuery ? ` (filtered by "${this.#currentSearchQuery}")` : '';
      this._appListContainer.setAttribute('aria-label', `App list with ${appCards.length} apps${searchText}`);
      
    } catch (error) {
      if (!signal.aborted) {
        this.handleError(new Error(`Failed to display apps: ${error.message}`));
      }
    } finally {
      if (!signal.aborted) {
        this._setLoadingState(false);
        this.#loadingController = null;
      }
    }
  }

  /**
   * Set the list of apps to display with enhanced loading states
   * @param {AppData[]} apps - Array of app objects
   * @returns {Promise<void>}
   */
  async setApps(apps) {
    try {
      // Store all apps for filtering
      this.#allApps = Array.isArray(apps) ? [...apps] : [];
      
      // Apply current search filter to new apps
      await this._applySearchFilter();
      
    } catch (error) {
      this.handleError(new Error(`Failed to set apps: ${error.message}`));
    }
  }

  /**
   * Add a single app to the list with optimistic updates
   * @param {AppData} app - App object to add
   * @returns {Promise<void>}
   */
  async addApp(app) {
    try {
      this._validateAppData(app);
      
      // Check if app already exists in the full list
      const existingApp = this.#allApps.find(existingApp => existingApp.id === app.id);
      if (existingApp) {
        throw new Error(`App with ID ${app.id} already exists`);
      }
      
      // Add to full apps list
      this.#allApps.push(app);
      
      // Re-apply search filter to update display
      await this._applySearchFilter();
      
    } catch (error) {
      this.handleError(new Error(`Failed to add app: ${error.message}`));
    }
  }

  /**
   * Remove an app from the list with cleanup
   * @param {string} appId - ID of the app to remove
   */
  async removeApp(appId) {
    try {
      if (!appId || typeof appId !== 'string') {
        throw new Error('App ID must be a non-empty string');
      }
      
      // Remove from full apps list
      const appIndex = this.#allApps.findIndex(app => app.id === appId);
      if (appIndex !== -1) {
        this.#allApps.splice(appIndex, 1);
      }
      
      // Remove from cache
      this.#appCardCache.delete(appId);
      
      // Re-apply search filter to update display
      await this._applySearchFilter();
      
    } catch (error) {
      this.handleError(new Error(`Failed to remove app ${appId}: ${error.message}`));
    }
  }

  /**
   * Update an existing app in the list
   * @param {AppData} app - Updated app object
   */
  async updateApp(app) {
    try {
      this._validateAppData(app);
      
      // Update in the full apps list
      const appIndex = this.#allApps.findIndex(existingApp => existingApp.id === app.id);
      if (appIndex !== -1) {
        this.#allApps[appIndex] = { ...app };
      }
      
      // Update cache
      this.#appCardCache.delete(app.id);
      
      // Re-apply search filter to update display
      await this._applySearchFilter();
      
    } catch (error) {
      this.handleError(new Error(`Failed to update app ${app?.id}: ${error.message}`));
    }
  }

  /**
   * Filter apps based on search query
   * @param {string} query - Search query
   * @returns {Promise<void>}
   */
  async searchApps(query) {
    try {
      this.#currentSearchQuery = query || '';
      await this._applySearchFilter();
    } catch (error) {
      this.handleError(new Error(`Failed to search apps: ${error.message}`));
    }
  }

  /**
   * Clear search filter and show all apps
   * @returns {Promise<void>}
   */
  async clearSearch() {
    return this.searchApps('');
  }

  /**
   * Get current app count
   * @returns {number} Number of apps currently displayed
   */
  getAppCount() {
    return this._appListContainer.children.length;
  }

  /**
   * Check if component is currently loading
   * @returns {boolean} Loading state
   */
  isLoading() {
    return this.#isLoading;
  }

  /**
   * Cleanup resources and cancel operations
   * @private
   */
  _cleanup() {
    if (this.#loadingController) {
      this.#loadingController.abort();
      this.#loadingController = null;
    }
    
    this.#appCardCache.clear();
    this.#allApps = [];
    this.#currentSearchQuery = '';
    this.#noAppsMessageElement = null;
  }
}

// Register the custom element
customElements.define('app-list', AppList);

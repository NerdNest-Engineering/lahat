/**
 * Widget Drawer Component
 * Displays available widgets that can be added to the app
 */

import { ErrorLevel, showError } from '../../utils/error-utils.js';
import { dispatchCustomEvent } from '../../utils/event-utils.js';

export class WidgetDrawer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
          width: 100%;
          background-color: #f5f5f5;
          border-left: 1px solid var(--border-color, #e0e0e0);
          overflow-y: auto;
        }
        
        .widget-drawer {
          padding: 16px;
        }
        
        .widget-drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .widget-drawer-title {
          font-size: 18px;
          font-weight: 500;
        }
        
        .widget-drawer-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 20px;
          color: #5f6368;
        }
        
        .widget-search {
          margin-bottom: 16px;
        }
        
        .widget-search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 4px;
          font-size: 14px;
        }
        
        .widget-category {
          margin-bottom: 16px;
        }
        
        .widget-category-title {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        
        .widget-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        
        .widget-card {
          background-color: white;
          border-radius: var(--border-radius, 8px);
          box-shadow: var(--shadow, 0 2px 10px rgba(0, 0, 0, 0.1));
          padding: 12px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .widget-card:hover {
          transform: translateY(-2px);
        }
        
        .widget-card-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .widget-card-description {
          font-size: 12px;
          color: #5f6368;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .add-widget-button {
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: var(--primary-color, #4285f4);
          color: white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 24px;
          cursor: pointer;
          position: absolute;
          bottom: 20px;
          right: 20px;
          box-shadow: var(--shadow, 0 2px 10px rgba(0, 0, 0, 0.1));
        }
        
        .add-widget-button:hover {
          background-color: var(--primary-color-dark, #3367d6);
        }
        
        .loading-state,
        .empty-state,
        .error-state {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 200px;
          color: #5f6368;
          text-align: center;
        }
        
        .loading-state-icon,
        .empty-state-icon,
        .error-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .loading-state-title,
        .empty-state-title,
        .error-state-title {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        
        .loading-state-description,
        .empty-state-description,
        .error-state-description {
          font-size: 14px;
          margin-bottom: 16px;
        }
        
        .empty-state-button,
        .error-state-button {
          padding: 8px 16px;
          background-color: var(--primary-color, #4285f4);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        }
        
        .empty-state-button:hover,
        .error-state-button:hover {
          background-color: var(--primary-color-dark, #3367d6);
        }
      </style>
      
      <div class="widget-drawer">
        <div class="widget-drawer-header">
          <div class="widget-drawer-title">Widget Drawer</div>
          <button class="widget-drawer-close">✕</button>
        </div>
        
        <div class="widget-search">
          <input type="text" class="widget-search-input" placeholder="Search widgets...">
        </div>
        
        <div class="widget-content">
          <div class="loading-state">
            <div class="loading-state-icon">⏳</div>
            <div class="loading-state-title">Loading Widgets</div>
            <div class="loading-state-description">Please wait while we load available widgets.</div>
          </div>
        </div>
        
        <div class="add-widget-button">+</div>
      </div>
    `;
    
    // Set up event listeners
    this.shadowRoot.querySelector('.widget-drawer-close').addEventListener('click', () => {
      this.close();
    });
    
    this.shadowRoot.querySelector('.add-widget-button').addEventListener('click', () => {
      this.createNewWidget();
    });
    
    this.shadowRoot.querySelector('.widget-search-input').addEventListener('input', (event) => {
      this.filterWidgets(event.target.value);
    });
    
    // Initialize properties
    this.widgets = [];
    this.filteredWidgets = [];
  }
  
  /**
   * Called when the element is added to the DOM
   */
  connectedCallback() {
    // Load available widgets
    this.loadWidgets();
  }
  
  /**
   * Load available widgets
   */
  async loadWidgets() {
    try {
      // Show loading state
      this.showLoadingState();
      
      // Load available widgets
      const { getAvailableWidgets } = await import('../../ipc/renderer-handlers.js');
      const result = await getAvailableWidgets();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load available widgets');
      }
      
      // Store the widgets
      this.widgets = result.widgets || [];
      this.filteredWidgets = [...this.widgets];
      
      // Render the widgets
      this.renderWidgets();
    } catch (error) {
      console.error('Error loading widgets:', error);
      
      // Show error state
      this.showErrorState(error.message);
      
      // Show error in the UI
      showError('Widget Loading Error', error.message, ErrorLevel.ERROR);
    }
  }
  
  /**
   * Render the widgets
   */
  renderWidgets() {
    const widgetContent = this.shadowRoot.querySelector('.widget-content');
    
    // Check if there are any widgets
    if (this.filteredWidgets.length === 0) {
      this.showEmptyState();
      return;
    }
    
    // Group widgets by category
    const categories = this.groupWidgetsByCategory();
    
    // Clear the widget content
    widgetContent.innerHTML = '';
    
    // Render each category
    for (const [category, widgets] of Object.entries(categories)) {
      const categoryElement = document.createElement('div');
      categoryElement.className = 'widget-category';
      
      categoryElement.innerHTML = `
        <div class="widget-category-title">${category}</div>
        <div class="widget-list">
          ${widgets.map(widget => `
            <div class="widget-card" data-component-name="${widget.name}">
              <div class="widget-card-title">${widget.componentName || widget.name}</div>
              <div class="widget-card-description">${widget.description || ''}</div>
            </div>
          `).join('')}
        </div>
      `;
      
      // Add the category to the widget content
      widgetContent.appendChild(categoryElement);
    }
    
    // Add event listeners to widget cards
    const widgetCards = widgetContent.querySelectorAll('.widget-card');
    widgetCards.forEach(card => {
      card.addEventListener('click', () => {
        const componentName = card.dataset.componentName;
        this.addWidget(componentName);
      });
    });
  }
  
  /**
   * Group widgets by category
   * @returns {Object} - An object mapping categories to widgets
   */
  groupWidgetsByCategory() {
    const categories = {};
    
    // Group widgets by category
    for (const widget of this.filteredWidgets) {
      const category = widget.category || 'Uncategorized';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push(widget);
    }
    
    return categories;
  }
  
  /**
   * Filter widgets by search term
   * @param {string} searchTerm - The search term
   */
  filterWidgets(searchTerm) {
    if (!searchTerm) {
      this.filteredWidgets = [...this.widgets];
    } else {
      const term = searchTerm.toLowerCase();
      
      this.filteredWidgets = this.widgets.filter(widget => {
        const name = (widget.componentName || widget.name || '').toLowerCase();
        const description = (widget.description || '').toLowerCase();
        
        return name.includes(term) || description.includes(term);
      });
    }
    
    // Render the filtered widgets
    this.renderWidgets();
  }
  
  /**
   * Add a widget to the app
   * @param {string} componentName - The component name
   */
  addWidget(componentName) {
    // Find the widget
    const widget = this.widgets.find(w => w.name === componentName);
    
    if (!widget) {
      showError('Widget Not Found', `Widget ${componentName} not found`, ErrorLevel.ERROR);
      return;
    }
    
    // Dispatch a widget-selected event
    dispatchCustomEvent(this, 'widget-selected', {
      componentName,
      widget
    });
    
    // Close the drawer
    this.close();
  }
  
  /**
   * Create a new widget
   */
  createNewWidget() {
    // Dispatch a create-widget-requested event
    dispatchCustomEvent(this, 'create-widget-requested', {});
  }
  
  /**
   * Close the drawer
   */
  close() {
    // Dispatch a widget-drawer-closed event
    dispatchCustomEvent(this, 'widget-drawer-closed', {});
  }
  
  /**
   * Show loading state
   */
  showLoadingState() {
    const widgetContent = this.shadowRoot.querySelector('.widget-content');
    
    widgetContent.innerHTML = `
      <div class="loading-state">
        <div class="loading-state-icon">⏳</div>
        <div class="loading-state-title">Loading Widgets</div>
        <div class="loading-state-description">Please wait while we load available widgets.</div>
      </div>
    `;
  }
  
  /**
   * Show empty state
   */
  showEmptyState() {
    const widgetContent = this.shadowRoot.querySelector('.widget-content');
    
    widgetContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <div class="empty-state-title">No Widgets Found</div>
        <div class="empty-state-description">No widgets match your search criteria.</div>
        <button class="empty-state-button">Create New Widget</button>
      </div>
    `;
    
    // Set up event listener for the button
    widgetContent.querySelector('.empty-state-button').addEventListener('click', () => {
      this.createNewWidget();
    });
  }
  
  /**
   * Show error state
   * @param {string} errorMessage - The error message
   */
  showErrorState(errorMessage) {
    const widgetContent = this.shadowRoot.querySelector('.widget-content');
    
    widgetContent.innerHTML = `
      <div class="error-state">
        <div class="error-state-icon">❌</div>
        <div class="error-state-title">Error Loading Widgets</div>
        <div class="error-state-description">${errorMessage}</div>
        <button class="error-state-button">Try Again</button>
      </div>
    `;
    
    // Set up event listener for the button
    widgetContent.querySelector('.error-state-button').addEventListener('click', () => {
      this.loadWidgets();
    });
  }
}

// Register the component
customElements.define('widget-drawer', WidgetDrawer);

import { BaseComponent } from '../shared/base-component.js';

/**
 * AppCard component - Apple-style launcher icon
 * 
 * FLEXBOX-OPTIMIZED: Fixed dimensions for predictable flexbox behavior
 * This component is optimized to work with the flexbox-based app-list container.
 * Uses fixed width (120px) and flex: 0 0 auto for consistent layout.
 * 
 * Displays app as an icon with logo and name, similar to iOS/macOS
 */
export class AppCard extends BaseComponent {
  constructor() {
    super();
    
    console.log('🎯 AppCard: Constructor called');
    
    // Component state
    this._appData = null;
    this._logoLoaded = false;
    this._isHovered = false;
    
    // Bind methods to preserve context
    this._handleClick = this._handleClick.bind(this);
    this._handleDelete = this._handleDelete.bind(this);
    this._handleExport = this._handleExport.bind(this);
    this._handleMouseEnter = this._handleMouseEnter.bind(this);
    this._handleMouseLeave = this._handleMouseLeave.bind(this);
    
    console.log('🎯 AppCard: Constructor completed');
  }
  
  /**
   * Define observed attributes for reactive updates
   */
  static get observedAttributes() {
    return ['name', 'logo-path', 'app-id', 'file-path'];
  }
  
  /**
   * Initialize the component
   */
  initialize() {
    console.log('🎯 AppCard: Initialize called');
    this._render();
    this._setupEventListeners();
    this._updateFromAttributes();
    console.log('🎯 AppCard: Initialize completed');
  }
  
  /**
   * Called when an observed attribute changes
   */
  onAttributeChanged(name, oldValue, newValue) {
    console.log(`🎯 AppCard: Attribute changed - ${name}: "${oldValue}" → "${newValue}"`);
    
    // Only update DOM if component is initialized and connected
    if (!this._initialized || !this._connected) {
      console.log(`🎯 AppCard: Skipping DOM update - initialized: ${this._initialized}, connected: ${this._connected}`);
      return;
    }
    
    switch (name) {
      case 'name':
        this._updateName(newValue);
        break;
      case 'logo-path':
        this._updateLogo(newValue);
        break;
      case 'app-id':
      case 'file-path':
        // These are used for events, no visual update needed
        console.log(`🎯 AppCard: Updated ${name} to ${newValue}`);
        break;
    }
  }
  
  /**
   * Set app data all at once
   * @param {Object} app - App data object
   */
  setAppData(app) {
    console.log('🎯 AppCard: setAppData called with:', app);
    
    if (!app) {
      console.warn('🎯 AppCard: setAppData called with null/undefined app');
      return;
    }
    
    this._appData = app;
    
    // Set attributes which will trigger attribute change callbacks
    this.setAttribute('app-id', app.id || '');
    this.setAttribute('name', app.name || 'Unnamed App');
    this.setAttribute('file-path', app.filePath || '');
    
    // Set logo if available
    if (app.logo && app.logo.absolutePath) {
      console.log('🎯 AppCard: Setting logo from app.logo.absolutePath:', app.logo.absolutePath);
      this.setAttribute('logo-path', app.logo.absolutePath);
    } else if (app.logoPath) {
      console.log('🎯 AppCard: Setting logo from app.logoPath:', app.logoPath);
      this.setAttribute('logo-path', app.logoPath);
    } else {
      console.log('🎯 AppCard: No logo found, removing logo-path attribute');
      this.removeAttribute('logo-path');
    }
    
    console.log('🎯 AppCard: setAppData completed');
  }
  
  /**
   * Render the component
   * @private
   */
  _render() {
    console.log('🎯 AppCard: _render called');
    
    const styles = `
      :host {
        /* Fixed dimensions for predictable flexbox behavior */
        width: 120px;
        min-height: 110px;
        flex: 0 0 auto;  /* Don't grow, don't shrink */
        
        /* Layout and spacing */
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px 4px;
        margin: 0;  /* Gap handles spacing */
        box-sizing: border-box;
        
        /* Interaction and animation */
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        border-radius: 12px;
        
        /* Performance */
        contain: layout style paint;
        will-change: transform;
      }
      
      :host(:hover) {
        transform: scale(1.08) translateY(-2px);
      }
      
      :host(:hover) .hover-actions {
        opacity: 1;
        visibility: visible;
        transform: scale(1);
      }
      
      :host(:active) {
        transform: scale(1.02) translateY(0px);
        transition: all 0.1s ease;
      }
      
      .app-logo {
        width: 64px;
        height: 64px;
        border-radius: 18px;
        box-shadow: 
          0 2px 8px rgba(0, 0, 0, 0.08),
          0 1px 4px rgba(0, 0, 0, 0.06);
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8px;
        overflow: hidden;
        position: relative;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid rgba(255, 255, 255, 0.8);
      }
      
      :host(:hover) .app-logo {
        box-shadow: 
          0 8px 25px rgba(0, 0, 0, 0.12),
          0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
      }
      
      .app-logo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 18px;
      }
      
      .app-logo-placeholder {
        font-size: 28px;
        color: #6c757d;
        text-align: center;
        opacity: 0.8;
      }
      
      .app-name {
        font-size: 13px;
        text-align: center;
        color: #1a1a1a;
        font-weight: 600;
        line-height: 1.3;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin: 0;
        letter-spacing: -0.01em;
      }
      
      /* Responsive sizing using CSS custom properties */
      :host {
        --icon-size: clamp(56px, 8vw, 72px);
        --icon-radius: clamp(16px, 2.5vw, 20px);
        --font-size: clamp(12px, 1.8vw, 14px);
      }
      
      .app-logo {
        width: var(--icon-size);
        height: var(--icon-size);
        border-radius: var(--icon-radius);
      }
      
      .app-name {
        font-size: var(--font-size);
      }
      
      .hover-actions {
        position: absolute;
        top: 8px;
        right: 8px;
        display: flex;
        gap: 6px;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform: scale(0.8);
        z-index: 10;
      }
      
      .action-button {
        width: 28px;
        height: 28px;
        border-radius: 14px;
        border: none;
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 
          0 2px 8px rgba(0, 0, 0, 0.15),
          0 1px 4px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
      }
      
      .action-button:hover {
        transform: scale(1.1);
        box-shadow: 
          0 4px 12px rgba(0, 0, 0, 0.2),
          0 2px 6px rgba(0, 0, 0, 0.15);
      }
      
      .delete-button:hover {
        background: #ff4757;
        color: white;
      }
      
      .export-button:hover {
        background: #3742fa;
        color: white;
      }
      
      .action-button:active {
        transform: scale(0.95);
        transition: all 0.1s ease;
      }
      
      /* Accessibility improvements */
      :host {
        /* Ensure minimum touch target size */
        min-width: 44px;
        min-height: 44px;
        
        /* Focus indicators */
        outline-offset: 2px;
      }
      
      :host(:focus-visible) {
        outline: 2px solid #007AFF;
        outline-offset: 2px;
      }
    `;
    
    const html = `
      <div class="hover-actions">
        <button class="action-button export-button" id="export-btn" title="Export App">📤</button>
        <button class="action-button delete-button" id="delete-btn" title="Delete App">🗑</button>
      </div>
      
      <div class="app-logo" id="app-logo">
        <div class="app-logo-placeholder">📱</div>
      </div>
      
      <div class="app-name" id="app-name">App Name</div>
    `;
    
    this.render(html, styles);
    console.log('🎯 AppCard: _render completed');
  }
  
  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    console.log('🎯 AppCard: _setupEventListeners called');
    
    // Main click handler for the entire card
    HTMLElement.prototype.addEventListener.call(this, 'click', this._handleClick);
    
    // Delete button handler
    const deleteBtn = this.$('#delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', this._handleDelete);
      console.log('🎯 AppCard: Delete button event listener added');
    } else {
      console.warn('🎯 AppCard: Delete button not found');
    }
    
    // Export button handler
    const exportBtn = this.$('#export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', this._handleExport);
      console.log('🎯 AppCard: Export button event listener added');
    } else {
      console.warn('🎯 AppCard: Export button not found');
    }
    
    // Hover handlers for debugging
    HTMLElement.prototype.addEventListener.call(this, 'mouseenter', this._handleMouseEnter);
    HTMLElement.prototype.addEventListener.call(this, 'mouseleave', this._handleMouseLeave);
    
    console.log('🎯 AppCard: _setupEventListeners completed');
  }
  
  /**
   * Update DOM from current attributes after initialization
   * @private
   */
  _updateFromAttributes() {
    console.log('🎯 AppCard: _updateFromAttributes called');
    
    // Update name if set
    const name = this.getAttribute('name');
    if (name) {
      this._updateName(name);
    }
    
    // Update logo if set
    const logoPath = this.getAttribute('logo-path');
    if (logoPath) {
      this._updateLogo(logoPath);
    }
    
    console.log('🎯 AppCard: _updateFromAttributes completed');
  }
  
  /**
   * Update the app name display
   * @param {string} name - App name
   * @private
   */
  _updateName(name) {
    console.log('🎯 AppCard: _updateName called with:', name);
    
    const nameElement = this.$('#app-name');
    if (nameElement) {
      nameElement.textContent = name || 'Unnamed App';
      console.log('🎯 AppCard: Name updated successfully');
    } else {
      console.warn('🎯 AppCard: Name element not found');
    }
  }
  
  /**
   * Update the logo display
   * @param {string} logoPath - Path to the logo image
   * @private
   */
  _updateLogo(logoPath) {
    console.log('🎯 AppCard: _updateLogo called with:', logoPath);
    
    const logoContainer = this.$('#app-logo');
    if (!logoContainer) {
      console.warn('🎯 AppCard: Logo container not found');
      return;
    }
    
    if (logoPath) {
      console.log('🎯 AppCard: Loading logo image...');
      
      // Check if image exists and load it
      const img = new Image();
      
      img.onload = () => {
        console.log('🎯 AppCard: Logo image loaded successfully');
        logoContainer.innerHTML = `<img src="${logoPath}" alt="App Logo" />`;
        this._logoLoaded = true;
      };
      
      img.onerror = (error) => {
        console.warn('🎯 AppCard: Logo image failed to load:', error);
        console.log('🎯 AppCard: Falling back to placeholder');
        logoContainer.innerHTML = '<div class="app-logo-placeholder">📱</div>';
        this._logoLoaded = false;
      };
      
      img.src = logoPath;
    } else {
      console.log('🎯 AppCard: No logo path provided, showing placeholder');
      logoContainer.innerHTML = '<div class="app-logo-placeholder">📱</div>';
      this._logoLoaded = false;
    }
  }
  
  /**
   * Handle click event - open the app
   * @private
   */
  _handleClick(event) {
    console.log('🎯 AppCard: _handleClick called', event);
    
    // Don't trigger if clicking on action buttons
    if (event.target.closest('.action-button')) {
      console.log('🎯 AppCard: Click on action button, ignoring main click');
      return;
    }
    
    const appData = {
      id: this.getAttribute('app-id'),
      name: this.getAttribute('name'),
      filePath: this.getAttribute('file-path')
    };
    
    console.log('🎯 AppCard: Emitting app-open event with data:', appData);
    
    this.emit('app-open', appData);
  }
  
  /**
   * Handle delete button click
   * @private
   */
  _handleDelete(event) {
    console.log('🎯 AppCard: _handleDelete called', event);
    event.stopPropagation();
    
    const appData = {
      id: this.getAttribute('app-id'),
      name: this.getAttribute('name'),
      filePath: this.getAttribute('file-path')
    };
    
    console.log('🎯 AppCard: Emitting app-delete event with data:', appData);
    
    this.emit('app-delete', appData);
  }
  
  /**
   * Handle export button click
   * @private
   */
  _handleExport(event) {
    console.log('🎯 AppCard: _handleExport called', event);
    event.stopPropagation();
    
    const appData = {
      id: this.getAttribute('app-id'),
      name: this.getAttribute('name'),
      filePath: this.getAttribute('file-path')
    };
    
    console.log('🎯 AppCard: Emitting app-export event with data:', appData);
    
    this.emit('app-export', appData);
  }
  
  /**
   * Handle mouse enter for debugging
   * @private
   */
  _handleMouseEnter(event) {
    this._isHovered = true;
    console.log('🎯 AppCard: Mouse entered, hover actions should be visible');
  }
  
  /**
   * Handle mouse leave for debugging
   * @private
   */
  _handleMouseLeave(event) {
    this._isHovered = false;
    console.log('🎯 AppCard: Mouse left, hover actions should be hidden');
  }
  
  /**
   * Get current app data
   * @returns {Object} Current app data
   */
  getAppData() {
    return this._appData;
  }
  
  /**
   * Check if logo is loaded
   * @returns {boolean} True if logo is loaded
   */
  isLogoLoaded() {
    return this._logoLoaded;
  }
  
  /**
   * Check if component is hovered
   * @returns {boolean} True if hovered
   */
  isHovered() {
    return this._isHovered;
  }
}

// Register the custom element
console.log('🎯 AppCard: Registering custom element "app-card"');
customElements.define('app-card', AppCard);
console.log('🎯 AppCard: Custom element registered successfully');

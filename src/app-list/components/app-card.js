/**
 * App Card Web Component
 * 
 * This component displays information about a single app, including its title,
 * and metadata like creation date and version.
 */
export class AppCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Initialize properties
    this._appId = '';
    this._title = '';
    this._created = null;
    this._version = '';
    this._path = '';
    
    this._initializeDOM();
    this._setupEventListeners();
  }
  
  /**
   * Initialize the DOM structure
   * @private
   */
  _initializeDOM() {
    this.shadowRoot.innerHTML = `
      <style>        
        .card {
          padding: 20px;
          display: flex;
          flex: 1 1 200px;
          flex-direction: column;
          align-items: center;
          box-sizing: border-box;
        }
        
        .content {
          flex: 1;
        }
        
        .app-title {
          margin: 0 0 5px 0;
          font-size: 18px;
          font-weight: 500;
          color: var(--text-color, #333333);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .metadata-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-top: 5px;
        }
        
        .metadata {
          font-size: 14px;
          color: var(--text-secondary, #666666);
        }
        
        .path {
          font-size: 12px;
          color: var(--text-tertiary, #999999);
          word-break: break-all;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-left: auto;
          max-width: 200px;
          text-align: right;
        }
      </style>
      
      <div class="card">
        <div class="content">
          <div class="app-title title"></div>
          <div class="metadata-container">
            <div class="metadata created"></div>
            <div class="metadata version"></div>
          </div>
        </div>
        <div class="path"></div>
      </div>
    `;
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    this.addEventListener('click', this._handleClick.bind(this));
  }
  
  /**
   * Handle click events
   * @private
   */
  _handleClick() {
    this.dispatchEvent(new CustomEvent('app-selected', {
      bubbles: true,
      composed: true,
      detail: { appId: this._appId }
    }));
  }
  
  /**
   * Update the DOM with the current property values
   * @private
   */
  _updateDOM() {
    const titleElement = this.shadowRoot.querySelector('.title');
    const createdElement = this.shadowRoot.querySelector('.created');
    const versionElement = this.shadowRoot.querySelector('.version');
    const pathElement = this.shadowRoot.querySelector('.path');
    
    if (titleElement) {
      titleElement.textContent = this._title || 'Untitled App';
    }
    
    if (createdElement) {
      const created = this._created ? new Date(this._created) : null;
      createdElement.textContent = created 
        ? `Created: ${created.toLocaleDateString()} ${created.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
        : 'Created: Unknown';
    }
    
    if (versionElement) {
      versionElement.textContent = this._version ? `Version: ${this._version}` : 'Version: 1';
    }
    
    if (pathElement) {
      pathElement.textContent = this._path || '';
      pathElement.title = this._path || ''; // Add tooltip with full path
    }
  }
  
  /**
   * Format date in a clean, simple format
   * @private
   */
  _formatDate(date) {
    if (!date) return '';
    
    // Format as M/D/YYYY HH:MM AM/PM (matching the design in the screenshot)
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert hours from 24-hour format to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `Created: ${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
  }
  
  /**
   * Called when the element is connected to the DOM
   */
  connectedCallback() {
    this._updateDOM();
  }
  
  /**
   * Called when the element is disconnected from the DOM
   */
  disconnectedCallback() {
    // Clean up event listeners if needed
  }
  
  /**
   * Define observed attributes
   * @returns {string[]} Array of attribute names to observe
   */
  static get observedAttributes() {
    return ['app-id', 'title'];
  }
  
  /**
   * Called when an observed attribute changes
   * @param {string} name - The name of the attribute
   * @param {string} oldValue - The old value of the attribute
   * @param {string} newValue - The new value of the attribute
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'app-id':
        this._appId = newValue;
        break;
      case 'title':
        this._title = newValue;
        break;
    }
    
    this._updateDOM();
  }
  
  // Getters and setters for properties
  
  /**
   * Get the app ID
   * @returns {string} The app ID
   */
  get appId() {
    return this._appId;
  }
  
  /**
   * Set the app ID
   * @param {string} value - The app ID
   */
  set appId(value) {
    this._appId = value;
    this.setAttribute('app-id', value);
  }
  
  /**
   * Get the title
   * @returns {string} The title
   */
  get title() {
    return this._title;
  }
  
  /**
   * Set the title
   * @param {string} value - The title
   */
  set title(value) {
    this._title = value;
    this.setAttribute('title', value);
  }
  
  /**
   * Get the creation date
   * @returns {Date} The creation date
   */
  get created() {
    return this._created;
  }
  
  /**
   * Set the creation date
   * @param {Date|string} value - The creation date
   */
  set created(value) {
    if (typeof value === 'string') {
      this._created = new Date(value);
    } else {
      this._created = value;
    }
    this._updateDOM();
  }
  
  /**
   * Get the version
   * @returns {string} The version
   */
  get version() {
    return this._version;
  }
  
  /**
   * Set the version
   * @param {string|number} value - The version
   */
  set version(value) {
    this._version = value;
    this._updateDOM();
  }
  
  /**
   * Get the file path
   * @returns {string} The file path
   */
  get path() {
    return this._path;
  }
  
  /**
   * Set the file path
   * @param {string} value - The file path
   */
  set path(value) {
    this._path = value;
    this._updateDOM();
  }
  
  /**
   * Show or hide the path
   * @param {boolean} show - Whether to show the path
   */
  showPath(show = true) {
    const pathElement = this.shadowRoot.querySelector('.path');
    if (pathElement) {
      if (show) {
        pathElement.classList.remove('hidden');
      } else {
        pathElement.classList.add('hidden');
      }
    }
  }
}

// Register the custom element
customElements.define('app-card', AppCard);

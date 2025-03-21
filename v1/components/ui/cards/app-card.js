import { BaseComponent } from '../../core/base-component.js';
import { formatDate } from '../../core/utils.js';

/**
 * AppCard component
 * Displays information about a mini app in a card format
 */
export class AppCard extends BaseComponent {
  constructor() {
    super();
    
    const styles = `
      :host {
        display: block;
        background: white;
        border-radius: var(--border-radius, 8px);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        padding: 15px;
        margin-bottom: 15px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      
      :host(:hover) {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
      }
      
      h3 {
        margin-top: 0;
        color: var(--primary-color, #4285f4);
      }
      
      p {
        margin: 5px 0;
        color: var(--text-color, #5f6368);
      }
      
      .file-path {
        font-size: 0.8em;
        color: #666;
        word-break: break-all;
      }
    `;
    
    const html = `
      <h3 id="app-name"></h3>
      <p id="app-created"></p>
      <p id="app-versions"></p>
      <p class="file-path" id="app-path"></p>
    `;
    
    this.render(html, styles);
    
    // Add click event listener
    this.addEventListener('click', this._handleClick.bind(this));
  }
  
  /**
   * Define observed attributes for reactive updates
   */
  static get observedAttributes() {
    return ['name', 'created', 'versions', 'file-path', 'app-id'];
  }
  
  /**
   * Lifecycle callback when an observed attribute changes
   * @param {string} name - Attribute name
   * @param {string} oldValue - Old attribute value
   * @param {string} newValue - New attribute value
   */
  attributeChangedCallback(name, oldValue, newValue) {
    switch(name) {
      case 'name':
        this.shadowRoot.getElementById('app-name').textContent = newValue;
        break;
      case 'created':
        const formattedDate = formatDate(newValue);
        this.shadowRoot.getElementById('app-created').textContent = `Created: ${formattedDate}`;
        break;
      case 'versions':
        this.shadowRoot.getElementById('app-versions').textContent = `Versions: ${newValue}`;
        break;
      case 'file-path':
        this.shadowRoot.getElementById('app-path').textContent = `Path: ${newValue}`;
        break;
    }
  }
  
  /**
   * Set app data all at once
   * @param {Object} app - App data object
   */
  setAppData(app) {
    this.setAttribute('app-id', app.id);
    this.setAttribute('name', app.name);
    this.setAttribute('created', app.created);
    this.setAttribute('versions', app.versions);
    this.setAttribute('file-path', app.filePath);
  }
  
  /**
   * Handle click event
   * @private
   */
  _handleClick() {
    this.emit('app-selected', {
      id: this.getAttribute('app-id'),
      name: this.getAttribute('name'),
      filePath: this.getAttribute('file-path'),
      created: this.getAttribute('created'),
      versions: this.getAttribute('versions')
    });
  }
}

// Register the custom element
customElements.define('app-card', AppCard);

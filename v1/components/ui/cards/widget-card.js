import { BaseComponent } from '../../core/base-component.js';
import { formatDate } from '../../core/utils.js';

/**
 * WidgetCard component
 * Displays information about a widget in a card format
 */
export class WidgetCard extends BaseComponent {
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
      
      .widget-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
      }
      
      .open-dashboard-button {
        background-color: var(--primary-color, #4285f4);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
        font-size: 0.9em;
      }
      
      .open-dashboard-button:hover {
        background-color: #3367d6;
      }
      
      .widget-info {
        cursor: pointer;
      }
    `;
    
    const html = `
      <div class="widget-info">
        <h3 id="widget-name"></h3>
        <p id="widget-created"></p>
        <p id="widget-versions"></p>
        <p class="file-path" id="widget-path"></p>
      </div>
      <div class="widget-actions">
        <button class="open-dashboard-button">Open in Dashboard</button>
      </div>
    `;
    
    this.render(html, styles);
    
    // Add click event listeners
    this.shadowRoot.querySelector('.widget-info').addEventListener('click', this._handleClick.bind(this));
    this.shadowRoot.querySelector('.open-dashboard-button').addEventListener('click', this._handleOpenInDashboard.bind(this));
  }
  
  /**
   * Define observed attributes for reactive updates
   */
  static get observedAttributes() {
    return ['name', 'created', 'versions', 'file-path', 'widget-id'];
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
        this.shadowRoot.getElementById('widget-name').textContent = newValue;
        break;
      case 'created':
        const formattedDate = formatDate(newValue);
        this.shadowRoot.getElementById('widget-created').textContent = `Created: ${formattedDate}`;
        break;
      case 'versions':
        this.shadowRoot.getElementById('widget-versions').textContent = `Versions: ${newValue}`;
        break;
      case 'file-path':
        this.shadowRoot.getElementById('widget-path').textContent = `Path: ${newValue}`;
        break;
    }
  }
  
  /**
   * Set widget data all at once
   * @param {Object} widget - Widget data object
   */
  setWidgetData(widget) {
    this.setAttribute('widget-id', widget.id);
    this.setAttribute('name', widget.name);
    this.setAttribute('created', widget.created);
    this.setAttribute('versions', widget.versions);
    this.setAttribute('file-path', widget.filePath);
  }
  
  /**
   * Handle click event for widget info
   * @private
   */
  _handleClick() {
    this.emit('widget-selected', {
      id: this.getAttribute('widget-id'),
      name: this.getAttribute('name'),
      filePath: this.getAttribute('file-path'),
      created: this.getAttribute('created'),
      versions: this.getAttribute('versions')
    });
  }
  
  /**
   * Handle click event for open in dashboard button
   * @private
   */
  _handleOpenInDashboard(event) {
    // Stop event propagation to prevent the widget-selected event from firing
    event.stopPropagation();
    
    this.emit('widget-open-in-dashboard', {
      id: this.getAttribute('widget-id'),
      name: this.getAttribute('name'),
      filePath: this.getAttribute('file-path'),
      created: this.getAttribute('created'),
      versions: this.getAttribute('versions')
    });
  }
}

// Register the custom element
customElements.define('widget-card', WidgetCard);

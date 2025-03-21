import { BaseComponent } from '../../core/base-component.js';
import '../cards/widget-card.js';

/**
 * WidgetList component
 * Displays a list of widget cards and handles the "no widgets" message
 */
export class WidgetList extends BaseComponent {
  constructor() {
    super();
    
    const styles = `
      :host {
        display: block;
        margin: 20px 0;
      }
      
      .no-widgets-message {
        background: #f8f9fa;
        border-radius: var(--border-radius, 8px);
        padding: 20px;
        text-align: center;
        color: #5f6368;
      }
      
      .no-widgets-message.hidden {
        display: none;
      }
      
      .widget-list-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
    `;
    
    const html = `
      <div class="no-widgets-message">
        <p>You don't have any widgets yet.</p>
        <p>Click the "Create Widget" button to get started!</p>
      </div>
      <div class="widget-list-container"></div>
    `;
    
    this.render(html, styles);
    
    // Store references to DOM elements
    this._noWidgetsMessage = this.shadowRoot.querySelector('.no-widgets-message');
    this._widgetListContainer = this.shadowRoot.querySelector('.widget-list-container');
  }
  
  /**
   * Set the list of widgets to display
   * @param {Array} widgets - Array of widget objects
   */
  setWidgets(widgets) {
    // Clear the widget list
    this._widgetListContainer.innerHTML = '';
    
    if (widgets && widgets.length > 0) {
      // Hide the "no widgets" message
      this._noWidgetsMessage.classList.add('hidden');
      
      // Create widget cards
      widgets.forEach(widget => {
        const widgetCard = document.createElement('widget-card');
        widgetCard.setWidgetData(widget);
        
        // Add event listener for widget-open-in-dashboard event
        widgetCard.addEventListener('widget-open-in-dashboard', this._handleWidgetOpenInDashboard.bind(this));
        
        this._widgetListContainer.appendChild(widgetCard);
      });
    } else {
      // Show the "no widgets" message
      this._noWidgetsMessage.classList.remove('hidden');
    }
  }
  
  /**
   * Handle widget-open-in-dashboard event
   * @param {CustomEvent} event - Event object
   * @private
   */
  _handleWidgetOpenInDashboard(event) {
    // Forward the event to parent components
    this.emit('widget-open-in-dashboard', event.detail);
  }
}

// Register the custom element
customElements.define('widget-list', WidgetList);

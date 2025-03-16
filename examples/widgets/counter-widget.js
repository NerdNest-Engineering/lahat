/**
 * Counter Widget Example
 * A simple widget that demonstrates the basic functionality of the widget component.
 */

import { WidgetComponent } from '../../components/core/widget-component.js';

/**
 * Counter Widget
 * A simple counter widget that demonstrates the basic functionality of the widget component.
 * @extends WidgetComponent
 */
export class CounterWidget extends WidgetComponent {
  /**
   * Create a new CounterWidget instance
   */
  constructor() {
    super();
    
    // Initialize state
    this._count = 0;
    
    // Render initial UI
    this.render();
  }
  
  /**
   * Called when the data store is ready
   * Load initial data from the data store
   */
  async onDataStoreReady() {
    // Load count from data store
    const savedCount = await this.loadData('count');
    if (savedCount !== null) {
      this._count = savedCount;
      this.updateCountDisplay();
    }
  }
  
  /**
   * Render the widget UI
   */
  render() {
    const html = `
      <div class="counter-widget">
        <h2 class="widget-title">Counter Widget</h2>
        <div class="counter-display">${this._count}</div>
        <div class="counter-controls">
          <button class="decrement-button">-</button>
          <button class="increment-button">+</button>
        </div>
        <div class="counter-actions">
          <button class="reset-button">Reset</button>
          <button class="publish-button">Publish Count</button>
        </div>
      </div>
    `;
    
    const styles = `
      :host {
        display: block;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }
      
      .counter-widget {
        padding: 16px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        text-align: center;
      }
      
      .widget-title {
        margin-top: 0;
        margin-bottom: 16px;
        font-size: 18px;
        color: #333;
      }
      
      .counter-display {
        font-size: 48px;
        font-weight: bold;
        margin: 16px 0;
        color: #4285f4;
      }
      
      .counter-controls {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-bottom: 16px;
      }
      
      .counter-actions {
        display: flex;
        justify-content: center;
        gap: 8px;
      }
      
      button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .increment-button, .decrement-button {
        width: 48px;
        height: 48px;
        font-size: 24px;
        font-weight: bold;
      }
      
      .increment-button {
        background-color: #4caf50;
        color: white;
      }
      
      .increment-button:hover {
        background-color: #45a049;
      }
      
      .decrement-button {
        background-color: #f44336;
        color: white;
      }
      
      .decrement-button:hover {
        background-color: #d32f2f;
      }
      
      .reset-button {
        background-color: #9e9e9e;
        color: white;
      }
      
      .reset-button:hover {
        background-color: #757575;
      }
      
      .publish-button {
        background-color: #2196f3;
        color: white;
      }
      
      .publish-button:hover {
        background-color: #1976d2;
      }
    `;
    
    // Update shadow DOM
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${html}
    `;
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for the widget
   */
  setupEventListeners() {
    // Increment button
    const incrementButton = this.$('.increment-button');
    if (incrementButton) {
      this.addEventListener(incrementButton, 'click', this.handleIncrement.bind(this));
    }
    
    // Decrement button
    const decrementButton = this.$('.decrement-button');
    if (decrementButton) {
      this.addEventListener(decrementButton, 'click', this.handleDecrement.bind(this));
    }
    
    // Reset button
    const resetButton = this.$('.reset-button');
    if (resetButton) {
      this.addEventListener(resetButton, 'click', this.handleReset.bind(this));
    }
    
    // Publish button
    const publishButton = this.$('.publish-button');
    if (publishButton) {
      this.addEventListener(publishButton, 'click', this.handlePublish.bind(this));
    }
  }
  
  /**
   * Handle increment button click
   */
  handleIncrement() {
    this._count++;
    this.updateCountDisplay();
    this.saveCount();
    
    // Publish event
    this.publishEvent('count-changed', { count: this._count, action: 'increment' });
  }
  
  /**
   * Handle decrement button click
   */
  handleDecrement() {
    this._count--;
    this.updateCountDisplay();
    this.saveCount();
    
    // Publish event
    this.publishEvent('count-changed', { count: this._count, action: 'decrement' });
  }
  
  /**
   * Handle reset button click
   */
  handleReset() {
    this._count = 0;
    this.updateCountDisplay();
    this.saveCount();
    
    // Publish event
    this.publishEvent('count-changed', { count: this._count, action: 'reset' });
  }
  
  /**
   * Handle publish button click
   */
  handlePublish() {
    // Publish event
    this.publishEvent('count-published', { count: this._count, timestamp: new Date().toISOString() });
  }
  
  /**
   * Update the count display
   */
  updateCountDisplay() {
    const display = this.$('.counter-display');
    if (display) {
      display.textContent = this._count;
    }
  }
  
  /**
   * Save the count to the data store
   */
  async saveCount() {
    await this.saveData('count', this._count);
  }
  
  /**
   * Handle resize events
   * @param {number} width - New width
   * @param {number} height - New height
   */
  onResize(width, height) {
    // Adjust UI based on new dimensions if needed
    const widget = this.$('.counter-widget');
    if (widget) {
      // Example: Adjust font size based on width
      const display = this.$('.counter-display');
      if (display) {
        if (width < 200) {
          display.style.fontSize = '32px';
        } else {
          display.style.fontSize = '48px';
        }
      }
    }
  }
}

// Register the component
customElements.define('counter-widget', CounterWidget);

/**
 * Does Nothing Widget Example
 * A simple widget that demonstrates a widget that doesn't do anything.
 */

import { WidgetComponent } from '../../components/core/widget-component.js';

/**
 * Does Nothing Widget
 * A widget that literally does nothing when interacted with.
 * @extends WidgetComponent
 */
export class DoesNothingWidget extends WidgetComponent {
  /**
   * Create a new DoesNothingWidget instance
   */
  constructor() {
    super();
    
    // Render initial UI
    this.render();
  }
  
  /**
   * Render the widget UI
   */
  render() {
    const html = `
      <div class="does-nothing-widget">
        <h2 class="widget-title">Does Nothing Widget</h2>
        <div class="widget-description">
          <p>This widget intentionally does nothing.</p>
          <p>No matter what you do, it won't respond.</p>
        </div>
        <div class="widget-controls">
          <button class="useless-button">Click Me (Nothing Will Happen)</button>
          <input type="text" class="useless-input" placeholder="Type here (Nothing will happen)">
        </div>
        <div class="widget-status">
          <p>Status: Still doing nothing...</p>
        </div>
      </div>
    `;
    
    const styles = `
      :host {
        display: block;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }
      
      .does-nothing-widget {
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
      
      .widget-description {
        margin-bottom: 16px;
        color: #666;
      }
      
      .widget-controls {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .useless-button {
        padding: 8px 16px;
        background-color: #9e9e9e;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
      }
      
      .useless-input {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .widget-status {
        font-style: italic;
        color: #999;
        font-size: 14px;
      }
    `;
    
    // Update shadow DOM
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${html}
    `;
    
    // Note: We intentionally don't set up any event listeners
    // because this widget is supposed to do nothing
  }
  
  /**
   * Handle resize events
   * @param {number} width - New width
   * @param {number} height - New height
   */
  onResize(width, height) {
    // Do nothing (intentionally)
  }
}

// Register the component
customElements.define('does-nothing-widget', DoesNothingWidget);

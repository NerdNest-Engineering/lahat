/**
 * Example WebComponent
 * A simple counter component that demonstrates the new WebComponent architecture.
 * This component is completely independent and unaware of Lahat.
 */

/**
 * CounterComponent - A simple counter web component
 * @extends HTMLElement
 */
export class CounterComponent extends HTMLElement {
  /**
   * Create a new CounterComponent instance
   */
  constructor() {
    super();
    
    // Create shadow DOM
    this.attachShadow({ mode: 'open' });
    
    // Initialize state
    this._count = 0;
    this._title = 'Counter';
    this._theme = 'light';
    
    // Render the component
    this.render();
  }
  
  /**
   * Define which attributes to observe
   */
  static get observedAttributes() {
    return ['title', 'theme', 'initial-count'];
  }
  
  /**
   * Handle attribute changes
   * @param {string} name - Attribute name
   * @param {string} oldValue - Old attribute value
   * @param {string} newValue - New attribute value
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'title':
        this._title = newValue || 'Counter';
        break;
      case 'theme':
        this._theme = newValue || 'light';
        break;
      case 'initial-count':
        const count = parseInt(newValue, 10);
        if (!isNaN(count)) {
          this._count = count;
        }
        break;
    }
    
    // Update the UI to reflect the new attribute values
    this.render();
  }
  
  /**
   * Called when the element is added to the DOM
   */
  connectedCallback() {
    // Add event listeners
    this.addEventListeners();
    
    // Load data if storage API is available
    this.loadData();
    
    // Emit connected event
    this.dispatchEvent(new CustomEvent('component-connected', {
      bubbles: true,
      composed: true,
      detail: { id: this.id }
    }));
  }
  
  /**
   * Called when the element is removed from the DOM
   */
  disconnectedCallback() {
    // Remove event listeners
    this.removeEventListeners();
    
    // Save data if storage API is available
    this.saveData();
    
    // Emit disconnected event
    this.dispatchEvent(new CustomEvent('component-disconnected', {
      bubbles: true,
      composed: true,
      detail: { id: this.id }
    }));
  }
  
  /**
   * Add event listeners to the component
   * @private
   */
  addEventListeners() {
    // Get button elements
    const incrementButton = this.shadowRoot.querySelector('.increment');
    const decrementButton = this.shadowRoot.querySelector('.decrement');
    const resetButton = this.shadowRoot.querySelector('.reset');
    
    // Add event listeners
    if (incrementButton) {
      incrementButton.addEventListener('click', this.handleIncrement.bind(this));
    }
    
    if (decrementButton) {
      decrementButton.addEventListener('click', this.handleDecrement.bind(this));
    }
    
    if (resetButton) {
      resetButton.addEventListener('click', this.handleReset.bind(this));
    }
    
    // Listen for data store ready event
    this.addEventListener('data-store-ready', this.handleDataStoreReady.bind(this));
    
    // Listen for resize event
    this.addEventListener('resize', this.handleResize.bind(this));
  }
  
  /**
   * Remove event listeners from the component
   * @private
   */
  removeEventListeners() {
    // Get button elements
    const incrementButton = this.shadowRoot.querySelector('.increment');
    const decrementButton = this.shadowRoot.querySelector('.decrement');
    const resetButton = this.shadowRoot.querySelector('.reset');
    
    // Remove event listeners
    if (incrementButton) {
      incrementButton.removeEventListener('click', this.handleIncrement.bind(this));
    }
    
    if (decrementButton) {
      decrementButton.removeEventListener('click', this.handleDecrement.bind(this));
    }
    
    if (resetButton) {
      resetButton.removeEventListener('click', this.handleReset.bind(this));
    }
    
    // Remove data store ready event listener
    this.removeEventListener('data-store-ready', this.handleDataStoreReady.bind(this));
    
    // Remove resize event listener
    this.removeEventListener('resize', this.handleResize.bind(this));
  }
  
  /**
   * Handle increment button click
   * @private
   */
  handleIncrement() {
    this._count++;
    this.updateUI();
    this.saveData();
    
    // Emit count changed event
    this.dispatchEvent(new CustomEvent('count-changed', {
      bubbles: true,
      composed: true,
      detail: { count: this._count }
    }));
  }
  
  /**
   * Handle decrement button click
   * @private
   */
  handleDecrement() {
    this._count--;
    this.updateUI();
    this.saveData();
    
    // Emit count changed event
    this.dispatchEvent(new CustomEvent('count-changed', {
      bubbles: true,
      composed: true,
      detail: { count: this._count }
    }));
  }
  
  /**
   * Handle reset button click
   * @private
   */
  handleReset() {
    this._count = 0;
    this.updateUI();
    this.saveData();
    
    // Emit count reset event
    this.dispatchEvent(new CustomEvent('count-reset', {
      bubbles: true,
      composed: true,
      detail: { count: this._count }
    }));
  }
  
  /**
   * Handle data store ready event
   * @param {CustomEvent} event - Data store ready event
   * @private
   */
  handleDataStoreReady(event) {
    // Load data from the data store
    this.loadData();
  }
  
  /**
   * Handle resize event
   * @param {CustomEvent} event - Resize event
   * @private
   */
  handleResize(event) {
    // Handle resize if needed
    console.log('Component resized:', event.detail);
  }
  
  /**
   * Load data from storage
   * @private
   */
  async loadData() {
    // Check if the getStoredData method is available (provided by LahatCell)
    if (typeof this.getStoredData === 'function') {
      try {
        const savedCount = await this.getStoredData('count');
        if (savedCount !== null && savedCount !== undefined) {
          this._count = savedCount;
          this.updateUI();
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
  }
  
  /**
   * Save data to storage
   * @private
   */
  async saveData() {
    // Check if the storeData method is available (provided by LahatCell)
    if (typeof this.storeData === 'function') {
      try {
        await this.storeData('count', this._count);
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }
  }
  
  /**
   * Update the UI to reflect the current state
   * @private
   */
  updateUI() {
    const countElement = this.shadowRoot.querySelector('.count');
    if (countElement) {
      countElement.textContent = this._count;
    }
  }
  
  /**
   * Render the component
   * @private
   */
  render() {
    // Define the HTML template
    const html = `
      <div class="counter-component ${this._theme}">
        <h2 class="title">${this._title}</h2>
        <div class="count-container">
          <span class="count">${this._count}</span>
        </div>
        <div class="controls">
          <button class="decrement">-</button>
          <button class="reset">Reset</button>
          <button class="increment">+</button>
        </div>
      </div>
    `;
    
    // Define the CSS styles
    const styles = `
      :host {
        display: block;
        font-family: Arial, sans-serif;
      }
      
      .counter-component {
        padding: 16px;
        border-radius: 8px;
        text-align: center;
        transition: all 0.3s ease;
      }
      
      .counter-component.light {
        background-color: #f5f5f5;
        color: #333;
      }
      
      .counter-component.dark {
        background-color: #333;
        color: #f5f5f5;
      }
      
      .title {
        margin-top: 0;
        margin-bottom: 16px;
        font-size: 1.5em;
      }
      
      .count-container {
        margin: 16px 0;
      }
      
      .count {
        font-size: 3em;
        font-weight: bold;
      }
      
      .controls {
        display: flex;
        justify-content: center;
        gap: 8px;
      }
      
      button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        font-size: 1.2em;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .light button {
        background-color: #e0e0e0;
        color: #333;
      }
      
      .light button:hover {
        background-color: #d0d0d0;
      }
      
      .dark button {
        background-color: #555;
        color: #f5f5f5;
      }
      
      .dark button:hover {
        background-color: #666;
      }
      
      .increment, .decrement {
        width: 40px;
        font-weight: bold;
      }
      
      .reset {
        min-width: 80px;
      }
      
      /* Responsive styles */
      @media (max-width: 300px) {
        .controls {
          flex-direction: column;
        }
        
        button {
          width: 100%;
        }
      }
    `;
    
    // Set the shadow DOM content
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${html}
    `;
  }
}

// Register the component
customElements.define('counter-component', CounterComponent);

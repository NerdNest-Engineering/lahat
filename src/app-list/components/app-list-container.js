/**
 * App List Container Web Component
 * 
 * This is the main container for the app list. It provides slots for navigation
 * controls and app cards, and handles layout and organization.
 */
export class AppListContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this._initializeDOM();
  }
  
  /**
   * Initialize the DOM structure
   * @private
   */
  _initializeDOM() {
    this.shadowRoot.innerHTML = `
      <style>        
        .container {
          width: 100%;
        }
        
        .apps-container {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 20px;
          width: 100%;
          box-sizing: border-box;
          padding: 0;
          margin: 0;
        }
      </style>
      
      <div class="container">
        <div class="apps-container">
          <slot></slot>
        </div>
      </div>
    `;
  }
  
  /**
   * Called when the element is connected to the DOM
   */
  connectedCallback() {
    console.log('AppListContainer connected to DOM');
  }
  
  /**
   * Called when the element is disconnected from the DOM
   */
  disconnectedCallback() {
    console.log('AppListContainer disconnected from DOM');
  }
}

// Register the custom element
customElements.define('app-list-container', AppListContainer);

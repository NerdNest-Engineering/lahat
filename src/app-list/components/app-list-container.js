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
        :host {
          display: block;
          width: 100%;
        }
        
        .container {
          width: 100%;
        }
        
        .nav-container {
          display: none; /* We don't need this anymore */
        }
        
        .apps-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          grid-auto-flow: row;
          gap: 15px;
          box-sizing: border-box;
          max-width: 100%;
          padding: 0;
        }
        
        /* App cards styling */
        ::slotted(app-card) {
          border-radius: var(--border-radius, 8px);
          background-color: var(--light-gray, #f8f9fa);
          transition: transform 0.2s, box-shadow 0.2s;
          height: 100%;
          box-shadow: var(--shadow-light);
        }
        
        ::slotted(app-card:hover) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: var(--dark-gray, #5f6368);
          font-size: 16px;
          grid-column: 1 / -1;
        }
        
        .empty-state p {
          margin-bottom: 24px;
        }
        
        @media (max-width: 768px) {
          .apps-container {
            padding: 15px;
            gap: 12px;
          }
        }
        
        @media (max-width: 480px) {
          .apps-container {
            padding: 10px;
            gap: 10px;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          }
        }
      </style>
      
      <div class="container">
        <div class="nav-container">
          <slot name="navigation"></slot>
        </div>
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

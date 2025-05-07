/**
 * Step Container Component
 * Reusable container component for app creation steps
 * Provides consistent visual structure using slots for header, content, and navigation
 */
export class StepContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Create the template
    this.shadowRoot.innerHTML = `
      <style>
        .container {
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: var(--border-radius, 8px);
          overflow: hidden;
          box-shadow: var(--shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
          display: flex;
          flex-direction: column;
        }
        
        .header-slot-container {
          /* Ensure header gets proper display */
          display: flex;
          width: 100%;
          flex: 0 0 auto;
        }

        /* Make sure slot takes full width */
        ::slotted(*[slot="header"]) {
          width: 100%;
        }
        
        .content-slot-container {
          padding: 20px;
          display: flex;
          flex-direction: column;
          width: 100%;
          flex: 1 1 auto;
        }
        
        .navigation-slot-container {
          padding: 0 20px 20px 20px;
          display: flex;
          width: 100%;
          flex: 0 0 auto;
        }
        
        /* Make sure slotted elements take full width in their containers */
        ::slotted(*[slot="content"]),
        ::slotted(*[slot="navigation"]) {
          width: 100%;
        }
      </style>
      
      <div class="container">
        <div class="header-slot-container">
          <slot name="header"></slot>
        </div>
        <div class="content-slot-container">
          <slot name="content"></slot>
        </div>
        <div class="navigation-slot-container">
          <slot name="navigation"></slot>
        </div>
      </div>
    `;
  }
}

// Define the custom element
customElements.define('step-container', StepContainer);
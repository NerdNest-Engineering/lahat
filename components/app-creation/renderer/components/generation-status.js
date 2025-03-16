/**
 * Generation Status Component
 * Displays the status of the generation process
 */

/**
 * GenerationStatus component
 * Shows a loading spinner with status text during generation
 */
export class GenerationStatus extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none !important;
        }
        :host(.visible) {
          display: flex !important;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          margin-bottom: 10px;
          padding: 10px 0;
        }
        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(66, 133, 244, 0.3);
          border-radius: 50%;
          border-top-color: #4285f4;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      </style>
      <div class="spinner"></div>
      <span id="status-text">Generating...</span>
    `;
  }
  
  // Getters
  get statusText() {
    return this.shadowRoot.querySelector('#status-text');
  }
  
  // Public methods
  show(text) {
    this.statusText.textContent = text || 'Generating...';
    this.classList.add('visible');
  }
  
  hide() {
    this.classList.remove('visible');
  }
  
  setStatusText(text) {
    this.statusText.textContent = text;
  }
}

// Note: Component is registered in renderers/app-creation.js

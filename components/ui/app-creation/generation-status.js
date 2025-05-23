// GenerationStatus Component
class GenerationStatus extends HTMLElement {
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
        .status-text {
          font-size: 14px;
          color: #5f6368;
        }
      </style>
      <div class="spinner"></div>
      <div class="status-text" id="status-text">Generating...</div>
    `;
  }
  
  // Public methods
  show(message = 'Generating...') {
    this.classList.add('visible');
    this.shadowRoot.querySelector('#status-text').textContent = message;
  }
  
  hide() {
    this.classList.remove('visible');
  }
  
  updateMessage(message) {
    this.shadowRoot.querySelector('#status-text').textContent = message;
  }
}

// Register the component
customElements.define('generation-status', GenerationStatus);

export { GenerationStatus };

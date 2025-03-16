/**
 * Generation Preview Component
 * Displays the preview of the generation process
 */

/**
 * GenerationPreview component
 * Shows a preview of the generated content
 */
export class GenerationPreview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none !important;
          margin-top: 20px;
        }
        :host(.visible) {
          display: block !important;
        }
        h3 {
          margin-top: 0;
          color: #5f6368;
          font-size: 16px;
        }
        pre {
          margin: 0;
          white-space: pre-wrap;
          font-family: monospace;
          font-size: 14px;
          overflow-y: auto;
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: var(--border-radius, 8px);
          padding: 15px;
          max-height: 300px;
        }
      </style>
      <h3>Generation Preview</h3>
      <pre id="output"></pre>
    `;
    
    // Initialize state
    this._chunks = '';
  }
  
  // Getters
  get output() {
    return this.shadowRoot.querySelector('#output');
  }
  
  // Public methods
  show() {
    this.classList.add('visible');
  }
  
  hide() {
    this.classList.remove('visible');
  }
  
  reset() {
    this._chunks = '';
    this.output.textContent = '';
  }
  
  addChunk(content) {
    this._chunks += content;
    this.output.textContent = this._chunks;
    
    // Auto-scroll to bottom
    this.output.scrollTop = this.output.scrollHeight;
  }
  
  handleGenerationProgress(content) {
    this.addChunk(content);
  }
  
  handleGenerationComplete() {
    // Reset chunks when generation is complete
    this._chunks = '';
  }
}

// Note: Component is registered in renderers/app-creation.js

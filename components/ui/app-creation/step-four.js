// AppCreationStepFour Component - Live Code Generation
class AppCreationStepFour extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary-color: #4285f4;
          --primary-hover: #3367d6;
          --success-color: #34a853;
          --success-hover: #2d7d32;
          --error-color: #ea4335;
          --border-color: #e0e0e0;
          --text-primary: #333;
          --text-secondary: #5f6368;
          --text-muted: #999;
          --text-code: #d4d4d4;
          --text-code-muted: #888;
          --background-light: #f8f9fa;
          --background-code: #1e1e1e;
          --background-scrollbar: #2d2d2d;
          --background-scrollbar-thumb: #555;
          --background-scrollbar-thumb-hover: #777;
          --border-radius: 8px;
          --spacing-xs: 5px;
          --spacing-sm: 10px;
          --spacing-md: 12px;
          --spacing-lg: 15px;
          --spacing-xl: 20px;
          --spacing-xxl: 24px;
          --spacing-xxxl: 30px;
          
          display: none;
          padding: var(--spacing-xl) 0;
        }
        
        :host(.active) {
          display: block;
        }
        
        .step-header {
          display: flex;
          align-items: center;
          margin-bottom: var(--spacing-xxxl);
          gap: var(--spacing-md);
        }
        
        .step-number {
          background: var(--primary-color);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
        }
        
        .step-title {
          font-size: var(--spacing-xxl);
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }
        
        .app-summary {
          background: var(--background-light);
          padding: var(--spacing-lg);
          border-radius: var(--border-radius);
          margin-bottom: var(--spacing-xl);
        }
        
        .app-title {
          font-size: 18px;
          font-weight: bold;
          color: var(--primary-color);
          margin-bottom: var(--spacing-xs);
        }
        
        .app-description {
          color: var(--text-secondary);
          font-size: 14px;
        }
        
        .generation-section {
          background: white;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          margin-bottom: var(--spacing-xl);
          overflow: hidden;
        }
        
        .generation-header {
          background: var(--background-light);
          padding: var(--spacing-lg) var(--spacing-xl);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        
        .generation-status {
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .generation-status.generating {
          color: var(--primary-color);
        }
        
        .generation-status.complete {
          color: var(--success-color);
        }
        
        .generation-status.error {
          color: var(--error-color);
        }
        
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 3px solid rgba(66, 133, 244, 0.3);
          border-radius: 50%;
          border-top-color: var(--primary-color);
          animation: spin 1s linear infinite;
        }
        
        .spinner.hidden {
          display: none;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        .code-viewer {
          height: 400px;
          overflow-y: auto;
          background: var(--background-code);
          color: var(--text-code);
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
          line-height: 1.5;
          padding: var(--spacing-xl);
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        
        .code-viewer::-webkit-scrollbar {
          width: 8px;
        }
        
        .code-viewer::-webkit-scrollbar-track {
          background: var(--background-scrollbar);
        }
        
        .code-viewer::-webkit-scrollbar-thumb {
          background: var(--background-scrollbar-thumb);
          border-radius: 4px;
        }
        
        .code-viewer::-webkit-scrollbar-thumb:hover {
          background: var(--background-scrollbar-thumb-hover);
        }
        
        .code-placeholder {
          color: var(--text-code-muted);
          font-style: italic;
          text-align: center;
          padding: 50px var(--spacing-xl);
        }
        
        .generation-stats {
          padding: var(--spacing-lg) var(--spacing-xl);
          background: var(--background-light);
          border-top: 1px solid var(--border-color);
          font-size: 14px;
          color: var(--text-secondary);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .stats-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }
        
        .button-container {
          display: flex;
          justify-content: center;
          margin-top: var(--spacing-xl);
        }
        
        .button-container.hidden {
          display: none;
        }
        
        button {
          background: var(--primary-color);
          color: white;
          padding: var(--spacing-md) var(--spacing-xxl);
          border: none;
          border-radius: var(--border-radius);
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        button:hover {
          background: var(--primary-hover);
        }
        
        button:disabled {
          background: var(--border-color);
          color: var(--text-muted);
          cursor: not-allowed;
        }
        
        button.secondary {
          background: var(--background-light);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }
        
        button.secondary:hover {
          background: #e8eaed;
        }
        
        .complete-button {
          background: var(--success-color);
        }
        
        .complete-button:hover {
          background: var(--success-hover);
        }
      </style>
      <div>
        <div class="step-header">
          <div class="step-number">4</div>
          <h1 class="step-title">Generate Your App</h1>
        </div>
        
        <div class="app-summary">
          <div class="app-title" id="app-title"></div>
          <div class="app-description" id="app-description"></div>
        </div>
        
        <div class="generation-section">
          <div class="generation-header">
            <div class="spinner hidden" id="spinner"></div>
            <div class="generation-status" id="generation-status">Starting generation...</div>
          </div>
          
          <div class="code-viewer" id="code-viewer">
            <div class="code-placeholder">Your app code will appear here as it's being generated...</div>
          </div>
          
          <div class="generation-stats" id="generation-stats" style="display: none;">
            <div class="stats-item">
              <span>📝</span>
              <span id="char-count">0 characters</span>
            </div>
            <div class="stats-item">
              <span>⏱️</span>
              <span id="generation-time">0s</span>
            </div>
            <div class="stats-item">
              <span>🚀</span>
              <span id="generation-speed">0 chars/s</span>
            </div>
          </div>
        </div>
        
        <div class="button-container hidden">
          <button id="generate-button" style="display: none;">Retry</button>
        </div>
      </div>
    `;
    
    // Set up event listeners - only for generate button, no back button
    this.shadowRoot.querySelector('#generate-button').addEventListener('click', this.handleGenerate.bind(this));
    
    // Initialize state
    this._appTitle = '';
    this._appDescription = '';
    this._logoGenerated = false;
    this._logoPath = null;
    this._generatedCode = '';
    this._isGenerating = false;
    this._generationStartTime = null;
    this._characterCount = 0;
    this._autoStarted = false;
    this._appId = null;
    
    // Set up IPC listeners for streaming
    this.setupStreamingListeners();
  }
  
  // Getters
  get appTitle() {
    return this.shadowRoot.querySelector('#app-title');
  }
  
  get appDescription() {
    return this.shadowRoot.querySelector('#app-description');
  }
  
  get codeViewer() {
    return this.shadowRoot.querySelector('#code-viewer');
  }
  
  get generationStatus() {
    return this.shadowRoot.querySelector('#generation-status');
  }
  
  get spinner() {
    return this.shadowRoot.querySelector('#spinner');
  }
  
  get generateButton() {
    return this.shadowRoot.querySelector('#generate-button');
  }
  
  get generationStats() {
    return this.shadowRoot.querySelector('#generation-stats');
  }
  
  // Setup streaming listeners
  setupStreamingListeners() {
    if (window.electronAPI) {
      // Listen for generation chunks
      window.electronAPI.onGenerationChunk((chunk) => {
        this.handleGenerationChunk(chunk);
      });
      
      // Listen for generation status updates
      window.electronAPI.onGenerationStatus((status) => {
        this.handleGenerationStatus(status);
      });
    }
  }
  
  // Event handlers
  async handleGenerate() {
    if (this._isGenerating) return;
    
    this.startGeneration();
    
    // Dispatch event to notify parent to start app generation
    this.dispatchEvent(new CustomEvent('generate-app', {
      bubbles: true,
      composed: true,
      detail: { 
        title: this._appTitle,
        description: this._appDescription,
        logoGenerated: this._logoGenerated,
        logoPath: this._logoPath
      }
    }));
  }
  
  handleGenerationChunk(chunk) {
    if (chunk.done) {
      this.completeGeneration();
      return;
    }
    
    if (chunk.content) {
      // Append the new content to the code viewer
      this._generatedCode += chunk.content;
      this._characterCount += chunk.content.length;
      
      // Update the code viewer
      this.updateCodeViewer();
      
      // Update stats
      this.updateGenerationStats();
      
      // Auto-scroll to bottom
      this.codeViewer.scrollTop = this.codeViewer.scrollHeight;
    }
  }
  
  handleGenerationStatus(status) {
    if (status.status === 'generating') {
      this.setGeneratingState(status.message);
    } else if (status.status === 'complete') {
      this.completeGeneration();
    } else if (status.status === 'error') {
      this.setErrorState(status.message);
    }
  }
  
  // Public methods
  setActive(active) {
    if (active) {
      this.classList.add('active');
      // Auto-start generation when step becomes active
      if (!this._autoStarted && !this._isGenerating) {
        this._autoStarted = true;
        // Small delay to ensure UI is ready
        setTimeout(() => {
          this.handleGenerate();
        }, 100);
      }
    } else {
      this.classList.remove('active');
    }
  }
  
  setAppInfo(title, description, logoGenerated = false, logoPath = null, appId = null) {
    this._appTitle = title;
    this._appDescription = description;
    this._logoGenerated = logoGenerated;
    this._logoPath = logoPath;
    this._appId = appId;
    
    this.appTitle.textContent = title;
    this.appDescription.textContent = description;
  }
  
  startGeneration() {
    this._isGenerating = true;
    this._generationStartTime = Date.now();
    this._generatedCode = '';
    this._characterCount = 0;
    
    // Update UI
    this.setGeneratingState('Starting generation...');
    this.generateButton.disabled = true;
    this.generateButton.textContent = 'Generating...';
    
    // Clear code viewer and show empty state
    this.codeViewer.innerHTML = '';
    this.generationStats.style.display = 'flex';
    
    // Start stats timer
    this.startStatsTimer();
  }
  
  setGeneratingState(message) {
    this.generationStatus.textContent = message;
    this.generationStatus.className = 'generation-status generating';
    this.spinner.classList.remove('hidden');
  }
  
  completeGeneration() {
    this._isGenerating = false;
    
    // Update UI to show completion
    this.generationStatus.textContent = 'Generation complete! Opening your app...';
    this.generationStatus.className = 'generation-status complete';
    this.spinner.classList.add('hidden');
    
    // Stop stats timer
    this.stopStatsTimer();
    
    // Automatically trigger completion after a brief moment to show the success message
    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('generation-complete', {
        bubbles: true,
        composed: true,
        detail: { 
          code: this._generatedCode,
          title: this._appTitle,
          description: this._appDescription,
          appId: this._appId
        }
      }));
    }, 1000); // 1 second delay to show the completion message
  }
  
  setErrorState(message) {
    this._isGenerating = false;
    
    this.generationStatus.textContent = `Error: ${message}`;
    this.generationStatus.className = 'generation-status error';
    this.spinner.classList.add('hidden');
    
    // Show retry button for errors
    this.shadowRoot.querySelector('.button-container').classList.remove('hidden');
    this.generateButton.style.display = 'block';
    this.generateButton.disabled = false;
    this.generateButton.textContent = 'Retry';
    this.generateButton.onclick = () => {
      this._autoStarted = false; // Reset auto-start flag
      this.handleGenerate();
    };
    
    this.stopStatsTimer();
  }
  
  updateCodeViewer() {
    // Simple syntax highlighting for HTML
    let highlightedCode = this._generatedCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(&lt;\/?[^&\s]*&gt;)/g, '<span style="color: #569cd6;">$1</span>')
      .replace(/(&lt;!--.*?--&gt;)/g, '<span style="color: #6a9955;">$1</span>')
      .replace(/(="[^"]*")/g, '<span style="color: #ce9178;">$1</span>');
    
    this.codeViewer.innerHTML = highlightedCode;
  }
  
  updateGenerationStats() {
    const charCountEl = this.shadowRoot.querySelector('#char-count');
    const generationTimeEl = this.shadowRoot.querySelector('#generation-time');
    const generationSpeedEl = this.shadowRoot.querySelector('#generation-speed');
    
    charCountEl.textContent = `${this._characterCount.toLocaleString()} characters`;
    
    if (this._generationStartTime) {
      const elapsed = (Date.now() - this._generationStartTime) / 1000;
      generationTimeEl.textContent = `${elapsed.toFixed(1)}s`;
      
      const speed = this._characterCount / elapsed;
      generationSpeedEl.textContent = `${speed.toFixed(0)} chars/s`;
    }
  }
  
  startStatsTimer() {
    this._statsTimer = setInterval(() => {
      this.updateGenerationStats();
    }, 100);
  }
  
  stopStatsTimer() {
    if (this._statsTimer) {
      clearInterval(this._statsTimer);
      this._statsTimer = null;
    }
  }
  
  resetButtonContainer() {
    // No longer needed since we auto-start and don't show buttons initially
    this.shadowRoot.querySelector('.button-container').classList.add('hidden');
    this.generateButton.style.display = 'none';
    this.generateButton.disabled = false;
    this.generateButton.textContent = 'Start Generation';
    this.generateButton.className = '';
    this._autoStarted = false;
  }
  
  // Cleanup
  disconnectedCallback() {
    this.stopStatsTimer();
  }
}

// Register the component
customElements.define('app-creation-step-four', AppCreationStepFour);

export { AppCreationStepFour };

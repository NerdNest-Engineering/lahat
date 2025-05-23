// AppCreationStepOne Component
class AppCreationStepOne extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        :host(.hidden) {
          display: none;
        }
        
        .step-header {
          display: flex;
          align-items: center;
          margin-bottom: 30px;
          gap: 12px;
        }
        
        .step-number {
          background: #4285f4;
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
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
        
        .main-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin: 0 0 8px 0;
        }
        
        .description {
          color: #666;
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        
        .input-group {
          margin-bottom: 32px;
        }
        
        textarea {
          width: 100%;
          min-height: 120px;
          padding: 16px;
          font-size: 16px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          box-sizing: border-box;
          font-family: inherit;
          resize: vertical;
          background: #fafafa;
        }
        
        textarea:focus {
          outline: none;
          border-color: #4285f4;
          background: white;
        }
        
        textarea::placeholder {
          color: #999;
        }
        
        .examples-section {
          margin-bottom: 32px;
        }
        
        .examples-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0 0 8px 0;
        }
        
        .examples-subtitle {
          color: #666;
          font-size: 14px;
          margin-bottom: 16px;
        }
        
        .examples-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .example-button {
          background: #f5f5f5;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 12px 16px;
          text-align: left;
          cursor: pointer;
          font-size: 14px;
          color: #333;
          transition: all 0.2s ease;
        }
        
        .example-button:hover {
          background: #e8f0fe;
          border-color: #4285f4;
          color: #1a73e8;
        }
        
        .button-container {
          display: flex;
          justify-content: flex-start;
          margin-top: 32px;
        }
        
        .button-container.hidden {
          display: none;
        }
        
        .next-button {
          background: #e0e0e0;
          color: #999;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: not-allowed;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .next-button.enabled {
          background: #4285f4;
          color: white;
          cursor: pointer;
        }
        
        .next-button.enabled:hover {
          background: #3367d6;
        }
      </style>
      <div>
        <div class="step-header">
          <div class="step-number">1</div>
          <h1 class="step-title">Describe Your App</h1>
        </div>
        
        <h2 class="main-title">Describe the app you want to create</h2>
        <p class="description">Enter a detailed description of the app you want to create. The more specific you are, the better the result will be.</p>
        
        <div class="input-group">
          <textarea id="user-input" placeholder="Describe your app here..."></textarea>
        </div>
        
        <div class="examples-section">
          <h3 class="examples-title">Examples</h3>
          <p class="examples-subtitle">Click on an example to use it as a starting point.</p>
          <div class="examples-grid">
            <button class="example-button" data-example="A task management app with categories and due dates">
              A task management app with categories and due dates
            </button>
            <button class="example-button" data-example="A weather dashboard showing current conditions and forecast">
              A weather dashboard showing current conditions and forecast
            </button>
            <button class="example-button" data-example="A calculator with basic and scientific functions">
              A calculator with basic and scientific functions
            </button>
            <button class="example-button" data-example="A note-taking app with markdown support">
              A note-taking app with markdown support
            </button>
          </div>
        </div>
        
        <div class="button-container">
          <button id="next-button" class="next-button">Next</button>
        </div>
      </div>
    `;
    
    // Set up event listeners
    this.shadowRoot.querySelector('#next-button').addEventListener('click', this.handleNextClick.bind(this));
    this.shadowRoot.querySelector('#user-input').addEventListener('input', this.handleInputChange.bind(this));
    
    // Set up example button listeners
    this.shadowRoot.querySelectorAll('.example-button').forEach(button => {
      button.addEventListener('click', this.handleExampleClick.bind(this));
    });
  }
  
  // Getters
  get userInput() {
    return this.shadowRoot.querySelector('#user-input').value.trim();
  }
  
  // Event handlers
  handleInputChange() {
    const nextButton = this.shadowRoot.querySelector('#next-button');
    const hasInput = this.userInput.length > 0;
    
    if (hasInput) {
      nextButton.classList.add('enabled');
    } else {
      nextButton.classList.remove('enabled');
    }
  }
  
  handleExampleClick(event) {
    const example = event.target.getAttribute('data-example');
    const textarea = this.shadowRoot.querySelector('#user-input');
    textarea.value = example;
    textarea.focus();
    
    // Trigger input change to enable the button
    this.handleInputChange();
  }
  
  async handleNextClick() {
    if (!this.userInput) {
      // Show error using the error container
      const errorContainer = document.querySelector('error-container') || 
        (() => {
          const container = document.createElement('error-container');
          document.body.appendChild(container);
          return container;
        })();
      
      errorContainer.addError('Input Required', 'Please enter what you would like to create.');
      return;
    }
    
    // Hide the button container
    this.shadowRoot.querySelector('.button-container').classList.add('hidden');
    
    // Dispatch event to notify parent
    this.dispatchEvent(new CustomEvent('step-one-next', {
      bubbles: true,
      composed: true,
      detail: { input: this.userInput }
    }));
  }
  
  // Public methods
  setActive(active) {
    if (active) {
      this.classList.add('active');
      this.classList.remove('hidden');
      // Check initial state of button when becoming active
      this.handleInputChange();
    } else {
      this.classList.remove('active');
      this.classList.add('hidden');
    }
  }
  
  resetButtonContainer() {
    this.shadowRoot.querySelector('.button-container').classList.remove('hidden');
    // Reset button state
    this.handleInputChange();
  }
}

// Register the component
customElements.define('app-creation-step-one', AppCreationStepOne);

export { AppCreationStepOne };

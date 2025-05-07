/**
 * App Creation Step One Component
 * First step in the app creation process - prompt input
 * Uses composition with StepHeader and StepNavigation components
 */
import '../base/step-header.js';
import '../base/step-navigation.js';
import '../base/step-container.js';

export class AppCreationStepOne extends HTMLElement {
  constructor() {
    super();
    
    // Initialize properties
    this._stepNumber = 1;
    this._stepTitle = 'Describe Your App';
    this._active = false;
    this._completed = false;
    
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 20px;
        }
        
        /* Animation for step transitions */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        :host(.active) step-container {
          animation: fadeIn 0.3s ease-out;
        }
        /* Step-specific content styles */
        .prompt-container {
          margin-bottom: 20px;
        }
        
        .prompt-label {
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .prompt-description {
          margin-bottom: 15px;
          color: #5f6368;
        }
        
        .prompt-textarea {
          width: 100%;
          max-width: 800px;
          height: 48px;
          padding: 0 12px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: var(--border-radius, 8px);
          font-family: var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
          font-size: 16px;
          resize: none;
          line-height: 48px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          margin: 0 auto;
          display: block;
          box-sizing: border-box;
        }
        
        .prompt-textarea:focus {
          border-color: var(--primary-color, #4285f4);
          box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
        }
        
        .prompt-examples {
          margin-top: 20px;
        }
        
        .prompt-examples-title {
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .example-list {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-top: 15px;
        }
        
        .example-item {
          background-color: #f1f3f4;
          padding: 12px 16px;
          border-radius: var(--border-radius, 8px);
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .example-item:hover {
          background-color: #e8eaed;
        }
      </style>

      <step-container>
        <!-- Step header component -->
        <step-header slot="header"></step-header>
        
        <div slot="content">
          <div class="prompt-container">
            <div class="prompt-label">Describe the app you want to create</div>
            <div class="prompt-description">
              Enter a detailed description of the app you want to create. The more specific you are, the better the result will be.
            </div>
            <input type="text" class="prompt-textarea" placeholder="Describe your app here...">
          </div>

          <div class="prompt-examples">
            <div class="prompt-examples-title">Examples</div>
            <div class="prompt-description">
              Click on an example to use it as a starting point.
            </div>
            <div class="example-list">
              <div class="example-item">A task management app with categories and due dates</div>
              <div class="example-item">A weather dashboard showing current conditions and forecast</div>
              <div class="example-item">A calculator with basic and scientific functions</div>
              <div class="example-item">A note-taking app with markdown support</div>
            </div>
          </div>
        </div>
        
        <!-- Step navigation component with spacing -->
        <div slot="navigation" style="margin-top: 30px;">
          <step-navigation></step-navigation>
        </div>
      </step-container>
    `;

    // Initialize components and set up event listeners
    this._initComponents();
    this._setupEventListeners();
  }
  
  /**
   * Initialize the header and navigation components
   * @private
   */
  _initComponents() {
    // Get components
    this._header = this.shadowRoot.querySelector('step-header');
    this._navigation = this.shadowRoot.querySelector('step-navigation');
    
    // Initialize header
    if (this._header) {
      this._header.setStepNumber(this._stepNumber);
      this._header.setStepTitle(this._stepTitle);
    }
    
    // Initialize navigation - only show Next button, no Back button
    if (this._navigation) {
      this._navigation.setStepNumber(this._stepNumber);
      this._navigation.enableNextButton(false); // Initially disabled until input is valid
      this._navigation.showBackButton(false); // Hide the back button
    }
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // Get elements
    const textarea = this.shadowRoot.querySelector('.prompt-textarea');
    const exampleItems = this.shadowRoot.querySelectorAll('.example-item');
    
    // Add event listeners for textarea
    if (textarea) {
      textarea.addEventListener('input', this._handleTextareaInput.bind(this));
    }
    
    // Add event listeners for examples
    if (exampleItems) {
      exampleItems.forEach(item => {
        item.addEventListener('click', this._handleExampleClick.bind(this));
      });
    }
    
    // Add listeners for step navigation events
    if (this._navigation) {
      this._navigation.addEventListener('step-next', this._handleStepNext.bind(this));
      this._navigation.addEventListener('step-back', this._handleStepBack.bind(this));
    }
  }
  
  /**
   * Handle step next event
   * @param {CustomEvent} event - The event
   * @private
   */
  _handleStepNext(event) {
    // Forward the event to parent
    this.dispatchEvent(new CustomEvent('step-next', {
      bubbles: true,
      composed: true,
      detail: { stepNumber: this._stepNumber }
    }));
  }
  
  /**
   * Handle step back event
   * @param {CustomEvent} event - The event
   * @private
   */
  _handleStepBack(event) {
    // Forward the event to parent
    this.dispatchEvent(new CustomEvent('step-back', {
      bubbles: true,
      composed: true,
      detail: { stepNumber: this._stepNumber }
    }));
  }
  
  /**
   * Handle textarea input
   * @param {Event} event - The input event
   * @private
   */
  _handleTextareaInput(event) {
    const textarea = event.target;
    const isValid = textarea.value.trim().length >= 10;
    
    // Enable/disable next button based on validity
    if (this._navigation) {
      this._navigation.enableNextButton(isValid);
    }

    // Dispatch validity change event for the controller
    this.dispatchEvent(new CustomEvent('step-validity-change', {
      detail: {
        element: textarea,
        isValid
      },
      bubbles: true, // Allow event to bubble up
      composed: true // Allow event to cross shadow DOM boundaries
    }));
  }

  /**
   * Handle example click
   * @param {Event} event - The click event
   * @private
   */
  _handleExampleClick(event) {
    const example = event.target.textContent;
    const textarea = this.shadowRoot.querySelector('.prompt-textarea');

    if (textarea) {
      textarea.value = example;

      // Trigger validity check after setting value
      this._handleTextareaInput({ target: textarea }); // Simulate input event

      // Focus the textarea
      textarea.focus();
    }
  }

  /**
   * Called by the controller to get the step's output data.
   * @returns {string} The current prompt input.
   */
  getOutputData() {
    const textarea = this.shadowRoot.querySelector('.prompt-textarea');
    return textarea ? textarea.value.trim() : '';
  }

  /**
   * Called when the element is connected to the DOM
   */
  connectedCallback() {
    // Initialize validity state on connection
    const textarea = this.shadowRoot.querySelector('.prompt-textarea');
    if (textarea) {
      this._handleTextareaInput({ target: textarea }); // Dispatch initial validity
    }
  }
  
  /**
   * Set the step as active or inactive
   * @param {boolean} active - Whether the step is active
   */
  setActive(active) {
    this._active = active;
    
    if (active) {
      this.classList.add('active');
    } else {
      this.classList.remove('active');
    }
  }
  
  /**
   * Set the step as completed or not
   * @param {boolean} completed - Whether the step is completed
   */
  setCompleted(completed) {
    this._completed = completed;
    
    // Update the header
    if (this._header) {
      this._header.setCompleted(completed);
    }
  }
  
  /**
   * Enable or disable the next button
   * @param {boolean} enabled - Whether the button is enabled
   */
  enableNextButton(enabled) {
    if (this._navigation) {
      this._navigation.enableNextButton(enabled);
    }
  }
  
  /**
   * Show or hide the back button
   * @param {boolean} show - Whether to show the back button
   */
  showBackButton(show) {
    if (this._navigation) {
      this._navigation.showBackButton(show);
    }
  }
  
  /**
   * Set the next button text
   * @param {string} text - The button text
   */
  setNextButtonText(text) {
    if (this._navigation) {
      this._navigation.setNextButtonText(text);
    }
  }
  
  /**
   * Set the step status text
   * @param {string} status - The status text
   */
  setStatus(status) {
    if (this._header) {
      this._header.setStatus(status);
    }
  }
  
  /**
   * Reset the step state
   */
  reset() {
    this._completed = false;
    
    // Reset the header
    if (this._header) {
      this._header.setCompleted(false);
    }
    
    // Reset the textarea
    const textarea = this.shadowRoot.querySelector('.prompt-textarea');
    if (textarea) {
      textarea.value = '';
      this._handleTextareaInput({ target: textarea });
    }
  }
}

// Define the custom element
customElements.define('app-creation-step-one', AppCreationStepOne);

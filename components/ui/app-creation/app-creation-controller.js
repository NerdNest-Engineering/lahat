// AppCreationController - Main orchestrator
class AppCreationController extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary-color: #4285f4;
          --primary-hover: #3367d6;
          --success-color: #34a853;
          --border-color: #e0e0e0;
          --text-secondary: #5f6368;
          --text-muted: #999;
          --background-light: #f8f9fa;
          --border-radius: 8px;
          --spacing-sm: 10px;
          --spacing-md: 20px;
          --spacing-lg: 30px;
          
          display: block;
          max-width: 800px;
          margin: 0 auto;
          padding: var(--spacing-md);
        }
        .step-container {
          min-height: 400px;
        }
        .progress-indicator {
          display: flex;
          justify-content: center;
          margin-bottom: var(--spacing-lg);
          gap: var(--spacing-md);
        }
        
        .progress-step {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: var(--text-muted);
          position: relative;
          transition: all 0.2s ease;
        }
        
        .progress-step.active {
          background: var(--primary-color);
          color: white;
        }
        
        .progress-step.completed {
          background: var(--success-color);
          color: white;
        }
        
        .progress-step::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 100%;
          width: var(--spacing-md);
          height: 2px;
          background: var(--border-color);
          transform: translateY(-50%);
          transition: background 0.2s ease;
        }
        
        .progress-step:last-child::after {
          display: none;
        }
        
        .progress-step.completed::after {
          background: var(--success-color);
        }
      </style>
      <div class="progress-indicator">
        <div class="progress-step active" id="step-1">1</div>
        <div class="progress-step" id="step-2">2</div>
        <div class="progress-step" id="step-3">3</div>
        <div class="progress-step" id="step-4">4</div>
      </div>
      
      <div class="step-container">
        <app-creation-step-one id="step-one"></app-creation-step-one>
        <app-creation-step-two id="step-two"></app-creation-step-two>
        <app-creation-step-three id="step-three"></app-creation-step-three>
        <app-creation-step-four id="step-four"></app-creation-step-four>
        <generation-status id="generation-status"></generation-status>
      </div>
    `;
    
    // Initialize state
    this.currentStep = 1;
    this.appData = {
      userInput: '',
      title: '',
      description: '',
      logoGenerated: false,
      logoPath: null,
      folderPath: null,
      conversationId: null
    };
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Step One events
    this.shadowRoot.querySelector('#step-one').addEventListener('step-one-next', (e) => {
      this.appData.userInput = e.detail.input;
      this.moveToStep(2);
      this.generateTitleAndDescription();
    });
    
    // Step Two events
    this.shadowRoot.querySelector('#step-two').addEventListener('step-two-next', async (e) => {
      this.appData.title = e.detail.title;
      this.appData.description = e.detail.description;
      
      // Create app folder structure before moving to step 3
      await this.createAppFolder();
      this.moveToStep(3);
    });
    
    this.shadowRoot.querySelector('#step-two').addEventListener('step-two-back', () => {
      this.moveToStep(1);
    });
    
    // Step Three events
    this.shadowRoot.querySelector('#step-three').addEventListener('step-three-back', () => {
      this.moveToStep(2);
    });
    
    this.shadowRoot.querySelector('#step-three').addEventListener('step-three-next', (e) => {
      this.appData.logoGenerated = e.detail.logoGenerated;
      this.appData.logoPath = e.detail.logoPath;
      this.moveToStep(4);
    });
    
    // Step Four events - removed back button listener since there's no back button
    this.shadowRoot.querySelector('#step-four').addEventListener('generate-app', (e) => {
      this.generateApp();
    });
    
    this.shadowRoot.querySelector('#step-four').addEventListener('generation-complete', () => {
      // Navigate to success page or close window
      setTimeout(() => {
        window.electronAPI.closeWindow();
      }, 1000);
    });
  }
  
  moveToStep(stepNumber) {
    // Cache step elements for better performance
    const stepElements = {
      1: this.shadowRoot.querySelector('#step-one'),
      2: this.shadowRoot.querySelector('#step-two'),
      3: this.shadowRoot.querySelector('#step-three'),
      4: this.shadowRoot.querySelector('#step-four')
    };
    
    // Update progress indicator
    for (let i = 1; i <= 4; i++) {
      const progressElement = this.shadowRoot.querySelector(`#step-${i}`);
      progressElement.classList.remove('active', 'completed');
      
      if (i < stepNumber) {
        progressElement.classList.add('completed');
      } else if (i === stepNumber) {
        progressElement.classList.add('active');
      }
    }
    
    // Hide all steps
    Object.values(stepElements).forEach(element => element.setActive(false));
    
    // Show and configure current step
    const currentStepElement = stepElements[stepNumber];
    currentStepElement.setActive(true);
    
    // Step-specific configuration
    switch (stepNumber) {
      case 2:
        currentStepElement.setUserInput(this.appData.userInput);
        break;
      case 3:
        currentStepElement.setAppInfo(this.appData.title, this.appData.description, this.appData.folderPath);
        currentStepElement.checkOpenAIAvailability();
        break;
      case 4:
        currentStepElement.setAppInfo(this.appData.title, this.appData.description, this.appData.logoGenerated, this.appData.logoPath);
        break;
    }
    
    currentStepElement.resetButtonContainer();
    this.currentStep = stepNumber;
  }
  
  async generateTitleAndDescription() {
    const stepTwo = this.shadowRoot.querySelector('#step-two');
    const generationStatus = this.shadowRoot.querySelector('#generation-status');
    
    try {
      stepTwo.showPreview();
      stepTwo.setGeneratingState();
      generationStatus.show('Generating app concept...');
      
      // Set up streaming listener BEFORE making the API call
      const chunkHandler = (chunk) => {
        if (!chunk.done) {
          stepTwo.handleInProgressChunk(chunk);
        }
      };
      
      window.electronAPI.onTitleDescriptionChunk(chunkHandler);
      
      // Call the title/description generation API
      const result = await window.electronAPI.generateTitleAndDescription({ input: this.appData.userInput });
      
      if (result.success) {
        stepTwo.updateTitleIfPresent(result.title);
        stepTwo.updateDescriptionIfPresent(result.description);
        stepTwo.handleCompletedChunk(result);
        generationStatus.hide();
      } else {
        throw new Error(result.error || 'Failed to generate app concept');
      }
    } catch (error) {
      generationStatus.hide();
      if (window.showError) {
        window.showError('Generation Failed', error.message);
      }
      stepTwo.resetButtonContainer();
    }
  }
  
  async createAppFolder() {
    const generationStatus = this.shadowRoot.querySelector('#generation-status');
    
    try {
      generationStatus.show('Preparing app structure...');
      
      // Create the app folder structure
      const result = await window.electronAPI.createAppFolder({
        appName: this.appData.title
      });
      
      if (result.success) {
        this.appData.folderPath = result.folderPath;
        this.appData.conversationId = result.conversationId;
        generationStatus.hide();
      } else {
        throw new Error(result.error || 'Failed to create app folder');
      }
    } catch (error) {
      generationStatus.hide();
      if (window.showError) {
        window.showError('Folder Creation Failed', error.message);
      }
      // Don't prevent moving to step 3
    }
  }
  
  async generateApp() {
    try {
      // Call the app generation API with pre-created folder info
      // The streaming will be handled by step four component
      const result = await window.electronAPI.generateApp({
        prompt: this.appData.userInput,
        appName: this.appData.title,
        folderPath: this.appData.folderPath,
        conversationId: this.appData.conversationId,
        logoPath: this.appData.logoPath
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate app');
      }
    } catch (error) {
      if (window.showError) {
        window.showError('App Generation Failed', error.message);
      }
      this.shadowRoot.querySelector('#step-four').resetButtonContainer();
    }
  }
}

// Register the component
customElements.define('app-creation-controller', AppCreationController);

export { AppCreationController };

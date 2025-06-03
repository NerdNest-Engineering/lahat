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
          cursor: default;
        }
        
        .progress-step.clickable {
          cursor: pointer;
        }
        
        .progress-step.clickable:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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
        <div class="progress-step active" id="step-0">0</div>
        <div class="progress-step" id="step-1">1</div>
        <div class="progress-step" id="step-2">2</div>
        <div class="progress-step" id="step-3">3</div>
        <div class="progress-step" id="step-4">4</div>
      </div>
      
      <div class="step-container">
        <step-zero id="step-zero"></step-zero>
        <app-creation-step-one id="step-one"></app-creation-step-one>
        <app-creation-step-two id="step-two"></app-creation-step-two>
        <app-creation-step-three id="step-three"></app-creation-step-three>
        <app-creation-step-four id="step-four"></app-creation-step-four>
        <generation-status id="generation-status"></generation-status>
      </div>
    `;
    
    // Initialize state
    this.currentStep = 0;
    this.appData = {
      userInput: '',
      title: '',
      description: '',
      logoGenerated: false,
      logoPath: null,
      folderPath: null,
      conversationId: null,
      selectedCredentials: {
        claude: null,
        openai: null
      }
    };
    
    // Set up event listeners
    this.setupEventListeners();
    this.setupStepNavigation();
  }
  
  async connectedCallback() {
    // Initialize step visibility - start with step 0
    await this.moveToStep(0);
  }
  
  setupStepNavigation() {
    // Add click event listeners to each step indicator
    for (let i = 0; i <= 4; i++) {
      const stepElement = this.shadowRoot.querySelector(`#step-${i}`);
      stepElement.addEventListener('click', () => {
        // Only allow navigation to completed steps or current step
        if (i <= this.currentStep) {
          this.moveToStep(i, true); // true indicates manual navigation
        }
      });
    }
  }
  
  setupEventListeners() {
    // Step Zero events
    this.shadowRoot.querySelector('#step-zero').addEventListener('step-zero-complete', async (e) => {
      console.log('[FRONTEND] step-zero-complete event received', e.detail);
      
      // Store selected credentials in app data
      if (e.detail.selectedCredentials) {
        this.appData.selectedCredentials = { ...e.detail.selectedCredentials };
      }
      
      // Move to step 1 (user input)
      await this.moveToStep(1);
    });

    // Handle credential manager events from Step Zero
    this.shadowRoot.querySelector('#step-zero').addEventListener('open-credential-manager', async (e) => {
      try {
        await window.electronAPI.openWindow('credential-manager');
      } catch (error) {
        console.error('Failed to open credential manager:', error);
      }
    });

    this.shadowRoot.querySelector('#step-zero').addEventListener('open-credential-settings', async (e) => {
      try {
        await window.electronAPI.openWindow('credential-manager');
      } catch (error) {
        console.error('Failed to open credential settings:', error);
      }
    });
    
    // Step One events
    this.shadowRoot.querySelector('#step-one').addEventListener('step-one-next', async (e) => {
      console.log('[FRONTEND] step-one-next event received');
      this.appData.userInput = e.detail.input;
      await this.moveToStep(2);
      
      // Check Claude credentials before generating
      console.log('[FRONTEND] Moved to step 2, now calling checkClaudeCredentialsAndGenerate');
      await this.checkClaudeCredentialsAndGenerate();
    });
    
    // Step Two events
    this.shadowRoot.querySelector('#step-two').addEventListener('step-two-next', async (e) => {
      try {
        this.appData.title = e.detail.title;
        this.appData.description = e.detail.description;
        
        await this.createAppFolder();
        await this.moveToStep(3);
      } catch (error) {
        if (window.showError) {
          window.showError('Step Error', `Failed to proceed to step 3: ${error.message}`);
        }
        this.shadowRoot.querySelector('#step-two').resetButtonContainer();
      }
    });
    
    this.shadowRoot.querySelector('#step-two').addEventListener('step-two-back', async () => {
      await this.moveToStep(1);
    });
    
    // Step Three events
    this.shadowRoot.querySelector('#step-three').addEventListener('step-three-back', async () => {
      await this.moveToStep(2);
    });
    
    this.shadowRoot.querySelector('#step-three').addEventListener('step-three-next', async (e) => {
      this.appData.logoGenerated = e.detail.logoGenerated;
      this.appData.logoPath = e.detail.logoPath;
      await this.moveToStep(4);
    });
    
    // Step Four events - removed back button listener since there's no back button
    this.shadowRoot.querySelector('#step-four').addEventListener('generate-app', async (e) => {
      await this.checkClaudeCredentialsAndGenerateApp();
    });
    
    this.shadowRoot.querySelector('#step-four').addEventListener('generation-complete', (e) => {
      // Notify main window to refresh app list
      if (window.electronAPI && window.electronAPI.notifyAppCreated) {
        window.electronAPI.notifyAppCreated({
          appId: e.detail.appId || this.appData.conversationId,
          name: e.detail.title || this.appData.title
        });
      }
      
      // Close window immediately - no delay needed
      window.electronAPI.closeWindow();
    });
  }
  
  async moveToStep(stepNumber, isManualNavigation = false) {
    // Cache step elements for better performance
    const stepElements = {
      0: this.shadowRoot.querySelector('#step-zero'),
      1: this.shadowRoot.querySelector('#step-one'),
      2: this.shadowRoot.querySelector('#step-two'),
      3: this.shadowRoot.querySelector('#step-three'),
      4: this.shadowRoot.querySelector('#step-four')
    };
    
    // Update progress indicator
    for (let i = 0; i <= 4; i++) {
      const progressElement = this.shadowRoot.querySelector(`#step-${i}`);
      progressElement.classList.remove('active', 'completed', 'clickable');
      
      if (i < stepNumber) {
        progressElement.classList.add('completed', 'clickable');
      } else if (i === stepNumber) {
        progressElement.classList.add('active', 'clickable');
      }
    }
    
    // Hide all steps
    Object.values(stepElements).forEach(element => element.setActive(false));
    
    // Show and configure current step
    const currentStepElement = stepElements[stepNumber];
    
    // Pass isManualNavigation flag to step-zero, others use default setActive
    if (stepNumber === 0) {
      currentStepElement.setActive(true, isManualNavigation);
    } else {
      currentStepElement.setActive(true);
    }
    
    // Step-specific configuration
    switch (stepNumber) {
      case 0:
        // Set current selections when navigating back to step 0
        if (isManualNavigation && this.appData.selectedCredentials) {
          currentStepElement.setCurrentSelections(this.appData.selectedCredentials);
        }
        break;
      case 2:
        currentStepElement.setUserInput(this.appData.userInput);
        break;
      case 3:
        currentStepElement.setAppInfo(this.appData.title, this.appData.description, this.appData.folderPath);
        // Check if OpenAI is available, if not, allow automatic skip
        const hasOpenAI = await this.checkOpenAIAvailabilityForStep3();
        if (!hasOpenAI) {
          currentStepElement.setOpenAIUnavailable();
        }
        currentStepElement.checkOpenAIAvailability();
        break;
      case 4:
        currentStepElement.setAppInfo(this.appData.title, this.appData.description, this.appData.logoGenerated, this.appData.logoPath, this.appData.conversationId);
        // Start generation process with credential check
        setTimeout(async () => {
          await this.checkClaudeCredentialsAndGenerateApp();
        }, 100);
        break;
    }
    
    // Only call resetButtonContainer if the method exists
    if (currentStepElement.resetButtonContainer && typeof currentStepElement.resetButtonContainer === 'function') {
      currentStepElement.resetButtonContainer();
    }
    this.currentStep = stepNumber;
  }
  
  async checkOpenAIAvailabilityForStep3() {
    try {
      const result = await window.electronAPI.checkOpenAIApiKey();
      return result.hasOpenAIKey;
    } catch (error) {
      console.warn('Could not check OpenAI availability:', error);
      return false;
    }
  }
  
  async generateTitleAndDescription() {
    const stepTwo = this.shadowRoot.querySelector('#step-two');
    const generationStatus = this.shadowRoot.querySelector('#generation-status');
    
    try {
      stepTwo.showPreview();
      stepTwo.setGeneratingState();
      generationStatus.show('Generating app concept...');
      
      const chunkHandler = (chunk) => {
        if (!chunk.done) {
          stepTwo.handleInProgressChunk(chunk);
        } else {
          stepTwo.handleCompletedChunk(chunk);
        }
      };
      
      const statusHandler = (status) => {
        if (status.status === 'complete') {
          generationStatus.hide();
        } else if (status.status === 'error') {
          generationStatus.hide();
          if (window.showError) {
            window.showError('Generation Failed', status.message || 'Unknown error');
          }
          stepTwo.resetButtonContainer();
        }
      };
      
      window.electronAPI.onTitleDescriptionChunk(chunkHandler);
      window.electronAPI.onGenerationStatus(statusHandler);
      
      // Call the title/description generation API
      const result = await window.electronAPI.generateTitleAndDescription({ input: this.appData.userInput });
      
      if (result.success) {
        stepTwo.updateTitleIfPresent(result.title);
        stepTwo.updateDescriptionIfPresent(result.description);
        stepTwo.handleCompletedChunk(result);
        generationStatus.hide();
        // Clean up listeners on success
        this.cleanupTitleDescriptionListeners();
      } else {
        throw new Error(result.error || 'Failed to generate app concept');
      }
    } catch (error) {
      generationStatus.hide();
      
      // Check if this is a credential-related error
      const isCredentialError = error.message && (
        error.message.includes('API key') || 
        error.message.includes('unauthorized') || 
        error.message.includes('authentication') ||
        error.message.includes('invalid key') ||
        error.message.includes('forbidden')
      );
      
      if (isCredentialError) {
        // Show credential warning instead of generic error
        stepTwo.showCredentialMissingUI();
      } else {
        // Show generic error message
        if (window.showError) {
          window.showError('Generation Failed', error.message);
        }
        stepTwo.resetButtonContainer();
      }
      
      // Clean up listeners on error
      this.cleanupTitleDescriptionListeners();
    }
  }
  
  cleanupTitleDescriptionListeners() {
    if (window.electronAPI.removeAllListeners) {
      window.electronAPI.removeAllListeners('title-description-chunk');
      window.electronAPI.removeAllListeners('generation-status');
    }
  }
  
  async checkClaudeCredentialsAndGenerate() {
    console.log('[FRONTEND] checkClaudeCredentialsAndGenerate called');
    const stepTwo = this.shadowRoot.querySelector('#step-two');
    
    // Since Step 0 ensures credentials are selected and valid, just proceed with generation
    console.log('[FRONTEND] Using credentials from Step 0:', {
      claude: this.appData.selectedCredentials.claude,
      openai: this.appData.selectedCredentials.openai
    });
    
    // Hide any credential warning that might be showing
    stepTwo.hideCredentialMissingUI();
    
    // Proceed with generation
    await this.generateTitleAndDescription();
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
      // Re-throw the error so the calling function can handle it
      throw error;
    }
  }
  
  async checkClaudeCredentialsAndGenerateApp() {
    const stepFour = this.shadowRoot.querySelector('#step-four');
    
    // Since Step 0 ensures credentials are selected and valid, just proceed with generation
    console.log('[FRONTEND] Using credentials from Step 0:', {
      claude: this.appData.selectedCredentials.claude,
      openai: this.appData.selectedCredentials.openai
    });
    
    // Hide any credential warning that might be showing
    stepFour.hideCredentialMissingUI();
    
    // Proceed with app generation
    await this.generateApp();
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

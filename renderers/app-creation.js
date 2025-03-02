// DOM Elements
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const userInput = document.getElementById('user-input');
const userInputDisplay = document.getElementById('user-input-display');
const generatedTitle = document.getElementById('generated-title');
const generatedDescription = document.getElementById('generated-description');
const nextButton = document.getElementById('next-button');
const generateButton = document.getElementById('generate-button');
const generationStatus = document.getElementById('generation-status');
const generationStatusText = document.getElementById('generation-status-text');
const titleDescriptionPreview = document.querySelector('.preview-section');
const previewHeader = titleDescriptionPreview.querySelector('h3');
const generationPreview = document.getElementById('generation-preview');
const generationOutput = document.getElementById('generation-output');

// State
let currentInput = '';
let currentTitle = '';
let currentDescription = '';
let generationChunks = '';

// Initialize the app
async function initializeApp() {
  // Check if API key is set
  const { hasApiKey } = await window.electronAPI.checkApiKey();
  
  if (!hasApiKey) {
    // Open API setup window if API key is not set
    window.electronAPI.openWindow('api-setup');
    
    // Close this window
    window.electronAPI.closeCurrentWindow();
    return;
  }
  
  // Set up event listener for title/description chunks
  window.electronAPI.onTitleDescriptionChunk((chunk) => {
    if (!chunk.done) {
      // Update the UI with the current state
      if (chunk.title) {
        generatedTitle.value = chunk.title;
        currentTitle = chunk.title;
      }
      
      if (chunk.description) {
        generatedDescription.value = chunk.description;
        currentDescription = chunk.description;
      }
      
      // Show the preview section if it's hidden
      if (titleDescriptionPreview.classList.contains('hidden')) {
        titleDescriptionPreview.classList.remove('hidden');
      }
      
      // Update the preview header to normal state once we start getting results
      if (previewHeader.innerHTML.includes('We are building')) {
        previewHeader.textContent = 'We will build...';
      }
    } else {
      // Store the final values
      currentTitle = chunk.title || generatedTitle.value;
      currentDescription = chunk.description || generatedDescription.value;
    }
  });
  
  // Add event listeners for editable fields
  generatedTitle.addEventListener('input', (e) => {
    currentTitle = e.target.value;
  });
  
  generatedDescription.addEventListener('input', (e) => {
    currentDescription = e.target.value;
  });
}

// Step 1: Handle user input and generate title/description
nextButton.addEventListener('click', async () => {
  currentInput = userInput.value.trim();
  
  if (!currentInput) {
    alert('Please enter what you would like to create.');
    return;
  }
  
  // Hide the button container
  const buttonContainer = step1.querySelector('.button-container');
  buttonContainer.classList.add('hidden');
  
  // Show loading indicator with enhanced visibility
  generationStatus.classList.remove('hidden');
  generationStatusText.textContent = 'Generating title and description...';
  
  // Show the preview section with a loading message
  titleDescriptionPreview.classList.remove('hidden');
  previewHeader.innerHTML = 'We are building... <div class="spinner"></div>';
  
  // Reset the preview fields
  generatedTitle.value = '';
  generatedDescription.value = '';
  
  try {
    // Generate title and description
    const result = await window.electronAPI.generateTitleAndDescription({
      input: currentInput
    });
    
    if (result.success) {
      // The UI has already been updated via chunks
      // Just store the final values
      currentTitle = result.title;
      currentDescription = result.description;
      
      // Display the user input
      userInputDisplay.textContent = currentInput;
      
      // Hide step 1, show step 2
      step1.classList.remove('active');
      step2.classList.add('active');
    } else {
      alert(`Error generating title and description: ${result.error}`);
      // Show the button container again if there was an error
      buttonContainer.classList.remove('hidden');
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
    // Show the button container again if there was an error
    buttonContainer.classList.remove('hidden');
  } finally {
    // Hide loading indicator
    generationStatus.classList.add('hidden');
    
    // Reset preview header if we're still in step 1 (error occurred)
    if (step1.classList.contains('active')) {
      previewHeader.textContent = 'We will build...';
    }
  }
});

// Step 2: Generate the mini app
generateButton.addEventListener('click', async () => {
  // Hide the button container
  const buttonContainer = document.querySelector('.button-container');
  buttonContainer.classList.add('hidden');
  
  // Change preview section to "generating" state
  previewHeader.innerHTML = 'We are building... <div class="spinner"></div>';
  
  // Make title and description read-only
  generatedTitle.readOnly = true;
  generatedDescription.readOnly = true;
  
  // Show loading indicator
  generationStatus.classList.remove('hidden');
  generationStatusText.textContent = 'Generating mini app...';
  
  // Reset and show generation preview
  generationChunks = '';
  generationOutput.textContent = '';
  generationPreview.classList.remove('hidden');
  
  try {
    const result = await window.electronAPI.generateMiniApp({
      appName: currentTitle,
      prompt: currentDescription
    });
    
    if (result.success) {
      // Notify main window to refresh app list
      window.electronAPI.notifyAppUpdated();
      
      // Close this window after a short delay
      setTimeout(() => {
        window.electronAPI.closeCurrentWindow();
      }, 2000);
    } else {
      alert(`Error generating mini app: ${result.error}`);
      // Show the button container again if there was an error
      buttonContainer.classList.remove('hidden');
      
      // Restore preview section to original state
      previewHeader.textContent = 'We will build...';
      generatedTitle.readOnly = false;
      generatedDescription.readOnly = false;
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
    // Show the button container again if there was an error
    buttonContainer.classList.remove('hidden');
    
    // Restore preview section to original state
    previewHeader.textContent = 'We will build...';
    generatedTitle.readOnly = false;
    generatedDescription.readOnly = false;
  } finally {
    // Hide loading indicator
    generationStatus.classList.add('hidden');
  }
});

// Handle generation chunks
window.electronAPI.onGenerationChunk((chunk) => {
  if (!chunk.done) {
    generationChunks += chunk.content;
    generationOutput.textContent = generationChunks;
    
    // Auto-scroll to bottom
    generationOutput.scrollTop = generationOutput.scrollHeight;
  } else {
    // Generation complete
    generationChunks = '';
  }
});

// Initialize the app
initializeApp();

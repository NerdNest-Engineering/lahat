// DOM Elements
// App Generation Section
const appNameInput = document.getElementById('app-name-input');
const appPromptInput = document.getElementById('app-prompt-input');
const generateAppButton = document.getElementById('generate-app-button');
const generationStatus = document.getElementById('generation-status');
const generationStatusText = document.getElementById('generation-status-text');
const generationPreview = document.getElementById('generation-preview');
const generationOutput = document.getElementById('generation-output');

// Update App Form
const updateAppForm = document.getElementById('update-app-form');
const updatePromptInput = document.getElementById('update-prompt-input');
const submitUpdateButton = document.getElementById('submit-update-button');
const cancelUpdateButton = document.getElementById('cancel-update-button');

// State
let isUpdateMode = false;
let currentAppId = null;
let currentAppName = null;
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
  
  // Check if we're in update mode
  const params = await window.electronAPI.getWindowParams();
  
  if (params && params.updateMode) {
    isUpdateMode = true;
    currentAppId = params.appId;
    currentAppName = params.appName;
    
    // Show update form
    updateAppForm.classList.remove('hidden');
    document.getElementById('app-generation-section').classList.add('hidden');
    
    // Set window title
    document.title = `Update ${currentAppName}`;
  }
}

// App Generation
generateAppButton.addEventListener('click', async () => {
  const appName = appNameInput.value.trim() || 'Mini App';
  const prompt = appPromptInput.value.trim();
  
  if (!prompt) {
    alert('Please enter a description for your mini app.');
    return;
  }
  
  // Reset generation preview
  generationChunks = '';
  generationOutput.textContent = '';
  generationPreview.classList.add('hidden');
  
  // Show generation status
  generationStatus.classList.remove('hidden');
  generateAppButton.disabled = true;
  
  try {
    const result = await window.electronAPI.generateMiniApp({
      appName,
      prompt
    });
    
    if (result.success) {
      // Clear inputs
      appNameInput.value = '';
      appPromptInput.value = '';
      
      // Notify main window to refresh app list
      window.electronAPI.notifyAppUpdated();
      
      // Close this window after a short delay
      setTimeout(() => {
        window.electronAPI.closeCurrentWindow();
      }, 2000);
    } else {
      alert(`Error generating mini app: ${result.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    // Hide generation status
    generationStatus.classList.add('hidden');
    generateAppButton.disabled = false;
  }
});

// Update App
submitUpdateButton.addEventListener('click', async () => {
  const prompt = updatePromptInput.value.trim();
  
  if (!prompt) {
    alert('Please enter a description of the changes you want to make.');
    return;
  }
  
  try {
    // Reset generation preview
    generationChunks = '';
    generationOutput.textContent = '';
    generationPreview.classList.add('hidden');
    
    // Show generation status
    generationStatus.classList.remove('hidden');
    submitUpdateButton.disabled = true;
    
    const result = await window.electronAPI.updateMiniApp({
      appId: currentAppId,
      prompt
    });
    
    if (result.success) {
      // Notify main window to refresh app list
      window.electronAPI.notifyAppUpdated();
      
      // Close this window after a short delay
      setTimeout(() => {
        window.electronAPI.closeCurrentWindow();
      }, 2000);
    } else {
      alert(`Error updating mini app: ${result.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    // Hide generation status
    generationStatus.classList.add('hidden');
    submitUpdateButton.disabled = false;
  }
});

cancelUpdateButton.addEventListener('click', () => {
  window.electronAPI.closeCurrentWindow();
});

// Handle generation status updates
window.electronAPI.onGenerationStatus((status) => {
  if (status.status === 'generating' || status.status === 'updating') {
    generationStatus.classList.remove('hidden');
    generationStatusText.textContent = status.message;
  } else if (status.status === 'error') {
    generationStatus.classList.add('hidden');
    alert(status.message);
  }
});

// Handle generation chunks
window.electronAPI.onGenerationChunk((chunk) => {
  if (!chunk.done) {
    generationChunks += chunk.content;
    generationOutput.textContent = generationChunks;
    generationPreview.classList.remove('hidden');
    
    // Auto-scroll to bottom
    generationOutput.scrollTop = generationOutput.scrollHeight;
  } else {
    // Generation complete
    generationChunks = '';
  }
});

// Initialize the app
initializeApp();

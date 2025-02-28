// DOM Elements
// API Key Section
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyButton = document.getElementById('save-api-key-button');
const apiKeyStatus = document.getElementById('api-key-status');
const apiKeySection = document.getElementById('api-key-section');

// App Generation Section
const appGenerationSection = document.getElementById('app-generation-section');
const appNameInput = document.getElementById('app-name-input');
const appPromptInput = document.getElementById('app-prompt-input');
const generateAppButton = document.getElementById('generate-app-button');
const generationStatus = document.getElementById('generation-status');
const generationStatusText = document.getElementById('generation-status-text');
const generationPreview = document.getElementById('generation-preview');
const generationOutput = document.getElementById('generation-output');

// App Management Section
const appManagementSection = document.getElementById('app-management-section');
const refreshAppsButton = document.getElementById('refresh-apps-button');
const openAppDirectoryButton = document.getElementById('open-app-directory-button');
const appList = document.getElementById('app-list');
const noAppsMessage = document.getElementById('no-apps-message');

// Modal Elements
const appDetailsModal = document.getElementById('app-details-modal');
const modalAppName = document.getElementById('modal-app-name');
const modalAppCreated = document.getElementById('modal-app-created');
const modalAppVersions = document.getElementById('modal-app-versions');
const closeModalButton = document.getElementById('close-modal-button');
const openAppButton = document.getElementById('open-app-button');
const updateAppButton = document.getElementById('update-app-button');
const exportAppButton = document.getElementById('export-app-button');
const deleteAppButton = document.getElementById('delete-app-button');
const updateAppForm = document.getElementById('update-app-form');
const updatePromptInput = document.getElementById('update-prompt-input');
const submitUpdateButton = document.getElementById('submit-update-button');
const cancelUpdateButton = document.getElementById('cancel-update-button');

// State
let currentAppId = null;
let currentAppFilePath = null;
let currentAppName = null;
let generationChunks = '';

// Initialize the app
async function initializeApp() {
  // Check if API key is set
  const { hasApiKey, apiKey } = await window.electronAPI.checkApiKey();
  
  if (hasApiKey) {
    apiKeyInput.value = apiKey;
    apiKeyStatus.textContent = 'API key is set. You can now generate mini apps.';
    apiKeyStatus.style.color = 'var(--secondary-color)';
    showAppSections();
  }
  
  // Load existing apps
  await loadMiniApps();
}

// Show app sections after API key is set
function showAppSections() {
  appGenerationSection.classList.remove('hidden');
  appManagementSection.classList.remove('hidden');
}

// API Key Management
saveApiKeyButton.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    apiKeyStatus.textContent = 'Please enter a valid API key.';
    apiKeyStatus.style.color = 'var(--danger-color)';
    return;
  }
  
  try {
    const result = await window.electronAPI.setApiKey(apiKey);
    
    if (result.success) {
      apiKeyStatus.textContent = 'API key saved successfully. You can now generate mini apps.';
      apiKeyStatus.style.color = 'var(--secondary-color)';
      showAppSections();
    } else {
      apiKeyStatus.textContent = `Error: ${result.error}`;
      apiKeyStatus.style.color = 'var(--danger-color)';
    }
  } catch (error) {
    apiKeyStatus.textContent = `Error: ${error.message}`;
    apiKeyStatus.style.color = 'var(--danger-color)';
  }
});

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
      
      // Refresh app list
      await loadMiniApps();
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

// App Management
async function loadMiniApps() {
  try {
    const { apps } = await window.electronAPI.listMiniApps();
    
    // Clear app list
    appList.innerHTML = '';
    
    if (apps && apps.length > 0) {
      noAppsMessage.classList.add('hidden');
      
      // Create app cards
      apps.forEach(app => {
        const appCard = document.createElement('div');
        appCard.className = 'app-card';
        appCard.dataset.appId = app.id;
        appCard.dataset.filePath = app.filePath;
        appCard.dataset.name = app.name;
        
        const createdDate = new Date(app.created);
        const formattedDate = createdDate.toLocaleDateString() + ' ' + 
                             createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        appCard.innerHTML = `
          <h3>${app.name}</h3>
          <p>Created: ${formattedDate}</p>
          <p>Versions: ${app.versions}</p>
        `;
        
        appCard.addEventListener('click', () => {
          openAppDetails(app.id, app.filePath, app.name, app.created, app.versions);
        });
        
        appList.appendChild(appCard);
      });
    } else {
      noAppsMessage.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading mini apps:', error);
  }
}

refreshAppsButton.addEventListener('click', loadMiniApps);

openAppDirectoryButton.addEventListener('click', async () => {
  try {
    await window.electronAPI.openAppDirectory();
  } catch (error) {
    console.error('Error opening app directory:', error);
  }
});

// App Details Modal
function openAppDetails(appId, filePath, name, created, versions) {
  currentAppId = appId;
  currentAppFilePath = filePath;
  currentAppName = name;
  
  modalAppName.textContent = name;
  
  const createdDate = new Date(created);
  modalAppCreated.textContent = createdDate.toLocaleDateString() + ' ' + 
                               createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  modalAppVersions.textContent = versions;
  
  // Hide update form
  updateAppForm.classList.add('hidden');
  
  // Show modal
  appDetailsModal.classList.remove('hidden');
}

closeModalButton.addEventListener('click', () => {
  appDetailsModal.classList.add('hidden');
  updateAppForm.classList.add('hidden');
});

// Close modal when clicking outside
appDetailsModal.addEventListener('click', (event) => {
  if (event.target === appDetailsModal) {
    appDetailsModal.classList.add('hidden');
    updateAppForm.classList.add('hidden');
  }
});

// Open app
openAppButton.addEventListener('click', async () => {
  try {
    await window.electronAPI.openMiniApp({
      appId: currentAppId,
      filePath: currentAppFilePath,
      name: currentAppName
    });
    
    // Close modal
    appDetailsModal.classList.add('hidden');
  } catch (error) {
    alert(`Error opening mini app: ${error.message}`);
  }
});

// Update app
updateAppButton.addEventListener('click', () => {
  updateAppForm.classList.remove('hidden');
});

cancelUpdateButton.addEventListener('click', () => {
  updateAppForm.classList.add('hidden');
  updatePromptInput.value = '';
});

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
    
    // Close modal
    appDetailsModal.classList.add('hidden');
    
    const result = await window.electronAPI.updateMiniApp({
      appId: currentAppId,
      prompt
    });
    
    if (result.success) {
      // Clear update input
      updatePromptInput.value = '';
      
      // Refresh app list
      await loadMiniApps();
    } else {
      alert(`Error updating mini app: ${result.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
});

// Export app
exportAppButton.addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.exportMiniApp({
      appId: currentAppId,
      filePath: currentAppFilePath
    });
    
    if (result.success) {
      alert(`Mini app exported successfully to ${result.filePath}`);
      
      // Close modal
      appDetailsModal.classList.add('hidden');
    } else if (!result.canceled) {
      alert(`Error exporting mini app: ${result.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
});

// Delete app
deleteAppButton.addEventListener('click', async () => {
  if (confirm(`Are you sure you want to delete "${currentAppName}"? This action cannot be undone.`)) {
    try {
      const result = await window.electronAPI.deleteMiniApp({
        appId: currentAppId
      });
      
      if (result.success) {
        // Close modal
        appDetailsModal.classList.add('hidden');
        
        // Refresh app list
        await loadMiniApps();
      } else {
        alert(`Error deleting mini app: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
});

// Initialize the app
initializeApp();

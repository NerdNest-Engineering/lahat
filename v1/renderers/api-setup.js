// DOM Elements
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyButton = document.getElementById('save-api-key-button');
const apiKeyStatus = document.getElementById('api-key-status');

// Initialize the app
async function initializeApp() {
  // Check if API key is set
  const { hasApiKey, apiKey } = await window.electronAPI.checkApiKey();
  
  if (hasApiKey) {
    apiKeyInput.value = apiKey;
    apiKeyStatus.textContent = 'API key is set. You can now generate mini apps.';
    apiKeyStatus.style.color = 'var(--secondary-color)';
  }
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
      
      // Notify other windows that API key has been updated
      window.electronAPI.notifyApiKeyUpdated();
      
      // Close this window after a short delay
      setTimeout(() => {
        window.electronAPI.closeCurrentWindow();
      }, 2000);
    } else {
      apiKeyStatus.textContent = `Error: ${result.error}`;
      apiKeyStatus.style.color = 'var(--danger-color)';
    }
  } catch (error) {
    apiKeyStatus.textContent = `Error: ${error.message}`;
    apiKeyStatus.style.color = 'var(--danger-color)';
  }
});

// Handle Enter key press
apiKeyInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    saveApiKeyButton.click();
  }
});

// Initialize the app
initializeApp();

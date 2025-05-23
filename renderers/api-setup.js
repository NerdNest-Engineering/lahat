// DOM Elements
const claudeApiKeyInput = document.getElementById('claude-api-key-input');
const saveClaudeApiKeyButton = document.getElementById('save-claude-api-key-button');
const clearClaudeApiKeyButton = document.getElementById('clear-claude-api-key-button');
const claudeApiKeyStatus = document.getElementById('claude-api-key-status');

const openaiApiKeyInput = document.getElementById('openai-api-key-input');
const saveOpenaiApiKeyButton = document.getElementById('save-openai-api-key-button');
const clearOpenaiApiKeyButton = document.getElementById('clear-openai-api-key-button');
const openaiApiKeyStatus = document.getElementById('openai-api-key-status');

const testApisButton = document.getElementById('test-apis-button');
const closeButton = document.getElementById('close-button');

// Initialize the app
async function initializeApp() {
  try {
    console.log('Initializing API setup...');
    
    // Check Claude API key status
    console.log('Checking Claude API key...');
    const claudeResult = await window.electronAPI.checkApiKey();
    console.log('Claude API result:', claudeResult);
    const hasClaudeKey = claudeResult.hasApiKey;
    console.log('Has Claude key:', hasClaudeKey);
    updateClaudeStatus(hasClaudeKey);
    
    // Check OpenAI API key status
    console.log('Checking OpenAI API key...');
    const openaiResult = await window.electronAPI.checkOpenAIApiKey();
    console.log('OpenAI API result:', openaiResult);
    const hasOpenAIKey = openaiResult.hasOpenAIKey;
    console.log('Has OpenAI key:', hasOpenAIKey);
    updateOpenAIStatus(hasOpenAIKey);
    
    console.log('API setup initialization complete');
  } catch (error) {
    console.error('Error initializing API setup:', error);
  }
}

// Update Claude API key status
function updateClaudeStatus(hasKey, message = null) {
  console.log('Updating Claude status:', { hasKey, message });
  if (message) {
    claudeApiKeyStatus.textContent = message;
  } else if (hasKey) {
    claudeApiKeyStatus.textContent = 'Claude API key is set. ✓';
    claudeApiKeyStatus.style.color = 'var(--secondary-color, #34a853)';
    claudeApiKeyInput.placeholder = '••••••••••••••••••••••••••••••••';
    saveClaudeApiKeyButton.textContent = 'Update Claude API Key';
    clearClaudeApiKeyButton.style.display = 'inline-block';
  } else {
    claudeApiKeyStatus.textContent = 'Claude API key is not set.';
    claudeApiKeyStatus.style.color = 'var(--text-color, #5f6368)';
    claudeApiKeyInput.placeholder = 'Enter your Claude API key';
    saveClaudeApiKeyButton.textContent = 'Save Claude API Key';
    clearClaudeApiKeyButton.style.display = 'none';
  }
}

// Update OpenAI API key status
function updateOpenAIStatus(hasKey, message = null) {
  console.log('Updating OpenAI status:', { hasKey, message });
  if (message) {
    openaiApiKeyStatus.textContent = message;
  } else if (hasKey) {
    openaiApiKeyStatus.textContent = 'OpenAI API key is set. ✓';
    openaiApiKeyStatus.style.color = 'var(--secondary-color, #34a853)';
    openaiApiKeyInput.placeholder = '••••••••••••••••••••••••••••••••';
    saveOpenaiApiKeyButton.textContent = 'Update OpenAI API Key';
    clearOpenaiApiKeyButton.style.display = 'inline-block';
  } else {
    openaiApiKeyStatus.textContent = 'OpenAI API key is not set.';
    openaiApiKeyStatus.style.color = 'var(--text-color, #5f6368)';
    openaiApiKeyInput.placeholder = 'Enter your OpenAI API key';
    saveOpenaiApiKeyButton.textContent = 'Save OpenAI API Key';
    clearOpenaiApiKeyButton.style.display = 'none';
  }
}

// Set status message with color
function setStatusMessage(element, message, isError = false) {
  element.textContent = message;
  element.style.color = isError ? 'var(--danger-color, #ea4335)' : 'var(--secondary-color, #34a853)';
}

// Set removal status message with neutral color
function setRemovalStatusMessage(element, message) {
  element.textContent = message;
  element.style.color = 'var(--text-color, #5f6368)';
}

// Claude API Key Management
saveClaudeApiKeyButton.addEventListener('click', async () => {
  const apiKey = claudeApiKeyInput.value.trim();
  
  if (!apiKey) {
    setStatusMessage(claudeApiKeyStatus, 'Please enter a valid Claude API key.', true);
    return;
  }
  
  // Disable button during save
  saveClaudeApiKeyButton.disabled = true;
  saveClaudeApiKeyButton.textContent = 'Saving...';
  
  try {
    const result = await window.electronAPI.setApiKey(apiKey);
    
    if (result.success) {
      setStatusMessage(claudeApiKeyStatus, 'Claude API key saved successfully. ✓');
      claudeApiKeyInput.value = ''; // Clear input for security
      
      // Notify other windows that API key has been updated
      window.electronAPI.notifyApiKeyUpdated();
      
      // Refresh status after a short delay
      setTimeout(async () => {
        const claudeResult = await window.electronAPI.checkApiKey();
        updateClaudeStatus(claudeResult.hasApiKey);
      }, 500);
    } else {
      setStatusMessage(claudeApiKeyStatus, `Error: ${result.error}`, true);
    }
  } catch (error) {
    setStatusMessage(claudeApiKeyStatus, `Error: ${error.message}`, true);
  } finally {
    // Re-enable button
    saveClaudeApiKeyButton.disabled = false;
    saveClaudeApiKeyButton.textContent = 'Save Claude API Key';
  }
});

// Clear Claude API Key
clearClaudeApiKeyButton.addEventListener('click', async () => {
  if (confirm('Are you sure you want to remove the Claude API key?')) {
    clearClaudeApiKeyButton.disabled = true;
    clearClaudeApiKeyButton.textContent = 'Clearing...';
    
    try {
      const result = await window.electronAPI.setApiKey('');
      
      if (result.success) {
        // Immediately update UI to cleared state
        claudeApiKeyInput.value = '';
        updateClaudeStatus(false);
        setRemovalStatusMessage(claudeApiKeyStatus, 'Claude API key removed successfully.');
        
        // Brief delay to show the removal message, then update to normal cleared state
        setTimeout(() => {
          updateClaudeStatus(false);
        }, 2000);
      } else {
        setStatusMessage(claudeApiKeyStatus, `Error: ${result.error}`, true);
      }
    } catch (error) {
      setStatusMessage(claudeApiKeyStatus, `Error: ${error.message}`, true);
    } finally {
      clearClaudeApiKeyButton.disabled = false;
      clearClaudeApiKeyButton.textContent = 'Clear';
    }
  }
});

// OpenAI API Key Management
saveOpenaiApiKeyButton.addEventListener('click', async () => {
  const apiKey = openaiApiKeyInput.value.trim();
  
  if (!apiKey) {
    setStatusMessage(openaiApiKeyStatus, 'Please enter a valid OpenAI API key.', true);
    return;
  }
  
  // Disable button during save
  saveOpenaiApiKeyButton.disabled = true;
  saveOpenaiApiKeyButton.textContent = 'Saving...';
  
  try {
    const result = await window.electronAPI.setOpenAIApiKey(apiKey);
    
    if (result.success) {
      setStatusMessage(openaiApiKeyStatus, 'OpenAI API key saved successfully. ✓');
      openaiApiKeyInput.value = ''; // Clear input for security
      
      // Refresh status after a short delay
      setTimeout(async () => {
        const openaiResult = await window.electronAPI.checkOpenAIApiKey();
        updateOpenAIStatus(openaiResult.hasOpenAIKey);
      }, 500);
    } else {
      setStatusMessage(openaiApiKeyStatus, `Error: ${result.error}`, true);
    }
  } catch (error) {
    setStatusMessage(openaiApiKeyStatus, `Error: ${error.message}`, true);
  } finally {
    // Re-enable button
    saveOpenaiApiKeyButton.disabled = false;
    saveOpenaiApiKeyButton.textContent = 'Save OpenAI API Key';
  }
});

// Clear OpenAI API Key
clearOpenaiApiKeyButton.addEventListener('click', async () => {
  if (confirm('Are you sure you want to remove the OpenAI API key?')) {
    clearOpenaiApiKeyButton.disabled = true;
    clearOpenaiApiKeyButton.textContent = 'Clearing...';
    
    try {
      const result = await window.electronAPI.setOpenAIApiKey('');
      
      if (result.success) {
        // Immediately update UI to cleared state
        openaiApiKeyInput.value = '';
        updateOpenAIStatus(false);
        setRemovalStatusMessage(openaiApiKeyStatus, 'OpenAI API key removed successfully.');
        
        // Brief delay to show the removal message, then update to normal cleared state
        setTimeout(() => {
          updateOpenAIStatus(false);
        }, 2000);
      } else {
        setStatusMessage(openaiApiKeyStatus, `Error: ${result.error}`, true);
      }
    } catch (error) {
      setStatusMessage(openaiApiKeyStatus, `Error: ${error.message}`, true);
    } finally {
      clearOpenaiApiKeyButton.disabled = false;
      clearOpenaiApiKeyButton.textContent = 'Clear';
    }
  }
});

// Test API Connections
testApisButton.addEventListener('click', async () => {
  testApisButton.disabled = true;
  testApisButton.textContent = 'Testing...';
  
  try {
    // Test Claude API
    const claudeResult = await window.electronAPI.checkApiKey();
    if (claudeResult.hasApiKey) {
      setStatusMessage(claudeApiKeyStatus, 'Claude API connection: ✓ Working');
    } else {
      setStatusMessage(claudeApiKeyStatus, 'Claude API: Not configured', true);
    }
    
    // Test OpenAI API
    const openaiResult = await window.electronAPI.checkOpenAIApiKey();
    if (openaiResult.hasOpenAIKey) {
      try {
        const logoTestResult = await window.electronAPI.testLogoGeneration();
        if (logoTestResult.success) {
          setStatusMessage(openaiApiKeyStatus, 'OpenAI API connection: ✓ Working');
        } else {
          setStatusMessage(openaiApiKeyStatus, `OpenAI API error: ${logoTestResult.error}`, true);
        }
      } catch (error) {
        setStatusMessage(openaiApiKeyStatus, `OpenAI API test failed: ${error.message}`, true);
      }
    } else {
      setStatusMessage(openaiApiKeyStatus, 'OpenAI API: Not configured', true);
    }
  } catch (error) {
    console.error('Error testing APIs:', error);
  } finally {
    testApisButton.disabled = false;
    testApisButton.textContent = 'Test API Connections';
  }
});

// Close button
closeButton.addEventListener('click', () => {
  window.electronAPI.closeCurrentWindow();
});

// Handle Enter key press for Claude API input
claudeApiKeyInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    saveClaudeApiKeyButton.click();
  }
});

// Handle Enter key press for OpenAI API input
openaiApiKeyInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    saveOpenaiApiKeyButton.click();
  }
});

// Add external link handler to window.electronAPI if it doesn't exist
if (!window.electronAPI.openExternal) {
  window.electronAPI.openExternal = (url) => {
    // Fallback - this should be implemented in the preload script
    console.log('Would open external URL:', url);
  };
}

// Wait for DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already loaded
  initializeApp();
}

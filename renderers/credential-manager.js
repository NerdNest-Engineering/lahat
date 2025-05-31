// Credential Manager Renderer
// Handles the credential management UI and secure storage

// DOM Elements
const addCredentialForm = document.getElementById('add-credential-form');
const credentialTypeSelect = document.getElementById('credential-type');
const apiKeyField = document.getElementById('api-key-field');
const usernamePasswordFields = document.getElementById('username-password-fields');
const credentialsList = document.getElementById('credentials-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-credentials');
const cancelAddBtn = document.getElementById('cancel-add-btn');

// State
let credentials = [];
let filteredCredentials = [];

// Initialize the credential manager
async function initializeCredentialManager() {
  console.log('Initializing credential manager...');
  
  // Set up event listeners
  setupEventListeners();
  
  // Load existing credentials
  await loadCredentials();
  
  // Display credentials
  displayCredentials();
}

// Set up all event listeners
function setupEventListeners() {
  // Form submission
  addCredentialForm.addEventListener('submit', handleAddCredential);
  
  // Cancel button
  cancelAddBtn.addEventListener('click', clearForm);
  
  // Credential type change
  credentialTypeSelect.addEventListener('change', handleCredentialTypeChange);
  
  // Search functionality
  searchInput.addEventListener('input', handleSearch);
  
  console.log('Event listeners set up successfully');
}

// Handle credential type selection change
function handleCredentialTypeChange() {
  const selectedType = credentialTypeSelect.value;
  
  // Hide all dynamic fields first
  apiKeyField.classList.add('hidden');
  usernamePasswordFields.classList.add('hidden');
  
  // Show relevant fields based on type
  switch (selectedType) {
    case 'api-key':
    case 'token':
    case 'oauth':
      apiKeyField.classList.remove('hidden');
      // Update label based on type
      const label = apiKeyField.querySelector('.label-text');
      if (selectedType === 'token') {
        label.textContent = 'Bearer Token';
      } else if (selectedType === 'oauth') {
        label.textContent = 'OAuth Token';
      } else {
        label.textContent = 'API Key';
      }
      break;
    case 'username-password':
      usernamePasswordFields.classList.remove('hidden');
      break;
    case 'other':
      apiKeyField.classList.remove('hidden');
      apiKeyField.querySelector('.label-text').textContent = 'Value';
      break;
  }
}

// Handle adding a new credential
async function handleAddCredential(event) {
  event.preventDefault();
  
  const formData = new FormData(addCredentialForm);
  const credentialType = credentialTypeSelect.value;
  
  // Collect form data
  const credentialData = {
    id: generateId(),
    name: document.getElementById('credential-name').value.trim(),
    type: credentialType,
    description: document.getElementById('credential-description').value.trim(),
    createdAt: new Date().toISOString(),
    lastUsed: null
  };
  
  // Collect credential value based on type
  if (credentialType === 'username-password') {
    credentialData.username = document.getElementById('credential-username').value.trim();
    credentialData.password = document.getElementById('credential-password').value;
  } else {
    credentialData.value = document.getElementById('credential-value').value;
  }
  
  // Validate required fields
  if (!credentialData.name) {
    showAlert('Please enter a name for the credential', 'error');
    return;
  }
  
  if (credentialType === 'username-password') {
    if (!credentialData.username || !credentialData.password) {
      showAlert('Please enter both username and password', 'error');
      return;
    }
  } else if (!credentialData.value) {
    showAlert('Please enter the credential value', 'error');
    return;
  }
  
  try {
    // Save credential securely
    await saveCredential(credentialData);
    
    // Add to local state
    credentials.push(credentialData);
    
    // Refresh display
    displayCredentials();
    
    // Clear form
    clearForm();
    
    showAlert('Credential saved successfully', 'success');
    
  } catch (error) {
    console.error('Error saving credential:', error);
    showAlert('Failed to save credential: ' + error.message, 'error');
  }
}

// Save credential securely using Electron's secure storage
async function saveCredential(credentialData) {
  console.log('Saving credential:', { ...credentialData, value: '[REDACTED]', password: '[REDACTED]' });
  
  const result = await window.electronAPI.saveCredential(credentialData);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result;
}

// Load existing credentials
async function loadCredentials() {
  try {
    const result = await window.electronAPI.loadCredentials();
    if (result.success) {
      credentials = result.credentials || [];
      console.log(`Loaded ${credentials.length} credentials`);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error loading credentials:', error);
    credentials = [];
    showAlert('Failed to load credentials: ' + error.message, 'error');
  }
}

// Display credentials in the list
function displayCredentials() {
  filteredCredentials = [...credentials];
  
  if (filteredCredentials.length === 0) {
    credentialsList.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }
  
  credentialsList.classList.remove('hidden');
  emptyState.classList.add('hidden');
  
  credentialsList.innerHTML = filteredCredentials.map(credential => createCredentialCard(credential)).join('');
  
  // Add event listeners to credential cards
  setupCredentialCardListeners();
}

// Create HTML for a credential card
function createCredentialCard(credential) {
  const typeIcon = getTypeIcon(credential.type);
  const maskedValue = getMaskedValue(credential);
  const lastUsed = credential.lastUsed ? 
    `Last used: ${new Date(credential.lastUsed).toLocaleDateString()}` : 
    'Never used';
  
  return `
    <div class="card bg-base-100 border border-base-300/50" data-credential-id="${credential.id}">
      <div class="card-body p-4">
        <div class="flex justify-between items-start">
          <div class="flex items-start gap-3 flex-1">
            <div class="text-2xl">
              ${typeIcon}
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-base-content">${escapeHtml(credential.name)}</h3>
              <p class="text-sm text-base-content/60 capitalize">${credential.type.replace('-', ' ')}</p>
              ${credential.description ? `<p class="text-sm text-base-content/70 mt-1">${escapeHtml(credential.description)}</p>` : ''}
              <p class="text-xs text-base-content/50 mt-2">${lastUsed}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-ghost btn-sm copy-btn" data-credential-id="${credential.id}" title="Copy to clipboard">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </button>
            <button class="btn btn-ghost btn-sm edit-btn" data-credential-id="${credential.id}" title="Edit credential">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <button class="btn btn-ghost btn-sm text-error delete-btn" data-credential-id="${credential.id}" title="Delete credential">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="mt-3 p-3 bg-base-200/50 rounded">
          <code class="text-sm font-mono">${maskedValue}</code>
        </div>
      </div>
    </div>
  `;
}

// Set up event listeners for credential cards
function setupCredentialCardListeners() {
  // Copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', handleCopyCredential);
  });
  
  // Edit buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', handleEditCredential);
  });
  
  // Delete buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', handleDeleteCredential);
  });
}

// Handle copying credential to clipboard
async function handleCopyCredential(event) {
  const credentialId = event.currentTarget.dataset.credentialId;
  const credential = credentials.find(c => c.id === credentialId);
  
  if (!credential) return;
  
  try {
    // Get the decrypted credential value from the main process
    const result = await window.electronAPI.getCredentialValue(credentialId);
    if (!result.success) {
      throw new Error(result.error);
    }
    
    let valueToCopy = '';
    if (credential.type === 'username-password') {
      valueToCopy = `Username: ${result.value.username}\nPassword: ${result.value.password}`;
    } else {
      valueToCopy = result.value.value;
    }
    
    await navigator.clipboard.writeText(valueToCopy);
    
    showAlert('Copied to clipboard', 'success');
    
    // Reload credentials to show updated last used time
    await loadCredentials();
    displayCredentials();
    
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    showAlert('Failed to copy to clipboard', 'error');
  }
}

// Handle editing a credential
function handleEditCredential(event) {
  const credentialId = event.currentTarget.dataset.credentialId;
  const credential = credentials.find(c => c.id === credentialId);
  
  if (!credential) return;
  
  // Populate form with existing data
  document.getElementById('credential-name').value = credential.name;
  credentialTypeSelect.value = credential.type;
  document.getElementById('credential-description').value = credential.description || '';
  
  // Trigger type change to show correct fields
  handleCredentialTypeChange();
  
  // Populate type-specific fields
  if (credential.type === 'username-password') {
    document.getElementById('credential-username').value = credential.username;
    document.getElementById('credential-password').value = credential.password;
  } else {
    document.getElementById('credential-value').value = credential.value;
  }
  
  // Store the ID for updating instead of creating new
  addCredentialForm.dataset.editingId = credentialId;
  
  // Scroll to form
  addCredentialForm.scrollIntoView({ behavior: 'smooth' });
  
  showAlert('Editing credential - modify fields and click "Add Credential" to save changes', 'info');
}

// Handle deleting a credential
async function handleDeleteCredential(event) {
  const credentialId = event.currentTarget.dataset.credentialId;
  const credential = credentials.find(c => c.id === credentialId);
  
  if (!credential) return;
  
  // Confirm deletion
  if (!confirm(`Are you sure you want to delete "${credential.name}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    // Remove from storage
    await deleteCredential(credentialId);
    
    // Remove from local state
    credentials = credentials.filter(c => c.id !== credentialId);
    
    // Refresh display
    displayCredentials();
    
    showAlert('Credential deleted successfully', 'success');
    
  } catch (error) {
    console.error('Error deleting credential:', error);
    showAlert('Failed to delete credential: ' + error.message, 'error');
  }
}

// Delete a credential using Electron's secure storage
async function deleteCredential(credentialId) {
  console.log('Deleting credential:', credentialId);
  
  const result = await window.electronAPI.deleteCredential(credentialId);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result;
}

// Handle search functionality
function handleSearch() {
  const query = searchInput.value.toLowerCase().trim();
  
  if (!query) {
    filteredCredentials = [...credentials];
  } else {
    filteredCredentials = credentials.filter(credential => 
      credential.name.toLowerCase().includes(query) ||
      credential.type.toLowerCase().includes(query) ||
      (credential.description && credential.description.toLowerCase().includes(query))
    );
  }
  
  displayCredentials();
}

// Clear the form
function clearForm() {
  addCredentialForm.reset();
  apiKeyField.classList.add('hidden');
  usernamePasswordFields.classList.add('hidden');
  delete addCredentialForm.dataset.editingId;
}

// Utility functions
function generateId() {
  return 'cred_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getTypeIcon(type) {
  const icons = {
    'api-key': '🔑',
    'token': '🎫',
    'username-password': '👤',
    'oauth': '🔐',
    'other': '📝'
  };
  return icons[type] || '📝';
}

function getMaskedValue(credential) {
  if (credential.type === 'username-password') {
    return `${credential.username} / ${'•'.repeat(8)}`;
  } else {
    const value = credential.value || '';
    if (value.length <= 8) {
      return '•'.repeat(value.length);
    }
    return value.substring(0, 4) + '•'.repeat(Math.max(8, value.length - 8)) + value.substring(value.length - 4);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showAlert(message, type = 'info') {
  // Create a simple toast notification
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} fixed top-4 right-4 w-auto max-w-md z-50 shadow-lg`;
  alert.innerHTML = `
    <svg class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    <span>${message}</span>
  `;
  
  document.body.appendChild(alert);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (alert.parentNode) {
      alert.parentNode.removeChild(alert);
    }
  }, 3000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCredentialManager);
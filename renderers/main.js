// Import command palette
import commandPalette from '../components/ui/modals/command-palette.js';
import { getActiveWidget, hasActiveWidget } from '../modules/utils/activeAppState.js';

// DOM Elements
// App Management Section
const appManagementSection = document.getElementById('app-management-section');
const createAppButton = document.getElementById('create-widget-button');
const createFirstAppButton = document.getElementById('create-first-app-button');
const importAppButton = document.getElementById('import-widget-button');
const apiSettingsButton = document.getElementById('api-settings-button');
const refreshAppsButton = document.getElementById('refresh-apps-button');
const openAppDirectoryButton = document.getElementById('open-widget-directory-button');
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

// State
let currentAppId = null;
let currentAppFilePath = null;
let currentAppName = null;

// Initialize the app
async function initializeApp() {
  // Check if API key is set
  const { hasApiKey } = await window.electronAPI.checkApiKey();
  
  if (!hasApiKey) {
    // Open API setup window if API key is not set
    window.electronAPI.openWindow('api-setup');
  }
  
  // Load existing apps
  loadWidgets();
}

// App Management
async function loadWidgets() {
  try {
    console.log('Loading mini apps...');
    const { apps } = await window.electronAPI.listWidgets();
    console.log('Loaded apps:', apps);
    
    // Clear app list
    appList.innerHTML = '';
    
    if (apps && apps.length > 0) {
      noAppsMessage.classList.add('hidden');
      
      // Create app cards
      apps.forEach(app => {
        console.log('Processing app:', app);
        
        // Verify file path
        if (!app.filePath) {
          console.error('App missing filePath:', app);
        }
        
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
          <p class="file-path" style="font-size: 0.8em; color: #666; word-break: break-all;">Path: ${app.filePath}</p>
        `;
        
        appCard.addEventListener('click', () => {
          openAppDetails(app.id, app.filePath, app.name, app.created, app.versions);
        });
        
        appList.appendChild(appCard);
      });
    } else {
      console.log('No apps found');
      noAppsMessage.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading mini apps:', error);
  }
}

// Event Listeners
createAppButton.addEventListener('click', () => {
  window.electronAPI.openWindow('app-creation');
});

createFirstAppButton.addEventListener('click', () => {
  window.electronAPI.openWindow('app-creation');
});

importAppButton.addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.importWidget();
    
    if (result.success) {
      alert(`Mini app "${result.name}" imported successfully!`);
      loadWidgets();
    } else if (!result.canceled) {
      alert(`Error importing mini app: ${result.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
});

apiSettingsButton.addEventListener('click', () => {
  window.electronAPI.openWindow('api-setup');
});

refreshAppsButton.addEventListener('click', loadWidgets);

openAppDirectoryButton.addEventListener('click', async () => {
  try {
    await window.electronAPI.openAppDirectory();
  } catch (error) {
    console.error('Error opening app directory:', error);
  }
});

// App Details Modal
function openAppDetails(appId, filePath, name, created, versions) {
  console.log('Opening app details with:', { appId, filePath, name, created, versions });
  
  currentAppId = appId;
  currentAppFilePath = filePath;
  currentAppName = name;
  
  console.log('Setting current app state:', { currentAppId, currentAppFilePath, currentAppName });
  
  modalAppName.textContent = name;
  
  const createdDate = new Date(created);
  modalAppCreated.textContent = createdDate.toLocaleDateString() + ' ' + 
                               createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  modalAppVersions.textContent = versions;
  
  // Show modal
  appDetailsModal.classList.remove('hidden');
}

closeModalButton.addEventListener('click', () => {
  appDetailsModal.classList.add('hidden');
});

// Close modal when clicking outside
appDetailsModal.addEventListener('click', (event) => {
  if (event.target === appDetailsModal) {
    appDetailsModal.classList.add('hidden');
  }
});

// Open app
openAppButton.addEventListener('click', async () => {
  console.log('Open App button clicked', { currentAppId, currentAppFilePath, currentAppName });
  
  try {
    console.log('Sending openWidget IPC message with params:', {
      appId: currentAppId, 
      filePath: currentAppFilePath, 
      name: currentAppName
    });
    
    const result = await window.electronAPI.openWidget({
      appId: currentAppId,
      filePath: currentAppFilePath,
      name: currentAppName
    });
    
    console.log('openWidget result:', result);
    
    // Close modal
    appDetailsModal.classList.add('hidden');
  } catch (error) {
    console.error('Error opening mini app:', error);
    alert(`Error opening mini app: ${error.message}`);
  }
});

// Update app
updateAppButton.addEventListener('click', () => {
  // Open app creation window in update mode
  window.electronAPI.openWindow('app-creation', {
    updateMode: true,
    appId: currentAppId,
    appName: currentAppName
  });
  
  // Close modal
  appDetailsModal.classList.add('hidden');
});

// Export app as package (zip)
exportAppButton.addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.exportWidget({
      appId: currentAppId,
      filePath: currentAppFilePath,
      exportType: 'package'
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
      const result = await window.electronAPI.deleteWidget({
        appId: currentAppId
      });
      
      if (result.success) {
        // Close modal
        appDetailsModal.classList.add('hidden');
        
        // Refresh app list
        loadWidgets();
      } else {
        alert(`Error deleting mini app: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
});

// Listen for app updates from other windows
window.electronAPI.onAppUpdated(() => {
  loadWidgets();
});

// Command Palette Setup
function setupCommandPalette() {
  // Register commands
  commandPalette.addCommand('create-widget', 'Create New Widget', () => {
    window.electronAPI.openWindow('app-creation');
  });

  commandPalette.addCommand('import-widget', 'Import Widget', async () => {
    try {
      const result = await window.electronAPI.importWidget();
      
      if (result.success) {
        alert(`Mini app "${result.name}" imported successfully!`);
        loadWidgets();
      }
    } catch (error) {
      console.error('Error importing app:', error);
    }
  });

  commandPalette.addCommand('open-widget-directory', 'Open Widget Directory', async () => {
    try {
      await window.electronAPI.openAppDirectory();
    } catch (error) {
      console.error('Error opening app directory:', error);
    }
  });

  // Conditionally show Edit App command when there's an active mini app
  commandPalette.addCommand('edit-app', 'Edit App', () => {
    const activeApp = getActiveWidget();
    window.electronAPI.openWindow('app-creation', {
      updateMode: true,
      appId: activeApp.id,
      appName: activeApp.name
    });
  }, () => {
    // Only show this command when there's an active mini app
    return hasActiveWidget();
  });

  // Add keyboard shortcut listener
  window.addEventListener('keydown', (event) => {
    // Check for cmd+p or ctrl+p
    if ((event.metaKey || event.ctrlKey) && event.key === 'p') {
      event.preventDefault();
      commandPalette.show();
    }
  });
}

// Initialize the app
initializeApp();
setupCommandPalette();

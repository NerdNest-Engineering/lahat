// Import components
import '../components/ui/containers/app-list.js';
import commandPalette from '../components/ui/modals/command-palette.js';
import { hasActiveMiniApp, getActiveMiniApp } from '../modules/utils/activeAppState.js';

// DOM Elements
const createAppButton = document.getElementById('create-app-button');
const importAppButton = document.getElementById('import-app-button');
const apiSettingsButton = document.getElementById('api-settings-button');
const refreshAppsButton = document.getElementById('refresh-apps-button');
const openAppDirectoryButton = document.getElementById('open-app-directory-button');
const appList = document.getElementById('app-list');

// Initialize the app
async function initializeApp() {
  console.log('Initializing app...');
  console.log('App list element:', appList);
  
  // Check if API key is set
  const { hasApiKey } = await window.electronAPI.checkApiKey();
  
  if (!hasApiKey) {
    // Open API setup window if API key is not set
    window.electronAPI.openWindow('api-setup');
  }
  
  // Set up app list event listeners
  setupAppListEventListeners();
  
  // Load existing apps
  await loadMiniApps();
}

// Set up event listeners for the app list component
function setupAppListEventListeners() {
  console.log('Setting up app list event listeners...');
  if (appList) {
    // Use native addEventListener to avoid BaseComponent conflicts
    HTMLElement.prototype.addEventListener.call(appList, 'app-open', handleAppOpen);
    HTMLElement.prototype.addEventListener.call(appList, 'app-delete', handleAppDelete);
    HTMLElement.prototype.addEventListener.call(appList, 'app-export', handleAppExport);
    console.log('Event listeners set up successfully');
  } else {
    console.error('App list element not found!');
  }
}

// App Management
async function loadMiniApps() {
  try {
    console.log('Loading mini apps...');
    const { apps } = await window.electronAPI.listMiniApps();
    console.log('Loaded apps:', apps);
    console.log('Number of apps:', apps ? apps.length : 0);
    
    if (!appList) {
      console.error('App list element not found when trying to set apps!');
      return;
    }
    
    if (!apps || apps.length === 0) {
      console.log('No apps found, showing empty state');
      appList.setApps([]);
      return;
    }
    
    // Transform apps to include logo information
    const transformedApps = apps.map((app, index) => {
      console.log(`Processing app ${index + 1}:`, app);
      
      // Safely handle logo data
      let logoPath = null;
      try {
        if (app.logo && app.logo.absolutePath) {
          logoPath = app.logo.absolutePath;
        } else if (app.logoPath) {
          logoPath = app.logoPath;
        }
      } catch (error) {
        console.warn(`Error processing logo for app ${app.name}:`, error);
      }
      
      return {
        ...app,
        logoPath
      };
    });
    
    console.log('Transformed apps:', transformedApps);
    
    // Set apps in the app list component
    if (typeof appList.setApps === 'function') {
      await appList.setApps(transformedApps);
      console.log('Apps set successfully');
    } else {
      console.error('appList.setApps is not a function!', typeof appList.setApps);
    }
  } catch (error) {
    console.error('Error loading mini apps:', error);
  }
}

// Handle app open event from app cards
async function handleAppOpen(event) {
  const { id, name, filePath } = event.detail;
  
  console.log('Opening app:', { id, name, filePath });
  
  try {
    const result = await window.electronAPI.openMiniApp({
      appId: id,
      filePath: filePath,
      name: name
    });
    
    console.log('openMiniApp result:', result);
  } catch (error) {
    console.error('Error opening mini app:', error);
    alert(`Error opening mini app: ${error.message}`);
  }
}

// Handle app delete event from app cards
async function handleAppDelete(event) {
  const { id, name } = event.detail;
  
  if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
    try {
      const result = await window.electronAPI.deleteMiniApp({
        appId: id
      });
      
      if (result.success) {
        // Remove the app from the list
        if (appList && typeof appList.removeApp === 'function') {
          appList.removeApp(id);
        } else {
          // Fallback: reload all apps
          await loadMiniApps();
        }
      } else {
        alert(`Error deleting mini app: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
}

// Handle app export event from app cards
async function handleAppExport(event) {
  const { id, filePath } = event.detail;
  
  try {
    const result = await window.electronAPI.exportMiniApp({
      appId: id,
      filePath: filePath,
      exportType: 'package'
    });
    
    if (result.success) {
      alert(`Mini app exported successfully to ${result.filePath}`);
    } else if (!result.canceled) {
      alert(`Error exporting mini app: ${result.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

// Button Event Listeners
createAppButton.addEventListener('click', () => {
  window.electronAPI.openWindow('app-creation');
});

importAppButton.addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.importMiniApp();
    
    if (result.success) {
      alert(`Mini app "${result.name}" imported successfully!`);
      await loadMiniApps();
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

refreshAppsButton.addEventListener('click', loadMiniApps);

openAppDirectoryButton.addEventListener('click', async () => {
  try {
    await window.electronAPI.openAppDirectory();
  } catch (error) {
    console.error('Error opening app directory:', error);
  }
});

// Listen for app updates from other windows
window.electronAPI.onAppUpdated(() => {
  loadMiniApps();
});

// Listen for app list refresh requests
window.electronAPI.onRefreshAppList(() => {
  loadMiniApps();
});

// Command Palette Setup
function setupCommandPalette() {
  // Register commands
  commandPalette.addCommand('create-app', 'Create New App', () => {
    window.electronAPI.openWindow('app-creation');
  });

  commandPalette.addCommand('import-app', 'Import App', async () => {
    try {
      const result = await window.electronAPI.importMiniApp();
      
      if (result.success) {
        alert(`Mini app "${result.name}" imported successfully!`);
        await loadMiniApps();
      }
    } catch (error) {
      console.error('Error importing app:', error);
    }
  });

  commandPalette.addCommand('open-app-directory', 'Open App Directory', async () => {
    try {
      await window.electronAPI.openAppDirectory();
    } catch (error) {
      console.error('Error opening app directory:', error);
    }
  });

  // Conditionally show Edit App command when there's an active mini app
  commandPalette.addCommand('edit-app', 'Edit App', () => {
    const activeApp = getActiveMiniApp();
    window.electronAPI.openWindow('app-creation', {
      updateMode: true,
      appId: activeApp.id,
      appName: activeApp.name
    });
  }, () => {
    // Only show this command when there's an active mini app
    return hasActiveMiniApp();
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

/**
 * Main entry point for the app-list module
 */

// Import services
import { AppListService } from './services/app-list-service.js';

// Import IPC handlers
import { 
  getApps as getAppsFromIPC,
  openApp as openAppFromIPC,
  openAppCreator as openAppCreatorFromIPC,
  openSettings as openSettingsFromIPC,
  onAppCreated,
  onAppUpdated,
  onAppDeleted
} from './ipc/renderer-handlers.js';

// Initialize the app list when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeAppList();
  setupUIEventListeners();
});

/**
 * Set up UI event listeners for the static buttons
 */
function setupUIEventListeners() {
  // API Settings button
  document.getElementById('api-settings-button')?.addEventListener('click', () => {
    openSettingsFromIPC()
      .then(result => console.log('Settings launch result:', result))
      .catch(error => console.error('Failed to open settings:', error));
  });

  // Dashboards button
  document.getElementById('dashboards-button')?.addEventListener('click', () => {
    console.log('Dashboards button clicked');
    // Placeholder for dashboards functionality
  });

  // Create App button
  document.getElementById('create-app-button')?.addEventListener('click', () => {
    openAppCreatorFromIPC()
      .then(result => console.log('App creator launch result:', result))
      .catch(error => console.error('Failed to launch app creator:', error));
  });

  // Import App button
  document.getElementById('import-app-button')?.addEventListener('click', () => {
    console.log('Import app action triggered');
    // Placeholder for import app functionality
  });

  // Refresh button
  document.getElementById('refresh-apps-button')?.addEventListener('click', () => {
    console.log('Refreshing app list');
    initializeAppList();
  });

  // Open App Directory button
  document.getElementById('open-app-directory-button')?.addEventListener('click', () => {
    console.log('Open app directory action triggered');
    // Placeholder for open directory functionality
  });

  // Create First App button (visible when no apps exist)
  document.getElementById('create-first-app-button')?.addEventListener('click', () => {
    openAppCreatorFromIPC()
      .then(result => console.log('App creator launch result:', result))
      .catch(error => console.error('Failed to launch app creator:', error));
  });
}

/**
 * Initialize the app list
 */
async function initializeAppList() {
  // Get the app list container
  const appListContainer = document.getElementById('app-list');
  
  // Create and initialize the app list service
  const appListService = new AppListService();
  
  try {
    let apps;
    
    // Try to get apps from IPC first, fall back to local service if not available
    try {
      apps = await getAppsFromIPC();
      console.log('Got apps from IPC');
    } catch (ipcError) {
      console.warn('Failed to get apps from IPC, falling back to local service', ipcError);
      apps = await appListService.loadApps();
    }
    
    // Render the apps
    renderApps(apps, appListContainer);
    
    // Set up event listeners
    setupEventListeners(appListContainer, appListService);
    
    // Set up IPC event listeners
    setupIPCEventListeners(appListService);
    
    console.log('App list initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app list:', error);
    // TODO: Show error message to user
  }
}

/**
 * Set up IPC event listeners
 * @param {AppListService} appListService - The app list service
 */
function setupIPCEventListeners(appListService) {
  // Listen for app created events
  const unsubscribeCreated = onAppCreated((app) => {
    console.log('App created:', app);
    appListService.apps.push(app);
    
    // Get the app list container and re-render
    const appListContainer = document.getElementById('app-list');
    renderApps(appListService.apps, appListContainer);
  });
  
  // Listen for app updated events
  const unsubscribeUpdated = onAppUpdated((app) => {
    console.log('App updated:', app);
    
    // Find and update the app in the list
    const index = appListService.apps.findIndex(a => a.id === app.id);
    if (index !== -1) {
      appListService.apps[index] = app;
      
      // Get the app list container and re-render
      const appListContainer = document.getElementById('app-list');
      renderApps(appListService.apps, appListContainer);
    }
  });
  
  // Listen for app deleted events
  const unsubscribeDeleted = onAppDeleted((appId) => {
    console.log('App deleted:', appId);
    
    // Remove the app from the list
    appListService.apps = appListService.apps.filter(a => a.id !== appId);
    
    // Get the app list container and re-render
    const appListContainer = document.getElementById('app-list');
    renderApps(appListService.apps, appListContainer);
  });
  
  // Clean up event listeners when the window is unloaded
  window.addEventListener('unload', () => {
    unsubscribeCreated();
    unsubscribeUpdated();
    unsubscribeDeleted();
  });
}

/**
 * Render the apps in the app list container
 * @param {Array} apps - The list of apps to render
 * @param {HTMLElement} container - The container element
 */
function renderApps(apps, container) {
  // Clear any existing app cards
  const existingCards = container.querySelectorAll('app-card:not([slot])');
  existingCards.forEach(card => card.remove());
  
  // Create and append app cards
  apps.forEach(app => {
    const appCard = document.createElement('app-card');
    appCard.appId = app.id;
    appCard.title = app.title;
    appCard.description = app.description;
    
    // Set the new properties
    if (app.created) {
      appCard.created = app.created;
    } else if (app.lastModified) {
      // Fallback to lastModified if created is not available
      appCard.created = app.lastModified;
    }
    
    appCard.version = app.version || '1';
    appCard.path = app.path || '';
    
    container.appendChild(appCard);
  });
}

/**
 * Set up event listeners for the app list
 * @param {HTMLElement} container - The container element
 * @param {AppListService} appListService - The app list service
 */
function setupEventListeners(container, appListService) {
  // Listen for app selection events
  container.addEventListener('app-selected', (event) => {
    const { appId } = event.detail;
    console.log(`App selected: ${appId}`);
    
    // Use IPC to open the app
    openAppFromIPC(appId)
      .then(result => console.log('App open result:', result))
      .catch(error => console.error('Failed to open app:', error));
  });
  
  // Listen for action events from navigation buttons
  container.addEventListener('action', (event) => {
    const { action } = event.detail;
    console.log(`Action: ${action}`);
    
    // Handle action based on the type
    switch (action) {
      case 'api-settings':
        openSettingsFromIPC()
          .then(result => console.log('Settings launch result:', result))
          .catch(error => console.error('Failed to open settings:', error));
        break;
      case 'create-app':
        openAppCreatorFromIPC()
          .then(result => console.log('App creator launch result:', result))
          .catch(error => console.error('Failed to launch app creator:', error));
        break;
      case 'import-app':
        console.log('Import app action triggered');
        // Placeholder for import app functionality
        break;
      case 'refresh':
        console.log('Refreshing app list');
        initializeAppList();
        break;
      case 'open-directory':
        console.log('Open app directory action triggered');
        // Placeholder for open directory functionality
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  });
}

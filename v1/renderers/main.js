// Import components
import commandPalette from '../components/ui/modals/command-palette.js';
import { getActiveWidget, hasActiveWidget } from '../modules/utils/activeAppState.js';
import '../components/ui/containers/widget-list.js';

// DOM Elements
// Widget Management Section
const widgetManagementSection = document.getElementById('widget-management-section');
const createWidgetButton = document.getElementById('create-widget-button');
const createFirstWidgetButton = document.getElementById('create-first-widget-button');
const importWidgetButton = document.getElementById('import-widget-button');
const apiSettingsButton = document.getElementById('api-settings-button');
const dashboardsButton = document.getElementById('dashboards-button');
const refreshWidgetsButton = document.getElementById('refresh-widgets-button');
const openWidgetDirectoryButton = document.getElementById('open-widget-directory-button');
const widgetListElement = document.querySelector('widget-list');

// Modal Elements
const widgetDetailsModal = document.getElementById('widget-details-modal');
const modalWidgetName = document.getElementById('modal-widget-name');
const modalWidgetCreated = document.getElementById('modal-widget-created');
const modalWidgetVersions = document.getElementById('modal-widget-versions');
const closeModalButton = document.getElementById('close-modal-button');
const openWidgetButton = document.getElementById('open-widget-button');
const updateWidgetButton = document.getElementById('update-widget-button');
const exportWidgetButton = document.getElementById('export-widget-button');
const deleteWidgetButton = document.getElementById('delete-widget-button');

// State
let currentWidgetId = null;
let currentWidgetFilePath = null;
let currentWidgetName = null;

// Initialize the application
async function initializeApp() {
  // Check if API key is set
  const { hasApiKey } = await window.electronAPI.checkApiKey();
  
  if (!hasApiKey) {
    // Open API setup window if API key is not set
    window.electronAPI.openWindow('api-setup');
  }
  
  // Load existing widgets
  loadWidgets();
}

// Widget Management
async function loadWidgets() {
  try {
    console.log('Loading widgets...');
    const { apps } = await window.electronAPI.listWidgets();
    console.log('Loaded widgets:', apps);
    
    // Set widgets to the widget-list component
    if (widgetListElement) {
      widgetListElement.setWidgets(apps);
      
      // Add event listeners for widget events
      widgetListElement.addEventListener('widget-selected', handleWidgetSelected);
      widgetListElement.addEventListener('widget-open-in-dashboard', handleWidgetOpenInDashboard);
    } else {
      console.error('Widget list element not found');
    }
  } catch (error) {
    console.error('Error loading widgets:', error);
  }
}

// Handle widget selected event
async function handleWidgetSelected(event) {
  const widget = event.detail;
  console.log('Widget selected:', widget);
  
  // Open widget details modal
  openWidgetDetails(widget.id, widget.filePath, widget.name, widget.created, widget.versions);
}

// Handle widget open in dashboard event
async function handleWidgetOpenInDashboard(event) {
  const widget = event.detail;
  console.log('Widget open in dashboard:', widget);
  
  try {
    // Create a temporary dashboard with the selected widget
    const result = await window.electronAPI.createTemporaryDashboard(widget);
    
    if (result.success) {
      console.log('Temporary dashboard created:', result.dashboard);
    } else {
      console.error('Error creating temporary dashboard:', result.error);
      alert(`Error creating temporary dashboard: ${result.error}`);
    }
  } catch (error) {
    console.error('Error handling widget open in dashboard:', error);
    alert(`Error: ${error.message}`);
  }
}

// Event Listeners
createWidgetButton.addEventListener('click', () => {
  window.electronAPI.openWindow('app-creation');
});

createFirstWidgetButton.addEventListener('click', () => {
  window.electronAPI.openWindow('app-creation');
});

dashboardsButton.addEventListener('click', () => {
  window.electronAPI.openWindow('dashboard-list');
});

importWidgetButton.addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.importWidget();
    
    if (result.success) {
      alert(`Widget "${result.name}" imported successfully!`);
      loadWidgets();
    } else if (!result.canceled) {
      alert(`Error importing widget: ${result.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
});

apiSettingsButton.addEventListener('click', () => {
  window.electronAPI.openWindow('api-setup');
});

refreshWidgetsButton.addEventListener('click', loadWidgets);

openWidgetDirectoryButton.addEventListener('click', async () => {
  try {
    await window.electronAPI.openAppDirectory();
  } catch (error) {
    console.error('Error opening widget directory:', error);
  }
});

// Widget Details Modal
function openWidgetDetails(widgetId, filePath, name, created, versions) {
  console.log('Opening widget details with:', { widgetId, filePath, name, created, versions });
  
  currentWidgetId = widgetId;
  currentWidgetFilePath = filePath;
  currentWidgetName = name;
  
  console.log('Setting current widget state:', { currentWidgetId, currentWidgetFilePath, currentWidgetName });
  
  modalWidgetName.textContent = name;
  
  const createdDate = new Date(created);
  modalWidgetCreated.textContent = createdDate.toLocaleDateString() + ' ' + 
                               createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  modalWidgetVersions.textContent = versions;
  
  // Show modal
  widgetDetailsModal.classList.remove('hidden');
}

closeModalButton.addEventListener('click', () => {
  widgetDetailsModal.classList.add('hidden');
});

// Close modal when clicking outside
widgetDetailsModal.addEventListener('click', (event) => {
  if (event.target === widgetDetailsModal) {
    widgetDetailsModal.classList.add('hidden');
  }
});

// Open widget
openWidgetButton.addEventListener('click', async () => {
  console.log('Open Widget button clicked', { currentWidgetId, currentWidgetFilePath, currentWidgetName });
  
  try {
    // Create a temporary dashboard with the selected widget
    const result = await window.electronAPI.createTemporaryDashboard({
      id: currentWidgetId,
      name: currentWidgetName,
      filePath: currentWidgetFilePath
    });
    
    console.log('Temporary dashboard result:', result);
    
    // Close modal
    widgetDetailsModal.classList.add('hidden');
  } catch (error) {
    console.error('Error creating temporary dashboard:', error);
    alert(`Error: ${error.message}`);
  }
});

// Update widget
updateWidgetButton.addEventListener('click', () => {
  // Open widget creation window in update mode
  window.electronAPI.openWindow('app-creation', {
    updateMode: true,
    appId: currentWidgetId,
    appName: currentWidgetName
  });
  
  // Close modal
  widgetDetailsModal.classList.add('hidden');
});

// Export widget as package (zip)
exportWidgetButton.addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.exportWidget({
      appId: currentWidgetId,
      filePath: currentWidgetFilePath,
      exportType: 'package'
    });
    
    if (result.success) {
      alert(`Widget exported successfully to ${result.filePath}`);
      
      // Close modal
      widgetDetailsModal.classList.add('hidden');
    } else if (!result.canceled) {
      alert(`Error exporting widget: ${result.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
});

// Delete widget
deleteWidgetButton.addEventListener('click', async () => {
  if (confirm(`Are you sure you want to delete "${currentWidgetName}"? This action cannot be undone.`)) {
    try {
      const result = await window.electronAPI.deleteWidget({
        appId: currentWidgetId
      });
      
      if (result.success) {
        // Close modal
        widgetDetailsModal.classList.add('hidden');
        
        // Refresh widget list
        loadWidgets();
      } else {
        alert(`Error deleting widget: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
});

// Listen for widget updates from other windows
window.electronAPI.onAppUpdated(() => {
  loadWidgets();
});

// Command Palette Setup
function setupCommandPalette() {
  // Register commands
  commandPalette.addCommand('create-widget', 'Create New Widget', () => {
    window.electronAPI.openWindow('app-creation');
  });
  
  commandPalette.addCommand('open-dashboards', 'Open Dashboards', () => {
    window.electronAPI.openWindow('dashboard-list');
  });

  commandPalette.addCommand('import-widget', 'Import Widget', async () => {
    try {
      const result = await window.electronAPI.importWidget();
      
      if (result.success) {
        alert(`Widget "${result.name}" imported successfully!`);
        loadWidgets();
      }
    } catch (error) {
      console.error('Error importing widget:', error);
    }
  });

  commandPalette.addCommand('open-widget-directory', 'Open Widget Directory', async () => {
    try {
      await window.electronAPI.openAppDirectory();
    } catch (error) {
      console.error('Error opening widget directory:', error);
    }
  });

  // Conditionally show Edit Widget command when there's an active widget
  commandPalette.addCommand('edit-widget', 'Edit Widget', () => {
    const activeWidget = getActiveWidget();
    window.electronAPI.openWindow('app-creation', {
      updateMode: true,
      appId: activeWidget.id,
      appName: activeWidget.name
    });
  }, () => {
    // Only show this command when there's an active widget
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

// Initialize the application
initializeApp();
setupCommandPalette();

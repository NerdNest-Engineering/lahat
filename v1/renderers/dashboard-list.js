// Dashboard List Renderer
// Handles the dashboard list UI and interactions

// DOM Elements
// Dashboard Management Section
const dashboardManagementSection = document.getElementById('dashboard-management-section');
const createDashboardButton = document.getElementById('create-dashboard-button');
const createFirstDashboardButton = document.getElementById('create-first-dashboard-button');
const refreshDashboardsButton = document.getElementById('refresh-dashboards-button');
const backToMainButton = document.getElementById('back-to-main-button');
const dashboardList = document.getElementById('dashboard-list');
const noDashboardsMessage = document.getElementById('no-dashboards-message');

// Modal Elements
const dashboardDetailsModal = document.getElementById('dashboard-details-modal');
const modalDashboardName = document.getElementById('modal-dashboard-name');
const modalDashboardCreated = document.getElementById('modal-dashboard-created');
const modalDashboardWidgets = document.getElementById('modal-dashboard-widgets');
const modalDashboardDescription = document.getElementById('modal-dashboard-description');
const closeModalButton = document.getElementById('close-modal-button');
const openDashboardButton = document.getElementById('open-dashboard-button');
const editDashboardButton = document.getElementById('edit-dashboard-button');
const deleteDashboardButton = document.getElementById('delete-dashboard-button');

// State
let currentDashboardId = null;
let currentDashboardName = null;

// Initialize the dashboard list
async function initializeDashboardList() {
  // Load existing dashboards
  loadDashboards();
}

// Dashboard Management
async function loadDashboards() {
  try {
    console.log('Loading dashboards...');
    
    // Get dashboards from store
    // In a real implementation, this would use an IPC call to get dashboards from the main process
    const dashboards = await getDashboards();
    
    // Clear dashboard list
    dashboardList.innerHTML = '';
    
    if (dashboards && dashboards.length > 0) {
      noDashboardsMessage.classList.add('hidden');
      
      // Create dashboard cards
      dashboards.forEach(dashboard => {
        console.log('Processing dashboard:', dashboard);
        
        const dashboardCard = document.createElement('div');
        dashboardCard.className = 'dashboard-card';
        dashboardCard.dataset.dashboardId = dashboard.id;
        dashboardCard.dataset.name = dashboard.name;
        
        const createdDate = new Date(dashboard.created);
        const formattedDate = createdDate.toLocaleDateString() + ' ' + 
                             createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        dashboardCard.innerHTML = `
          <h3>${dashboard.name}</h3>
          <p>Created: ${formattedDate}</p>
          <p>${dashboard.description || 'No description'}</p>
          <div class="widget-count">${dashboard.widgets.length} Widget${dashboard.widgets.length !== 1 ? 's' : ''}</div>
        `;
        
        dashboardCard.addEventListener('click', () => {
          openDashboardDetails(dashboard.id, dashboard.name, dashboard.created, dashboard.widgets, dashboard.description);
        });
        
        dashboardList.appendChild(dashboardCard);
      });
    } else {
      console.log('No dashboards found');
      noDashboardsMessage.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading dashboards:', error);
  }
}

// Temporary function to get dashboards from store
// In a real implementation, this would be replaced with an IPC call
async function getDashboards() {
  // For now, return some sample dashboards
  // This would be replaced with actual data from the store
  return [
    {
      id: 'dashboard1',
      name: 'Analytics Dashboard',
      created: new Date().toISOString(),
      description: 'Dashboard for analytics and data visualization',
      widgets: [
        { id: 'widget1', name: 'User Growth Chart' },
        { id: 'widget2', name: 'Revenue Metrics' },
        { id: 'widget3', name: 'Conversion Funnel' }
      ]
    },
    {
      id: 'dashboard2',
      name: 'Project Management',
      created: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      description: 'Dashboard for tracking project progress',
      widgets: [
        { id: 'widget4', name: 'Task Tracker' },
        { id: 'widget5', name: 'Team Calendar' }
      ]
    }
  ];
}

// Event Listeners
createDashboardButton.addEventListener('click', () => {
  // In a real implementation, this would open a dashboard creation window
  alert('Create dashboard functionality will be implemented soon!');
});

createFirstDashboardButton.addEventListener('click', () => {
  // In a real implementation, this would open a dashboard creation window
  alert('Create dashboard functionality will be implemented soon!');
});

refreshDashboardsButton.addEventListener('click', loadDashboards);

backToMainButton.addEventListener('click', () => {
  window.electronAPI.openWindow('main');
  // Close this window
  window.electronAPI.closeCurrentWindow();
});

// Dashboard Details Modal
function openDashboardDetails(dashboardId, name, created, widgets, description) {
  console.log('Opening dashboard details with:', { dashboardId, name, created, widgets, description });
  
  currentDashboardId = dashboardId;
  currentDashboardName = name;
  
  modalDashboardName.textContent = name;
  
  const createdDate = new Date(created);
  modalDashboardCreated.textContent = createdDate.toLocaleDateString() + ' ' + 
                                     createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  modalDashboardWidgets.textContent = widgets.length;
  modalDashboardDescription.textContent = description || 'No description';
  
  // Show modal
  dashboardDetailsModal.classList.remove('hidden');
}

closeModalButton.addEventListener('click', () => {
  dashboardDetailsModal.classList.add('hidden');
});

// Close modal when clicking outside
dashboardDetailsModal.addEventListener('click', (event) => {
  if (event.target === dashboardDetailsModal) {
    dashboardDetailsModal.classList.add('hidden');
  }
});

// Open dashboard
openDashboardButton.addEventListener('click', async () => {
  console.log('Open Dashboard button clicked', { currentDashboardId, currentDashboardName });
  
  try {
    // In a real implementation, this would open the dashboard
    alert(`Opening dashboard: ${currentDashboardName}`);
    
    // Close modal
    dashboardDetailsModal.classList.add('hidden');
  } catch (error) {
    console.error('Error opening dashboard:', error);
    alert(`Error opening dashboard: ${error.message}`);
  }
});

// Edit dashboard
editDashboardButton.addEventListener('click', () => {
  // In a real implementation, this would open a dashboard edit window
  alert(`Editing dashboard: ${currentDashboardName}`);
  
  // Close modal
  dashboardDetailsModal.classList.add('hidden');
});

// Delete dashboard
deleteDashboardButton.addEventListener('click', async () => {
  if (confirm(`Are you sure you want to delete "${currentDashboardName}"? This action cannot be undone.`)) {
    try {
      // In a real implementation, this would delete the dashboard
      alert(`Dashboard "${currentDashboardName}" deleted successfully!`);
      
      // Close modal
      dashboardDetailsModal.classList.add('hidden');
      
      // Refresh dashboard list
      loadDashboards();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
});

// Initialize the dashboard list
initializeDashboardList();

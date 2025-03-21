/**
 * Dashboard Manager Module
 * Responsible for dashboard creation, management, and persistence
 */

import { BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import store from '../store.js';
import * as windowManager from './windowManager/windowManager.js';
import { ipcHandler } from './ipc/windowHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dashboard windows
const dashboardWindows = new Map();

/**
 * List all dashboards
 * @returns {Promise<Array>} - Array of dashboard objects
 */
export async function listDashboards() {
  try {
    // Get dashboards from store
    const dashboards = store.get('dashboards') || [];
    return dashboards;
  } catch (error) {
    console.error('Error listing dashboards:', error);
    throw error;
  }
}

/**
 * Create a new dashboard
 * @param {Object} params - Dashboard parameters
 * @param {string} params.name - Dashboard name
 * @param {string} params.description - Dashboard description
 * @returns {Promise<Object>} - Created dashboard object
 */
export async function createDashboard({ name, description = '', isTemporary = false }) {
  try {
    // Generate a unique ID for the dashboard
    const dashboardId = uuidv4();
    
    // Create dashboard object
    const dashboard = {
      id: dashboardId,
      name,
      description,
      created: new Date().toISOString(),
      isTemporary,
      widgets: [],
      layout: {
        columns: 12,
        rows: 8
      }
    };
    
    // Get existing dashboards
    const dashboards = store.get('dashboards') || [];
    
    // Add new dashboard
    dashboards.push(dashboard);
    
    // Save dashboards to store
    store.set('dashboards', dashboards);
    
    return dashboard;
  } catch (error) {
    console.error('Error creating dashboard:', error);
    throw error;
  }
}

/**
 * Create a temporary dashboard for a widget
 * @param {Object} widget - Widget object
 * @returns {Promise<Object>} - Created dashboard object
 */
export async function createTemporaryDashboard(widget) {
  try {
    // Create a temporary dashboard
    const dashboard = await createDashboard({
      name: `Temp - ${widget.name}`,
      description: `Temporary dashboard for ${widget.name}`,
      isTemporary: true
    });
    
    // Add the widget to the dashboard
    await addWidgetToDashboard(dashboard.id, widget);
    
    return dashboard;
  } catch (error) {
    console.error('Error creating temporary dashboard:', error);
    throw error;
  }
}

/**
 * Get a dashboard by ID
 * @param {string} dashboardId - Dashboard ID
 * @returns {Promise<Object>} - Dashboard object
 */
export async function getDashboard(dashboardId) {
  try {
    // Get dashboards from store
    const dashboards = store.get('dashboards') || [];
    
    // Find dashboard by ID
    const dashboard = dashboards.find(d => d.id === dashboardId);
    
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }
    
    return dashboard;
  } catch (error) {
    console.error('Error getting dashboard:', error);
    throw error;
  }
}

/**
 * Update a dashboard
 * @param {string} dashboardId - Dashboard ID
 * @param {Object} updates - Dashboard updates
 * @returns {Promise<Object>} - Updated dashboard object
 */
export async function updateDashboard(dashboardId, updates) {
  try {
    // Get dashboards from store
    const dashboards = store.get('dashboards') || [];
    
    // Find dashboard index
    const dashboardIndex = dashboards.findIndex(d => d.id === dashboardId);
    
    if (dashboardIndex === -1) {
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }
    
    // Update dashboard
    dashboards[dashboardIndex] = {
      ...dashboards[dashboardIndex],
      ...updates,
      // Don't allow updating these fields
      id: dashboardId,
      created: dashboards[dashboardIndex].created
    };
    
    // Save dashboards to store
    store.set('dashboards', dashboards);
    
    return dashboards[dashboardIndex];
  } catch (error) {
    console.error('Error updating dashboard:', error);
    throw error;
  }
}

/**
 * Delete a dashboard
 * @param {string} dashboardId - Dashboard ID
 * @returns {Promise<boolean>} - True if dashboard was deleted
 */
export async function deleteDashboard(dashboardId) {
  try {
    // Get dashboards from store
    const dashboards = store.get('dashboards') || [];
    
    // Filter out the dashboard to delete
    const updatedDashboards = dashboards.filter(d => d.id !== dashboardId);
    
    // Check if dashboard was found
    if (updatedDashboards.length === dashboards.length) {
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }
    
    // Save updated dashboards to store
    store.set('dashboards', updatedDashboards);
    
    // Close dashboard window if open
    closeDashboard(dashboardId);
    
    return true;
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    throw error;
  }
}

/**
 * Add a widget to a dashboard
 * @param {string} dashboardId - Dashboard ID
 * @param {Object} widget - Widget object
 * @param {string} widget.id - Widget ID
 * @param {string} widget.name - Widget name
 * @param {string} widget.filePath - Widget file path
 * @param {Object} position - Widget position
 * @param {number} position.x - X position
 * @param {number} position.y - Y position
 * @returns {Promise<Object>} - Updated dashboard object
 */
export async function addWidgetToDashboard(dashboardId, widget, position = { x: 0, y: 0 }) {
  try {
    // Get dashboard
    const dashboard = await getDashboard(dashboardId);
    
    // Check if widget already exists
    const existingWidgetIndex = dashboard.widgets.findIndex(w => w.id === widget.id);
    
    if (existingWidgetIndex !== -1) {
      // Update existing widget
      dashboard.widgets[existingWidgetIndex] = {
        ...dashboard.widgets[existingWidgetIndex],
        ...widget,
        position
      };
    } else {
      // Add new widget
      dashboard.widgets.push({
        ...widget,
        position,
        size: { width: 1, height: 1 } // Default size
      });
    }
    
    // Update dashboard
    return await updateDashboard(dashboardId, { widgets: dashboard.widgets });
  } catch (error) {
    console.error('Error adding widget to dashboard:', error);
    throw error;
  }
}

/**
 * Remove a widget from a dashboard
 * @param {string} dashboardId - Dashboard ID
 * @param {string} widgetId - Widget ID
 * @returns {Promise<Object>} - Updated dashboard object
 */
export async function removeWidgetFromDashboard(dashboardId, widgetId) {
  try {
    // Get dashboard
    const dashboard = await getDashboard(dashboardId);
    
    // Filter out the widget to remove
    const updatedWidgets = dashboard.widgets.filter(w => w.id !== widgetId);
    
    // Check if widget was found
    if (updatedWidgets.length === dashboard.widgets.length) {
      throw new Error(`Widget not found in dashboard: ${widgetId}`);
    }
    
    // Update dashboard
    return await updateDashboard(dashboardId, { widgets: updatedWidgets });
  } catch (error) {
    console.error('Error removing widget from dashboard:', error);
    throw error;
  }
}

/**
 * Open a dashboard
 * @param {string} dashboardId - Dashboard ID
 * @returns {Promise<Object>} - Result object with success flag
 */
export async function openDashboard(dashboardId) {
  try {
    // Get dashboard
    const dashboard = await getDashboard(dashboardId);
    
    // Check if dashboard window is already open
    if (dashboardWindows.has(dashboardId)) {
      const win = dashboardWindows.get(dashboardId);
      
      if (!win.isDestroyed()) {
        win.show();
        win.focus();
        return { success: true };
      }
      
      // Window was destroyed, remove from map
      dashboardWindows.delete(dashboardId);
    }
    
    // Create dashboard window
    const win = windowManager.createWindow(windowManager.WindowType.DASHBOARD, {
      title: dashboard.name,
      width: 1200,
      height: 800
    });
    
    // Store window reference
    dashboardWindows.set(dashboardId, win);
    
    // Set window parameters
    win.webContents.once('did-finish-load', () => {
      win.webContents.send('dashboard-data', { dashboard });
    });
    
    // Load dashboard HTML
    const dashboardHtml = generateDashboardHtml(dashboard);
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(dashboardHtml)}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error opening dashboard:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Close a dashboard
 * @param {string} dashboardId - Dashboard ID
 * @returns {boolean} - True if dashboard was closed
 */
export function closeDashboard(dashboardId) {
  // Check if dashboard window is open
  if (dashboardWindows.has(dashboardId)) {
    const win = dashboardWindows.get(dashboardId);
    
    if (!win.isDestroyed()) {
      win.close();
    }
    
    // Remove from map
    dashboardWindows.delete(dashboardId);
    return true;
  }
  
  return false;
}

/**
 * Generate dashboard HTML
 * @param {Object} dashboard - Dashboard object
 * @returns {string} - Dashboard HTML
 */
function generateDashboardHtml(dashboard) {
  const temporaryBanner = dashboard.isTemporary ? `
    <div class="temporary-banner">
      <span>Temporary Dashboard</span>
      <button id="save-dashboard-button">Save Dashboard</button>
      <button id="add-widget-button">Add Widget</button>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${dashboard.name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        
        .temporary-banner {
          background-color: #fff3cd;
          color: #856404;
          padding: 8px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #ffeeba;
        }
        
        .temporary-banner button {
          margin-left: 10px;
          padding: 5px 10px;
          background-color: #4285f4;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .temporary-banner button:hover {
          background-color: #3367d6;
        }
        
        .dashboard-header {
          background-color: #ffffff;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .dashboard-title {
          margin: 0;
          font-size: 1.5em;
        }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(${dashboard.layout.columns}, 1fr);
          grid-auto-rows: minmax(100px, auto);
          gap: 16px;
          padding: 16px;
        }
        
        .dashboard-widget {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 16px;
        }
        
        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .widget-title {
          margin: 0;
          font-size: 1.2em;
        }
        
        .widget-content {
          height: 100%;
        }
      </style>
    </head>
    <body>
      ${temporaryBanner}
      <div class="dashboard-header">
        <h1 class="dashboard-title">${dashboard.name}</h1>
        <div class="dashboard-actions">
          <button id="edit-dashboard-button">Edit Dashboard</button>
          ${!dashboard.isTemporary ? '<button id="add-widget-button">Add Widget</button>' : ''}
        </div>
      </div>
      
      <div class="dashboard-grid">
        ${dashboard.widgets.map(widget => `
          <div class="dashboard-widget" style="grid-column: ${widget.position.x + 1} / span ${widget.size.width}; grid-row: ${widget.position.y + 1} / span ${widget.size.height};">
            <div class="widget-header">
              <h2 class="widget-title">${widget.name}</h2>
              <div class="widget-actions">
                <button class="remove-widget-button" data-widget-id="${widget.id}">Remove</button>
              </div>
            </div>
            <div class="widget-content">
              <!-- Widget content will be loaded here -->
              <p>Widget content placeholder</p>
            </div>
          </div>
        `).join('')}
      </div>
      
      <script>
        // Dashboard functionality will be implemented here
        document.getElementById('edit-dashboard-button').addEventListener('click', () => {
          alert('Edit dashboard functionality will be implemented soon!');
        });
        
        // Add widget button
        document.querySelectorAll('#add-widget-button').forEach(button => {
          button.addEventListener('click', () => {
            alert('Add widget functionality will be implemented soon!');
          });
        });
        
        // Save dashboard button for temporary dashboards
        if (document.getElementById('save-dashboard-button')) {
          document.getElementById('save-dashboard-button').addEventListener('click', () => {
            alert('This temporary dashboard will be saved as a permanent dashboard.');
            // TODO: Implement save functionality
          });
        }
        
        // Remove widget buttons
        document.querySelectorAll('.remove-widget-button').forEach(button => {
          button.addEventListener('click', (event) => {
            const widgetId = event.target.dataset.widgetId;
            alert('Remove widget functionality will be implemented soon!');
          });
        });
      </script>
    </body>
    </html>
  `;
}

/**
 * Register dashboard-related IPC handlers
 */
export function registerHandlers() {
  // List dashboards
  ipcHandler.register('list-dashboards', async () => {
    try {
      const dashboards = await listDashboards();
      return { dashboards };
    } catch (error) {
      console.error('Error in list-dashboards handler:', error);
      throw error;
    }
  });
  
  // Create dashboard
  ipcHandler.register('create-dashboard', async (event, params) => {
    try {
      const dashboard = await createDashboard(params);
      return { success: true, dashboard };
    } catch (error) {
      console.error('Error in create-dashboard handler:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Get dashboard
  ipcHandler.register('get-dashboard', async (event, { dashboardId }) => {
    try {
      const dashboard = await getDashboard(dashboardId);
      return { success: true, dashboard };
    } catch (error) {
      console.error('Error in get-dashboard handler:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Update dashboard
  ipcHandler.register('update-dashboard', async (event, { dashboardId, updates }) => {
    try {
      const dashboard = await updateDashboard(dashboardId, updates);
      return { success: true, dashboard };
    } catch (error) {
      console.error('Error in update-dashboard handler:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Delete dashboard
  ipcHandler.register('delete-dashboard', async (event, { dashboardId }) => {
    try {
      await deleteDashboard(dashboardId);
      return { success: true };
    } catch (error) {
      console.error('Error in delete-dashboard handler:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Add widget to dashboard
  ipcHandler.register('add-widget-to-dashboard', async (event, { dashboardId, widget, position }) => {
    try {
      const dashboard = await addWidgetToDashboard(dashboardId, widget, position);
      return { success: true, dashboard };
    } catch (error) {
      console.error('Error in add-widget-to-dashboard handler:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Remove widget from dashboard
  ipcHandler.register('remove-widget-from-dashboard', async (event, { dashboardId, widgetId }) => {
    try {
      const dashboard = await removeWidgetFromDashboard(dashboardId, widgetId);
      return { success: true, dashboard };
    } catch (error) {
      console.error('Error in remove-widget-from-dashboard handler:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Open dashboard
  ipcHandler.register('open-dashboard', async (event, { dashboardId }) => {
    try {
      return await openDashboard(dashboardId);
    } catch (error) {
      console.error('Error in open-dashboard handler:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Create temporary dashboard for widget
  ipcHandler.register('create-temporary-dashboard', async (event, { widget }) => {
    try {
      const dashboard = await createTemporaryDashboard(widget);
      const result = await openDashboard(dashboard.id);
      return { ...result, dashboard };
    } catch (error) {
      console.error('Error in create-temporary-dashboard handler:', error);
      return { success: false, error: error.message };
    }
  });
  
  console.log('Dashboard handlers registered');
}

/**
 * Main Renderer using Web Components
 * This file replaces the traditional DOM manipulation in renderers/main.js
 * with a component-based approach.
 */

// Import all components
import '../components/index.js';
import { showError } from '../components/core/utils.js';

/**
 * App Controller
 * Manages the application state and handles events
 */
class AppController {
  constructor() {
    // Initialize components
    this.appManagementSection = document.querySelector('app-management-section');
    this.appDetailsModal = document.querySelector('app-details-modal');
    
    if (!this.appManagementSection || !this.appDetailsModal) {
      console.error('Required components not found in the DOM');
      return;
    }
    
    // Set up event listeners
    this.appManagementSection.addEventListener('create-app', () => {
      window.electronAPI.openWindow('app-creation');
    });
    
    this.appManagementSection.addEventListener('open-api-settings', () => {
      window.electronAPI.openWindow('api-setup');
    });
    
    this.appManagementSection.addEventListener('refresh-apps', () => {
      this.loadMiniApps();
    });
    
    this.appManagementSection.addEventListener('open-app-directory', async () => {
      try {
        await window.electronAPI.openAppDirectory();
      } catch (error) {
        console.error('Error opening app directory:', error);
        showError('Error', `Failed to open app directory: ${error.message}`);
      }
    });
    
    // Listen for app selection
    document.addEventListener('app-selected', (event) => {
      this.appDetailsModal.setApp(event.detail);
      this.appDetailsModal.open();
    });
    
    // Listen for app deletion
    this.appDetailsModal.addEventListener('app-deleted', () => {
      this.loadMiniApps();
    });
    
    // Listen for app updates from other windows
    window.electronAPI.onAppUpdated(() => {
      this.loadMiniApps();
    });
    
    // Initialize the app
    this.initializeApp();
  }
  
  /**
   * Initialize the application
   */
  async initializeApp() {
    try {
      // Check if API key is set
      const { hasApiKey } = await window.electronAPI.checkApiKey();
      
      if (!hasApiKey) {
        // Open API setup window if API key is not set
        window.electronAPI.openWindow('api-setup');
      }
      
      // Load existing apps
      await this.loadMiniApps();
    } catch (error) {
      console.error('Error initializing app:', error);
      showError('Error', `Failed to initialize app: ${error.message}`);
    }
  }
  
  /**
   * Load mini apps from the backend
   */
  async loadMiniApps() {
    try {
      console.log('Loading mini apps...');
      const { apps } = await window.electronAPI.listMiniApps();
      console.log('Loaded apps:', apps);
      
      // Update the app management section with the loaded apps
      this.appManagementSection.setApps(apps);
    } catch (error) {
      console.error('Error loading mini apps:', error);
      showError('Error', `Failed to load mini apps: ${error.message}`);
    }
  }
}

/**
 * Initialize the application when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  // Create error container if it doesn't exist
  if (!document.querySelector('error-container')) {
    const errorContainer = document.createElement('error-container');
    document.body.appendChild(errorContainer);
  }
  
  // Initialize the app controller
  new AppController();
});

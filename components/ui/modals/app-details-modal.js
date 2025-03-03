import { BaseComponent } from '../../core/base-component.js';
import { formatDate, showError } from '../../core/utils.js';

/**
 * AppDetailsModal component
 * Displays details about a selected app and provides actions
 */
export class AppDetailsModal extends BaseComponent {
  constructor() {
    super();
    
    const styles = `
      :host {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        justify-content: center;
        align-items: center;
      }
      
      :host(.visible) {
        display: flex;
      }
      
      .modal-content {
        background: white;
        border-radius: var(--border-radius, 8px);
        padding: 20px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }
      
      .modal-title {
        font-size: 24px;
        font-weight: bold;
        margin: 0;
        color: var(--primary-color, #4285f4);
      }
      
      .close-button {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #5f6368;
        padding: 0;
        line-height: 1;
      }
      
      .modal-body {
        margin-bottom: 20px;
      }
      
      .app-details {
        margin-bottom: 20px;
      }
      
      .app-details p {
        margin: 5px 0;
        color: var(--text-color, #5f6368);
      }
      
      .modal-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      
      button {
        padding: 10px;
        border: none;
        border-radius: var(--border-radius, 8px);
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background-color 0.2s;
      }
      
      .primary-button {
        background-color: var(--primary-color, #4285f4);
        color: white;
      }
      
      .primary-button:hover {
        background-color: #3367d6;
      }
      
      .secondary-button {
        background-color: #f1f3f4;
        color: #5f6368;
      }
      
      .secondary-button:hover {
        background-color: #e8eaed;
      }
      
      .danger-button {
        background-color: #f44336;
        color: white;
      }
      
      .danger-button:hover {
        background-color: #d32f2f;
      }
    `;
    
    const html = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title" id="app-name"></h2>
          <button class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div class="app-details">
            <p id="app-created"></p>
            <p id="app-versions"></p>
          </div>
          <div class="modal-actions">
            <button id="open-app-button" class="primary-button">Open App</button>
            <button id="update-app-button" class="secondary-button">Update App</button>
            <button id="export-app-button" class="secondary-button">Export App</button>
            <button id="delete-app-button" class="danger-button">Delete App</button>
          </div>
        </div>
      </div>
    `;
    
    this.render(html, styles);
    
    // Store references to DOM elements
    this._appNameElement = this.shadowRoot.getElementById('app-name');
    this._appCreatedElement = this.shadowRoot.getElementById('app-created');
    this._appVersionsElement = this.shadowRoot.getElementById('app-versions');
    
    // Set up event listeners
    this.shadowRoot.querySelector('.close-button').addEventListener('click', () => this.close());
    this.addEventListener('click', (event) => {
      if (event.target === this) this.close();
    });
    
    this.shadowRoot.getElementById('open-app-button').addEventListener('click', this._handleOpenApp.bind(this));
    this.shadowRoot.getElementById('update-app-button').addEventListener('click', this._handleUpdateApp.bind(this));
    this.shadowRoot.getElementById('export-app-button').addEventListener('click', this._handleExportApp.bind(this));
    this.shadowRoot.getElementById('delete-app-button').addEventListener('click', this._handleDeleteApp.bind(this));
    
    // Initialize state
    this._currentApp = null;
  }
  
  /**
   * Set the app to display in the modal
   * @param {Object} app - App data object
   */
  setApp(app) {
    this._currentApp = app;
    
    this._appNameElement.textContent = app.name;
    this._appCreatedElement.textContent = `Created: ${formatDate(app.created)}`;
    this._appVersionsElement.textContent = `Versions: ${app.versions}`;
  }
  
  /**
   * Open the modal
   */
  open() {
    this.classList.add('visible');
    this.emit('modal-opened');
  }
  
  /**
   * Close the modal
   */
  close() {
    this.classList.remove('visible');
    this.emit('modal-closed');
  }
  
  /**
   * Handle open app button click
   * @private
   */
  async _handleOpenApp() {
    if (!this._currentApp) return;
    
    try {
      const result = await window.electronAPI.openMiniApp({
        appId: this._currentApp.id,
        filePath: this._currentApp.filePath,
        name: this._currentApp.name
      });
      
      // Close modal
      this.close();
    } catch (error) {
      console.error('Error opening mini app:', error);
      showError('Error', `Failed to open mini app: ${error.message}`);
    }
  }
  
  /**
   * Handle update app button click
   * @private
   */
  _handleUpdateApp() {
    if (!this._currentApp) return;
    
    // Open app creation window in update mode
    window.electronAPI.openWindow('app-creation', {
      updateMode: true,
      appId: this._currentApp.id,
      appName: this._currentApp.name
    });
    
    // Close modal
    this.close();
  }
  
  /**
   * Handle export app button click
   * @private
   */
  async _handleExportApp() {
    if (!this._currentApp) return;
    
    try {
      const result = await window.electronAPI.exportMiniApp({
        appId: this._currentApp.id,
        filePath: this._currentApp.filePath
      });
      
      if (result.success) {
        alert(`Mini app exported successfully to ${result.filePath}`);
        
        // Close modal
        this.close();
      } else if (!result.canceled) {
        showError('Error', `Failed to export mini app: ${result.error}`);
      }
    } catch (error) {
      showError('Error', error.message);
    }
  }
  
  /**
   * Handle delete app button click
   * @private
   */
  async _handleDeleteApp() {
    if (!this._currentApp) return;
    
    if (confirm(`Are you sure you want to delete "${this._currentApp.name}"? This action cannot be undone.`)) {
      try {
        const result = await window.electronAPI.deleteMiniApp({
          appId: this._currentApp.id
        });
        
        if (result.success) {
          // Close modal
          this.close();
          
          // Emit app deleted event
          this.emit('app-deleted');
        } else {
          showError('Error', `Failed to delete mini app: ${result.error}`);
        }
      } catch (error) {
        showError('Error', error.message);
      }
    }
  }
}

// Register the custom element
customElements.define('app-details-modal', AppDetailsModal);

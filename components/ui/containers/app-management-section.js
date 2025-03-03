import { BaseComponent } from '../../core/base-component.js';
import './app-list.js';

/**
 * AppManagementSection component
 * Contains the app management controls and app list
 */
export class AppManagementSection extends BaseComponent {
  constructor() {
    super();
    
    const styles = `
      :host {
        display: block;
        padding: 20px;
      }
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      
      .section-title {
        font-size: 24px;
        font-weight: bold;
        margin: 0;
        color: var(--primary-color, #4285f4);
      }
      
      .controls {
        display: flex;
        gap: 10px;
      }
      
      button {
        padding: 8px 16px;
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
      
      .create-first-app {
        text-align: center;
        margin: 40px 0;
      }
      
      .create-first-app p {
        margin-bottom: 20px;
        color: var(--text-color, #5f6368);
        font-size: 16px;
      }
      
      .create-first-app button {
        padding: 12px 24px;
        font-size: 16px;
      }
      
      .hidden {
        display: none;
      }
    `;
    
    const html = `
      <div class="section-header">
        <h2 class="section-title">My Mini Apps</h2>
        <div class="controls">
          <button id="create-app-button" class="primary-button">Create App</button>
          <button id="api-settings-button" class="secondary-button">API Settings</button>
          <button id="refresh-apps-button" class="secondary-button">Refresh</button>
          <button id="open-app-directory-button" class="secondary-button">Open Directory</button>
        </div>
      </div>
      
      <div id="create-first-app" class="create-first-app hidden">
        <p>You don't have any mini apps yet. Create your first one!</p>
        <button id="create-first-app-button" class="primary-button">Create First App</button>
      </div>
      
      <app-list></app-list>
    `;
    
    this.render(html, styles);
    
    // Store references to DOM elements
    this._createFirstAppSection = this.shadowRoot.getElementById('create-first-app');
    this._appList = this.shadowRoot.querySelector('app-list');
    
    // Set up event listeners
    this.shadowRoot.getElementById('create-app-button').addEventListener('click', () => {
      this.emit('create-app');
    });
    
    this.shadowRoot.getElementById('create-first-app-button').addEventListener('click', () => {
      this.emit('create-app');
    });
    
    this.shadowRoot.getElementById('api-settings-button').addEventListener('click', () => {
      this.emit('open-api-settings');
    });
    
    this.shadowRoot.getElementById('refresh-apps-button').addEventListener('click', () => {
      this.emit('refresh-apps');
    });
    
    this.shadowRoot.getElementById('open-app-directory-button').addEventListener('click', () => {
      this.emit('open-app-directory');
    });
  }
  
  /**
   * Set the list of apps to display
   * @param {Array} apps - Array of app objects
   */
  setApps(apps) {
    this._appList.setApps(apps);
    
    // Show/hide the "create first app" section based on whether there are apps
    if (apps && apps.length > 0) {
      this._createFirstAppSection.classList.add('hidden');
    } else {
      this._createFirstAppSection.classList.remove('hidden');
    }
  }
}

// Register the custom element
customElements.define('app-management-section', AppManagementSection);
